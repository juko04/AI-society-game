import React from 'react';
import { Shield, Sparkles } from 'lucide-react';
import { Territory, Nation } from '../types/contracts';

interface TerritoryMapProps {
  territories: Territory[];
  nations: Record<string, Nation>;
  selectedTerritoryId: string | null;
  onSelectTerritory: (territoryId: string) => void;
}

export const TerritoryMap: React.FC<TerritoryMapProps> = ({
  territories,
  nations,
  selectedTerritoryId,
  onSelectTerritory,
}) => {
  const selectedTerritory = territories.find((t) => t.id === selectedTerritoryId);
  const adjacentIds = new Set(selectedTerritory ? selectedTerritory.adjacent_territory_ids : []);

  return (
    <div className="card" style={{ flex: 1 }}>
      <div className="card-header">
        <h2 className="card-title">
          <Sparkles size={16} style={{ color: 'var(--accent-gold)' }} />
          World Map (36 Territories)
        </h2>
        {selectedTerritory && (
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontFamily: 'var(--font-mono)' }}>
            Selected: {selectedTerritory.name} ({selectedTerritory.id})
          </span>
        )}
      </div>

      <div className="card-body" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="map-viewport">
          {territories.map((territory) => {
            const owner = territory.owner_id ? nations[territory.owner_id] : null;
            const isSelected = territory.id === selectedTerritoryId;
            const isAdjacent = adjacentIds.has(territory.id);

            const borderStyle = isSelected
              ? '2px solid var(--accent-gold)'
              : isAdjacent
              ? '1px dashed #60a5fa'
              : owner
              ? `1px solid ${owner.color}66`
              : '1px solid #1e293b';

            const bgStyle = isSelected
              ? '#1e293b'
              : owner
              ? `${owner.color}15`
              : '#0f172a';

            return (
              <div
                key={territory.id}
                className={`territory-tile ${isSelected ? 'selected' : ''}`}
                style={{
                  border: borderStyle,
                  backgroundColor: bgStyle,
                }}
                onClick={() => onSelectTerritory(territory.id)}
                title={`${territory.name} (${territory.id})\nOwner: ${owner ? owner.name : 'Neutral'}\nGarrison: ${territory.stationed_military}\nYield: +${territory.gold_production}g, +${territory.food_production}f\nAdjacent to: ${territory.adjacent_territory_ids.join(', ')}`}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="territory-id">{territory.id}</span>
                  {owner && (
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        backgroundColor: owner.color,
                        display: 'inline-block',
                      }}
                    />
                  )}
                </div>

                <div className="territory-name" style={{ color: owner ? owner.color : '#cbd5e1' }}>
                  {territory.name}
                </div>

                <div className="territory-footer">
                  <div className="garrison-badge">
                    <Shield size={10} />
                    <span>{territory.stationed_military}</span>
                  </div>
                  <div className="yield-pill">
                    +{territory.gold_production}g/+{territory.food_production}f
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {selectedTerritory && (
          <div className="inspector-card">
            <h3 className="inspector-title">Territory Intelligence</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
              <div><strong>Name:</strong> {selectedTerritory.name}</div>
              <div><strong>Owner:</strong> {selectedTerritory.owner_id ? nations[selectedTerritory.owner_id]?.name : 'Neutral'}</div>
              <div><strong>Garrison:</strong> {selectedTerritory.stationed_military} units</div>
              <div><strong>Production:</strong> +{selectedTerritory.gold_production}g / +{selectedTerritory.food_production}f</div>
            </div>
            <div style={{ marginTop: '0.4rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <strong>Adjacency Links ({selectedTerritory.adjacent_territory_ids.length}):</strong>{' '}
              {selectedTerritory.adjacent_territory_ids.join(', ')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
