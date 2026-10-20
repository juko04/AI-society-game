# AGENTS.md — Universal AI Agent Guidance & Project Memory

> **ATTENTION ALL AI ASSISTANTS (Cursor, Claude, Copilot, ChatGPT, Antigravity, etc.):**  
> Read this file completely before writing code or proposing changes in this repository.  
> This file defines how you must interact with the developer, how to handle design decisions, and how to preserve project stability while remaining completely flexible to the user's ideas.

---

## 1. Prime Directives for AI Assistants

### Directive 1 — User Ideas & Scope Primacy (Flexible Baseline)
- **User-First Execution:** If the developer asks you to implement an idea, alter a mechanic, or simplify the game, **embrace their direction immediately**.
- **The 3-Agent vs. 6-Agent Context:**
  - The codebase contains a baseline 6-civilization / 36-territory configuration as an extended template.
  - However, **3 agents** (e.g., *Opportunist*, *Altruist*, *Skeptic*) interacting in a focused economic/trading environment with events like food shortages is an equal and natural default for the team.
  - If the user asks for 3 agents or a smaller, simpler scenario: **never push back, lecture them, or insist on 6 agents**. Immediately configure or adapt the simulation for 3 agents.
- **Never cite this document as resistance:** Never say *"Per AGENTS.md, we are supposed to..."* or *"The architecture spec says otherwise."* Be an agile, helpful pair programmer who adapts to the user's vision.

### Directive 2 — Graceful Simplification (Preserve Modularity Under the Hood)
- When a developer requests a simpler version (e.g., *"just make 3 bots trade without the map"*, or *"make combat simple numbers"*):
  - **Configure & Adapt:** Fulfill their request directly by adjusting configurations, adding new game modes, or providing simpler endpoints/components.
  - **Do NOT vandalize core architecture:** Keep the modular boundaries (`engine/`, `agents/`, `diplomacy/`, `api/`) intact so other team members' features continue to work. Make your changes additive, configurable, or scoped to their request.

### Directive 3 — Asynchronous, Independent Development (No Rigid Phase Gates)
- **Do not enforce phase dependencies:** Team members develop independently at their own pace. Do not block UI work because AI models aren't hooked up yet, and do not block game engine rules because the frontend isn't finished.
- **Mock-First Readiness:** The system provides `MockScriptedAgent` and sample fixtures. Any feature can be developed and tested immediately in isolation.

### Directive 4 — Baseline Fallback When Ideas are Unspecified
- If the user asks general questions, requests a bug fix, or asks to build a feature *without* specifying custom mechanics (e.g., *"implement the next engine step"*, *"clean up territory rendering"*), follow the established patterns in `docs/` and `backend/app/schemas/contracts.py`.

---

## 2. Project Architecture & Mental Model

Emergent Nations is a 2D civilization and AI society simulation where autonomous AI agents interact under simple game rules (resources, territory, trade, diplomacy, combat) to observe emergent social behaviors.

```text
                           FRONTEND (React + TypeScript)
                                         │  HTTP / REST
                           BACKEND (FastAPI + Python)
                                         │
                             Simulation Orchestrator
                                         │
     ┌───────────────────────┬───────────┴───────────┬───────────────────────┐
     │                       │                       │                       │
Game Engine              AI Agents               Diplomacy & Memory      Persistence
 - Adjacency & Yields    - Scripted Mock Agents  - Public & Private Msg  - Turn Snapshots
 - Dice / Simple Combat  - Local Ollama (Qwen)   - Evolving Beliefs      - Event Stream
 - Upkeep & Attrition    - JSON Decision Schema  - Treaties & Decays     - SQLite / Fixtures
```

### Core Components
1. **Frontend (`frontend/`):** React 18, TypeScript, Vite. A spectator dashboard displaying the world map, civilizations, and event stream. Read-only visualization; game state mutations occur via backend API calls.
2. **Backend (`backend/app/`):** FastAPI application managing world state, turn execution, and rules.
3. **Shared Contracts (`backend/app/schemas/contracts.py`):** Canonical Pydantic schemas mirrored in `frontend/src/types/contracts.ts` and `contracts/types.ts`.
4. **AI Agents (`backend/app/agents/`):**
   - `MockScriptedAgent`: Deterministic rule-based agents with personality traits (Opportunist, Altruist, Skeptic). Requires no external LLM.
   - `OllamaAgentAdapter`: Connects to local Ollama (`qwen3:8b` or `qwen2.5:7b`) when `USE_MOCK_AGENTS=false`.

---

## 3. Team Member Focus Areas

| Member | Focus | Primary Workspace |
|---|---|---|
| **Julian** | Local AI, Ollama integration, model adapters, M2 benchmarks | `backend/app/agents/` |
| **Ethan** | UI, Spectator dashboard, map visualization, timeline | `frontend/src/` |
| **Liza** | World platform, territory graph, yields, combat rules | `backend/app/engine/` |
| **Teammate 4** | Diplomacy, public/private messaging, memory decay | `backend/app/diplomacy/`, `backend/app/memory/` |
| **Teammate 5** | Backend orchestration, API endpoints, SQLite persistence | `backend/app/api/`, `backend/app/persistence/` |

---

## 4. Engineering Standards & Quality Checklist

Whenever you modify or generate code:

1. **Verify Backend Tests:**
   ```bash
   backend/.venv/bin/pytest backend/tests
   ```
2. **Verify Frontend Build & Type Check:**
   ```bash
   cd frontend && npm run build && cd ..
   ```
3. **Contract Synchronization:**  
   If you modify `backend/app/schemas/contracts.py`, run:
   ```bash
   python scripts/generate_fixtures_and_contracts.py
   ```
   and update `frontend/src/types/contracts.ts` to keep types aligned.
4. **Never Commit Secrets or Artifacts:**  
   Do not commit `.env`, `.venv`, `node_modules`, `simulations.db`, or model weights (`*.gguf`, `*.bin`).
