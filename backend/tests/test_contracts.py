"""Tests verifying data contracts across endpoints."""

import pytest
from httpx import AsyncClient
from app.schemas.contracts import WorldState, Nation, Territory, GameEvent


@pytest.mark.asyncio
async def test_get_world_state_contract(client: AsyncClient):
    response = await client.get("/api/world/state")
    assert response.status_code == 200
    state = WorldState.model_validate(response.json())
    assert state.turn >= 1
    assert len(state.nations) == 3
    assert len(state.territories) == 36


@pytest.mark.asyncio
async def test_get_nations_contract(client: AsyncClient):
    response = await client.get("/api/nations")
    assert response.status_code == 200
    nations = [Nation.model_validate(n) for n in response.json()]
    assert len(nations) == 3
    for n in nations:
        assert n.gold >= 0
        assert n.food >= 0
        assert n.military_units > 0
        assert len(n.territory_ids) == 3


@pytest.mark.asyncio
async def test_get_territories_contract(client: AsyncClient):
    response = await client.get("/api/territories")
    assert response.status_code == 200
    territories = [Territory.model_validate(t) for t in response.json()]
    assert len(territories) == 36
    owned = [t for t in territories if t.owner_id is not None]
    neutral = [t for t in territories if t.owner_id is None]
    assert len(owned) == 9 # 3 corner nations * 3 territories = 9 owned
    assert len(neutral) == 27 # 27 neutral


@pytest.mark.asyncio
async def test_update_personality_contract(client: AsyncClient):
    res = await client.post(
        "/api/nations/nation_solaria/personality",
        json={"personality": "Aggressive"},
    )
    assert res.status_code == 200
    nation = Nation.model_validate(res.json())
    assert nation.personality == "Aggressive"


@pytest.mark.asyncio
async def test_get_events_contract(client: AsyncClient):
    response = await client.get("/api/events")
    assert response.status_code == 200
    events = [GameEvent.model_validate(e) for e in response.json()]
    assert len(events) > 0
