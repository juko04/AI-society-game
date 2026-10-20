#!/usr/bin/env bash
set -e

# Run backend with uvicorn
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR/backend"

if [ -f ".venv/bin/uvicorn" ]; then
    PYTHON_EXEC=".venv/bin/python"
    UVICORN_EXEC=".venv/bin/uvicorn"
else
    PYTHON_EXEC="python3"
    UVICORN_EXEC="uvicorn"
fi

echo "Starting Emergent Nations Backend on http://127.0.0.1:8000 (Docs at /docs)..."
exec "$UVICORN_EXEC" app.main:app --host 127.0.0.1 --port 8000 --reload
