import { describe, it, expect } from 'vitest';
import { getHeroAttack, getHeroDefense, getHeroMaxHp, calcXpToNext } from '../utils/combat';
import type { Hero } from '../types';

describe('Combat Utils', () => {
  const mockHero: Hero = {
    name: 'Test Hero',
    class: 'warrior',
    level: 10,
    xp: 0,
    xpToNext: 100,
    hp: 100,
    maxHp: 100,
    restingUntil: null,
    voluntaryRestUntil: null,
    dungeonRunsToday: 0,
    questsCompletedToday: 0,
    lastDailyReset: Date.now(),
    stats: {
      strength: 10,
      agility: 5,
      intelligence: 3,
      constitution: 8,
    },
    equipment: {},
    inventory: [],
    gold: 100,
    gems: 0,
    attributePoints: 0,
    skinTone: 1,
    hairColor: 2,
  };

  describe('getHeroAttack', () => {
    it('should calculate base attack correctly', () => {
      const attack = getHeroAttack(mockHero);
      // base: 5 + (10 * 2) + 5 + (10 * 2) = 5 + 20 + 5 + 20 = 50
      expect(attack).toBe(50);
    });

    it('should include weapon bonus', () => {
      const heroWithWeapon = {
        ...mockHero,
        equipment: {
          weapon: {
            id: 'sword',
            name: 'Iron Sword',
            slot: 'weapon' as const,
            rarity: 'common' as const,
            stats: {},
            attackBonus: 15,
            level: 1,
            goldValue: 50,
            emoji: '⚔️',
          },
        },
      };
      const attack = getHeroAttack(heroWithWeapon);
      expect(attack).toBe(65); // 50 + 15
    });
  });

  describe('getHeroDefense', () => {
    it('should calculate base defense correctly', () => {
      const defense = getHeroDefense(mockHero);
      // base: 2 + 8 + 10 = 20
      expect(defense).toBe(20);
    });

    it('should include armor bonuses', () => {
      const heroWithArmor = {
        ...mockHero,
        equipment: {
          armor: {
            id: 'plate',
            name: 'Plate Armor',
            slot: 'armor' as const,
            rarity: 'common' as const,
            stats: {},
            defenseBonus: 10,
            level: 1,
            goldValue: 100,
            emoji: '🛡️',
          },
          helmet: {
            id: 'helm',
            name: 'Iron Helm',
            slot: 'helmet' as const,
            rarity: 'common' as const,
            stats: {},
            defenseBonus: 5,
            level: 1,
            goldValue: 50,
            emoji: '⛑️',
          },
        },
      };
      const defense = getHeroDefense(heroWithArmor);
      expect(defense).toBe(35); // 20 + 10 + 5
    });
  });

  describe('getHeroMaxHp', () => {
    it('should calculate max HP correctly', () => {
      const maxHp = getHeroMaxHp(mockHero.stats, 10);
      // 80 + (8 * 10) + (10 * 8) = 80 + 80 + 80 = 240
      expect(maxHp).toBe(240);
    });

    it('should scale with level', () => {
      const maxHpLevel1 = getHeroMaxHp(mockHero.stats, 1);
      const maxHpLevel20 = getHeroMaxHp(mockHero.stats, 20);
      expect(maxHpLevel20).toBeGreaterThan(maxHpLevel1);
    });
  });

  describe('calcXpToNext', () => {
    it('should calculate XP requirement for next level', () => {
      expect(calcXpToNext(1)).toBe(100);
      expect(calcXpToNext(2)).toBe(140);
      expect(calcXpToNext(5)).toBe(384);
    });

    it('should increase exponentially', () => {
      const xp1 = calcXpToNext(1);
      const xp10 = calcXpToNext(10);
      const xp20 = calcXpToNext(20);
      expect(xp10).toBeGreaterThan(xp1 * 5);
      expect(xp20).toBeGreaterThan(xp10 * 5);
    });
  });
});
