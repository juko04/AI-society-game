# Emergent Nations - Shared Data Contracts

This directory contains the central data contracts that govern communication between the **Game Engine**, **AI Agents**, **Diplomacy/Memory System**, **Backend API**, and **React Frontend**.

## Single Source of Truth
The canonical source of truth for all schemas is defined in:
`backend/app/schemas/contracts.py` (Pydantic v2 Models)

Generated artifacts:
- `contracts/schemas/*.schema.json`: Standard JSON Schemas for validating AI tool calls and external endpoints.
- `contracts/types.ts`: TypeScript interfaces used by the frontend.
- `frontend/src/types/contracts.ts`: Frontend copy of the shared interfaces.

## Re-generating Contracts
If you modify or extend `backend/app/schemas/contracts.py`, re-run the generator script:
```bash
python scripts/generate_fixtures_and_contracts.py
```
This updates JSON schemas, sample world fixtures, and decision examples.

## Key Schemas Overview

| Schema | Purpose | Primary Fields |
|---|---|---|
| `Nation` | AI Civilization state | id, name, color, leader_name, personality, gold, food, military_units, territory_ids, current_goals |
| `Territory` | Discrete map region | id, name, owner_id, gold_production, food_production, stationed_military, adjacent_territory_ids, coords |
| `WorldState` | Complete world snapshot | simulation_id, turn, phase, seed, nations, territories, is_paused, speed |
| `GameAction` | Strategic action submitted by AI | action_type (`claim`, `recruit`, `develop`, `move`, `attack`, `transfer`, `trade`, `alliance`), target, units, gold, food |
| `DiplomaticMessage` | Inter-agent communication | turn, sender_id, recipient_id (null for public broadcast), is_private, content |
| `DiplomaticAgreement` | Formal treaties & pacts | turn_formed, parties, agreement_type, terms, status (`active`, `violated`, `expired`) |
| `MemoryEntry` | Agent long-term memory | memory_type (`historical_fact`, `current_belief`, `recent_context`), subject, summary, importance, turn |
| `AgentObservation` | Filtered context sent to AI | turn, nation, known_territories, current_goals, recent_events, visible_messages |
| `AgentDecision` | AI response structure | nation_id, turn, actions (up to 2), outgoing_messages, strategy_note |
| `GameEvent` | Spectator event stream item | turn, phase, event_type, summary, source_nation_id, target_nation_id, details |

## Team Agreement
Any changes to schema fields or action types require a team discussion and PR review so that engine, AI prompts, and frontend components remain compatible.
