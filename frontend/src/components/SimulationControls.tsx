import React from 'react';
import { Play, Pause, StepForward, FastForward, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { soundService } from '../services/sound';

interface SimulationControlsProps {
  isPaused: boolean;
  onTogglePlay: () => void;
  onStepPhase: () => void;
  onStepTurn: () => void;
  onReset: () => void;
  isProcessing: boolean;
  speed: number;
  onSpeedChange: (speed: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  isPaused,
  onTogglePlay,
  onStepPhase,
  onStepTurn,
  onReset,
  isProcessing,
  speed,
  onSpeedChange,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="controls-bar">
      <div className="btn-group">
        {/* Big 3D Play/Pause Button */}
        <button
          className={`btn-game ${isPaused ? 'btn-play' : 'btn-pause'}`}
          onClick={() => {
            soundService.playClick();
            onTogglePlay();
          }}
          disabled={isProcessing}
          title="Press Spacebar to Play or Pause"
        >
          {isPaused ? <Play size={16} fill="currentColor" /> : <Pause size={16} fill="currentColor" />}
          <span>{isPaused ? 'PLAY' : 'PAUSE'}</span>
        </button>

        {/* Step 1 Step */}
        <button
          className="btn-game btn-step"
          onClick={() => {
            soundService.playPhaseShift();
            onStepPhase();
          }}
          disabled={isProcessing || !isPaused}
          title="Step one phase forward (Right Arrow)"
        >
          <StepForward size={16} />
          <span>STEP</span>
        </button>

        {/* Full Turn */}
        <button
          className="btn-game btn-turn"
          onClick={() => {
            soundService.playTurnAdvance();
            onStepTurn();
          }}
          disabled={isProcessing || !isPaused}
          title="Advance an entire turn (T)"
        >
          <FastForward size={16} />
          <span>NEXT TURN</span>
        </button>

        {/* Reset */}
        <button
          className="btn-game btn-reset"
          onClick={() => {
            soundService.playClick();
            onReset();
          }}
          disabled={isProcessing}
          title="Restart the game (R)"
        >
          <RotateCcw size={15} />
          <span>RESET</span>
        </button>
      </div>

      {/* Speed & Sound */}
      <div className="btn-group">
        <div className="speed-selector">
          <span className="speed-title">SPEED:</span>
          {[1, 2, 4].map((s) => (
            <button
              key={s}
              className={`speed-chip ${speed === s ? 'active' : ''}`}
              onClick={() => {
                soundService.playClick();
                onSpeedChange(s);
              }}
            >
              {s}x
            </button>
          ))}
        </div>

        <button
          className="btn-sound"
          onClick={onToggleMute}
          title={isMuted ? 'Turn Sound ON' : 'Turn Sound OFF'}
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>
    </div>
  );
};
