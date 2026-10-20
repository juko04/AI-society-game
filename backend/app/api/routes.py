"""FastAPI router exposing simulation state and controls."""

from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel

from app.schemas.contracts import (
    HealthResponse,
    WorldState,
    Nation,
    Territory,
    GameEvent,
    DiplomaticMessage,
    SimulationStepResponse,
)
from app.orchestrator import orchestrator
from app.config import settings

router = APIRouter()


class StepRequest(BaseModel):
    full_turn: bool = False


class PauseRequest(BaseModel):
    is_paused: bool


@router.get("/health", response_model=HealthResponse)
async def get_health():
    """Health status and current environment configuration."""
    world = orchestrator.get_world_state()
    return HealthResponse(
        status="ok",
        app_name=settings.app_name,
        version=settings.version,
        environment=settings.environment,
        mock_ai_enabled=settings.use_mock_agents,
        ai_model=settings.default_ai_model,
        active_simulation_id=world.simulation_id if world else None,
        current_turn=world.turn if world else 1,
    )


@router.get("/world/state", response_model=WorldState)
async def get_world_state():
    """Retrieve full authoritative world state."""
    return orchestrator.get_world_state()


@router.get("/nations", response_model=List[Nation])
async def list_nations():
    """List all civilizations and their active states."""
    world = orchestrator.get_world_state()
    return list(world.nations.values())


@router.get("/territories", response_model=List[Territory])
async def list_territories():
    """List all 36 map territories."""
    world = orchestrator.get_world_state()
    return list(world.territories.values())


@router.get("/events", response_model=List[GameEvent])
async def list_events(
    limit: int = Query(50, ge=1, le=200),
    nation_id: Optional[str] = None,
):
    """Retrieve chronological event stream."""
    events = orchestrator.persistence.events
    if nation_id:
        events = [
            e for e in events
            if e.source_nation_id == nation_id or e.target_nation_id == nation_id
        ]
    return events[-limit:]


@router.get("/messages", response_model=List[DiplomaticMessage])
async def list_messages(
    limit: int = Query(50, ge=1, le=200),
):
    """Retrieve diplomatic communications (omniscient spectator view)."""
    messages = orchestrator.diplomacy.get_spectator_messages()
    return messages[-limit:]


@router.post("/simulation/step", response_model=SimulationStepResponse)
async def step_simulation(request: StepRequest = StepRequest(full_turn=False)):
    """Advance the simulation by one phase or a full 5-phase turn."""
    return await orchestrator.step(full_turn=request.full_turn)


@router.post("/simulation/reset", response_model=WorldState)
async def reset_simulation():
    """Reset the world to initial seed state."""
    return orchestrator.init_simulation()


@router.post("/simulation/pause", response_model=WorldState)
async def set_simulation_pause(request: PauseRequest):
    """Toggle play / pause state."""
    world = orchestrator.get_world_state()
    world.is_paused = request.is_paused
    return world
