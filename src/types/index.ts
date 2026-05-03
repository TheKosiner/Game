export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type ItemSlot = 'weapon' | 'armor' | 'helmet' | 'boots' | 'ring' | 'amulet';
export type HeroClass = 'warrior' | 'mage' | 'rogue';
export type QuestStatus = 'idle' | 'active' | 'complete';

export interface Stats {
  strength: number;
  agility: number;
  intelligence: number;
  constitution: number;
}

export interface Item {
  id: string;
  name: string;
  slot: ItemSlot;
  rarity: Rarity;
  stats: Partial<Stats>;
  attackBonus?: number;
  defenseBonus?: number;
  level: number;
  goldValue: number;
  emoji: string;
}

export interface Equipment {
  weapon?: Item;
  armor?: Item;
  helmet?: Item;
  boots?: Item;
  ring?: Item;
  amulet?: Item;
}

export interface Hero {
  name: string;
  class: HeroClass;
  level: number;
  xp: number;
  xpToNext: number;
  hp: number;
  maxHp: number;
  restingUntil: number | null;
  voluntaryRestUntil: number | null;
  dungeonRunsToday: number;
  questsCompletedToday: number;
  lastDailyReset: number;
  stats: Stats;
  equipment: Equipment;
  inventory: Item[];
  gold: number;
  gems: number;
  attributePoints: number;
  skinTone: number;
  hairColor: number;
}

export interface Enemy {
  id: string;
  name: string;
  emoji: string;
  level: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  xpReward: number;
  goldReward: number;
  lootTable: string[];
}

export interface Dungeon {
  id: string;
  name: string;
  emoji: string;
  minLevel: number;
  description: string;
  floors: number;
  enemies: string[];
}

export interface CombatLog {
  message: string;
  type: 'hero' | 'enemy' | 'loot' | 'system';
  timestamp: number;
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  durationMs: number;
  xpReward: number;
  goldReward: number;
  minLevel: number;
  emoji: string;
}

export interface ActiveQuest {
  quest: Quest;
  startedAt: number;
  endsAt: number;
}

export interface ShopItem {
  item: Item;
  stock: number;
  price: number;
}

export interface GameState {
  hero: Hero;
  activeQuest: ActiveQuest | null;
  currentDungeon: Dungeon | null;
  currentFloor: number;
  currentEnemy: Enemy | null;
  combatLog: CombatLog[];
  inCombat: boolean;
  lastSaved: number;
  shopSeed: number;
  lastShopRefresh: number;

  // actions
  initHero: (name: string, heroClass: HeroClass, skinTone?: number, hairColor?: number) => void;
  addXp: (amount: number) => void;
  addGold: (amount: number) => void;
  equipItem: (item: Item) => void;
  unequipItem: (slot: ItemSlot) => void;
  sellItem: (item: Item) => void;
  buyItem: (item: Item, price: number) => boolean;
  enterDungeon: (dungeon: Dungeon) => void;
  exitDungeon: () => void;
  attackEnemy: () => void;
  startQuest: (quest: Quest) => void;
  collectQuest: () => void;
  upgradeAttribute: (attr: keyof Stats) => void;
  addCombatLog: (message: string, type: CombatLog['type']) => void;
  refreshShop: () => void;
  checkDailyReset: () => void;
  restHero: () => void;
  loadGame: () => void;
  saveGame: () => void;
}
