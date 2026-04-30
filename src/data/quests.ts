import type { Quest } from '../types';

export const ALL_QUESTS: Quest[] = [
  { id: 'patrol', name: 'Patrol Wioski', description: 'Obejdź wioskę i upewnij się, że jest bezpieczna.', durationMs: 60_000, xpReward: 30, goldReward: 20, minLevel: 1, emoji: '🏘️' },
  { id: 'herbs', name: 'Zbiór Ziół', description: 'Zbierz lecznicze zioła w okolicy.', durationMs: 90_000, xpReward: 40, goldReward: 15, minLevel: 1, emoji: '🌿' },
  { id: 'escort', name: 'Eskorta Kupca', description: 'Eskortuj kupca do sąsiedniego miasta.', durationMs: 120_000, xpReward: 60, goldReward: 45, minLevel: 2, emoji: '🐴' },
  { id: 'bandits', name: 'Trop Bandytów', description: 'Wytropisz kryjówkę bandytów i zniszcz ją.', durationMs: 180_000, xpReward: 100, goldReward: 80, minLevel: 4, emoji: '🗺️' },
  { id: 'ruins', name: 'Eksploracja Ruin', description: 'Zbadaj starożytne ruiny i przynieś artefakty.', durationMs: 300_000, xpReward: 180, goldReward: 150, minLevel: 7, emoji: '🏛️' },
  { id: 'monster_hunt', name: 'Polowanie na Potwora', description: 'Znajdź i pokonaj potwora terroryzującego okolice.', durationMs: 600_000, xpReward: 350, goldReward: 300, minLevel: 10, emoji: '🎯' },
  { id: 'necromancer', name: 'Nekromanta', description: 'Zniszcz nekromantę i jego armię nieumarłych.', durationMs: 900_000, xpReward: 600, goldReward: 500, minLevel: 15, emoji: '💀' },
  { id: 'dragon_egg', name: 'Jajo Smoka', description: 'Odzyskaj skradzione smocze jajo z gniazda wyverna.', durationMs: 1_800_000, xpReward: 1200, goldReward: 1000, minLevel: 20, emoji: '🥚' },
];
