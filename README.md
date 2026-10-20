# Emergent Nations 🌐

> **An open-ended, 2D autonomous AI civilization simulation designed to observe emergent social, economic, military, and diplomatic behavior between AI agents.**

[![CI](https://github.com/juko04/AI-society-game/actions/workflows/ci.yml/badge.svg)](https://github.com/juko04/AI-society-game/actions/workflows/ci.yml)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript%20%2B%20Vite-61DAFB.svg)](https://reactjs.org/)
[![AI](https://img.shields.io/badge/AI-Ollama%20%7C%20Qwen3%20%7C%20Mock-blueviolet.svg)](https://ollama.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📖 1. Project Overview & Motivation

**Emergent Nations** is an AI society experiment inspired by the territorial gameplay of *Risk* and the strategic depth of *Civilization*. 

Unlike conventional strategy games, there are **no human-controlled factions**. Every civilization is governed by an independent autonomous AI agent that believes it is the sovereign ruler of its nation.

The human user is an **omniscient spectator** observing the world unfold in real time:
- Civilizations expand, trade resources, form alliances, make promises, and coordinate invasions.
- They possess distinct starting personalities (e.g., **Opportunist**, **Altruist**, **Skeptic**).
- Relationships evolve dynamically over time based on historical memories and subjective beliefs.
- **No fixed victory condition:** Nations pursue survival and prosperity, exploring whether cooperation, conflict, or coalitions emerge organically.

---

## 🛠️ 2. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18, TypeScript, Vite, Lucide Icons | Responsive spectator dashboard & interactive 2D map |
| **Backend** | Python 3.11+, FastAPI, Pydantic v2, Uvicorn | Deterministic game engine, phase orchestration, API |
| **Persistence** | SQLite / JSON Snapshots | Turn state archiving, timeline scrub, event logging |
| **AI / Inference** | Ollama (Qwen3 8B / 4B) + Deterministic Mock Agents | Free local AI execution with zero API cost |
| **Contracts** | Shared Pydantic Models & TypeScript Interfaces | Single source of truth across all components |
| **Testing & CI** | Pytest, AsyncIO, GitHub Actions | Automated regression and schema validation |

---

## 🏛️ 3. System Architecture

```text
                           SPECTATOR BROWSER
                                   │
                      React + TypeScript Dashboard
                                   │  HTTP / REST
                      FastAPI Backend Server (:8000)
                                   │
                        Simulation Orchestrator
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │                         │                         │
    Game Engine             AI Agent Adapter          Diplomacy & Memory
  - Adjacency & Yields    - Ollama (Local Qwen3)    - Natural Lang Messages
  - Dice Combat           - MockScriptedAgent       - Privacy Filtering
  - Attrition & Upkeep    - Observation Filtering   - Treaties & Decaying Memory
         │                         │                         │
         └─────────────────────────┼─────────────────────────┘
                                   │
                           Persistence Layer
                       (SQLite / Snapshots / Logs)
```

---

## 📂 4. Repository Structure

```text
AI-society-game/
├── README.md                      # Primary project documentation
├── CONTRIBUTING.md                # Quickstart and PR contribution guide
├── pyproject.toml                 # Root Python project & pytest configuration
├── .gitignore                     # Git ignore rules (no secrets/weights)
├── .env.example                   # Environment variable template
│
├── frontend/                      # React + TypeScript + Vite spectator dashboard
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── src/
│   │   ├── components/            # Header, TerritoryMap, CivilizationList, EventFeed, Controls
│   │   ├── services/api.ts        # FastAPI backend client with offline fallback
│   │   ├── types/contracts.ts     # TypeScript interfaces mirroring backend contracts
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── public/
│
├── backend/                       # FastAPI simulation server & game logic
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py                # FastAPI entry point & CORS configuration
│   │   ├── config.py              # Environment settings (Pydantic Settings)
│   │   ├── orchestrator.py        # 5-phase simulation turn state machine
│   │   ├── api/routes.py          # REST endpoints (/health, /world/state, /step, /reset)
│   │   ├── engine/base.py         # Deterministic game rules, upkeep, and combat
│   │   ├── agents/base.py         # MockScriptedAgent & OllamaAgentAdapter
│   │   ├── diplomacy/base.py      # Message routing, whispers, and treaties
│   │   ├── memory/base.py         # Historical facts, beliefs, and memory decay
│   │   ├── persistence/base.py    # Snapshots and event logs
│   │   └── schemas/contracts.py   # Authoritative Pydantic models
│   └── tests/                     # Pytest suite (health, contracts, simulation steps)
│
├── contracts/                     # Version-controlled schemas & interfaces
│   ├── README.md
│   ├── types.ts                   # Exported TypeScript contracts
│   └── schemas/                   # Exported JSON Schemas for validation
│
├── fixtures/                      # Sample data for offline development
│   ├── sample_world.json          # 36 territories, 6 nations starting state
│   ├── sample_events.json         # Example chronological event stream
│   └── sample_decisions.json      # Example agent decision payloads
│
├── docs/                          # Detailed technical documentation
│   ├── ARCHITECTURE.md            # Detailed system architecture
│   ├── GAME_RULES.md              # Complete mechanics, costs, combat math
│   ├── AI_INTEGRATION.md          # Ollama setup, prompts, and M2 benchmarks
│   ├── TEAM_WORKFLOW.md           # Collaboration and branch guidelines
│   ├── DECISIONS.md               # Architecture Decision Records (ADRs)
│   └── ROADMAP.md                 # Milestones from Phase 0 to Phase 5
│
├── scripts/                       # Developer automation scripts
│   ├── setup_dev.sh               # One-command virtualenv & npm setup
│   ├── run_backend.sh             # Launch FastAPI server
│   ├── run_frontend.sh            # Launch Vite dev server
│   └── generate_fixtures_and_contracts.py # Schema & fixture synchronizer
│
└── .github/                       # GitHub automation
    ├── workflows/ci.yml           # Automated CI testing
    └── ISSUE_TEMPLATE/            # Bug report and feature request templates
```

---

## 👥 5. Five-Person Team Responsibility Areas

| Team Member | Core Focus Area | Deliverables |
|---|---|---|
| **Julian** | **Local AI & Models** | Ollama integration, Qwen3 prompts, request queue, inference latency benchmarks on M2 Mac |
| **Ethan** | **UI & Spectator Dashboard** | Risk-style 2D map visualization, nation inspection sidebar, timeline replay slider |
| **Liza** | **World Platform & Engine** | Procedural territory graph, resource production, food upkeep, combat dice system |
| **Teammate 4** | **Diplomacy & Memory** | Public/private message routing, formal treaties, memory decay & summaries |
| **Teammate 5** | **Backend Integration & Persistence** | FastAPI orchestration, SQLite storage, testing infrastructure, CI/CD |

---

## 🚀 6. Quick Start & Installation

### Prerequisites
- **Python 3.11+**
- **Node.js 18+** and **npm**

### Step 1: Clone the Repository
```bash
git clone https://github.com/juko04/AI-society-game.git
cd AI-society-game
```

### Step 2: Run Automated Setup
```bash
./scripts/setup_dev.sh
```
This script:
1. Creates a Python virtual environment in `backend/.venv`
2. Installs backend dependencies (`fastapi`, `uvicorn`, `pydantic`, `pytest`, `httpx`)
3. Validates and generates JSON schemas and fixtures
4. Installs frontend npm packages (`react`, `typescript`, `vite`, `lucide-react`)

### Step 3: Launch the Backend Server
```bash
./scripts/run_backend.sh
```
The FastAPI backend starts on **`http://127.0.0.1:8000`**.  
Interactive Swagger documentation is available at **`http://127.0.0.1:8000/docs`**.

### Step 4: Launch the Spectator Frontend
In a second terminal window:
```bash
./scripts/run_frontend.sh
```
The React spectator dashboard will open at **`http://localhost:5173`**.

---

## 🧪 7. Running Automated Tests

Run the full verification suite before committing:

```bash
# Run backend Python tests (health, contracts, and simulation stepping)
backend/.venv/bin/pytest backend/tests

# Run frontend TypeScript type-checking and production build
cd frontend && npm run build && cd ..
```

---

## 🤖 8. Connecting Local AI (Ollama)

By default, the simulation runs in **Mock AI Mode** (`USE_MOCK_AGENTS=true`), meaning **no local model or API key is required** for development. Teammates can build and test immediately on any computer.

When ready to test live local LLMs on an Apple Silicon M2 Mac:
1. Install [Ollama](https://ollama.com): `brew install ollama`
2. Pull the model: `ollama pull qwen2.5:7b` (or `qwen3:8b` when available)
3. Set `USE_MOCK_AGENTS=false` in `.env`
4. Restart the backend. See [docs/AI_INTEGRATION.md](docs/AI_INTEGRATION.md) for full instructions.

---

## 🔄 9. Phased Turn Cycle

The simulation executes a 5-phase simultaneous strategic loop:

```text
[1. World Update] ──> [2. Diplomacy] ──> [3. Strategic Decisions] ──> [4. Resolution] ──> [5. History & Memory]
   (Yields, Upkeep,        (Public Broadcasts,      (Simultaneous Orders     (Combat Dice, Moves,     (Snapshots, Memory Decay,
     Famine Attrition)      Private Whispers)        Submitted by AI)          Territory Transfers)     Turn Advances +1)
```

1. **`world_update`:** Adds territory yields (+5g, +4f). Armies consume food (1 food per 4 units). Food deficit triggers famine attrition.
2. **`diplomacy`:** AI civilizations exchange public statements or private diplomatic messages.
3. **`strategic_decisions`:** Each AI submits up to 2 strategic orders without knowing opponents' moves.
4. **`resolution`:** Engine validates actions, handles moves, executes developments, and resolves dice combat.
5. **`history_memory`:** World state snapshot saved, memories updated, turn advances.

---

## 🗺️ 10. Roadmap & Current Status

- **Phase 0: Project Foundation** — ✅ **COMPLETE**
  - Modular decoupled architecture established.
  - Shared contracts synchronized across Python & TypeScript.
  - Backend and Frontend connected and verified.
  - All automated tests passing.
- **Phase 1: Deterministic Game Platform** — 🔄 *Next Up (Liza)*
- **Phase 2: Local AI & Ollama Integration** — 🔄 *Next Up (Julian)*
- **Phase 3: Diplomacy & Dynamic Memory** — 🔄 *Next Up (Dev 4)*
- **Phase 4: Spectator Dashboard & Map Visualization** — 🔄 *Next Up (Ethan)*
- **Phase 5: Emergence Experiments & Society Analysis** — ⏳ *Scheduled*

See [docs/ROADMAP.md](docs/ROADMAP.md) for detailed deliverables.

---

## 🤝 11. Git & Collaboration Guidelines

- Always create a short-lived branch from `main`: `git checkout -b feature/your-feature`
- Never commit secrets, `.env` files, or `.venv/`
- Before opening a PR, ensure backend pytest and frontend build pass
- Open a Pull Request on GitHub and request a review from a teammate

See [docs/TEAM_WORKFLOW.md](docs/TEAM_WORKFLOW.md) and [docs/DECISIONS.md](docs/DECISIONS.md) for full guidelines.
