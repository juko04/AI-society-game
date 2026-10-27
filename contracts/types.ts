// AI NOTICE: Before modifying this project, read AGENTS.md for architecture, flexibility, and collaboration guidelines.
/**
 * Shared Data Contracts - TypeScript definitions
 * Generated to match backend/app/schemas/contracts.py
 */

export type PhaseType =
  | 'world_update'
  | 'diplomacy'
  | 'strategic_decisions'
  | 'resolution'
  | 'history_memory';

export type ActionType =
  | 'claim'
  | 'recruit'
  | 'develop'
  | 'move'
  | 'attack'
  | 'transfer'
  | 'trade'
  | 'alliance'
  | 'pass';

export type AgreementType =
  | 'alliance'
  | 'non_aggression'
  | 'trade_pact'
  | 'military_access';

export type AgreementStatus =
  | 'active'
  | 'violated'
  | 'expired'
  | 'terminated';

export type MemoryType =
  | 'historical_fact'
  | 'current_belief'
  | 'recent_context';

export interface Territory {
  id: string;
  name: string;
  owner_id: string | null;
  gold_production: number;
  food_production: number;
  stationed_military: number;
  adjacent_territory_ids: string[];
  coord_x: number;
  coord_y: number;
}

export interface Nation {
  id: string;
  name: string;
  color: string;
  leader_name: string;
  personality?: string | null;
  gold: number;
  food: number;
  military_units: number;
  territory_ids: string[];
  current_goals: string[];
  is_alive: boolean;
}

export interface GameAction {
  action_id: string;
  nation_id: string;
  action_type: ActionType;
  target_territory_id?: string | null;
  origin_territory_id?: string | null;
  target_nation_id?: string | null;
  units_count?: number | null;
  gold_amount?: number | null;
  food_amount?: number | null;
  develop_target?: 'gold' | 'food' | null;
  reasoning_note?: string | null;
}

export interface DiplomaticMessage {
  message_id: string;
  turn: number;
  sender_id: string;
  recipient_id?: string | null; // null if public broadcast
  is_private: boolean;
  content: string;
  timestamp?: string | null;
}

export interface DiplomaticAgreement {
  agreement_id: string;
  turn_formed: number;
  parties: string[];
  agreement_type: AgreementType;
  terms: string;
  status: AgreementStatus;
}

export interface MemoryEntry {
  memory_id: string;
  nation_id: string;
  memory_type: MemoryType;
  subject_nation_id?: string | null;
  summary: string;
  importance: number;
  turn_recorded: number;
  last_updated_turn: number;
}

export interface GameEvent {
  event_id: string;
  turn: number;
  phase: string;
  event_type: string;
  summary: string;
  source_nation_id?: string | null;
  target_nation_id?: string | null;
  territory_id?: string | null;
  details: Record<string, unknown>;
  timestamp: string;
}

export interface WorldState {
  simulation_id: string;
  turn: number;
  phase: PhaseType;
  seed: number;
  nations: Record<string, Nation>;
  territories: Record<string, Territory>;
  is_paused: boolean;
  speed: number;
  active_thinking_nation_id?: string | null;
  active_thinking_activity?: string | null;
}

export interface AgentObservation {
  turn: number;
  nation: Nation;
  known_territories: Territory[];
  current_goals: string[];
  recent_events: string[];
  relationships: Record<string, string>;
  visible_messages: DiplomaticMessage[];
  available_actions: string[];
}

export interface AgentDecision {
  nation_id: string;
  turn: number;
  actions: GameAction[];
  outgoing_messages: DiplomaticMessage[];
  strategy_note?: string | null;
}

export interface SimulationConfig {
  simulation_id: string;
  seed: number;
  territory_count: number;
  nation_count: number;
  ai_model: string;
  use_mock_agents: boolean;
  max_turns: number;
}

export interface HealthResponse {
  status: string;
  app_name: string;
  version: string;
  environment: string;
  mock_ai_enabled: boolean;
  ai_model: string;
  active_simulation_id?: string | null;
  current_turn: number;
}

export interface SimulationStepResponse {
  status: string;
  previous_phase: string;
  current_phase: string;
  current_turn: number;
  new_events: GameEvent[];
  world_state: WorldState;
}
