# Emergent Nations - System Architecture

## Architecture Overview

```text
                           WEB BROWSER (Spectator Dashboard)
                                         │
                             React 18 + TypeScript + Vite
                                         │
                                  REST API / HTTP
                                         │
                             FastAPI Application Layer
                                         │
                            Simulation Orchestrator
                                         │
     ┌───────────────────────┬───────────┴───────────┬───────────────────────┐
     │                       │                       │                       │
Game Engine (Rules)      AI Agent Adapter     Diplomacy System        Memory System
 - Territory Adjacency    - Ollama (Qwen3)     - Message Routing       - Historical Facts
 - Resource Yields        - Prompt Formatter   - Privacy Filter        - Relationship Beliefs
 - Combat Dice Rolls      - MockScriptedAgent  - Formal Treaties       - Decay & Summaries
 - Action Validation      - Output Validator   - Agreement Ledger      - Context Window
     │                       │                       │                       │
     └───────────────────────┴───────────┬───────────┴───────────────────────┘
                                         │
                                 Persistence Layer
                                         │
                                   SQLite Database
                               (Turn Snapshots & Logs)
```

---

## Component Responsibilities

### 1. React Frontend (Spectator Interface)
- **Role:** Visualization and interaction dashboard for the omniscient human observer.
- **Rules:** The frontend **never** executes authoritative game logic or state mutation. It communicates via REST API requests (`/api/world/state`, `/api/simulation/step`, etc.).
- **Components:**
  - `TerritoryMap`: 2D SVG / grid territory layout with ownership colors, garrisons, and yield indicators.
  - `CivilizationList`: Summary cards showing leaders, traits, and resource counters.
  - `EventFeed`: Chronological event log with filtering.
  - `SimulationControls`: Play/Pause, Step Phase, Step Turn, and Reset.

### 2. FastAPI Backend
- **Role:** Web server handling API routing, CORS, configuration, and request validation via Pydantic.
- **Endpoints:**
  - `GET /api/health`: System health, environment, mock mode status.
  - `GET /api/world/state`: Complete current world state.
  - `GET /api/nations`: Civilization statuses.
  - `GET /api/territories`: Territory adjacency graph and garrisons.
  - `GET /api/events`: Event history.
  - `POST /api/simulation/step`: Advance by 1 phase or 1 full turn.
  - `POST /api/simulation/reset`: Reset world to initial seed.

### 3. Simulation Orchestrator
- **Role:** State machine manager. Executes the 5-phase turn loop:
  `world_update` &rarr; `diplomacy` &rarr; `strategic_decisions` &rarr; `resolution` &rarr; `history_memory`.
- **Observation Filtering:** Constructs sanitized, permission-filtered `AgentObservation` payloads so AI civilizations cannot see hidden private messages or unobserved territory states.

### 4. Game Engine
- **Role:** 100% deterministic game rules execution.
- **Rules:**
  - Production yields and army upkeep calculations.
  - Action verification (resource costs, ownership, adjacency checks).
  - Combat resolution using dice rolls and casualty distribution.
  - Zero external LLM dependency.

### 5. AI Agents Layer
- **`BaseAgent` Interface:** Standardized interface for generating diplomatic communications and strategic decisions.
- **`MockScriptedAgent`:** Deterministic, personality-driven agent enabling full simulation runs without any local or cloud AI models.
- **`OllamaAgentAdapter`:** Connects to local Ollama instance running Qwen3 8B or 4B.

### 6. Diplomacy & Memory System
- **Diplomacy Manager:** Routes public announcements vs private direct whispers. Enforces privacy rules so that recipient agents only receive messages meant for them.
- **Memory Manager:** Manages evolving beliefs, historical facts, and memory decay so agent prompts stay concise.

### 7. Persistence Layer
- Fast in-memory state for active stepping.
- Snapshot recording for timeline replay and scrubbing without calling AI models again.
- SQLite readiness for persistent simulations across server restarts.
