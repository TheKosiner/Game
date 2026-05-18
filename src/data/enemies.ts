import type { Enemy } from '../types';

export const ALL_ENEMIES: Enemy[] = [
  // ── Slumsy (lvl 1–4) ──────────────────────────────────────────────────────
  { id: 'scavenger',          name: 'Złomiarz',                  emoji: '🧰',  level: 1,  hp: 18,   maxHp: 18,   attack: 3,   defense: 1,  xpReward: 8,    goldReward: 4,   lootTable: [] },
  { id: 'street_punk',        name: 'Uliczny Szczur',            emoji: '🧑‍💻', level: 1,  hp: 20,   maxHp: 20,   attack: 4,   defense: 1,  xpReward: 10,   goldReward: 5,   lootTable: [] },
  { id: 'mutant_rat',         name: 'Zmutowany Szczur',          emoji: '🐀',  level: 2,  hp: 28,   maxHp: 28,   attack: 6,   defense: 2,  xpReward: 14,   goldReward: 7,   lootTable: [] },
  { id: 'patrol_drone',       name: 'Dron Patrolowy',            emoji: '🚁',  level: 2,  hp: 30,   maxHp: 30,   attack: 6,   defense: 2,  xpReward: 15,   goldReward: 7,   lootTable: [] },
  { id: 'street_hacker',      name: 'Uliczny Haker',             emoji: '💻',  level: 3,  hp: 38,   maxHp: 38,   attack: 8,   defense: 2,  xpReward: 19,   goldReward: 10,  lootTable: [] },
  { id: 'enforcer',           name: 'Ochroniarz',                emoji: '🕵️', level: 3,  hp: 45,   maxHp: 45,   attack: 9,   defense: 4,  xpReward: 22,   goldReward: 12,  lootTable: [] },
  { id: 'gangster',           name: 'Gangster',                  emoji: '🦹',  level: 4,  hp: 55,   maxHp: 55,   attack: 11,  defense: 5,  xpReward: 28,   goldReward: 18,  lootTable: [] },
  { id: 'gang_leader',        name: 'Szef Gangu',                emoji: '😈',  level: 4,  hp: 65,   maxHp: 65,   attack: 13,  defense: 6,  xpReward: 34,   goldReward: 22,  lootTable: [] },

  // ── Technologiczne Podziemia (lvl 5–9) ────────────────────────────────────
  { id: 'laser_turret',       name: 'Wieżyczka Laserowa',        emoji: '🔦',  level: 5,  hp: 55,   maxHp: 55,   attack: 12,  defense: 8,  xpReward: 38,   goldReward: 22,  lootTable: [] },
  { id: 'spy_drone',          name: 'Szpiegowski Dron',          emoji: '🛸',  level: 5,  hp: 60,   maxHp: 60,   attack: 13,  defense: 6,  xpReward: 40,   goldReward: 24,  lootTable: [] },
  { id: 'nano_swarm',         name: 'Rój Nano-Dronów',           emoji: '🐝',  level: 6,  hp: 65,   maxHp: 65,   attack: 14,  defense: 5,  xpReward: 44,   goldReward: 28,  lootTable: [] },
  { id: 'combat_android',     name: 'Bojowy Android',            emoji: '🤖',  level: 6,  hp: 70,   maxHp: 70,   attack: 15,  defense: 8,  xpReward: 48,   goldReward: 30,  lootTable: [] },
  { id: 'cyber_dog',          name: 'Cybernetyczny Pies',        emoji: '🐕',  level: 7,  hp: 80,   maxHp: 80,   attack: 17,  defense: 9,  xpReward: 58,   goldReward: 35,  lootTable: [] },
  { id: 'electric_golem',     name: 'Golem Elektryczny',         emoji: '⚡',  level: 8,  hp: 95,   maxHp: 95,   attack: 19,  defense: 11, xpReward: 65,   goldReward: 40,  lootTable: [] },
  { id: 'heavy_mech',         name: 'Ciężki Mech',               emoji: '🦿',  level: 8,  hp: 100,  maxHp: 100,  attack: 20,  defense: 12, xpReward: 70,   goldReward: 42,  lootTable: [] },

  // ── Korporacyjne HQ (lvl 10–18) ───────────────────────────────────────────
  { id: 'security_android',   name: 'Android Ochrony',           emoji: '🤖',  level: 10, hp: 130,  maxHp: 130,  attack: 28,  defense: 15, xpReward: 95,   goldReward: 60,  lootTable: [] },
  { id: 'corp_assassin',      name: 'Korporacyjny Zabójca',      emoji: '🥷',  level: 10, hp: 130,  maxHp: 130,  attack: 28,  defense: 15, xpReward: 95,   goldReward: 60,  lootTable: [] },
  { id: 'corp_sniper',        name: 'Snajper Korporacyjny',      emoji: '🎯',  level: 12, hp: 120,  maxHp: 120,  attack: 35,  defense: 12, xpReward: 105,  goldReward: 68,  lootTable: [] },
  { id: 'holo_guardian',      name: 'Holograficzny Strażnik',    emoji: '👁️', level: 14, hp: 170,  maxHp: 170,  attack: 38,  defense: 18, xpReward: 130,  goldReward: 84,  lootTable: [] },
  { id: 'rogue_ai',           name: 'Zbuntowane AI',             emoji: '👾',  level: 14, hp: 180,  maxHp: 180,  attack: 38,  defense: 18, xpReward: 140,  goldReward: 90,  lootTable: [] },
  { id: 'cyber_titan',        name: 'Cybernetyczny Tytan',       emoji: '🦾',  level: 18, hp: 250,  maxHp: 250,  attack: 50,  defense: 25, xpReward: 185,  goldReward: 120, lootTable: [] },
  { id: 'exec_hunter',        name: 'Łowca Dyrektorów',          emoji: '💼',  level: 18, hp: 240,  maxHp: 240,  attack: 52,  defense: 22, xpReward: 180,  goldReward: 118, lootTable: [] },

  // ── Pustkowia (lvl 14–22) ─────────────────────────────────────────────────
  { id: 'wasteland_raider',   name: 'Rajder z Pustkowi',         emoji: '💀',  level: 14, hp: 185,  maxHp: 185,  attack: 40,  defense: 18, xpReward: 140,  goldReward: 90,  lootTable: [] },
  { id: 'ghul',               name: 'Ghul',                      emoji: '🧟',  level: 15, hp: 200,  maxHp: 200,  attack: 42,  defense: 20, xpReward: 155,  goldReward: 100, lootTable: [] },
  { id: 'mutant_spider',      name: 'Zmutowany Pająk',           emoji: '🕷️', level: 16, hp: 210,  maxHp: 210,  attack: 44,  defense: 20, xpReward: 162,  goldReward: 105, lootTable: [] },
  { id: 'zmutowany_karaluch', name: 'Zmutowany Karaluch',        emoji: '🪳',  level: 17, hp: 230,  maxHp: 230,  attack: 48,  defense: 22, xpReward: 175,  goldReward: 115, lootTable: [] },
  { id: 'cyber_wolf',         name: 'Cyberwilk',                 emoji: '🐺',  level: 19, hp: 275,  maxHp: 275,  attack: 55,  defense: 26, xpReward: 210,  goldReward: 138, lootTable: [] },
  { id: 'zmutowany_niedzwiedz', name: 'Zmutowany Niedźwiedź',    emoji: '🐻',  level: 21, hp: 330,  maxHp: 330,  attack: 62,  defense: 30, xpReward: 248,  goldReward: 160, lootTable: [] },
  { id: 'sand_golem',         name: 'Golem Radioaktywny',        emoji: '☢️',  level: 22, hp: 360,  maxHp: 360,  attack: 68,  defense: 34, xpReward: 270,  goldReward: 175, lootTable: [] },

  // ── Twierdza Megakorpu (lvl 22–32) ────────────────────────────────────────
  { id: 'war_mech',           name: 'Mech Wojenny',              emoji: '🤖',  level: 22, hp: 350,  maxHp: 350,  attack: 65,  defense: 32, xpReward: 255,  goldReward: 165, lootTable: [] },
  { id: 'assault_mech',       name: 'Mech Szturmowy',            emoji: '🦿',  level: 24, hp: 400,  maxHp: 400,  attack: 72,  defense: 38, xpReward: 290,  goldReward: 192, lootTable: [] },
  { id: 'nuclear_drone',      name: 'Nuklearny Dron',            emoji: '☢️',  level: 26, hp: 450,  maxHp: 450,  attack: 80,  defense: 35, xpReward: 325,  goldReward: 215, lootTable: [] },
  { id: 'corp_general',       name: 'Generał Korporacji',        emoji: '👔',  level: 28, hp: 550,  maxHp: 550,  attack: 96,  defense: 44, xpReward: 415,  goldReward: 285, lootTable: [] },
  { id: 'prototype_ai',       name: 'Prototypowe AI',            emoji: '🧠',  level: 30, hp: 650,  maxHp: 650,  attack: 110, defense: 50, xpReward: 530,  goldReward: 380, lootTable: [] },
  { id: 'mega_ai',            name: 'Superkomputer Megakorpu',   emoji: '🖥️', level: 30, hp: 700,  maxHp: 700,  attack: 110, defense: 50, xpReward: 580,  goldReward: 420, lootTable: [] },

  // ── Neon Undercity — nowa strefa (lvl 30–45) ──────────────────────────────
  { id: 'shadow_agent',       name: 'Agent Cienia',              emoji: '🥷',  level: 30, hp: 650,  maxHp: 650,  attack: 100, defense: 48, xpReward: 540,  goldReward: 390, lootTable: [] },
  { id: 'neon_predator',      name: 'Neonowy Drapieżnik',        emoji: '🐆',  level: 32, hp: 750,  maxHp: 750,  attack: 115, defense: 52, xpReward: 620,  goldReward: 450, lootTable: [] },
  { id: 'cyber_demon',        name: 'Cybernetyczny Demon',       emoji: '👹',  level: 34, hp: 900,  maxHp: 900,  attack: 130, defense: 55, xpReward: 720,  goldReward: 520, lootTable: [] },
  { id: 'quantum_ghost',      name: 'Kwantowy Duch',             emoji: '👻',  level: 36, hp: 1050, maxHp: 1050, attack: 145, defense: 60, xpReward: 820,  goldReward: 600, lootTable: [] },
  { id: 'neon_dragon',        name: 'Neonowy Smok',              emoji: '🐉',  level: 40, hp: 1400, maxHp: 1400, attack: 180, defense: 75, xpReward: 1100, goldReward: 800, lootTable: [] },
  { id: 'omega_unit',         name: 'Jednostka Omega',           emoji: '⚡',  level: 45, hp: 2000, maxHp: 2000, attack: 220, defense: 90, xpReward: 1600, goldReward: 1200,lootTable: [] },

  // ── Magiczne (rozrzucone po wszystkich strefach) ───────────────────────────
  // Strefa 2: Technologiczne Podziemia
  { id: 'psi_drone',          name: 'Dron Psi',                  emoji: '🌀',  level: 6,  hp: 70,   maxHp: 70,   attack: 8,   defense: 4,  xpReward: 52,   goldReward: 32,  lootTable: [], magicAttack: 18, magicResistance: 12 },
  { id: 'nano_witch',         name: 'Nano-Czarownica',           emoji: '🧙',  level: 8,  hp: 85,   maxHp: 85,   attack: 8,   defense: 5,  xpReward: 65,   goldReward: 40,  lootTable: [], magicAttack: 24, magicResistance: 16 },

  // Strefa 3: Korporacyjne HQ
  { id: 'energy_phantom',     name: 'Fantom Energetyczny',       emoji: '👁️', level: 11, hp: 140,  maxHp: 140,  attack: 15,  defense: 10, xpReward: 100,  goldReward: 65,  lootTable: [], magicAttack: 32, magicResistance: 22 },
  { id: 'quantum_mage',       name: 'Kwantowy Mag',              emoji: '🌀',  level: 14, hp: 170,  maxHp: 170,  attack: 18,  defense: 12, xpReward: 130,  goldReward: 85,  lootTable: [], magicAttack: 42, magicResistance: 28 },
  { id: 'psi_hacker',         name: 'Psi-Haker',                 emoji: '🧙',  level: 17, hp: 210,  maxHp: 210,  attack: 22,  defense: 14, xpReward: 165,  goldReward: 108, lootTable: [], magicAttack: 54, magicResistance: 32 },

  // Strefa 4: Pustkowia
  { id: 'arcane_golem',       name: 'Golem Arkański',            emoji: '🗿',  level: 20, hp: 290,  maxHp: 290,  attack: 28,  defense: 16, xpReward: 195,  goldReward: 130, lootTable: [], magicAttack: 65, magicResistance: 40 },
  { id: 'void_specter',       name: 'Widmo Próżni',              emoji: '👻',  level: 24, hp: 380,  maxHp: 380,  attack: 32,  defense: 18, xpReward: 250,  goldReward: 165, lootTable: [], magicAttack: 82, magicResistance: 50 },

  // Strefa 5: Twierdza Megakorpu
  { id: 'cyber_warlock',      name: 'Cyber-Czarnoksiężnik',      emoji: '🧙',  level: 26, hp: 480,  maxHp: 480,  attack: 40,  defense: 22, xpReward: 340,  goldReward: 230, lootTable: [], magicAttack: 100, magicResistance: 58 },
  { id: 'arcane_titan',       name: 'Arkanowy Tytan',            emoji: '🗿',  level: 30, hp: 680,  maxHp: 680,  attack: 55,  defense: 28, xpReward: 490,  goldReward: 350, lootTable: [], magicAttack: 125, magicResistance: 70 },

  // Strefa 6: Neon Undercity (magia)
  { id: 'void_dragon',        name: 'Smok Próżni',               emoji: '🐉',  level: 38, hp: 1150, maxHp: 1150, attack: 60,  defense: 35, xpReward: 940,  goldReward: 680, lootTable: [], magicAttack: 165, magicResistance: 88 },
  { id: 'arcane_omega',       name: 'Arkanowa Jednostka Omega',  emoji: '🌀',  level: 44, hp: 1800, maxHp: 1800, attack: 80,  defense: 45, xpReward: 1450, goldReward: 1050,lootTable: [], magicAttack: 210, magicResistance: 105 },

  // ── Strefa Zero (lvl 40–52) ───────────────────────────────────────────────
  { id: 'spec_ops_soldier',   name: 'Żołnierz Spec Ops',         emoji: '🪖',  level: 40, hp: 1300, maxHp: 1300, attack: 185, defense: 80, xpReward: 1200, goldReward: 880, lootTable: [] },
  { id: 'bio_hazard_unit',    name: 'Jednostka Biohazard',        emoji: '☣️', level: 42, hp: 1500, maxHp: 1500, attack: 200, defense: 85, xpReward: 1350, goldReward: 990, lootTable: [] },
  { id: 'nano_berserker',     name: 'Nano-Berserk',               emoji: '💢',  level: 44, hp: 1700, maxHp: 1700, attack: 220, defense: 90, xpReward: 1500, goldReward: 1100,lootTable: [] },
  { id: 'plasma_guard',       name: 'Strażnik Plazmowy',          emoji: '🔆',  level: 46, hp: 1900, maxHp: 1900, attack: 240, defense: 95, xpReward: 1650, goldReward: 1200,lootTable: [] },
  { id: 'apex_predator',      name: 'Drapieżnik Apex',            emoji: '🦅',  level: 48, hp: 2200, maxHp: 2200, attack: 260, defense: 100,xpReward: 1850, goldReward: 1400,lootTable: [] },
  { id: 'zero_commander',     name: 'Komandant Strefy Zero',      emoji: '⭐',  level: 52, hp: 2800, maxHp: 2800, attack: 300, defense: 115,xpReward: 2200, goldReward: 1700,lootTable: [] },
  { id: 'psi_storm',          name: 'Burza Psi',                  emoji: '🌪️', level: 43, hp: 1400, maxHp: 1400, attack: 50,  defense: 60, xpReward: 1380, goldReward: 1000,lootTable: [], magicAttack: 290, magicResistance: 120 },

  // ── Sieć Widm (lvl 55–70) ────────────────────────────────────────────────
  { id: 'digital_phantom',    name: 'Cyfrowy Fantom',             emoji: '👁️', level: 55, hp: 3200, maxHp: 3200, attack: 340, defense: 125,xpReward: 2600, goldReward: 2000,lootTable: [] },
  { id: 'quantum_assassin',   name: 'Kwantowy Zabójca',           emoji: '⚔️', level: 58, hp: 3600, maxHp: 3600, attack: 375, defense: 130,xpReward: 2900, goldReward: 2250,lootTable: [] },
  { id: 'network_titan',      name: 'Tytan Sieci',                emoji: '🗼',  level: 62, hp: 4200, maxHp: 4200, attack: 420, defense: 140,xpReward: 3400, goldReward: 2700,lootTable: [] },
  { id: 'code_reaper',        name: 'Żniwiarz Kodu',              emoji: '💀',  level: 65, hp: 5000, maxHp: 5000, attack: 480, defense: 152,xpReward: 4000, goldReward: 3200,lootTable: [] },
  { id: 'ghost_overlord',     name: 'Władca Widm',                emoji: '👑',  level: 70, hp: 6500, maxHp: 6500, attack: 560, defense: 170,xpReward: 5200, goldReward: 4200,lootTable: [] },
  { id: 'void_weaver',        name: 'Tkacz Próżni',               emoji: '🕸️', level: 60, hp: 3800, maxHp: 3800, attack: 80,  defense: 100,xpReward: 3100, goldReward: 2450,lootTable: [], magicAttack: 450, magicResistance: 175 },
  { id: 'arcane_ghost',       name: 'Arkaiczny Duch',             emoji: '👻',  level: 68, hp: 5500, maxHp: 5500, attack: 100, defense: 130,xpReward: 4600, goldReward: 3700,lootTable: [], magicAttack: 600, magicResistance: 220 },
];

export function getEnemyById(id: string): Enemy | undefined {
  return ALL_ENEMIES.find(e => e.id === id);
}

export function scaleEnemy(enemy: Enemy, floor: number): Enemy {
  const scale = 1 + (floor - 1) * 0.15;
  return {
    ...enemy,
    hp: Math.round(enemy.maxHp * scale),
    maxHp: Math.round(enemy.maxHp * scale),
    attack: Math.round(enemy.attack * scale),
    defense: Math.round(enemy.defense * scale),
    xpReward: Math.round(enemy.xpReward * scale),
    goldReward: Math.round(enemy.goldReward * scale),
    magicAttack:     enemy.magicAttack     ? Math.round(enemy.magicAttack * scale)     : undefined,
    magicResistance: enemy.magicResistance ? Math.round(enemy.magicResistance * scale) : undefined,
  };
}
