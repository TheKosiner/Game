import type { Quest } from '../types';

export const ALL_QUESTS: Quest[] = [
  { id: 'patrol',       name: 'Patrol Sektora',      description: 'Obejdź sektor i upewnij się, że jest bezpieczny.',               durationMs: 60_000,    xpReward: 35,   goldReward: 25,   minLevel: 1,  emoji: '🏚️' },
  { id: 'herbs',        name: 'Odzysk Nanoleków',    description: 'Zbierz nanoleki z porzuconych laboratoriów w okolicy.',           durationMs: 90_000,    xpReward: 50,   goldReward: 30,   minLevel: 1,  emoji: '💉' },
  { id: 'escort',       name: 'Eskorta Konwoju',     description: 'Eskortuj konwój danych do sąsiedniego węzła sieciowego.',         durationMs: 120_000,   xpReward: 80,   goldReward: 60,   minLevel: 2,  emoji: '🚛' },
  { id: 'bandits',      name: 'Trop Gangu',          description: 'Wytropisz kryjówkę gangu i zniszcz ich bazy danych.',             durationMs: 180_000,   xpReward: 140,  goldReward: 110,  minLevel: 4,  emoji: '🗺️' },
  { id: 'ruins',        name: 'Eksploracja Serwera', description: 'Zbadaj stary serwer korporacyjny i wydobądź cenne dane.',         durationMs: 300_000,   xpReward: 250,  goldReward: 200,  minLevel: 7,  emoji: '💻' },
  { id: 'monster_hunt', name: 'Polowanie na Drona',  description: 'Znajdź i zniszcz drona terroryzującego dzielnicę.',              durationMs: 600_000,   xpReward: 500,  goldReward: 400,  minLevel: 10, emoji: '🎯' },
  { id: 'necromancer',  name: 'Zbuntowane AI',       description: 'Zneutralizuj zbuntowane AI i jego armię androidów.',              durationMs: 900_000,   xpReward: 850,  goldReward: 700,  minLevel: 15, emoji: '👾' },
  { id: 'dragon_egg',   name: 'Rdzeń Danych',        description: 'Odzyskaj skradziony rdzeń danych z siedziby korporacji.',        durationMs: 1_800_000, xpReward: 1600, goldReward: 1400, minLevel: 20, emoji: '💾' },
];
