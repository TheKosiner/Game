// Shared test fixtures & helpers.
// Keep these minimal but valid — every field the game logic reads must exist.
import type { Hero, Item, Enemy, Stats, Equipment } from '../types';

export const ZERO_STATS: Stats = {
  strength: 0, dexterity: 0, intelligence: 0,
  vitality: 0, magic: 0, magicResistance: 0,
};

/** A deterministic LCG matching the one used inside itemGenerator (seedable RNG). */
export function makeSeededRng(seed: number): () => number {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

export function makeStats(partial: Partial<Stats> = {}): Stats {
  return { ...ZERO_STATS, ...partial };
}

export function makeItem(partial: Partial<Item> = {}): Item {
  return {
    id: 'test-item',
    name: 'Test Item',
    slot: 'weapon',
    rarity: 'common',
    stats: {},
    level: 1,
    goldValue: 10,
    emoji: '⚔',
    ...partial,
  };
}

export function makeHero(partial: Partial<Hero> = {}): Hero {
  const stats = makeStats(partial.stats);
  const equipment: Equipment = partial.equipment ?? {};
  const base: Hero = {
    name: 'Hero',
    level: 1,
    xp: 0,
    xpToNext: 100,
    hp: 184,
    maxHp: 184,
    restingUntil: null,
    voluntaryRestUntil: null,
    voluntaryRestHp: null,
    voluntaryRestStartAt: null,
    beggingUntil: null,
    beggingReward: null,
    beggingStartAt: null,
    dungeonRunsToday: 0,
    questsCompletedToday: 0,
    lastDailyReset: 0,
    stats,
    equipment,
    inventory: [],
    gold: 0,
    gems: 0,
    attributePoints: 0,
    skinTone: 0,
    hairColor: 0,
    clothingColor: 0,
    portrait: 0,
    unlockedPortraits: [],
    lastRespecAt: null,
    completedDungeons: [],
    lastCasinoSpinAt: 0,
    goldEarnedToday: 0,
    kryptaRunsToday: 0,
  };
  // Apply overrides, then re-pin the normalized stats/equipment objects.
  return { ...base, ...partial, stats, equipment };
}

export function makeEnemy(partial: Partial<Enemy> = {}): Enemy {
  return {
    id: 'test-enemy',
    name: 'Test Enemy',
    emoji: '👾',
    level: 1,
    hp: 100,
    maxHp: 100,
    attack: 10,
    defense: 5,
    xpReward: 20,
    goldReward: 10,
    lootTable: [],
    ...partial,
  };
}
