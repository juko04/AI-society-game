"""Generates JSON schema contracts, TypeScript definitions, and sample fixtures."""

import json
from pathlib import Path
from datetime import datetime, timezone
import random

# Add backend to path
import sys
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR / "backend"))

from app.schemas.contracts import (
    Nation,
    Territory,
    WorldState,
    GameAction,
    GameEvent,
    DiplomaticMessage,
    DiplomaticAgreement,
    MemoryEntry,
    AgentObservation,
    AgentDecision,
    SimulationConfig,
    TurnSnapshot,
)

def generate_json_schemas():
    """Export JSON schemas from Pydantic models."""
    schemas_dir = ROOT_DIR / "contracts" / "schemas"
    schemas_dir.mkdir(parents=True, exist_ok=True)
    
    models = {
        "nation.schema.json": Nation,
        "territory.schema.json": Territory,
        "world_state.schema.json": WorldState,
        "game_action.schema.json": GameAction,
        "game_event.schema.json": GameEvent,
        "diplomatic_message.schema.json": DiplomaticMessage,
        "diplomatic_agreement.schema.json": DiplomaticAgreement,
        "memory_entry.schema.json": MemoryEntry,
        "agent_observation.schema.json": AgentObservation,
        "agent_decision.schema.json": AgentDecision,
        "simulation_config.schema.json": SimulationConfig,
        "turn_snapshot.schema.json": TurnSnapshot,
    }
    
    for filename, model in models.items():
        schema_path = schemas_dir / filename
        with open(schema_path, "w", encoding="utf-8") as f:
            json.dump(model.model_json_schema(), f, indent=2)
    print(f"Generated {len(models)} JSON schemas in {schemas_dir}")

def generate_sample_world():
    """Create a reproducible 36-territory world with 3 nations in different corners."""
    random.seed(42)
    
    # Define 3 core nations in distinct corners
    nations_data = [
        {
            "id": "nation_solaria",
            "name": "Solaria",
            "color": "#F59E0B", # Amber
            "leader_name": "Archon Vael",
            "personality": "Opportunist",
            "gold": 100,
            "food": 60,
            "military_units": 12,
            "territory_ids": ["T01", "T02", "T07"],
            "current_goals": ["Expand towards central valley", "Accumulate gold reserve"],
            "is_alive": True,
        },
        {
            "id": "nation_borealis",
            "name": "Borealis",
            "color": "#3B82F6", # Blue
            "leader_name": "Premier Kaelen",
            "personality": "Altruist",
            "gold": 100,
            "food": 60,
            "military_units": 12,
            "territory_ids": ["T05", "T06", "T12"],
            "current_goals": ["Form mutual defense pact", "Establish frontier granaries"],
            "is_alive": True,
        },
        {
            "id": "nation_viridia",
            "name": "Viridia",
            "color": "#10B981", # Emerald
            "leader_name": "Matriarch Sylvan",
            "personality": "Skeptic",
            "gold": 100,
            "food": 60,
            "military_units": 12,
            "territory_ids": ["T32", "T33", "T34"],
            "current_goals": ["Fortify border passes", "Control fertile southern plains"],
            "is_alive": True,
        },
    ]
    
    nations = {n["id"]: Nation(**n) for n in nations_data}
    
    # 36 territories in a 6x6 grid with horizontal/vertical adjacency and diagonals
    territory_names = [
        "Sunken Valley", "Highland Pass", "Amber Plains", "Whispering Woods", "Iron Crags", "Misty Coast",
        "Golden Dunes", "Azure Reach", "Frost Peak", "Shadow Mire", "Silent Steppe", "Dragon Ridge",
        "Emerald Glade", "River Basin", "Obsidian Hill", "Crystal Shore", "Sun Gate", "Windward Bluff",
        "Ember Gorge", "Ash Wasteland", "Bloodstone Fort", "Gilded Delta", "Sylvan Grove", "Crown Mesa",
        "Cobalt Bay", "Starlight Spire", "Velvet Moor", "Grave Hollow", "Thunder Valley", "Copper Marsh",
        "Twilight Ridge", "Pale Meadow", "Dusk Cavern", "Echoing Canyon", "Storm Haven", "Final Bastion"
    ]
    
    territories = {}
    rows = 6
    cols = 6
    
    # Territory ownership map
    owner_by_tid = {}
    for n in nations.values():
        for tid in n.territory_ids:
            owner_by_tid[tid] = n.id
            
    for r in range(rows):
        for c in range(cols):
            idx = r * cols + c
            tid = f"T{idx + 1:02d}"
            name = territory_names[idx]
            
            # Adjacency (cardinal + some diagonals)
            adj = []
            if r > 0: adj.append(f"T{(r - 1) * cols + c + 1:02d}")
            if r < rows - 1: adj.append(f"T{(r + 1) * cols + c + 1:02d}")
            if c > 0: adj.append(f"T{r * cols + (c - 1) + 1:02d}")
            if c < cols - 1: adj.append(f"T{r * cols + (c + 1) + 1:02d}")
            
            owner = owner_by_tid.get(tid, None)
            units = 4 if owner else 0 # 4 units in each of the 3 starting territories = 12 total
            
            # Normalized 2D coordinates
            cx = round(12.0 + c * 15.0 + (r % 2) * 3.5, 1)
            cy = round(12.0 + r * 15.0, 1)
            
            t = Territory(
                id=tid,
                name=name,
                owner_id=owner,
                gold_production=5,
                food_production=4,
                stationed_military=units,
                adjacent_territory_ids=adj,
                coord_x=cx,
                coord_y=cy
            )
            territories[tid] = t

    world = WorldState(
        simulation_id="sim_genesis_001",
        turn=1,
        phase="world_update",
        seed=42,
        nations=nations,
        territories=territories,
        is_paused=True,
        speed=1.0
    )
    
    fixtures_dir = ROOT_DIR / "fixtures"
    fixtures_dir.mkdir(parents=True, exist_ok=True)
    
    with open(fixtures_dir / "sample_world.json", "w", encoding="utf-8") as f:
        f.write(world.model_dump_json(indent=2))
    print(f"Generated sample_world.json in {fixtures_dir}")

