# Emergent Nations - Team Collaboration & Workflow Guide

Welcome to the **Emergent Nations** project! This guide explains how our 5-person team collaborates using Git, GitHub, shared contracts, and automated testing.

---

## 1. Team Responsibility Areas

| Team Member | Role Focus | Primary Code Directories |
|---|---|---|
| **Julian** | **Local AI & Models** | `backend/app/agents/`, `docs/AI_INTEGRATION.md` |
| **Ethan** | **UI & Spectator Dashboard** | `frontend/src/` |
| **Liza** | **World Platform & Game Engine** | `backend/app/engine/`, `docs/GAME_RULES.md` |
| **Dev 4** | **Diplomacy & Memory System** | `backend/app/diplomacy/`, `backend/app/memory/` |
| **Dev 5** | **Backend Integration & Persistence** | `backend/app/api/`, `backend/app/persistence/`, `backend/tests/` |

> *Note: These are focus areas, not silos! We encourage pair programming, code reviews, and cross-functional feedback.*

---

## 2. Git Branching Strategy

- **`main`**: The primary stable integration branch. Must always build, pass tests, and run cleanly.
- **Feature Branches**: Every task or experiment should have its own branch created from `main`:
  - `feature/territory-graph-liza`
  - `feature/qwen-prompts-julian`
  - `feature/map-svg-ethan`
  - `feature/diplomacy-routing-dev4`
  - `feature/sqlite-persistence-dev5`

### Creating a Feature Branch
```bash
git checkout main
git pull origin main
git checkout -b feature/my-new-feature
```

### Committing Changes
Write descriptive, modular commit messages:
```bash
git add backend/app/engine/base.py
git commit -m "feat(engine): add food shortage attrition calculation"
```

### Pushing and Opening a Pull Request (PR)
```bash
git push -u origin feature/my-new-feature
```
Open a Pull Request on GitHub against `main`. At least one teammate should review and approve before merging.

---

## 3. Working with Shared Contracts

Our shared data contracts in `backend/app/schemas/contracts.py` are the single source of truth across all systems.

**Golden Rule:** Never edit `contracts/types.ts` or `contracts/schemas/` manually!

If you need a new field (e.g., adding `weather` to `Territory` or `gold_offered` to `GameAction`):
1. Propose the change in team chat or create an issue.
2. Update `backend/app/schemas/contracts.py`.
3. Run the generator script:
   ```bash
   python scripts/generate_fixtures_and_contracts.py
   ```
4. Copy updated types into `frontend/src/types/contracts.ts` (or let the generator do it).
5. Run tests:
   ```bash
   backend/.venv/bin/pytest backend/tests
   cd frontend && npm run build
   ```

---

## 4. Pre-Commit / Pre-PR Checklist

Before opening a pull request, run these three quick commands locally:

```bash
# 1. Run Python backend tests
backend/.venv/bin/pytest backend/tests

# 2. Check Frontend TypeScript build
cd frontend && npm run build && cd ..

# 3. Check Git status (ensure no .env or .db files are staged)
git status
```

---

## 5. What NEVER to Commit
- ❌ `.env` files containing any secret keys.
- ❌ Python virtual environments (`.venv/`, `venv/`).
- ❌ Node modules (`node_modules/`).
- ❌ Local database files (`simulations.db`, `*.sqlite`).
- ❌ Large model weights (`*.gguf`, `*.bin`, `*.safetensors`).
- ❌ OS cache (`.DS_Store`, `Thumbs.db`).

The `.gitignore` is already pre-configured to ignore these automatically.
