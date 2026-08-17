// Regression test for Megacorp Fortress throwing its toughest enemies at
// freshly-unlocked players.
//
// Every dungeon filters its pool down to enemies at or below the hero's level.
// Megacorp Fortress unlocks at minLevel 20 but its weakest enemy is level 22,
// so for a level 20-21 hero that filter matched nothing — and the old fallback
// handed back the *entire* pool, including the level 30 machines with 110
// attack. It is the only dungeon in the game whose weakest enemy sits above its
// own minLevel, which is why it was the only one that felt brutal on entry.
import { describe, it, expect } from 'vitest';
import { ALL_DUNGEONS } from '../data/dungeons';
import { getEnemyById } from '../data/enemies';

function poolLevels(ids: string[]): number[] {
  return ids.map(id => getEnemyById(id)?.level).filter((l): l is number => l !== undefined);
}

describe('Megacorp Fortress enemy pool', () => {
  const fortress = ALL_DUNGEONS.find(d => d.id === 'dragon_lair')!;

  it('is the dungeon the bug was reported for', () => {
    expect(fortress.minLevel).toBe(20);
    expect(Math.min(...poolLevels(fortress.enemies))).toBeGreaterThan(fortress.minLevel);
  });

  it('never matches a newly-unlocked hero against its top tier', () => {
    // What enterDungeon does for a hero at the unlock level.
    const heroLevel = fortress.minLevel;
    const safe = fortress.enemies.filter(id => (getEnemyById(id)?.level ?? 0) <= heroLevel);
    expect(safe).toHaveLength(0); // the filter really does come up empty

    const weakest = Math.min(...poolLevels(fortress.enemies));
    const fallback = fortress.enemies.filter(id => getEnemyById(id)?.level === weakest);

    const strongest = Math.max(...poolLevels(fortress.enemies));
    expect(poolLevels(fallback).every(l => l === weakest)).toBe(true);
    expect(poolLevels(fallback)).not.toContain(strongest);

    // Concretely: level 22 machines, never the level 30 ones.
    expect(weakest).toBe(22);
    expect(strongest).toBe(30);
  });
});

describe('dungeon pools across the game', () => {
  it('leaves an under-levelled hero the weakest fight, never the hardest', () => {
    for (const d of ALL_DUNGEONS) {
      const levels = poolLevels(d.enemies);
      if (levels.length === 0) continue;
      const safe = d.enemies.filter(id => (getEnemyById(id)?.level ?? 0) <= d.minLevel);
      if (safe.length > 0) continue; // filter works normally, no fallback needed

      const weakest = Math.min(...levels);
      const fallback = d.enemies.filter(id => getEnemyById(id)?.level === weakest);
      expect(fallback.length).toBeGreaterThan(0);
      expect(fallback.length).toBeLessThan(d.enemies.length);
    }
  });

  it('reports Megacorp Fortress as the only dungeon needing the fallback', () => {
    const needFallback = ALL_DUNGEONS.filter(d => {
      const levels = poolLevels(d.enemies);
      return levels.length > 0 && Math.min(...levels) > d.minLevel;
    }).map(d => d.id);
    expect(needFallback).toEqual(['dragon_lair']);
  });
});
