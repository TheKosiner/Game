import type { Hero, Enemy, Stats } from '../types';

function softCap(stat: number): number {
  if (stat <= 100) return stat;
  return 100 + (stat - 100) * 0.5;
}

export function getEquipmentStats(equipment: Hero['equipment']): Stats {
  const r: Stats = { strength: 0, dexterity: 0, intelligence: 0, vitality: 0 };
  for (const item of Object.values(equipment)) {
    if (!item?.stats) continue;
    r.strength     += item.stats.strength     ?? 0;
    r.dexterity    += item.stats.dexterity    ?? 0;
    r.intelligence += item.stats.intelligence ?? 0;
    r.vitality     += item.stats.vitality     ?? 0;
  }
  return r;
}

export function getHeroAttack(hero: Hero): number {
  const eq = getEquipmentStats(hero.equipment);
  const weapon = hero.equipment.weapon;
  if (!weapon) {
    const base = 5 + hero.level * 2;
    return Math.round(base * (1 + softCap(hero.stats.strength + eq.strength) / 100));
  }
  const scaleStat = (Object.entries(weapon.stats ?? {})
    .filter(([k]) => k !== 'vitality')
    .sort(([, a], [, b]) => (b as number ?? 0) - (a as number ?? 0))[0]?.[0] ?? 'strength') as keyof Stats;
  const heroStatVal = (hero.stats[scaleStat] ?? hero.stats.strength) + (eq[scaleStat] ?? 0);
  const levelBase = 5 + hero.level * 2;
  const base = Math.round((levelBase + (weapon.attackBonus ?? 0)) * (1 + softCap(heroStatVal) / 100));
  if (weapon.ranged) {
    const intVal = softCap(hero.stats.intelligence + eq.intelligence);
    return Math.round(base * (1 + intVal / 250));
  }
  return base;
}

export function getHeroDefense(hero: Hero): number {
  const eq = getEquipmentStats(hero.equipment);
  const armor = hero.equipment.armor;
  const helmet = hero.equipment.helmet;
  const boots = hero.equipment.boots;
  const base = 2 + (hero.stats.vitality + eq.vitality) + hero.level;
  const bonus = (armor?.defenseBonus ?? 0) + (helmet?.defenseBonus ?? 0) + (boots?.defenseBonus ?? 0);
  return base + bonus;
}

export function getHeroMaxHp(stats: Stats, level: number, equipment?: Hero['equipment']): number {
  const eqVit = equipment ? getEquipmentStats(equipment).vitality : 0;
  return 80 + (stats.vitality + eqVit) * 10 + level * 8;
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

function quadDmg(atk: number, def: number, critMult = 1): number {
  const base = atk * atk / (atk + Math.max(1, def));
  const variance = 0.7 + Math.random() * 0.6;
  return Math.max(1, Math.round(base * variance * critMult));
}

export function heroAttackEnemy(hero: Hero, enemy: Enemy, attackOverride?: number): { damage: number; isCrit: boolean } {
  const eq = getEquipmentStats(hero.equipment);
  const attack = attackOverride ?? getHeroAttack(hero);
  const critChance = 0.10 + (hero.stats.dexterity + eq.dexterity) * 0.005;
  const isCrit = Math.random() < critChance;
  const damage = quadDmg(attack, enemy.defense, isCrit ? 2 : 1);
  return { damage, isCrit };
}

export function enemyAttackHero(enemy: Enemy, hero: Hero, defenseOverride?: number): { damage: number; isCrit: boolean } {
  const defense = defenseOverride ?? getHeroDefense(hero);
  const isCrit = Math.random() < 0.05;
  const damage = quadDmg(enemy.attack, defense, isCrit ? 2 : 1);
  return { damage, isCrit };
}
