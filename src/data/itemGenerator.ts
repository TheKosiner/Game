import type { Item, ItemSlot, Rarity, Stats } from '../types';
import { ITEM_NAMES_EN, } from './itemNames';
import { MEDKIT } from './items';
import type { Lang } from '../store/langStore';

export function getItemName(item: Item, lang: Lang): string {
  if (lang !== 'en') return item.name;
  if (item.nameEn) return item.nameEn;
  return ITEM_NAMES_EN[item.id] ?? item.name;
}

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

const PREFIX_EN: Record<Rarity, string[]> = {
  common:    ['Worn', 'Old', 'Basic', 'Standard', 'Cheap', 'Battered'],
  uncommon:  ['Solid', 'Reinforced', 'Reliable', 'Improved', 'Sturdy'],
  rare:      ['Advanced', 'Modified', 'Precise', 'Enhanced', 'Augmented'],
  epic:      ['Elite', 'Masterwork', 'Flawless', 'Unmatched', 'Mystic'],
  legendary: ['Mythic', 'Divine', 'Cosmic', 'Transcendent', 'Absolute'],
};

const SUFFIX_EN = [
  'of Strength', 'of Shadow', 'of Storm', 'of Lightning', 'of Blood', 'of Fire', 'of Ice',
  'of the Void', 'of Chaos', 'of Fate', 'of Destruction', 'of Glory', 'of Doom',
];

const WEAPON_NAMES_EN: string[][] = [
  ['Sword', 'Blade', 'Axe', 'Saber'],
  ['Dagger', 'Knife', 'Mono-Knife', 'Razor'],
  ['Rifle', 'Shotgun', 'Cannon', 'Assault Rifle'],
  ['Electro-Pike', 'Lance', 'Harpoon', 'Spear'],
  ['Wand', 'Staff', 'Scepter', 'Power Crystal'],
  ['Nano-Dagger', 'Bio-Blade', 'Plasma Cutter'],
  ['Sniper Rifle', 'Precision Rifle', 'Long Rifle'],
  ['Cyber-Bat', 'Club', 'Baton'],
  ['Pistol', 'Blaster', 'Plasma Pistol', 'Disintegrator'],
  ['Battle Axe', 'Cleaver', 'Plasma Axe', 'Nano-Axe'],
  ['Energy Whip', 'Arc Whip', 'Neural Lash'],
  ['Grenade Launcher', 'Frag Launcher', 'Void Launcher', 'Cluster Gun'],
  ['Energy Bow', 'Pulse Bow', 'Quantum Bow', 'Plasma Bow'],
  ['Flamethrower', 'Plasma Flamer', 'Acid Sprayer', 'Void Burner'],
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
  // ── Melee ──────────────────────────────────────────────────────────────────
  { names: ['Miecz', 'Ostrze', 'Klinga', 'Szabla'],           emoji: '⚔',  primaryStat: 'strength' },
  { names: ['Sztylet', 'Nóż', 'Mono-Nóż', 'Żyletka'],        emoji: '🔪', primaryStat: 'dexterity' },
  { names: ['Nano-Sztylet', 'Bio-Ostrze', 'Plazmak'],         emoji: '⚡', primaryStat: 'intelligence' },
  { names: ['Cyber-Bat', 'Pałka', 'Buława'],                   emoji: '🪃', primaryStat: 'strength' },
  { names: ['Siekiera Bojowa', 'Tasak', 'Plazmo-Siekiera', 'Nano-Siekiera'], emoji: '🪓', primaryStat: 'strength' },
  { names: ['Bicz Energii', 'Łuk Łańcuchowy', 'Neuro-Bat'],   emoji: '〰',  primaryStat: 'dexterity' },
  // ── Ranged ─────────────────────────────────────────────────────────────────
  { names: ['Karabin', 'Strzelba', 'Działko', 'Karabin Szturmowy'], emoji: '🔫', ranged: true, primaryStat: 'dexterity' },
  { names: ['Pistolet', 'Blaster', 'Plazmo-Pistolet', 'Dezyntegrator'], emoji: '💢', ranged: true, primaryStat: 'dexterity' },
  { names: ['Snajperka', 'Karabin Precyzyjny', 'Karabin Dalekiego Zasięgu'], emoji: '🎯', ranged: true, primaryStat: 'intelligence' },
  { names: ['Elektro-Pika', 'Lance', 'Harpun', 'Oszczep'],    emoji: '🔱', ranged: true, primaryStat: 'strength' },
  { names: ['Granatnik', 'Wyrzutnia Odłamkowa', 'Wyrzutnia Próżniowa', 'Strzelec Klastrowy'], emoji: '💥', ranged: true, primaryStat: 'strength' },
  { names: ['Łuk Energetyczny', 'Łuk Plazmowy', 'Łuk Kwantowy', 'Łuk Impulsowy'], emoji: '🏹', ranged: true, primaryStat: 'dexterity' },
  // ── Magic / Hybrid ─────────────────────────────────────────────────────────
  { names: ['Różdżka', 'Laska', 'Berło', 'Kryształ Mocy'],   emoji: '🔮', magicDamage: true, primaryStat: 'magic' },
  { names: ['Miotacz Ognia', 'Plazmo-Miotacz', 'Rozpylacz Kwasowy', 'Spopielacz'], emoji: '🔥', ranged: true, magicDamage: true, primaryStat: 'magic' },
];

