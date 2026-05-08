import { create } from 'zustand';
import type { Hero, HeroClass, Stats } from '../types';
import { getHeroMaxHp, calcXpToNext } from '../utils/combat';

interface HeroState {
  hero: Hero;
  initHero: (name: string, heroClass: HeroClass, skinTone?: number, hairColor?: number) => void;
  addXp: (amount: number) => void;
  addGold: (amount: number) => void;
  upgradeAttribute: (attr: keyof Stats) => void;
  restHero: (minutes: number) => void;
  checkDailyReset: () => void;
  updateHero: (updates: Partial<Hero>) => void;
}

const BASE_STATS: Record<HeroClass, Stats> = {
  warrior: { strength: 8, agility: 4, intelligence: 2, constitution: 6 },
  mage: { strength: 2, agility: 4, intelligence: 10, constitution: 4 },
  rogue: { strength: 5, agility: 9, intelligence: 3, constitution: 3 },
};

function createHero(name: string, heroClass: HeroClass, skinTone = 1, hairColor = 2): Hero {
  const stats = BASE_STATS[heroClass];
  const maxHp = getHeroMaxHp(stats, 1);
  return {
    name,
    class: heroClass,
    level: 1,
    xp: 0,
    xpToNext: calcXpToNext(1),
    hp: maxHp,
    maxHp,
    restingUntil: null,
    voluntaryRestUntil: null,
    voluntaryRestHpGain: undefined,
    dungeonRunsToday: 0,
    questsCompletedToday: 0,
    lastDailyReset: Date.now(),
    stats,
    equipment: {},
    inventory: [],
    gold: 100,
    gems: 0,
    attributePoints: 0,
    skinTone,
    hairColor,
  };
}

function isSameDay(ts: number): boolean {
  const a = new Date(ts);
  const b = new Date();
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

export const useHeroStore = create<HeroState>((set, get) => ({
  hero: createHero('Hero', 'warrior'),

  initHero: (name, heroClass, skinTone = 1, hairColor = 2) => {
    const hero = createHero(name, heroClass, skinTone, hairColor);
    set({ hero });
  },

  addXp: (amount) => {
    const { hero } = get();
    let { xp, xpToNext, level, stats, maxHp, hp, attributePoints } = hero;
    xp += amount;
    let leveled = false;

    while (xp >= xpToNext) {
      xp -= xpToNext;
      level++;
      xpToNext = calcXpToNext(level);
      attributePoints++;
      leveled = true;
    }

    const newMaxHp = getHeroMaxHp(stats, level);
    const hpGain = leveled ? newMaxHp - maxHp : 0;

    set({
      hero: {
        ...hero,
        xp,
        xpToNext,
        level,
        maxHp: newMaxHp,
        hp: Math.min(hp + hpGain, newMaxHp),
        attributePoints,
      },
    });

    return leveled;
  },

  addGold: (amount) => {
    const { hero } = get();
    set({ hero: { ...hero, gold: hero.gold + amount } });
  },

  upgradeAttribute: (attr: keyof Stats) => {
    const { hero } = get();
    if (hero.attributePoints <= 0) return;

    const newStats = { ...hero.stats, [attr]: hero.stats[attr] + 1 };
    const newMaxHp = getHeroMaxHp(newStats, hero.level);

    set({
      hero: {
        ...hero,
        stats: newStats,
        maxHp: newMaxHp,
        attributePoints: hero.attributePoints - 1,
      },
    });
  },

  restHero: (minutes: number) => {
    const { hero } = get();
    if (hero.voluntaryRestUntil !== null && Date.now() < hero.voluntaryRestUntil) return;
    if (hero.hp >= hero.maxHp) return;

    const endsAt = Date.now() + minutes * 60000;
    const hpGain = Math.min(minutes, hero.maxHp - hero.hp);

    set({
      hero: {
        ...hero,
        voluntaryRestUntil: endsAt,
        voluntaryRestHpGain: hpGain,
      },
    });
  },

  checkDailyReset: () => {
    const { hero } = get();

    if (!isSameDay(hero.lastDailyReset)) {
      set({
        hero: {
          ...hero,
          dungeonRunsToday: 0,
          questsCompletedToday: 0,
          lastDailyReset: Date.now(),
        },
      });
    }

    if (hero.voluntaryRestUntil !== null && Date.now() >= hero.voluntaryRestUntil) {
      const healAmount = hero.voluntaryRestHpGain ?? 0;
      set({
        hero: {
          ...hero,
          hp: Math.min(hero.hp + healAmount, hero.maxHp),
          voluntaryRestUntil: null,
          voluntaryRestHpGain: undefined,
        },
      });
    }
  },

  updateHero: (updates) => {
    const { hero } = get();
    set({ hero: { ...hero, ...updates } });
  },
}));
