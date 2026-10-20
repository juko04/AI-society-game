// AI NOTICE: Before modifying this project, read AGENTS.md for architecture, flexibility, and collaboration guidelines.
import { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { SimulationControls } from './components/SimulationControls';
import { CivilizationList } from './components/CivilizationList';
import { TerritoryMap } from './components/TerritoryMap';
import { EventFeed } from './components/EventFeed';
import { NationInspector } from './components/NationInspector';
import {
  fetchHealth,
  fetchWorldState,
  fetchEvents,
  stepSimulation,
  resetSimulation,
} from './services/api';
import { WorldState, GameEvent } from './types/contracts';

// Fallback fixture if backend is offline
import sampleWorldFixture from '../../fixtures/sample_world.json';
import sampleEventsFixture from '../../fixtures/sample_events.json';

export function App() {
  const [worldState, setWorldState] = useState<WorldState>(sampleWorldFixture as unknown as WorldState);
  const [events, setEvents] = useState<GameEvent[]>(sampleEventsFixture as unknown as GameEvent[]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [mockAiEnabled, setMockAiEnabled] = useState<boolean>(true);
  const [selectedNationId, setSelectedNationId] = useState<string | null>(null);
  const [selectedTerritoryId, setSelectedTerritoryId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);

  const autoPlayRef = useRef<number | null>(null);

  // Load initial backend state
  const loadData = useCallback(async () => {
    try {
      const health = await fetchHealth();
      setIsConnected(true);
      setMockAiEnabled(health.mock_ai_enabled);

      const [state, evts] = await Promise.all([
        fetchWorldState(),
        fetchEvents(50),
      ]);
      setWorldState(state);
      setEvents(evts);
    } catch {
      // Backend not running; keep offline indicator and local fixture
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Step single phase
  const handleStepPhase = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      if (isConnected) {
        const res = await stepSimulation(false);
        setWorldState(res.world_state);
        setEvents((prev) => [...prev, ...res.new_events]);
      } else {
        // Local simulation fallback
        alert('Backend is offline. Start the backend with ./scripts/run_backend.sh to advance live simulation.');
      }
    } catch (err) {
      console.error('Failed to step phase:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Step full turn cycle
  const handleStepTurn = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      if (isConnected) {
        const res = await stepSimulation(true);
        setWorldState(res.world_state);
        setEvents((prev) => [...prev, ...res.new_events]);
      } else {
        alert('Backend is offline. Start the backend with ./scripts/run_backend.sh to advance live simulation.');
      }
    } catch (err) {
      console.error('Failed to step turn:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset simulation
  const handleReset = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setIsAutoPlaying(false);
    try {
      if (isConnected) {
        const freshState = await resetSimulation();
        setWorldState(freshState);
        const evts = await fetchEvents(50);
        setEvents(evts);
      } else {
        setWorldState(sampleWorldFixture as unknown as WorldState);
        setEvents(sampleEventsFixture as unknown as GameEvent[]);
      }
    } catch (err) {
      console.error('Failed to reset:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Auto-play toggle
  const handleTogglePlay = () => {
    setIsAutoPlaying((prev) => !prev);
  };

  useEffect(() => {
    if (isAutoPlaying && isConnected) {
      autoPlayRef.current = window.setInterval(async () => {
        try {
          const res = await stepSimulation(false);
          setWorldState(res.world_state);
          setEvents((prev) => [...prev, ...res.new_events]);
        } catch {
          setIsAutoPlaying(false);
        }
      }, 1500);
    } else {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
        autoPlayRef.current = null;
      }
    }
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isAutoPlaying, isConnected]);

  const nationsList = Object.values(worldState.nations || {});
  const territoriesList = Object.values(worldState.territories || {});
  const selectedNation = selectedNationId ? worldState.nations[selectedNationId] || null : null;

  return (
    <div className="app-container">
      <Header
        isConnected={isConnected}
        mockAiEnabled={mockAiEnabled}
        turn={worldState.turn}
        phase={worldState.phase}
      />

      <SimulationControls
        isPaused={!isAutoPlaying}
        onTogglePlay={handleTogglePlay}
        onStepPhase={handleStepPhase}
        onStepTurn={handleStepTurn}
        onReset={handleReset}
        seed={worldState.seed}
        isProcessing={isProcessing}
      />

      <main className="dashboard-grid">
        <CivilizationList
          nations={nationsList}
          selectedNationId={selectedNationId}
          onSelectNation={(id) => setSelectedNationId(id === selectedNationId ? null : id)}
        />

        <TerritoryMap
          territories={territoriesList}
          nations={worldState.nations}
          selectedTerritoryId={selectedTerritoryId}
          onSelectTerritory={(id) => setSelectedTerritoryId(id === selectedTerritoryId ? null : id)}
        />

        <EventFeed events={events} />
      </main>

      <NationInspector
        nation={selectedNation}
        onClose={() => setSelectedNationId(null)}
      />
    </div>
  );
}

export default App;
