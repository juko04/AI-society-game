/**
 * Deterministic Client-Side Simulation Engine for Emergent Nations.
 * Provides complete standalone simulation capability in the browser when
 * the backend is offline or during interactive UI development.
 * Follows the authoritative game rules defined in GAME_RULES.md.
 */

import {
  WorldState,
  Nation,
  Territory,
  GameEvent,
  DiplomaticMessage,
  DiplomaticAgreement,
  SimulationStepResponse,
} from '../types/contracts';

import sampleWorldFixture from '../../../fixtures/sample_world.json';
import sampleEventsFixture from '../../../fixtures/sample_events.json';

export interface TurnSnapshot {
  turn: number;
  worldState: WorldState;
  events: GameEvent[];
  messages: DiplomaticMessage[];
  agreements: DiplomaticAgreement[];
}

export class OfflineSimulationEngine {
  private world: WorldState;
  private events: GameEvent[] = [];
  private messages: DiplomaticMessage[] = [];
  private agreements: DiplomaticAgreement[] = [];
  private history: TurnSnapshot[] = [];
  private rngSeed: number;

  constructor() {
    this.rngSeed = 42;
    this.world = JSON.parse(JSON.stringify(sampleWorldFixture));
    this.events = JSON.parse(JSON.stringify(sampleEventsFixture));
    this.recordSnapshot();
  }

  private random(min: number, max: number): number {
    this.rngSeed = (this.rngSeed * 9301 + 49297) % 233280;
    const rnd = this.rngSeed / 233280;
    return min + Math.floor(rnd * (max - min + 1));
  }

  private nowIso(): string {
    return new Date().toISOString();
  }

  public getWorldState(): WorldState {
    return JSON.parse(JSON.stringify(this.world));
  }

  public getEvents(limit = 100, nationId?: string): GameEvent[] {
    let list = this.events;
    if (nationId) {
      list = list.filter(
        (e) => e.source_nation_id === nationId || e.target_nation_id === nationId
      );
    }
    return list.slice(-limit);
  }

  public getMessages(limit = 100): DiplomaticMessage[] {
    return this.messages.slice(-limit);
  }

  public getAgreements(): DiplomaticAgreement[] {
    return this.agreements.filter((a) => a.status === 'active');
  }

  public getHistory(): TurnSnapshot[] {
    return this.history;
  }

  public reset(scenario: 'standard' | 'triad' = 'standard'): WorldState {
    this.rngSeed = Math.floor(Math.random() * 10000);
    const base: WorldState = JSON.parse(JSON.stringify(sampleWorldFixture));
    base.seed = this.rngSeed;
    base.turn = 1;
    base.phase = 'world_update';

    if (scenario === 'triad') {
      // 3-Agent Scenario (Opportunist, Altruist, Skeptic)
      const allowed = ['nation_solaria', 'nation_borealis', 'nation_viridia'];
      const filteredNations: Record<string, Nation> = {};
      for (const id of allowed) {
        if (base.nations[id]) {
          filteredNations[id] = { ...base.nations[id], food: 35 }; // Lower food to provoke food crisis
        }
      }
      base.nations = filteredNations;
      // Mark other nation territories as neutral
      for (const tid in base.territories) {
        if (base.territories[tid].owner_id && !allowed.includes(base.territories[tid].owner_id!)) {
          base.territories[tid].owner_id = null;
        }
      }
    }

    this.world = base;
    this.events = [
      {
        event_id: `evt_init_${Date.now()}`,
        turn: 1,
        phase: 'world_update',
        event_type: 'world_update',
        summary: `Simulation initialized with ${Object.keys(base.nations).length} civilizations and 36 territories.`,
        source_nation_id: null,
        target_nation_id: null,
        territory_id: null,
        details: { scenario, seed: this.rngSeed },
        timestamp: this.nowIso(),
      },
    ];
    this.messages = [];
    this.agreements = [];
    this.history = [];
    this.recordSnapshot();
    return this.getWorldState();
  }

  private recordSnapshot() {
    this.history.push({
      turn: this.world.turn,
      worldState: JSON.parse(JSON.stringify(this.world)),
      events: [...this.events],
      messages: [...this.messages],
      agreements: [...this.agreements],
    });
    // Keep max 50 snapshots
    if (this.history.length > 50) {
      this.history.shift();
    }
  }

