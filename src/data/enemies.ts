import type { Enemy } from '../types';

export const ALL_ENEMIES: Enemy[] = [
  // Forest
  { id: 'goblin', name: 'Goblin', emoji: '👺', level: 1, hp: 20, maxHp: 20, attack: 4, defense: 1, xpReward: 10, goldReward: 5, lootTable: ['ring_copper', 'boots_leather'] },
  { id: 'wolf', name: 'Wilk', emoji: '🐺', level: 2, hp: 30, maxHp: 30, attack: 6, defense: 2, xpReward: 15, goldReward: 7, lootTable: ['boots_leather'] },
  { id: 'orc', name: 'Ork', emoji: '👹', level: 3, hp: 45, maxHp: 45, attack: 9, defense: 4, xpReward: 22, goldReward: 12, lootTable: ['helmet_iron', 'sword_iron'] },
  { id: 'bandit', name: 'Bandyta', emoji: '🦹', level: 4, hp: 55, maxHp: 55, attack: 11, defense: 5, xpReward: 28, goldReward: 18, lootTable: ['dagger_iron', 'armor_leather'] },

  // Cave
  { id: 'bat', name: 'Wampirzy Nietoperz', emoji: '🦇', level: 5, hp: 60, maxHp: 60, attack: 13, defense: 6, xpReward: 40, goldReward: 24, lootTable: ['ring_silver'] },
  { id: 'skeleton', name: 'Szkielet', emoji: '💀', level: 6, hp: 70, maxHp: 70, attack: 15, defense: 8, xpReward: 48, goldReward: 30, lootTable: ['sword_steel', 'helmet_steel'] },
  { id: 'troll', name: 'Troll', emoji: '🧌', level: 8, hp: 100, maxHp: 100, attack: 20, defense: 12, xpReward: 70, goldReward: 42, lootTable: ['armor_chainmail', 'boots_steel'] },

  // Dark Castle
  { id: 'vampire', name: 'Wampir', emoji: '🧛', level: 10, hp: 130, maxHp: 130, attack: 28, defense: 15, xpReward: 95, goldReward: 60, lootTable: ['dagger_shadow', 'staff_arcane'] },
  { id: 'lich', name: 'Lisz', emoji: '🦴', level: 14, hp: 180, maxHp: 180, attack: 38, defense: 18, xpReward: 140, goldReward: 90, lootTable: ['staff_elder', 'robe_arcane', 'ring_power'] },
  { id: 'dark_knight', name: 'Mroczny Rycerz', emoji: '🖤', level: 18, hp: 250, maxHp: 250, attack: 50, defense: 25, xpReward: 185, goldReward: 120, lootTable: ['armor_shadow', 'sword_rune'] },

  // Dragon Lair
  { id: 'wyvern', name: 'Wywern', emoji: '🐉', level: 22, hp: 350, maxHp: 350, attack: 65, defense: 32, xpReward: 255, goldReward: 165, lootTable: ['boots_wind', 'amulet_arcane'] },
  { id: 'fire_elemental', name: 'Żywiołak Ognia', emoji: '🔥', level: 26, hp: 450, maxHp: 450, attack: 80, defense: 35, xpReward: 325, goldReward: 215, lootTable: ['amulet_dragon', 'sword_dragon'] },
  { id: 'dragon', name: 'Starożytny Smok', emoji: '🐲', level: 30, hp: 700, maxHp: 700, attack: 110, defense: 50, xpReward: 580, goldReward: 420, lootTable: ['sword_dragon', 'helmet_dragon', 'amulet_dragon'] },
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
