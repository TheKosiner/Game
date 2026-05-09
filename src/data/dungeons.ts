import type { Dungeon } from '../types';

export const ALL_DUNGEONS: Dungeon[] = [
  {
    id: 'forest',
    name: 'Slumsy',
    emoji: '🏚️',
    minLevel: 1,
    description: 'Zdegradowane dzielnice pełne gangsterów i dronów patrolowych. Dobre miejsce dla zielonych.',
    floors: 5,
    enemies: ['street_punk', 'patrol_drone', 'enforcer', 'gangster'],
  },
  {
    id: 'cave',
    name: 'Technologiczne Podziemia',
    emoji: '⚡',
    minLevel: 5,
    description: 'Podziemne serwery i fabryki androidów. Zamieszkałe przez drony i bojowe maszyny.',
    floors: 8,
    enemies: ['spy_drone', 'combat_android', 'heavy_mech'],
  },
  {
    id: 'castle',
    name: 'Korporacyjne HQ',
    emoji: '🏢',
    minLevel: 10,
    description: 'Wieżowiec megakorpu opanowany przez cyberzabójców i zbuntowane AI.',
    floors: 10,
    enemies: ['corp_assassin', 'rogue_ai', 'cyber_titan'],
  },
  {
    id: 'dragon_lair',
    name: 'Twierdza Megakorpu',
    emoji: '🖥️',
    minLevel: 20,
    description: 'Centrum dowodzenia globalnej korporacji. Tylko najdzielniejsi hakerzy tu wchodzą.',
    floors: 12,
    enemies: ['war_mech', 'nuclear_drone', 'mega_ai'],
  },
];
