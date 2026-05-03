import type { Item, Rarity } from '../types';

// Single-char color codes used in sprite strings
const P: Record<string, string> = {
  '.': 'transparent',
  'k': '#0D1117',   // outline
  'M': '#8FA4B8',   // metal mid  — rarity tinted
  'L': '#C8D8E8',   // metal light — rarity tinted
  'D': '#3A4858',   // metal dark  — rarity tinted
  'W': '#5C3A1E',   // wood dark   (grip / shaft)
  'V': '#9C6A3A',   // wood light
  'y': '#C8920C',   // gold dark
  'Y': '#F0C030',   // gold bright
  'g': '#5A6375',   // guard/secondary dark
  'G': '#8A96A8',   // guard/secondary light
  'r': '#CC2020',   // red gem
  'p': '#8B30E0',   // purple gem
  'b': '#1E70E0',   // blue gem
};

// metal mid / light / dark base values (used as override keys)
const MM = P['M'];
const ML = P['L'];
const MD = P['D'];

function parse(rows: string[]): string[][] {
  return rows.map(row => row.split('').map(c => P[c] ?? 'transparent'));
}

// ── Rarity palette: overrides the 3 metal shades ────────────────────────────
export function getRarityPalette(rarity: Rarity): Record<string, string> {
  const t: Record<Rarity, [string, string, string]> = {
    common:    ['#8FA4B8', '#C8D8E8', '#3A4858'],
    uncommon:  ['#4A9B5C', '#7DCC8C', '#2A5E35'],
    rare:      ['#3A78D4', '#7AAEF8', '#1A4A9C'],
    epic:      ['#9040C8', '#C078F0', '#5A2080'],
    legendary: ['#D48020', '#F8C840', '#8A4800'],
  };
  const [m, l, d] = t[rarity] ?? t.common;
  return { [MM]: m, [ML]: l, [MD]: d };
}

