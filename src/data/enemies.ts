import type { Enemy } from '../types';

export const ALL_ENEMIES: Enemy[] = [
  // Slumsy (Slums)
  { id: 'street_punk',    name: 'Uliczny Szczur',           emoji: '🧑‍💻', level: 1,  hp: 20,  maxHp: 20,  attack: 4,   defense: 1,  xpReward: 10,  goldReward: 5,   lootTable: ['implant_endure', 'boots_runner'] },
  { id: 'patrol_drone',   name: 'Dron Patrolowy',           emoji: '🚁',  level: 2,  hp: 30,  maxHp: 30,  attack: 6,   defense: 2,  xpReward: 15,  goldReward: 7,   lootTable: ['boots_runner'] },
  { id: 'enforcer',       name: 'Ochroniarz',               emoji: '🕵️', level: 3,  hp: 45,  maxHp: 45,  attack: 9,   defense: 4,  xpReward: 22,  goldReward: 12,  lootTable: ['helmet_combat', 'blade_mono'] },
  { id: 'gangster',       name: 'Gangster',                 emoji: '🦹',  level: 4,  hp: 55,  maxHp: 55,  attack: 11,  defense: 5,  xpReward: 28,  goldReward: 18,  lootTable: ['knife_mono', 'vest_tactical'] },

  // Technologiczne Podziemia (Tech Underbelly)
  { id: 'spy_drone',      name: 'Szpiegowski Dron',         emoji: '🛸',  level: 5,  hp: 60,  maxHp: 60,  attack: 13,  defense: 6,  xpReward: 40,  goldReward: 24,  lootTable: ['chip_hacking'] },
  { id: 'combat_android', name: 'Bojowy Android',           emoji: '🤖',  level: 6,  hp: 70,  maxHp: 70,  attack: 15,  defense: 8,  xpReward: 48,  goldReward: 30,  lootTable: ['blade_plasma', 'helmet_tactical'] },
  { id: 'heavy_mech',     name: 'Ciężki Mech',              emoji: '🦿',  level: 8,  hp: 100, maxHp: 100, attack: 20,  defense: 12, xpReward: 70,  goldReward: 42,  lootTable: ['suit_combat', 'boots_combat'] },

  // Korporacyjne HQ (Corporate HQ)
  { id: 'corp_assassin',  name: 'Korporacyjny Zabójca',     emoji: '🥷',  level: 10, hp: 130, maxHp: 130, attack: 28,  defense: 15, xpReward: 95,  goldReward: 60,  lootTable: ['blade_stealth', 'suit_cyber'] },
  { id: 'rogue_ai',       name: 'Zbuntowane AI',            emoji: '👾',  level: 14, hp: 180, maxHp: 180, attack: 38,  defense: 18, xpReward: 140, goldReward: 90,  lootTable: ['sniper_longrange', 'suit_netrunner', 'implant_power'] },
  { id: 'cyber_titan',    name: 'Cybernetyczny Tytan',      emoji: '🦾',  level: 18, hp: 250, maxHp: 250, attack: 50,  defense: 25, xpReward: 185, goldReward: 120, lootTable: ['suit_stealth', 'blade_disruptor'] },

  // Pustkowia
  { id: 'Ghul',  name: 'Ghul',     emoji: '🧟',  level: 14, hp: 180, maxHp: 180, attack: 38,  defense: 18, xpReward: 140, goldReward: 90,  lootTable: ['sniper_longrange', 'suit_netrunner', 'implant_power'] },
  { id: 'zmutowany_karaluch',       name: 'Zmutowany Karaluch',            emoji: '🪳',  level: 18, hp: 250, maxHp: 250, attack: 50,  defense: 25, xpReward: 185, goldReward: 120, lootTable: ['suit_stealth', 'blade_disruptor'] },
  { id: 'zmutowany_niedzwiedz',    name: 'Zmutowany Niedzwiedź',      emoji: '🐻',  level: 22, hp: 350, maxHp: 350, attack: 65,  defense: 32, xpReward: 255, goldReward: 165, lootTable: ['boots_jet', 'amplifier_signal'] },


  // Twierdza Megakorpu (Megacorp Fortress)
  { id: 'war_mech',       name: 'Mech Wojenny',             emoji: '🤖',  level: 22, hp: 350, maxHp: 350, attack: 65,  defense: 32, xpReward: 255, goldReward: 165, lootTable: ['boots_jet', 'amplifier_signal'] },
  { id: 'nuclear_drone',  name: 'Nuklearny Dron',           emoji: '☢️',  level: 26, hp: 450, maxHp: 450, attack: 80,  defense: 35, xpReward: 325, goldReward: 215, lootTable: ['core_megacorp', 'blade_titan'] },
  { id: 'mega_ai',        name: 'Superkomputer Megakorpu',  emoji: '🖥️', level: 30, hp: 700, maxHp: 700, attack: 110, defense: 50, xpReward: 580, goldReward: 420, lootTable: ['blade_titan', 'helmet_megacorp', 'core_megacorp'] },
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
  };
}