  public step(fullTurn = false, stage?: 'diplomacy' | 'resolution'): SimulationStepResponse {
    const prevPhase = this.world.phase;
    const newEvents: GameEvent[] = [];

    if (stage === 'diplomacy') {
      if (this.world.phase === 'world_update') {
        newEvents.push(...this.stepSinglePhase());
      }
      if (this.world.phase === 'diplomacy') {
        newEvents.push(...this.stepSinglePhase());
      }
    } else if (stage === 'resolution') {
      if (this.world.phase === 'strategic_decisions') {
        newEvents.push(...this.stepSinglePhase());
      }
      if (this.world.phase === 'resolution') {
        newEvents.push(...this.stepSinglePhase());
      }
      if (this.world.phase === 'history_memory') {
        newEvents.push(...this.stepSinglePhase());
      }
    } else if (fullTurn) {
      for (let i = 0; i < 5; i++) {
        const evts = this.stepSinglePhase();
        newEvents.push(...evts);
      }
    } else {
      const evts = this.stepSinglePhase();
      newEvents.push(...evts);
    }

    this.events.push(...newEvents);
    return {
      status: 'success',
      previous_phase: prevPhase,
      current_phase: this.world.phase,
      current_turn: this.world.turn,
      new_events: newEvents,
      world_state: this.getWorldState(),
    };
  }

