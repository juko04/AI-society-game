#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR/frontend"

echo "Starting Emergent Nations Spectator Dashboard on http://localhost:5173..."
exec npm run dev
