"""Deterministic Game Engine for Emergent Nations.

Implements territorial adjacency, resource production, military upkeep,
action validation, and combat resolution according to the game specification.
"""

import math
import random
from datetime import datetime, timezone
from typing import Dict, List, Tuple, Optional, Any
from app.schemas.contracts import (
    WorldState,
    Nation,
    Territory,
    GameAction,
    GameEvent,
    PhaseType,
)


class GameEngine:
    """Core deterministic game simulation engine."""

    def __init__(self, world_state: WorldState):
        self.world = world_state
        self.rng = random.Random(world_state.seed + world_state.turn)

    def _now_iso(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    def process_phase_world_update(self) -> List[GameEvent]:
        """Phase 1: Calculate resource production, army upkeep, and food attrition."""
        events: List[GameEvent] = []
        
        for nation_id, nation in self.world.nations.items():
            if not nation.is_alive:
                continue

            # 1. Calculate production from owned territories
            gold_gain = sum(
                self.world.territories[tid].gold_production
                for tid in nation.territory_ids
                if tid in self.world.territories
            )
            food_gain = sum(
                self.world.territories[tid].food_production
                for tid in nation.territory_ids
                if tid in self.world.territories
            )

            nation.gold += gold_gain
            nation.food += food_gain

            # 2. Army food upkeep: 1 food per 4 units rounded up
            total_units = sum(
                self.world.territories[tid].stationed_military
                for tid in nation.territory_ids
                if tid in self.world.territories
            )
            nation.military_units = total_units

            upkeep = math.ceil(total_units / 4.0) if total_units > 0 else 0
            
            if nation.food >= upkeep:
                nation.food -= upkeep
            else:
                # Food shortage / attrition
                deficit = upkeep - nation.food
                nation.food = 0
                attrition_units = min(deficit * 2, total_units)
                if attrition_units > 0:
                    self._apply_attrition(nation, attrition_units)
                    events.append(
                        GameEvent(
                            event_id=f"evt_attr_{self.world.turn}_{nation_id}",
                            turn=self.world.turn,
                            phase="world_update",
                            event_type="attrition",
                            summary=f"{nation.name} suffered a food shortage: {attrition_units} units lost to famine.",
                            source_nation_id=nation_id,
                            details={"food_deficit": deficit, "lost_units": attrition_units},
                            timestamp=self._now_iso(),
                        )
                    )

        self.world.phase = "diplomacy"
        return events

    def _apply_attrition(self, nation: Nation, lost_units: int) -> None:
        """Removes units evenly across territories due to food deficit."""
        remaining_loss = lost_units
        for tid in nation.territory_ids:
            terr = self.world.territories.get(tid)
            if terr and terr.stationed_military > 1:
                can_remove = min(remaining_loss, terr.stationed_military - 1)
                terr.stationed_military -= can_remove
                remaining_loss -= can_remove
                if remaining_loss <= 0:
                    break
        nation.military_units = max(0, nation.military_units - (lost_units - remaining_loss))

    def validate_action(self, action: GameAction) -> Tuple[bool, Optional[str]]:
        """Validate if a submitted action satisfies all economic and spatial rules."""
        nation = self.world.nations.get(action.nation_id)
        if not nation or not nation.is_alive:
            return False, "Nation does not exist or has fallen"

        if action.action_type == "claim":
            if nation.gold < 20 or nation.food < 10:
                return False, "Insufficient resources (requires 20 gold, 10 food)"
            if not action.target_territory_id or action.target_territory_id not in self.world.territories:
                return False, "Invalid target territory"
            target = self.world.territories[action.target_territory_id]
            if target.owner_id is not None:
                return False, f"Territory {target.name} is already owned by {target.owner_id}"
            
            # Check adjacency to at least one territory owned by nation
            adjacent = any(
                owned_tid in target.adjacent_territory_ids
                for owned_tid in nation.territory_ids
            )
            if not adjacent:
                return False, f"Territory {target.name} is not adjacent to any territory owned by {nation.name}"
            return True, None

        elif action.action_type == "recruit":
            if nation.gold < 20 or nation.food < 10:
                return False, "Insufficient resources (requires 20 gold, 10 food)"
            if not action.target_territory_id or action.target_territory_id not in self.world.territories:
                return False, "Invalid target territory"
            target = self.world.territories[action.target_territory_id]
            if target.owner_id != nation.id:
                return False, f"Cannot recruit in territory not owned by {nation.name}"
            return True, None

        elif action.action_type == "develop":
            if nation.gold < 30:
                return False, "Insufficient gold (requires 30 gold)"
            if not action.target_territory_id or action.target_territory_id not in self.world.territories:
                return False, "Invalid target territory"
            target = self.world.territories[action.target_territory_id]
            if target.owner_id != nation.id:
                return False, f"Cannot develop territory not owned by {nation.name}"
            if action.develop_target not in ("gold", "food"):
                return False, "Develop target must be 'gold' or 'food'"
            return True, None

        elif action.action_type == "move":
            if not action.origin_territory_id or not action.target_territory_id:
                return False, "Move requires origin and target territory"
            origin = self.world.territories.get(action.origin_territory_id)
            target = self.world.territories.get(action.target_territory_id)
            if not origin or not target:
                return False, "Invalid territories specified"
            if origin.owner_id != nation.id or target.owner_id != nation.id:
                return False, "Both territories must be owned by the mover"
            if target.id not in origin.adjacent_territory_ids:
                return False, f"{target.name} is not adjacent to {origin.name}"
            units = action.units_count or 1
            if origin.stationed_military - units < 1:
                return False, "Must leave at least 1 unit behind to garrison origin"
            return True, None

        elif action.action_type == "attack":
            if not action.origin_territory_id or not action.target_territory_id:
                return False, "Attack requires origin and target territory"
            origin = self.world.territories.get(action.origin_territory_id)
            target = self.world.territories.get(action.target_territory_id)
            if not origin or not target:
                return False, "Invalid territories specified"
            if origin.owner_id != nation.id:
                return False, "Attacking nation does not own origin territory"
            if target.owner_id == nation.id or target.owner_id is None:
                return False, "Target must be owned by an enemy nation"
            if target.id not in origin.adjacent_territory_ids:
                return False, f"{target.name} is not adjacent to {origin.name}"
            units = action.units_count or 1
            if origin.stationed_military - units < 1:
                return False, "Must leave at least 1 unit behind to garrison origin"
            return True, None

        elif action.action_type == "transfer":
            if not action.target_nation_id or action.target_nation_id not in self.world.nations:
                return False, "Invalid recipient nation"
            gold = action.gold_amount or 0
            food = action.food_amount or 0
            if gold < 0 or food < 0 or (gold == 0 and food == 0):
                return False, "Transfer must include positive gold or food"
            if nation.gold < gold or nation.food < food:
                return False, "Insufficient resources for transfer"
            return True, None

        elif action.action_type == "pass":
            return True, None

        return False, f"Unsupported action type: {action.action_type}"

    def resolve_combat(
        self,
        attacker_nation: Nation,
        defender_nation: Nation,
        origin_tid: str,
        target_tid: str,
        attacking_units: int,
    ) -> GameEvent:
        """Resolve combat dice roll with defensive bonus and casualties."""
        target = self.world.territories[target_tid]
        origin = self.world.territories[origin_tid]
        defending_units = target.stationed_military

        atk_die = self.rng.randint(1, 6)
        def_die = self.rng.randint(1, 6)
        def_bonus = 2

        atk_score = attacking_units + atk_die
        def_score = defending_units + def_die + def_bonus

        attacker_won = atk_score > def_score

        # Casualties: loser takes heavy, winner takes light
        if attacker_won:
            atk_losses = min(attacking_units - 1, max(1, math.floor(defending_units * 0.5)))
            def_losses = defending_units
            surviving_attackers = attacking_units - atk_losses

            # Origin loses committed units
            origin.stationed_military -= attacking_units
            # Target conquered!
            target.owner_id = attacker_nation.id
            target.stationed_military = surviving_attackers

            # Transfer territory lists
            defender_nation.territory_ids.remove(target_tid)
            attacker_nation.territory_ids.append(target_tid)

            summary = (
                f"{attacker_nation.name} attacked {target.name} and conquered it from {defender_nation.name}! "
                f"Rolls: {atk_score} (atk) vs {def_score} (def). Casualties: Atk {atk_losses}, Def {def_losses}."
            )
        else:
            atk_losses = min(attacking_units, max(1, math.floor(attacking_units * 0.6)))
            def_losses = min(defending_units - 1, max(0, math.floor(attacking_units * 0.3)))
            
            origin.stationed_military -= atk_losses
            target.stationed_military -= def_losses

            summary = (
                f"{defender_nation.name} repelled an attack by {attacker_nation.name} on {target.name}. "
                f"Rolls: {atk_score} (atk) vs {def_score} (def). Casualties: Atk {atk_losses}, Def {def_losses}."
            )

        # Update totals
        attacker_nation.military_units = sum(
            self.world.territories[t].stationed_military for t in attacker_nation.territory_ids
        )
        defender_nation.military_units = sum(
            self.world.territories[t].stationed_military for t in defender_nation.territory_ids
        )
        if len(defender_nation.territory_ids) == 0:
            defender_nation.is_alive = False

        return GameEvent(
            event_id=f"evt_combat_{self.world.turn}_{origin_tid}_{target_tid}",
            turn=self.world.turn,
            phase="resolution",
            event_type="combat",
            summary=summary,
            source_nation_id=attacker_nation.id,
            target_nation_id=defender_nation.id,
            territory_id=target_tid,
            details={
                "attacker_roll": atk_die,
                "defender_roll": def_die,
                "defensive_bonus": def_bonus,
                "attacker_score": atk_score,
                "defender_score": def_score,
                "attacker_won": attacker_won,
                "attacker_losses": atk_losses,
                "defender_losses": def_losses,
            },
            timestamp=self._now_iso(),
        )

    def resolve_actions(self, actions: List[GameAction]) -> List[GameEvent]:
        """Execute validated actions and apply mutations."""
        events: List[GameEvent] = []

        for action in actions:
            valid, reason = self.validate_action(action)
            nation = self.world.nations.get(action.nation_id)
            if not valid or not nation:
                continue

            if action.action_type == "claim":
                nation.gold -= 20
                nation.food -= 10
                target = self.world.territories[action.target_territory_id]
                target.owner_id = nation.id
                target.stationed_military = 2 # Garrison initial defense
                nation.territory_ids.append(target.id)
                nation.military_units += 2

                events.append(
                    GameEvent(
                        event_id=f"evt_claim_{self.world.turn}_{nation.id}_{target.id}",
                        turn=self.world.turn,
                        phase="resolution",
                        event_type="claim",
                        summary=f"{nation.name} claimed neutral territory {target.name} ({target.id}).",
                        source_nation_id=nation.id,
                        territory_id=target.id,
                        details={"cost_gold": 20, "cost_food": 10},
                        timestamp=self._now_iso(),
                    )
                )

            elif action.action_type == "recruit":
                nation.gold -= 20
                nation.food -= 10
                target = self.world.territories[action.target_territory_id]
                target.stationed_military += 5
                nation.military_units += 5

                events.append(
                    GameEvent(
                        event_id=f"evt_recruit_{self.world.turn}_{nation.id}_{target.id}",
                        turn=self.world.turn,
                        phase="resolution",
                        event_type="recruit",
                        summary=f"{nation.name} recruited 5 units in {target.name} ({target.id}).",
                        source_nation_id=nation.id,
                        territory_id=target.id,
                        details={"cost_gold": 20, "cost_food": 10, "units_added": 5},
                        timestamp=self._now_iso(),
                    )
                )

            elif action.action_type == "develop":
                nation.gold -= 30
                target = self.world.territories[action.target_territory_id]
                if action.develop_target == "gold":
                    target.gold_production += 2
                    improved = "gold production to " + str(target.gold_production)
                else:
                    target.food_production += 2
                    improved = "food production to " + str(target.food_production)

                events.append(
                    GameEvent(
                        event_id=f"evt_dev_{self.world.turn}_{nation.id}_{target.id}",
                        turn=self.world.turn,
                        phase="resolution",
                        event_type="develop",
                        summary=f"{nation.name} developed {target.name}, boosting {improved}.",
                        source_nation_id=nation.id,
                        territory_id=target.id,
                        details={"cost_gold": 30, "target_stat": action.develop_target},
                        timestamp=self._now_iso(),
                    )
                )

            elif action.action_type == "move":
                origin = self.world.territories[action.origin_territory_id]
                target = self.world.territories[action.target_territory_id]
                units = action.units_count or 1
                origin.stationed_military -= units
                target.stationed_military += units

                events.append(
                    GameEvent(
                        event_id=f"evt_move_{self.world.turn}_{nation.id}",
                        turn=self.world.turn,
                        phase="resolution",
                        event_type="move",
                        summary=f"{nation.name} relocated {units} units from {origin.name} to {target.name}.",
                        source_nation_id=nation.id,
                        territory_id=target.id,
                        details={"origin": origin.id, "target": target.id, "units": units},
                        timestamp=self._now_iso(),
                    )
                )

            elif action.action_type == "attack":
                origin = self.world.territories[action.origin_territory_id]
                target = self.world.territories[action.target_territory_id]
                defender = self.world.nations.get(target.owner_id)
                units = action.units_count or 1
                if defender:
                    combat_event = self.resolve_combat(nation, defender, origin.id, target.id, units)
                    events.append(combat_event)

            elif action.action_type == "transfer":
                recipient = self.world.nations.get(action.target_nation_id)
                gold = action.gold_amount or 0
                food = action.food_amount or 0
                if recipient:
                    nation.gold -= gold
                    nation.food -= food
                    recipient.gold += gold
                    recipient.food += food

                    events.append(
                        GameEvent(
                            event_id=f"evt_xfer_{self.world.turn}_{nation.id}_{recipient.id}",
                            turn=self.world.turn,
                            phase="resolution",
                            event_type="transfer",
                            summary=f"{nation.name} transferred {gold} gold and {food} food to {recipient.name}.",
                            source_nation_id=nation.id,
                            target_nation_id=recipient.id,
                            details={"gold": gold, "food": food},
                            timestamp=self._now_iso(),
                        )
                    )

        return events
