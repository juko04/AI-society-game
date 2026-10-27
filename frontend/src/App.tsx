import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { SimulationControls } from './components/SimulationControls';
import { CivilizationList } from './components/CivilizationList';
import { TerritoryMap } from './components/TerritoryMap';
import { EventFeed } from './components/EventFeed';
import { NationInspector } from './components/NationInspector';
import { CombatModal } from './components/CombatModal';
import {
  fetchHealth,
  fetchWorldState,
  fetchEvents,
  stepSimulation,
  resetSimulation,
} from './services/api';
import { offlineEngine } from './services/offlineEngine';
import { soundService } from './services/sound';
import { WorldState, GameEvent } from './types/contracts';

// Fallback fixtures
import sampleWorldFixture from '../../fixtures/sample_world.json';
import sampleEventsFixture from '../../fixtures/sample_events.json';

export function App() {
  const [worldState, setWorldState] = useState<WorldState>(sampleWorldFixture as unknown as WorldState);
  const [events, setEvents] = useState<GameEvent[]>(sampleEventsFixture as unknown as GameEvent[]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [selectedNationId, setSelectedNationId] = useState<string | null>(null);
  const [selectedTerritoryId, setSelectedTerritoryId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(soundService.isMuted());
  const [activeCombatEvent, setActiveCombatEvent] = useState<GameEvent | null>(null);
  const [thinkingNation, setThinkingNation] = useState<{ id: string; name: string; leader_name: string; color: string } | null>(null);
  const [thinkingActivity, setThinkingActivity] = useState<string | null>(null);

  // Load initial state
  const loadData = useCallback(async () => {
    try {
      await fetchHealth();
      setIsConnected(true);
      const [state, evts] = await Promise.all([
        fetchWorldState(),
        fetchEvents(100),
      ]);
      setWorldState(state);
      setEvents(evts);
    } catch {
      setIsConnected(false);
      setWorldState(offlineEngine.getWorldState());
      setEvents(offlineEngine.getEvents(100));
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleToggleMute = () => {
    const nextMuted = soundService.toggleMute();
    setIsMuted(nextMuted);
  };

  const handleNewEvents = (newEvents: GameEvent[]) => {
    const combat = newEvents.find((e) => e.event_type === 'combat');
    if (combat) {
      soundService.playCombat();
      setActiveCombatEvent(combat);
    } else {
      const conquest = newEvents.find((e) => e.event_type === 'claim');
      if (conquest) {
        soundService.playConquest();
      }
    }
  };

  const startThinkingCycle = useCallback(() => {
    const aliveNations = Object.values(worldState.nations || {}).filter((n) => n.is_alive);
    if (aliveNations.length === 0) return () => {};
    let idx = 0;
    setThinkingNation(aliveNations[0]);
    setThinkingActivity('Formulating diplomatic messages and strategic moves...');

    const interval = window.setInterval(() => {
      idx = (idx + 1) % aliveNations.length;
      setThinkingNation(aliveNations[idx]);
    }, Math.max(700, Math.floor(1800 / speed)));

    return () => {
      clearInterval(interval);
      setThinkingNation(null);
      setThinkingActivity(null);
    };
  }, [worldState.nations, speed]);

  // Step single phase
  const handleStepPhase = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    const stopCycle = startThinkingCycle();
    try {
      const res = await stepSimulation(false, isConnected);
      setWorldState(res.world_state);
      setEvents((prev) => [...prev, ...res.new_events]);
      handleNewEvents(res.new_events);
    } catch (err) {
      console.error('Failed to step phase:', err);
    } finally {
      stopCycle();
      setIsProcessing(false);
    }
  };

  // Step full turn
  const handleStepTurn = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    const stopCycle = startThinkingCycle();
    try {
      const res = await stepSimulation(true, isConnected);
      setWorldState(res.world_state);
      setEvents((prev) => [...prev, ...res.new_events]);
      handleNewEvents(res.new_events);
    } catch (err) {
      console.error('Failed to step turn:', err);
    } finally {
      stopCycle();
      setIsProcessing(false);
    }
  };

  // Reset game
  const handleReset = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setIsAutoPlaying(false);
    try {
      const freshState = await resetSimulation('standard', isConnected);
      setWorldState(freshState);
      setEvents(offlineEngine.getEvents(100));
      setSelectedNationId(null);
      setSelectedTerritoryId(null);
      setActiveCombatEvent(null);
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

  // Chained Auto-Play Loop (advances turn-by-turn smoothly with thinking animations)
  useEffect(() => {
    let isCancelled = false;
    let timeoutId: number | null = null;

    const runAutoPlayLoop = async () => {
      if (isCancelled || !isAutoPlaying) return;
      setIsProcessing(true);
      const stopCycle = startThinkingCycle();

      try {
        const res = await stepSimulation(true, isConnected);
        if (!isCancelled) {
          setWorldState(res.world_state);
          setEvents((prev) => [...prev, ...res.new_events]);
          handleNewEvents(res.new_events);
        }
      } catch (err) {
        console.error('Auto-play error:', err);
        setIsAutoPlaying(false);
      } finally {
        stopCycle();
        setIsProcessing(false);
        if (!isCancelled && isAutoPlaying) {
          // Delay before next turn based on speed multiplier
          const delayMs = Math.max(900, Math.floor(2500 / speed));
          timeoutId = window.setTimeout(runAutoPlayLoop, delayMs);
        }
      }
    };

    if (isAutoPlaying) {
      runAutoPlayLoop();
    }

    return () => {
      isCancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isAutoPlaying, isConnected, speed, startThinkingCycle]);

  // Keyboard controls (Space = play/pause, ArrowRight = step, T = turn, R = reset)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleStepPhase();
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        handleStepTurn();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleReset();
      } else if (e.key === 'Escape') {
        setSelectedNationId(null);
        setSelectedTerritoryId(null);
        setActiveCombatEvent(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTogglePlay, handleStepPhase, handleStepTurn, handleReset]);

  const nationsList = Object.values(worldState.nations || {});
  const territoriesList = Object.values(worldState.territories || {});
  const selectedNation = selectedNationId ? worldState.nations[selectedNationId] || null : null;

  return (
    <div className="app-container">
      {/* Cartoon Top Header */}
      <Header
        turn={worldState.turn}
        phase={worldState.phase}
        isConnected={isConnected}
      />

      {/* 3D Toy Game Control Bar */}
      <SimulationControls
        isPaused={!isAutoPlaying}
        onTogglePlay={handleTogglePlay}
        onStepPhase={handleStepPhase}
        onStepTurn={handleStepTurn}
        onReset={handleReset}
        isProcessing={isProcessing}
        speed={speed}
        onSpeedChange={setSpeed}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        thinkingNation={thinkingNation}
        thinkingActivity={thinkingActivity}
      />

      {/* Clean 3-Column Game Board Layout */}
      <main className="game-layout">
        {/* Left: Kingdoms (Civilizations) */}
        <CivilizationList
          nations={nationsList}
          selectedNationId={selectedNationId}
          onSelectNation={(id) => setSelectedNationId(id === selectedNationId ? null : id)}
          thinkingNationId={thinkingNation?.id || null}
        />

        {/* Center: The Game Board (Vector Risk Map) */}
        <TerritoryMap
          territories={territoriesList}
          nations={worldState.nations}
          selectedTerritoryId={selectedTerritoryId}
          onSelectTerritory={(id) => setSelectedTerritoryId(id === selectedTerritoryId ? null : id)}
          latestCombatEvent={events.find((e) => e.event_type === 'combat') || null}
          onOpenCombatModal={(event) => setActiveCombatEvent(event)}
        />

        {/* Right: Live Chronicle */}
        <EventFeed
          events={events}
          onOpenCombatModal={(event) => setActiveCombatEvent(event)}
        />
      </main>

      {/* Pop-up Mini Dossier when a Kingdom is clicked */}
      <NationInspector
        nation={selectedNation}
        onClose={() => setSelectedNationId(null)}
      />

      {/* Pop-up Battle Arena when Combat happens */}
      <CombatModal
        combatEvent={activeCombatEvent}
        nations={worldState.nations}
        onClose={() => setActiveCombatEvent(null)}
      />
    </div>
  );
}

export default App;
