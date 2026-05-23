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
  common:    [['common', 0.82], ['uncommon', 0.15], ['rare', 0.03]],
  uncommon:  [['uncommon', 0.72], ['rare', 0.22], ['epic', 0.06]],
  rare:      [['rare', 0.68], ['epic', 0.24], ['legendary', 0.08]],
  epic:      [['epic', 0.78], ['legendary', 0.22]],
  legendary: [['legendary', 0.90], ['epic', 0.10]],
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

export function openMysteryBox(box: Item): Item {
  const dropRarity = rollRarity(box.rarity);
  // Item level follows box level with small variance (±2)
  const variance = Math.round((Math.random() - 0.5) * 4);
  const itemLevel = Math.max(1, box.level + variance);
  return generateItem(itemLevel, dropRarity);
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
