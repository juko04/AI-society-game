"""Tests for health and welcome endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_root_endpoint(client: AsyncClient):
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["project"] == "Emergent Nations"
    assert data["status"] == "online"


@pytest.mark.asyncio
async def test_health_endpoint(client: AsyncClient):
    response = await client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["mock_ai_enabled"] is True
    assert "version" in data
    assert "current_turn" in data
