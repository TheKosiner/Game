import type { Rarity } from '../types';

export type EnemyTemplate = {
  id: string;
  name: string;
  emoji: string;
  hpMult: number;
  atkMult: number;
  defMult: number;
  baseXp: number;
  baseGold: number;
};

export const ENEMY_TIERS: EnemyTemplate[][] = [
  // Tier 1 (piętro 1–2)
  [
    { id: 'blood_shadow',  name: 'Cień Krwi',      emoji: '👻', hpMult:  5.5, atkMult: 1.3, defMult: 0.8, baseXp: 22, baseGold: 16 },
    { id: 'bone_man',      name: 'Kościan',        emoji: '💀', hpMult:  6.0, atkMult: 1.2, defMult: 1.1, baseXp: 24, baseGold: 14 },
    { id: 'rotten_rat',    name: 'Gnijący Szczur', emoji: '🐀', hpMult:  4.5, atkMult: 1.5, defMult: 0.5, baseXp: 20, baseGold: 20 },
  ],
  // Tier 2 (piętro 3–4)
  [
    { id: 'specter',       name: 'Widmo',         emoji: '🌫️', hpMult:  8.0, atkMult: 1.8, defMult: 1.2, baseXp: 38, baseGold: 30 },
    { id: 'undead_knight', name: 'Trupi Rycerz', emoji: '⚔️', hpMult:  9.5, atkMult: 1.6, defMult: 1.8, baseXp: 44, baseGold: 27 },
    { id: 'necromancer',   name: 'Nekromanta',   emoji: '🧙', hpMult:  7.0, atkMult: 2.1, defMult: 0.9, baseXp: 42, baseGold: 33 },
  ],
  // Tier 3 (piętro 5–6)
  [
    { id: 'abyss_demon',    name: 'Demon Otchłani', emoji: '😈', hpMult: 12.0, atkMult: 2.4, defMult: 1.5, baseXp: 60, baseGold: 50 },
    { id: 'undead_mage',    name: 'Nieumarły Mag',  emoji: '🔮', hpMult: 10.5, atkMult: 2.7, defMult: 1.2, baseXp: 64, baseGold: 54 },
    { id: 'crypt_guardian', name: 'Strażnik Krypt', emoji: '🗿', hpMult: 14.0, atkMult: 2.1, defMult: 2.4, baseXp: 66, baseGold: 45 },
  ],
  // Tier 4 (piętro 7–8)
  [
    { id: 'plague_wraith', name: 'Upiór Plagi',     emoji: '🧟', hpMult: 17.0, atkMult: 3.0, defMult: 2.0, baseXp: 80, baseGold: 65 },
    { id: 'bone_beast',    name: 'Kościana Bestia', emoji: '🦴', hpMult: 20.0, atkMult: 2.7, defMult: 2.9, baseXp: 75, baseGold: 58 },
    { id: 'archlich',      name: 'Arcylich',        emoji: '🧿', hpMult: 15.0, atkMult: 3.5, defMult: 1.8, baseXp: 84, baseGold: 70 },
  ],
  // Tier 5 (piętro 9–10)
  [
    { id: 'ancient_vampire', name: 'Wampir Starożytny', emoji: '🧛', hpMult: 22.0, atkMult: 3.8, defMult: 2.6, baseXp: 120, baseGold: 105 },
    { id: 'abomination',     name: 'Abominacja',        emoji: '👹', hpMult: 27.0, atkMult: 3.4, defMult: 3.6, baseXp: 114, baseGold: 98 },
    { id: 'dark_paladin',    name: 'Mroczny Paladyn',   emoji: '🗡️', hpMult: 20.0, atkMult: 4.0, defMult: 3.2, baseXp: 125, baseGold: 110 },
  ],
];

export const SPIDER_TEMPLATE: EnemyTemplate = {
  id: 'poison_spider',
  name: 'Jadowity Pająk', emoji: '🕷️',
  hpMult: 2.5, atkMult: 0.8, defMult: 0.2, baseXp: 15, baseGold: 10,
};

export const MIMIC_TEMPLATE: EnemyTemplate = {
  id: 'chest_mimic',
  name: 'Mimik Skrzyni', emoji: '🎭',
  hpMult: 8.5, atkMult: 2.2, defMult: 1.4, baseXp: 55, baseGold: 60,
};