// ── 12×12 pixel art sprites ──────────────────────────────────────────────────
const SPRITES: Record<string, string[][]> = {

  sword: parse([
    '....L.......',
    '....LM......',
    '....LM......',
    '....LM......',
    '....LMD.....',
    '.gggLMGg....',
    '....LM......',
    '....VW......',
    '....VW......',
    '....VW......',
    '....yY......',
    '............',
  ]),

  dagger: parse([
    '.....L......',
    '.....LM.....',
    '.....LM.....',
    '....gGg.....',
    '....VW......',
    '....VW......',
    '....yY......',
    '............',
    '............',
    '............',
    '............',
    '............',
  ]),

  axe: parse([
    '...LLL......',
    '..LMMLk.....',
    '.LMMMDk.....',
    'LMMMMDk.....',
    '.LMMMDk.....',
    '..LMMLk.....',
    '...gVWg.....',
    '....VW......',
    '....VW......',
    '....VW......',
    '....VW......',
    '....VV......',
  ]),

  mace: parse([
    '...LLLL.....',
    '..LMrMML....',
    '.LMMMrMML...',
    '..LMrMML....',
    '...LLLL.....',
    '....VW......',
    '....VW......',
    '....VW......',
    '....VW......',
    '....VW......',
    '....VW......',
    '....VV......',
  ]),

  spear: parse([
    '.....L......',
    '....LML.....',
    '...LMMLk....',
    '..LMMMLk....',
    '....VWg.....',
    '....VW......',
    '....VW......',
    '....VW......',
    '....VW......',
    '....VW......',
    '....VW......',
    '....VV......',
  ]),

  bow: parse([
    '.LD.........',
    'LMDk........',
    'LMD.k.......',
    'LMD..k......',
    'LMMM..k.....',
    '.LMMM..k....',
    '.LMMM.k.....',
    'LMD..k......',
    'LMD.k.......',
    'LMDk........',
    '.LD.........',
    '............',
  ]),

  staff: parse([
    '...ppp......',
    '..pLLp......',
    '..pLLp......',
    '...ppp......',
    '....ML......',
    '....ML......',
    '....ML......',
    '....ML......',
    '....ML......',
    '....ML......',
    '....ML......',
    '...VMV......',
  ]),

  wand: parse([
    '...YyY......',
    '..YpYpY.....',
    '...YyY......',
    '....ML......',
    '....ML......',
    '...ML.......',
    '..ML........',
    '.ML.........',
    '............',
    '............',
    '............',
    '............',
  ]),

  armor: parse([
    '.LLLLLL.....',
    'LMMrMML.....',
    'LMMMML......',
    '.LMMML......',
    '..LMMk......',
    '..LMMk......',
    '..LMMk......',
    '..LML.Lk....',
    '.LML...Lk...',
    'LML.....Lk..',
    '............',
    '............',
  ]),

  robe: parse([
    '..LLLLLL....',
    '.LMMMMMML...',
    'LMMMMMML....',
    '.LMMMML.....',
    '..LMMML.....',
    '..LMMML.....',
    '.LMMMML.....',
    'LMMMMMML....',
    'LMMMMMML....',
    '.LLLLLL.....',
    '............',
    '............',
  ]),

  helmet: parse([
    '..LLLLLL....',
    '.LMMMMML....',
    'LMMMMMMML...',
    'LMMgGgMML...',
    'LMgGGGgML...',
    'LMgGGGgML...',
    'LLLLLLLLL...',
    '............',
    '............',
    '............',
    '............',
    '............',
  ]),

  hood: parse([
    '.LLLLLLL....',
    'LMMMMMML....',
    'LMDDDDMMk...',
    'LMD....MMk..',
    'LMD....MMk..',
    'LMDDDDMMk...',
    '.LMMMMML....',
    '..LLLLLL....',
    '............',
    '............',
    '............',
    '............',
  ]),

  crown: parse([
    'y...y...y...',
    'yy.yy.yy....',
    'yYryYbyYy...',
    '.yYYYYYy....',
    '.yYYYYYy....',
    '..yyyyyyy...',
    '............',
    '............',
    '............',
    '............',
    '............',
    '............',
  ]),

  boots: parse([
    '............',
    '..WWW.......',
    '..VVVW......',
    '..VVVW......',
    '..VVVW......',
    '..VVVW......',
    '..VVVW......',
    '..VVVVVVk...',
    '..VVVVVVk...',
    '.kWWWWWWk...',
    '............',
    '............',
  ]),

  ring: parse([
    '............',
    '....yYy.....',
    '...yYrYy....',
    '..yY...Yy...',
    '..Y.....Y...',
    '..Y.....Y...',
    '..yY...Yy...',
    '...yYYYy....',
    '....yyy.....',
    '............',
    '............',
    '............',
  ]),

  amulet: parse([
    '..yyyyyy....',
    '............',
    '....yYy.....',
    '...yYMYy....',
    '..yYMrMYy...',
    '...yYMYy....',
    '....yYy.....',
    '.....y......',
    '............',
    '............',
    '............',
    '............',
  ]),
};

// ── Map item id → sprite key ─────────────────────────────────────────────────
export function getItemSprite(item: Item): string[][] {
  const { id } = item;
  let key: string;
  if      (id.startsWith('sword'))                                 key = 'sword';
  else if (id.startsWith('dagger'))                                key = 'dagger';
  else if (id.startsWith('axe'))                                   key = 'axe';
  else if (id.startsWith('mace') || id.startsWith('hammer'))       key = 'mace';
  else if (id.startsWith('spear'))                                  key = 'spear';
  else if (id.startsWith('bow') || id.startsWith('crossbow'))      key = 'bow';
  else if (id.startsWith('staff'))                                  key = 'staff';
  else if (id.startsWith('wand'))                                   key = 'wand';
  else if (id.startsWith('robe') || id.startsWith('vest') || id.startsWith('coat')) key = 'robe';
  else if (id.startsWith('armor'))                                  key = 'armor';
  else if (id.startsWith('hood') || id.startsWith('helmet_shadow'))key = 'hood';
  else if (id.startsWith('crown') || id.startsWith('circlet') || id.startsWith('helmet_dragon')) key = 'crown';
  else if (id.startsWith('helmet'))                                 key = 'helmet';
  else if (id.startsWith('boots') || id.startsWith('sandals'))     key = 'boots';
  else if (id.startsWith('ring'))                                   key = 'ring';
  else if (id.startsWith('amulet'))                                 key = 'amulet';
  else key = item.slot;

  return SPRITES[key] ?? SPRITES['sword'];
}
