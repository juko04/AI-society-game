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

        # Generate dynamic contextual diplomatic behavior according to personality archetype
        content: Optional[str] = None
        if "altruist" in p:
            statements = [
                f"Greetings neighbors. {nation.name} stands for mutual survival and flourishing. We propose open borders.",
                f"Our granaries are producing steady yields. Any neighboring nation facing shortages may request assistance.",
                "Let us form a regional non-aggression treaty so our farmers and artisans can thrive without fear of war.",
                f"{nation.name} offers cooperative trade to foster prosperity across all borders.",
                "Peaceful coexistence is the only lasting path to civilizational greatness.",
            ]
            content = statements[(turn - 1) % len(statements)]
        elif "opportunist" in p:
            statements = [
                f"Wealth flows where borders are open. {nation.name} seeks lucrative trade agreements with stable nations.",
                "Our gold reserves are expanding rapidly. We are prepared to invest in mutually profitable alliances.",
                "The swiftest pioneer claims the richest territories. We encourage active commerce across the riverlands.",
                f"{nation.name} is open to exchanging surplus capital for food security or territorial guarantees.",
                "Power follows prosperity. Those who trade with us will share in our expanding influence.",
            ]
            content = statements[(turn - 1) % len(statements)]
        elif "skeptic" in p:
            statements = [
                f"{nation.name} monitors all troop deployments carefully. Words of peace must be backed by transparent garrisons.",
                "We require verifiable guarantees before entering long-term alliances. Unchecked ambition is a common downfall.",
                "Our scouts report military recruitment along frontier provinces. We advise all factions to tread carefully.",
                f"{nation.name} maintains vigilant watch over border crossings to prevent surprise aggression.",
                "Agreements are only as reliable as the honor of those who sign them. We will judge others by their deeds.",
            ]
            content = statements[(turn - 1) % len(statements)]
        elif "aggressive" in p:
            statements = [
                f"The legions of {nation.name} stand fully mobilized. Do not test our resolve.",
                "Strength is the only true guarantee of sovereignty in this contested realm.",
                f"{nation.name} will claim the territory it requires for its defense without hesitation.",
            ]
            content = statements[(turn - 1) % len(statements)]
        else:
            statements = [
                f"{nation.name} welcomes balanced dialogue and peaceful boundary demarcation.",
                "We observe evolving alliances closely and prioritize national security.",
            ]
            content = statements[(turn - 1) % len(statements)]

        if content:
            messages.append(
                DiplomaticMessage(
                    message_id=f"msg_{nation.id}_{turn}_pub",
                    turn=turn,
                    sender_id=nation.id,
                    recipient_id=None,
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

        # Find adjacent neutral territories
        owned_tids = set(nation.territory_ids)
        adjacent_neutral_tids = set()
        for t in obs.known_territories:
            if t.id in owned_tids:
                for adj_id in t.adjacent_territory_ids:
                    adj_t = next((x for x in obs.known_territories if x.id == adj_id), None)
                    if adj_t and adj_t.owner_id is None:
                        adjacent_neutral_tids.add(adj_id)

        # Action 1: Expansion or Military
        if "opportunist" in p or "expansionist" in p:
            if adjacent_neutral_tids and nation.gold >= 20 and nation.food >= 10:
                target_tid = sorted(list(adjacent_neutral_tids))[0]
                actions.append(
                    GameAction(
                        action_id=f"act_{nation.id}_{turn}_1",
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
                        action_id=f"act_{nation.id}_{turn}_1",
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
                        action_id=f"act_{nation.id}_{turn}_1",
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
                        action_id=f"act_{nation.id}_{turn}_1",
                        nation_id=nation.id,
                        action_type="claim",
                        target_territory_id=target_tid,
                        reasoning_note="Settle adjacent land peacefully.",
                    )
                )
        else: # Skeptic / Cautious / Default
            if nation.gold >= 20 and nation.food >= 10 and owned_tids:
                target_tid = sorted(list(owned_tids))[0]
                actions.append(
                    GameAction(
                        action_id=f"act_{nation.id}_{turn}_1",
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
                        action_id=f"act_{nation.id}_{turn}_1",
                        nation_id=nation.id,
                        action_type="develop",
                        target_territory_id=target_tid,
                        develop_target="gold",
                        reasoning_note="Accumulate treasury for emergency reserves.",
                    )
                )

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
                                adjacent_enemy.append(f"{adj_id} ({adj_terr.owner_id})")

            prompt = f"""{personality_guide}

TURN {obs.turn} FOR {nation.name} ({self.leader_name}):
- Treasury: {nation.gold} Gold, {nation.food} Food, {nation.military_units} Soldiers.
- Territories: {', '.join(owned_tids)}.
- Adjacent neutral (can claim): {', '.join(adjacent_neutral) if adjacent_neutral else 'None'}.
- Adjacent enemy (can attack): {', '.join(adjacent_enemy) if adjacent_enemy else 'None'}.

RULES:
- "claim": Costs 20 gold, 10 food. Target MUST be adjacent neutral territory ID.
- "recruit": Costs 20 gold, 10 food. Adds 5 soldiers to owned territory.
- "develop": Costs 30 gold. Increases yield of owned territory. develop_target: "gold" or "food".
- "attack": Target adjacent enemy territory.
- "pass": Save resources.

TASK:
1. State 1 brief public proclamation or proposal (strictly under 18 words).
2. Choose 1 or 2 strategic actions.

Respond with ONLY valid JSON adhering strictly to this schema:
{{
  "statement": "1 concise sentence under 18 words",
  "actions": [
    {{
      "action_type": "claim" | "recruit" | "develop" | "move" | "attack" | "pass",
      "target_territory_id": "T01" or null,
      "develop_target": "gold" or "food" or null,
      "reasoning_note": "Brief reasoning"
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
                            "num_predict": 85,
                            "temperature": 0.5,
                        }
                    }
                )
                if res.status_code == 200:
                    data = res.json()
                    response_text = data.get("response", "{}")
                    parsed = json.loads(response_text)
                    statement = parsed.get("statement", "").strip()

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
                                recipient_id=None,
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
