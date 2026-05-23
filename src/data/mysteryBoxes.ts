import type { Item, Rarity } from '../types';
import { generateItem } from './itemGenerator';

export const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

export const BOX_GOLD_VALUE: Record<Rarity, number> = {
  common:    300,
  uncommon:  700,
  rare:      1_600,
  epic:      4_000,
  legendary: 10_000,
};

const DROP_TABLE: Record<Rarity, [Rarity, number][]> = {
  common:    [['common', 0.80], ['uncommon', 0.20]],
  uncommon:  [['uncommon', 0.60], ['rare', 0.35], ['epic', 0.05]],
  rare:      [['rare', 0.55], ['epic', 0.35], ['legendary', 0.10]],
  epic:      [['epic', 0.55], ['legendary', 0.45]],
  legendary: [['legendary', 0.80], ['epic', 0.20]],
};

const BOX_EMOJI: Record<Rarity, string> = {
  common: '📦', uncommon: '🗳️', rare: '💼', epic: '🗃️', legendary: '🏆',
};

const BOX_NAME: Record<Rarity, string> = {
  common:    'Zwykła Skrzynka',
  uncommon:  'Ulepszona Skrzynka',
  rare:      'Rzadka Skrzynka',
  epic:      'Epicka Skrzynka',
  legendary: 'Legendarna Skrzynka',
};

export function createMysteryBox(rarity: Rarity, heroLevel: number): Item {
  return {
    id: `mystery_box_${rarity}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    name: BOX_NAME[rarity],
    slot: 'mystery_box',
    rarity,
    stats: {},
    level: heroLevel,
    goldValue: BOX_GOLD_VALUE[rarity],
    emoji: BOX_EMOJI[rarity],
  };
}

function rollRarity(boxRarity: Rarity): Rarity {
  const table = DROP_TABLE[boxRarity];
  let r = Math.random();
  for (const [rarity, prob] of table) {
    r -= prob;
    if (r <= 0) return rarity;
  }
  return table[0][0];
}

export function openMysteryBox(box: Item, heroLevel: number): Item {
  const dropRarity = rollRarity(box.rarity);
  return generateItem(Math.max(1, heroLevel), dropRarity);
}

// Items shown during the spin animation (display only)
export const SPIN_POOL: { name: string; emoji: string; rarity: Rarity }[] = [
  { name: 'Wibro-Kling',       emoji: '⚡', rarity: 'common'    },
  { name: 'Pancerz Miejski',   emoji: '🧥', rarity: 'common'    },
  { name: 'Hełm Skanujący',    emoji: '⛑️', rarity: 'common'    },
  { name: 'Nano-Dagger',       emoji: '🗡️', rarity: 'uncommon'  },
  { name: 'Laser Blade',       emoji: '⚔️', rarity: 'uncommon'  },
  { name: 'Cyber-Kolczuga',    emoji: '🦺', rarity: 'uncommon'  },
  { name: 'Plasma Cannon',     emoji: '🔫', rarity: 'rare'      },
  { name: 'Cyber Shield',      emoji: '🛡️', rarity: 'rare'      },
  { name: 'Railgun MK-II',     emoji: '🎯', rarity: 'rare'      },
  { name: 'Void Armor',        emoji: '🌑', rarity: 'epic'      },
  { name: 'Quantum Blade',     emoji: '💠', rarity: 'epic'      },
  { name: 'Psi-Amplifier',     emoji: '🔮', rarity: 'epic'      },
  { name: 'Omega Blade',       emoji: '⭐', rarity: 'legendary'  },
  { name: 'Singularity Cannon',emoji: '🌌', rarity: 'legendary'  },
  { name: 'Nexus Gauntlet',    emoji: '💎', rarity: 'legendary'  },
];
