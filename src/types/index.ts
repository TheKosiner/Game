export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type ItemSlot = 'weapon' | 'armor' | 'helmet' | 'boots' | 'ring' | 'amulet' | 'consumable';
export type QuestStatus = 'idle' | 'active' | 'complete';

export interface Stats {
  strength: number;
  dexterity: number;
  intelligence: number;
  vitality: number;
  magic: number;
  magicResistance: number;
}

export interface Item {
  id: string;
  name: string;
  nameEn?: string;
  slot: ItemSlot;
  rarity: Rarity;
  stats: Partial<Stats>;
  attackBonus?: number;
  defenseBonus?: number;
  ranged?: boolean;
  magicDamage?: boolean;
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
  level: number;
  xp: number;
  xpToNext: number;
  hp: number;
  maxHp: number;
  restingUntil: number | null;
  voluntaryRestUntil: number | null;
  voluntaryRestHp: number | null;
  voluntaryRestStartAt: number | null;
  beggingUntil: number | null;
  beggingReward: number | null;
  beggingStartAt: number | null;
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
  clothingColor: number;
  portrait: number;
  lastRespecAt: number | null;
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
  magicAttack?: number;
  magicResistance?: number;
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

export type ChallengePower = 'regen' | 'double_strike' | 'armor_break' | 'dodge' | 'rage' | 'shield' | 'lifesteal' | 'poison';

export interface ChallengeBoss {
  id: number;
  name: string;
  emoji: string;
  level: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  powers: ChallengePower[];
  xpReward: number;
  goldReward: number;
  minLevel: number;
  description: string;
}

export interface ChallengeResult {
  won: boolean;
  bossIdx: number;
  log: string[];
  loot: Item[];
}

export interface ChallengeFightState {
  bossIdx: number;
  bossHp: number;
  shieldHp: number;
  rageActive: boolean;
  round: number;
}

export interface ChallengeHitEvent {
  heroDmg: number;
  heroCrit: boolean;
  isDodge: boolean;
  bossDmg1: number;
  bossDmg2: number;
  poisonDmg: number;
  regenAmt: number;
  lifeSteal: number;
  rageTrigger: boolean;
  ts: number;
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

export interface PvpResult {
  won: boolean;
  opponentName: string;
  xpGained: number;
  goldGained: number;
  timestamp: number;
}

export interface PvpOpponent {
  uid: string;
  heroName: string;
  username: string;
  level: number;
  attack?: number;
  defense?: number;
  maxHp?: number;
  portrait?: number;
}

export interface GameState {
  hero: Hero;
  activeQuest: ActiveQuest | null;
  currentDungeon: Dungeon | null;
  currentFloor: number;
  currentEnemy: Enemy | null;
  dungeonMode: 'xp' | 'balanced' | 'loot';
  dungeonDifficulty: 'easy' | 'normal' | 'hard';
  combatLog: CombatLog[];
  inCombat: boolean;
  defeatedAtDungeon: string | null;
  lastSaved: number;
  shopSeed: number;
  lastShopRefresh: number;
  shopPurchased: number[];
  lastPvpFight: number;
  pvpWins: number;
  pvpLosses: number;
  pvpRating: number;
  pvpLog: PvpResult[];
  lastPassiveRegenAt: number;
  challengeUnlocked: number;
  lastChallengeAt: number;
  challengeResult: ChallengeResult | null;
  challengeFight: ChallengeFightState | null;
  challengeFightLog: string[];
  challengeLastHit: ChallengeHitEvent | null;

  // actions
  initHero: (name: string, skinTone?: number, hairColor?: number, skipSave?: boolean, clothingColor?: number) => void;
  changeAppearance: (skinTone: number, hairColor: number, clothingColor: number) => void;
  respecStats: () => void;
  addXp: (amount: number) => void;
  addGold: (amount: number) => void;
  equipItem: (item: Item, invIdx?: number) => void;
  unequipItem: (slot: ItemSlot) => void;
  sellItem: (item: Item, invIdx?: number) => void;
  buyItem: (item: Item, price: number) => boolean;
  buyShopItem: (item: Item, price: number, slotIndex: number) => boolean;
  enterDungeon: (dungeon: Dungeon, mode?: 'xp' | 'balanced' | 'loot', difficulty?: 'easy' | 'normal' | 'hard') => void;
  exitDungeon: () => void;
  clearDefeat: () => void;
  attackEnemy: () => void;
  autoFightEnemy: () => void;
  startQuest: (quest: Quest) => void;
  collectQuest: () => void;
  upgradeAttribute: (attr: keyof Stats) => void;
  addCombatLog: (message: string, type: CombatLog['type']) => void;
  refreshShop: () => void;
  performPvp: (opponent: PvpOpponent) => PvpResult | null;
  recordPvpResult: (won: boolean, opponent: PvpOpponent) => PvpResult;
  checkDailyReset: () => void;
  restHero: (minutes: number) => void;
  cancelRest: () => void;
  abandonQuest: () => void;
  useItem: (item: Item, invIdx: number) => void;
  tickPassiveRegen: () => void;
  startBegging: (hours: number) => void;
  cancelBegging: () => void;
  collectBegging: () => void;
  startChallengeFight: (bossIdx: number) => void;
  attackChallengeBoss: () => void;
  fleeChallengeFight: () => void;
  clearChallengeResult: () => void;
  loadGame: () => void;
  saveGame: () => void;
}
