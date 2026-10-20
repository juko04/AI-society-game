# Contributing to Emergent Nations

Thank you for contributing to Emergent Nations! This guide helps you get started quickly and follow our team standards.

---

## Quick Start (Under 3 Minutes)

### Prerequisites
- **Python 3.11+**
- **Node.js 18+** and **npm**
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/juko04/AI-society-game.git
cd AI-society-game
```

### 2. Run Automated Setup
```bash
./scripts/setup_dev.sh
```
This automatically sets up the Python virtual environment in `backend/.venv`, installs all packages, generates schemas, and installs frontend npm packages.

### 3. Start the Backend
```bash
./scripts/run_backend.sh
```
Runs at `http://127.0.0.1:8000` (Interactive API docs at `http://127.0.0.1:8000/docs`).

### 4. Start the Frontend
In a new terminal:
```bash
./scripts/run_frontend.sh
```
Opens the spectator dashboard at `http://localhost:5173`.

---

## Running Automated Tests

Before pushing changes, run the test suite:

```bash
# Python backend tests
backend/.venv/bin/pytest backend/tests

# Frontend build & TypeScript checks
cd frontend && npm run build && cd ..
```

---

## Git Workflow

1. Always branch from `main`:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```
2. Commit small, focused changes with descriptive messages.
3. Push your branch and open a Pull Request on GitHub.
4. Request review from at least one teammate before merging.
