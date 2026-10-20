import React from 'react';
import { ShieldAlert, CheckCircle2, Globe2 } from 'lucide-react';
import { PhaseType } from '../types/contracts';

interface HeaderProps {
  isConnected: boolean;
  mockAiEnabled: boolean;
  turn: number;
  phase: PhaseType;
}

export const Header: React.FC<HeaderProps> = ({
  isConnected,
  mockAiEnabled,
  turn,
  phase,
}) => {
  const formatPhase = (p: string) => {
    return p.replace('_', ' ').toUpperCase();
  };

  return (
    <header className="app-header">
      <div className="brand-section">
        <Globe2 className="brand-logo" style={{ color: 'var(--accent-gold)' }} />
        <div>
          <h1 className="brand-title">
            Emergent Nations
            <span className="brand-badge">Phase 0 MVP</span>
          </h1>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Autonomous AI Society Simulation &bull; Omniscient Spectator
          </p>
        </div>
      </div>

      <div className="header-meta">
        <div className={`status-indicator ${isConnected ? '' : 'offline'}`}>
          {isConnected ? (
            <>
              <CheckCircle2 size={13} />
              <span>Backend Connected {mockAiEnabled ? '(Mock AI)' : '(Ollama)'}</span>
            </>
          ) : (
            <>
              <ShieldAlert size={13} />
              <span>Backend Offline (Using Local Fixtures)</span>
            </>
          )}
        </div>

        <div className="turn-badge">
          TURN {turn}
        </div>

        <div className="phase-pill">
          {formatPhase(phase)}
        </div>
      </div>
    </header>
  );
};
