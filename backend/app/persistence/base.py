"""Persistence layer for simulation states, turn snapshots, and event logs.

Supports fast in-memory active state with snapshot serialization and SQLite readiness.
"""

import json
from pathlib import Path
from typing import List, Optional, Dict
from app.schemas.contracts import (
    WorldState,
    GameEvent,
    DiplomaticMessage,
    DiplomaticAgreement,
    TurnSnapshot,
)


class PersistenceManager:
    """Manages storage of world states, snapshots, and event history."""

    def __init__(self, fixtures_dir: Optional[Path] = None):
        self.fixtures_dir = fixtures_dir or (Path(__file__).resolve().parent.parent.parent.parent / "fixtures")
        self.active_world: Optional[WorldState] = None
        self.events: List[GameEvent] = []
        self.snapshots: Dict[int, TurnSnapshot] = {}

    def load_initial_world(self) -> WorldState:
        """Load the baseline world state from fixtures or generate defaults."""
        sample_world_path = self.fixtures_dir / "sample_world.json"
        if sample_world_path.exists():
            with open(sample_world_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                self.active_world = WorldState(**data)
        else:
            raise FileNotFoundError(f"Fixture not found at {sample_world_path}")

        # Also load initial events if present (resetting any past turn events)
        sample_events_path = self.fixtures_dir / "sample_events.json"
        if sample_events_path.exists():
            with open(sample_events_path, "r", encoding="utf-8") as f:
                events_data = json.load(f)
                self.events = [GameEvent(**e) for e in events_data]
        else:
            self.events = []
        self.snapshots.clear()

        return self.active_world

    def record_event(self, event: GameEvent) -> None:
        """Append an event to the persistent event log."""
        self.events.append(event)

    def record_events(self, new_events: List[GameEvent]) -> None:
        """Append multiple events."""
        self.events.extend(new_events)

    def save_snapshot(
        self,
        turn: int,
        phase: str,
        world: WorldState,
        messages: List[DiplomaticMessage],
        agreements: List[DiplomaticAgreement],
    ) -> TurnSnapshot:
        """Archive a turn snapshot for spectator timeline scrub and replay."""
        snap = TurnSnapshot(
            snapshot_id=f"snap_{world.simulation_id}_t{turn}",
            simulation_id=world.simulation_id,
            turn=turn,
            phase=phase,
            world_state=world.model_copy(deep=True),
            events=list(self.events),
            messages=list(messages),
            agreements=list(agreements),
        )
        self.snapshots[turn] = snap
        return snap

    def get_snapshot(self, turn: int) -> Optional[TurnSnapshot]:
        return self.snapshots.get(turn)