// ── Slot templates (name → primaryStat, replaces SLOT_NAMES + SLOT_STATS) ────
interface SlotTemplate {
  name: string;
  nameEn: string;
  primaryStat: keyof Stats;
  /** extra stat pool — always includes primaryStat */
  extraPool: (keyof Stats)[];
  defScale?: number; // defence bonus multiplier (armor/helmet/boots)
  emoji: string;
}

const SLOT_TEMPLATES: Record<Exclude<ItemSlot, 'weapon' | 'consumable' | 'mystery_box'>, SlotTemplate[]> = {
  armor: [
    { name: 'Pancerz Siły',        nameEn: 'Strength Armor',     primaryStat: 'strength',        extraPool: ['strength','vitality','dexterity','magicResistance'],      defScale: 0.9, emoji: '🦺' },
    { name: 'Zbroja Witalności',   nameEn: 'Vitality Armor',     primaryStat: 'vitality',        extraPool: ['vitality','strength','magicResistance','dexterity'],       defScale: 0.9, emoji: '🦺' },
    { name: 'Pancerz Odporności',  nameEn: 'Resistance Armor',   primaryStat: 'magicResistance', extraPool: ['magicResistance','vitality','magic','strength'],            defScale: 0.9, emoji: '🦺' },
    { name: 'Kombinezon Zręczności',nameEn: 'Agility Suit',      primaryStat: 'dexterity',       extraPool: ['dexterity','vitality','strength','intelligence'],           defScale: 0.9, emoji: '🦺' },
    { name: 'Egzoszkielet Magii',  nameEn: 'Magic Exosuit',      primaryStat: 'magic',           extraPool: ['magic','intelligence','vitality','magicResistance'],        defScale: 0.9, emoji: '🦺' },
  ],
  helmet: [
    { name: 'Hełm Celności',       nameEn: 'Accuracy Helmet',    primaryStat: 'intelligence',    extraPool: ['intelligence','dexterity','vitality','magic'],             defScale: 0.45, emoji: '⛑' },
    { name: 'Hełm Witalności',     nameEn: 'Vitality Helmet',    primaryStat: 'vitality',        extraPool: ['vitality','intelligence','magicResistance','strength'],     defScale: 0.45, emoji: '⛑' },
    { name: 'Hełm Odporności',     nameEn: 'Resistance Helmet',  primaryStat: 'magicResistance', extraPool: ['magicResistance','vitality','magic','intelligence'],        defScale: 0.45, emoji: '⛑' },
    { name: 'Hełm Magii',          nameEn: 'Magic Helmet',       primaryStat: 'magic',           extraPool: ['magic','intelligence','vitality','magicResistance'],        defScale: 0.45, emoji: '⛑' },
    { name: 'Maska Zręczności',    nameEn: 'Agility Mask',       primaryStat: 'dexterity',       extraPool: ['dexterity','intelligence','vitality','strength'],           defScale: 0.45, emoji: '⛑' },
  ],
  boots: [
    { name: 'Buty Zręczności',     nameEn: 'Agility Boots',      primaryStat: 'dexterity',       extraPool: ['dexterity','strength','vitality','intelligence'],           defScale: 0.35, emoji: '👟' },
    { name: 'Buty Siły',           nameEn: 'Strength Boots',     primaryStat: 'strength',        extraPool: ['strength','dexterity','vitality','intelligence'],           defScale: 0.35, emoji: '👟' },
    { name: 'Buty Witalności',     nameEn: 'Vitality Boots',     primaryStat: 'vitality',        extraPool: ['vitality','dexterity','strength','magicResistance'],        defScale: 0.35, emoji: '👟' },
    { name: 'Buty Celności',       nameEn: 'Accuracy Boots',     primaryStat: 'intelligence',    extraPool: ['intelligence','dexterity','vitality','magic'],             defScale: 0.35, emoji: '👟' },
  ],
  ring: [
    { name: 'Rdzeń Siły',          nameEn: 'Strength Core',      primaryStat: 'strength',        extraPool: ['strength','vitality','dexterity','intelligence','magic'],  emoji: '💉' },
    { name: 'Rdzeń Zręczności',    nameEn: 'Dexterity Core',     primaryStat: 'dexterity',       extraPool: ['dexterity','intelligence','strength','vitality','magic'],   emoji: '💉' },
    { name: 'Rdzeń Celności',      nameEn: 'Accuracy Core',      primaryStat: 'intelligence',    extraPool: ['intelligence','dexterity','vitality','magic','strength'],   emoji: '💉' },
    { name: 'Rdzeń Witalności',    nameEn: 'Vitality Core',      primaryStat: 'vitality',        extraPool: ['vitality','strength','intelligence','dexterity','magic'],   emoji: '💉' },
    { name: 'Rdzeń Magii',         nameEn: 'Magic Core',         primaryStat: 'magic',           extraPool: ['magic','intelligence','vitality','strength','dexterity'],   emoji: '💉' },
    { name: 'Implant Refleksów',   nameEn: 'Reflex Implant',     primaryStat: 'dexterity',       extraPool: ['dexterity','strength','intelligence','vitality'],           emoji: '💉' },
    { name: 'Chip Siły',           nameEn: 'Strength Chip',      primaryStat: 'strength',        extraPool: ['strength','vitality','dexterity'],                         emoji: '💉' },
    { name: 'Moduł Celności',      nameEn: 'Accuracy Module',    primaryStat: 'intelligence',    extraPool: ['intelligence','magic','dexterity'],                        emoji: '💉' },
    { name: 'Procesor Witalności', nameEn: 'Vitality Processor', primaryStat: 'vitality',        extraPool: ['vitality','strength','magicResistance'],                   emoji: '💉' },
    { name: 'Procesor Magii',      nameEn: 'Magic Processor',    primaryStat: 'magic',           extraPool: ['magic','intelligence','vitality'],                         emoji: '💉' },
  ],
  amulet: [
    { name: 'Kryształ Magii',      nameEn: 'Magic Crystal',      primaryStat: 'magic',           extraPool: ['magic','intelligence','vitality','magicResistance'],        emoji: '📿' },
    { name: 'Wzmacniacz Siły',     nameEn: 'Strength Amplifier', primaryStat: 'strength',        extraPool: ['strength','vitality','dexterity','magic'],                 emoji: '📿' },
    { name: 'Nadajnik Celności',   nameEn: 'Accuracy Transmitter',primaryStat: 'intelligence',   extraPool: ['intelligence','magic','dexterity','vitality'],             emoji: '📿' },
    { name: 'Węzeł Witalności',    nameEn: 'Vitality Node',      primaryStat: 'vitality',        extraPool: ['vitality','strength','magicResistance','intelligence'],     emoji: '📿' },
    { name: 'Rdzeń Odporności',    nameEn: 'Resistance Core',    primaryStat: 'magicResistance', extraPool: ['magicResistance','vitality','magic','intelligence'],        emoji: '📿' },
    { name: 'Kryształ Zręczności', nameEn: 'Dexterity Crystal',  primaryStat: 'dexterity',       extraPool: ['dexterity','intelligence','strength','vitality'],           emoji: '📿' },
  ],
};

