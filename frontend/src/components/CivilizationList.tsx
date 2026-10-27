import React from 'react';
import { Nation } from '../types/contracts';

interface CivilizationListProps {
  nations: Nation[];
  selectedNationId: string | null;
  onSelectNation: (nationId: string) => void;
  thinkingNationId?: string | null;
  onUpdatePersonality?: (nationId: string, personality: string) => void;
}

export const CivilizationList: React.FC<CivilizationListProps> = ({
  nations,
  selectedNationId,
  onSelectNation,
  thinkingNationId,
  onUpdatePersonality,
}) => {
  return (
    <div className="game-card">
      <div className="game-card-header">
        <h2 className="game-card-title">
          <span>👑</span>
          <span>Kingdoms ({nations.length})</span>
        </h2>
      </div>

      <div className="game-card-body">
        <div className="kingdoms-list">
          {nations.map((nation) => {
            const isSelected = nation.id === selectedNationId;
            const isThinking = nation.id === thinkingNationId;
            const upkeep = Math.ceil(nation.military_units / 4);
            const isStarving = nation.food < upkeep && nation.is_alive;

            return (
              <div
                key={nation.id}
                className={`kingdom-card ${isSelected ? 'selected' : ''} ${isThinking ? 'thinking' : ''} ${!nation.is_alive ? 'fallen' : ''}`}
                style={{
                  borderColor: isThinking ? '#f59e0b' : isSelected ? 'var(--color-gold)' : nation.color,
                }}
                onClick={() => onSelectNation(nation.id)}
              >
                <div className="kingdom-top-row">
                  <div className="kingdom-brand">
                    <div
                      className="kingdom-avatar-circle"
                      style={{
                        backgroundColor: `${nation.color}25`,
                        borderColor: nation.color,
                        color: nation.color,
                      }}
                    >
                      {nation.name.charAt(0)}
                    </div>
                    <div>
                      <div className="kingdom-name" style={{ color: nation.color }}>
                        {nation.name}
                      </div>
                      <div className="kingdom-leader">
                        {nation.leader_name}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                    {isThinking && (
                      <span className="kingdom-thinking-pill">
                        🧠 Thinking
                      </span>
                    )}
                    {!nation.is_alive ? (
                      <span className="kingdom-personality-badge" style={{ color: '#f87171' }}>
                        💀 Defeated
                      </span>
                    ) : isStarving ? (
                      <span className="kingdom-personality-badge" style={{ color: '#fcd34d' }}>
                        ⚠️ Starving!
                      </span>
                    ) : (
                      <select
                        value={nation.personality || 'Opportunist'}
                        onChange={(e) => {
                          e.stopPropagation();
                          if (onUpdatePersonality) {
                            onUpdatePersonality(nation.id, e.target.value);
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="kingdom-personality-select"
                        title="Change AI Leader Personality Archetype"
                      >
                        <option value="Opportunist">Opportunist 🦊</option>
                        <option value="Altruist">Altruist 🕊️</option>
                        <option value="Skeptic">Skeptic 🛡️</option>
                        <option value="Aggressive">Aggressive ⚔️</option>
                        <option value="Diplomatic">Diplomatic 📜</option>
                      </select>
                    )}
                  </div>
                </div>

                {nation.is_alive && (
                  <div className="kingdom-stats-row">
                    <div className="stat-pill stat-gold" title="Gold Treasury">
                      <span>🪙</span>
                      <span>{nation.gold}</span>
                    </div>
                    <div className="stat-pill stat-food" title="Food Granary">
                      <span>🍞</span>
                      <span>{nation.food}</span>
                    </div>
                    <div className="stat-pill stat-army" title="Army Soldiers">
                      <span>⚔️</span>
                      <span>{nation.military_units}</span>
                    </div>
                    <div className="stat-pill stat-lands" title="Owned Lands">
                      <span>🏰</span>
                      <span>{nation.territory_ids.length}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
