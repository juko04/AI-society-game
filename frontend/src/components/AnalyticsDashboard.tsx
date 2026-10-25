import React, { useState } from 'react';
import {
  TrendingUp,
  Shield,
  Coins,
  Wheat,
  MapPin,
  Award,
  BarChart3,
} from 'lucide-react';
import { Nation, Territory } from '../types/contracts';
import { TurnSnapshot } from '../services/offlineEngine';

interface AnalyticsDashboardProps {
  nations: Record<string, Nation>;
  territories: Record<string, Territory>;
  history: TurnSnapshot[];
  onSelectNation: (nationId: string) => void;
}

type MetricType = 'military' | 'gold' | 'food' | 'territories';

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  nations,
  territories,
  history,
  onSelectNation,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('military');

  const nationsList = Object.values(nations);
  const totalTerritories = Object.keys(territories).length || 36;

  // Calculate composite power scores
  const leaderboard = nationsList
    .map((n) => {
      // Power Formula: Military (40%) + Lands * 10 (35%) + Gold * 0.2 (25%)
      const score = Math.round(
        n.military_units * 2.5 +
        n.territory_ids.length * 15 +
        n.gold * 0.25
      );
      return {
        ...n,
        powerScore: n.is_alive ? score : 0,
        landPercentage: Math.round((n.territory_ids.length / totalTerritories) * 100),
      };
    })
    .sort((a, b) => b.powerScore - a.powerScore);

  // Unclaimed neutral territories
  const neutralCount = Object.values(territories).filter((t) => t.owner_id === null).length;

  // Chart Dimensions
  const chartWidth = 520;
  const chartHeight = 220;
  const padding = { top: 20, right: 30, bottom: 30, left: 45 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Prepare time-series data from history
  const turns = history.length > 0 ? history.map((h) => h.turn) : [1];
  const minTurn = turns[0];
  const maxTurn = turns[turns.length - 1];

  // Helper to extract metric values
  const getMetricValue = (n: Nation | undefined, metric: MetricType): number => {
    if (!n) return 0;
    switch (metric) {
      case 'military':
        return n.military_units;
      case 'gold':
        return n.gold;
      case 'food':
        return n.food;
      case 'territories':
        return n.territory_ids.length;
    }
  };

  // Find max value across all nations and history for Y scale
  let maxY = 10;
  if (history.length > 0) {
    history.forEach((snap) => {
      Object.values(snap.worldState.nations).forEach((nat) => {
        const val = getMetricValue(nat, selectedMetric);
        if (val > maxY) maxY = val;
      });
    });
  } else {
    nationsList.forEach((nat) => {
      const val = getMetricValue(nat, selectedMetric);
      if (val > maxY) maxY = val;
    });
  }
  // Add 15% headroom
  maxY = Math.ceil(maxY * 1.15);

  const getX = (t: number) => {
    if (maxTurn === minTurn) return padding.left + innerWidth / 2;
    return padding.left + ((t - minTurn) / (maxTurn - minTurn)) * innerWidth;
  };

  const getY = (val: number) => {
    return padding.top + innerHeight - (val / maxY) * innerHeight;
  };

  return (
    <div className="card analytics-dashboard">
      <div className="card-header">
        <h2 className="card-title">
          <BarChart3 size={16} style={{ color: 'var(--accent-emerald)' }} />
          Comparative Strategic Intelligence
        </h2>

        {/* Metric Selector Tabs */}
        <div className="metric-toggle-group">
          <button
            className={`metric-btn ${selectedMetric === 'military' ? 'active' : ''}`}
            onClick={() => setSelectedMetric('military')}
            title="Military Units"
          >
            <Shield size={12} /> Army
          </button>
          <button
            className={`metric-btn ${selectedMetric === 'gold' ? 'active' : ''}`}
            onClick={() => setSelectedMetric('gold')}
            title="Gold Treasury"
          >
            <Coins size={12} /> Gold
          </button>
          <button
            className={`metric-btn ${selectedMetric === 'food' ? 'active' : ''}`}
            onClick={() => setSelectedMetric('food')}
            title="Food Reserves"
          >
            <Wheat size={12} /> Food
          </button>
          <button
            className={`metric-btn ${selectedMetric === 'territories' ? 'active' : ''}`}
            onClick={() => setSelectedMetric('territories')}
            title="Controlled Territories"
          >
            <MapPin size={12} /> Lands
          </button>
        </div>
      </div>

      <div className="card-body analytics-grid">
        {/* Left: Trend Line Chart */}
        <div className="chart-container">
          <div className="chart-header">
            <span className="chart-title">
              <TrendingUp size={13} /> {selectedMetric.toUpperCase()} OVER TIME
            </span>
            <span className="chart-subtitle">
              Turn {minTurn} &rarr; Turn {maxTurn} (Max: {maxY})
            </span>
          </div>

          <svg
            className="analytics-svg"
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Gridlines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = padding.top + innerHeight * (1 - ratio);
              const labelVal = Math.round(maxY * ratio);
              return (
                <g key={ratio}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={padding.left + innerWidth}
                    y2={y}
                    stroke="#1e293b"
                    strokeDasharray="3,3"
                  />
                  <text
                    x={padding.left - 6}
                    y={y + 3}
                    fill="#64748b"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="end"
                  >
                    {labelVal}
                  </text>
                </g>
              );
            })}

            {/* X-axis ticks */}
            {turns.length > 1 && (
              <>
                <text
                  x={padding.left}
                  y={chartHeight - 8}
                  fill="#64748b"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  T{minTurn}
                </text>
                <text
                  x={padding.left + innerWidth}
                  y={chartHeight - 8}
                  fill="#64748b"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  T{maxTurn}
                </text>
              </>
            )}

            {/* Line Series per Nation */}
            {nationsList.map((nation) => {
              const points: { x: number; y: number; val: number }[] = [];

              if (history.length > 0) {
                history.forEach((snap) => {
                  const n = snap.worldState.nations[nation.id];
                  const val = getMetricValue(n, selectedMetric);
                  points.push({
                    x: getX(snap.turn),
                    y: getY(val),
                    val,
                  });
                });
              } else {
                const val = getMetricValue(nation, selectedMetric);
                points.push({
                  x: getX(1),
                  y: getY(val),
                  val,
                });
              }

              const pathD = points
                .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
                .join(' ');

              const lastPt = points[points.length - 1];

              return (
                <g key={nation.id}>
                  {/* Glowing shadow line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={nation.color}
                    strokeWidth="4"
                    strokeOpacity="0.2"
                  />
                  {/* Main line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={nation.color}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Latest point dot */}
                  {lastPt && (
                    <circle
                      cx={lastPt.x}
                      cy={lastPt.y}
                      r="4"
                      fill={nation.color}
                      stroke="#0f172a"
                      strokeWidth="1.5"
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Territorial Distribution Progress Bar */}
          <div className="territorial-share-section">
            <div className="share-header">
              <span>Continental Territorial Share (36 Regions)</span>
              <span>{36 - neutralCount} Claimed &bull; {neutralCount} Neutral</span>
            </div>
            <div className="stacked-progress-bar">
              {nationsList.map((n) => {
                const pct = (n.territory_ids.length / 36) * 100;
                if (pct === 0) return null;
                return (
                  <div
                    key={n.id}
                    className="progress-slice"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: n.color,
                    }}
                    title={`${n.name}: ${n.territory_ids.length} territories (${pct.toFixed(0)}%)`}
                    onClick={() => onSelectNation(n.id)}
                  />
                );
              })}
              {neutralCount > 0 && (
                <div
                  className="progress-slice neutral-slice"
                  style={{ width: `${(neutralCount / 36) * 100}%` }}
                  title={`Neutral / Unclaimed: ${neutralCount} territories`}
                />
              )}
            </div>
          </div>
        </div>

        {/* Right: Superpower Rankings Leaderboard */}
        <div className="leaderboard-container">
          <div className="leaderboard-header">
            <Award size={14} style={{ color: 'var(--accent-gold)' }} />
            <span>GLOBAL SUPERPOWER RANKINGS</span>
          </div>

          <div className="ranking-list">
            {leaderboard.map((nation, index) => {
              const rank = index + 1;
              return (
                <div
                  key={nation.id}
                  className={`rank-item ${!nation.is_alive ? 'fallen-rank' : ''}`}
                  onClick={() => onSelectNation(nation.id)}
                  style={{
                    borderLeft: `3px solid ${nation.color}`,
                  }}
                >
                  <div className="rank-badge-col">
                    <span
                      className={`rank-number ${rank === 1 ? 'rank-gold' : rank === 2 ? 'rank-silver' : rank === 3 ? 'rank-bronze' : ''}`}
                    >
                      #{rank}
                    </span>
                  </div>

                  <div className="rank-info-col">
                    <div className="rank-name-row">
                      <span className="rank-name" style={{ color: nation.color }}>
                        {nation.name}
                      </span>
                      {!nation.is_alive && <span className="fallen-tag">FALLEN</span>}
                      {nation.is_alive && (
                        <span className="power-score-tag">
                          {nation.powerScore} pts
                        </span>
                      )}
                    </div>
                    <div className="rank-leader-sub">
                      Leader: {nation.leader_name} &bull; {nation.personality || 'Neutral'}
                    </div>

                    <div className="rank-mini-stats">
                      <span title="Military Units"><Shield size={10} /> {nation.military_units}</span>
                      <span title="Controlled Territories"><MapPin size={10} /> {nation.territory_ids.length}</span>
                      <span title="Gold Reserves"><Coins size={10} /> {nation.gold}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
