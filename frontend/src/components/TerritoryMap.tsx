import React, { useMemo } from 'react';
import { Territory, Nation, GameEvent } from '../types/contracts';

interface TerritoryMapProps {
  territories: Territory[];
  nations: Record<string, Nation>;
  selectedTerritoryId: string | null;
  onSelectTerritory: (territoryId: string) => void;
  latestCombatEvent?: GameEvent | null;
  onOpenCombatModal?: (event: GameEvent) => void;
}

export const TerritoryMap: React.FC<TerritoryMapProps> = ({
  territories,
  nations,
  selectedTerritoryId,
  onSelectTerritory,
  latestCombatEvent,
  onOpenCombatModal,
}) => {
  const territoryMap = useMemo(() => {
    const map = new Map<string, Territory>();
    territories.forEach((t) => map.set(t.id, t));
    return map;
  }, [territories]);

  const selectedTerritory = selectedTerritoryId ? territoryMap.get(selectedTerritoryId) : null;
  const adjacentIds = useMemo(() => {
    return new Set(selectedTerritory ? selectedTerritory.adjacent_territory_ids : []);
  }, [selectedTerritory]);

  // Coordinate projection from 0-100 to SVG 0 0 1000 780
  const projectX = (x: number) => x * 9.5 + 25;
  const projectY = (y: number) => y * 7.8 + 40;

  // Distinct links
  const links = useMemo(() => {
    const res: { id: string; t1: Territory; t2: Territory }[] = [];
    const seen = new Set<string>();

    territories.forEach((t1) => {
      t1.adjacent_territory_ids.forEach((adjId) => {
        const t2 = territoryMap.get(adjId);
        if (!t2) return;
        const key = [t1.id, t2.id].sort().join('-');
        if (!seen.has(key)) {
          seen.add(key);
          res.push({ id: key, t1, t2 });
        }
      });
    });
    return res;
  }, [territories, territoryMap]);

  const battleTerritoryId = latestCombatEvent?.territory_id || null;

  return (
    <div className="map-canvas-container">
      <div className="map-top-bar">
        <h2 className="game-card-title">
          <span>🗺️</span>
          <span>World Map (36 Territories)</span>
        </h2>
        <span className="map-instructions">💡 Click any territory to inspect</span>
      </div>

      <svg className="map-svg-board" viewBox="0 0 1000 780" preserveAspectRatio="xMidYMid meet">
        {/* Board Background */}
        <rect width="1000" height="780" fill="#080c16" />

        {/* Adjacency Roads */}
        {links.map((link) => {
          const x1 = projectX(link.t1.coord_x);
          const y1 = projectY(link.t1.coord_y);
          const x2 = projectX(link.t2.coord_x);
          const y2 = projectY(link.t2.coord_y);

          const isConnectedToSelected =
            selectedTerritoryId &&
            (link.t1.id === selectedTerritoryId || link.t2.id === selectedTerritoryId);

          return (
            <line
              key={link.id}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={isConnectedToSelected ? 'var(--color-gold)' : '#1e293b'}
              strokeWidth={isConnectedToSelected ? 3.5 : 1.8}
              strokeDasharray={isConnectedToSelected ? '6,4' : 'none'}
              className={isConnectedToSelected ? 'supply-line' : ''}
            />
          );
        })}

        {/* Territory Cards */}
        {territories.map((t) => {
          const cx = projectX(t.coord_x);
          const cy = projectY(t.coord_y);
          const owner = t.owner_id ? nations[t.owner_id] : null;
          const isSelected = t.id === selectedTerritoryId;
          const isAdjacent = adjacentIds.has(t.id);
          const isBattleSite = t.id === battleTerritoryId;

          const strokeColor = isSelected
            ? 'var(--color-gold)'
            : isAdjacent
            ? '#38bdf8'
            : owner
            ? owner.color
            : '#334155';

          const strokeWidth = isSelected ? 3.5 : isAdjacent ? 2.5 : 2;

          return (
            <g
              key={t.id}
              onClick={() => onSelectTerritory(t.id)}
              style={{ cursor: 'pointer' }}
            >
              {/* Battle Shockwave */}
              {isBattleSite && (
                <circle
                  cx={cx}
                  cy={cy}
                  r="30"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="3"
                  className="battle-pulse-circle"
                />
              )}

              {/* Territory Tile */}
              <rect
                x={cx - 50}
                y={cy - 34}
                width="100"
                height="68"
                rx="14"
                fill={isSelected ? '#1e2b47' : owner ? `${owner.color}1c` : '#0f172a'}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
              />

              {/* Owner Top Color Bar */}
              {owner && (
                <rect
                  x={cx - 50}
                  y={cy - 34}
                  width="100"
                  height="5"
                  rx="3"
                  fill={owner.color}
                />
              )}

              {/* Territory ID */}
              <text
                x={cx - 40}
                y={cy - 16}
                fill="#94a3b8"
                fontSize="10"
                fontFamily="var(--font-mono)"
                fontWeight="800"
              >
                {t.id}
              </text>

              {/* Garrison Shield Badge */}
              <g transform={`translate(${cx + 18}, ${cy - 25})`}>
                <rect
                  x="0"
                  y="0"
                  width="26"
                  height="16"
                  rx="6"
                  fill="rgba(0,0,0,0.6)"
                  stroke={owner ? owner.color : '#64748b'}
                  strokeWidth="1.2"
                />
                <text
                  x="13"
                  y="12"
                  fill="#fca5a5"
                  fontSize="11"
                  fontWeight="800"
                  textAnchor="middle"
                >
                  {t.stationed_military}
                </text>
              </g>

              {/* Territory Name */}
              <text
                x={cx}
                y={cy + 6}
                fill="#ffffff"
                fontSize="11.5"
                fontWeight="700"
                textAnchor="middle"
              >
                {t.name.length > 13 ? t.name.slice(0, 11) + '…' : t.name}
              </text>

              {/* Resource Yield */}
              <text
                x={cx}
                y={cy + 22}
                fill="#fcd34d"
                fontSize="10"
                fontWeight="700"
                textAnchor="middle"
              >
                +{t.gold_production}🪙 +{t.food_production}🍞
              </text>

              {/* Battle Marker Icon */}
              {isBattleSite && (
                <g
                  transform={`translate(${cx - 14}, ${cy - 52})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (latestCombatEvent && onOpenCombatModal) {
                      onOpenCombatModal(latestCombatEvent);
                    }
                  }}
                >
                  <circle cx="14" cy="14" r="14" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
                  <text x="14" y="20" fontSize="14" textAnchor="middle">
                    ⚔️
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Selected Territory Mini-Card */}
      {selectedTerritory ? (
        <div className="territory-mini-card">
          <div className="territory-title-col">
            <span className="territory-id-badge">{selectedTerritory.id}</span>
            <strong style={{ fontSize: '1rem', color: '#fff' }}>
              {selectedTerritory.name}
            </strong>
            <span style={{ fontSize: '0.8rem', color: selectedTerritory.owner_id ? nations[selectedTerritory.owner_id]?.color : '#94a3b8' }}>
              &bull; {selectedTerritory.owner_id ? nations[selectedTerritory.owner_id]?.name : 'Neutral Wilderness'}
            </span>
          </div>

          <div className="territory-stats-col">
            <span>🛡️ <strong>{selectedTerritory.stationed_military}</strong> Soldiers</span>
            <span style={{ color: '#fcd34d' }}>🪙 +{selectedTerritory.gold_production} Gold</span>
            <span style={{ color: '#86efac' }}>🍞 +{selectedTerritory.food_production} Food</span>
          </div>
        </div>
      ) : (
        <div className="territory-mini-card" style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
          <span>👈 Select any territory on the board to view its soldiers and resource production.</span>
        </div>
      )}
    </div>
  );
};
