import type { Item, Rarity } from '../types';

export const ALL_ITEMS: Item[] = [
  // ── Weapons: Energy Blades (Ostrza Energetyczne) ─────────────────────────
  { id: 'blade_vibro',      name: 'Wibro-Kling',                slot: 'weapon', rarity: 'common',    stats: { strength: 1 },                         attackBonus: 4,  level: 1,  goldValue: 22,    emoji: '⚡' },
  { id: 'blade_mono',       name: 'Mono-Kling',                 slot: 'weapon', rarity: 'common',    stats: { strength: 2 },                         attackBonus: 6,  level: 2,  goldValue: 32,    emoji: '⚡' },
  { id: 'blade_laser_edge', name: 'Laserowy Skalpel',           slot: 'weapon', rarity: 'uncommon',  stats: { strength: 3, dexterity: 2 },           attackBonus: 10, level: 4,  goldValue: 95,    emoji: '⚡' },
  { id: 'blade_plasma',     name: 'Plazmo-Kling',               slot: 'weapon', rarity: 'uncommon',  stats: { strength: 5 },                         attackBonus: 13, level: 5,  goldValue: 130,   emoji: '⚡' },
  { id: 'blade_quantum',    name: 'Kwanto-Kling X7',            slot: 'weapon', rarity: 'rare',      stats: { strength: 8, dexterity: 3 },           attackBonus: 23, level: 10, goldValue: 420,   emoji: '🗡️' },
  { id: 'blade_neuro',      name: 'Neuro-Kling',                slot: 'weapon', rarity: 'rare',      stats: { strength: 10, dexterity: 6 },          attackBonus: 28, level: 14, goldValue: 600,   emoji: '🗡️' },
  { id: 'blade_singularity',name: 'Ostrze Osobliwości',         slot: 'weapon', rarity: 'rare',      stats: { strength: 12, intelligence: 4 },       attackBonus: 34, level: 16, goldValue: 850,   emoji: '🗡️' },
  { id: 'blade_disruptor',  name: 'Dysruptor Cząsteczkowy',     slot: 'weapon', rarity: 'epic',      stats: { strength: 16, vitality: 5 },           attackBonus: 40, level: 18, goldValue: 1300,  emoji: '⚔️' },
  { id: 'blade_void',       name: 'Kling Pustki',               slot: 'weapon', rarity: 'epic',      stats: { strength: 22, intelligence: 8 },       attackBonus: 55, level: 24, goldValue: 2800,  emoji: '⚔️' },
  { id: 'blade_eclipse',    name: 'Eklipsa Binarna',            slot: 'weapon', rarity: 'epic',      stats: { strength: 25, dexterity: 12 },         attackBonus: 62, level: 28, goldValue: 4100,  emoji: '⚔️' },
  { id: 'blade_titan',      name: 'Tytano-Kling T9',            slot: 'weapon', rarity: 'legendary', stats: { strength: 28, dexterity: 10 },         attackBonus: 70, level: 30, goldValue: 5500,  emoji: '⚔️' },
  { id: 'blade_omega',      name: 'Omega-Kling Ω',              slot: 'weapon', rarity: 'legendary', stats: { strength: 35, intelligence: 15 },      attackBonus: 90, level: 40, goldValue: 12000, emoji: '⚔️' },
  { id: 'blade_supernova',  name: 'Rozbłysk Supernowej',        slot: 'weapon', rarity: 'legendary', stats: { strength: 45, dexterity: 20 },         attackBonus: 120,level: 50, goldValue: 25000, emoji: '🌟' },

  // ── Weapons: Heavy Rotary (Ciężka Artyleria) ─────────────────────────────
  { id: 'cannon_rotary',    name: 'Minigun MK-I',               slot: 'weapon', rarity: 'common',    stats: { strength: 3 },                         attackBonus: 7,  level: 2,  goldValue: 35,    emoji: '🔫' },
  { id: 'cannon_shredder',  name: 'Szatkownica S-10',           slot: 'weapon', rarity: 'uncommon',  stats: { strength: 6, vitality: 2 },            attackBonus: 12, level: 5,  goldValue: 110,   emoji: '🔫' },
  { id: 'cannon_gatling',   name: 'Gatling X-400',              slot: 'weapon', rarity: 'uncommon',  stats: { strength: 8 },                         attackBonus: 16, level: 7,  goldValue: 160,   emoji: '🔫' },
  { id: 'cannon_chain',     name: 'Działko Łańcuchowe',         slot: 'weapon', rarity: 'rare',      stats: { strength: 14, vitality: 4 },           attackBonus: 30, level: 14, goldValue: 550,   emoji: '🔫' },
  { id: 'cannon_vulcan',    name: 'Wulkan V-8',                 slot: 'weapon', rarity: 'rare',      stats: { strength: 18, vitality: 6 },           attackBonus: 38, level: 18, goldValue: 920,   emoji: '🔫' },
  { id: 'cannon_plasma',    name: 'Plazmo-Rotary',              slot: 'weapon', rarity: 'epic',      stats: { strength: 24, dexterity: -2 },         attackBonus: 52, level: 22, goldValue: 2200,  emoji: '🔫' },
  { id: 'cannon_fusion',    name: 'Działo Fuzyjne "Słońce"',    slot: 'weapon', rarity: 'legendary', stats: { strength: 40, vitality: 15 },          attackBonus: 105,level: 42, goldValue: 15000, emoji: '💥' },

  // ── Weapons: Shock & EMP (Bronie Paralizujące) ───────────────────────────
  { id: 'baton_shock',      name: 'Szok-Baton E1',              slot: 'weapon', rarity: 'common',    stats: { strength: 2, vitality: 1 },            attackBonus: 6,  level: 2,  goldValue: 30,    emoji: '⚡' },
  { id: 'baton_plasma',     name: 'Plazmo-Pałka',               slot: 'weapon', rarity: 'uncommon',  stats: { strength: 6, vitality: 3 },            attackBonus: 14, level: 7,  goldValue: 150,   emoji: '⚡' },
  { id: 'mace_gravity',     name: 'Buława Grawitacyjna',        slot: 'weapon', rarity: 'rare',      stats: { strength: 12, dexterity: -1 },         attackBonus: 28, level: 15, goldValue: 580,   emoji: '⚡' },
  { id: 'hammer_emp',       name: 'Młot EMP',                   slot: 'weapon', rarity: 'rare',      stats: { strength: 10, vitality: 8 },           attackBonus: 25, level: 13, goldValue: 480,   emoji: '⚡' },
  { id: 'hammer_thunder',   name: 'Piorunowy Młot MK-3',        slot: 'weapon', rarity: 'epic',      stats: { strength: 20, vitality: 10 },          attackBonus: 48, level: 20, goldValue: 2000,  emoji: '⚡' },
  { id: 'maul_storm',       name: 'Burzowy Pogromca',           slot: 'weapon', rarity: 'legendary', stats: { strength: 38, vitality: 20 },          attackBonus: 95, level: 38, goldValue: 11500, emoji: '⚡' },

  // ── Weapons: Electro-Pikes & Railguns ────────────────────────────────────
  { id: 'pike_electro',     name: 'Elektro-Pika',               slot: 'weapon', rarity: 'common',    stats: { dexterity: 2, strength: 1 },           attackBonus: 6,  level: 2,  goldValue: 28,    emoji: '🔱' },
  { id: 'lance_hyper',      name: 'Hiper-Lanca',                slot: 'weapon', rarity: 'uncommon',  stats: { dexterity: 5, strength: 4 },           attackBonus: 15, level: 8,  goldValue: 170,   emoji: '🔱' },
  { id: 'railgun_scout',    name: 'Lekki Railgun R1',           slot: 'weapon', rarity: 'rare',      stats: { dexterity: 10, intelligence: 5 },      attackBonus: 28, level: 12, goldValue: 490,   emoji: '🔱' },
  { id: 'railgun_heavy',    name: 'Railgun Ciężki',             slot: 'weapon', rarity: 'epic',      stats: { dexterity: 12, strength: 14 },         attackBonus: 46, level: 22, goldValue: 2100,  emoji: '🔱' },
  { id: 'railgun_orbital',  name: 'Orbitalny Przebijacz',       slot: 'weapon', rarity: 'legendary', stats: { dexterity: 30, intelligence: 20 },     attackBonus: 88, level: 36, goldValue: 9500,  emoji: '🛰️' },

  // ── Weapons: Mono-Knives & Nano-Daggers ──────────────────────────────────
  { id: 'knife_mono',       name: 'Mono-Nóż',                   slot: 'weapon', rarity: 'common',    stats: { dexterity: 3 },                        attackBonus: 6,  level: 1,  goldValue: 28,    emoji: '🔪' },
  { id: 'shiv_nano',        name: 'Nano-Sztylet',               slot: 'weapon', rarity: 'common',    stats: { dexterity: 4 },                        attackBonus: 8,  level: 4,  goldValue: 55,    emoji: '🔪' },
  { id: 'dagger_venom',     name: 'Sztylet Jadowity',           slot: 'weapon', rarity: 'uncommon',  stats: { dexterity: 7, intelligence: 2 },       attackBonus: 15, level: 8,  goldValue: 190,   emoji: '🔪' },
  { id: 'blade_stealth',    name: 'Klinga Cienia',              slot: 'weapon', rarity: 'rare',      stats: { dexterity: 10, strength: 4 },          attackBonus: 25, level: 11, goldValue: 430,   emoji: '🔪' },
  { id: 'knife_assassin',   name: 'Nóż Egzekutora',             slot: 'weapon', rarity: 'rare',      stats: { dexterity: 15, strength: 5 },          attackBonus: 32, level: 16, goldValue: 750,   emoji: '🔪' },
  { id: 'blade_neurotox',   name: 'Neuro-Toks Kling',           slot: 'weapon', rarity: 'epic',      stats: { dexterity: 22, strength: 8 },          attackBonus: 50, level: 23, goldValue: 2400,  emoji: '🔪' },
  { id: 'blade_ghost',      name: 'Ostrze Ducha',               slot: 'weapon', rarity: 'legendary', stats: { dexterity: 42, intelligence: 10 },     attackBonus: 95, level: 38, goldValue: 13000, emoji: '👻' },

  // ── Armor: Heavy (Egzoszkielety & Nano-Zbroje) ───────────────────────────
  { id: 'vest_ballistic',   name: 'Kamizelka Balistyczna',      slot: 'armor',  rarity: 'common',    stats: { vitality: 1 },                         defenseBonus: 3,  level: 1,  goldValue: 20,   emoji: '🦺' },
  { id: 'vest_tactical',    name: 'Kamizelka Taktyczna',        slot: 'armor',  rarity: 'common',    stats: { vitality: 2 },                         defenseBonus: 5,  level: 2,  goldValue: 38,   emoji: '🦺' },
  { id: 'vest_polymer',     name: 'Kamizelka Polimerowa',       slot: 'armor',  rarity: 'uncommon',  stats: { vitality: 5 },                         defenseBonus: 9,  level: 5,  goldValue: 110,  emoji: '🦺' },
  { id: 'suit_combat',      name: 'Kombinezon Bojowy',          slot: 'armor',  rarity: 'uncommon',  stats: { vitality: 7 },                         defenseBonus: 12, level: 6,  goldValue: 150,  emoji: '🦾' },
  { id: 'suit_nano',        name: 'Nano-Pancerz',               slot: 'armor',  rarity: 'uncommon',  stats: { vitality: 9, strength: 2 },            defenseBonus: 15, level: 8,  goldValue: 200,  emoji: '🦾' },
  { id: 'exo_scout',        name: 'Egzoszkielet Zwiadowcy',     slot: 'armor',  rarity: 'rare',      stats: { vitality: 11, dexterity: 4 },          defenseBonus: 18, level: 10, goldValue: 450,  emoji: '🦾' },
  { id: 'exo_light',        name: 'Egzoszkielet Lekki',         slot: 'armor',  rarity: 'rare',      stats: { vitality: 13, strength: 4 },           defenseBonus: 22, level: 11, goldValue: 520,  emoji: '🦾' },
  { id: 'exo_tactical',     name: 'Egzoszkielet Taktyczny',     slot: 'armor',  rarity: 'rare',      stats: { vitality: 16, strength: 5 },           defenseBonus: 28, level: 14, goldValue: 700,  emoji: '🦾' },
  { id: 'suit_stealth',     name: 'Kombinezon Cień',            slot: 'armor',  rarity: 'epic',      stats: { dexterity: 12, vitality: 10 },         defenseBonus: 30, level: 20, goldValue: 1600, emoji: '🦾' },
  { id: 'exo_heavy',        name: 'Egzoszkielet Ciężki',        slot: 'armor',  rarity: 'epic',      stats: { vitality: 22, strength: 8 },           defenseBonus: 42, level: 26, goldValue: 3500, emoji: '🦾' },
  { id: 'exo_juggernaut',   name: 'Pancerz Juggernauta',        slot: 'armor',  rarity: 'epic',      stats: { vitality: 30, strength: 10 },          defenseBonus: 55, level: 30, goldValue: 5000, emoji: '🦾' },
  { id: 'exo_titan',        name: 'Egzoszkielet Tytan',         slot: 'armor',  rarity: 'legendary', stats: { vitality: 35, strength: 12 },          defenseBonus: 60, level: 32, goldValue: 8000, emoji: '🦾' },
  { id: 'exo_god_war',      name: 'Ares-Proto v9',              slot: 'armor',  rarity: 'legendary', stats: { vitality: 50, strength: 20, dexterity: 10 }, defenseBonus: 95, level: 45, goldValue: 20000,emoji: '🛡️' },

  // ── Helmets (Wizjery & Implanty Głowy) ───────────────────────────────────
  { id: 'visor_basic',      name: 'Wizjer Bazowy',              slot: 'helmet', rarity: 'common',    stats: { vitality: 1 },                         defenseBonus: 2,  level: 1,  goldValue: 18,   emoji: '🥽' },
  { id: 'helmet_riot',      name: 'Hełm Prewencyjny',           slot: 'helmet', rarity: 'common',    stats: { vitality: 2, strength: 1 },            defenseBonus: 4,  level: 3,  goldValue: 42,   emoji: '⛑️' },
  { id: 'helmet_tactical',  name: 'Hełm Taktyczny',             slot: 'helmet', rarity: 'uncommon',  stats: { vitality: 5 },                         defenseBonus: 9,  level: 6,  goldValue: 100,  emoji: '⛑️' },
  { id: 'visor_thermal',    name: 'Wizjer Termiczny',           slot: 'helmet', rarity: 'uncommon',  stats: { intelligence: 4, vitality: 2 },        defenseBonus: 6,  level: 7,  goldValue: 140,  emoji: '🥽' },
  { id: 'helmet_titan',     name: 'Hełm Tytana',                slot: 'helmet', rarity: 'rare',      stats: { vitality: 12, strength: 4 },           defenseBonus: 18, level: 15, goldValue: 600,  emoji: '⛑️' },
  { id: 'helmet_crusader',  name: 'Cyber-Hełm Krzyżowca',       slot: 'helmet', rarity: 'epic',      stats: { vitality: 20, strength: 8 },           defenseBonus: 30, level: 25, goldValue: 2800, emoji: '⛑️' },

  // ── Boots (Cyber-Buty & Magnesy) ─────────────────────────────────────────
  { id: 'boots_urban',      name: 'Buty Uliczne',               slot: 'boots',  rarity: 'common',    stats: { dexterity: 1 },                        defenseBonus: 1,  level: 1,  goldValue: 14,   emoji: '👢' },
  { id: 'boots_neon',       name: 'Neonowe Trampki',            slot: 'boots',  rarity: 'common',    stats: { dexterity: 2, intelligence: 1 },       defenseBonus: 2,  level: 3,  goldValue: 35,   emoji: '👟' },
  { id: 'boots_tactical',   name: 'Buty Taktyczne',             slot: 'boots',  rarity: 'common',    stats: { dexterity: 2, vitality: 1 },           defenseBonus: 4,  level: 4,  goldValue: 50,   emoji: '👢' },
  { id: 'boots_gravity',    name: 'Buty Grawitacyjne',          slot: 'boots',  rarity: 'rare',      stats: { dexterity: 10, strength: 3 },          defenseBonus: 8,  level: 14, goldValue: 550,  emoji: '🦿' },
  { id: 'boots_warp',       name: 'Buty Warpowe',               slot: 'boots',  rarity: 'legendary', stats: { dexterity: 35, vitality: 10 },          defenseBonus: 25, level: 40, goldValue: 10000, emoji: '✨' },

  // ── Rings (Cyber-Implanty Rąk / Chipsety) ────────────────────────────────
  { id: 'implant_muscle',   name: 'Implant Mięśniowy',          slot: 'ring',   rarity: 'common',    stats: { strength: 1 },                                          level: 1,  goldValue: 12,   emoji: '💉' },
  { id: 'implant_nerve',    name: 'Splot Nerwowy',              slot: 'ring',   rarity: 'uncommon',  stats: { dexterity: 4, intelligence: 2 },                        level: 6,  goldValue: 130,  emoji: '💉' },
  { id: 'chip_overclock',   name: 'Chip Przetaktowania',        slot: 'ring',   rarity: 'rare',      stats: { intelligence: 12, vitality: -2 },                       level: 14, goldValue: 500,  emoji: '🔲' },
  { id: 'implant_dragon',   name: 'Serce Smoka (Cyber)',        slot: 'ring',   rarity: 'legendary', stats: { strength: 25, vitality: 25 },                          level: 45, goldValue: 18000, emoji: '🐉' },

  // ── Amulets (Rdzenie Danych & Wzmacniacze) ───────────────────────────────
  { id: 'core_basic',       name: 'Rdzeń Danych B-01',          slot: 'amulet', rarity: 'common',    stats: { vitality: 1 },                                          level: 1,  goldValue: 15,   emoji: '💾' },
  { id: 'core_stable',      name: 'Stabilny Rdzeń',             slot: 'amulet', rarity: 'common',    stats: { vitality: 2, intelligence: 1 },                         level: 3,  goldValue: 40,   emoji: '💾' },
  { id: 'pendant_led',      name: 'Wisior Neonowy',             slot: 'amulet', rarity: 'uncommon',  stats: { intelligence: 4, dexterity: 2 },                        level: 7,  goldValue: 145,  emoji: '📿' },
  { id: 'core_fusion',      name: 'Rdzeń Fuzyjny',              slot: 'amulet', rarity: 'rare',      stats: { vitality: 10, strength: 5 },                            level: 15, goldValue: 700,  emoji: '⚛️' },
  { id: 'core_quantum',     name: 'Rdzeń Kwantowy Q-9',         slot: 'amulet', rarity: 'epic',      stats: { intelligence: 25, vitality: 10 },                       level: 28, goldValue: 3200, emoji: '⚛️' },
  { id: 'amulet_void',      name: 'Amulet Pustki',              slot: 'amulet', rarity: 'legendary', stats: { strength: 15, dexterity: 15, intelligence: 15, vitality: 15 }, level: 45, goldValue: 20000, emoji: '🔮' },
];


