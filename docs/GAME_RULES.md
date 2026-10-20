# Emergent Nations - Game Rules Specification

## 1. World Structure & Starting State

- **Territories:** 36 irregular connected regions (resembling a simplified Risk world map).
- **Civilizations:** 6 starting autonomous AI civilizations.
- **Starting Allocation:**
  - Each nation controls **3 starting territories** (18 owned territories total).
  - **18 neutral territories** are unclaimed at turn 1.
- **Starting National Resources:**
  - **Gold:** 100
  - **Food:** 60
  - **Military Units:** 12 total (distributed as 4 units per owned starting territory).

---

## 2. Resource Economy

The simulation features three core resources:

1. **Gold:** Used for territorial expansion, recruitment, infrastructure development, and trade.
2. **Food:** Supports military upkeep, sustains population expansion, and prevents famine.
3. **Military Units:** Stationed across territories to defend borders, project power, and conquer rival land.

### Production Baseline
Every owned territory yields resources each turn during Phase 1:
- **Baseline Yield:** +5 Gold and +4 Food per territory per turn.
- Territories can be developed to produce higher yields (+2 per development).

### Military Upkeep & Attrition
- Armies consume food: **1 food per 4 units (rounded up)** per civilization per turn.
- **Famine Attrition:** If a nation has insufficient food to meet army upkeep, food reserves drop to 0 and units suffer attrition (2 units lost per deficit food) until the army is resized or sustained.

---

## 3. Strategic Actions

Each civilization may submit up to **two strategic actions** per turn. All actions are executed simultaneously during Phase 4 (Resolution).

| Action | Cost | Requirements | Outcome |
|---|---|---|---|
| **Claim** | 20 Gold, 10 Food | Target must be an unclaimed neutral territory adjacent to owned land | Territory annexed, 2 units garrisoned |
| **Recruit** | 20 Gold, 10 Food | Target must be an owned territory | +5 military units stationed at target |
| **Develop** | 30 Gold | Target must be an owned territory | +2 Gold or +2 Food production permanently added to territory |
| **Move** | None | Origin and target must be adjacent and owned by player | Moves units between regions; must leave &ge; 1 garrison behind |
| **Attack** | None | Target must be adjacent enemy territory | Commits units to combat; must leave &ge; 1 garrison behind |
| **Transfer** | None | Requires specified positive gold/food amounts | Directly transfers treasury or food to target nation |
| **Pass** | None | None | Conserves resources |

---

## 4. Combat Resolution

Combat occurs when units enter an adjacent territory owned by another civilization:

1. **Commitment:** Attacker designates origin and target territories, selecting how many units to commit (leaving at least 1 unit behind).
2. **Defense Bonus:** The defender receives a **+2 defensive terrain bonus**.
3. **Dice Rolls:**
   $$\text{Attacker Score} = \text{Attacking Units} + \text{Roll}(1-6)$$
   $$\text{Defender Score} = \text{Defending Units} + \text{Roll}(1-6) + 2$$
4. **Resolution:**
   - **Attacker Wins** if $\text{Attacker Score} > \text{Defender Score}$:
     - Defender garrison is eliminated.
     - Attacker suffers partial casualties ($\approx 50\%$ of defender size).
     - Surviving attackers claim ownership and garrison the captured territory.
   - **Defender Wins** if $\text{Defender Score} \ge \text{Attacker Score}$:
     - Attacking army suffers heavy casualties ($\approx 60\%$) and is repelled back to origin.
     - Defender suffers minor casualties ($\approx 30\%$).
5. **Conquest & Fall:** If a nation loses all its territories, it is marked as fallen (`is_alive = False`).

---

## 5. Turn Phasing

Each turn cycle advances through five distinct phases:

1. **`world_update`:** Resource production calculated, food upkeep deducted, attrition applied if famine occurs.
2. **`diplomacy`:** AI agents broadcast public announcements or exchange private diplomatic messages and trade proposals.
3. **`strategic_decisions`:** Each AI observes the world and submits up to two strategic actions without seeing rival commitments.
4. **`resolution`:** Engine validates and resolves moves, developments, claims, transfers, and combat.
5. **`history_memory`:** Turn snapshot is recorded, events are archived in the spectator log, memories decay or update, turn count advances.
