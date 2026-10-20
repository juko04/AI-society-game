# Emergent Nations — Modular Development Tracks & Milestones

> **Asynchronous Development Principle:**  
> These tracks are **independent and parallel**. Team members develop features at their own pace without waiting on or blocking other modules. Mock agents, sample fixtures, and flexible configs allow any track to be built, tested, and iterated immediately.

---

## 🏗️ Core Shared Foundation (Ready)
- [x] Repository directory structure established (FastAPI backend + React Vite frontend).
- [x] Shared Pydantic schemas and TypeScript data contracts (`Nation`, `Territory`, `GameAction`, `WorldState`, etc.).
- [x] JSON Schemas exported to `contracts/schemas/`.
- [x] Baseline fixtures: 36 territories, flexible for both 3-agent and 6-agent setups (`fixtures/sample_world.json`).
- [x] Baseline deterministic game engine with yields, food upkeep, attrition, and combat dice.
- [x] Scripted Mock AI agents with distinct archetypes (Opportunist, Altruist, Skeptic).
- [x] Spectator dashboard UI connecting to live backend endpoints.
- [x] Automated test suite passing with `pytest` and `tsc`.
- [x] Universal AI agent memory guide (`AGENTS.md`).

---

## ⚔️ Track A: World Platform & Game Engine (Liza)
*Can be developed and tested purely in Python via `backend/app/engine/` and unit tests.*
- [ ] Procedural territory graph generator with configurable seeds.
- [ ] Configurable 3-agent and 6-agent starting scenarios.
- [ ] Terrain yield variations (mountains, rivers, fertile plains).
- [ ] Refined combat resolution and multi-attacker rules.
- [ ] Unit movement and garrison logistics.

---

## 🧠 Track B: Local AI & Model Integration (Julian)
*Can be developed and benchmarked independently via `backend/app/agents/`.*
- [ ] Active Ollama HTTP connection in `OllamaAgentAdapter`.
- [ ] Structured prompt formatting for Qwen3 / Qwen2.5.
- [ ] JSON response schema enforcement and retry logic.
- [ ] Sequential inference queue manager for Apple Silicon M2 Mac (24 GB).
- [ ] Latency and token generation benchmarks.

---

## 🎨 Track C: Spectator Dashboard & Map Visualization (Ethan)
*Can be developed and styled independently in `frontend/` using mock backend or local fixtures.*
- [ ] Interactive polygonal / SVG Risk-style map with animated unit transfers.
- [ ] Timeline scrub and turn replay bar.
- [ ] Chat message feed with whisper animations and treaty indicators.
- [ ] Comparative analytics charts (wealth distribution, military power over time).
- [ ] Simulation speed slider and responsive controls.

---

## 📜 Track D: Diplomacy & Dynamic Memory (Teammate 4)
*Can be developed independently in `backend/app/diplomacy/` and `backend/app/memory/`.*
- [ ] Multi-agent negotiation rounds and trade proposals.
- [ ] Formal treaty tracking (Non-aggression, Trade Pacts, Alliances).
- [ ] Automated treaty violation detection (betrayal tracking).
- [ ] Three-tier memory architecture (Facts, Beliefs, Recent Context).
- [ ] Memory summarization and decay for long-running simulations.

---

## 🔌 Track E: Backend Integration & Persistence (Teammate 5)
*Can be developed independently in `backend/app/api/` and `backend/app/persistence/`.*
- [ ] SQLite database connection for long-term simulation storage.
- [ ] Simulation export/import endpoints (JSON/SQLite).
- [ ] Event filtering and advanced query endpoints.
- [ ] WebSocket streaming for real-time live events.

---

## 🔬 Autonomous Society Experiments (Collaborative)
- [ ] 3-agent focused experiment: Opportunist vs. Altruist vs. Skeptic under food shortage.
- [ ] 6-nation extended territorial experiment.
- [ ] Emergence observations (coalitions, trade networks, betrayal, peace treaties).
