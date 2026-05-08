import { describe, it, expect, beforeEach } from 'vitest';
import { useHeroStore } from '../store/heroStore';

describe('HeroStore', () => {
  beforeEach(() => {
    useHeroStore.getState().initHero('Test Hero', 'warrior');
  });

  describe('initHero', () => {
    it('should create a new hero with correct initial values', () => {
      const { hero } = useHeroStore.getState();
      expect(hero.name).toBe('Test Hero');
      expect(hero.class).toBe('warrior');
      expect(hero.level).toBe(1);
      expect(hero.gold).toBe(100);
      expect(hero.attributePoints).toBe(0);
    });
  });

  describe('addXp', () => {
    it('should add XP without leveling up', () => {
      const { addXp, hero: heroBefore } = useHeroStore.getState();
      const initialXp = heroBefore.xp;

      addXp(50);

      const { hero: heroAfter } = useHeroStore.getState();
      expect(heroAfter.xp).toBe(initialXp + 50);
      expect(heroAfter.level).toBe(1);
    });

    it('should level up when XP threshold is reached', () => {
      const { addXp } = useHeroStore.getState();

      addXp(150);

      const { hero } = useHeroStore.getState();
      expect(hero.level).toBe(2);
      expect(hero.attributePoints).toBe(1);
    });

    it('should handle multiple level ups', () => {
      const { addXp } = useHeroStore.getState();

      addXp(500);

      const { hero } = useHeroStore.getState();
      expect(hero.level).toBeGreaterThan(2);
      expect(hero.attributePoints).toBeGreaterThan(1);
    });
  });

  describe('addGold', () => {
    it('should add gold correctly', () => {
      const { addGold, hero: heroBefore } = useHeroStore.getState();
      const initialGold = heroBefore.gold;

      addGold(50);

      const { hero: heroAfter } = useHeroStore.getState();
      expect(heroAfter.gold).toBe(initialGold + 50);
    });
  });

  describe('upgradeAttribute', () => {
    it('should upgrade attribute when points are available', () => {
      const { addXp, upgradeAttribute } = useHeroStore.getState();

      addXp(150);

      const { hero: heroBefore } = useHeroStore.getState();
      const initialStrength = heroBefore.stats.strength;
      const initialPoints = heroBefore.attributePoints;

      upgradeAttribute('strength');

      const { hero: heroAfter } = useHeroStore.getState();
      expect(heroAfter.stats.strength).toBe(initialStrength + 1);
      expect(heroAfter.attributePoints).toBe(initialPoints - 1);
    });

    it('should not upgrade when no points available', () => {
      const { upgradeAttribute, hero: heroBefore } = useHeroStore.getState();
      const initialStrength = heroBefore.stats.strength;

      upgradeAttribute('strength');

      const { hero: heroAfter } = useHeroStore.getState();
      expect(heroAfter.stats.strength).toBe(initialStrength);
    });
  });
});
