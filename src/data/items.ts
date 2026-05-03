import type { Item, Rarity } from '../types';

export const ALL_ITEMS: Item[] = [
  // ── Weapons: Swords ──────────────────────────────────────────────────────
  { id: 'sword_bronze',   name: 'Brązowy Miecz',     slot: 'weapon', rarity: 'common',    stats: { strength: 1 },                         attackBonus: 4,  level: 1,  goldValue: 22,   emoji: '⚔️' },
  { id: 'sword_iron',     name: 'Żelazny Miecz',     slot: 'weapon', rarity: 'common',    stats: { strength: 2 },                         attackBonus: 6,  level: 2,  goldValue: 32,   emoji: '⚔️' },
  { id: 'sword_steel',    name: 'Stalowy Miecz',      slot: 'weapon', rarity: 'uncommon',  stats: { strength: 5 },                         attackBonus: 13, level: 5,  goldValue: 130,  emoji: '⚔️' },
  { id: 'sword_silver',   name: 'Srebrny Miecz',      slot: 'weapon', rarity: 'rare',      stats: { strength: 8, agility: 3 },             attackBonus: 23, level: 10, goldValue: 420,  emoji: '⚔️' },
  { id: 'sword_elven',    name: 'Elficki Miecz',      slot: 'weapon', rarity: 'rare',      stats: { strength: 10, agility: 6 },            attackBonus: 28, level: 14, goldValue: 600,  emoji: '🗡️' },
  { id: 'sword_rune',     name: 'Runiczny Miecz',     slot: 'weapon', rarity: 'epic',      stats: { strength: 16, constitution: 5 },       attackBonus: 40, level: 18, goldValue: 1300, emoji: '🗡️' },
  { id: 'sword_chaos',    name: 'Miecz Chaosu',       slot: 'weapon', rarity: 'epic',      stats: { strength: 22, intelligence: 8 },       attackBonus: 55, level: 24, goldValue: 2800, emoji: '🗡️' },
  { id: 'sword_dragon',   name: 'Smocze Ostrze',      slot: 'weapon', rarity: 'legendary', stats: { strength: 28, agility: 10 },           attackBonus: 70, level: 30, goldValue: 5500, emoji: '🗡️' },
  { id: 'sword_void',     name: 'Ostrze Pustki',      slot: 'weapon', rarity: 'legendary', stats: { strength: 35, intelligence: 15 },      attackBonus: 90, level: 40, goldValue: 12000,emoji: '🗡️' },

  // ── Weapons: Axes ────────────────────────────────────────────────────────
  { id: 'axe_iron',       name: 'Żelazna Siekiera',  slot: 'weapon', rarity: 'common',    stats: { strength: 3 },                         attackBonus: 7,  level: 2,  goldValue: 35,   emoji: '🪓' },
  { id: 'axe_battle',     name: 'Bojowa Siekiera',    slot: 'weapon', rarity: 'uncommon',  stats: { strength: 8 },                         attackBonus: 16, level: 7,  goldValue: 160,  emoji: '🪓' },
  { id: 'axe_great',      name: 'Wielka Siekiera',    slot: 'weapon', rarity: 'rare',      stats: { strength: 14, constitution: 4 },       attackBonus: 30, level: 14, goldValue: 550,  emoji: '🪓' },
  { id: 'axe_berserker',  name: 'Berserkerska Siekiera', slot: 'weapon', rarity: 'epic',  stats: { strength: 24, agility: -2 },           attackBonus: 52, level: 22, goldValue: 2200, emoji: '🪓' },

  // ── Weapons: Maces & Hammers ─────────────────────────────────────────────
  { id: 'mace_iron',      name: 'Żelazna Buława',    slot: 'weapon', rarity: 'common',    stats: { strength: 2, constitution: 1 },        attackBonus: 6,  level: 2,  goldValue: 30,   emoji: '🔨' },
  { id: 'mace_steel',     name: 'Stalowa Buława',     slot: 'weapon', rarity: 'uncommon',  stats: { strength: 6, constitution: 3 },        attackBonus: 14, level: 7,  goldValue: 150,  emoji: '🔨' },
  { id: 'mace_blessed',   name: 'Święta Buława',      slot: 'weapon', rarity: 'rare',      stats: { strength: 10, constitution: 8 },       attackBonus: 25, level: 13, goldValue: 480,  emoji: '🔨' },
  { id: 'hammer_thunder', name: 'Gromowy Młot',       slot: 'weapon', rarity: 'epic',      stats: { strength: 20, constitution: 10 },      attackBonus: 48, level: 20, goldValue: 2000, emoji: '🔨' },

  // ── Weapons: Spears ──────────────────────────────────────────────────────
  { id: 'spear_iron',     name: 'Żelazna Włócznia',  slot: 'weapon', rarity: 'common',    stats: { agility: 2, strength: 1 },             attackBonus: 6,  level: 2,  goldValue: 28,   emoji: '🔱' },
  { id: 'spear_silver',   name: 'Srebrna Włócznia',   slot: 'weapon', rarity: 'uncommon',  stats: { agility: 5, strength: 4 },             attackBonus: 15, level: 8,  goldValue: 170,  emoji: '🔱' },
  { id: 'spear_dragonbone',name:'Smocza Kość',        slot: 'weapon', rarity: 'epic',      stats: { agility: 12, strength: 14 },           attackBonus: 46, level: 22, goldValue: 2100, emoji: '🔱' },

  // ── Weapons: Daggers ─────────────────────────────────────────────────────
  { id: 'dagger_iron',    name: 'Żelazny Sztylet',   slot: 'weapon', rarity: 'common',    stats: { agility: 3 },                          attackBonus: 6,  level: 1,  goldValue: 28,   emoji: '🔪' },
  { id: 'dagger_poison',  name: 'Zatruta Igła',       slot: 'weapon', rarity: 'common',    stats: { agility: 4 },                          attackBonus: 8,  level: 4,  goldValue: 55,   emoji: '🔪' },
  { id: 'dagger_shadow',  name: 'Cień Nocy',          slot: 'weapon', rarity: 'rare',      stats: { agility: 10, strength: 4 },            attackBonus: 25, level: 11, goldValue: 430,  emoji: '🔪' },
  { id: 'dagger_assassin',name: 'Sztylet Zabójcy',    slot: 'weapon', rarity: 'rare',      stats: { agility: 15, strength: 5 },            attackBonus: 32, level: 16, goldValue: 750,  emoji: '🔪' },
  { id: 'dagger_venom',   name: 'Jadowy Kieł',        slot: 'weapon', rarity: 'epic',      stats: { agility: 22, strength: 8 },            attackBonus: 50, level: 23, goldValue: 2400, emoji: '🔪' },

  // ── Weapons: Bows ────────────────────────────────────────────────────────
  { id: 'bow_short',      name: 'Krótki Łuk',        slot: 'weapon', rarity: 'common',    stats: { agility: 2 },                          attackBonus: 5,  level: 1,  goldValue: 32,   emoji: '🏹' },
  { id: 'bow_long',       name: 'Długi Łuk',          slot: 'weapon', rarity: 'uncommon',  stats: { agility: 6 },                          attackBonus: 14, level: 6,  goldValue: 145,  emoji: '🏹' },
  { id: 'bow_elven',      name: 'Elficki Łuk',        slot: 'weapon', rarity: 'rare',      stats: { agility: 12, intelligence: 3 },        attackBonus: 26, level: 13, goldValue: 510,  emoji: '🏹' },
  { id: 'crossbow_heavy', name: 'Ciężka Kusza',       slot: 'weapon', rarity: 'uncommon',  stats: { strength: 4, agility: 3 },             attackBonus: 16, level: 8,  goldValue: 155,  emoji: '🏹' },

  // ── Weapons: Staves & Wands ──────────────────────────────────────────────
  { id: 'wand_crystal',   name: 'Kryształowa Różdżka', slot: 'weapon', rarity: 'common',  stats: { intelligence: 3 },                     attackBonus: 5,  level: 1,  goldValue: 30,   emoji: '🪄' },
  { id: 'staff_wood',     name: 'Drewniana Laska',    slot: 'weapon', rarity: 'common',    stats: { intelligence: 4 },                     attackBonus: 6,  level: 2,  goldValue: 35,   emoji: '🪄' },
  { id: 'wand_obsidian',  name: 'Obsydianowa Różdżka', slot: 'weapon', rarity: 'uncommon', stats: { intelligence: 8 },                    attackBonus: 12, level: 6,  goldValue: 140,  emoji: '🪄' },
  { id: 'staff_arcane',   name: 'Magiczna Laska',     slot: 'weapon', rarity: 'uncommon',  stats: { intelligence: 8 },                     attackBonus: 13, level: 6,  goldValue: 150,  emoji: '🪄' },
  { id: 'staff_elder',    name: 'Laska Starszyzny',   slot: 'weapon', rarity: 'rare',      stats: { intelligence: 14, constitution: 4 },   attackBonus: 24, level: 12, goldValue: 460,  emoji: '🔮' },
  { id: 'staff_storm',    name: 'Laska Burzy',        slot: 'weapon', rarity: 'rare',      stats: { intelligence: 18, agility: 4 },        attackBonus: 30, level: 16, goldValue: 700,  emoji: '🔮' },
  { id: 'staff_lich',     name: 'Laska Lisza',        slot: 'weapon', rarity: 'epic',      stats: { intelligence: 28, constitution: 6 },   attackBonus: 54, level: 24, goldValue: 2600, emoji: '🔮' },
  { id: 'staff_cosmos',   name: 'Kosmiczna Laska',    slot: 'weapon', rarity: 'legendary', stats: { intelligence: 40, constitution: 12 },  attackBonus: 80, level: 35, goldValue: 9000, emoji: '🔮' },

  // ── Armor: Heavy ─────────────────────────────────────────────────────────
  { id: 'armor_padded',   name: 'Watowana Zbroja',   slot: 'armor',  rarity: 'common',    stats: { constitution: 1 },                     defenseBonus: 3,  level: 1,  goldValue: 20,   emoji: '👕' },
  { id: 'armor_leather',  name: 'Skórzana Zbroja',   slot: 'armor',  rarity: 'common',    stats: { constitution: 2 },                     defenseBonus: 5,  level: 2,  goldValue: 38,   emoji: '🛡️' },
  { id: 'armor_studded',  name: 'Nabijana Zbroja',   slot: 'armor',  rarity: 'common',    stats: { constitution: 3, agility: 1 },         defenseBonus: 7,  level: 4,  goldValue: 65,   emoji: '🛡️' },
  { id: 'armor_chainmail',name: 'Kolczuga',           slot: 'armor',  rarity: 'uncommon',  stats: { constitution: 7 },                     defenseBonus: 12, level: 6,  goldValue: 150,  emoji: '🛡️' },
  { id: 'armor_scale',    name: 'Zbroja Łuskowa',    slot: 'armor',  rarity: 'uncommon',  stats: { constitution: 9, strength: 2 },        defenseBonus: 15, level: 8,  goldValue: 200,  emoji: '🛡️' },
  { id: 'armor_plate',    name: 'Płytowa Zbroja',    slot: 'armor',  rarity: 'rare',      stats: { constitution: 13, strength: 4 },       defenseBonus: 22, level: 11, goldValue: 520,  emoji: '🛡️' },
  { id: 'armor_half_plate',name:'Półpłytowa Zbroja', slot: 'armor',  rarity: 'rare',      stats: { constitution: 16, strength: 5 },       defenseBonus: 28, level: 14, goldValue: 700,  emoji: '🛡️' },
  { id: 'armor_shadow',   name: 'Zbroja Cieni',      slot: 'armor',  rarity: 'epic',      stats: { agility: 12, constitution: 10 },       defenseBonus: 30, level: 20, goldValue: 1600, emoji: '🦾' },
  { id: 'armor_dragonscale',name:'Smoczy Łuski',     slot: 'armor',  rarity: 'epic',      stats: { constitution: 22, strength: 8 },       defenseBonus: 42, level: 26, goldValue: 3500, emoji: '🦾' },
  { id: 'armor_celestial',name: 'Niebiańska Zbroja', slot: 'armor',  rarity: 'legendary', stats: { constitution: 35, strength: 12 },      defenseBonus: 60, level: 32, goldValue: 8000, emoji: '🦾' },

  // ── Armor: Robes & Light ──────────────────────────────────────────────────
  { id: 'robe_apprentice',name: 'Szata Ucznia',      slot: 'armor',  rarity: 'common',    stats: { intelligence: 2 },                     defenseBonus: 2,  level: 1,  goldValue: 22,   emoji: '👘' },
  { id: 'robe_mage',      name: 'Szata Maga',        slot: 'armor',  rarity: 'common',    stats: { intelligence: 3 },                     defenseBonus: 3,  level: 3,  goldValue: 45,   emoji: '👘' },
  { id: 'robe_arcane',    name: 'Arkanistyczna Szata', slot: 'armor', rarity: 'uncommon', stats: { intelligence: 7 },                     defenseBonus: 7,  level: 6,  goldValue: 120,  emoji: '👘' },
  { id: 'robe_elder',     name: 'Szata Starszyzny',  slot: 'armor',  rarity: 'uncommon',  stats: { intelligence: 11, constitution: 3 },   defenseBonus: 10, level: 10, goldValue: 250,  emoji: '👘' },
  { id: 'robe_lich',      name: 'Szata Lisza',       slot: 'armor',  rarity: 'epic',      stats: { intelligence: 22, constitution: 6 },   defenseBonus: 20, level: 20, goldValue: 1800, emoji: '👘' },
  { id: 'vest_leather',   name: 'Skórzana Kamizelka', slot: 'armor', rarity: 'common',    stats: { agility: 2 },                          defenseBonus: 4,  level: 2,  goldValue: 30,   emoji: '🧥' },
  { id: 'vest_shadow',    name: 'Kamizelka Cieni',   slot: 'armor',  rarity: 'uncommon',  stats: { agility: 6 },                          defenseBonus: 9,  level: 8,  goldValue: 180,  emoji: '🧥' },
  { id: 'coat_dark',      name: 'Ciemny Płaszcz',    slot: 'armor',  rarity: 'rare',      stats: { agility: 10, intelligence: 5 },        defenseBonus: 14, level: 14, goldValue: 580,  emoji: '🧥' },

  // ── Helmets ───────────────────────────────────────────────────────────────
  { id: 'helmet_leather', name: 'Skórzany Hełm',     slot: 'helmet', rarity: 'common',    stats: { constitution: 1 },                     defenseBonus: 2,  level: 1,  goldValue: 18,   emoji: '⛑️' },
  { id: 'helmet_bronze',  name: 'Brązowy Hełm',      slot: 'helmet', rarity: 'common',    stats: { constitution: 2 },                     defenseBonus: 4,  level: 2,  goldValue: 28,   emoji: '⛑️' },
  { id: 'helmet_iron',    name: 'Żelazny Hełm',      slot: 'helmet', rarity: 'common',    stats: { constitution: 2 },                     defenseBonus: 5,  level: 3,  goldValue: 35,   emoji: '⛑️' },
  { id: 'helmet_steel',   name: 'Stalowy Hełm',      slot: 'helmet', rarity: 'uncommon',  stats: { constitution: 5 },                     defenseBonus: 9,  level: 6,  goldValue: 100,  emoji: '⛑️' },
  { id: 'helmet_knight',  name: 'Rycerski Hełm',     slot: 'helmet', rarity: 'uncommon',  stats: { constitution: 7, strength: 2 },        defenseBonus: 12, level: 10, goldValue: 200,  emoji: '⛑️' },
  { id: 'helmet_great',   name: 'Wielki Hełm',       slot: 'helmet', rarity: 'rare',      stats: { constitution: 12, strength: 4 },       defenseBonus: 18, level: 15, goldValue: 600,  emoji: '⛑️' },
  { id: 'helmet_shadow',  name: 'Hełm Cieni',        slot: 'helmet', rarity: 'rare',      stats: { agility: 9, constitution: 5 },         defenseBonus: 10, level: 11, goldValue: 420,  emoji: '🎭' },
  { id: 'hood_shadow',    name: 'Kaptur Cieni',       slot: 'helmet', rarity: 'rare',      stats: { agility: 8 },                          defenseBonus: 6,  level: 8,  goldValue: 310,  emoji: '🎭' },
  { id: 'hood_assassin',  name: 'Kaptur Zabójcy',    slot: 'helmet', rarity: 'rare',      stats: { agility: 13, strength: 3 },            defenseBonus: 8,  level: 13, goldValue: 540,  emoji: '🎭' },
  { id: 'circlet_silver', name: 'Srebrny Diadem',    slot: 'helmet', rarity: 'uncommon',  stats: { intelligence: 6 },                     defenseBonus: 4,  level: 5,  goldValue: 110,  emoji: '👑' },
  { id: 'crown_mage',     name: 'Korona Maga',       slot: 'helmet', rarity: 'rare',      stats: { intelligence: 14, constitution: 3 },   defenseBonus: 8,  level: 15, goldValue: 620,  emoji: '👑' },
  { id: 'helmet_dragon',  name: 'Smocza Korona',     slot: 'helmet', rarity: 'legendary', stats: { constitution: 22, strength: 10 },      defenseBonus: 28, level: 28, goldValue: 4200, emoji: '👑' },

  // ── Boots ─────────────────────────────────────────────────────────────────
  { id: 'boots_cloth',    name: 'Płócienne Buty',    slot: 'boots',  rarity: 'common',    stats: { agility: 1 },                          defenseBonus: 1,  level: 1,  goldValue: 14,   emoji: '👢' },
  { id: 'boots_leather',  name: 'Skórzane Buty',     slot: 'boots',  rarity: 'common',    stats: { agility: 2 },                          defenseBonus: 3,  level: 2,  goldValue: 22,   emoji: '👢' },
  { id: 'boots_iron',     name: 'Żelazne Buty',      slot: 'boots',  rarity: 'common',    stats: { agility: 2, constitution: 1 },         defenseBonus: 4,  level: 4,  goldValue: 50,   emoji: '👢' },
  { id: 'boots_steel',    name: 'Stalowe Buty',      slot: 'boots',  rarity: 'uncommon',  stats: { agility: 5, constitution: 2 },         defenseBonus: 7,  level: 6,  goldValue: 95,   emoji: '👢' },
  { id: 'boots_shadow',   name: 'Buty Cienia',       slot: 'boots',  rarity: 'uncommon',  stats: { agility: 7 },                          defenseBonus: 5,  level: 9,  goldValue: 160,  emoji: '👢' },
  { id: 'sandals_arcane', name: 'Arkanistyczne Sandały', slot: 'boots', rarity: 'uncommon', stats: { intelligence: 5, agility: 3 },       defenseBonus: 4,  level: 6,  goldValue: 120,  emoji: '👡' },
  { id: 'boots_swift',    name: 'Buty Zwiewności',   slot: 'boots',  rarity: 'rare',      stats: { agility: 14 },                         defenseBonus: 7,  level: 12, goldValue: 480,  emoji: '💨' },
  { id: 'boots_wind',     name: 'Buty Wiatru',       slot: 'boots',  rarity: 'epic',      stats: { agility: 18 },                         defenseBonus: 10, level: 17, goldValue: 1100, emoji: '💨' },
  { id: 'boots_dragon',   name: 'Smocze Buty',       slot: 'boots',  rarity: 'epic',      stats: { agility: 14, constitution: 10 },       defenseBonus: 16, level: 24, goldValue: 2200, emoji: '💨' },
  { id: 'boots_void',     name: 'Buty Nicości',      slot: 'boots',  rarity: 'legendary', stats: { agility: 28, intelligence: 8 },        defenseBonus: 20, level: 32, goldValue: 6000, emoji: '💨' },

  // ── Rings ─────────────────────────────────────────────────────────────────
  { id: 'ring_iron',      name: 'Żelazny Pierścień', slot: 'ring',   rarity: 'common',    stats: { strength: 1 },                                           level: 1,  goldValue: 12,   emoji: '💍' },
  { id: 'ring_copper',    name: 'Miedziany Pierścień', slot: 'ring', rarity: 'common',    stats: { constitution: 1 },                                       level: 1,  goldValue: 14,   emoji: '💍' },
  { id: 'ring_agility',   name: 'Pierścień Zwinności', slot: 'ring', rarity: 'common',    stats: { agility: 2 },                                            level: 2,  goldValue: 20,   emoji: '💍' },
  { id: 'ring_ruby',      name: 'Rubinowy Pierścień', slot: 'ring',  rarity: 'uncommon',  stats: { strength: 5 },                                           level: 5,  goldValue: 90,   emoji: '💍' },
  { id: 'ring_silver',    name: 'Srebrny Pierścień',  slot: 'ring',  rarity: 'uncommon',  stats: { intelligence: 5 },                                       level: 5,  goldValue: 80,   emoji: '💍' },
  { id: 'ring_sapphire',  name: 'Szafirowy Pierścień', slot: 'ring', rarity: 'uncommon',  stats: { intelligence: 6, constitution: 2 },                      level: 8,  goldValue: 140,  emoji: '💍' },
  { id: 'ring_emerald',   name: 'Szmaragdowy Pierścień', slot: 'ring', rarity: 'rare',    stats: { agility: 8, constitution: 4 },                           level: 11, goldValue: 380,  emoji: '💍' },
  { id: 'ring_power',     name: 'Pierścień Mocy',    slot: 'ring',   rarity: 'rare',      stats: { strength: 9, constitution: 5 },                          level: 11, goldValue: 360,  emoji: '💍' },
  { id: 'ring_ancient',   name: 'Starożytny Pierścień', slot: 'ring', rarity: 'rare',     stats: { strength: 6, intelligence: 6, agility: 4 },              level: 15, goldValue: 620,  emoji: '💍' },
  { id: 'ring_dragon',    name: 'Smocze Oko',        slot: 'ring',   rarity: 'epic',      stats: { strength: 14, constitution: 10 },                        level: 22, goldValue: 2400, emoji: '💍' },
  { id: 'ring_lich',      name: 'Pierścień Lisza',   slot: 'ring',   rarity: 'epic',      stats: { intelligence: 18, constitution: 8 },                     level: 24, goldValue: 2800, emoji: '💍' },
  { id: 'ring_void',      name: 'Pierścień Pustki',  slot: 'ring',   rarity: 'legendary', stats: { strength: 20, intelligence: 20, agility: 10 },           level: 35, goldValue: 8500, emoji: '💍' },

  // ── Amulets ───────────────────────────────────────────────────────────────
  { id: 'amulet_iron',    name: 'Żelazny Amulet',    slot: 'amulet', rarity: 'common',    stats: { constitution: 1 },                                       level: 1,  goldValue: 15,   emoji: '📿' },
  { id: 'amulet_bone',    name: 'Kościany Amulet',   slot: 'amulet', rarity: 'common',    stats: { constitution: 2 },                                       level: 1,  goldValue: 22,   emoji: '📿' },
  { id: 'amulet_wolf',    name: 'Wilczy Amulet',     slot: 'amulet', rarity: 'common',    stats: { strength: 2 },                                           level: 3,  goldValue: 35,   emoji: '📿' },
  { id: 'amulet_crystal', name: 'Kryształowy Amulet', slot: 'amulet', rarity: 'uncommon', stats: { intelligence: 5 },                                       level: 5,  goldValue: 95,   emoji: '📿' },
  { id: 'amulet_iron_will', name: 'Amulet Żelaznej Woli', slot: 'amulet', rarity: 'uncommon', stats: { constitution: 6 },                                  level: 6,  goldValue: 110,  emoji: '📿' },
  { id: 'amulet_arcane',  name: 'Amulet Arkaniki',   slot: 'amulet', rarity: 'rare',      stats: { intelligence: 11 },                                      level: 9,  goldValue: 340,  emoji: '📿' },
  { id: 'amulet_shadow',  name: 'Amulet Mroku',      slot: 'amulet', rarity: 'rare',      stats: { agility: 8, intelligence: 6 },                           level: 11, goldValue: 420,  emoji: '📿' },
  { id: 'amulet_berserker', name: 'Amulet Berserkera', slot: 'amulet', rarity: 'rare',    stats: { strength: 12, constitution: -2 },                        level: 13, goldValue: 480,  emoji: '📿' },
  { id: 'amulet_phoenix', name: 'Feniks Amulet',     slot: 'amulet', rarity: 'epic',      stats: { constitution: 16, strength: 8 },                         level: 20, goldValue: 2000, emoji: '🔥' },
  { id: 'amulet_dragon',  name: 'Smocze Serce',      slot: 'amulet', rarity: 'legendary', stats: { strength: 18, intelligence: 18 },                        level: 27, goldValue: 4800, emoji: '🔥' },
  { id: 'amulet_cosmos',  name: 'Amulet Kosmosu',    slot: 'amulet', rarity: 'legendary', stats: { strength: 15, intelligence: 15, constitution: 15, agility: 10 }, level: 35, goldValue: 11000, emoji: '🌟' },
];

export function getItemById(id: string): Item | undefined {
  return ALL_ITEMS.find(i => i.id === id);
}

// Seeded LCG random — returns 0..1, mutates the seed value
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

  // Pick rarity for a slot. featuredSlot = last slot, boosted chance
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

    // Fall back to adjacent rarities if pool is empty
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
