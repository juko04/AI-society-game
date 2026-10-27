import { useState, useEffect, useCallback, useRef } from 'react';
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
  updateNationPersonality,
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
  const [speed, setSpeed] = useState<number>(1);
  const speedRef = useRef<number>(speed);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const isAutoPlayingRef = useRef<boolean>(isAutoPlaying);
  useEffect(() => {
    isAutoPlayingRef.current = isAutoPlaying;
  }, [isAutoPlaying]);

  const isTurnRunningRef = useRef<boolean>(false);

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

  const handleNewEvents = useCallback(
    (newEvents: GameEvent[]) => {
      const combat = newEvents.find((e) => e.event_type === 'combat');
      if (combat) {
        soundService.playCombat();
        setActiveCombatEvent(combat);
        // In auto-play, auto-dismiss combat popup after a moment so turn flow stays smooth
        if (isAutoPlayingRef.current) {
          setTimeout(() => {
            setActiveCombatEvent(null);
          }, speedRef.current === 4 ? 600 : 2500);
        }
      } else {
        const conquest = newEvents.find((e) => e.event_type === 'claim');
        if (conquest) {
          soundService.playConquest();
        }
      }
    },
    []
  );

  const startThinkingCycle = useCallback(() => {
    const aliveNations = Object.values(worldState.nations || {}).filter((n) => n.is_alive);
    if (aliveNations.length === 0) return () => {};
    let idx = 0;
    setThinkingNation(aliveNations[0]);
    setThinkingActivity('Formulating diplomatic announcements...');

    const interval = window.setInterval(() => {
      idx = (idx + 1) % aliveNations.length;
      setThinkingNation(aliveNations[idx]);
    }, Math.max(300, Math.floor(1200 / (speedRef.current || 1))));

    return () => {
      clearInterval(interval);
      setThinkingNation(null);
      setThinkingActivity(null);
    };
  }, [worldState.nations]);

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // Plays a full turn in observable stages:
  // Stage 1: Yields & Discussions (AI generates diplomatic speech & plans moves)
  // Stage 2: Actions & Resolution (Board updates with movements, conquests, and battles)
  // Stage 3: Spectator pause (At 1x/2x speed, pauses so user absorbs what happened; at 4x speed, minimal repaint tick)
  const playOneTurn = useCallback(async (): Promise<boolean> => {
    if (isTurnRunningRef.current) return false;
    isTurnRunningRef.current = true;

    try {
      // --- STAGE 1: DIPLOMACY & DISCUSSIONS ---
      setIsProcessing(true);
      setThinkingActivity('Civilizations are conducting diplomatic council...');
      const stopCycle1 = startThinkingCycle();

      try {
        const dipRes = await stepSimulation(false, isConnected, 'diplomacy');
        setWorldState(dipRes.world_state);
        setEvents((prev) => [...prev, ...dipRes.new_events]);
        handleNewEvents(dipRes.new_events);
      } catch (err) {
        console.error('Failed to run diplomacy stage:', err);
      } finally {
        stopCycle1();
      }

      // Reading pause for discussions (at 4x speed: 120ms tick so React flushes DOM updates)
      const currentSpeed = speedRef.current;
      const dipPauseMs = currentSpeed === 4 ? 120 : Math.max(300, Math.floor(1500 / currentSpeed));
      await sleep(dipPauseMs);

      // --- STAGE 2: ACTIONS & BOARD RESOLUTION ---
      setIsProcessing(true);
      setThinkingActivity('Executing strategic maneuvers and updating the map...');
      const stopCycle2 = startThinkingCycle();

      try {
        const resRes = await stepSimulation(false, isConnected, 'resolution');
        setWorldState(resRes.world_state);
        setEvents((prev) => [...prev, ...resRes.new_events]);
        handleNewEvents(resRes.new_events);
      } catch (err) {
        console.error('Failed to run resolution stage:', err);
      } finally {
        stopCycle2();
        setIsProcessing(false);
      }

      // --- STAGE 3: SPECTATOR OBSERVATION PAUSE ---
      // "after the discussions, the kindgoms actions should be shown on the board and have update it,
      // wait a little, and then begin the next turn so i can watch it without losing what was going on.
      // when it is sped up, dont include the wait time"
      const currentSpeedAfter = speedRef.current;
      const observationPauseMs =
        currentSpeedAfter === 4 ? 150 : currentSpeedAfter === 2 ? 1200 : 3200;
      await sleep(observationPauseMs);

      return true;
    } finally {
      isTurnRunningRef.current = false;
      setIsProcessing(false);
    }
  }, [isConnected, startThinkingCycle, handleNewEvents]);

  // Step single phase
  const handleStepPhase = async () => {
    if (isProcessing || isTurnRunningRef.current) return;
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

  // Step full turn with observable stages
  const handleStepTurn = async () => {
    if (isProcessing || isTurnRunningRef.current) return;
    await playOneTurn();
  };

  // Emergency Reset (always unfreezes and resets immediately)
  const handleReset = async () => {
    isTurnRunningRef.current = false;
    setIsAutoPlaying(false);
    setIsProcessing(false);
    setThinkingNation(null);
    setThinkingActivity(null);
    try {
      const freshState = await resetSimulation('standard', isConnected);
      setWorldState(freshState);
      setEvents(offlineEngine.getEvents(100));
      setSelectedNationId(null);
      setSelectedTerritoryId(null);
      setActiveCombatEvent(null);
    } catch (err) {
      console.error('Failed to reset:', err);
    }
  };

  // Auto-play toggle (immediate pause without getting stuck)
  const handleTogglePlay = () => {
    setIsAutoPlaying((prev) => {
      const next = !prev;
      if (!next) {
        // Immediate emergency pause
        isTurnRunningRef.current = false;
        setIsProcessing(false);
        setThinkingNation(null);
        setThinkingActivity(null);
      }
      return next;
    });
  };

  // Change AI leader personality archetype in real-time
  const handleUpdatePersonality = async (nationId: string, personality: string) => {
    try {
      await updateNationPersonality(nationId, personality, isConnected);
      setWorldState((prev) => {
        if (!prev.nations[nationId]) return prev;
        return {
          ...prev,
          nations: {
            ...prev.nations,
            [nationId]: {
              ...prev.nations[nationId],
              personality,
            },
          },
        };
      });
    } catch (err) {
      console.error('Failed to update personality:', err);
    }
  };

  // Chained Auto-Play Loop (advances turn-by-turn smoothly through observable stages)
  useEffect(() => {
    if (!isAutoPlaying) return;
    let active = true;

    const runAutoPlayLoop = async () => {
      while (active && isAutoPlayingRef.current) {
        await playOneTurn();
        if (!active || !isAutoPlayingRef.current) break;
      }
    };

    runAutoPlayLoop();

    return () => {
      active = false;
    };
  }, [isAutoPlaying, playOneTurn]);

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
          onUpdatePersonality={handleUpdatePersonality}
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
