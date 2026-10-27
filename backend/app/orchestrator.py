# AI NOTICE: Before modifying this project, read AGENTS.md for architecture, flexibility, and collaboration guidelines.
"""Simulation Orchestrator for Emergent Nations.

Coordinates the phased turn loop across the Game Engine, AI Agents,
Diplomacy Manager, Memory System, and Persistence.
"""

from typing import Dict, List, Optional
from datetime import datetime, timezone

from app.schemas.contracts import (
    WorldState,
    GameEvent,
    DiplomaticMessage,
    AgentObservation,
    PhaseType,
    SimulationStepResponse,
)
from app.engine.base import GameEngine
from app.agents.base import BaseAgent, MockScriptedAgent, OllamaAgentAdapter
from app.diplomacy.base import DiplomacyManager
from app.memory.base import MemoryManager
from app.persistence.base import PersistenceManager
from app.config import settings


class SimulationOrchestrator:
    """Master controller coordinating the simulation lifecycle."""

    def __init__(self):
        self.persistence = PersistenceManager()
        self.diplomacy = DiplomacyManager()
        self.memory = MemoryManager()
        self.world: Optional[WorldState] = None
        self.engine: Optional[GameEngine] = None
        self.agents: Dict[str, BaseAgent] = {}
        
        self.init_simulation()

    def _now_iso(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    def init_simulation(self) -> WorldState:
        """Initialize or reset the simulation state and instantiate agents."""
        self.world = self.persistence.load_initial_world()
        self.engine = GameEngine(self.world)
        self.diplomacy = DiplomacyManager()
        self.memory = MemoryManager()
        self.agents.clear()

        # Instantiate agents for each nation
        for nation_id, nation in self.world.nations.items():
            if settings.use_mock_agents:
                agent = MockScriptedAgent(
                    nation_id=nation.id,
                    leader_name=nation.leader_name,
                    personality=nation.personality,
                )
            else:
                agent = OllamaAgentAdapter(
                    nation_id=nation.id,
                    leader_name=nation.leader_name,
                    personality=nation.personality,
                    ollama_url=settings.ollama_base_url,
                    model_name=settings.default_ai_model,
                )
            self.agents[nation_id] = agent

        return self.world

    def get_world_state(self) -> WorldState:
        if not self.world:
            return self.init_simulation()
        return self.world

    def _build_observation(self, nation_id: str) -> AgentObservation:
        """Create sanitized observation filtered for a specific nation."""
        nation = self.world.nations[nation_id]
        visible_messages = self.diplomacy.get_messages_for_agent(nation_id)
        
        recent_events = [
            e.summary for e in self.persistence.events[-5:]
        ]
        
        relationships = {
            other_id: "Neutral"
            for other_id in self.world.nations
            if other_id != nation_id
        }

        return AgentObservation(
            turn=self.world.turn,
            nation=nation,
            known_territories=list(self.world.territories.values()),
            current_goals=nation.current_goals,
            recent_events=recent_events,
            relationships=relationships,
            visible_messages=visible_messages,
            available_actions=["claim", "recruit", "develop", "move", "attack", "transfer", "pass"],
        )

    async def step(self, full_turn: bool = False) -> SimulationStepResponse:
        """Advance the simulation by one phase, or execute all phases for a full turn."""
        if not self.world or not self.engine:
            self.init_simulation()

        initial_phase = self.world.phase
        new_events: List[GameEvent] = []

        if full_turn:
            # Execute entire 5-phase turn cycle
            for _ in range(5):
                phase_events = await self._step_single_phase()
                new_events.extend(phase_events)
        else:
            new_events = await self._step_single_phase()

        self.persistence.record_events(new_events)

        return SimulationStepResponse(
            status="success",
            previous_phase=initial_phase,
            current_phase=self.world.phase,
            current_turn=self.world.turn,
            new_events=new_events,
            world_state=self.world,
        )

    async def _step_single_phase(self) -> List[GameEvent]:
        """Advance exactly one phase in the state machine."""
        events: List[GameEvent] = []
        phase = self.world.phase

        if phase == "world_update":
            self.world.active_thinking_nation_id = None
            self.world.active_thinking_activity = "Calculating resource yields and army food upkeep..."
            events = self.engine.process_phase_world_update()
            self.world.phase = "diplomacy"

        elif phase == "diplomacy":
            # Phase 2: AI communication
            for nation_id, agent in self.agents.items():
                nation = self.world.nations.get(nation_id)
                if not nation or not nation.is_alive:
                    continue
                self.world.active_thinking_nation_id = nation_id
                self.world.active_thinking_activity = f"{nation.name} ({nation.leader_name}) is formulating diplomatic messages..."
                obs = self._build_observation(nation_id)
                messages = await agent.generate_diplomacy(obs)
                for msg in messages:
                    self.diplomacy.messages.append(msg)
                    events.append(
                        GameEvent(
                            event_id=f"evt_msg_{self.world.turn}_{msg.message_id}",
                            turn=self.world.turn,
                            phase="diplomacy",
                            event_type="announcement" if not msg.is_private else "private_message",
                            summary=f"{nation.name}: \"{msg.content[:60]}...\"",
                            source_nation_id=nation.id,
                            target_nation_id=msg.recipient_id,
                            details={"full_content": msg.content, "is_private": msg.is_private},
                            timestamp=self._now_iso(),
                        )
                    )
            self.world.active_thinking_nation_id = None
            self.world.active_thinking_activity = None
            self.world.phase = "strategic_decisions"

        elif phase == "strategic_decisions":
            # Phase 3: AI orders collection
            all_actions = []
            for nation_id, agent in self.agents.items():
                nation = self.world.nations.get(nation_id)
                if not nation or not nation.is_alive:
                    continue
                self.world.active_thinking_nation_id = nation_id
                self.world.active_thinking_activity = f"{nation.name} ({nation.leader_name}) is deciding strategic moves..."
                obs = self._build_observation(nation_id)
                decision = await agent.generate_decision(obs)
                all_actions.extend(decision.actions)
            self.world.active_thinking_nation_id = None
            self.world.active_thinking_activity = None
            self._pending_actions = all_actions
            self.world.phase = "resolution"

        elif phase == "resolution":
            # Phase 4: Resolution of actions and combat
            self.world.active_thinking_nation_id = None
            self.world.active_thinking_activity = "Resolving military movements, developments, and battles..."
            pending = getattr(self, "_pending_actions", [])
            events = self.engine.resolve_actions(pending)
            self._pending_actions = []
            self.world.phase = "history_memory"

        elif phase == "history_memory":
            # Phase 5: Snapshot & Memory decay
            self.world.active_thinking_nation_id = None
            self.world.active_thinking_activity = "Archiving turn history snapshot..."
            self.persistence.save_snapshot(
                turn=self.world.turn,
                phase=self.world.phase,
                world=self.world,
                messages=self.diplomacy.get_spectator_messages(),
                agreements=self.diplomacy.get_active_agreements(),
            )
            self.memory.apply_memory_decay(current_turn=self.world.turn)
            self.world.turn += 1
            self.world.phase = "world_update"
            self.world.active_thinking_activity = None

        return events


# Singleton orchestrator for application instance
orchestrator = SimulationOrchestrator()
