// AI NOTICE: Before modifying this project, read AGENTS.md for architecture, flexibility, and collaboration guidelines.
import {
  HealthResponse,
  WorldState,
  Nation,
  Territory,
  GameEvent,
  DiplomaticMessage,
  SimulationStepResponse,
} from '../types/contracts';
import { offlineEngine } from './offlineEngine';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE_URL}/health`);
  if (!res.ok) {
    throw new Error(`Health check failed: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchWorldState(): Promise<WorldState> {
  try {
    const res = await fetch(`${API_BASE_URL}/world/state`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Backend offline; use offline engine
  }
  return offlineEngine.getWorldState();
}

export async function fetchNations(): Promise<Nation[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/nations`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // fallback
  }
  return Object.values(offlineEngine.getWorldState().nations);
}

export async function fetchTerritories(): Promise<Territory[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/territories`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // fallback
  }
  return Object.values(offlineEngine.getWorldState().territories);
}

export async function fetchEvents(limit = 100, nationId?: string): Promise<GameEvent[]> {
  try {
    const url = new URL(`${API_BASE_URL}/events`, window.location.origin);
    url.searchParams.set('limit', String(limit));
    if (nationId) {
      url.searchParams.set('nation_id', nationId);
    }
    const res = await fetch(url.toString());
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // fallback
  }
  return offlineEngine.getEvents(limit, nationId);
}

export async function fetchMessages(limit = 100): Promise<DiplomaticMessage[]> {
  try {
    const url = new URL(`${API_BASE_URL}/messages`, window.location.origin);
    url.searchParams.set('limit', String(limit));
    const res = await fetch(url.toString());
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // fallback
  }
  return offlineEngine.getMessages(limit);
}

export async function stepSimulation(
  fullTurn = false,
  isConnected = false,
  stage?: 'diplomacy' | 'resolution'
): Promise<SimulationStepResponse> {
  if (isConnected) {
    try {
      const res = await fetch(`${API_BASE_URL}/simulation/step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_turn: fullTurn, stage }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Backend step failed, falling back to offline engine', e);
    }
  }
  return offlineEngine.step(fullTurn, stage);
}

export async function resetSimulation(scenario: 'standard' | 'triad' = 'standard', isConnected = false): Promise<WorldState> {
  if (isConnected && scenario === 'standard') {
    try {
      const res = await fetch(`${API_BASE_URL}/simulation/reset`, {
        method: 'POST',
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Backend reset failed, resetting offline engine', e);
    }
  }
  return offlineEngine.reset(scenario);
}
