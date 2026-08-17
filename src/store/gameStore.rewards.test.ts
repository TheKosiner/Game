// Reward scaling for operations.
//
// `calcDungeonReward` multiplies enemy rewards by `1.02^heroLevel`. This is
// exponential while the XP curve `100·level^2.2` is polynomial, so the
// multiplier outruns the curve past roughly level 150: 380x at level 301, over
// 19000x at level 500. Enemy rewards already scale with the enemy's own level
// (8 XP at level 1 up to 670000 at level 200), so this multiplies a value that
// is scaling anyway.
//
// A cap of 2.5x was added to keep endgame runs inside the server-side save
// rules, then removed again at the owner's request to restore the original
// reward rate. The tests below therefore pin the *uncapped* formula, and the
// last block records — without asserting a pass — exactly where that formula
// breaches firestore.rules, so the consequence stays visible in the suite
// rather than only in a chat message.
import { describe, it, expect } from 'vitest';
import { calcDungeonReward, MAX_DAILY_DUNGEONS } from './gameStore';
import { calcXpToNext } from '../utils/combat';
import { ALL_DUNGEONS } from '../data/dungeons';
import { getEnemyById } from '../data/enemies';

/**
 * Richest enemy actually reachable at a given level. A player can only farm
 * dungeons they have unlocked, so pairing every level with the level 200 enemy
 * overstates what mid-game players earn.
 */
function bestEnemyAt(level: number) {
  const unlocked = ALL_DUNGEONS.filter(d => d.minLevel <= level);
  const enemies = unlocked.flatMap(d => d.enemies.map(getEnemyById)).filter(e => e !== undefined);
  return {
    xpReward: Math.max(...enemies.map(e => e!.xpReward)),
    goldReward: Math.max(...enemies.map(e => e!.goldReward)),
  };
}

/** Caps enforced by validSaveUpdate/validGoldEarned in firestore.rules. */
const GOLD_PER_DAY_CAP = 250_000_000;
const LEVELS_PER_SAVE_CAP = 10;

/** The richest enemy in the game, and the length of one operation. */
const TOP_ENEMY = { xpReward: 670_000, goldReward: 525_000 };
const FLOORS_PER_RUN = 10;

function runXp(level: number) {
  return calcDungeonReward(TOP_ENEMY, level, 'xp', 'hard').xp * FLOORS_PER_RUN;
}
function runGold(level: number) {
  return calcDungeonReward(TOP_ENEMY, level, 'balanced', 'hard').gold * FLOORS_PER_RUN;
}

/** Levels gained by a run, walking the curve the way addXp does. */
function levelsGained(level: number, xp: number): number {
  let lvl = level, pool = xp, gained = 0;
  while (pool >= calcXpToNext(lvl) && gained < 5000) {
    pool -= calcXpToNext(lvl);
    lvl++; gained++;
  }
  return gained;
}

describe('reward multiplier', () => {
  it('scales exponentially with hero level, uncapped', () => {
    for (const level of [1, 10, 25, 40, 100, 200, 301, 500]) {
      const expected = Math.round(TOP_ENEMY.xpReward * Math.pow(1.02, level - 1));
      expect(calcDungeonReward(TOP_ENEMY, level, 'balanced', 'normal').xp).toBe(expected);
    }
  });

  it('keeps growing past the endgame instead of levelling off', () => {
    const at300 = calcDungeonReward(TOP_ENEMY, 300, 'balanced', 'normal').xp;
    const at500 = calcDungeonReward(TOP_ENEMY, 500, 'balanced', 'normal').xp;
    expect(at500).toBeGreaterThan(at300);
  });

  it('leaves enemy difficulty untouched — only XP and gold are scaled', () => {
    // diffStatMult drives enemy stats and depends solely on the chosen
    // difficulty, never on hero level or the reward multiplier.
    for (const level of [1, 100, 301, 500]) {
      expect(calcDungeonReward(TOP_ENEMY, level, 'balanced', 'easy').diffStatMult).toBe(0.7);
      expect(calcDungeonReward(TOP_ENEMY, level, 'balanced', 'normal').diffStatMult).toBe(1);
      expect(calcDungeonReward(TOP_ENEMY, level, 'balanced', 'hard').diffStatMult).toBe(1.5);
    }
  });
});

describe('known breach of the server save rules (uncapped by request)', () => {
  // These assert the breach rather than the absence of one. If the multiplier
  // is ever bounded again, or the caps in firestore.rules are raised to match,
  // these tests will fail and should be rewritten to assert compliance.
  it('a full day of endgame operations exceeds the daily gold cap', () => {
    expect(runGold(301) * MAX_DAILY_DUNGEONS).toBeGreaterThan(GOLD_PER_DAY_CAP);
  });

  it('a single endgame operation exceeds the per-save level jump cap', () => {
    expect(levelsGained(301, runXp(301))).toBeGreaterThan(LEVELS_PER_SAVE_CAP);
  });

  it('stays within both caps in the early and mid game', () => {
    // Below the point where the exponential overtakes the curve, a player
    // farming the best content they can actually reach stays legal — which is
    // why only high-level players hit the rejection.
    for (const level of [20, 50, 100]) {
      const enemy = bestEnemyAt(level);
      const goldPerDay =
        calcDungeonReward(enemy, level, 'balanced', 'hard').gold * FLOORS_PER_RUN * MAX_DAILY_DUNGEONS;
      const xpPerRun = calcDungeonReward(enemy, level, 'xp', 'hard').xp * FLOORS_PER_RUN;
      expect(goldPerDay).toBeLessThan(GOLD_PER_DAY_CAP);
      expect(levelsGained(level, xpPerRun)).toBeLessThan(LEVELS_PER_SAVE_CAP);
    }
  });
});
