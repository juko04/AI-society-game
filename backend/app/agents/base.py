"""Agent interface and implementations for Emergent Nations.

Provides both deterministic MockScriptedAgent (no local LLM required for teammates)
and OllamaAgentAdapter (connects to Qwen3 via Ollama when local AI is active).
"""

from abc import ABC, abstractmethod
from typing import List, Optional
import random
import httpx
from datetime import datetime, timezone

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

        # Generate contextual diplomatic behavior according to personality archetype
        if "altruist" in p:
            if turn == 1:
                messages.append(
                    DiplomaticMessage(
                        message_id=f"msg_{nation.id}_{turn}_pub",
                        turn=turn,
                        sender_id=nation.id,
                        recipient_id=None,
                        is_private=False,
                        content=f"Greetings neighbors. {nation.name} stands for mutual survival and flourishing. We propose open borders and non-aggression.",
                        timestamp=self._now_iso(),
                    )
                )
        elif "opportunist" in p:
            if turn % 2 == 1:
                messages.append(
                    DiplomaticMessage(
                        message_id=f"msg_{nation.id}_{turn}_pub",
                        turn=turn,
                        sender_id=nation.id,
                        recipient_id=None,
                        is_private=False,
                        content=f"Wealth flows where borders are open. {nation.name} seeks lucrative trade agreements with stable nations.",
                        timestamp=self._now_iso(),
                    )
                )
        elif "skeptic" in p:
            if turn == 1:
                messages.append(
                    DiplomaticMessage(
                        message_id=f"msg_{nation.id}_{turn}_pub",
                        turn=turn,
                        sender_id=nation.id,
                        recipient_id=None,
                        is_private=False,
                        content=f"{nation.name} monitors all troop deployments carefully. Words of peace must be backed by transparent garrisons.",
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
    """Adapter connecting to local Ollama server (Qwen3 8B / 4B).

    Includes graceful fallback to MockScriptedAgent if the Ollama endpoint is offline.
    """

    def __init__(
        self,
        nation_id: str,
        leader_name: str,
        personality: Optional[str] = None,
        ollama_url: str = "http://localhost:11434",
        model_name: str = "qwen3:8b",
    ):
        super().__init__(nation_id, leader_name, personality)
        self.ollama_url = ollama_url
        self.model_name = model_name
        self.fallback = MockScriptedAgent(nation_id, leader_name, personality)

    async def generate_diplomacy(self, obs: AgentObservation) -> List[DiplomaticMessage]:
        try:
            # When Ollama is available, query model with structured prompt
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(f"{self.ollama_url}/api/tags")
                if res.status_code == 200:
                    # In Phase 2, Julian will complete full prompt serialization here
                    pass
        except Exception:
            # Fallback smoothly without crashing simulation
            pass
        return await self.fallback.generate_diplomacy(obs)

    async def generate_decision(self, obs: AgentObservation) -> AgentDecision:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(f"{self.ollama_url}/api/tags")
                if res.status_code == 200:
                    pass
        except Exception:
            pass
        return await self.fallback.generate_decision(obs)