export const BOSS_TEMPLATE: EnemyTemplate = {
  id: 'shadow_lord',
  name: 'Lord Cienia', emoji: '☠️',
  hpMult: 45, atkMult: 3.2, defMult: 2.2, baseXp: 280, baseGold: 350,
};

export function getBossRarity(heroLevel: number): Rarity {
  const r = Math.random();
  if (heroLevel >= 25) {
    if (r < 0.10) return 'legendary';
    if (r < 0.75) return 'epic';
    return 'rare';
  }
  if (heroLevel >= 15) {
    if (r < 0.04) return 'legendary';
    if (r < 0.60) return 'epic';
    return 'rare';
  }
  if (heroLevel >= 10) {
    if (r < 0.30) return 'epic';
    return 'rare';
  }
  return 'rare';
}

export type ActiveBuff = {
  id: string;
  label: string;
  desc: string;
  color: string;
  atkMult: number;
  defMult: number;
  hpMult: number;
};

export const BUFFS: ActiveBuff[] = [
  { id: 'ancient_blessing', label: '✨ Błogosławieństwo', desc: '+15% ATK  +10% DEF  +10% HP',  color: '#ffd700', atkMult: 1.15, defMult: 1.10, hpMult: 1.10 },
  { id: 'battle_frenzy',    label: '⚔️ Szał Bojowy',      desc: '+30% ATK  −15% DEF',           color: '#ff4444', atkMult: 1.30, defMult: 0.85, hpMult: 1.00 },
  { id: 'stone_skin',       label: '🪨 Kamienna Skóra',   desc: '+35% DEF  +15% HP  −10% ATK',  color: '#aaaaaa', atkMult: 0.90, defMult: 1.35, hpMult: 1.15 },
  { id: 'dark_energy',      label: '🌑 Mroczna Energia',  desc: '+25% ATK  +20% HP  −5% DEF',   color: '#8844ff', atkMult: 1.25, defMult: 0.95, hpMult: 1.20 },
  { id: 'ice_armor',        label: '❄️ Lodowy Pancerz',   desc: '+50% DEF  +5% HP  −15% ATK',   color: '#44ccff', atkMult: 0.85, defMult: 1.50, hpMult: 1.05 },
];

export const DEBUFFS: ActiveBuff[] = [
  { id: 'cursed_blood',  label: '🩸 Przeklęta Krew', desc: '−20% ATK  −20% DEF  −15% HP',  color: '#cc00cc', atkMult: 0.80, defMult: 0.80, hpMult: 0.85 },
  { id: 'weakened',      label: '💔 Osłabienie',      desc: '−15% ATK  −15% DEF',           color: '#888888', atkMult: 0.85, defMult: 0.85, hpMult: 1.00 },
  { id: 'fear',          label: '😨 Strach',           desc: '−30% ATK  −10% DEF',           color: '#9944cc', atkMult: 0.70, defMult: 0.90, hpMult: 1.00 },
  { id: 'burning_blood', label: '🔥 Płonąca Krew',    desc: '+10% ATK  −35% DEF  −20% HP',  color: '#ff6600', atkMult: 1.10, defMult: 0.65, hpMult: 0.80 },
  { id: 'brittle_bones', label: '🦴 Kruche Kości',    desc: '−25% ATK  −40% DEF  −10% HP',  color: '#bbaa88', atkMult: 0.75, defMult: 0.60, hpMult: 0.90 },
];

export type KryptaEnemy = {
  id: string;
  name: string;
  emoji: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  xp: number;
  gold: number;
};

export function buildEnemy(template: EnemyTemplate, heroLevel: number, depth: number): KryptaEnemy {
  const scale = 1 + (depth - 1) * 0.13;
  const lvl = Math.max(1, heroLevel);
  const hp = Math.round(lvl * template.hpMult * scale);
  return {
    id:      template.id,
    name:    template.name,
    emoji:   template.emoji,
    hp,
    maxHp:   hp,
    attack:  Math.round(lvl * template.atkMult * scale),
    defense: Math.round(lvl * template.defMult * scale),
    xp:      Math.round(template.baseXp  * (1 + lvl * 0.08) * scale),
    gold:    Math.round(template.baseGold * (1 + lvl * 0.08) * scale),
  };
}

export function pickRandomEnemy(depth: number): EnemyTemplate {
  const tier = depth <= 2 ? 0 : depth <= 4 ? 1 : depth <= 6 ? 2 : depth <= 8 ? 3 : 4;
  const pool = ENEMY_TIERS[tier];
  return pool[Math.floor(Math.random() * pool.length)];
}
