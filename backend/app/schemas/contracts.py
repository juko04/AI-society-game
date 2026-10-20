# AI NOTICE: Before modifying this project, read AGENTS.md for architecture, flexibility, and collaboration guidelines.
"""Core Pydantic data contracts for Emergent Nations.

These contracts serve as the single source of truth across the backend,
AI agents, game engine, and frontend interface.
"""

from typing import Dict, List, Optional, Literal, Any
from pydantic import BaseModel, Field


PhaseType = Literal[
    "world_update",
    "diplomacy",
    "strategic_decisions",
    "resolution",
    "history_memory"
]

ActionType = Literal[
    "claim",
    "recruit",
    "develop",
    "move",
    "attack",
    "transfer",
    "trade",
    "alliance",
    "pass"
]

AgreementType = Literal[
    "alliance",
    "non_aggression",
    "trade_pact",
    "military_access"
]

AgreementStatus = Literal[
    "active",
    "violated",
    "expired",
    "terminated"
]

MemoryType = Literal[
    "historical_fact",
    "current_belief",
    "recent_context"
]


class Territory(BaseModel):
    """Represents a discrete region on the Risk-style map."""
    id: str = Field(description="Unique territory ID, e.g. T01")
    name: str = Field(description="Human-readable territory name")
    owner_id: Optional[str] = Field(default=None, description="Nation ID owning this territory, None if neutral")
    gold_production: int = Field(default=5, description="Gold produced per turn")
    food_production: int = Field(default=4, description="Food produced per turn")
    stationed_military: int = Field(default=0, description="Military units stationed here")
    adjacent_territory_ids: List[str] = Field(default_factory=list, description="List of adjacent territory IDs")
    coord_x: float = Field(default=0.0, description="2D map layout X coordinate (0-100 scale)")
    coord_y: float = Field(default=0.0, description="2D map layout Y coordinate (0-100 scale)")


class Nation(BaseModel):
    """Represents an autonomous AI civilization."""
    id: str = Field(description="Unique nation ID, e.g. nation_1")
    name: str = Field(description="Civilization name, e.g. Solaria")
    color: str = Field(description="Hex color code for map rendering, e.g. #3B82F6")
    leader_name: str = Field(description="AI leader persona name")
    personality: Optional[str] = Field(default=None, description="Starting archetype, e.g. Opportunist, Altruist, Skeptic")
    gold: int = Field(default=100, description="Current treasury")
    food: int = Field(default=60, description="Current food stock")
    military_units: int = Field(default=12, description="Total active military units across all territories")
    territory_ids: List[str] = Field(default_factory=list, description="IDs of owned territories")
    current_goals: List[str] = Field(default_factory=list, description="Active high-level goals")
    is_alive: bool = Field(default=True, description="False if conquered")


class GameAction(BaseModel):
    """Represents a validated or pending strategic action submitted by a nation."""
    action_id: str = Field(description="Unique action ID")
    nation_id: str = Field(description="Nation executing the action")
    action_type: ActionType = Field(description="Type of action")
    target_territory_id: Optional[str] = Field(default=None, description="Target territory for claim, develop, move, or attack")
    origin_territory_id: Optional[str] = Field(default=None, description="Origin territory for military movement or attack")
    target_nation_id: Optional[str] = Field(default=None, description="Target nation for transfers, trades, or treaties")
    units_count: Optional[int] = Field(default=None, description="Number of units committed to move or attack")
    gold_amount: Optional[int] = Field(default=None, description="Gold involved in transfer or trade")
    food_amount: Optional[int] = Field(default=None, description="Food involved in transfer or trade")
    develop_target: Optional[Literal["gold", "food"]] = Field(default=None, description="Resource to improve when developing")
    reasoning_note: Optional[str] = Field(default=None, description="AI reasoning summary for this action")


class DiplomaticMessage(BaseModel):
    """Natural-language communication between civilizations."""
    message_id: str = Field(description="Unique message ID")
    turn: int = Field(description="Simulation turn when sent")
    sender_id: str = Field(description="Sending nation ID")
    recipient_id: Optional[str] = Field(default=None, description="Target nation ID, or None if public announcement")
    is_private: bool = Field(default=False, description="True if private 1-on-1 message")
    content: str = Field(description="Natural-language message body")
    timestamp: Optional[str] = Field(default=None, description="ISO timestamp")


