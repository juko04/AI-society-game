"""Tests for advancing the simulation through phases and full turns."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_step_simulation_single_phase(client: AsyncClient):
    response = await client.post("/api/simulation/step", json={"full_turn": False})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["previous_phase"] == "world_update"
    assert data["current_phase"] == "diplomacy"


@pytest.mark.asyncio
async def test_step_simulation_full_turn(client: AsyncClient):
    # Step full 5-phase turn
    response = await client.post("/api/simulation/step", json={"full_turn": True})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["current_turn"] == 2
    assert len(data["new_events"]) > 0

    # Verify event stream contains events
    events_res = await client.get("/api/events")
    assert events_res.status_code == 200
    assert len(events_res.json()) > 0
