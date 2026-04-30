import type { Dungeon } from '../types';

export const ALL_DUNGEONS: Dungeon[] = [
  {
    id: 'forest',
    name: 'Przeklęty Las',
    emoji: '🌲',
    minLevel: 1,
    description: 'Stary las pełen goblinów i wilków. Dobre miejsce dla początkujących.',
    floors: 5,
    enemies: ['goblin', 'wolf', 'orc', 'bandit'],
  },
  {
    id: 'cave',
    name: 'Jaskinia Grobowca',
    emoji: '⛏️',
    minLevel: 5,
    description: 'Głęboka jaskinia zamieszkana przez szkielety i trolle.',
    floors: 8,
    enemies: ['bat', 'skeleton', 'troll'],
  },
  {
    id: 'castle',
    name: 'Mroczny Zamek',
    emoji: '🏰',
    minLevel: 10,
    description: 'Starożytny zamek opanowany przez nieumarłych i mrocznych rycerzy.',
    floors: 10,
    enemies: ['vampire', 'lich', 'dark_knight'],
  },
  {
    id: 'dragon_lair',
    name: 'Smocze Legowisko',
    emoji: '🐉',
    minLevel: 20,
    description: 'Ogniste piekło. Tylko najdzielniejsi śmiałkowie tu wchodzą.',
    floors: 12,
    enemies: ['wyvern', 'fire_elemental', 'dragon'],
  },
];