// ── Core generator ────────────────────────────────────────────────────────────
export function generateItem(
  level: number,
  rarity: Rarity,
  slotHint?: ItemSlot,
  rngIn?: () => number,
): Item {
  const rng = rngIn ?? (() => Math.random());
  const slots: ItemSlot[] = ['weapon', 'armor', 'helmet', 'boots', 'ring', 'amulet'];
  const slot: ItemSlot = slotHint && slotHint !== 'consumable' ? slotHint : pick(slots, rng);

  const mult = RARITY_MULT[rarity];
  const [minE, maxE] = RARITY_EXTRA[rarity];
  const extraCount = rollInt(minE, maxE, rng);
  const v = () => 0.82 + rng() * 0.36; // variance 0.82–1.18

  const prefixIdx = Math.floor(rng() * PREFIX[rarity].length);
  const prefix    = PREFIX[rarity][prefixIdx];
  const suffixIdx = Math.floor(rng() * SUFFIX.length);
  const suffix    = SUFFIX[suffixIdx];

  let name: string;
  let nameEn: string | undefined;
  let emoji: string;
  let attackBonus: number | undefined;
  let defenseBonus: number | undefined;
  let ranged: true | undefined;
  let magicDamage: true | undefined;
  const stats: Partial<Stats> = {};

  if (slot === 'weapon') {
    const tplIdx    = Math.floor(rng() * WEAPON_TEMPLATES.length);
    const tpl       = WEAPON_TEMPLATES[tplIdx];
    const nameIdx   = Math.floor(rng() * tpl.names.length);
    name   = `${prefix} ${tpl.names[nameIdx]} ${suffix}`;
    nameEn = `${PREFIX_EN[rarity][prefixIdx]} ${WEAPON_NAMES_EN[tplIdx][nameIdx]} ${SUFFIX_EN[suffixIdx]}`;
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
    type NonWeaponSlot = keyof typeof SLOT_TEMPLATES;
    const s   = slot as NonWeaponSlot;
    const tpl = pick(SLOT_TEMPLATES[s], rng);

    name   = `${prefix} ${tpl.name} ${suffix}`;
    nameEn = `${PREFIX_EN[rarity][prefixIdx]} ${tpl.nameEn} ${SUFFIX_EN[suffixIdx]}`;
    emoji  = tpl.emoji;

    // Defense bonus only for armor/helmet/boots
    if (tpl.defScale && tpl.defScale > 0) {
      defenseBonus = Math.max(1, Math.round((level * tpl.defScale + 1) * mult * v()));
    }

    // Primary stat — always the one implied by the template name
    stats[tpl.primaryStat] = Math.max(1, Math.round(level * 1.2 * mult * v()));

    // Extra stats drawn from the template's own pool (excludes primaryStat duplication)
    const extraPool = tpl.extraPool.filter(s => s !== tpl.primaryStat);
    for (let i = 0; i < extraCount; i++) {
      const k = pick(extraPool, rng);
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
    nameEn,
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
  result.push({ item: MEDKIT, price: heroLevel * 100, featured: false });
  return result;
}