class DiplomaticAgreement(BaseModel):
    """Formal treaty or pact between two or more civilizations."""
    agreement_id: str = Field(description="Unique agreement ID")
    turn_formed: int = Field(description="Turn when agreed")
    parties: List[str] = Field(description="Nation IDs participating")
    agreement_type: AgreementType = Field(description="Category of treaty")
    terms: str = Field(description="Human-readable agreement terms")
    status: AgreementStatus = Field(default="active", description="Agreement lifecycle status")


class MemoryEntry(BaseModel):
    """Individual memory item retained by an AI civilization."""
    memory_id: str = Field(description="Unique memory ID")
    nation_id: str = Field(description="Nation that holds this memory")
    memory_type: MemoryType = Field(description="Fact, belief, or recent context")
    subject_nation_id: Optional[str] = Field(default=None, description="Nation this memory pertains to")
    summary: str = Field(description="Concise description of the event or belief")
    importance: float = Field(default=0.5, ge=0.0, le=1.0, description="Relevance weight (0.0 to 1.0)")
    turn_recorded: int = Field(description="Turn when memory was formed")
    last_updated_turn: int = Field(description="Turn when memory was last refreshed")


class GameEvent(BaseModel):
    """Significant world event recorded in the chronological event stream."""
    event_id: str = Field(description="Unique event ID")
    turn: int = Field(description="Simulation turn")
    phase: str = Field(description="Turn phase when event occurred")
    event_type: str = Field(description="Type: claim, combat, trade, alliance, message, etc.")
    summary: str = Field(description="Spectator-facing summary sentence")
    source_nation_id: Optional[str] = Field(default=None, description="Initiating nation ID")
    target_nation_id: Optional[str] = Field(default=None, description="Recipient or defending nation ID")
    territory_id: Optional[str] = Field(default=None, description="Relevant territory ID")
    details: Dict[str, Any] = Field(default_factory=dict, description="Structured outcome data (dice, casualties, etc.)")
    timestamp: str = Field(description="ISO timestamp")


class WorldState(BaseModel):
    """Authoritative snapshot of the entire simulation world."""
    simulation_id: str = Field(description="Unique simulation identifier")
    turn: int = Field(default=1, description="Current turn number")
    phase: PhaseType = Field(default="world_update", description="Current turn phase")
    seed: int = Field(default=42, description="Random seed used for generation")
    nations: Dict[str, Nation] = Field(description="Map of nation_id -> Nation")
    territories: Dict[str, Territory] = Field(description="Map of territory_id -> Territory")
    is_paused: bool = Field(default=True, description="Whether simulation is currently running")
    speed: float = Field(default=1.0, description="Speed multiplier (0.5x, 1x, 2x)")


class AgentObservation(BaseModel):
    """Sanitized, permission-filtered world observation sent to an AI agent."""
    turn: int
    nation: Nation
    known_territories: List[Territory]
    current_goals: List[str]
    recent_events: List[str]
    relationships: Dict[str, str]
    visible_messages: List[DiplomaticMessage]
    available_actions: List[str]


class AgentDecision(BaseModel):
    """Structured decision returned by an AI agent."""
    nation_id: str
    turn: int
    actions: List[GameAction] = Field(default_factory=list, max_length=2)
    outgoing_messages: List[DiplomaticMessage] = Field(default_factory=list)
    strategy_note: Optional[str] = None


class SimulationConfig(BaseModel):
    """Global parameters controlling a simulation run."""
    simulation_id: str = "sim_default"
    seed: int = 42
    territory_count: int = 36
    nation_count: int = 6
    ai_model: str = "qwen3:8b"
    use_mock_agents: bool = True
    max_turns: int = 200


class TurnSnapshot(BaseModel):
    """Full snapshot of world state and events at the completion of a turn."""
    snapshot_id: str
    simulation_id: str
    turn: int
    phase: str
    world_state: WorldState
    events: List[GameEvent] = Field(default_factory=list)
    messages: List[DiplomaticMessage] = Field(default_factory=list)
    agreements: List[DiplomaticAgreement] = Field(default_factory=list)


class HealthResponse(BaseModel):
    """API health and environment status."""
    status: str = "ok"
    app_name: str
    version: str
    environment: str
    mock_ai_enabled: bool
    ai_model: str
    active_simulation_id: Optional[str] = None
    current_turn: int = 1


class SimulationStepResponse(BaseModel):
    """Response returned when stepping the simulation forward."""
    status: str
    previous_phase: str
    current_phase: str
    current_turn: int
    new_events: List[GameEvent] = Field(default_factory=list)
    world_state: WorldState
