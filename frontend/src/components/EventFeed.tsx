import React, { useState } from 'react';
import { ScrollText, Filter } from 'lucide-react';
import { GameEvent } from '../types/contracts';

interface EventFeedProps {
  events: GameEvent[];
}

export const EventFeed: React.FC<EventFeedProps> = ({ events }) => {
  const [filterType, setFilterType] = useState<string>('all');

  const filteredEvents = events.filter((e) => {
    if (filterType === 'all') return true;
    return e.event_type === filterType;
  });

  return (
    <div className="card events-sidebar">
      <div className="card-header">
        <h2 className="card-title">
          <ScrollText size={16} />
          Chronicle ({filteredEvents.length})
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <Filter size={12} style={{ color: 'var(--text-faint)' }} />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              background: 'var(--bg-surface-elevated)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-strong)',
              fontSize: '0.72rem',
              borderRadius: '4px',
              padding: '0.15rem 0.3rem',
            }}
          >
            <option value="all">All Events</option>
            <option value="combat">Combat</option>
            <option value="claim">Territory Claims</option>
            <option value="recruit">Recruitment</option>
            <option value="develop">Development</option>
            <option value="announcement">Diplomacy</option>
            <option value="attrition">Famine / Attrition</option>
          </select>
        </div>
      </div>

      <div className="card-body">
        {filteredEvents.length === 0 ? (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-faint)', textAlign: 'center', marginTop: '2rem' }}>
            No events recorded yet.
          </div>
        ) : (
          filteredEvents.slice().reverse().map((event) => (
            <div key={event.event_id} className={`event-item ${event.event_type}`}>
              <div className="event-meta">
                <span>TURN {event.turn} &bull; {event.phase.replace('_', ' ').toUpperCase()}</span>
                <span>{event.event_type}</span>
              </div>
              <div className="event-summary">{event.summary}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
