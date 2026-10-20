import React from 'react';
import { Target, Flag, Coins, Wheat, Shield } from 'lucide-react';
import { Nation } from '../types/contracts';

interface NationInspectorProps {
  nation: Nation | null;
  onClose: () => void;
}

export const NationInspector: React.FC<NationInspectorProps> = ({ nation, onClose }) => {
  if (!nation) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        width: '380px',
        backgroundColor: 'var(--bg-surface)',
        border: `2px solid ${nation.color}`,
        borderRadius: '8px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        padding: '1rem',
        zIndex: 100,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
        <h3 style={{ color: nation.color, fontFamily: 'var(--font-serif)', fontSize: '1.1rem', margin: 0 }}>
          {nation.name}
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-faint)',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          &times;
        </button>
      </div>

      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
        Leader: <strong>{nation.leader_name}</strong> &bull; Archetype: <strong>{nation.personality}</strong>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
        <span className="stat-gold" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
          <Coins size={14} /> {nation.gold}g
        </span>
        <span className="stat-food" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
          <Wheat size={14} /> {nation.food}f
        </span>
        <span className="stat-military" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
          <Shield size={14} /> {nation.military_units} units
        </span>
      </div>

      <div style={{ marginBottom: '0.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--text-faint)', marginBottom: '0.25rem' }}>
          <Target size={12} />
          <strong>CURRENT NATIONAL GOALS</strong>
        </div>
        <ul style={{ fontSize: '0.78rem', paddingLeft: '1.2rem', color: 'var(--text-main)', margin: 0 }}>
          {nation.current_goals.map((goal, idx) => (
            <li key={idx} style={{ marginBottom: '0.2rem' }}>{goal}</li>
          ))}
        </ul>
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--text-faint)', marginBottom: '0.25rem' }}>
          <Flag size={12} />
          <strong>CONTROLLED TERRITORIES ({nation.territory_ids.length})</strong>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
          {nation.territory_ids.map((tid) => (
            <span
              key={tid}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                backgroundColor: 'var(--bg-surface-elevated)',
                padding: '0.15rem 0.4rem',
                borderRadius: '4px',
                border: '1px solid var(--border-strong)',
              }}
            >
              {tid}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
