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
  baseAtk: number;
  baseDef: number;
  baseHp: number;
}

export const TERRITORY_LIST: TerritoryDef[] = [
  {
    id: 'misty_forest',
    name: 'Mglisty Las',
    emoji: '🌲',
    description: 'Pradawny las zamieszkały przez duchy i błędne ogniki.',
    minLevel: 1, dailyGold: 50, dailyXp: 30,
    guardianName: 'Duch Lasu', guardianEmoji: '👻',
    baseAtk: 8, baseDef: 4, baseHp: 80,
  },
  {
    id: 'ruined_keep',
    name: 'Ruiny Twierdzy',
    emoji: '🏰',
    description: 'Zrujnowana warownia strzeżona przez nieumarłe zastępy.',
    minLevel: 5, dailyGold: 130, dailyXp: 80,
    guardianName: 'Szkieletowy Rycerz', guardianEmoji: '💀',
    baseAtk: 20, baseDef: 12, baseHp: 200,
  },
  {
    id: 'dark_mountain',
    name: 'Mroczna Góra',
    emoji: '⛰',
    description: 'Szczyt skrywający w swym wnętrzu pradawne i okrutne zło.',
    minLevel: 10, dailyGold: 280, dailyXp: 170,
    guardianName: 'Kamienny Golem', guardianEmoji: '🗿',
    baseAtk: 40, baseDef: 25, baseHp: 450,
  },
  {
    id: 'cursed_tomb',
    name: 'Przeklęty Grobowiec',
    emoji: '⚰',
    description: 'Miejsce wiecznego spoczynku królów przeklętych przez ciemną magię.',
    minLevel: 15, dailyGold: 450, dailyXp: 280,
    guardianName: 'Lich Królewski', guardianEmoji: '🧟',
    baseAtk: 70, baseDef: 45, baseHp: 800,
  },
  {
    id: 'dragon_peak',
    name: 'Smoczy Szczyt',
    emoji: '🐉',
    description: 'Pradawne gniazdo smoków, nietkniętych przez tysiące lat.',
    minLevel: 25, dailyGold: 800, dailyXp: 500,
    guardianName: 'Pradawny Smok', guardianEmoji: '🐲',
    baseAtk: 120, baseDef: 80, baseHp: 1500,
  },
];
