import type { Rarity } from '../types';

export type EnemyTemplate = {
  name: string;
  emoji: string;
  hpMult: number;
  atkMult: number;
  defMult: number;
  baseXp: number;
  baseGold: number;
};

export const ENEMY_TIERS: EnemyTemplate[][] = [
  // Tier 1 (depth 1–4)
  [
    { name: 'Cień Krwi',      emoji: '👻', hpMult:  3.5, atkMult: 0.8, defMult: 0.5, baseXp: 20, baseGold: 15 },
    { name: 'Kościan',        emoji: '💀', hpMult:  4.0, atkMult: 0.7, defMult: 0.7, baseXp: 22, baseGold: 12 },
    { name: 'Gnijący Szczur', emoji: '🐀', hpMult:  3.0, atkMult: 1.0, defMult: 0.3, baseXp: 18, baseGold: 18 },
  ],
  // Tier 2 (depth 5–8)
  [
    { name: 'Widmo',         emoji: '🌫️', hpMult:  5.0, atkMult: 1.2, defMult: 0.8, baseXp: 35, baseGold: 28 },
    { name: 'Trupi Rycerz', emoji: '⚔️', hpMult:  6.0, atkMult: 1.0, defMult: 1.2, baseXp: 40, baseGold: 25 },
    { name: 'Nekromanta',   emoji: '🧙', hpMult:  4.5, atkMult: 1.4, defMult: 0.6, baseXp: 38, baseGold: 30 },
  ],
  // Tier 3 (depth 9–12)
  [
    { name: 'Demon Otchłani', emoji: '😈', hpMult:  7.5, atkMult: 1.6, defMult: 1.0, baseXp: 55, baseGold: 45 },
    { name: 'Nieumarły Mag',  emoji: '🔮', hpMult:  6.5, atkMult: 1.8, defMult: 0.8, baseXp: 58, baseGold: 48 },
    { name: 'Strażnik Krypt', emoji: '🗿', hpMult:  9.0, atkMult: 1.4, defMult: 1.6, baseXp: 60, baseGold: 40 },
  ],
  // Tier 4 (depth 13–16) — elitarne nieumarłe
  [
    { name: 'Upiór Plagi',     emoji: '🧟', hpMult: 11.0, atkMult: 2.0, defMult: 1.4, baseXp: 72, baseGold: 58 },
    { name: 'Kościana Bestia', emoji: '🦴', hpMult: 13.0, atkMult: 1.8, defMult: 2.0, baseXp: 68, baseGold: 52 },
    { name: 'Arcylichej',      emoji: '🧿', hpMult:  9.5, atkMult: 2.4, defMult: 1.2, baseXp: 75, baseGold: 62 },
  ],
  // Tier 5 (depth 17–20) — horrory przedbossowe
  [
    { name: 'Wampir Starożytny', emoji: '🧛', hpMult: 14.0, atkMult: 2.8, defMult: 1.6, baseXp: 88, baseGold: 72 },
    { name: 'Abominacja',        emoji: '👹', hpMult: 17.0, atkMult: 2.4, defMult: 2.4, baseXp: 82, baseGold: 68 },
    { name: 'Mroczny Paladyn',   emoji: '🗡️', hpMult: 12.5, atkMult: 3.0, defMult: 2.8, baseXp: 90, baseGold: 75 },
  ],
];

export const SPIDER_TEMPLATE: EnemyTemplate = {
  name: 'Jadowity Pająk', emoji: '🕷️',
  hpMult: 2.5, atkMult: 0.9, defMult: 0.3, baseXp: 15, baseGold: 10,
};

export const MIMIC_TEMPLATE: EnemyTemplate = {
  name: 'Mimik Skrzyni', emoji: '🎭',
  hpMult: 8.5, atkMult: 2.2, defMult: 1.4, baseXp: 55, baseGold: 60,
};

export const BOSS_TEMPLATE: EnemyTemplate = {
  name: 'Lord Cienia', emoji: '☠️',
  hpMult: 65, atkMult: 4.5, defMult: 2.5, baseXp: 280, baseGold: 350,
};

export function getBossRarity(heroLevel: number): Rarity {
  const r = Math.random();
  if (heroLevel >= 25) {
    if (r < 0.18) return 'legendary';
    if (r < 0.82) return 'epic';
    return 'rare';
  }
  if (heroLevel >= 15) {
    if (r < 0.08) return 'legendary';
    if (r < 0.68) return 'epic';
    return 'rare';
  }
  if (heroLevel >= 10) {
    if (r < 0.35) return 'epic';
    return 'rare';
  }
  return 'rare';
}

export type ActiveBuff = {
  id: string;
  label: string;
  color: string;
  atkMult: number;
  defMult: number;
  hpMult: number;
};

export const BUFFS: ActiveBuff[] = [
  { id: 'ancient_blessing', label: '✨ Błogosławieństwo', color: '#ffd700', atkMult: 1.15, defMult: 1.10, hpMult: 1.10 },
  { id: 'battle_frenzy',    label: '⚔️ Szał Bojowy',      color: '#ff4444', atkMult: 1.30, defMult: 0.85, hpMult: 1.00 },
  { id: 'stone_skin',       label: '🪨 Kamienna Skóra',   color: '#aaaaaa', atkMult: 0.90, defMult: 1.35, hpMult: 1.15 },
  { id: 'dark_energy',      label: '🌑 Mroczna Energia',  color: '#8844ff', atkMult: 1.25, defMult: 0.95, hpMult: 1.20 },
  { id: 'ice_armor',        label: '❄️ Lodowy Pancerz',   color: '#44ccff', atkMult: 0.85, defMult: 1.50, hpMult: 1.05 },
];

export const DEBUFFS: ActiveBuff[] = [
  { id: 'cursed_blood',  label: '🩸 Przeklęta Krew', color: '#cc00cc', atkMult: 0.80, defMult: 0.80, hpMult: 0.85 },
  { id: 'weakened',      label: '💔 Osłabienie',      color: '#888888', atkMult: 0.85, defMult: 0.85, hpMult: 1.00 },
  { id: 'fear',          label: '😨 Strach',           color: '#9944cc', atkMult: 0.70, defMult: 0.90, hpMult: 1.00 },
  { id: 'burning_blood', label: '🔥 Płonąca Krew',    color: '#ff6600', atkMult: 1.10, defMult: 0.65, hpMult: 0.80 },
  { id: 'brittle_bones', label: '🦴 Kruche Kości',    color: '#bbaa88', atkMult: 0.75, defMult: 0.60, hpMult: 0.90 },
];

export type KryptaEnemy = {
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
  const tier = depth <= 4 ? 0 : depth <= 8 ? 1 : depth <= 12 ? 2 : depth <= 16 ? 3 : 4;
  const pool = ENEMY_TIERS[tier];
  return pool[Math.floor(Math.random() * pool.length)];
}
