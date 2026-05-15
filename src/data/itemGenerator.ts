import type { Item, ItemSlot, Rarity, Stats } from '../types';

// ── Seeded RNG (LCG) ──────────────────────────────────────────────────────────
function makeSRng(seed: number): () => number {
  let s = (seed >>> 0) || 1;
  return () => {
    s = Math.imul(s, 1664525) + 1013904223 >>> 0;
    return s / 0x100000000;
  };
}

let _genCounter = 0;
function genId(): string {
  return `g_${Date.now()}_${++_genCounter}`;
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}
function rollInt(min: number, max: number, rng: () => number): number {
  return Math.round(min + rng() * (max - min));
}

// ── Rarity config ─────────────────────────────────────────────────────────────
const RARITY_MULT: Record<Rarity, number> = {
  common: 0.5, uncommon: 0.8, rare: 1.2, epic: 1.8, legendary: 2.6,
};
const RARITY_EXTRA: Record<Rarity, [number, number]> = {
  common: [0, 1], uncommon: [1, 1], rare: [1, 2], epic: [2, 2], legendary: [2, 3],
};
const RARITY_GOLD: Record<Rarity, number> = {
  common: 1, uncommon: 2, rare: 3.5, epic: 6, legendary: 11,
};

// ── Name pools ────────────────────────────────────────────────────────────────
const PREFIX: Record<Rarity, string[]> = {
  common:    ['Zniszczony', 'Stary', 'Prosty', 'Bazowy', 'Tani', 'Zużyty'],
  uncommon:  ['Solidny', 'Wzmocniony', 'Sprawny', 'Ulepszony', 'Wytrzymały'],
  rare:      ['Zaawansowany', 'Modyfikowany', 'Precyzyjny', 'Udoskonalony', 'Wzmocniony'],
  epic:      ['Elitarny', 'Mistrzowski', 'Doskonały', 'Niezrównany', 'Mistyczny'],
  legendary: ['Mityczny', 'Boski', 'Kosmiczny', 'Transcendentny', 'Absolutny'],
};

const SUFFIX = [
  'Siły', 'Cienia', 'Burzy', 'Elektryczności', 'Krwi', 'Ognia', 'Lodu',
  'Próżni', 'Chaosu', 'Przeznaczenia', 'Zniszczenia', 'Chwały', 'Zagłady',
];

// ── Weapon type templates ─────────────────────────────────────────────────────
interface WeaponTemplate {
  names: string[];
  emoji: string;
  ranged?: true;
  magicDamage?: true;
  primaryStat: keyof Stats;
}

const WEAPON_TEMPLATES: WeaponTemplate[] = [
  { names: ['Miecz', 'Ostrze', 'Siekiera', 'Szabla'],         emoji: '⚔',  primaryStat: 'strength' },
  { names: ['Sztylet', 'Nóż', 'Mono-Nóż', 'Żyletka'],        emoji: '🔪', primaryStat: 'dexterity' },
  { names: ['Karabin', 'Pistolet', 'Strzelba', 'Działko'],    emoji: '🔫', ranged: true, primaryStat: 'dexterity' },
  { names: ['Elektro-Pika', 'Lance', 'Harpun', 'Oszczep'],    emoji: '🔱', ranged: true, primaryStat: 'strength' },
  { names: ['Różdżka', 'Laska', 'Berło', 'Kryształ Mocy'],   emoji: '🔮', magicDamage: true, primaryStat: 'magic' },
  { names: ['Nano-Sztylet', 'Bio-Ostrze', 'Plazmak'],         emoji: '⚡', primaryStat: 'intelligence' },
  { names: ['Snajperka', 'Wyrzutnia', 'Karabin Precyzyjny'],  emoji: '🎯', ranged: true, primaryStat: 'intelligence' },
  { names: ['Cyber-Bat', 'Bicz Energii', 'Pałka'],            emoji: '⚡', primaryStat: 'strength' },
];

// ── Slot name pools ───────────────────────────────────────────────────────────
const SLOT_NAMES: Record<Exclude<ItemSlot, 'weapon' | 'consumable'>, { names: string[]; emoji: string }> = {
  armor:  { names: ['Pancerz', 'Kamizelka', 'Zbroja', 'Kombinezon', 'Egzoszkielet'], emoji: '🦺' },
  helmet: { names: ['Hełm', 'Wizjer', 'Maska', 'Kaptur', 'Visor'],                   emoji: '⛑' },
  boots:  { names: ['Buty', 'Boty', 'Nagolenniki', 'Buty Bojowe', 'Saboty'],          emoji: '👟' },
  ring:   { names: ['Implant', 'Wszczep', 'Chip', 'Pierścień', 'Rdzeń'],              emoji: '💉' },
  amulet: { names: ['Amulet', 'Rdzeń', 'Wisior', 'Kryształ', 'Nadajnik'],            emoji: '📿' },
};

// ── Stat pools per slot ───────────────────────────────────────────────────────
const SLOT_STATS: Record<Exclude<ItemSlot, 'weapon' | 'consumable'>, (keyof Stats)[]> = {
  armor:  ['vitality', 'strength', 'magicResistance', 'dexterity'],
  helmet: ['intelligence', 'vitality', 'magicResistance', 'magic'],
  boots:  ['dexterity', 'strength', 'vitality', 'intelligence'],
  ring:   ['strength', 'dexterity', 'intelligence', 'vitality', 'magic'],
  amulet: ['magic', 'intelligence', 'strength', 'vitality', 'magicResistance'],
};

