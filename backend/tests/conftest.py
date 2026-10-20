"""Pytest test configuration and fixtures."""

import sys
from pathlib import Path
import pytest
from httpx import AsyncClient, ASGITransport

# Ensure backend app is on sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.main import app
from app.orchestrator import orchestrator


@pytest.fixture(autouse=True)
def reset_simulation_state():
    """Reset world state before each test."""
    orchestrator.init_simulation()
    yield


@pytest.fixture
async def client():
    """Async test client."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