export function getItemById(id: string): Item | undefined {
  return ALL_ITEMS.find(i => i.id === id);
}

function seededRand(seed: { v: number }): number {
  seed.v = (seed.v * 1664525 + 1013904223) & 0x7fffffff;
  return seed.v / 0x7fffffff;
}

const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

export function generateShopItems(level: number, seed: number): { item: Item; price: number; featured: boolean }[] {
  const rng = { v: seed };
  const rand = () => seededRand(rng);
  const used = new Set<string>();
  const result: { item: Item; price: number; featured: boolean }[] = [];

  function pickRarity(featured: boolean): Rarity {
    const r = rand();
    if (featured) {
      if (r < 0.02)  return 'legendary';
      if (r < 0.10)  return 'epic';
      if (r < 0.35)  return 'rare';
      if (r < 0.65)  return 'uncommon';
      return 'common';
    }
    if (r < 0.005) return 'legendary';
    if (r < 0.02)  return 'epic';
    if (r < 0.08)  return 'rare';
    if (r < 0.38)  return 'uncommon';
    return 'common';
  }

  function pickItem(targetRarity: Rarity): Item | null {
    const levelMin = Math.max(1, level - 4);
    const levelMax = level + 5;
    let pool = ALL_ITEMS.filter(i => !used.has(i.id) && i.level >= levelMin && i.level <= levelMax && i.rarity === targetRarity);

    if (pool.length === 0) {
      const idx = RARITY_ORDER.indexOf(targetRarity);
      for (const delta of [1, -1, 2, -2]) {
        const alt = RARITY_ORDER[idx + delta];
        if (!alt) continue;
        pool = ALL_ITEMS.filter(i => !used.has(i.id) && i.level >= levelMin && i.level <= levelMax && i.rarity === alt);
        if (pool.length > 0) break;
      }
    }
    if (pool.length === 0) return null;
    return pool[Math.floor(rand() * pool.length)];
  }

  const SLOT_COUNT = 6;
  for (let i = 0; i < SLOT_COUNT; i++) {
    const featured = i === SLOT_COUNT - 1;
    const rarity = pickRarity(featured);
    const item = pickItem(rarity);
    if (!item) continue;
    used.add(item.id);
    const markup = 1.3 + rand() * 0.4;
    result.push({ item, price: Math.round(item.goldValue * markup), featured });
  }
  return result;
}
