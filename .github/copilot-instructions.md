# GitHub Copilot Instructions for Emergent Nations

Welcome, Copilot.
When assisting developers in this repository:

1. **Check `AGENTS.md`**: Refer to `AGENTS.md` at the project root for full design memory, prime directives, and architecture.
2. **Support User Intent**: If the developer asks for a simpler model, a 3-agent setup (Opportunist, Altruist, Skeptic), or a different mechanic, prioritize their prompt immediately.
3. **Preserve Modularity**: When fulfilling simplifications, configure components or add options rather than breaking core backend/frontend architecture.
4. **Decoupled Architecture**: Frontend (`frontend/`) visualizes game state; Backend (`backend/`) authoritatively executes simulation logic.
5. **Testing**: Always ensure `backend/.venv/bin/pytest backend/tests` and `npm run build` in `frontend/` remain passing.