// ── Core generator ────────────────────────────────────────────────────────────
export function generateItem(
  level: number,
  rarity: Rarity,
  slotHint?: ItemSlot,
  rngIn?: () => number,
): Item {
  const rng = rngIn ?? makeSRng(Date.now() * 6364136223846793005 + Math.random() * 1e15);
  const slots: ItemSlot[] = ['weapon', 'armor', 'helmet', 'boots', 'ring', 'amulet'];
  const slot: ItemSlot = slotHint && slotHint !== 'consumable' ? slotHint : pick(slots, rng);

  const mult = RARITY_MULT[rarity];
  const [minE, maxE] = RARITY_EXTRA[rarity];
  const extraCount = rollInt(minE, maxE, rng);
  const v = () => 0.82 + rng() * 0.36; // variance 0.82–1.18

  const prefix = pick(PREFIX[rarity], rng);
  const suffix = pick(SUFFIX, rng);

  let name: string;
  let emoji: string;
  let attackBonus: number | undefined;
  let defenseBonus: number | undefined;
  let ranged: true | undefined;
  let magicDamage: true | undefined;
  const stats: Partial<Stats> = {};

  if (slot === 'weapon') {
    const tpl = pick(WEAPON_TEMPLATES, rng);
    name = `${prefix} ${pick(tpl.names, rng)} ${suffix}`;
    emoji = tpl.emoji;
    ranged = tpl.ranged;
    magicDamage = tpl.magicDamage;

    // attackBonus scaled to match ~hero base atk at this level
    attackBonus = Math.max(1, Math.round((level * 1.6 + 3) * mult * v()));

    // Primary stat
    stats[tpl.primaryStat] = Math.max(1, Math.round(level * 1.4 * mult * v()));

    // Extra stats (excluding primary)
    const extraPool: (keyof Stats)[] = ['strength', 'dexterity', 'intelligence', 'vitality', 'magic']
      .filter(s => s !== tpl.primaryStat) as (keyof Stats)[];
    for (let i = 0; i < extraCount; i++) {
      const k = pick(extraPool, rng);
      stats[k] = (stats[k] ?? 0) + Math.max(1, Math.round(level * 0.7 * mult * v()));
    }

  } else {
    type NonWeaponSlot = keyof typeof SLOT_NAMES;
    const s = slot as NonWeaponSlot;
    const tplDef = SLOT_NAMES[s];
    name = `${prefix} ${pick(tplDef.names, rng)} ${suffix}`;
    emoji = tplDef.emoji;

    const defScale: Record<NonWeaponSlot, number> = { armor: 0.9, helmet: 0.45, boots: 0.35, ring: 0, amulet: 0 };
    if (defScale[s] > 0) {
      defenseBonus = Math.max(1, Math.round((level * defScale[s] + 1) * mult * v()));
    }

    const pool = SLOT_STATS[s];
    const primaryStat = pick(pool, rng);
    stats[primaryStat] = Math.max(1, Math.round(level * 1.2 * mult * v()));

    for (let i = 0; i < extraCount; i++) {
      const k = pick(pool, rng);
      stats[k] = (stats[k] ?? 0) + Math.max(1, Math.round(level * 0.65 * mult * v()));
    }
  }

  // Remove any zeroed stats
  for (const k of Object.keys(stats) as (keyof Stats)[]) {
    if (!stats[k]) delete stats[k];
  }

  return {
    id: genId(),
    name,
    slot,
    rarity,
    stats,
    ...(attackBonus  !== undefined && { attackBonus }),
    ...(defenseBonus !== undefined && { defenseBonus }),
    ...(ranged       !== undefined && { ranged }),
    ...(magicDamage  !== undefined && { magicDamage }),
    level: Math.max(1, level),
    goldValue: Math.max(5, Math.round(level * 14 * RARITY_GOLD[rarity])),
    emoji,
  };
}

// ── Shop generation (deterministic via seed) ──────────────────────────────────
const SHOP_WEIGHTS = {
  normal:   { common: 50, uncommon: 28, rare: 10, epic: 3, legendary: 0.5 },
  featured: { common: 20, uncommon: 30, rare: 28, epic: 15, legendary: 4  },
};

type RarityWeights = Record<Rarity, number>;

function rollRaritySeeded(weights: RarityWeights, rng: () => number): Rarity {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (const [k, w] of Object.entries(weights) as [Rarity, number][]) {
    r -= w; if (r <= 0) return k;
  }
  return 'common';
}

export function generateShopItems(
  heroLevel: number,
  seed: number,
): { item: Item; price: number; featured: boolean }[] {
  const rng = makeSRng(seed);
  const slots: ItemSlot[] = ['weapon', 'armor', 'helmet', 'boots', 'ring', 'amulet'];
  const result: { item: Item; price: number; featured: boolean }[] = [];

  for (let i = 0; i < 6; i++) {
    const featured = i === 5;
    const rarity = rollRaritySeeded(featured ? SHOP_WEIGHTS.featured : SHOP_WEIGHTS.normal, rng);
    const slot = pick(slots, rng);
    const levelOffset = Math.round((rng() - 0.5) * 6); // ±3
    const itemLevel = Math.max(1, heroLevel + levelOffset);
    const item = generateItem(itemLevel, rarity, slot, rng);
    const price = Math.round(item.goldValue * (1.2 + rng() * 0.6));
    result.push({ item, price, featured });
  }
  return result;
}
