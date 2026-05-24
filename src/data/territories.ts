export interface TerritoryDef {
  id: string;
  name: string;
  nameEn?: string;
  emoji: string;
  description: string;
  descEn?: string;
  minLevel: number;
  dailyGold: number;
  dailyXp: number;
  guardianName: string;
  guardianNameEn?: string;
  guardianEmoji: string;
  // Siege stats (require ~3 players at minLevel to defeat)
  siegeAtk: number;
  siegeDef: number;
  siegeHp: number;
}

export const TERRITORY_LIST: TerritoryDef[] = [
  {
    id: 'misty_forest',
    name: 'Neonowe Targowisko',
    nameEn: 'Neon Marketplace',
    emoji: '🔫',
    description: 'Chaotyczny bazar pod neonową kopułą. Tu wszystko można kupić — i stracić głowę.',
    descEn: 'A chaotic bazaar under a neon dome. Everything can be bought here — and you can lose your head.',
    minLevel: 1, dailyGold: 600, dailyXp: 300,
    guardianName: 'Gang Uliczny', guardianNameEn: 'Street Gang', guardianEmoji: '🗡️',
    siegeAtk: 30, siegeDef: 10, siegeHp: 45,
  },
  {
    id: 'ruined_keep',
    name: 'Strefa Przemysłowa',
    nameEn: 'Industrial Zone',
    emoji: '⚙️',
    description: 'Rdzewiające zakłady przerobione na fortecę. Drony patrolują każdy korytarz.',
    descEn: 'Rusted plants converted into a fortress. Drones patrol every corridor.',
    minLevel: 5, dailyGold: 1500, dailyXp: 800,
    guardianName: 'Mech-Strażnik', guardianNameEn: 'Mech-Guardian', guardianEmoji: '🤖',
    siegeAtk: 40, siegeDef: 15, siegeHp: 120,
  },
  {
    id: 'dark_mountain',
    name: 'Wieżowce Korpów',
    nameEn: 'Corp Towers',
    emoji: '🏢',
    description: 'Szklane iglice korporacji. Prywatna armia pilnuje windykacji długów.',
    descEn: 'Glass spires of corporations. A private army enforces debt collection.',
    minLevel: 10, dailyGold: 3500, dailyXp: 1800,
    guardianName: 'Korporacyjny Egzekutor', guardianNameEn: 'Corporate Executor', guardianEmoji: '💼',
    siegeAtk: 55, siegeDef: 22, siegeHp: 180,
  },
  {
    id: 'cursed_tomb',
    name: 'Podziemna Sieć',
    nameEn: 'Underground Network',
    emoji: '💻',
    description: 'Tunele pełne kabli i serwerów. Hakerzy kontrolują stąd całą komunikację miasta.',
    descEn: 'Tunnels full of cables and servers. Hackers control the entire city communication from here.',
    minLevel: 15, dailyGold: 5500, dailyXp: 2800,
    guardianName: 'Mistrz Hakerów', guardianNameEn: 'Hacker Master', guardianEmoji: '👾',
    siegeAtk: 75, siegeDef: 32, siegeHp: 230,
  },
  {
    id: 'dragon_peak',
    name: 'Cytadela Władzy',
    nameEn: 'Citadel of Power',
    emoji: '⚡',
    description: 'Serce Neon-Warszawa. Kto kontroluje Cytadelę, dyktuje prawa całemu miastu.',
    descEn: 'The heart of Neon City. Whoever controls the Citadel dictates the laws of the entire city.',
    minLevel: 25, dailyGold: 10000, dailyXp: 5000,
    guardianName: 'Warlord Krypto', guardianNameEn: 'Crypto Warlord', guardianEmoji: '👑',
    siegeAtk: 110, siegeDef: 50, siegeHp: 320,
  },
];
