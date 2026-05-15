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
    name: 'Neonowe Targowisko',
    emoji: '🔫',
    description: 'Chaotyczny bazar pod neonową kopułą. Tu wszystko można kupić — i stracić głowę.',
    minLevel: 1, dailyGold: 50, dailyXp: 30,
    guardianName: 'Gang Uliczny', guardianEmoji: '🗡️',
    siegeAtk: 30, siegeDef: 10, siegeHp: 45,
  },
  {
    id: 'ruined_keep',
    name: 'Strefa Przemysłowa',
    emoji: '⚙️',
    description: 'Rdzewiające zakłady przerobione na fortecę. Drony patrolują każdy korytarz.',
    minLevel: 5, dailyGold: 130, dailyXp: 80,
    guardianName: 'Mech-Strażnik', guardianEmoji: '🤖',
    siegeAtk: 40, siegeDef: 15, siegeHp: 120,
  },
  {
    id: 'dark_mountain',
    name: 'Wieżowce Korpów',
    emoji: '🏢',
    description: 'Szklane iglice korporacji. Prywatna armia pilnuje windykacji długów.',
    minLevel: 10, dailyGold: 280, dailyXp: 170,
    guardianName: 'Korporacyjny Egzekutor', guardianEmoji: '💼',
    siegeAtk: 55, siegeDef: 22, siegeHp: 180,
  },
  {
    id: 'cursed_tomb',
    name: 'Podziemna Sieć',
    emoji: '💻',
    description: 'Tunele pełne kabli i serwerów. Hakerzy kontrolują stąd całą komunikację miasta.',
    minLevel: 15, dailyGold: 450, dailyXp: 280,
    guardianName: 'Mistrz Hakerów', guardianEmoji: '👾',
    siegeAtk: 75, siegeDef: 32, siegeHp: 230,
  },
  {
    id: 'dragon_peak',
    name: 'Cytadela Władzy',
    emoji: '⚡',
    description: 'Serce Neon-Warszawa. Kto kontroluje Cytadelę, dyktuje prawa całemu miastu.',
    minLevel: 25, dailyGold: 800, dailyXp: 500,
    guardianName: 'Warlord Krypto', guardianEmoji: '👑',
    siegeAtk: 110, siegeDef: 50, siegeHp: 320,
  },
];
