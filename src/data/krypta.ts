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
  // Tier 1 (piętro 1–3) — słabe nieumarłe
  [
    { name: 'Cień Krwi',      emoji: '👻', hpMult: 3.5, atkMult: 0.7, defMult: 0.4, baseXp: 20, baseGold: 15 },
    { name: 'Kościan',        emoji: '💀', hpMult: 4.0, atkMult: 0.6, defMult: 0.6, baseXp: 22, baseGold: 12 },
    { name: 'Gnijący Szczur', emoji: '🐀', hpMult: 3.0, atkMult: 0.9, defMult: 0.2, baseXp: 18, baseGold: 18 },
  ],
  // Tier 2 (piętro 4–6) — nieumarłe średniego szczebla
  [
    { name: 'Widmo',         emoji: '🌫️', hpMult: 5.0, atkMult: 1.1, defMult: 0.7, baseXp: 35, baseGold: 28 },
    { name: 'Trupi Rycerz', emoji: '⚔️', hpMult: 6.0, atkMult: 0.9, defMult: 1.1, baseXp: 40, baseGold: 25 },
    { name: 'Nekromanta',   emoji: '🧙', hpMult: 4.5, atkMult: 1.3, defMult: 0.5, baseXp: 38, baseGold: 30 },
  ],
  // Tier 3 (piętro 7–9) — silne demony
  [
    { name: 'Demon Otchłani',  emoji: '😈', hpMult: 7.0, atkMult: 1.5, defMult: 0.9, baseXp: 55, baseGold: 45 },
    { name: 'Nieumarły Mag',   emoji: '🔮', hpMult: 6.0, atkMult: 1.7, defMult: 0.7, baseXp: 58, baseGold: 48 },
    { name: 'Strażnik Krypt',  emoji: '🗿', hpMult: 8.5, atkMult: 1.3, defMult: 1.5, baseXp: 60, baseGold: 40 },
  ],
  // Tier 4 (piętro 10–12) — elitarne nieumarłe
  [
    { name: 'Upiór Plagi',     emoji: '🧟', hpMult: 10.0, atkMult: 1.8, defMult: 1.3, baseXp: 72, baseGold: 58 },
    { name: 'Kościana Bestia', emoji: '🦴', hpMult: 12.0, atkMult: 1.6, defMult: 1.8, baseXp: 68, baseGold: 52 },
    { name: 'Arcylich',        emoji: '🧿', hpMult: 9.0,  atkMult: 2.1, defMult: 1.1, baseXp: 75, baseGold: 62 },
  ],
  // Tier 5 (piętro 13–15) — horrory przedbossowe
  [
    { name: 'Wampir Starożytny', emoji: '🧛', hpMult: 13.0, atkMult: 2.0, defMult: 1.6, baseXp: 90, baseGold: 75 },
    { name: 'Abominacja',        emoji: '👹', hpMult: 16.0, atkMult: 1.8, defMult: 2.2, baseXp: 85, baseGold: 70 },
    { name: 'Mroczny Paladyn',   emoji: '🗡️', hpMult: 12.0, atkMult: 2.3, defMult: 2.0, baseXp: 95, baseGold: 80 },
  ],
];

export const SPIDER_TEMPLATE: EnemyTemplate = {
  name: 'Jadowity Pająk', emoji: '🕷️',
  hpMult: 2.5, atkMult: 0.8, defMult: 0.2, baseXp: 15, baseGold: 10,
};

export const BOSS_TEMPLATE: EnemyTemplate = {
  name: 'Lord Cienia', emoji: '☠️',
  hpMult: 55, atkMult: 3.5, defMult: 2.0, baseXp: 250, baseGold: 300,
};

export function getBossRarity(heroLevel: number): Rarity {
  const r = Math.random();
  if (heroLevel >= 30) {
    if (r < 0.12) return 'legendary';
    if (r < 0.85) return 'epic';
    return 'rare';
  }
  if (heroLevel >= 20) {
    if (r < 0.60) return 'epic';
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
  { id: 'ancient_blessing', label: '✨ Błogosławieństwo',  color: '#ffd700', atkMult: 1.15, defMult: 1.10, hpMult: 1.10 },
  { id: 'battle_frenzy',    label: '⚔️ Szał Bojowy',       color: '#ff4444', atkMult: 1.30, defMult: 0.85, hpMult: 1.00 },
  { id: 'stone_skin',       label: '🪨 Kamienna Skóra',    color: '#aaaaaa', atkMult: 0.90, defMult: 1.35, hpMult: 1.15 },
];

export const DEBUFFS: ActiveBuff[] = [
  { id: 'cursed_blood', label: '🩸 Przeklęta Krew', color: '#cc00cc', atkMult: 0.80, defMult: 0.80, hpMult: 0.85 },
  { id: 'weakened',     label: '💔 Osłabienie',      color: '#888888', atkMult: 0.85, defMult: 0.85, hpMult: 1.00 },
  { id: 'fear',         label: '😨 Strach',           color: '#9944cc', atkMult: 0.70, defMult: 0.90, hpMult: 1.00 },
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
  const scale = 1 + (depth - 1) * 0.12;
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
  const tier = depth <= 3 ? 0 : depth <= 6 ? 1 : depth <= 9 ? 2 : depth <= 12 ? 3 : 4;
  const pool = ENEMY_TIERS[tier];
  return pool[Math.floor(Math.random() * pool.length)];
}
