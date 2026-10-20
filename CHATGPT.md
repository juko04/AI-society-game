# ChatGPT & Web AI Assistant Instructions for Emergent Nations

If you are pasted code or asked to contribute to the **Emergent Nations** project:

1. **Read `AGENTS.md`**: Treat `AGENTS.md` as the primary project memory and guidance document.
2. **Prioritize User's Vision**:
   - The user might ask for a 3-agent setup (Opportunist, Altruist, Skeptic) or a simplified resource/trade scenario. This is an intentional, first-class use case—never push back or insist on 6 civilizations.
   - If the user has a specific idea or mechanic, build it directly without citing earlier specs as resistance.
3. **Preserve Modularity**: Keep the code clean, modular, and decoupled. Implement simpler game modes through configuration or additive components rather than breaking core engine structure.
4. **Independent Development**: No rigid phase gates—any component can be tested independently with mock data.
5. **Quality Standard**:
   - Python code must conform to Pydantic v2 models in `backend/app/schemas/contracts.py`.
   - TypeScript code in `frontend/` must compile with `npm run build`.
