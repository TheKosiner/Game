import type { Hero } from '../types';
import { ENERGY_REGEN_MS } from './constants';

export function isHeroResting(hero: Hero): boolean {
  return hero.restingUntil !== null && Date.now() < hero.restingUntil;
}

export function isHeroVoluntarilyResting(hero: Hero): boolean {
  return hero.voluntaryRestUntil !== null && Date.now() < hero.voluntaryRestUntil;
}

export function canEnterDungeon(hero: Hero, _minLevel: number, maxDailyRuns: number): { canEnter: boolean; reason?: string } {
  if (isHeroResting(hero)) {
    return { canEnter: false, reason: 'Odpoczywasz po walce' };
  }

  if (hero.dungeonRunsToday >= maxDailyRuns) {
    return { canEnter: false, reason: `Dzienny limit (${maxDailyRuns}) wyczerpany` };
  }

  return { canEnter: true };
}

export function canStartQuest(hero: Hero, _minLevel: number, maxDailyQuests: number, hasActiveQuest: boolean): { canStart: boolean; reason?: string } {
  if (hasActiveQuest) {
    return { canStart: false, reason: 'Masz już aktywne zadanie' };
  }

  if (hero.questsCompletedToday >= maxDailyQuests) {
    return { canStart: false, reason: `Dzienny limit (${maxDailyQuests}) wyczerpany` };
  }

  return { canStart: true };
}

/** Returns current energy (float) accounting for passive regen since lastEnergyRegen. */
export function calcCurrentEnergy(hero: Hero, now = Date.now()): number {
  const elapsed = Math.max(0, now - hero.lastEnergyRegen);
  const gained  = elapsed / ENERGY_REGEN_MS;
  return Math.min(hero.maxEnergy, hero.energy + gained);
}

/** Returns a hero with energy settled to `now` (used before consuming). */
export function settleEnergy(hero: Hero, now = Date.now()): Hero {
  const newEnergy = calcCurrentEnergy(hero, now);
  if (newEnergy === hero.energy) return hero;
  return { ...hero, energy: newEnergy, lastEnergyRegen: now };
}

/** ms until 1 more energy point arrives. */
export function msUntilNextEnergy(hero: Hero, now = Date.now()): number {
  const current = calcCurrentEnergy(hero, now);
  if (current >= hero.maxEnergy) return 0;
  const fractional = current - Math.floor(current);
  const remainder  = 1 - fractional;
  return Math.ceil(remainder * ENERGY_REGEN_MS);
}

export function formatTime(ms: number): string {
  if (ms <= 0) return 'Gotowe!';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

export function formatCountdown(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}

export function isSameDay(ts1: number, ts2: number = Date.now()): boolean {
  const a = new Date(ts1);
  const b = new Date(ts2);
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}
