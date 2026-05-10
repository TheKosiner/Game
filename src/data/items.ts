import type { Item, Rarity } from '../types';

export const ALL_ITEMS: Item[] = [
  // ── Weapons: Energy Blades (Ostrza Energetyczne) ─────────────────────────
  { id: 'blade_vibro',      name: 'Wibro-Kling',                slot: 'weapon', rarity: 'common',    stats: { strength: 1 },                         attackBonus: 4,  level: 1,  goldValue: 22,    emoji: '⚡' },
  { id: 'blade_mono',       name: 'Mono-Kling',                 slot: 'weapon', rarity: 'common',    stats: { strength: 2 },                         attackBonus: 6,  level: 2,  goldValue: 32,    emoji: '⚡' },
  { id: 'blade_plasma',     name: 'Plazmo-Kling',               slot: 'weapon', rarity: 'uncommon',  stats: { strength: 5 },                         attackBonus: 13, level: 5,  goldValue: 130,   emoji: '⚡' },
  { id: 'blade_quantum',    name: 'Kwanto-Kling X7',            slot: 'weapon', rarity: 'rare',      stats: { strength: 8, dexterity: 3 },           attackBonus: 23, level: 10, goldValue: 420,   emoji: '🗡️' },
  { id: 'blade_neuro',      name: 'Neuro-Kling',                slot: 'weapon', rarity: 'rare',      stats: { strength: 10, dexterity: 6 },          attackBonus: 28, level: 14, goldValue: 600,   emoji: '🗡️' },
  { id: 'blade_disruptor',  name: 'Dysruptor Cząsteczkowy',     slot: 'weapon', rarity: 'epic',      stats: { strength: 16, vitality: 5 },           attackBonus: 40, level: 18, goldValue: 1300,  emoji: '⚔️' },
  { id: 'blade_void',       name: 'Kling Pustki',               slot: 'weapon', rarity: 'epic',      stats: { strength: 22, intelligence: 8 },       attackBonus: 55, level: 24, goldValue: 2800,  emoji: '⚔️' },
  { id: 'blade_titan',      name: 'Tytano-Kling T9',            slot: 'weapon', rarity: 'legendary', stats: { strength: 28, dexterity: 10 },         attackBonus: 70, level: 30, goldValue: 5500,  emoji: '⚔️' },
  { id: 'blade_omega',      name: 'Omega-Kling Ω',              slot: 'weapon', rarity: 'legendary', stats: { strength: 35, intelligence: 15 },      attackBonus: 90, level: 40, goldValue: 12000, emoji: '⚔️' },

  // ── Weapons: Heavy Rotary (Ciężka Artyleria) ─────────────────────────────
  { id: 'cannon_rotary',    name: 'Minigun MK-I',               slot: 'weapon', rarity: 'common',    stats: { strength: 3 },                         attackBonus: 7,  level: 2,  goldValue: 35,    emoji: '🔫' },
  { id: 'cannon_gatling',   name: 'Gatling X-400',              slot: 'weapon', rarity: 'uncommon',  stats: { strength: 8 },                         attackBonus: 16, level: 7,  goldValue: 160,   emoji: '🔫' },
  { id: 'cannon_chain',     name: 'Działko Łańcuchowe',         slot: 'weapon', rarity: 'rare',      stats: { strength: 14, vitality: 4 },           attackBonus: 30, level: 14, goldValue: 550,   emoji: '🔫' },
  { id: 'cannon_plasma',    name: 'Plazmo-Rotary',              slot: 'weapon', rarity: 'epic',      stats: { strength: 24, dexterity: -2 },         attackBonus: 52, level: 22, goldValue: 2200,  emoji: '🔫' },

  // ── Weapons: Shock & EMP (Bronie Paralizujące) ───────────────────────────
  { id: 'baton_shock',      name: 'Szok-Baton E1',              slot: 'weapon', rarity: 'common',    stats: { strength: 2, vitality: 1 },            attackBonus: 6,  level: 2,  goldValue: 30,    emoji: '⚡' },
  { id: 'baton_plasma',     name: 'Plazmo-Pałka',               slot: 'weapon', rarity: 'uncommon',  stats: { strength: 6, vitality: 3 },            attackBonus: 14, level: 7,  goldValue: 150,   emoji: '⚡' },
  { id: 'hammer_emp',       name: 'Młot EMP',                   slot: 'weapon', rarity: 'rare',      stats: { strength: 10, vitality: 8 },           attackBonus: 25, level: 13, goldValue: 480,   emoji: '⚡' },
  { id: 'hammer_thunder',   name: 'Piorunowy Młot MK-3',        slot: 'weapon', rarity: 'epic',      stats: { strength: 20, vitality: 10 },          attackBonus: 48, level: 20, goldValue: 2000,  emoji: '⚡' },

  // ── Weapons: Electro-Pikes & Railguns ────────────────────────────────────
  { id: 'pike_electro',     name: 'Elektro-Pika',               slot: 'weapon', rarity: 'common',    stats: { dexterity: 2, strength: 1 },           attackBonus: 6,  level: 2,  goldValue: 28,    emoji: '🔱' },
  { id: 'lance_hyper',      name: 'Hiper-Lanca',                slot: 'weapon', rarity: 'uncommon',  stats: { dexterity: 5, strength: 4 },           attackBonus: 15, level: 8,  goldValue: 170,   emoji: '🔱' },
  { id: 'railgun_heavy',    name: 'Railgun Ciężki',             slot: 'weapon', rarity: 'epic',      stats: { dexterity: 12, strength: 14 },         attackBonus: 46, level: 22, goldValue: 2100,  emoji: '🔱' },

  // ── Weapons: Mono-Knives & Nano-Daggers ──────────────────────────────────
  { id: 'knife_mono',       name: 'Mono-Nóż',                   slot: 'weapon', rarity: 'common',    stats: { dexterity: 3 },                        attackBonus: 6,  level: 1,  goldValue: 28,    emoji: '🔪' },
  { id: 'shiv_nano',        name: 'Nano-Sztylet',               slot: 'weapon', rarity: 'common',    stats: { dexterity: 4 },                        attackBonus: 8,  level: 4,  goldValue: 55,    emoji: '🔪' },
  { id: 'blade_stealth',    name: 'Klinga Cienia',              slot: 'weapon', rarity: 'rare',      stats: { dexterity: 10, strength: 4 },          attackBonus: 25, level: 11, goldValue: 430,   emoji: '🔪' },
  { id: 'knife_assassin',   name: 'Nóż Egzekutora',             slot: 'weapon', rarity: 'rare',      stats: { dexterity: 15, strength: 5 },          attackBonus: 32, level: 16, goldValue: 750,   emoji: '🔪' },
  { id: 'blade_neurotox',   name: 'Neuro-Toks Kling',           slot: 'weapon', rarity: 'epic',      stats: { dexterity: 22, strength: 8 },          attackBonus: 50, level: 23, goldValue: 2400,  emoji: '🔪' },

  // ── Weapons: SMGs & Assault Rifles (Zwinność) ────────────────────────────
  { id: 'smg_compact',      name: 'SMG-C9',                     slot: 'weapon', rarity: 'common',    stats: { dexterity: 2 },                        attackBonus: 5,  level: 1,  goldValue: 32,    emoji: '🔫' },
  { id: 'smg_tactical',     name: 'SMG-T4 Taktyczny',           slot: 'weapon', rarity: 'uncommon',  stats: { dexterity: 6 },                        attackBonus: 14, level: 6,  goldValue: 145,   emoji: '🔫' },
  { id: 'rifle_assault',    name: 'AR-C15 Szturmowy',           slot: 'weapon', rarity: 'rare',      stats: { dexterity: 12, intelligence: 3 },      attackBonus: 26, level: 13, goldValue: 510,   emoji: '🔫' },
  { id: 'rifle_heavy',      name: 'HMG Ciężki',                 slot: 'weapon', rarity: 'uncommon',  stats: { strength: 4, dexterity: 3 },           attackBonus: 16, level: 8,  goldValue: 155,   emoji: '🔫' },

  // ── Weapons: Sniper Rifles & Precision (Celność) ─────────────────────────
  { id: 'pistol_laser',     name: 'Lazer-Pistolet L1',          slot: 'weapon', rarity: 'common',    stats: { intelligence: 3 },                     attackBonus: 5,  level: 1,  goldValue: 30,    emoji: '🎯' },
  { id: 'rifle_precision',  name: 'Karabin Precyzyjny',         slot: 'weapon', rarity: 'common',    stats: { intelligence: 4 },                     attackBonus: 6,  level: 2,  goldValue: 35,    emoji: '🎯' },
  { id: 'sniper_obsidian',  name: 'Snajper Obsydian',           slot: 'weapon', rarity: 'uncommon',  stats: { intelligence: 8 },                     attackBonus: 12, level: 6,  goldValue: 140,   emoji: '🎯' },
  { id: 'rifle_targeting',  name: 'Celownik X-9',               slot: 'weapon', rarity: 'uncommon',  stats: { intelligence: 8 },                     attackBonus: 13, level: 6,  goldValue: 150,   emoji: '🎯' },
  { id: 'sniper_longrange', name: 'Snajper Długolufowy',        slot: 'weapon', rarity: 'rare',      stats: { intelligence: 14, vitality: 4 },       attackBonus: 24, level: 12, goldValue: 460,   emoji: '🎯' },
  { id: 'sniper_plasma',    name: 'Plazmowy Snajper',           slot: 'weapon', rarity: 'rare',      stats: { intelligence: 18, dexterity: 4 },      attackBonus: 30, level: 16, goldValue: 700,   emoji: '🎯' },
  { id: 'sniper_quantum',   name: 'Kwantowy Snajper',           slot: 'weapon', rarity: 'epic',      stats: { intelligence: 28, vitality: 6 },       attackBonus: 54, level: 24, goldValue: 2600,  emoji: '🎯' },
  { id: 'rifle_god_eye',    name: 'Boskie Oko',                 slot: 'weapon', rarity: 'legendary', stats: { intelligence: 40, vitality: 12 },      attackBonus: 80, level: 35, goldValue: 9000,  emoji: '🎯' },

  // ── Armor: Heavy (Egzoszkielety & Nano-Zbroje) ───────────────────────────
  { id: 'vest_ballistic',   name: 'Kamizelka Balistyczna',      slot: 'armor',  rarity: 'common',    stats: { vitality: 1 },                         defenseBonus: 3,  level: 1,  goldValue: 20,   emoji: '🦺' },
  { id: 'vest_tactical',    name: 'Kamizelka Taktyczna',        slot: 'armor',  rarity: 'common',    stats: { vitality: 2 },                         defenseBonus: 5,  level: 2,  goldValue: 38,   emoji: '🦺' },
  { id: 'vest_reinforced',  name: 'Kamizelka Wzmocniona',       slot: 'armor',  rarity: 'common',    stats: { vitality: 3, dexterity: 1 },           defenseBonus: 7,  level: 4,  goldValue: 65,   emoji: '🦺' },
  { id: 'suit_combat',      name: 'Kombinezon Bojowy',          slot: 'armor',  rarity: 'uncommon',  stats: { vitality: 7 },                         defenseBonus: 12, level: 6,  goldValue: 150,  emoji: '🦾' },
  { id: 'suit_nano',        name: 'Nano-Pancerz',               slot: 'armor',  rarity: 'uncommon',  stats: { vitality: 9, strength: 2 },            defenseBonus: 15, level: 8,  goldValue: 200,  emoji: '🦾' },
  { id: 'exo_light',        name: 'Egzoszkielet Lekki',         slot: 'armor',  rarity: 'rare',      stats: { vitality: 13, strength: 4 },           defenseBonus: 22, level: 11, goldValue: 520,  emoji: '🦾' },
  { id: 'exo_tactical',     name: 'Egzoszkielet Taktyczny',     slot: 'armor',  rarity: 'rare',      stats: { vitality: 16, strength: 5 },           defenseBonus: 28, level: 14, goldValue: 700,  emoji: '🦾' },
  { id: 'suit_stealth',     name: 'Kombinezon Cień',            slot: 'armor',  rarity: 'epic',      stats: { dexterity: 12, vitality: 10 },         defenseBonus: 30, level: 20, goldValue: 1600, emoji: '🦾' },
  { id: 'exo_heavy',        name: 'Egzoszkielet Ciężki',        slot: 'armor',  rarity: 'epic',      stats: { vitality: 22, strength: 8 },           defenseBonus: 42, level: 26, goldValue: 3500, emoji: '🦾' },
  { id: 'exo_titan',        name: 'Egzoszkielet Tytan',         slot: 'armor',  rarity: 'legendary', stats: { vitality: 35, strength: 12 },          defenseBonus: 60, level: 32, goldValue: 8000, emoji: '🦾' },

  // ── Armor: Light (Hakerskie Kombinezony) ─────────────────────────────────
  { id: 'coat_hacker_light',name: 'Płaszcz Hakera Lekki',       slot: 'armor',  rarity: 'common',    stats: { intelligence: 2 },                     defenseBonus: 2,  level: 1,  goldValue: 22,   emoji: '🧥' },
  { id: 'coat_hacker',      name: 'Płaszcz Hakera',             slot: 'armor',  rarity: 'common',    stats: { intelligence: 3 },                     defenseBonus: 3,  level: 3,  goldValue: 45,   emoji: '🧥' },
  { id: 'suit_cyber',       name: 'Cyber-Kombinezon',           slot: 'armor',  rarity: 'uncommon',  stats: { intelligence: 7 },                     defenseBonus: 7,  level: 6,  goldValue: 120,  emoji: '🧥' },
  { id: 'suit_netrunner',   name: 'Kombinezon Netbiegacza',     slot: 'armor',  rarity: 'uncommon',  stats: { intelligence: 11, vitality: 3 },       defenseBonus: 10, level: 10, goldValue: 250,  emoji: '🧥' },
  { id: 'suit_ghost',       name: 'Kombinezon-Duch',            slot: 'armor',  rarity: 'epic',      stats: { intelligence: 22, vitality: 6 },       defenseBonus: 20, level: 20, goldValue: 1800, emoji: '🧥' },
  { id: 'vest_runner',      name: 'Kamizelka Kuriera',          slot: 'armor',  rarity: 'common',    stats: { dexterity: 2 },                        defenseBonus: 4,  level: 2,  goldValue: 30,   emoji: '🧥' },
  { id: 'vest_shadow',      name: 'Kamizelka Cienia',           slot: 'armor',  rarity: 'uncommon',  stats: { dexterity: 6 },                        defenseBonus: 9,  level: 8,  goldValue: 180,  emoji: '🧥' },
  { id: 'coat_corp',        name: 'Płaszcz Korporacyjny',       slot: 'armor',  rarity: 'rare',      stats: { dexterity: 10, intelligence: 5 },      defenseBonus: 14, level: 14, goldValue: 580,  emoji: '🧥' },

  // ── Helmets (Wizjery & Implanty Głowy) ───────────────────────────────────
  { id: 'visor_basic',      name: 'Wizjer Bazowy',              slot: 'helmet', rarity: 'common',    stats: { vitality: 1 },                         defenseBonus: 2,  level: 1,  goldValue: 18,   emoji: '🥽' },
  { id: 'visor_reinforced', name: 'Wizjer MK-II',               slot: 'helmet', rarity: 'common',    stats: { vitality: 2 },                         defenseBonus: 4,  level: 2,  goldValue: 28,   emoji: '🥽' },
  { id: 'helmet_combat',    name: 'Hełm Bojowy',                slot: 'helmet', rarity: 'common',    stats: { vitality: 2 },                         defenseBonus: 5,  level: 3,  goldValue: 35,   emoji: '⛑️' },
  { id: 'helmet_tactical',  name: 'Hełm Taktyczny',             slot: 'helmet', rarity: 'uncommon',  stats: { vitality: 5 },                         defenseBonus: 9,  level: 6,  goldValue: 100,  emoji: '⛑️' },
  { id: 'helmet_assault',   name: 'Hełm Szturmowy',             slot: 'helmet', rarity: 'uncommon',  stats: { vitality: 7, strength: 2 },            defenseBonus: 12, level: 10, goldValue: 200,  emoji: '⛑️' },
  { id: 'helmet_titan',     name: 'Hełm Tytana',                slot: 'helmet', rarity: 'rare',      stats: { vitality: 12, strength: 4 },           defenseBonus: 18, level: 15, goldValue: 600,  emoji: '⛑️' },
  { id: 'visor_stealth',    name: 'Wizjer Cienia',              slot: 'helmet', rarity: 'rare',      stats: { dexterity: 9, vitality: 5 },           defenseBonus: 10, level: 11, goldValue: 420,  emoji: '🥽' },
  { id: 'mask_cyber',       name: 'Cyber-Maska',                slot: 'helmet', rarity: 'rare',      stats: { dexterity: 8 },                        defenseBonus: 6,  level: 8,  goldValue: 310,  emoji: '🎭' },
  { id: 'mask_assassin',    name: 'Maska Egzekutora',           slot: 'helmet', rarity: 'rare',      stats: { dexterity: 13, strength: 3 },          defenseBonus: 8,  level: 13, goldValue: 540,  emoji: '🎭' },
  { id: 'implant_neural',   name: 'Implant Neuralny',           slot: 'helmet', rarity: 'uncommon',  stats: { intelligence: 6 },                     defenseBonus: 4,  level: 5,  goldValue: 110,  emoji: '💡' },
  { id: 'interface_hud',    name: 'Interfejs HUD',              slot: 'helmet', rarity: 'rare',      stats: { intelligence: 14, vitality: 3 },       defenseBonus: 8,  level: 15, goldValue: 620,  emoji: '💡' },
  { id: 'helmet_megacorp',  name: 'Hełm Megakorpu',             slot: 'helmet', rarity: 'legendary', stats: { vitality: 22, strength: 10 },          defenseBonus: 28, level: 28, goldValue: 4200, emoji: '🤖' },

  // ── Boots (Cyber-Buty & Magnesy) ─────────────────────────────────────────
  { id: 'boots_urban',      name: 'Buty Uliczne',               slot: 'boots',  rarity: 'common',    stats: { dexterity: 1 },                        defenseBonus: 1,  level: 1,  goldValue: 14,   emoji: '👢' },
  { id: 'boots_runner',     name: 'Buty Kuriera',               slot: 'boots',  rarity: 'common',    stats: { dexterity: 2 },                        defenseBonus: 3,  level: 2,  goldValue: 22,   emoji: '👢' },
  { id: 'boots_tactical',   name: 'Buty Taktyczne',             slot: 'boots',  rarity: 'common',    stats: { dexterity: 2, vitality: 1 },           defenseBonus: 4,  level: 4,  goldValue: 50,   emoji: '👢' },
  { id: 'boots_combat',     name: 'Buty Bojowe',                slot: 'boots',  rarity: 'uncommon',  stats: { dexterity: 5, vitality: 2 },           defenseBonus: 7,  level: 6,  goldValue: 95,   emoji: '👢' },
  { id: 'boots_stealth',    name: 'Buty Cienia',                slot: 'boots',  rarity: 'uncommon',  stats: { dexterity: 7 },                        defenseBonus: 5,  level: 9,  goldValue: 160,  emoji: '👢' },
  { id: 'boots_hacker',     name: 'Buty Hakera',                slot: 'boots',  rarity: 'uncommon',  stats: { intelligence: 5, dexterity: 3 },       defenseBonus: 4,  level: 6,  goldValue: 120,  emoji: '👟' },
  { id: 'boots_speed',      name: 'Sprint-Buty',                slot: 'boots',  rarity: 'rare',      stats: { dexterity: 14 },                       defenseBonus: 7,  level: 12, goldValue: 480,  emoji: '💨' },
  { id: 'boots_jet',        name: 'Jet-Buty',                   slot: 'boots',  rarity: 'epic',      stats: { dexterity: 18 },                       defenseBonus: 10, level: 17, goldValue: 1100, emoji: '💨' },
  { id: 'boots_exo',        name: 'Exo-Buty',                   slot: 'boots',  rarity: 'epic',      stats: { dexterity: 14, vitality: 10 },         defenseBonus: 16, level: 24, goldValue: 2200, emoji: '🦿' },
  { id: 'boots_phase',      name: 'Buty Fazowe',                slot: 'boots',  rarity: 'legendary', stats: { dexterity: 28, intelligence: 8 },      defenseBonus: 20, level: 32, goldValue: 6000, emoji: '🦿' },

  // ── Rings (Cyber-Implanty Rąk) ───────────────────────────────────────────
  { id: 'implant_muscle',   name: 'Implant Mięśniowy',          slot: 'ring',   rarity: 'common',    stats: { strength: 1 },                                          level: 1,  goldValue: 12,   emoji: '💉' },
  { id: 'implant_endure',   name: 'Implant Wytrzymałości',      slot: 'ring',   rarity: 'common',    stats: { vitality: 1 },                                          level: 1,  goldValue: 14,   emoji: '💉' },
  { id: 'implant_reflex',   name: 'Implant Refleksu',           slot: 'ring',   rarity: 'common',    stats: { dexterity: 2 },                                         level: 2,  goldValue: 20,   emoji: '💉' },
  { id: 'implant_berserker',name: 'Implant Berserkera',         slot: 'ring',   rarity: 'uncommon',  stats: { strength: 5 },                                          level: 5,  goldValue: 90,   emoji: '💉' },
  { id: 'chip_hacking',     name: 'Chip Hakowania',             slot: 'ring',   rarity: 'uncommon',  stats: { intelligence: 5 },                                      level: 5,  goldValue: 80,   emoji: '🔲' },
  { id: 'chip_targeting',   name: 'Chip Celowania',             slot: 'ring',   rarity: 'uncommon',  stats: { intelligence: 6, vitality: 2 },                         level: 8,  goldValue: 140,  emoji: '🔲' },
  { id: 'chip_tactical',    name: 'Chip Taktyczny',             slot: 'ring',   rarity: 'rare',      stats: { dexterity: 8, vitality: 4 },                            level: 11, goldValue: 380,  emoji: '🔲' },
  { id: 'implant_power',    name: 'Implant Siły',               slot: 'ring',   rarity: 'rare',      stats: { strength: 9, vitality: 5 },                             level: 11, goldValue: 360,  emoji: '💉' },
  { id: 'implant_military', name: 'Implant Militarny',          slot: 'ring',   rarity: 'rare',      stats: { strength: 6, intelligence: 6, dexterity: 4 },          level: 15, goldValue: 620,  emoji: '💉' },
  { id: 'implant_titan',    name: 'Implant Tytana',             slot: 'ring',   rarity: 'epic',      stats: { strength: 14, vitality: 10 },                           level: 22, goldValue: 2400, emoji: '💉' },
  { id: 'chip_quantum',     name: 'Kwantowy Chip',              slot: 'ring',   rarity: 'epic',      stats: { intelligence: 18, vitality: 8 },                        level: 24, goldValue: 2800, emoji: '🔲' },
  { id: 'implant_omega',    name: 'Implant Omega',              slot: 'ring',   rarity: 'legendary', stats: { strength: 20, intelligence: 20, dexterity: 10 },        level: 35, goldValue: 8500, emoji: '💉' },

  // ── Amulets (Rdzenie Danych & Wzmacniacze) ───────────────────────────────
  { id: 'core_basic',       name: 'Rdzeń Danych B-01',          slot: 'amulet', rarity: 'common',    stats: { vitality: 1 },                                          level: 1,  goldValue: 15,   emoji: '💾' },
  { id: 'core_nano',        name: 'Nano-Rdzeń',                 slot: 'amulet', rarity: 'common',    stats: { vitality: 2 },                                          level: 1,  goldValue: 22,   emoji: '💾' },
  { id: 'core_predator',    name: 'Rdzeń Drapieżnika',          slot: 'amulet', rarity: 'common',    stats: { strength: 2 },                                          level: 3,  goldValue: 35,   emoji: '💾' },
  { id: 'core_hacker',      name: 'Rdzeń Hakera',               slot: 'amulet', rarity: 'uncommon',  stats: { intelligence: 5 },                                      level: 5,  goldValue: 95,   emoji: '📡' },
  { id: 'core_endurance',   name: 'Rdzeń Wytrzymałości',        slot: 'amulet', rarity: 'uncommon',  stats: { vitality: 6 },                                          level: 6,  goldValue: 110,  emoji: '📡' },
  { id: 'amplifier_signal', name: 'Wzmacniacz Sygnału',         slot: 'amulet', rarity: 'rare',      stats: { intelligence: 11 },                                     level: 9,  goldValue: 340,  emoji: '📡' },
  { id: 'amplifier_stealth',name: 'Wzmacniacz Ukrycia',         slot: 'amulet', rarity: 'rare',      stats: { dexterity: 8, intelligence: 6 },                        level: 11, goldValue: 420,  emoji: '📡' },
  { id: 'core_berserker',   name: 'Rdzeń Berserkera',           slot: 'amulet', rarity: 'rare',      stats: { strength: 12, vitality: -2 },                           level: 13, goldValue: 480,  emoji: '📡' },
  { id: 'core_phoenix',     name: 'Rdzeń Feniksa',              slot: 'amulet', rarity: 'epic',      stats: { vitality: 16, strength: 8 },                            level: 20, goldValue: 2000, emoji: '🔥' },
  { id: 'core_megacorp',    name: 'Rdzeń Megakorpu',            slot: 'amulet', rarity: 'legendary', stats: { strength: 18, intelligence: 18 },                       level: 27, goldValue: 4800, emoji: '🔥' },
  { id: 'core_quantum',     name: 'Kwantowy Rdzeń',             slot: 'amulet', rarity: 'legendary', stats: { strength: 15, intelligence: 15, vitality: 15, dexterity: 10 }, level: 35, goldValue: 11000, emoji: '🌐' },
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
