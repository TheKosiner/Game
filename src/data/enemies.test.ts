import { describe, it, expect } from 'vitest';
import { getEnemyById, scaleEnemy } from './enemies';
import { makeEnemy } from '../tests/fixtures';

const HP_MULT = 6; // mirrors the private constant in enemies.ts

describe('getEnemyById', () => {
  it('returns a known enemy by id', () => {
    const e = getEnemyById('scavenger');
    expect(e).toBeDefined();
    expect(e?.id).toBe('scavenger');
  });

  it('returns undefined for an unknown id', () => {
    expect(getEnemyById('does-not-exist')).toBeUndefined();
  });
});

describe('scaleEnemy', () => {
  it('applies only the HP multiplier on floor 1 (scale = 1)', () => {
    const base = makeEnemy({ maxHp: 100, attack: 10, defense: 5, xpReward: 20, goldReward: 10 });
    const scaled = scaleEnemy(base, 1);
    expect(scaled.maxHp).toBe(100 * HP_MULT);
    expect(scaled.hp).toBe(scaled.maxHp);
    expect(scaled.attack).toBe(10);
    expect(scaled.defense).toBe(5);
    expect(scaled.xpReward).toBe(20);
    expect(scaled.goldReward).toBe(10);
  });

  it('scales every combat stat up on deeper floors', () => {
    const base = makeEnemy({ maxHp: 100, attack: 10, defense: 5, xpReward: 20, goldReward: 10 });
    const f1 = scaleEnemy(base, 1);
    const f5 = scaleEnemy(base, 5);
    expect(f5.maxHp).toBeGreaterThan(f1.maxHp);
    expect(f5.attack).toBeGreaterThan(f1.attack);
    expect(f5.defense).toBeGreaterThan(f1.defense);
    expect(f5.xpReward).toBeGreaterThan(f1.xpReward);
    expect(f5.goldReward).toBeGreaterThan(f1.goldReward);
  });

  it('uses the +15% per-floor linear scale for attack', () => {
    const base = makeEnemy({ attack: 100 });
    // floor 3 => scale 1 + 2*0.15 = 1.3
    expect(scaleEnemy(base, 3).attack).toBe(Math.round(100 * 1.3));
  });

  it('keeps magic fields undefined when the base enemy has none', () => {
    const scaled = scaleEnemy(makeEnemy(), 4);
    expect(scaled.magicAttack).toBeUndefined();
    expect(scaled.magicResistance).toBeUndefined();
  });

  it('scales magic fields when present', () => {
    const base = makeEnemy({ magicAttack: 20, magicResistance: 10 });
    const scaled = scaleEnemy(base, 3); // scale 1.3
    expect(scaled.magicAttack).toBe(Math.round(20 * 1.3));
    expect(scaled.magicResistance).toBe(Math.round(10 * 1.3));
  });

  it('does not mutate the original enemy', () => {
    const base = makeEnemy({ maxHp: 100, attack: 10 });
    scaleEnemy(base, 5);
    expect(base.maxHp).toBe(100);
    expect(base.attack).toBe(10);
  });
});
