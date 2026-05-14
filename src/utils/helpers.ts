import type { Hero } from '../types';

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
