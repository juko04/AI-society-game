# Emergent Nations - Project Roadmap & Milestones

---

## 🎯 Phase 0: Project Foundation (Current - COMPLETE)
- [x] Repository directory structure established (FastAPI backend + React Vite frontend).
- [x] Shared Pydantic schemas and TypeScript data contracts (`Nation`, `Territory`, `GameAction`, `WorldState`, etc.).
- [x] JSON Schemas exported to `contracts/schemas/`.
- [x] 36-territory world fixture with 6 civilizations (`fixtures/sample_world.json`).
- [x] Baseline deterministic game engine with production, army food upkeep, attrition, and combat dice rolls.
- [x] Scripted Mock AI agents with distinct archetypes (Opportunist, Altruist, Skeptic).
- [x] Spectator dashboard UI connecting to live backend endpoints.
- [x] Automated test suite passing with `pytest` and `tsc`.
- [x] Developer setup scripts and collaboration documentation.

---

## ⚔️ Phase 1: Deterministic Game Platform (Liza Lead)
- [ ] Implement procedural Risk-style territory graph generator with configurable seeds.
- [ ] Add terrain yield variations (mountains, rivers, fertile plains).
- [ ] Refine multi-attacker territorial conflicts and tie-break rules.
- [ ] Add unit transfer logistics and movement limits.
- [ ] Implement 100% test coverage for all combat and attrition edge cases.

---

## 🧠 Phase 2: Local AI & Model Integration (Julian Lead)
- [ ] Implement active Ollama HTTP client in `OllamaAgentAdapter`.
- [ ] Create structured system prompts for Qwen3 / Qwen2.5 models.
- [ ] Implement structured JSON output enforcement (using Ollama format schema or regex repair).
- [ ] Add request queue manager to serialize inference requests on Apple M2 Mac.
- [ ] Benchmark token generation speed, RAM consumption, and turn latency.

---

## 📜 Phase 3: Diplomacy & Dynamic Memory (Dev 4 Lead)
- [ ] Implement 2-round diplomatic negotiation phase.
- [ ] Add formal treaty tracking (Non-aggression, Defense Pact, Trade agreements).
- [ ] Build automated violation detection when a nation attacks a treaty partner.
- [ ] Implement three-tier memory architecture (Historical Facts, Subjective Beliefs, Recent Context).
- [ ] Implement memory summarization and decay for long-running simulations (50+ turns).

---

## 🎨 Phase 4: Spectator Dashboard & Map Visualization (Ethan Lead)
- [ ] Build interactive SVG polygonal Risk-style map with animated unit movements.
- [ ] Implement timeline replay bar: scrub back to inspect historical turn states.
- [ ] Add diplomatic chat message feed with whisper animations and treaty signatures.
- [ ] Create comparative analytics charts (wealth distribution, military power over time).
- [ ] Add simulation speed slider and step controls.

---

## 🔬 Phase 5: Emergence Experiments & Society Analysis (Full Team)
- [ ] Run 100-turn simulation experiment: 6 nations, neutral vs differentiated personalities.
- [ ] Introduce environmental shocks (e.g., regional famine or resource scarcity).
- [ ] Observe and document emergent social structures (coalitions, betrayal, trade networks).
- [ ] Export simulation logs, telemetry, and graphs for presentation.