  private stepSinglePhase(): GameEvent[] {
    const events: GameEvent[] = [];
    const phase = this.world.phase;

    switch (phase) {
      case 'world_update': {
        // Phase 1: Resource production & food upkeep
        for (const nid in this.world.nations) {
          const nation = this.world.nations[nid];
          if (!nation.is_alive) continue;

          let goldGain = 0;
          let foodGain = 0;
          let totalMilitary = 0;

          for (const tid of nation.territory_ids) {
            const terr = this.world.territories[tid];
            if (terr) {
              goldGain += terr.gold_production;
              foodGain += terr.food_production;
              totalMilitary += terr.stationed_military;
            }
          }

          nation.gold += goldGain;
          nation.food += foodGain;
          nation.military_units = totalMilitary;

          const upkeep = Math.ceil(totalMilitary / 4);
          if (nation.food >= upkeep) {
            nation.food -= upkeep;
          } else {
            // Food deficit / famine attrition
            const deficit = upkeep - nation.food;
            nation.food = 0;
            const lostUnits = Math.min(deficit * 2, totalMilitary);
            if (lostUnits > 0) {
              this.applyAttrition(nation, lostUnits);
              events.push({
                event_id: `evt_attr_${this.world.turn}_${nid}_${Date.now()}`,
                turn: this.world.turn,
                phase: 'world_update',
                event_type: 'attrition',
                summary: `${nation.name} suffered a food shortage: ${lostUnits} military units lost to famine.`,
                source_nation_id: nid,
                target_nation_id: null,
                territory_id: null,
                details: { deficit, lostUnits },
                timestamp: this.nowIso(),
              });
            }
          }
        }
        this.world.phase = 'diplomacy';
        break;
      }

      case 'diplomacy': {
        // Phase 2: AI communication & treaties
        const livingNations = Object.values(this.world.nations).filter((n) => n.is_alive);
        for (const nation of livingNations) {
          // 40% chance of diplomatic activity
          if (this.random(1, 100) <= 65) {
            const otherNations = livingNations.filter((n) => n.id !== nation.id);
            if (otherNations.length === 0) continue;
            const target = otherNations[this.random(0, otherNations.length - 1)];

            const isPrivate = this.random(1, 100) > 40;
            const msgContent = this.generateDiplomaticText(nation, target, isPrivate);

            const msg: DiplomaticMessage = {
              message_id: `msg_${this.world.turn}_${nation.id}_${Date.now()}`,
              turn: this.world.turn,
              sender_id: nation.id,
              recipient_id: isPrivate ? target.id : null,
              is_private: isPrivate,
              content: msgContent,
              timestamp: this.nowIso(),
            };
            this.messages.push(msg);

            events.push({
              event_id: `evt_msg_${this.world.turn}_${nation.id}_${Date.now()}`,
              turn: this.world.turn,
              phase: 'diplomacy',
              event_type: isPrivate ? 'whisper' : 'announcement',
              summary: isPrivate
                ? `${nation.name} whispered privately to ${target.name}: "${msgContent.slice(0, 50)}..."`
                : `${nation.name} broadcast: "${msgContent.slice(0, 50)}..."`,
              source_nation_id: nation.id,
              target_nation_id: isPrivate ? target.id : null,
              territory_id: null,
              details: { is_private: isPrivate, full_content: msgContent },
              timestamp: this.nowIso(),
            });

            // Occasional treaty formation
            if (this.random(1, 100) <= 20) {
              const types = ['non_aggression', 'trade_pact', 'alliance'] as const;
              const agrType = types[this.random(0, types.length - 1)];
              const agreement: DiplomaticAgreement = {
                agreement_id: `agr_${this.world.turn}_${nation.id}_${target.id}`,
                turn_formed: this.world.turn,
                parties: [nation.id, target.id],
                agreement_type: agrType,
                terms: `${nation.name} and ${target.name} agreed to a formal ${agrType.replace('_', ' ')}.`,
                status: 'active',
              };
              this.agreements.push(agreement);
              events.push({
                event_id: `evt_treaty_${this.world.turn}_${Date.now()}`,
                turn: this.world.turn,
                phase: 'diplomacy',
                event_type: 'treaty',
                summary: `Formal treaty established: ${agreement.terms}`,
                source_nation_id: nation.id,
                target_nation_id: target.id,
                territory_id: null,
                details: { agreement_type: agrType },
                timestamp: this.nowIso(),
              });
            }
          }
        }
        this.world.phase = 'strategic_decisions';
        break;
      }

      case 'strategic_decisions': {
        // Collect orders: claims, recruits, developments, combat orders
        this.world.phase = 'resolution';
        break;
      }

      case 'resolution': {
        // Phase 4: Execute actions & combat
        for (const nid in this.world.nations) {
          const nation = this.world.nations[nid];
          if (!nation.is_alive) continue;

          // 1. Check for neutral claim
          const adjacentNeutrals = this.getAdjacentNeutralTerritories(nation);
          if (adjacentNeutrals.length > 0 && nation.gold >= 20 && nation.food >= 10 && this.random(1, 100) <= 60) {
            const target = adjacentNeutrals[this.random(0, adjacentNeutrals.length - 1)];
            nation.gold -= 20;
            nation.food -= 10;
            target.owner_id = nation.id;
            target.stationed_military = 2;
            nation.territory_ids.push(target.id);
            nation.military_units += 2;

            events.push({
              event_id: `evt_claim_${this.world.turn}_${target.id}_${Date.now()}`,
              turn: this.world.turn,
              phase: 'resolution',
              event_type: 'claim',
              summary: `${nation.name} claimed neutral territory ${target.name} (${target.id}) with 2 garrison units.`,
              source_nation_id: nation.id,
              target_nation_id: null,
              territory_id: target.id,
              details: { cost_gold: 20, cost_food: 10, stationed: 2 },
              timestamp: this.nowIso(),
            });
            continue;
          }

          // 2. Check for recruitment
          if (nation.gold >= 25 && nation.food >= 15 && nation.territory_ids.length > 0 && this.random(1, 100) <= 45) {
            const tid = nation.territory_ids[this.random(0, nation.territory_ids.length - 1)];
            const terr = this.world.territories[tid];
            if (terr) {
              nation.gold -= 20;
              nation.food -= 10;
              terr.stationed_military += 5;
              nation.military_units += 5;

              events.push({
                event_id: `evt_recruit_${this.world.turn}_${tid}_${Date.now()}`,
                turn: this.world.turn,
                phase: 'resolution',
                event_type: 'recruit',
                summary: `${nation.name} recruited 5 military units in ${terr.name} (${tid}).`,
                source_nation_id: nation.id,
                target_nation_id: null,
                territory_id: tid,
                details: { cost_gold: 20, cost_food: 10, added: 5 },
                timestamp: this.nowIso(),
              });
              continue;
            }
          }

          // 3. Check for attack on neighboring enemy territory
          const attackOption = this.findAttackOpportunity(nation);
          if (attackOption && this.random(1, 100) <= (nation.personality === 'Aggressive' ? 80 : 35)) {
            const combatEvent = this.resolveCombat(
              nation,
              attackOption.defender,
              attackOption.origin,
              attackOption.target,
              attackOption.attackingUnits
            );
            events.push(combatEvent);
            continue;
          }

          // 4. Develop territory
          if (nation.gold >= 30 && nation.territory_ids.length > 0 && this.random(1, 100) <= 40) {
            const tid = nation.territory_ids[this.random(0, nation.territory_ids.length - 1)];
            const terr = this.world.territories[tid];
            if (terr) {
              nation.gold -= 30;
              const isFood = this.random(1, 2) === 1;
              if (isFood) {
                terr.food_production += 2;
              } else {
                terr.gold_production += 2;
              }

              events.push({
                event_id: `evt_dev_${this.world.turn}_${tid}_${Date.now()}`,
                turn: this.world.turn,
                phase: 'resolution',
                event_type: 'develop',
                summary: `${nation.name} upgraded infrastructure in ${terr.name} (+2 ${isFood ? 'Food' : 'Gold'} yield).`,
                source_nation_id: nation.id,
                target_nation_id: null,
                territory_id: tid,
                details: { cost_gold: 30, yield_developed: isFood ? 'food' : 'gold' },
                timestamp: this.nowIso(),
              });
            }
          }
        }
        this.world.phase = 'history_memory';
        break;
      }

      case 'history_memory': {
        // Phase 5: Snapshot & increment turn
        this.recordSnapshot();
        this.world.turn += 1;
        this.world.phase = 'world_update';
        break;
      }
    }

    return events;
  }

