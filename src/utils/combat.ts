import type { Hero, Enemy, Stats, Item } from '../types';

function softCap(stat: number): number {
  if (stat <= 100) return stat;
  return 100 + (stat - 100) * 0.5;
}

/**
 * Crit chance: hyperbolic curve with level-scaled soft cap.
 * Base 5%, max 40%. Higher level = more DEX needed for same crit %.
 * Formula: 0.05 + (totalDex / (totalDex + softCap)) * 0.35
 * softCap = 30 + level * 1.5  (lvl 1 → 31.5 | lvl 50 → 105)
 */
export function calcCritChance(totalDex: number, heroLevel: number): number {
  const cap = 30 + heroLevel * 1.5;
  return Math.min(0.40, 0.05 + (totalDex / (totalDex + cap)) * 0.35);
}

export function getEquipmentStats(equipment: Hero['equipment']): Stats {
  const r: Stats = { strength: 0, dexterity: 0, intelligence: 0, vitality: 0, magic: 0, magicResistance: 0 };
  for (const item of Object.values(equipment)) {
    if (!item?.stats) continue;
    r.strength        += item.stats.strength        ?? 0;
    r.dexterity       += item.stats.dexterity       ?? 0;
    r.intelligence    += item.stats.intelligence    ?? 0;
    r.vitality        += item.stats.vitality        ?? 0;
    r.magic           += item.stats.magic           ?? 0;
    r.magicResistance += item.stats.magicResistance ?? 0;
  }
  return r;
}

export function getEnhanceAttackBonus(item: Hero['equipment']['weapon']): number {
  if (!item || !item.enhanceLevel || item.enhanceLevel <= 0) return 0;
  return item.enhanceLevel * Math.max(1, Math.round(item.level * 0.6));
}

export function getEnhanceDefenseBonus(item: Item | undefined): number {
  if (!item || !item.enhanceLevel || item.enhanceLevel <= 0) return 0;
  return item.enhanceLevel * Math.max(1, Math.round(item.level * 0.4));
}

export function getHeroAttack(hero: Hero): number {
  const eq = getEquipmentStats(hero.equipment);
  const weapon = hero.equipment.weapon;
  const levelBase = 5 + hero.level * 2;
  if (!weapon) {
    return Math.round(levelBase * (1 + softCap(hero.stats.strength + eq.strength) / 100));
  }
  const enhBonus = getEnhanceAttackBonus(weapon);
  // Magic weapons scale with magic stat (steeper: /70)
  if (weapon.magicDamage) {
    const magicVal = softCap(hero.stats.magic + eq.magic);
    return Math.round((levelBase + (weapon.attackBonus ?? 0)) * (1 + magicVal / 70)) + enhBonus;
  }
  const scaleStat = (Object.entries(weapon.stats ?? {})
    .filter(([k]) => k !== 'vitality' && k !== 'magicResistance')
    .sort(([, a], [, b]) => (b as number ?? 0) - (a as number ?? 0))[0]?.[0] ?? 'strength') as keyof Stats;
  const heroStatVal = (hero.stats[scaleStat] ?? hero.stats.strength) + (eq[scaleStat] ?? 0);
  const base = Math.round((levelBase + (weapon.attackBonus ?? 0)) * (1 + softCap(heroStatVal) / 100));
  if (weapon.ranged) {
    const intVal = softCap(hero.stats.intelligence + eq.intelligence);
    return Math.round(base * (1 + intVal / 250)) + enhBonus;
  }
  return base + enhBonus;
}

export function getHeroMagicResistance(hero: Hero): number {
  const eq = getEquipmentStats(hero.equipment);
  return 2 + (hero.stats.magicResistance + eq.magicResistance) * 2;
}

export function getHeroDefense(hero: Hero): number {
  const eq = getEquipmentStats(hero.equipment);
  const armor = hero.equipment.armor;
  const helmet = hero.equipment.helmet;
  const boots = hero.equipment.boots;
  const base = 2 + (hero.stats.vitality + eq.vitality) + hero.level;
  const bonus = (armor?.defenseBonus ?? 0) + (helmet?.defenseBonus ?? 0) + (boots?.defenseBonus ?? 0);
  const enhBonus = getEnhanceDefenseBonus(armor) + getEnhanceDefenseBonus(helmet) + getEnhanceDefenseBonus(boots);
  return base + bonus + enhBonus;
}

export function getHeroMaxHp(stats: Stats, level: number, equipment?: Hero['equipment']): number {
  const eqVit = equipment ? getEquipmentStats(equipment).vitality : 0;
  return 80 + (stats.vitality + eqVit) * 10 + level * 8;
}

export function calcXpToNext(level: number): number {
  return Math.floor(100 * Math.pow(level, 2.3));
}

export function calcStatBonus(stats: Partial<Stats>): number {
  return Object.values(stats).reduce((acc, v) => acc + (v ?? 0), 0);
}

export function rollDamage(base: number, variance = 0.2): number {
  const min = Math.floor(base * (1 - variance));
  const max = Math.ceil(base * (1 + variance));
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function calcDmgRange(atk: number): { min: number; max: number; critMin: number; critMax: number } {
  const base = atk * atk / (atk + Math.max(1, 1));
  const min     = Math.max(1, Math.floor(base * 0.7));
  const max     = Math.ceil(base * 1.3);
  return { min, max, critMin: min * 2, critMax: max * 2 };
}

function quadDmg(atk: number, def: number, critMult = 1): number {
  const base = atk * atk / (atk + Math.max(1, def));
  const variance = 0.7 + Math.random() * 0.6;
  return Math.max(1, Math.round(base * variance * critMult));
}

export function heroAttackEnemy(hero: Hero, enemy: Enemy, attackOverride?: number): { damage: number; isCrit: boolean } {
  const eq = getEquipmentStats(hero.equipment);
  const weapon = hero.equipment.weapon;
  const critChance = calcCritChance(hero.stats.dexterity + eq.dexterity, hero.level);
  const isCrit = Math.random() < critChance;
  if (weapon?.magicDamage) {
    const magicAtk = attackOverride ?? getHeroAttack(hero);
    const enemyMagRes = enemy.magicResistance ?? 0;
    const damage = quadDmg(magicAtk, enemyMagRes, isCrit ? 2 : 1);
    return { damage, isCrit };
  }
  const attack = attackOverride ?? getHeroAttack(hero);
  const damage = quadDmg(attack, enemy.defense, isCrit ? 2 : 1);
  return { damage, isCrit };
}

export function enemyAttackHero(enemy: Enemy, hero: Hero, defenseOverride?: number): { damage: number; isCrit: boolean } {
  const isCrit = Math.random() < 0.05;
  if (enemy.magicAttack) {
    const magRes = defenseOverride ?? getHeroMagicResistance(hero);
    const damage = quadDmg(enemy.magicAttack, magRes, isCrit ? 2 : 1);
    return { damage, isCrit };
  }
  const defense = defenseOverride ?? getHeroDefense(hero);
  const damage = quadDmg(enemy.attack, defense, isCrit ? 2 : 1);
  return { damage, isCrit };
}
