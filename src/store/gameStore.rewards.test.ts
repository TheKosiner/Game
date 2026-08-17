// Regression tests for the endgame reward explosion.
//
// A level 301 player reported gaining 11 levels in one operation while the
// character stayed at 301, gained no gold and kept its daily run. The reward
// multiplier `1.02^level` is exponential while the XP curve `100·level^2.2` is
// polynomial, so past ~level 150 the multiplier ran away: 380x at level 301,
// over 19000x at 500. Enemy rewards already scale with the enemy's own level,
// so this was multiplying a value that was scaling anyway.
//
// One run then breached the server-side save rules — the level may only rise by
// a bounded amount per write and `goldEarnedToday` is capped — Firestore
// rejected the save, and the client's rejection handler reverted the run. The
// player saw the level-up, then lost everything it earned.
//
// These tests pin the reward budget to the limits in firestore.rules.
import { describe, it, expect } from 'vitest';
import { calcDungeonReward, MAX_DAILY_DUNGEONS } from './gameStore';
import { calcXpToNext } from '../utils/combat';

/** Caps enforced by validSaveUpdate/validGoldEarned in firestore.rules. */
const GOLD_PER_DAY_CAP = 250_000_000;
const LEVELS_PER_SAVE_CAP = 10;

/** The richest enemy in the game, and the length of one operation. */
const TOP_ENEMY = { xpReward: 670_000, goldReward: 525_000 };
const FLOORS_PER_RUN = 10;

/** Highest-yield settings a player can choose. */
const BEST_XP = { mode: 'xp', diff: 'hard' } as const;
const BEST_GOLD = { mode: 'balanced', diff: 'hard' } as const;

function runXp(level: number, mode: 'xp' | 'balanced' | 'loot', diff: 'easy' | 'normal' | 'hard') {
  return calcDungeonReward(TOP_ENEMY, level, mode, diff).xp * FLOORS_PER_RUN;
}
function runGold(level: number, mode: 'xp' | 'balanced' | 'loot', diff: 'easy' | 'normal' | 'hard') {
  return calcDungeonReward(TOP_ENEMY, level, mode, diff).gold * FLOORS_PER_RUN;
}

/** Levels gained by a run, walking the curve the way addXp does. */
function levelsGained(level: number, xp: number): number {
  let lvl = level, pool = xp, gained = 0;
  while (pool >= calcXpToNext(lvl) && gained < 1000) {
    pool -= calcXpToNext(lvl);
    lvl++; gained++;
  }
  return gained;
}

const ENDGAME = [150, 200, 301, 400, 500];

describe('reward budget stays inside the server save rules', () => {
  it.each(ENDGAME)('a full day of operations at level %i stays under the gold cap', level => {
    const perDay = runGold(level, BEST_GOLD.mode, BEST_GOLD.diff) * MAX_DAILY_DUNGEONS;
    expect(perDay).toBeLessThan(GOLD_PER_DAY_CAP);
  });

  it.each(ENDGAME)('one operation at level %i stays under the level-jump cap', level => {
    expect(levelsGained(level, runXp(level, BEST_XP.mode, BEST_XP.diff)))
      .toBeLessThan(LEVELS_PER_SAVE_CAP);
  });
});

describe('the hero-level multiplier is bounded', () => {
  it('stops growing instead of running away with level', () => {
    const at300 = calcDungeonReward(TOP_ENEMY, 300, 'balanced', 'normal').xp;
    const at500 = calcDungeonReward(TOP_ENEMY, 500, 'balanced', 'normal').xp;
    expect(at500).toBe(at300);
  });

  it('never exceeds 2.5x the base reward', () => {
    for (const level of [1, 50, 100, 200, 301, 500]) {
      const r = calcDungeonReward(TOP_ENEMY, level, 'balanced', 'normal');
      expect(r.xp / TOP_ENEMY.xpReward).toBeLessThanOrEqual(2.5);
      expect(r.gold / TOP_ENEMY.goldReward).toBeLessThanOrEqual(2.5);
    }
  });

  it('leaves early and mid game untouched', () => {
    // The ceiling is only reached around level 47, so below that the original
    // 1.02^(level-1) curve still applies exactly.
    for (const level of [1, 10, 25, 40]) {
      const expected = Math.round(TOP_ENEMY.xpReward * Math.pow(1.02, level - 1));
      expect(calcDungeonReward(TOP_ENEMY, level, 'balanced', 'normal').xp).toBe(expected);
    }
  });

  it('still rewards higher levels more than level 1', () => {
    const low = calcDungeonReward(TOP_ENEMY, 1, 'balanced', 'normal').xp;
    const high = calcDungeonReward(TOP_ENEMY, 301, 'balanced', 'normal').xp;
    expect(high).toBeGreaterThan(low);
  });
});

describe('endgame levelling still progresses', () => {
  it.each(ENDGAME)('level %i gains something from a run', level => {
    // Bounded rewards must not swing the other way and stall the endgame.
    expect(runXp(level, BEST_XP.mode, BEST_XP.diff)).toBeGreaterThan(calcXpToNext(level) * 0.25);
  });
});
