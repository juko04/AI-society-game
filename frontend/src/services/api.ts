import {
  HealthResponse,
  WorldState,
  Nation,
  Territory,
  GameEvent,
  SimulationStepResponse,
} from '../types/contracts';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE_URL}/health`);
  if (!res.ok) {
    throw new Error(`Health check failed: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchWorldState(): Promise<WorldState> {
  const res = await fetch(`${API_BASE_URL}/world/state`);
  if (!res.ok) {
    throw new Error(`Failed to load world state: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchNations(): Promise<Nation[]> {
  const res = await fetch(`${API_BASE_URL}/nations`);
  if (!res.ok) {
    throw new Error(`Failed to load nations: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchTerritories(): Promise<Territory[]> {
  const res = await fetch(`${API_BASE_URL}/territories`);
  if (!res.ok) {
    throw new Error(`Failed to load territories: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchEvents(limit = 50, nationId?: string): Promise<GameEvent[]> {
  const url = new URL(`${API_BASE_URL}/events`, window.location.origin);
  url.searchParams.set('limit', String(limit));
  if (nationId) {
    url.searchParams.set('nation_id', nationId);
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Failed to load events: ${res.statusText}`);
  }
  return res.json();
}

export async function stepSimulation(fullTurn = false): Promise<SimulationStepResponse> {
  const res = await fetch(`${API_BASE_URL}/simulation/step`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ full_turn: fullTurn }),
  });
  if (!res.ok) {
    throw new Error(`Failed to step simulation: ${res.statusText}`);
  }
  return res.json();
}

export async function resetSimulation(): Promise<WorldState> {
  const res = await fetch(`${API_BASE_URL}/simulation/reset`, {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error(`Failed to reset simulation: ${res.statusText}`);
  }
  return res.json();
}
