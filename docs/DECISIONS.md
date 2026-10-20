# Emergent Nations - Architecture & Game Design Decisions (ADRs)

> **Important Note for the Team:**  
> The specifications provided in the initial draft represent proposals and architectural suggestions, not unchangeable dogma. This document tracks confirmed agreements, working hypotheses, and open questions undergoing team consensus.

---

## Decision Log

### ADR-001: Technology Stack — React/Vite/TS + FastAPI vs Streamlit
- **Context:** The team brainstormed using Streamlit for quick prototyping, while the extended technical proposal suggested React + Vite + TypeScript for a richer 2D map spectator dashboard and FastAPI for game simulation.
- **Decision for Phase 0:** We have established the decoupled **FastAPI + React/Vite/TS** architecture.
- **Rationale:** 
  1. Complete separation of authoritative simulation logic from visual presentation.
  2. Ethan (UI lead) can develop and polish interactive 2D map views and animations without touching Python backend code.
  3. Liza (World platform lead) can develop deterministic simulation rules in pure Python with fast unit tests.
  4. Streamlit or simple python scripts can still connect directly to the FastAPI endpoints if rapid testing is desired.
- **Status:** Adopted for foundation; modular and decoupled.

---

### ADR-002: Number of Civilizations — 3 vs 6 Agents
- **Context:** Early brainstorm slides proposed starting with **3 agents** (e.g., Opportunist, Altruist, Skeptic) to study trade and food shortages simply. The extended proposal suggests **6 civilizations** across 36 territories.
- **Working Agreement:** 
  - The engine and contracts support configurable `nation_count` (defaults to 6, fully functional with 3 or any count).
  - Starting personality archetypes (Opportunist, Altruist, Skeptic) are supported in both 3-player and 6-player configurations.
  - Initial tests can run with 3 agents for faster prompt iteration, then scale to 6.
- **Status:** Configurable via `SimulationConfig.nation_count`.

---

### ADR-003: AI Model Execution — Local Ollama with Deterministic Mock Fallback
- **Context:** Team member Julian is the Local AI lead with an Apple Silicon M2 Mac (24GB RAM). Other teammates need to develop their modules (UI, game engine, diplomacy) when Julian's machine is offline or without requiring Ollama installations on every laptop.
- **Decision:**
  - `MockScriptedAgent` provides 100% deterministic, zero-dependency behavior for all teammates.
  - `OllamaAgentAdapter` connects to local Ollama (`qwen3:8b` or `qwen3:4b`) via a unified interface.
  - A simple environment flag (`USE_MOCK_AGENTS=true`) toggles between mock agents and live LLM inference.
- **Status:** Implemented and verified in Phase 0.

---

### ADR-004: Game Victory Condition — Open-Ended Emergence vs Fixed Win
- **Context:** Traditional strategy games require elimination or score conquest. The research goal is observing emergent social, economic, and diplomatic dynamics.
- **Decision:** The simulation runs without a hardcoded win condition. Nations pursue survival, resource security, and diplomatic goals. The spectator can pause, observe, or inspect world state at any turn.
- **Status:** Adopted.

---

### ADR-005: Turn Structure — 5 Phased Simultaneous Resolution
- **Phases:**
  1. `world_update`: Resource generation, upkeep, food shortage / famine attrition.
  2. `diplomacy`: AI natural-language messaging (public announcements & private whispers).
  3. `strategic_decisions`: AIs submit up to 2 strategic orders simultaneously without seeing opponent orders.
  4. `resolution`: Backend resolves movements, resource transfers, developments, and dice-based combat.
  5. `history_memory`: Turn snapshot archived, long-term memory updated, turn advances.
- **Status:** Adopted in engine and orchestrator.

---

## Open Design Questions for Team Review

1. **Combat Dice Randomness vs Determinism:** Should dice rolls use backend seeds (current implementation) or deterministic combat based purely on unit numbers and terrain?
2. **Resource Scarcity Events:** When and how should external crisis events (e.g., sudden food shortage or gold rush) be introduced?
3. **Agent Deception Detection:** How explicitly should the game track broken promises (formal treaty violations vs informal verbal claims)?
4. **Spectator Intervention:** Should human users only observe, or should an "intervention mode" allow introducing crises or modifying territory resources in real-time?
