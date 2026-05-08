import type { Hero, Enemy, Stats } from '../types';

export function getHeroAttack(hero: Hero): number {
  const weapon = hero.equipment.weapon;
  const base = 5 + hero.stats.strength * 2 + hero.stats.agility;
  const bonus = weapon?.attackBonus ?? 0;
  return base + bonus + hero.level * 2;
}

export function getHeroDefense(hero: Hero): number {
  const armor = hero.equipment.armor;
  const helmet = hero.equipment.helmet;
  const boots = hero.equipment.boots;
  const base = 2 + hero.stats.constitution + hero.level;
  const bonus = (armor?.defenseBonus ?? 0) + (helmet?.defenseBonus ?? 0) + (boots?.defenseBonus ?? 0);
  return base + bonus;
}

export function getHeroMaxHp(stats: Stats, level: number): number {
  return 80 + stats.constitution * 10 + level * 8;
}

export function calcXpToNext(level: number): number {
  return Math.floor(100 * Math.pow(1.4, level - 1));
}

export function calcStatBonus(stats: Partial<Stats>): number {
  return Object.values(stats).reduce((acc, v) => acc + (v ?? 0), 0);
}

export function rollDamage(base: number, variance = 0.2): number {
  const min = Math.floor(base * (1 - variance));
  const max = Math.ceil(base * (1 + variance));
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function heroAttackEnemy(hero: Hero, enemy: Enemy, attackOverride?: number): { damage: number; isCrit: boolean } {
  const attack = attackOverride ?? getHeroAttack(hero);
  const netDamage = Math.max(1, attack - enemy.defense);
  const isCrit = Math.random() < 0.1 + hero.stats.agility * 0.005;
  const damage = rollDamage(netDamage) * (isCrit ? 2 : 1);
  return { damage: Math.max(1, damage), isCrit };
}

export function enemyAttackHero(enemy: Enemy, hero: Hero, defenseOverride?: number): { damage: number } {
  const defense = defenseOverride ?? getHeroDefense(hero);
  const netDamage = Math.max(1, enemy.attack - defense);
  const damage = rollDamage(netDamage);
  return { damage: Math.max(1, damage) };
}
