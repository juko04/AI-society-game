import React from 'react';
import { PhaseType } from '../types/contracts';

interface HeaderProps {
  turn: number;
  phase: PhaseType;
  isConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  turn,
  phase,
  isConnected,
}) => {
  const getPhaseName = (p: PhaseType) => {
    switch (p) {
      case 'world_update':
        return '🌾 1. Harvest & Upkeep';
      case 'diplomacy':
        return '💬 2. AI Talks & Whispers';
      case 'strategic_decisions':
        return '🧭 3. Strategy Planning';
      case 'resolution':
        return '⚔️ 4. Battles & Claims';
      case 'history_memory':
        return '📜 5. Turn Complete';
      default:
        return p;
    }
  };

  return (
    <header className="game-header">
      <div className="brand-box">
        <span className="brand-icon">🏰</span>
        <div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <h1 className="brand-title">EMERGENT NATIONS</h1>
            <span className="brand-tag">AI SIM</span>
          </div>
        </div>
      </div>

      <div className="turn-pill-banner">
        <span className="turn-number">👑 TURN {turn}</span>
        <span className="phase-tag">{getPhaseName(phase)}</span>
      </div>

      <div className="header-status-pill">
        <span style={{ fontSize: '0.85rem' }}>{isConnected ? '🟢' : '⚡'}</span>
        <span>{isConnected ? 'Live Server' : 'Game Ready'}</span>
      </div>
    </header>
  );
};
