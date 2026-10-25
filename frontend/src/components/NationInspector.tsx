import React from 'react';
import { Nation } from '../types/contracts';

interface NationInspectorProps {
  nation: Nation | null;
  onClose: () => void;
}

export const NationInspector: React.FC<NationInspectorProps> = ({
  nation,
  onClose,
}) => {
  if (!nation) return null;

  const getPersonalityInfo = (personality?: string | null) => {
    switch (personality) {
      case 'Opportunist':
        return '💰 Opportunist: Loves to claim free neutral lands, avoids risky fights, and hoards gold.';
      case 'Altruist':
        return '🤝 Altruist: Peaceful and helpful. Shares food with starving neighbors and seeks treaties.';
      case 'Skeptic':
        return '🛡️ Skeptic: Careful and guarded. Fortifies borders and watches rivals closely.';
      case 'Aggressive':
        return '⚔️ Aggressive: Loves battle! Trains lots of troops and attacks nearby enemies.';
      case 'Diplomatic':
        return '📜 Diplomatic: Peacemaker. Likes forming alliances and trade pacts.';
      case 'Cautious':
        return '🏰 Cautious: Defensive player. Keeps buffer zones and protects its castle.';
      default:
        return 'Pragmatic kingdom balancing growth and defense.';
    }
  };

  return (
    <div className="pop-backdrop" onClick={onClose}>
      <div className="pop-card" onClick={(e) => e.stopPropagation()}>
        <div className="pop-header" style={{ borderBottomColor: nation.color }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: `${nation.color}25`,
                border: `2px solid ${nation.color}`,
                color: nation.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
              }}
            >
              {nation.name.charAt(0)}
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: nation.color }}>
                {nation.name}
              </h2>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Ruler: <strong>{nation.leader_name}</strong>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <div className="pop-body">
          {/* Personality Box */}
          <div
            style={{
              background: '#111827',
              border: '2px solid #283754',
              borderRadius: '14px',
              padding: '0.75rem 1rem',
              fontSize: '0.82rem',
              color: '#e2e8f0',
              lineHeight: 1.4,
              marginBottom: '1rem',
            }}
          >
            {getPersonalityInfo(nation.personality)}
          </div>

          {/* Big Stat Tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '1rem' }}>
            <div style={{ background: '#111827', padding: '0.6rem', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>TREASURY</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fcd34d' }}>🪙 {nation.gold}g</div>
            </div>
            <div style={{ background: '#111827', padding: '0.6rem', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>FOOD STORE</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#86efac' }}>🍞 {nation.food}f</div>
            </div>
            <div style={{ background: '#111827', padding: '0.6rem', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>ARMY UNITS</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fca5a5' }}>⚔️ {nation.military_units}</div>
            </div>
            <div style={{ background: '#111827', padding: '0.6rem', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>LANDS HELD</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#93c5fd' }}>🏰 {nation.territory_ids.length}</div>
            </div>
          </div>

          {/* AI Goals */}
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem' }}>
            CURRENT STRATEGIC GOALS:
          </div>
          <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.82rem', color: '#cbd5e1' }}>
            {nation.current_goals.map((g, idx) => (
              <li key={idx} style={{ marginBottom: '0.2rem' }}>{g}</li>
            ))}
          </ul>
        </div>

        <div className="pop-footer">
          <button className="btn-big-action" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
