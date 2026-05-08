import type { Quest } from '../types';

export const ALL_QUESTS: Quest[] = [
  { id: 'patrol', name: 'Patrol Wioski', description: 'Obejdź wioskę i upewnij się, że jest bezpieczna.', durationMs: 60_000, xpReward: 35, goldReward: 25, minLevel: 1, emoji: '🏘️' },
  { id: 'herbs', name: 'Zbiór Ziół', description: 'Zbierz lecznicze zioła w okolicy.', durationMs: 90_000, xpReward: 50, goldReward: 30, minLevel: 1, emoji: '🌿' },
  { id: 'escort', name: 'Eskorta Kupca', description: 'Eskortuj kupca do sąsiedniego miasta.', durationMs: 120_000, xpReward: 80, goldReward: 60, minLevel: 2, emoji: '🐴' },
  { id: 'bandits', name: 'Trop Bandytów', description: 'Wytropisz kryjówkę bandytów i zniszcz ją.', durationMs: 180_000, xpReward: 140, goldReward: 110, minLevel: 4, emoji: '🗺️' },
  { id: 'ruins', name: 'Eksploracja Ruin', description: 'Zbadaj starożytne ruiny i przynieś artefakty.', durationMs: 300_000, xpReward: 250, goldReward: 200, minLevel: 7, emoji: '🏛️' },
  { id: 'monster_hunt', name: 'Polowanie na Potwora', description: 'Znajdź i pokonaj potwora terroryzującego okolice.', durationMs: 600_000, xpReward: 500, goldReward: 400, minLevel: 10, emoji: '🎯' },
  { id: 'necromancer', name: 'Nekromanta', description: 'Zniszcz nekromantę i jego armię nieumarłych.', durationMs: 900_000, xpReward: 850, goldReward: 700, minLevel: 15, emoji: '💀' },
  { id: 'dragon_egg', name: 'Jajo Smoka', description: 'Odzyskaj skradzione smocze jajo z gniazda wyverna.', durationMs: 1_800_000, xpReward: 1600, goldReward: 1400, minLevel: 20, emoji: '🥚' },
];
