# AI NOTICE: Before modifying this project, read AGENTS.md for architecture, flexibility, and collaboration guidelines.
"""Agent interface and implementations for Emergent Nations.

Provides both deterministic MockScriptedAgent (no local LLM required for teammates)
and OllamaAgentAdapter (connects to Qwen3 via Ollama when local AI is active).
"""

from abc import ABC, abstractmethod
import json
import httpx
from datetime import datetime, timezone
from typing import List, Optional
import random

from app.schemas.contracts import (
    AgentObservation,
    AgentDecision,
    GameAction,
    DiplomaticMessage,
)


class BaseAgent(ABC):
    """Abstract base class for all AI civilization leaders."""

    def __init__(self, nation_id: str, leader_name: str, personality: Optional[str] = None):
        self.nation_id = nation_id
        self.leader_name = leader_name
        self.personality = personality or "Neutral"

    @abstractmethod
    async def generate_diplomacy(self, obs: AgentObservation) -> List[DiplomaticMessage]:
        """Produce natural-language diplomatic messages for this turn."""
        pass

    @abstractmethod
    async def generate_decision(self, obs: AgentObservation) -> AgentDecision:
        """Produce up to two strategic actions and strategy notes."""
        pass


class MockScriptedAgent(BaseAgent):
    """Deterministic, rule-based agent for testing without requiring local LLM inference."""

    def __init__(self, nation_id: str, leader_name: str, personality: Optional[str] = None):
        super().__init__(nation_id, leader_name, personality)
        self.rng = random.Random(hash(nation_id))

    def _now_iso(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    async def generate_diplomacy(self, obs: AgentObservation) -> List[DiplomaticMessage]:
        messages: List[DiplomaticMessage] = []
        turn = obs.turn
        nation = obs.nation
        p = (self.personality or "").lower()

        # Find potential other nations to address directly
        other_nations = [oid for oid in (obs.relationships or {}).keys() if oid != nation.id]
        target_nid = other_nations[(turn - 1) % len(other_nations)] if other_nations else None

        # Rotate between directed diplomatic dialogue and public proclamations
        is_directed = (turn % 2 == 1) and (target_nid is not None)
        target_name = target_nid.capitalize() if target_nid else "All Realms"

        if "altruist" in p:
            if is_directed:
                content = f"{nation.name} extends a hand of fellowship to {target_name}. Let our peoples trade grain and maintain peace."
            else:
                content = f"Prosperity blooms through cooperation. {nation.name} offers mutual support to all who seek peace."
        elif "opportunist" in p or "expansionist" in p:
            if is_directed:
                content = f"{nation.name} proposes a commercial treaty with {target_name}. Our gold for your goods—let us both prosper."
            else:
                content = f"{nation.name} is rapidly expanding its commercial routes. Trade with us or be left behind."
        elif "skeptic" in p:
            if is_directed:
                content = f"{nation.name} cautions {target_name}: maintain your garrisons on your side of the river and peace will endure."
            else:
                content = f"{nation.name} monitors all borders with vigilance. Treaties must be proven by transparent deeds."
        elif "aggressive" in p:
            if is_directed:
                content = f"Hear this, {target_name}: yield disputed borderlands to {nation.name} or prepare for battle."
            else:
                content = f"The legions of {nation.name} are prepared for war. Weakness will not be spared."
        else:
            if is_directed:
                content = f"{nation.name} sends greeting to {target_name} and seeks peaceful boundary agreements."
            else:
                content = f"{nation.name} stands ready for balanced diplomacy and mutual security."

        if content:
            messages.append(
                DiplomaticMessage(
                    message_id=f"msg_{nation.id}_{turn}_{1 if is_directed else 'pub'}",
                    turn=turn,
                    sender_id=nation.id,
                    recipient_id=target_nid if is_directed else None,
                    is_private=False,
                    content=content,
                    timestamp=self._now_iso(),
                )
            )

        return messages

    async def generate_decision(self, obs: AgentObservation) -> AgentDecision:
        nation = obs.nation
        turn = obs.turn
        actions: List[GameAction] = []
        p = (self.personality or "").lower()

        # Map owned territories and adjacent territories
        owned_tids = set(nation.territory_ids)
        known_map = {t.id: t for t in obs.known_territories}
        adjacent_neutral_tids = set()
        adjacent_enemy_tids = {}

        for tid in owned_tids:
            terr = known_map.get(tid)
            if terr:
                for adj_id in terr.adjacent_territory_ids:
                    adj_t = known_map.get(adj_id)
                    if adj_t:
                        if adj_t.owner_id is None:
                            adjacent_neutral_tids.add(adj_id)
                        elif adj_t.owner_id != nation.id:
                            adjacent_enemy_tids[adj_id] = (tid, adj_t.owner_id, adj_t.stationed_military)

        # Primary Action: Expansion, Military Recruitment, or Development
        if "opportunist" in p or "expansionist" in p:
            if adjacent_neutral_tids and nation.gold >= 20 and nation.food >= 10:
                target_tid = sorted(list(adjacent_neutral_tids))[0]
                actions.append(
                    GameAction(
                        action_id=f"act_{nation.id}_{turn}_claim",
                        nation_id=nation.id,
                        action_type="claim",
                        target_territory_id=target_tid,
                        reasoning_note=f"Expand rapidly into neutral {target_tid} to grow resource base.",
                    )
                )
            elif nation.gold >= 20 and nation.food >= 10 and owned_tids:
                garrison_tid = sorted(list(owned_tids))[0]
                actions.append(
                    GameAction(
                        action_id=f"act_{nation.id}_{turn}_rec",
                        nation_id=nation.id,
                        action_type="recruit",
                        target_territory_id=garrison_tid,
                        units_count=5,
                        reasoning_note="Bolster military strength for territorial defense.",
                    )
                )
        elif "altruist" in p:
            if nation.gold >= 30 and owned_tids:
                dev_tid = sorted(list(owned_tids))[0]
                actions.append(
                    GameAction(
                        action_id=f"act_{nation.id}_{turn}_dev",
                        nation_id=nation.id,
                        action_type="develop",
                        target_territory_id=dev_tid,
                        develop_target="food",
                        reasoning_note="Increase agricultural sustainability to prevent starvation.",
                    )
                )
            elif adjacent_neutral_tids and nation.gold >= 20 and nation.food >= 10:
                target_tid = sorted(list(adjacent_neutral_tids))[0]
                actions.append(
                    GameAction(
                        action_id=f"act_{nation.id}_{turn}_claim",
                        nation_id=nation.id,
                        action_type="claim",
                        target_territory_id=target_tid,
                        reasoning_note="Settle adjacent land peacefully.",
                    )
                )
        else: # Skeptic / Default
            if nation.gold >= 20 and nation.food >= 10 and owned_tids:
                target_tid = sorted(list(owned_tids))[0]
                actions.append(
                    GameAction(
                        action_id=f"act_{nation.id}_{turn}_rec",
                        nation_id=nation.id,
                        action_type="recruit",
                        target_territory_id=target_tid,
                        units_count=5,
                        reasoning_note="Strengthen border garrisons against potential incursions.",
                    )
                )
            elif nation.gold >= 30 and owned_tids:
                target_tid = sorted(list(owned_tids))[0]
                actions.append(
                    GameAction(
                        action_id=f"act_{nation.id}_{turn}_dev",
                        nation_id=nation.id,
                        action_type="develop",
                        target_territory_id=target_tid,
                        develop_target="gold",
                        reasoning_note="Accumulate treasury for emergency reserves.",
                    )
                )

        # Secondary Action: Army Movement or Frontier Combat Attack!
        if len(owned_tids) >= 2:
            # Find an interior territory with spare soldiers (> 1 unit)
            for origin_id in owned_tids:
                origin_t = known_map.get(origin_id)
                if origin_t and origin_t.stationed_military > 1:
                    # Find an adjacent owned territory that borders neutral or enemy land
                    for dest_id in origin_t.adjacent_territory_ids:
                        if dest_id in owned_tids and dest_id != origin_id:
                            dest_t = known_map.get(dest_id)
                            # Check if dest is closer to the frontier
                            has_frontier = any(
                                adj not in owned_tids for adj in (dest_t.adjacent_territory_ids if dest_t else [])
                            )
                            if has_frontier:
                                move_units = max(1, origin_t.stationed_military - 1)
                                actions.append(
                                    GameAction(
                                        action_id=f"act_{nation.id}_{turn}_mov",
                                        nation_id=nation.id,
                                        action_type="move",
                                        origin_territory_id=origin_id,
                                        target_territory_id=dest_id,
                                        units_count=move_units,
                                        reasoning_note=f"March {move_units} soldiers to reinforce frontier at {dest_id}.",
                                    )
                                )
                                break
                    if len(actions) >= 2:
                        break

        # Check for attack if we have a strong frontline garrison
        if len(actions) < 2 and adjacent_enemy_tids:
            for enemy_tid, (my_origin_tid, enemy_owner, enemy_defenders) in adjacent_enemy_tids.items():
                my_terr = known_map.get(my_origin_tid)
                if my_terr and my_terr.stationed_military >= 5 and my_terr.stationed_military > enemy_defenders:
                    atk_units = my_terr.stationed_military - 1
                    actions.append(
                        GameAction(
                            action_id=f"act_{nation.id}_{turn}_atk",
                            nation_id=nation.id,
                            action_type="attack",
                            origin_territory_id=my_origin_tid,
                            target_territory_id=enemy_tid,
                            units_count=atk_units,
                            reasoning_note=f"Assault enemy position at {enemy_tid} held by {enemy_owner}.",
                        )
                    )
                    break

        # Fallback if no action chosen
        if not actions:
            actions.append(
                GameAction(
                    action_id=f"act_{nation.id}_{turn}_pass",
                    nation_id=nation.id,
                    action_type="pass",
                    reasoning_note="Conserve resources this turn.",
                )
            )

        strategy_note = f"Leader {self.leader_name} pursuing {self.personality} doctrine on turn {turn}."

        return AgentDecision(
            nation_id=nation.id,
            turn=turn,
            actions=actions[:2],
            outgoing_messages=[],
            strategy_note=strategy_note,
        )


class OllamaAgentAdapter(BaseAgent):
    """Adapter connecting to local Ollama server (Qwen 2.5 / Qwen 3).

    Sends structured prompts with format="json", enforces valid action schemas,
    and includes graceful fallback to MockScriptedAgent if the Ollama endpoint is offline.
    Combines diplomacy and strategic planning in a unified prompt with a strict brevity
    and token limit for lightning-fast execution on Apple Silicon.
    """

    def __init__(
        self,
        nation_id: str,
        leader_name: str,
        personality: Optional[str] = None,
        ollama_url: str = "http://localhost:11434",
        model_name: str = "qwen2.5:7b",
    ):
        super().__init__(nation_id, leader_name, personality)
        self.ollama_url = ollama_url
        self.model_name = model_name
        self.fallback = MockScriptedAgent(nation_id, leader_name, personality)
        self._cached_decision: Optional[AgentDecision] = None
        self._cached_decision_turn: Optional[int] = None

    def _now_iso(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    def _get_personality_guidance(self) -> str:
        try:
            from app.agents.personalities import create_personality_prompt
            return create_personality_prompt(self.personality)
        except Exception:
            return f"You are {self.leader_name}, ruler of your nation. Your personality archetype is: {self.personality}."

    async def generate_diplomacy(self, obs: AgentObservation) -> List[DiplomaticMessage]:
        try:
            nation = obs.nation
            personality_guide = self._get_personality_guidance()

            owned_tids = set(nation.territory_ids)
            known_map = {t.id: t for t in obs.known_territories}

            adjacent_neutral = []
            adjacent_enemy = []
            for tid in owned_tids:
                terr = known_map.get(tid)
                if terr:
                    for adj_id in terr.adjacent_territory_ids:
                        adj_terr = known_map.get(adj_id)
                        if adj_terr:
                            if adj_terr.owner_id is None and adj_id not in adjacent_neutral:
                                adjacent_neutral.append(adj_id)
                            elif adj_terr.owner_id and adj_terr.owner_id != nation.id and adj_id not in adjacent_enemy:
                                adjacent_enemy.append(f"{adj_id} (held by {adj_terr.owner_id})")

            rival_ids = [oid for oid in (obs.relationships or {}).keys() if oid != nation.id]

            prompt = f"""{personality_guide}

TURN {obs.turn} FOR {nation.name} ({self.leader_name}):
- Treasury: {nation.gold} Gold, {nation.food} Food, {nation.military_units} Soldiers.
- Territories owned: {', '.join(owned_tids)}.
- Adjacent neutral (can claim): {', '.join(adjacent_neutral) if adjacent_neutral else 'None'}.
- Adjacent enemy (can attack): {', '.join(adjacent_enemy) if adjacent_enemy else 'None'}.
- Rival kingdoms: {', '.join(rival_ids) if rival_ids else 'None'}.

RULES:
- "claim": Costs 20 gold, 10 food. Target MUST be adjacent neutral territory ID.
- "recruit": Costs 20 gold, 10 food. Adds 5 soldiers to owned territory.
- "move": Move soldiers from origin owned territory to adjacent owned territory.
- "attack": Attack adjacent enemy territory from origin owned territory.
- "develop": Costs 30 gold. develop_target: "gold" or "food".
- "pass": Save resources.

TASK:
1. Diplomatic statement or message to a rival (strictly under 18 words).
2. Choose 1 or 2 strategic actions (claims, recruits, moves, or attacks).

Respond with ONLY valid JSON:
{{
  "recipient_id": "rival_id" or null for public broadcast,
  "statement": "1 concise sentence under 18 words",
  "actions": [
    {{
      "action_type": "claim" | "recruit" | "move" | "attack" | "develop" | "pass",
      "origin_territory_id": "T01" or null,
      "target_territory_id": "T02" or null,
      "units_count": 3 or null,
      "develop_target": "gold" or "food" or null
    }}
  ]
}}
"""
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.post(
                    f"{self.ollama_url}/api/generate",
                    json={
                        "model": self.model_name,
                        "prompt": prompt,
                        "stream": False,
                        "format": "json",
                        "options": {
                            "num_predict": 95,
                            "temperature": 0.5,
                        }
                    }
                )
                if res.status_code == 200:
                    data = res.json()
                    response_text = data.get("response", "{}")
                    parsed = json.loads(response_text)
                    statement = parsed.get("statement", "").strip()
                    recipient_id = parsed.get("recipient_id")
                    if recipient_id not in rival_ids:
                        recipient_id = None

                    # Cache decision for Phase 3 (instant zero-delay retrieval)
                    raw_actions = parsed.get("actions", [])
                    actions: List[GameAction] = []
                    for idx, a in enumerate(raw_actions[:2]):
                        atype = a.get("action_type", "pass")
                        if atype not in ("claim", "recruit", "develop", "move", "attack", "transfer", "pass"):
                            atype = "pass"
                        actions.append(
                            GameAction(
                                action_id=f"act_{nation.id}_{obs.turn}_{idx+1}",
                                nation_id=nation.id,
                                action_type=atype,
                                target_territory_id=a.get("target_territory_id"),
                                origin_territory_id=a.get("origin_territory_id"),
                                target_nation_id=a.get("target_nation_id"),
                                units_count=a.get("units_count"),
                                develop_target=a.get("develop_target"),
                                reasoning_note=a.get("reasoning_note", "Strategic doctrine"),
                            )
                        )
                    if not actions:
                        actions.append(
                            GameAction(
                                action_id=f"act_{nation.id}_{obs.turn}_pass",
                                nation_id=nation.id,
                                action_type="pass",
                                reasoning_note="Conserving resources.",
                            )
                        )
                    self._cached_decision = AgentDecision(
                        nation_id=nation.id,
                        turn=obs.turn,
                        actions=actions[:2],
                        outgoing_messages=[],
                        strategy_note=statement or f"AI {self.model_name} strategic plan",
                    )
                    self._cached_decision_turn = obs.turn

                    if statement:
                        return [
                            DiplomaticMessage(
                                message_id=f"msg_{nation.id}_{obs.turn}_1",
                                turn=obs.turn,
                                sender_id=nation.id,
                                recipient_id=recipient_id,
                                is_private=False,
                                content=statement,
                                timestamp=self._now_iso(),
                            )
                        ]
                    return []
        except Exception:
            pass
        return await self.fallback.generate_diplomacy(obs)

    async def generate_decision(self, obs: AgentObservation) -> AgentDecision:
        if getattr(self, "_cached_decision_turn", None) == obs.turn and self._cached_decision:
            decision = self._cached_decision
            self._cached_decision = None
            self._cached_decision_turn = None
            return decision
        return await self.fallback.generate_decision(obs)