  private applyAttrition(nation: Nation, lostUnits: number) {
    let remaining = lostUnits;
    for (const tid of nation.territory_ids) {
      const terr = this.world.territories[tid];
      if (terr && terr.stationed_military > 1) {
        const canRemove = Math.min(remaining, terr.stationed_military - 1);
        terr.stationed_military -= canRemove;
        remaining -= canRemove;
        if (remaining <= 0) break;
      }
    }
    nation.military_units = Math.max(0, nation.military_units - (lostUnits - remaining));
  }

  private getAdjacentNeutralTerritories(nation: Nation): Territory[] {
    const neutrals: Territory[] = [];
    const checked = new Set<string>();

    for (const tid of nation.territory_ids) {
      const terr = this.world.territories[tid];
      if (!terr) continue;
      for (const adjId of terr.adjacent_territory_ids) {
        if (!checked.has(adjId)) {
          checked.add(adjId);
          const adj = this.world.territories[adjId];
          if (adj && adj.owner_id === null) {
            neutrals.push(adj);
          }
        }
      }
    }
    return neutrals;
  }

  private findAttackOpportunity(nation: Nation): {
    origin: Territory;
    target: Territory;
    defender: Nation;
    attackingUnits: number;
  } | null {
    for (const tid of nation.territory_ids) {
      const origin = this.world.territories[tid];
      if (!origin || origin.stationed_military <= 2) continue;

      for (const adjId of origin.adjacent_territory_ids) {
        const target = this.world.territories[adjId];
        if (target && target.owner_id && target.owner_id !== nation.id) {
          const defender = this.world.nations[target.owner_id];
          if (!defender || !defender.is_alive) continue;

          const attackingUnits = origin.stationed_military - 1;
          // Attack if attacker has favorable numbers or aggressive personality
          if (attackingUnits > target.stationed_military || nation.personality === 'Aggressive') {
            return { origin, target, defender, attackingUnits };
          }
        }
      }
    }
    return null;
  }

