import { describe, it, expect } from 'vitest';
import { generateItem, generateShopItems, getItemName } from './itemGenerator';
import { makeSeededRng, makeItem } from '../tests/fixtures';
import type { Item, Rarity } from '../types';

const RARITY_GOLD: Record<Rarity, number> = {
  common: 1, uncommon: 2, rare: 3.5, epic: 6, legendary: 11,
};

/** Strip the non-deterministic id so two generations can be compared by value. */
function withoutId(item: Item): Omit<Item, 'id'> {
  const { id: _id, ...rest } = item;
  return rest;
}

describe('generateItem', () => {
  it('honors the requested slot and rarity', () => {
    const item = generateItem(10, 'epic', 'armor', makeSeededRng(1));
    expect(item.slot).toBe('armor');
    expect(item.rarity).toBe('epic');
  });

  it('clamps item level to a minimum of 1', () => {
    const item = generateItem(-5, 'common', 'ring', makeSeededRng(2));
    expect(item.level).toBe(1);
  });

  it('gives weapons an attack bonus and no defense bonus', () => {
    const w = generateItem(20, 'rare', 'weapon', makeSeededRng(3));
    expect(w.attackBonus).toBeGreaterThan(0);
    expect(w.defenseBonus).toBeUndefined();
  });

  it('gives armor/helmet/boots a defense bonus and no attack bonus', () => {
    for (const slot of ['armor', 'helmet', 'boots'] as const) {
      const item = generateItem(20, 'rare', slot, makeSeededRng(4));
      expect(item.defenseBonus).toBeGreaterThan(0);
      expect(item.attackBonus).toBeUndefined();
    }
  });

  it('gives rings/amulets neither attack nor defense bonus', () => {
    for (const slot of ['ring', 'amulet'] as const) {
      const item = generateItem(20, 'rare', slot, makeSeededRng(5));
      expect(item.attackBonus).toBeUndefined();
      expect(item.defenseBonus).toBeUndefined();
    }
  });

  it('computes gold value from level and rarity', () => {
    const item = generateItem(10, 'legendary', 'ring', makeSeededRng(6));
    expect(item.goldValue).toBe(Math.max(5, Math.round(10 * 14 * RARITY_GOLD.legendary)));
  });

  it('never emits zero-valued stats', () => {
    const item = generateItem(30, 'legendary', 'armor', makeSeededRng(7));
    for (const v of Object.values(item.stats)) expect(v).toBeGreaterThan(0);
  });

  it('is deterministic for the same seed and inputs (ignoring id)', () => {
    const a = generateItem(25, 'epic', 'weapon', makeSeededRng(42));
    const b = generateItem(25, 'epic', 'weapon', makeSeededRng(42));
    expect(withoutId(a)).toEqual(withoutId(b));
  });

  it('produces different items for different seeds', () => {
    const a = generateItem(25, 'epic', 'weapon', makeSeededRng(1));
    const b = generateItem(25, 'epic', 'weapon', makeSeededRng(999));
    expect(withoutId(a)).not.toEqual(withoutId(b));
  });

  it('scales stats up with rarity on average', () => {
    // Sum the primary-stat magnitude across many seeds for common vs legendary.
    const sumStats = (rarity: Rarity) => {
      let total = 0;
      for (let seed = 1; seed <= 40; seed++) {
        const item = generateItem(20, rarity, 'weapon', makeSeededRng(seed));
        total += Object.values(item.stats).reduce((a, b) => a + b, 0);
      }
      return total;
    };
    expect(sumStats('legendary')).toBeGreaterThan(sumStats('common'));
  });
});

describe('generateShopItems', () => {
  it('returns 6 generated items plus a medkit', () => {
    const shop = generateShopItems(10, 123);
    expect(shop).toHaveLength(7);
    expect(shop[6].item.slot).toBe('consumable'); // MEDKIT
    expect(shop[5].featured).toBe(true);
  });

  it('is deterministic by seed (ignoring item ids)', () => {
    const a = generateShopItems(15, 777).map(s => ({ ...s, item: withoutId(s.item) }));
    const b = generateShopItems(15, 777).map(s => ({ ...s, item: withoutId(s.item) }));
    expect(a).toEqual(b);
  });

  it('changes its lineup when the seed changes', () => {
    const a = generateShopItems(15, 1).map(s => withoutId(s.item));
    const b = generateShopItems(15, 2).map(s => withoutId(s.item));
    expect(a).not.toEqual(b);
  });

  it('prices items above their gold value', () => {
    for (const { item, price } of generateShopItems(20, 55).slice(0, 6)) {
      expect(price).toBeGreaterThanOrEqual(item.goldValue);
    }
  });
});

describe('getItemName', () => {
  it('returns the Polish name for the pl locale', () => {
    const item = makeItem({ name: 'Miecz Siły', nameEn: 'Sword of Strength' });
    expect(getItemName(item, 'pl')).toBe('Miecz Siły');
  });

  it('prefers the English name field for the en locale', () => {
    const item = makeItem({ name: 'Miecz Siły', nameEn: 'Sword of Strength' });
    expect(getItemName(item, 'en')).toBe('Sword of Strength');
  });

  it('falls back to the base name when no English name exists', () => {
    const item = makeItem({ name: 'Apteczka', nameEn: undefined });
    expect(getItemName(item, 'en')).toBe('Apteczka');
  });
});
