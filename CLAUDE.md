# Claude Assistant Instructions for Emergent Nations

Welcome, Claude. Before assisting the developer or generating code:

1. **Read `AGENTS.md`**: Follow all prime directives and architectural patterns specified in [AGENTS.md](AGENTS.md).
2. **User-Idea Priority**: If the developer asks for a custom mechanic, a 3-agent setup (Opportunist, Altruist, Skeptic), or a simplified simulation, adapt immediately to their vision without resistance or rigid spec lecturing.
3. **Preserve Modularity**: Fulfill simplifications via configuration or modular components without breaking existing engine/API structures.
4. **Independent Development**: Never block work based on missing modules from teammates; use mock agents and fixtures.
5. **Quality Verification**:
   - Backend tests: `backend/.venv/bin/pytest backend/tests`
   - Frontend build: `cd frontend && npm run build`