  private resolveCombat(
    attackerNation: Nation,
    defenderNation: Nation,
    origin: Territory,
    target: Territory,
    attackingUnits: number
  ): GameEvent {
    const atkDie = this.random(1, 6);
    const defDie = this.random(1, 6);
    const defBonus = 2;

    const atkScore = attackingUnits + atkDie;
    const defScore = target.stationed_military + defDie + defBonus;

    const attackerWon = atkScore > defScore;
    let atkLosses: number;
    let defLosses: number;
    let summary: string;

    if (attackerWon) {
      atkLosses = Math.min(attackingUnits - 1, Math.max(1, Math.floor(target.stationed_military * 0.5)));
      defLosses = target.stationed_military;
      const surviving = attackingUnits - atkLosses;

      origin.stationed_military -= attackingUnits;
      target.owner_id = attackerNation.id;
      target.stationed_military = surviving;

      defenderNation.territory_ids = defenderNation.territory_ids.filter((t) => t !== target.id);
      attackerNation.territory_ids.push(target.id);

      summary = `${attackerNation.name} attacked ${target.name} and conquered it from ${defenderNation.name}! ` +
        `Rolls: ${atkScore} (atk) vs ${defScore} (def). Casualties: Atk ${atkLosses}, Def ${defLosses}.`;
    } else {
      atkLosses = Math.min(attackingUnits, Math.max(1, Math.floor(attackingUnits * 0.6)));
      defLosses = Math.min(target.stationed_military - 1, Math.max(0, Math.floor(attackingUnits * 0.3)));

      origin.stationed_military -= atkLosses;
      target.stationed_military -= defLosses;

      summary = `${defenderNation.name} repelled an attack by ${attackerNation.name} on ${target.name}. ` +
        `Rolls: ${atkScore} (atk) vs ${defScore} (def). Casualties: Atk ${atkLosses}, Def ${defLosses}.`;
    }

    attackerNation.military_units = attackerNation.territory_ids.reduce(
      (sum, tid) => sum + (this.world.territories[tid]?.stationed_military || 0),
      0
    );
    defenderNation.military_units = defenderNation.territory_ids.reduce(
      (sum, tid) => sum + (this.world.territories[tid]?.stationed_military || 0),
      0
    );

    if (defenderNation.territory_ids.length === 0) {
      defenderNation.is_alive = false;
      summary += ` ⚠️ ${defenderNation.name} has fallen and ceased to exist!`;
    }

    return {
      event_id: `evt_combat_${this.world.turn}_${origin.id}_${target.id}_${Date.now()}`,
      turn: this.world.turn,
      phase: 'resolution',
      event_type: 'combat',
      summary,
      source_nation_id: attackerNation.id,
      target_nation_id: defenderNation.id,
      territory_id: target.id,
      details: {
        attacker_roll: atkDie,
        defender_roll: defDie,
        defensive_bonus: defBonus,
        attacker_score: atkScore,
        defender_score: defScore,
        attacker_won: attackerWon,
        attacker_losses: atkLosses,
        defender_losses: defLosses,
        origin_tid: origin.id,
        target_tid: target.id,
      },
      timestamp: this.nowIso(),
    };
  }

  private generateDiplomaticText(sender: Nation, target: Nation, isPrivate: boolean): string {
    const p = sender.personality;
    if (isPrivate) {
      if (p === 'Opportunist') {
        return `We see your borders are stretched thin, ${target.leader_name}. Perhaps we can strike a secret deal to share grain before someone takes it.`;
      } else if (p === 'Altruist') {
        return `Greetings ${target.leader_name}. Should famine or strife threaten your people, our granaries are open to mutual assistance.`;
      } else if (p === 'Skeptic') {
        return `We noticed troop concentrations near our border, ${target.leader_name}. Clarify your intentions immediately.`;
      } else if (p === 'Aggressive') {
        return `Withdraw your garrison from our shared boundary or taste the fury of our legions.`;
      } else if (p === 'Diplomatic') {
        return `A formal defensive treaty between our peoples would secure lasting peace for both our realms.`;
      } else {
        return `We propose a quiet non-aggression understanding to preserve tranquility along the riverlands.`;
      }
    } else {
      if (p === 'Opportunist') {
        return `Solaria prospers under wise guidance. We welcome trade inquiries from all solvent realms.`;
      } else if (p === 'Altruist') {
        return `Let all nations remember that unity and cooperation are the true foundations of civilization.`;
      } else if (p === 'Skeptic') {
        return `We honor established boundaries and will defend our ancestral soil against any reckless transgression.`;
      } else if (p === 'Aggressive') {
        return `The strong expand, the weak perish. The destiny of this continent belongs to the bold.`;
      } else if (p === 'Diplomatic') {
        return `We urge all leaders to settle disputes through council and pacts rather than senseless bloodshed.`;
      } else {
        return `Our watchtowers stand vigilant, observing the balance of power across the continent.`;
      }
    }
  }
}

export const offlineEngine = new OfflineSimulationEngine();
