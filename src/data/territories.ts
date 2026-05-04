export interface TerritoryDef {
  id: string;
  name: string;
  emoji: string;
  description: string;
  minLevel: number;
  dailyGold: number;
  dailyXp: number;
  guardianName: string;
  guardianEmoji: string;
  // Siege stats (require ~3 players at minLevel to defeat)
  siegeAtk: number;
  siegeDef: number;
  siegeHp: number;
}

export const TERRITORY_LIST: TerritoryDef[] = [
  {
    id: 'misty_forest',
    name: 'Mglisty Las',
    emoji: '🌲',
    description: 'Pradawny las zamieszkały przez duchy i błędne ogniki.',
    minLevel: 1, dailyGold: 50, dailyXp: 30,
    guardianName: 'Duch Lasu', guardianEmoji: '👻',
    siegeAtk: 16, siegeDef: 22, siegeHp: 350,
  },
  {
    id: 'ruined_keep',
    name: 'Ruiny Twierdzy',
    emoji: '🏰',
    description: 'Zrujnowana warownia strzeżona przez nieumarłe zastępy.',
    minLevel: 5, dailyGold: 130, dailyXp: 80,
    guardianName: 'Szkieletowy Rycerz', guardianEmoji: '💀',
    siegeAtk: 22, siegeDef: 28, siegeHp: 500,
  },
  {
    id: 'dark_mountain',
    name: 'Mroczna Góra',
    emoji: '⛰',
    description: 'Szczyt skrywający w swym wnętrzu pradawne i okrutne zło.',
    minLevel: 10, dailyGold: 280, dailyXp: 170,
    guardianName: 'Kamienny Golem', guardianEmoji: '🗿',
    siegeAtk: 30, siegeDef: 36, siegeHp: 700,
  },
  {
    id: 'cursed_tomb',
    name: 'Przeklęty Grobowiec',
    emoji: '⚰',
    description: 'Miejsce wiecznego spoczynku królów przeklętych przez ciemną magię.',
    minLevel: 15, dailyGold: 450, dailyXp: 280,
    guardianName: 'Lich Królewski', guardianEmoji: '🧟',
    siegeAtk: 38, siegeDef: 48, siegeHp: 900,
  },
  {
    id: 'dragon_peak',
    name: 'Smoczy Szczyt',
    emoji: '🐉',
    description: 'Pradawne gniazdo smoków, nietkniętych przez tysiące lat.',
    minLevel: 25, dailyGold: 800, dailyXp: 500,
    guardianName: 'Pradawny Smok', guardianEmoji: '🐲',
    siegeAtk: 55, siegeDef: 60, siegeHp: 1500,
  },
];