def generate_sample_events():
    """Create sample game events."""
    now = datetime.now(timezone.utc).isoformat()
    events = [
        GameEvent(
            event_id="evt_001",
            turn=1,
            phase="world_update",
            event_type="world_update",
            summary="Simulation initialized with 6 civilizations and 36 territories.",
            details={"nations_count": 6, "territories_count": 36, "seed": 42},
            timestamp=now
        ),
        GameEvent(
            event_id="evt_002",
            turn=1,
            phase="diplomacy",
            event_type="announcement",
            summary="Archon Vael of Solaria broadcast a public desire for peaceful trade along the river.",
            source_nation_id="nation_solaria",
            details={"message": "Let us enrich our peoples rather than shed blood upon our borders."},
            timestamp=now
        ),
        GameEvent(
            event_id="evt_003",
            turn=1,
            phase="strategic_decisions",
            event_type="claim",
            summary="Viridia claimed neutral territory Highland Pass (T02).",
            source_nation_id="nation_viridia",
            territory_id="T02",
            details={"cost_gold": 20, "cost_food": 10},
            timestamp=now
        ),
        GameEvent(
            event_id="evt_004",
            turn=1,
            phase="resolution",
            event_type="recruit",
            summary="Pyros recruited 5 military units in Ember Gorge (T19).",
            source_nation_id="nation_pyros",
            territory_id="T19",
            details={"cost_gold": 20, "cost_food": 10, "units_added": 5},
            timestamp=now
        ),
    ]
    
    fixtures_dir = ROOT_DIR / "fixtures"
    with open(fixtures_dir / "sample_events.json", "w", encoding="utf-8") as f:
        json.dump([e.model_dump() for e in events], f, indent=2)
    print(f"Generated sample_events.json in {fixtures_dir}")

def generate_sample_decisions():
    """Create sample decisions and messages."""
    decisions = [
        AgentDecision(
            nation_id="nation_solaria",
            turn=1,
            actions=[
                GameAction(
                    action_id="act_001",
                    nation_id="nation_solaria",
                    action_type="claim",
                    target_territory_id="T04",
                    reasoning_note="Expand east to secure additional food and buffer zone."
                ),
                GameAction(
                    action_id="act_002",
                    nation_id="nation_solaria",
                    action_type="develop",
                    target_territory_id="T01",
                    develop_target="gold",
                    reasoning_note="Boost capital gold production for future recruitment."
                )
            ],
            outgoing_messages=[
                DiplomaticMessage(
                    message_id="msg_001",
                    turn=1,
                    sender_id="nation_solaria",
                    recipient_id="nation_borealis",
                    is_private=True,
                    content="Greetings Premier Kaelen. Solaria seeks peace on our shared frontier. Shall we agree to respect territory boundaries?"
                )
            ],
            strategy_note="Focus on rapid economic development while sounding diplomatic to keep neighbors at bay."
        ),
        AgentDecision(
            nation_id="nation_borealis",
            turn=1,
            actions=[
                GameAction(
                    action_id="act_003",
                    nation_id="nation_borealis",
                    action_type="recruit",
                    target_territory_id="T07",
                    units_count=5,
                    reasoning_note="Ensure borders are protected with adequate garrison."
                )
            ],
            outgoing_messages=[
                DiplomaticMessage(
                    message_id="msg_002",
                    turn=1,
                    sender_id="nation_borealis",
                    recipient_id="nation_solaria",
                    is_private=True,
                    content="We welcome your overture, Archon Vael. We propose a non-aggression pact for the next 10 turns."
                )
            ],
            strategy_note="Promote mutual cooperation, but maintain defensive garrisons."
        )
    ]
    
    fixtures_dir = ROOT_DIR / "fixtures"
    with open(fixtures_dir / "sample_decisions.json", "w", encoding="utf-8") as f:
        json.dump([d.model_dump() for d in decisions], f, indent=2)
    print(f"Generated sample_decisions.json in {fixtures_dir}")

if __name__ == "__main__":
    generate_json_schemas()
    generate_sample_world()
    generate_sample_events()
    generate_sample_decisions()
