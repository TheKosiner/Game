import type { Item, Rarity } from '../types';

const P: Record<string, string> = {
  '.': 'transparent',
  'k': '#0D1117',
  'M': '#8FA4B8',
  'L': '#C8D8E8',
  'D': '#3A4858',
  'W': '#1A1A2A',
  'V': '#2E2E40',
  'y': '#C8920C',
  'Y': '#F0C030',
  'g': '#5A6375',
  'G': '#8A96A8',
  'r': '#CC2020',
  'p': '#8B30E0',
  'b': '#1E70E0',
};

const MM = P['M'];
const ML = P['L'];
const MD = P['D'];

function parse(rows: string[]): string[][] {
  return rows.map(row => row.split('').map(c => P[c] ?? 'transparent'));
}

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

const SPRITES: Record<string, string[][]> = {

  // Plasma/mono-filament blade — vertical, tech crossguard
  energy_blade: parse([
    '.....LL.....',
    '....kLMk....',
    '....kLMk....',
    '....kLMk....',
    '....kLMk....',
    '....kLMk....',
    '..ggkMkgg...',
    '....kDDk....',
    '....kDDk....',
    '....kDDk....',
    '...kDDDDk...',
    '............',
  ]),

  // Compact pistol / SMG — side view
  gun: parse([
    '............',
    '..kkkkkkk...',
    '.kLMMMMMk...',
    '.kMMMMMDk...',
    '.kDDDDDkk...',
    '..kkMMMk....',
    '...kDDDk....',
    '...kDDDk....',
    '...kDDDk....',
    '...kDDDk....',
    '...kkkkk....',
    '............',
  ]),

  // Long-barrel sniper with scope
  sniper_rifle: parse([
    '............',
    '.kkkkkkkkk..',
    'kLLLLLLLLk..',
    'kMMMMMMMDk..',
    'kDDDDDkMMk..',
    '.....kMMk...',
    '.....kMMk...',
    '.....kkk....',
    '........kDk.',
    '........kDk.',
    '........kkk.',
    '............',
  ]),

  // Shock baton — vertical rod with electric tip
  baton: parse([
    '....bbb.....',
    '...kbbbk....',
    '....bbb.....',
    '....kMk.....',
    '....kMk.....',
    '....kMk.....',
    '....kMk.....',
    '..gkkMkkg...',
    '....kDk.....',
    '....kDk.....',
    '....kDk.....',
    '....kkkk....',
  ]),

  // Diagonal railgun / electro-pike
  railgun: parse([
    '.........kLL',
    '........kLMM',
    '.......kLMMM',
    '......kLMMDk',
    '.....kLMMDk.',
    '....kLMMDk..',
    '...kgMMgk...',
    '..kgMMk.....',
    '.kgDk.......',
    'kgk.........',
    'k...........',
    '............',
  ]),

  // Compact nano-knife — diagonal blade
  nano_knife: parse([
    '...........L',
    '..........LM',
    '.........LMk',
    '........LMk.',
    '.......LMk..',
    '....gGLMk...',
    '....gGDk....',
    '....kDk.....',
    '...kDk......',
    '..kDk.......',
    '.kkk........',
    '............',
  ]),

  // Ballistic vest — chest plate
  vest: parse([
    '............',
    '..kkkkkk....',
    '.kMLLLLMk...',
    '.kMDDDDMk...',
    '.kMDDDDMk...',
    '.kMMkkkMk...',
    '.kMMMMMMk...',
    '.kMMMMMk....',
    '..kkkkk.....',
    '............',
    '............',
    '............',
  ]),

  // Heavy exoskeleton — chest plate with shoulder pads
  exo_suit: parse([
    '.kkkkkkkk...',
    'kMMMMMMMk...',
    'kMgGggGMk...',
    'kMMgGGgMMk..',
    'kMMGbGGMMk..',
    'kMMGGGGMMk..',
    'kMMgGGgMMk..',
    'kMMMMMMMk...',
    '.kMMMMMk....',
    '..kMMMk.....',
    '...kkk......',
    '............',
  ]),

  // Cyberpunk trenchcoat — hacker/netrunner
  hacker_coat: parse([
    '..kkkkkk....',
    '.kMMMMMMk...',
    'kMMMMMMMMk..',
    'kMMkkkkMMk..',
    'kMk....kMk..',
    'kMk....kMk..',
    'kMk....kMk..',
    'kMMkkkkMMk..',
    'kMMMMMMMMk..',
    'kMMMMMMMMk..',
    '.kkkkkkk....',
    '............',
  ]),

  // Cyber visor / goggles
  visor: parse([
    '............',
    '.kkkkkkkk...',
    'kMMMMMMMMk..',
    'kMbbbbMMMk..',
    'kMbbbbMMMk..',
    'kMMMMMMMk...',
    'kggggggk....',
    '.kkkkkkk....',
    '............',
    '............',
    '............',
    '............',
  ]),

  // Tactical combat helmet — full head coverage
  tac_helmet: parse([
    '..kkkkkk....',
    '.kMMMMMMk...',
    'kMMMMMMMMk..',
    'kMkkkkkMk...',
    'kMkgGgkMk...',
    'kMkDDDkMk...',
    'kMkDDDkMk...',
    'kMMMMMMMMk..',
    '.kkkkkkkk...',
    '............',
    '............',
    '............',
  ]),

  // Half-face cyber mask — ventilation grille
  cyber_mask: parse([
    '............',
    '............',
    '..kkkkkk....',
    '.kMMMMMk....',
    '.kMgGGgMk...',
    '.kMgGGgMk...',
    '.kMgGGgMk...',
    '.kMMMMMk....',
    '..kkkkk.....',
    '............',
    '............',
    '............',
  ]),

  // Neural implant chip — head slot
  neural_implant: parse([
    '............',
    '...kkkkkk...',
    '..kMLLLLMk..',
    '..kMkbkbMk..',
    '..kMbkbkMk..',
    '..kMkbkbMk..',
    '..kMbkbkMk..',
    '..kMLLLLMk..',
    '...kkkkkk...',
    '............',
    '............',
    '............',
  ]),

  // Armored cyber boots — side view
  cyber_boots: parse([
    '............',
    '..kkkk......',
    '.kMMMk......',
    '.kMLMk......',
    '.kMLMk......',
    '.kMLMk......',
    '.kMMMk......',
    '.kMMMMMMkk..',
    '.kMLLLLMMk..',
    '.kMMMMMMMMk.',
    '..kkkkkkkk..',
    '............',
  ]),

  // Injected muscle/reflex implant — ring slot
  implant: parse([
    '.....kk.....',
    '....kLLk....',
    '....kLLk....',
    '...kMMMMk...',
    '...kMbMMk...',
    '...kMMMMk...',
    '...kMMMMk...',
    '....kMMk....',
    '.....kMk....',
    '.....kMk....',
    '.....kkk....',
    '............',
  ]),

  // Circuit data chip — ring slot
  data_chip: parse([
    '............',
    '..kkkkkkkk..',
    '.kMMMMMMMMk.',
    '.kMkkkkkMMk.',
    '.kMkbbbkMMk.',
    '.kMkbkbkMMk.',
    '.kMkbbbkMMk.',
    '.kMkkkkkMMk.',
    '.kMMMMMMMMk.',
    '..kkkkkkkk..',
    '............',
    '............',
  ]),

  // Hexagonal data storage core — amulet slot
  data_core: parse([
    '....kkkk....',
    '...kMLLMk...',
    '..kMLLLLMk..',
    '..kMbLbLMk..',
    '..kMLbLLMk..',
    '..kMbLbLMk..',
    '..kMLLLLMk..',
    '...kMLLMk...',
    '....kkkk....',
    '............',
    '............',
    '............',
  ]),

  // Satellite dish signal amplifier — amulet slot
  signal_amp: parse([
    '....kMk.....',
    '....kMk.....',
    '...kMMMk....',
    '..kMMDMMk...',
    '.kMMDDDMMk..',
    '.kMDDDDDMk..',
    '.kDDDDDDMk..',
    '...kMMMMk...',
    '..kMMMMMk...',
    '.kkkkkkk....',
    '............',
    '............',
  ]),
};

