import { describe, it, expect } from 'vitest';
import {
  isHeroResting,
  isHeroVoluntarilyResting,
  canEnterDungeon,
  canStartQuest,
  formatTime,
  isSameDay
} from '../utils/helpers';
import type { Hero } from '../types';

describe('Helper Functions', () => {
  const mockHero: Hero = {
    name: 'Test',
    class: 'warrior',
    level: 5,
    xp: 0,
    xpToNext: 100,
    hp: 100,
    maxHp: 100,
    restingUntil: null,
    voluntaryRestUntil: null,
    dungeonRunsToday: 0,
    questsCompletedToday: 0,
    lastDailyReset: Date.now(),
    stats: { strength: 10, agility: 5, intelligence: 3, constitution: 8 },
    equipment: {},
    inventory: [],
    gold: 100,
    gems: 0,
    attributePoints: 0,
    skinTone: 1,
    hairColor: 2,
  };

  describe('isHeroResting', () => {
    it('should return false when not resting', () => {
      expect(isHeroResting(mockHero)).toBe(false);
    });

    it('should return true when resting', () => {
      const restingHero = { ...mockHero, restingUntil: Date.now() + 10000 };
      expect(isHeroResting(restingHero)).toBe(true);
    });

    it('should return false when rest period ended', () => {
      const restingHero = { ...mockHero, restingUntil: Date.now() - 1000 };
      expect(isHeroResting(restingHero)).toBe(false);
    });
  });

  describe('canEnterDungeon', () => {
    it('should allow entry when all conditions met', () => {
      const result = canEnterDungeon(mockHero, 5, 10);
      expect(result.canEnter).toBe(true);
    });

    it('should block when level too low', () => {
      const result = canEnterDungeon(mockHero, 10, 10);
      expect(result.canEnter).toBe(false);
      expect(result.reason).toContain('poziom');
    });

    it('should block when hero is resting', () => {
      const restingHero = { ...mockHero, restingUntil: Date.now() + 10000 };
      const result = canEnterDungeon(restingHero, 5, 10);
      expect(result.canEnter).toBe(false);
      expect(result.reason).toContain('Odpoczywasz');
    });

    it('should block when daily limit reached', () => {
      const heroAtLimit = { ...mockHero, dungeonRunsToday: 10 };
      const result = canEnterDungeon(heroAtLimit, 5, 10);
      expect(result.canEnter).toBe(false);
      expect(result.reason).toContain('limit');
    });
  });

  describe('formatTime', () => {
    it('should format seconds', () => {
      expect(formatTime(30000)).toBe('30s');
    });

    it('should format minutes and seconds', () => {
      expect(formatTime(90000)).toBe('1m 30s');
    });

    it('should format hours and minutes', () => {
      expect(formatTime(3660000)).toBe('1h 1m');
    });

    it('should return "Gotowe!" for zero or negative', () => {
      expect(formatTime(0)).toBe('Gotowe!');
      expect(formatTime(-1000)).toBe('Gotowe!');
    });
  });

  describe('isSameDay', () => {
    it('should return true for same day', () => {
      const now = Date.now();
      expect(isSameDay(now, now)).toBe(true);
    });

    it('should return false for different days', () => {
      const today = Date.now();
      const yesterday = today - 24 * 60 * 60 * 1000;
      expect(isSameDay(yesterday, today)).toBe(false);
    });
  });
});
