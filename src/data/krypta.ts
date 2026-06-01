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

export const ENEMY_TEMPLATES: EnemyTemplate[] = [
  { name: 'Szkielet',      emoji: '💀', hpMult: 8,  atkMult: 1.2, defMult: 0.8, baseXp: 18,  baseGold: 12  },
  { name: 'Ghul',          emoji: '🦷', hpMult: 10, atkMult: 1.5, defMult: 0.9, baseXp: 22,  baseGold: 15  },
  { name: 'Widmo',         emoji: '👻', hpMult: 7,  atkMult: 1.8, defMult: 0.6, baseXp: 25,  baseGold: 18  },
  { name: 'Zombie',        emoji: '🧙', hpMult: 14, atkMult: 1.0, defMult: 1.2, baseXp: 20,  baseGold: 13  },
  { name: 'Upiór',         emoji: '🦇', hpMult: 9,  atkMult: 1.6, defMult: 0.7, baseXp: 28,  baseGold: 20  },
  { name: 'Demon Cienia',  emoji: '👿', hpMult: 12, atkMult: 2.0, defMult: 1.0, baseXp: 35,  baseGold: 28  },
];

export const SPIDER_TEMPLATE: EnemyTemplate = {
  name: 'Pająk Kryptowy', emoji: '🕷️',
  hpMult: 18, atkMult: 2.2, defMult: 1.3, baseXp: 45, baseGold: 35,
};

export const BOSS_TEMPLATE: EnemyTemplate = {
  name: 'Lord Cienia', emoji: '☠️',
  hpMult: 55, atkMult: 4.0, defMult: 2.0, baseXp: 200, baseGold: 250,
};

export function getBossRarity(heroLevel: number): Rarity {
  const r = Math.random();
  if (heroLevel >= 30) {
    if (r < 0.12) return 'legendary'; // ~12% — trochę powyżej trybu łupów (~8%)
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
  { id: 'fury',    label: 'Furia',       color: '#ff4444', atkMult: 1.5,  defMult: 0.8,  hpMult: 1.0 },
  { id: 'shield',  label: 'Tarcza',      color: '#4488ff', atkMult: 1.0,  defMult: 1.8,  hpMult: 1.0 },
  { id: 'regen',   label: 'Regeneracja', color: '#44ff88', atkMult: 1.0,  defMult: 1.0,  hpMult: 1.5 },
  { id: 'shadow',  label: 'Mrok',        color: '#aa44ff', atkMult: 1.25, defMult: 1.25, hpMult: 1.25 },
];

export const EVENT_POOL = [
  {
    id: 'trap',
    text: 'Wchodzisz w strefę pułapek. Kole z kolcami wyrastają z podłogi!',
    choices: [
      { label: 'Przeskocz (DEX)',    stat: 'dexterity' as const,    dmgPct: 0.05, buffId: null },
      { label: 'Przetrzymaj (VIT)', stat: 'vitality'  as const, dmgPct: 0.20, buffId: null },
    ],
  },
  {
    id: 'altar',
    text: 'Napotykasz mroczny ołtarz. Możesz złożyć ofiarę z krwi w zamian za siłę.',
    choices: [
      { label: 'Złóż ofiarę (15% HP → Furia)', stat: null, dmgPct: 0.15, buffId: 'fury'   },
      { label: 'Ominąć',                        stat: null, dmgPct: 0,    buffId: null   },
    ],
  },
  {
    id: 'fountain',
    text: 'Tajemnicza fontanna emituje złowrogą poświatę. Pijąc z niej możesz zyskać ochronę.',
    choices: [
      { label: 'Wypić (INT → Tarcza)',  stat: 'intelligence' as const, dmgPct: 0,    buffId: 'shield' },
      { label: 'Zignorować',              stat: null,                    dmgPct: 0,    buffId: null    },
    ],
  },
  {
    id: 'miasma',
    text: 'Gruba warstwa miazmy wypełnia korytarz. Oddychasz ciężkim, zgniłym powietrzem.',
    choices: [
      { label: 'Przebij się siłą (STR)', stat: 'strength'     as const, dmgPct: 0.10, buffId: null  },
      { label: 'Zaczekaj i regeneruj', stat: null,                   dmgPct: 0,    buffId: 'regen' },
    ],
  },
  {
    id: 'runes',
    text: 'Na ścianie widnieją starożytne runy. Ktoś lub coś tu było przed tobą.',
    choices: [
      { label: 'Odczytaj (INT → Mrok)',   stat: 'intelligence' as const, dmgPct: 0,    buffId: 'shadow' },
      { label: 'Ignoruj i idź dalej',     stat: null,                    dmgPct: 0,    buffId: null     },
    ],
  },
];