export function getItemSprite(item: Item): string[][] {
  const { id } = item;
  let key: string;

  if      (id.startsWith('blade_'))                                            key = 'energy_blade';
  else if (id.startsWith('cannon_'))                                           key = 'gun';
  else if (id.startsWith('baton_') || id.startsWith('hammer_'))               key = 'baton';
  else if (id.startsWith('pike_') || id.startsWith('lance_') || id.startsWith('railgun_')) key = 'railgun';
  else if (id.startsWith('knife_') || id.startsWith('shiv_'))                 key = 'nano_knife';
  else if (id.startsWith('smg_') || id.startsWith('rifle_'))                  key = 'gun';
  else if (id.startsWith('pistol_') || id.startsWith('sniper_'))              key = 'sniper_rifle';
  else if (id.startsWith('exo_') || id === 'suit_combat' || id === 'suit_nano') key = 'exo_suit';
  else if (id.startsWith('vest_'))                                             key = 'vest';
  else if (id.startsWith('coat_') || id.startsWith('suit_'))                  key = 'hacker_coat';
  else if (id.startsWith('visor_'))                                            key = 'visor';
  else if (id.startsWith('mask_'))                                             key = 'cyber_mask';
  else if (id === 'implant_neural' || id.startsWith('interface_'))            key = 'neural_implant';
  else if (id.startsWith('helmet_'))                                           key = 'tac_helmet';
  else if (id.startsWith('boots_'))                                            key = 'cyber_boots';
  else if (id.startsWith('implant_'))                                          key = 'implant';
  else if (id.startsWith('chip_'))                                             key = 'data_chip';
  else if (id.startsWith('amplifier_'))                                        key = 'signal_amp';
  else if (id.startsWith('core_'))                                             key = 'data_core';
  else key = item.slot;

  return SPRITES[key] ?? SPRITES['energy_blade'];
}
