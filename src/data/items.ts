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
  { id: 'cannon_rotary',    name: 'Minigun MK-I',               slot: 'weapon', rarity: 'common',    stats: { strength: 3 },                         attackBonus: 7,  level: 2,  goldValue: 35,    emoji: '🔫', ranged: true },
  { id: 'cannon_shredder',  name: 'Szatkownica S-10',           slot: 'weapon', rarity: 'uncommon',  stats: { strength: 6, vitality: 2 },            attackBonus: 12, level: 5,  goldValue: 110,   emoji: '🔫', ranged: true },
  { id: 'cannon_gatling',   name: 'Gatling X-400',              slot: 'weapon', rarity: 'uncommon',  stats: { strength: 8 },                         attackBonus: 16, level: 7,  goldValue: 160,   emoji: '🔫', ranged: true },
  { id: 'cannon_chain',     name: 'Działko Łańcuchowe',         slot: 'weapon', rarity: 'rare',      stats: { strength: 14, vitality: 4 },           attackBonus: 30, level: 14, goldValue: 550,   emoji: '🔫', ranged: true },
  { id: 'cannon_vulcan',    name: 'Wulkan V-8',                 slot: 'weapon', rarity: 'rare',      stats: { strength: 18, vitality: 6 },           attackBonus: 38, level: 18, goldValue: 920,   emoji: '🔫', ranged: true },
  { id: 'cannon_plasma',    name: 'Plazmo-Rotary',              slot: 'weapon', rarity: 'epic',      stats: { strength: 24, dexterity: -2 },         attackBonus: 52, level: 22, goldValue: 2200,  emoji: '🔫', ranged: true },
  { id: 'cannon_fusion',    name: 'Działo Fuzyjne "Słońce"',    slot: 'weapon', rarity: 'legendary', stats: { strength: 40, vitality: 15 },          attackBonus: 105,level: 42, goldValue: 15000, emoji: '💥', ranged: true },

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
  { id: 'railgun_scout',    name: 'Lekki Railgun R1',           slot: 'weapon', rarity: 'rare',      stats: { dexterity: 10, intelligence: 5 },      attackBonus: 28, level: 12, goldValue: 490,   emoji: '🔱', ranged: true },
  { id: 'railgun_heavy',    name: 'Railgun Ciężki',             slot: 'weapon', rarity: 'epic',      stats: { dexterity: 12, strength: 14 },         attackBonus: 46, level: 22, goldValue: 2100,  emoji: '🔱', ranged: true },
  { id: 'railgun_orbital',  name: 'Orbitalny Przebijacz',       slot: 'weapon', rarity: 'legendary', stats: { dexterity: 30, intelligence: 20 },     attackBonus: 88, level: 36, goldValue: 9500,  emoji: '🛰️', ranged: true },

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

  // ════════════════════════════════════════════════════════════════════════════
  // NEW ITEMS — expanded variety
  // ════════════════════════════════════════════════════════════════════════════

  // ── NEW Weapons: Plasma Pistols (ranged, Celność) ─────────────────────────
  { id: 'pistol_nano',        name: 'Nano-Pistolet N1',          slot: 'weapon', rarity: 'common',    stats: { intelligence: 2 },                     attackBonus: 5,  level: 2,  goldValue: 28,    emoji: '🔫', ranged: true },
  { id: 'pistol_plasma',      name: 'Pistolet Plazmowy',         slot: 'weapon', rarity: 'uncommon',  stats: { intelligence: 5, dexterity: 2 },       attackBonus: 11, level: 5,  goldValue: 120,   emoji: '🔫', ranged: true },
  { id: 'pistol_pulse',       name: 'Pulsator Fotoniczny',       slot: 'weapon', rarity: 'rare',      stats: { intelligence: 9, dexterity: 4 },       attackBonus: 26, level: 11, goldValue: 510,   emoji: '🔫', ranged: true },
  { id: 'pistol_quantum',     name: 'Kwantowy Rewolwer',         slot: 'weapon', rarity: 'epic',      stats: { intelligence: 18, dexterity: 8 },      attackBonus: 48, level: 21, goldValue: 2100,  emoji: '🔫', ranged: true },
  { id: 'pistol_antimatter',  name: 'Antymateria MK-X',          slot: 'weapon', rarity: 'legendary', stats: { intelligence: 35, dexterity: 15 },     attackBonus: 88, level: 35, goldValue: 9800,  emoji: '💥', ranged: true },

  // ── NEW Weapons: Sniper Rifles (ranged, Celność + Zręczność) ─────────────
  { id: 'rifle_laser',        name: 'Karabin Laserowy LR-1',     slot: 'weapon', rarity: 'common',    stats: { intelligence: 3 },                     attackBonus: 8,  level: 3,  goldValue: 40,    emoji: '🎯', ranged: true },
  { id: 'rifle_precision',    name: 'Precyzyjny Karabin P-50',   slot: 'weapon', rarity: 'uncommon',  stats: { intelligence: 6, dexterity: 3 },       attackBonus: 14, level: 6,  goldValue: 155,   emoji: '🎯', ranged: true },
  { id: 'rifle_antimaterial', name: 'Karabin Anty-Materiał',     slot: 'weapon', rarity: 'rare',      stats: { intelligence: 10, dexterity: 6 },      attackBonus: 29, level: 13, goldValue: 540,   emoji: '🎯', ranged: true },
  { id: 'rifle_plasma_sniper',name: 'Plazmowy Snajper PS-7',     slot: 'weapon', rarity: 'epic',      stats: { intelligence: 20, dexterity: 10 },     attackBonus: 54, level: 23, goldValue: 2500,  emoji: '🎯', ranged: true },
  { id: 'rifle_orbital',      name: 'Orbitalny Snajper O-99',    slot: 'weapon', rarity: 'legendary', stats: { intelligence: 38, dexterity: 18 },     attackBonus: 95, level: 38, goldValue: 11000, emoji: '🛰️', ranged: true },

  // ── NEW Weapons: Cyber Whips (Cyberwici) — Zręczność + Celność ───────────
  { id: 'whip_electro',       name: 'Elektro-Bicz E1',           slot: 'weapon', rarity: 'common',    stats: { dexterity: 2, intelligence: 1 },       attackBonus: 5,  level: 2,  goldValue: 25,    emoji: '⚡' },
  { id: 'whip_nano',          name: 'Nano-Smagacz',              slot: 'weapon', rarity: 'uncommon',  stats: { dexterity: 6, intelligence: 3 },       attackBonus: 13, level: 6,  goldValue: 145,   emoji: '⚡' },
  { id: 'whip_neural',        name: 'Neurobicz MK-2',            slot: 'weapon', rarity: 'rare',      stats: { dexterity: 11, intelligence: 6 },      attackBonus: 27, level: 12, goldValue: 520,   emoji: '⚡' },
  { id: 'whip_void',          name: 'Bicz Próżni',               slot: 'weapon', rarity: 'epic',      stats: { dexterity: 18, intelligence: 12 },     attackBonus: 45, level: 21, goldValue: 2000,  emoji: '⚡' },
  { id: 'whip_omega',         name: 'Omega-Smagacz Ω',           slot: 'weapon', rarity: 'legendary', stats: { dexterity: 32, intelligence: 22 },     attackBonus: 85, level: 37, goldValue: 10000, emoji: '⚡' },

  // ── NEW Weapons: Heavy Axes & Cleavers — Siła + Żywotność ────────────────
  { id: 'axe_plasma',         name: 'Plazmo-Topór A1',           slot: 'weapon', rarity: 'common',    stats: { strength: 3, vitality: 1 },            attackBonus: 7,  level: 3,  goldValue: 38,    emoji: '⚔️' },
  { id: 'axe_gravity',        name: 'Topór Grawitacyjny',        slot: 'weapon', rarity: 'uncommon',  stats: { strength: 7, vitality: 3 },            attackBonus: 15, level: 7,  goldValue: 165,   emoji: '⚔️' },
  { id: 'axe_tungsten',       name: 'Wolfram-Halabarda',         slot: 'weapon', rarity: 'rare',      stats: { strength: 13, vitality: 6 },           attackBonus: 31, level: 13, goldValue: 580,   emoji: '⚔️' },
  { id: 'cleaver_titan',      name: 'Tasak Tytanowy',            slot: 'weapon', rarity: 'epic',      stats: { strength: 21, vitality: 12 },          attackBonus: 50, level: 22, goldValue: 2300,  emoji: '⚔️' },
  { id: 'axe_executioner',    name: 'Topór Egzekutora',          slot: 'weapon', rarity: 'legendary', stats: { strength: 40, vitality: 18 },          attackBonus: 100,level: 40, goldValue: 13500, emoji: '⚔️' },

  // ── NEW Weapons: Neural Lances — Siła + Celność ───────────────────────────
  { id: 'lance_shock',        name: 'Wstrząso-Lanca',            slot: 'weapon', rarity: 'uncommon',  stats: { strength: 4, intelligence: 4 },        attackBonus: 14, level: 6,  goldValue: 150,   emoji: '🔱' },
  { id: 'lance_neural',       name: 'Neuro-Lanca NL-3',          slot: 'weapon', rarity: 'rare',      stats: { strength: 9, intelligence: 8 },        attackBonus: 27, level: 11, goldValue: 470,   emoji: '🔱' },
  { id: 'lance_void',         name: 'Lanca Próżni',              slot: 'weapon', rarity: 'epic',      stats: { strength: 18, intelligence: 14 },      attackBonus: 47, level: 22, goldValue: 2200,  emoji: '🔱' },
  { id: 'lance_omega',        name: 'Omega-Lanca Ω',             slot: 'weapon', rarity: 'legendary', stats: { strength: 32, intelligence: 25 },      attackBonus: 92, level: 37, goldValue: 10500, emoji: '🌟' },

  // ── NEW Weapons: Bio Blades — Zręczność + Żywotność ──────────────────────
  { id: 'bio_shard',          name: 'Bio-Odłamek',               slot: 'weapon', rarity: 'common',    stats: { dexterity: 2, vitality: 1 },           attackBonus: 5,  level: 2,  goldValue: 26,    emoji: '🔪' },
  { id: 'bio_fang',           name: 'Bio-Kieł MK-2',             slot: 'weapon', rarity: 'uncommon',  stats: { dexterity: 6, vitality: 3 },           attackBonus: 13, level: 7,  goldValue: 155,   emoji: '🔪' },
  { id: 'bio_claw',           name: 'Cyber-Pazur',               slot: 'weapon', rarity: 'rare',      stats: { dexterity: 12, vitality: 5 },          attackBonus: 28, level: 12, goldValue: 500,   emoji: '🔪' },
  { id: 'bio_venom',          name: 'Ostrze Jadowe V-9',         slot: 'weapon', rarity: 'epic',      stats: { dexterity: 20, vitality: 10 },         attackBonus: 48, level: 22, goldValue: 2100,  emoji: '🔪' },
  { id: 'bio_leviathan',      name: 'Lewiatan Bio-X',            slot: 'weapon', rarity: 'legendary', stats: { dexterity: 35, vitality: 20 },         attackBonus: 90, level: 38, goldValue: 12000, emoji: '👻' },

  // ── NEW Weapons: Plasma Cutters — Siła + Celność ──────────────────────────
  { id: 'cutter_plasma',      name: 'Cęgi Plazmowe C1',          slot: 'weapon', rarity: 'common',    stats: { strength: 2, intelligence: 1 },        attackBonus: 5,  level: 2,  goldValue: 26,    emoji: '⚡' },
  { id: 'cutter_fusion',      name: 'Nożyce Fuzyjne',            slot: 'weapon', rarity: 'uncommon',  stats: { strength: 5, intelligence: 4 },        attackBonus: 13, level: 6,  goldValue: 148,   emoji: '⚡' },
  { id: 'cutter_quantum',     name: 'Cęgi Kwantowe Q-5',         slot: 'weapon', rarity: 'rare',      stats: { strength: 10, intelligence: 8 },       attackBonus: 27, level: 13, goldValue: 530,   emoji: '⚡' },
  { id: 'cutter_void',        name: 'Plazmo-Kamaster',           slot: 'weapon', rarity: 'epic',      stats: { strength: 17, intelligence: 15 },      attackBonus: 47, level: 23, goldValue: 2200,  emoji: '⚔️' },
  { id: 'cutter_supernova',   name: 'Supernowa Tnąca',           slot: 'weapon', rarity: 'legendary', stats: { strength: 30, intelligence: 28 },      attackBonus: 90, level: 38, goldValue: 11500, emoji: '🌟' },

  // ── NEW Armor: Stealth (Zręczność + Żywotność) ────────────────────────────
  { id: 'suit_phantom',       name: 'Kombinezon Fantom',         slot: 'armor',  rarity: 'uncommon',  stats: { dexterity: 5, vitality: 4 },           defenseBonus: 11, level: 6,  goldValue: 145,  emoji: '🦾' },
  { id: 'exo_shadow',         name: 'Egzoszkielet Cień',         slot: 'armor',  rarity: 'rare',      stats: { dexterity: 8, vitality: 12 },          defenseBonus: 20, level: 12, goldValue: 480,  emoji: '🦾' },
  { id: 'suit_infiltrator',   name: 'Pancerz Infiltratora',      slot: 'armor',  rarity: 'epic',      stats: { dexterity: 16, vitality: 18 },         defenseBonus: 38, level: 22, goldValue: 2800, emoji: '🦾' },
  { id: 'exo_ghost',          name: 'Egzoszkielet Duch',         slot: 'armor',  rarity: 'legendary', stats: { dexterity: 28, vitality: 30 },         defenseBonus: 65, level: 35, goldValue: 9000, emoji: '🛡️' },

  // ── NEW Armor: Netrunner (Celność + Żywotność) ────────────────────────────
  { id: 'suit_netrunner',     name: 'Kombinezon Netrunnera',     slot: 'armor',  rarity: 'uncommon',  stats: { intelligence: 6, vitality: 3 },        defenseBonus: 8,  level: 7,  goldValue: 155,  emoji: '🦾' },
  { id: 'exo_analyst',        name: 'Egzoszkielet Analityka',    slot: 'armor',  rarity: 'rare',      stats: { intelligence: 10, vitality: 10 },      defenseBonus: 18, level: 14, goldValue: 620,  emoji: '🦾' },
  { id: 'suit_cyborg',        name: 'Pancerz Cyborga',           slot: 'armor',  rarity: 'epic',      stats: { intelligence: 18, vitality: 16 },      defenseBonus: 35, level: 24, goldValue: 3000, emoji: '🦾' },

  // ── NEW Armor: Balanced (Siła + Żywotność + Zręczność) ───────────────────
  { id: 'suit_chrome',        name: 'Chromowy Kombinezon',       slot: 'armor',  rarity: 'rare',      stats: { strength: 6, vitality: 10 },           defenseBonus: 22, level: 12, goldValue: 500,  emoji: '🦾' },
  { id: 'exo_dreadnought',    name: 'Pancerz Dreadnought',       slot: 'armor',  rarity: 'epic',      stats: { strength: 14, vitality: 25 },          defenseBonus: 50, level: 28, goldValue: 4500, emoji: '🦾' },
  { id: 'exo_nemesis',        name: 'Egzoszkielet Nemezis',      slot: 'armor',  rarity: 'legendary', stats: { strength: 18, dexterity: 12, vitality: 25 }, defenseBonus: 80, level: 42, goldValue: 17000, emoji: '🛡️' },

  // ── NEW Helmets: Reflex (Zręczność) ──────────────────────────────────────
  { id: 'visor_reflex',       name: 'Wizjer Refleksów',          slot: 'helmet', rarity: 'uncommon',  stats: { dexterity: 5, vitality: 1 },           defenseBonus: 7,  level: 6,  goldValue: 115,  emoji: '🥽' },
  { id: 'helmet_scout',       name: 'Hełm Zwiadowcy',            slot: 'helmet', rarity: 'rare',      stats: { dexterity: 9, vitality: 5 },           defenseBonus: 15, level: 12, goldValue: 520,  emoji: '⛑️' },
  { id: 'helmet_phantom',     name: 'Hełm Fantoma',              slot: 'helmet', rarity: 'epic',      stats: { dexterity: 16, vitality: 12 },         defenseBonus: 26, level: 24, goldValue: 2600, emoji: '⛑️' },

  // ── NEW Helmets: Targeting (Celność) ─────────────────────────────────────
  { id: 'visor_targeting',    name: 'Wizjer Celowniczy',         slot: 'helmet', rarity: 'rare',      stats: { intelligence: 10, vitality: 4 },       defenseBonus: 12, level: 14, goldValue: 580,  emoji: '🥽' },
  { id: 'helmet_neural',      name: 'Hełm Neuronowy',            slot: 'helmet', rarity: 'epic',      stats: { intelligence: 22, vitality: 8 },       defenseBonus: 22, level: 26, goldValue: 3000, emoji: '🥽' },
  { id: 'helmet_oracle',      name: 'Hełm Wyroczni',             slot: 'helmet', rarity: 'legendary', stats: { intelligence: 30, dexterity: 12 },     defenseBonus: 38, level: 35, goldValue: 8500, emoji: '🥽' },

  // ── NEW Helmets: Berserker (Siła + Żywotność) ────────────────────────────
  { id: 'helmet_berserker',   name: 'Hełm Berserkera',           slot: 'helmet', rarity: 'rare',      stats: { strength: 8, vitality: 8 },            defenseBonus: 18, level: 15, goldValue: 640,  emoji: '⛑️' },
  { id: 'helmet_warlord',     name: 'Hełm Warlorda',             slot: 'helmet', rarity: 'legendary', stats: { strength: 20, vitality: 20 },          defenseBonus: 42, level: 40, goldValue: 12000,emoji: '⛑️' },

  // ── NEW Boots: Targeting (Celność + Zręczność) ───────────────────────────
  { id: 'boots_sniper',       name: 'Buty Snajpera',             slot: 'boots',  rarity: 'uncommon',  stats: { intelligence: 5, dexterity: 2 },       defenseBonus: 5,  level: 7,  goldValue: 120,  emoji: '👟' },
  { id: 'boots_neural',       name: 'Buty Neuronowe',            slot: 'boots',  rarity: 'rare',      stats: { intelligence: 10, dexterity: 5 },      defenseBonus: 10, level: 15, goldValue: 620,  emoji: '👟' },
  { id: 'boots_predator',     name: 'Buty Drapieżnika',          slot: 'boots',  rarity: 'legendary', stats: { dexterity: 25, intelligence: 15 },     defenseBonus: 30, level: 40, goldValue: 10500,emoji: '✨' },

  // ── NEW Boots: Tank (Żywotność + Siła) ───────────────────────────────────
  { id: 'boots_reinforced',   name: 'Buty Wzmocnione',           slot: 'boots',  rarity: 'uncommon',  stats: { vitality: 4, strength: 2 },            defenseBonus: 6,  level: 6,  goldValue: 110,  emoji: '👢' },
  { id: 'boots_titan_b',      name: 'Buty Tytana',               slot: 'boots',  rarity: 'rare',      stats: { vitality: 12, strength: 4 },           defenseBonus: 14, level: 16, goldValue: 680,  emoji: '🦿' },
  { id: 'boots_juggernaut',   name: 'Buty Juggernauta',          slot: 'boots',  rarity: 'epic',      stats: { vitality: 20, strength: 8 },           defenseBonus: 20, level: 26, goldValue: 2800, emoji: '🦿' },

  // ── NEW Rings: expanded variety ───────────────────────────────────────────
  { id: 'chip_strength',      name: 'Chip Siły Mięśni',          slot: 'ring',   rarity: 'uncommon',  stats: { strength: 5, vitality: 2 },                             level: 7,  goldValue: 140,  emoji: '💉' },
  { id: 'implant_reflex',     name: 'Implant Refleksów',         slot: 'ring',   rarity: 'rare',      stats: { dexterity: 12, intelligence: 4 },                       level: 15, goldValue: 560,  emoji: '🔲' },
  { id: 'chip_bioboost',      name: 'Chip Bio-Boost',            slot: 'ring',   rarity: 'epic',      stats: { vitality: 18, strength: 10 },                           level: 24, goldValue: 2800, emoji: '💉' },
  { id: 'implant_hunter',     name: 'Implant Łowcy',             slot: 'ring',   rarity: 'epic',      stats: { dexterity: 18, intelligence: 10 },                      level: 26, goldValue: 3000, emoji: '🔲' },
  { id: 'ring_nemesis',       name: 'Implant Nemezis',           slot: 'ring',   rarity: 'legendary', stats: { strength: 20, dexterity: 20, intelligence: 10 },        level: 45, goldValue: 19000,emoji: '🐉' },

  // ── NEW Amulets: expanded variety ────────────────────────────────────────
  { id: 'core_combat',        name: 'Rdzeń Bojowy',              slot: 'amulet', rarity: 'uncommon',  stats: { strength: 5, vitality: 3 },                             level: 7,  goldValue: 150,  emoji: '💾' },
  { id: 'pendant_sniper',     name: 'Wisior Snajpera',           slot: 'amulet', rarity: 'rare',      stats: { intelligence: 12, dexterity: 5 },                       level: 16, goldValue: 700,  emoji: '📿' },
  { id: 'core_berserker',     name: 'Rdzeń Berserkera',          slot: 'amulet', rarity: 'epic',      stats: { strength: 20, dexterity: 8 },                           level: 26, goldValue: 2900, emoji: '⚛️' },
  { id: 'core_shadow',        name: 'Rdzeń Cienia',              slot: 'amulet', rarity: 'epic',      stats: { dexterity: 22, vitality: 10 },                          level: 28, goldValue: 3400, emoji: '⚛️' },
  { id: 'amulet_titan',       name: 'Amulet Tytana',             slot: 'amulet', rarity: 'legendary', stats: { strength: 25, vitality: 30 },                          level: 45, goldValue: 19000,emoji: '🔮' },
  { id: 'amulet_genesis',     name: 'Genesis Ω',                 slot: 'amulet', rarity: 'legendary', stats: { strength: 15, dexterity: 15, intelligence: 15, vitality: 5 }, level: 48, goldValue: 22000, emoji: '🔮' },

  // ════════════════════════════════════════════════════════════════════════════
  // MAGIC WEAPONS — skalują się ze statystyką Magia
  // ════════════════════════════════════════════════════════════════════════════
  { id: 'staff_nano',        name: 'Nano-Laska N1',             slot: 'weapon', rarity: 'common',    stats: { magic: 2 },                             attackBonus: 9,   level: 4,  goldValue: 50,    emoji: '🪄', magicDamage: true },
  { id: 'wand_plasma',       name: 'Różdżka Plazmowa',          slot: 'weapon', rarity: 'uncommon',  stats: { magic: 5, vitality: 1 },               attackBonus: 16,  level: 7,  goldValue: 160,   emoji: '🪄', magicDamage: true },
  { id: 'orb_quantum',       name: 'Kwantowa Sfera',            slot: 'weapon', rarity: 'rare',      stats: { magic: 10, intelligence: 4 },          attackBonus: 29,  level: 11, goldValue: 520,   emoji: '🔮', magicDamage: true },
  { id: 'staff_void',        name: 'Laska Próżni',              slot: 'weapon', rarity: 'rare',      stats: { magic: 14, vitality: 3 },              attackBonus: 36,  level: 16, goldValue: 820,   emoji: '🪄', magicDamage: true },
  { id: 'wand_arcane',       name: 'Różdżka Arkanalna',         slot: 'weapon', rarity: 'epic',      stats: { magic: 20, intelligence: 6 },          attackBonus: 52,  level: 21, goldValue: 2200,  emoji: '🔮', magicDamage: true },
  { id: 'orb_singularity',   name: 'Sfera Osobliwości',         slot: 'weapon', rarity: 'epic',      stats: { magic: 28, vitality: 8 },              attackBonus: 68,  level: 28, goldValue: 4800,  emoji: '🔮', magicDamage: true },
  { id: 'staff_omega',       name: 'Omega-Laska Ω',             slot: 'weapon', rarity: 'legendary', stats: { magic: 40, intelligence: 15 },         attackBonus: 92,  level: 38, goldValue: 12000, emoji: '✨', magicDamage: true },
  { id: 'wand_genesis',      name: 'Genesis Różdżka',           slot: 'weapon', rarity: 'legendary', stats: { magic: 55, vitality: 12 },             attackBonus: 125, level: 48, goldValue: 28000, emoji: '🌟', magicDamage: true },

  // ════════════════════════════════════════════════════════════════════════════
  // MAGIC RESISTANCE ARMOR / HELMETS / RINGS / AMULETS
  // ════════════════════════════════════════════════════════════════════════════

  // Armor
  { id: 'suit_arcane',       name: 'Kombinezon Arkański',       slot: 'armor',  rarity: 'uncommon',  stats: { magicResistance: 6 },                  defenseBonus: 10, level: 8,  goldValue: 170,   emoji: '🦾' },
  { id: 'exo_mage',          name: 'Egzoszkielet Maga',         slot: 'armor',  rarity: 'rare',      stats: { magicResistance: 12, intelligence: 5 }, defenseBonus: 18, level: 14, goldValue: 680,   emoji: '🦾' },
  { id: 'suit_warlock',      name: 'Pancerz Czarnoksiężnika',   slot: 'armor',  rarity: 'epic',      stats: { magicResistance: 20, magic: 8 },        defenseBonus: 32, level: 22, goldValue: 3200,  emoji: '🦾' },
  { id: 'exo_arcane_titan',  name: 'Arkański Egzoszkielet',     slot: 'armor',  rarity: 'legendary', stats: { magicResistance: 35, magic: 15, vitality: 10 }, defenseBonus: 62, level: 35, goldValue: 14000, emoji: '🛡️' },

  // Helmets
  { id: 'helmet_arcane',     name: 'Hełm Arkański',             slot: 'helmet', rarity: 'uncommon',  stats: { magicResistance: 5 },                  defenseBonus: 8,  level: 10, goldValue: 155,   emoji: '⛑️' },
  { id: 'visor_warlock',     name: 'Wizjer Czarnoksiężnika',    slot: 'helmet', rarity: 'rare',      stats: { magicResistance: 10, magic: 6 },        defenseBonus: 14, level: 18, goldValue: 680,   emoji: '🥽' },
  { id: 'helmet_void',       name: 'Hełm Próżni',               slot: 'helmet', rarity: 'epic',      stats: { magicResistance: 18, magic: 12 },       defenseBonus: 28, level: 30, goldValue: 4200,  emoji: '⛑️' },

  // Rings
  { id: 'implant_arcane',    name: 'Implant Arkański',          slot: 'ring',   rarity: 'uncommon',  stats: { magicResistance: 4, magic: 3 },                           level: 8,  goldValue: 155,   emoji: '💉' },
  { id: 'chip_mage',         name: 'Chip Maga',                 slot: 'ring',   rarity: 'rare',      stats: { magic: 12, magicResistance: 6 },                          level: 15, goldValue: 580,   emoji: '🔲' },
  { id: 'implant_void',      name: 'Implant Próżni',            slot: 'ring',   rarity: 'epic',      stats: { magic: 22, magicResistance: 10 },                         level: 28, goldValue: 3500,  emoji: '🔮' },
  { id: 'ring_arcane',       name: 'Pierścień Arkanów',         slot: 'ring',   rarity: 'legendary', stats: { magic: 30, magicResistance: 20 },                         level: 45, goldValue: 18000, emoji: '🌟' },

  // Amulets
  { id: 'core_arcane',       name: 'Rdzeń Arkański',            slot: 'amulet', rarity: 'uncommon',  stats: { magicResistance: 5, magic: 3 },                           level: 6,  goldValue: 145,   emoji: '💾' },
  { id: 'pendant_mage',      name: 'Wisior Maga',               slot: 'amulet', rarity: 'rare',      stats: { magic: 10, magicResistance: 8 },                          level: 14, goldValue: 720,   emoji: '📿' },
  { id: 'core_void',         name: 'Rdzeń Próżni',              slot: 'amulet', rarity: 'epic',      stats: { magic: 20, magicResistance: 14 },                         level: 26, goldValue: 3800,  emoji: '⚛️' },
  { id: 'amulet_arcane',     name: 'Amulet Arkanów',            slot: 'amulet', rarity: 'legendary', stats: { magic: 28, magicResistance: 28 },                         level: 45, goldValue: 21000, emoji: '🔮' },
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
