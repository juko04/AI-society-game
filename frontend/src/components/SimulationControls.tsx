import React from 'react';
import { Play, Pause, StepForward, FastForward, RotateCcw } from 'lucide-react';

interface SimulationControlsProps {
  isPaused: boolean;
  onTogglePlay: () => void;
  onStepPhase: () => void;
  onStepTurn: () => void;
  onReset: () => void;
  seed: number;
  isProcessing: boolean;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  isPaused,
  onTogglePlay,
  onStepPhase,
  onStepTurn,
  onReset,
  seed,
  isProcessing,
}) => {
  return (
    <div className="controls-bar">
      <div className="controls-group">
        <button
          className={`btn ${isPaused ? 'btn-primary' : 'btn-secondary'}`}
          onClick={onTogglePlay}
          disabled={isProcessing}
        >
          {isPaused ? <Play size={14} /> : <Pause size={14} />}
          <span>{isPaused ? 'Auto Play' : 'Pause'}</span>
        </button>

        <button
          className="btn"
          onClick={onStepPhase}
          disabled={isProcessing}
          title="Advance to next phase"
        >
          <StepForward size={14} />
          <span>Step Phase</span>
        </button>

        <button
          className="btn"
          onClick={onStepTurn}
          disabled={isProcessing}
          title="Advance full turn cycle (5 phases)"
        >
          <FastForward size={14} />
          <span>Step Turn</span>
        </button>

        <button
          className="btn"
          onClick={onReset}
          disabled={isProcessing}
          title="Reset simulation to initial state"
        >
          <RotateCcw size={14} />
          <span>Reset</span>
        </button>
      </div>

      <div className="controls-group" style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>
        <span>Seed: <code style={{ color: 'var(--text-muted)' }}>{seed}</code></span>
        <span>&bull;</span>
        <span>Simultaneous Strategic Actions</span>
      </div>
    </div>
  );
};
