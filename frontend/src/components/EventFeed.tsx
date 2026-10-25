import React, { useState } from 'react';
import { GameEvent } from '../types/contracts';

interface EventFeedProps {
  events: GameEvent[];
  onOpenCombatModal?: (event: GameEvent) => void;
}

export const EventFeed: React.FC<EventFeedProps> = ({
  events,
  onOpenCombatModal,
}) => {
  const [filter, setFilter] = useState<string>('all');

  const filteredEvents = events.filter((e) => {
    if (filter === 'combat') return e.event_type === 'combat';
    if (filter === 'claim') return e.event_type === 'claim';
    if (filter === 'recruit') return e.event_type === 'recruit';
    if (filter === 'diplomacy') return e.event_type === 'announcement' || e.event_type === 'whisper';
    return true;
  });

  const getEmoji = (type: string) => {
    switch (type) {
      case 'combat':
        return '⚔️';
      case 'claim':
        return '🚩';
      case 'recruit':
        return '🛡️';
      case 'develop':
        return '🏗️';
      case 'announcement':
      case 'whisper':
        return '💬';
      case 'attrition':
        return '🌾';
      default:
        return '📜';
    }
  };

  return (
    <div className="game-card events-column">
      <div className="game-card-header">
        <h2 className="game-card-title">
          <span>📜</span>
          <span>Live Chronicle</span>
        </h2>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            background: '#131b2e',
            color: '#fff',
            border: '2px solid #23304a',
            borderRadius: '8px',
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '0.2rem 0.5rem',
            cursor: 'pointer',
          }}
        >
          <option value="all">All Events</option>
          <option value="combat">Battles ⚔️</option>
          <option value="claim">Land Claims 🚩</option>
          <option value="recruit">Recruits 🛡️</option>
          <option value="diplomacy">Diplomacy 💬</option>
        </select>
      </div>

      <div className="game-card-body">
        <div className="events-list">
          {filteredEvents.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#64748b', padding: '2rem 1rem', fontSize: '0.85rem' }}>
              No events yet. Click <strong>PLAY</strong> or <strong>STEP</strong> to begin!
            </div>
          ) : (
            filteredEvents
              .slice()
              .reverse()
              .map((event) => {
                const isCombat = event.event_type === 'combat';
                return (
                  <div
                    key={event.event_id}
                    className={`clean-event-card ${event.event_type}`}
                    onClick={() => {
                      if (isCombat && onOpenCombatModal) {
                        onOpenCombatModal(event);
                      }
                    }}
                  >
                    <div className="event-top-info">
                      <span>
                        {getEmoji(event.event_type)} TURN {event.turn} &bull; {event.event_type.toUpperCase()}
                      </span>
                      {isCombat && (
                        <span style={{ color: '#f87171', fontWeight: 800 }}>
                          🎲 View Dice Roll
                        </span>
                      )}
                    </div>
                    <div>{event.summary}</div>
                  </div>
                );
              })
          )}
        </div>
      </div>
    </div>
  );
};
