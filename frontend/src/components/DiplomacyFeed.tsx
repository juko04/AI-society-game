import React, { useState } from 'react';
import {
  MessageSquare,
  Lock,
  Globe,
  FileText,
  Handshake,
  ShieldCheck,
  Coins,
  ChevronRight,
  Filter,
} from 'lucide-react';
import {
  DiplomaticMessage,
  DiplomaticAgreement,
  Nation,
} from '../types/contracts';

interface DiplomacyFeedProps {
  messages: DiplomaticMessage[];
  agreements: DiplomaticAgreement[];
  nations: Record<string, Nation>;
  onSelectNation: (nationId: string) => void;
}

export const DiplomacyFeed: React.FC<DiplomacyFeedProps> = ({
  messages,
  agreements,
  nations,
  onSelectNation,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'whispers' | 'public' | 'treaties'>('all');
  const [selectedNationFilter, setSelectedNationFilter] = useState<string>('all');

  const filteredMessages = messages.filter((m) => {
    if (selectedNationFilter !== 'all') {
      if (m.sender_id !== selectedNationFilter && m.recipient_id !== selectedNationFilter) {
        return false;
      }
    }
    if (activeTab === 'whispers') return m.is_private;
    if (activeTab === 'public') return !m.is_private;
    return true;
  });

  const whispersCount = messages.filter((m) => m.is_private).length;
  const publicCount = messages.filter((m) => !m.is_private).length;

  return (
    <div className="card diplomacy-panel">
      <div className="card-header">
        <h2 className="card-title">
          <MessageSquare size={16} style={{ color: 'var(--accent-purple)' }} />
          Diplomatic Chamber
        </h2>

        {/* Filter Nation Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Filter size={12} style={{ color: 'var(--text-faint)' }} />
          <select
            value={selectedNationFilter}
            onChange={(e) => setSelectedNationFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Realms</option>
            {Object.values(nations).map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="diplomacy-tabs">
        <button
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All ({messages.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'whispers' ? 'active' : ''}`}
          onClick={() => setActiveTab('whispers')}
        >
          <Lock size={12} /> Whispers ({whispersCount})
        </button>
        <button
          className={`tab-btn ${activeTab === 'public' ? 'active' : ''}`}
          onClick={() => setActiveTab('public')}
        >
          <Globe size={12} /> Broadcasts ({publicCount})
        </button>
        <button
          className={`tab-btn ${activeTab === 'treaties' ? 'active' : ''}`}
          onClick={() => setActiveTab('treaties')}
        >
          <Handshake size={12} /> Treaties ({agreements.length})
        </button>
      </div>

      <div className="card-body diplomacy-feed-body">
        {activeTab === 'treaties' ? (
          // Treaties View
          <div className="treaties-container">
            {agreements.length === 0 ? (
              <div className="empty-state">
                <FileText size={24} style={{ color: 'var(--text-faint)', marginBottom: '0.5rem' }} />
                <p>No formal treaties currently ratified.</p>
                <small>Nations will form mutual pacts as relations develop.</small>
              </div>
            ) : (
              agreements.map((agr) => {
                const p1 = nations[agr.parties[0]];
                const p2 = nations[agr.parties[1]];
                return (
                  <div key={agr.agreement_id} className="treaty-card">
                    <div className="treaty-header">
                      <div className="treaty-type">
                        {agr.agreement_type === 'alliance' && <ShieldCheck size={14} style={{ color: 'var(--accent-gold)' }} />}
                        {agr.agreement_type === 'trade_pact' && <Coins size={14} style={{ color: 'var(--accent-emerald)' }} />}
                        {agr.agreement_type === 'non_aggression' && <Handshake size={14} style={{ color: 'var(--accent-blue)' }} />}
                        <span className="treaty-title-text">
                          {agr.agreement_type.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <span className="treaty-status-pill">{agr.status}</span>
                    </div>

                    <div className="treaty-parties">
                      <span
                        className="nation-tag clickable"
                        style={{ color: p1?.color || '#fff' }}
                        onClick={() => p1 && onSelectNation(p1.id)}
                      >
                        {p1?.name || agr.parties[0]}
                      </span>
                      <span className="treaty-connector">&harr;</span>
                      <span
                        className="nation-tag clickable"
                        style={{ color: p2?.color || '#fff' }}
                        onClick={() => p2 && onSelectNation(p2.id)}
                      >
                        {p2?.name || agr.parties[1]}
                      </span>
                    </div>

                    <p className="treaty-terms">{agr.terms}</p>
                    <div className="treaty-meta">Ratified Turn {agr.turn_formed}</div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          // Messages View (Public & Private Whispers)
          <div className="messages-stream">
            {filteredMessages.length === 0 ? (
              <div className="empty-state">
                <MessageSquare size={24} style={{ color: 'var(--text-faint)', marginBottom: '0.5rem' }} />
                <p>No diplomatic messages matching filter.</p>
              </div>
            ) : (
              filteredMessages
                .slice()
                .reverse()
                .map((msg) => {
                  const sender = nations[msg.sender_id];
                  const recipient = msg.recipient_id ? nations[msg.recipient_id] : null;

                  return (
                    <div
                      key={msg.message_id}
                      className={`diplomacy-bubble ${msg.is_private ? 'whisper-bubble' : 'broadcast-bubble'}`}
                    >
                      <div className="bubble-header">
                        <div className="bubble-parties">
                          <span
                            className="nation-pill-link"
                            style={{ color: sender?.color || '#cbd5e1' }}
                            onClick={() => sender && onSelectNation(sender.id)}
                            title={`Leader: ${sender?.leader_name || 'Unknown'}`}
                          >
                            {sender?.name || msg.sender_id}
                          </span>

                          {msg.is_private && recipient ? (
                            <>
                              <ChevronRight size={12} className="bubble-arrow" />
                              <span
                                className="nation-pill-link"
                                style={{ color: recipient?.color || '#cbd5e1' }}
                                onClick={() => recipient && onSelectNation(recipient.id)}
                                title={`Leader: ${recipient?.leader_name || 'Unknown'}`}
                              >
                                {recipient?.name || msg.recipient_id}
                              </span>
                            </>
                          ) : (
                            <span className="public-broadcast-label">
                              <Globe size={10} /> Public Realm
                            </span>
                          )}
                        </div>

                        <div className="bubble-meta">
                          {msg.is_private ? (
                            <span className="whisper-badge">
                              <Lock size={10} /> Secret Whisper
                            </span>
                          ) : (
                            <span className="broadcast-badge">Announcement</span>
                          )}
                          <span className="bubble-turn">T{msg.turn}</span>
                        </div>
                      </div>

                      <div className="bubble-content">
                        &ldquo;{msg.content}&rdquo;
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
