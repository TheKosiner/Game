import type { Item } from '../types';

export const ALL_ITEMS: Item[] = [
  // Weapons
  { id: 'sword_iron', name: 'Żelazny Miecz', slot: 'weapon', rarity: 'common', stats: { strength: 2 }, attackBonus: 5, level: 1, goldValue: 30, emoji: '⚔️' },
  { id: 'sword_steel', name: 'Stalowy Miecz', slot: 'weapon', rarity: 'uncommon', stats: { strength: 5 }, attackBonus: 12, level: 5, goldValue: 120, emoji: '⚔️' },
  { id: 'sword_silver', name: 'Srebrny Miecz', slot: 'weapon', rarity: 'rare', stats: { strength: 8, agility: 3 }, attackBonus: 22, level: 10, goldValue: 400, emoji: '⚔️' },
  { id: 'sword_rune', name: 'Runiczny Miecz', slot: 'weapon', rarity: 'epic', stats: { strength: 15, constitution: 5 }, attackBonus: 38, level: 18, goldValue: 1200, emoji: '🗡️' },
  { id: 'sword_dragon', name: 'Smocze Ostrze', slot: 'weapon', rarity: 'legendary', stats: { strength: 25, agility: 10 }, attackBonus: 65, level: 30, goldValue: 5000, emoji: '🗡️' },
  { id: 'staff_wood', name: 'Drewniany Różdżka', slot: 'weapon', rarity: 'common', stats: { intelligence: 3 }, attackBonus: 4, level: 1, goldValue: 25, emoji: '🪄' },
  { id: 'staff_arcane', name: 'Magiczna Laska', slot: 'weapon', rarity: 'uncommon', stats: { intelligence: 7 }, attackBonus: 10, level: 5, goldValue: 110, emoji: '🪄' },
  { id: 'staff_elder', name: 'Laska Starszyzny', slot: 'weapon', rarity: 'rare', stats: { intelligence: 12, constitution: 4 }, attackBonus: 20, level: 12, goldValue: 450, emoji: '🔮' },
  { id: 'dagger_iron', name: 'Żelazny Sztylet', slot: 'weapon', rarity: 'common', stats: { agility: 3 }, attackBonus: 6, level: 1, goldValue: 28, emoji: '🔪' },
  { id: 'dagger_shadow', name: 'Cień Nocy', slot: 'weapon', rarity: 'rare', stats: { agility: 10, strength: 4 }, attackBonus: 24, level: 11, goldValue: 420, emoji: '🔪' },
  { id: 'bow_short', name: 'Krótki Łuk', slot: 'weapon', rarity: 'common', stats: { agility: 2 }, attackBonus: 5, level: 1, goldValue: 32, emoji: '🏹' },

  // Armor
  { id: 'armor_leather', name: 'Skórzana Zbroja', slot: 'armor', rarity: 'common', stats: { constitution: 2 }, defenseBonus: 4, level: 1, goldValue: 35, emoji: '🛡️' },
  { id: 'armor_chainmail', name: 'Kolczuga', slot: 'armor', rarity: 'uncommon', stats: { constitution: 6 }, defenseBonus: 10, level: 5, goldValue: 130, emoji: '🛡️' },
  { id: 'armor_plate', name: 'Płytowa Zbroja', slot: 'armor', rarity: 'rare', stats: { constitution: 12, strength: 3 }, defenseBonus: 20, level: 10, goldValue: 500, emoji: '🛡️' },
  { id: 'armor_shadow', name: 'Zbroja Cieni', slot: 'armor', rarity: 'epic', stats: { agility: 10, constitution: 8 }, defenseBonus: 28, level: 20, goldValue: 1500, emoji: '🦾' },
  { id: 'robe_apprentice', name: 'Szata Ucznia', slot: 'armor', rarity: 'common', stats: { intelligence: 2 }, defenseBonus: 2, level: 1, goldValue: 20, emoji: '👘' },
  { id: 'robe_arcane', name: 'Arkanistyczna Szata', slot: 'armor', rarity: 'uncommon', stats: { intelligence: 6 }, defenseBonus: 6, level: 5, goldValue: 110, emoji: '👘' },

  // Helmets
  { id: 'helmet_iron', name: 'Żelazny Hełm', slot: 'helmet', rarity: 'common', stats: { constitution: 1 }, defenseBonus: 3, level: 1, goldValue: 20, emoji: '⛑️' },
  { id: 'helmet_steel', name: 'Stalowy Hełm', slot: 'helmet', rarity: 'uncommon', stats: { constitution: 4 }, defenseBonus: 7, level: 5, goldValue: 90, emoji: '⛑️' },
  { id: 'helmet_dragon', name: 'Smocza Korona', slot: 'helmet', rarity: 'legendary', stats: { constitution: 20, strength: 10 }, defenseBonus: 25, level: 25, goldValue: 4000, emoji: '👑' },
  { id: 'hood_shadow', name: 'Kaptur Cieni', slot: 'helmet', rarity: 'rare', stats: { agility: 8 }, defenseBonus: 5, level: 8, goldValue: 300, emoji: '🎭' },

  // Boots
  { id: 'boots_leather', name: 'Skórzane Buty', slot: 'boots', rarity: 'common', stats: { agility: 2 }, defenseBonus: 2, level: 1, goldValue: 18, emoji: '👢' },
  { id: 'boots_steel', name: 'Stalowe Buty', slot: 'boots', rarity: 'uncommon', stats: { agility: 4, constitution: 2 }, defenseBonus: 5, level: 5, goldValue: 80, emoji: '👢' },
  { id: 'boots_wind', name: 'Buty Wiatru', slot: 'boots', rarity: 'epic', stats: { agility: 15 }, defenseBonus: 8, level: 15, goldValue: 1000, emoji: '💨' },

  // Rings
  { id: 'ring_copper', name: 'Miedziany Pierścień', slot: 'ring', rarity: 'common', stats: { strength: 1 }, level: 1, goldValue: 15, emoji: '💍' },
  { id: 'ring_silver', name: 'Srebrny Pierścień', slot: 'ring', rarity: 'uncommon', stats: { intelligence: 4 }, level: 4, goldValue: 70, emoji: '💍' },
  { id: 'ring_power', name: 'Pierścień Mocy', slot: 'ring', rarity: 'rare', stats: { strength: 8, constitution: 4 }, level: 10, goldValue: 350, emoji: '💍' },

  // Amulets
  { id: 'amulet_bone', name: 'Kościany Amulet', slot: 'amulet', rarity: 'common', stats: { constitution: 2 }, level: 1, goldValue: 20, emoji: '📿' },
  { id: 'amulet_arcane', name: 'Amulet Arkaniki', slot: 'amulet', rarity: 'rare', stats: { intelligence: 10 }, level: 8, goldValue: 320, emoji: '📿' },
  { id: 'amulet_dragon', name: 'Smocze Serce', slot: 'amulet', rarity: 'legendary', stats: { strength: 15, intelligence: 15 }, level: 25, goldValue: 4500, emoji: '🔥' },
];

export function getItemById(id: string): Item | undefined {
  return ALL_ITEMS.find(i => i.id === id);
}

export function getItemsForLevel(level: number, count = 3): Item[] {
  const eligible = ALL_ITEMS.filter(i => i.level <= level + 3 && i.level >= Math.max(1, level - 3));
  const shuffled = [...eligible].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
