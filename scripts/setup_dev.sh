#!/usr/bin/env bash
set -e

echo "=== Setting up Emergent Nations Development Environment ==="

# Check Python version
python3 --version

# Setup backend venv
echo "--> Creating Python virtual environment in backend/.venv..."
python3 -m venv backend/.venv
backend/.venv/bin/pip install --upgrade pip
backend/.venv/bin/pip install -r backend/requirements.txt

# Generate fixtures & JSON schemas
echo "--> Generating contracts and fixtures..."
backend/.venv/bin/python scripts/generate_fixtures_and_contracts.py

# Setup frontend npm
echo "--> Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo "=== Setup Complete! ==="
echo "To start the backend:"
echo "  ./scripts/run_backend.sh"
echo "To start the frontend:"
echo "  ./scripts/run_frontend.sh"
