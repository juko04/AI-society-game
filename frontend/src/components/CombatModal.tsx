import React from 'react';
import { GameEvent, Nation } from '../types/contracts';

interface CombatModalProps {
  combatEvent: GameEvent | null;
  nations: Record<string, Nation>;
  onClose: () => void;
}

export const CombatModal: React.FC<CombatModalProps> = ({
  combatEvent,
  nations,
  onClose,
}) => {
  if (!combatEvent || combatEvent.event_type !== 'combat') return null;

  const details = combatEvent.details as {
    attacker_roll?: number;
    defender_roll?: number;
    attacker_score?: number;
    defender_score?: number;
    attacker_won?: boolean;
    attacker_losses?: number;
    defender_losses?: number;
  };

  const attacker = combatEvent.source_nation_id ? nations[combatEvent.source_nation_id] : null;
  const defender = combatEvent.target_nation_id ? nations[combatEvent.target_nation_id] : null;
  const attackerWon = details?.attacker_won ?? false;

  const atkColor = attacker?.color || '#ef4444';
  const defColor = defender?.color || '#3b82f6';

  return (
    <div className="pop-backdrop" onClick={onClose}>
      <div className="pop-card" onClick={(e) => e.stopPropagation()}>
        <div className="pop-header">
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>⚔️</span>
            <span>Battle of {combatEvent.territory_id || 'Border'}</span>
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <div className="pop-body">
          {/* Winner Banner */}
          <div
            style={{
              textAlign: 'center',
              padding: '0.5rem',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '1rem',
              marginBottom: '1rem',
              backgroundColor: attackerWon ? `${atkColor}25` : `${defColor}25`,
              color: attackerWon ? atkColor : defColor,
              border: `2px solid ${attackerWon ? atkColor : defColor}`,
            }}
          >
            {attackerWon ? `🏆 VICTORY FOR ${attacker?.name?.toUpperCase()}!` : `🛡️ ${defender?.name?.toUpperCase()} REPELLED THE ATTACK!`}
          </div>

          <div className="battle-arena-pop">
            {/* Attacker */}
            <div className="battle-fighter-box" style={{ borderColor: atkColor }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: atkColor }}>ATTACKER</div>
              <div className="fighter-name" style={{ color: atkColor }}>{attacker?.name}</div>
              <div className="dice-result-box" style={{ color: atkColor }}>
                🎲 +{details?.attacker_roll ?? 0}
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                Score: <strong>{details?.attacker_score ?? 0}</strong>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.4rem' }}>
                Lost: -{details?.attacker_losses ?? 0} ⚔️
              </div>
            </div>

            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#64748b' }}>
              VS
            </div>

            {/* Defender */}
            <div className="battle-fighter-box" style={{ borderColor: defColor }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: defColor }}>DEFENDER</div>
              <div className="fighter-name" style={{ color: defColor }}>{defender?.name}</div>
              <div className="dice-result-box" style={{ color: defColor }}>
                🎲 +{details?.defender_roll ?? 0}
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                Score: <strong>{details?.defender_score ?? 0}</strong>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.4rem' }}>
                Lost: -{details?.defender_losses ?? 0} ⚔️
              </div>
            </div>
          </div>

          <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.45, margin: 0, textAlign: 'center' }}>
            {combatEvent.summary}
          </p>
        </div>

        <div className="pop-footer">
          <button className="btn-big-action" onClick={onClose}>
            Awesome! 👍
          </button>
        </div>
      </div>
    </div>
  );
};
