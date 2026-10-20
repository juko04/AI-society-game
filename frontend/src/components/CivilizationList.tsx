import React from 'react';
import { Coins, Wheat, Shield, MapPin } from 'lucide-react';
import { Nation } from '../types/contracts';

interface CivilizationListProps {
  nations: Nation[];
  selectedNationId: string | null;
  onSelectNation: (nationId: string) => void;
}

export const CivilizationList: React.FC<CivilizationListProps> = ({
  nations,
  selectedNationId,
  onSelectNation,
}) => {
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Civilizations ({nations.length})</h2>
      </div>
      <div className="card-body">
        {nations.map((nation) => {
          const isSelected = nation.id === selectedNationId;
          return (
            <div
              key={nation.id}
              className={`nation-card ${isSelected ? 'selected' : ''}`}
              style={{ '--nation-color': nation.color } as React.CSSProperties}
              onClick={() => onSelectNation(nation.id)}
            >
              <div className="nation-header">
                <span className="nation-name" style={{ color: nation.color }}>
                  {nation.name}
                </span>
                <span className="nation-personality">
                  {nation.personality || 'Neutral'}
                </span>
              </div>

              <div className="nation-leader">
                Leader: {nation.leader_name}
              </div>

              <div className="nation-stats">
                <div className="stat-item stat-gold" title="Treasury Gold">
                  <Coins size={12} />
                  <span>{nation.gold}</span>
                </div>
                <div className="stat-item stat-food" title="Food Stores">
                  <Wheat size={12} />
                  <span>{nation.food}</span>
                </div>
                <div className="stat-item stat-military" title="Total Military Units">
                  <Shield size={12} />
                  <span>{nation.military_units}</span>
                </div>
                <div className="stat-item stat-lands" title="Territories Controlled">
                  <MapPin size={12} />
                  <span>{nation.territory_ids.length}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
