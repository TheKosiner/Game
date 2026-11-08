import { create } from 'zustand';
import type { GameState, Hero, ItemSlot, Quest, Dungeon, Stats, CombatLog, Item, PvpResult, PvpOpponent, ChallengeHitEvent } from '../types';
import { useAuthStore } from './authStore';
import { isFirebaseConfigured } from '../lib/firebase';
import { getEnemyById, scaleEnemy } from '../data/enemies';
import { generateItem, getItemName } from '../data/itemGenerator';
import { createMysteryBox } from '../data/mysteryBoxes';
import { getLang } from './langStore';
import { CHALLENGE_BOSSES } from '../data/challengeBosses';
import { heroAttackEnemy, enemyAttackHero, getHeroMaxHp, calcXpToNext, getHeroAttack, getHeroDefense, calcCritChance, getEquipmentStats } from '../utils/combat';
import { getT } from '../hooks/useT';
import {
  scheduleQuestNotification, cancelQuestNotification,
  scheduleRestNotification, cancelRestNotification,
  scheduleBeggingNotification, cancelBeggingNotification,
} from '../lib/notifications';

const SAVE_KEY = 'glitchsoul_save';
const OLD_SAVE_KEY = 'cybermagic_save';
export const MAX_INVENTORY = 20;
const MAX_LOG = 50;
const MAX_LEVEL = 500;
export const MAX_DAILY_DUNGEONS = 10;
export const MAX_DAILY_KRYPTA = 5;
export const MAX_DAILY_QUESTS = 5;
export const SHOP_REFRESH_COOLDOWN = 60 * 60 * 1000;
export const PVP_COOLDOWN = 15 * 60 * 1000;
export const CHALLENGE_COOLDOWN = 60 * 60 * 1000;

type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

const RARITY_BASE: Record<Rarity, number> = { common: 50, uncommon: 28, rare: 14, epic: 6, legendary: 2 };
const RARITY_EMOJI: Record<Rarity, string> = { common: '⬜', uncommon: '🟩', rare: '🟦', epic: '🟪', legendary: '✨' };
const RARITY_LABEL: Record<Rarity, string> = { common: '', uncommon: '', rare: ' RZADKI!', epic: ' 💜 EPICKI!', legendary: ' ✨ LEGENDARNY!' };
const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
// Chance to bump one tier higher after normal roll (per difficulty multiplier applied later)
const RARITY_BUMP: Record<Rarity, number> = { common: 0.15, uncommon: 0.12, rare: 0.08, epic: 0.04, legendary: 0 };

function rollRarity(mode: 'xp' | 'balanced' | 'loot', difficulty: 'easy' | 'normal' | 'hard'): Rarity {
  const w: Record<string, number> = { ...RARITY_BASE };
  if (mode === 'loot')   { w.common *= 0.4; w.uncommon *= 0.9; w.rare *= 2.2; w.epic *= 3; w.legendary *= 4; }
  else if (mode === 'xp'){ w.rare   *= 0.6; w.epic     *= 0.4; w.legendary *= 0.3; }
  if (difficulty === 'hard') { w.rare *= 1.4; w.epic *= 2; w.legendary *= 3; }
  else if (difficulty === 'easy') { w.epic *= 0.4; w.legendary *= 0.15; }
  const total = Object.values(w).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (const [r, weight] of Object.entries(w)) { roll -= weight; if (roll <= 0) return r as Rarity; }
  return 'common';
}

function tryBumpRarity(rarity: Rarity, difficulty: 'easy' | 'normal' | 'hard'): { rarity: Rarity; bumped: boolean } {
  const mult = difficulty === 'hard' ? 2 : difficulty === 'easy' ? 0.5 : 1;
  const idx = RARITY_ORDER.indexOf(rarity);
  if (idx >= RARITY_ORDER.length - 1) return { rarity, bumped: false };
  const chance = RARITY_BUMP[rarity] * mult;
  if (Math.random() < chance) return { rarity: RARITY_ORDER[idx + 1], bumped: true };
  return { rarity, bumped: false };
}


function tryDungeonLoot(dungeonLevel: number, mode: 'xp' | 'balanced' | 'loot', difficulty: 'easy' | 'normal' | 'hard', set: (partial: any) => void, get: () => GameState): void {
  const hero = get().hero;
  if (hero.inventory.length >= MAX_INVENTORY) return;
  const baseRarity = rollRarity(mode, difficulty);
  const { rarity, bumped } = tryBumpRarity(baseRarity, difficulty);
  const levelBonus = difficulty === 'hard' ? rollInt(0, 3) : difficulty === 'easy' ? rollInt(-2, 0) : rollInt(-1, 1);
  const itemLevel = Math.max(1, dungeonLevel + levelBonus);
  const bumpTag = bumped ? ` ⬆️ ${getLang() !== 'pl' ? 'UPGRADE' : 'AWANS'} ${RARITY_EMOJI[baseRarity]}→${RARITY_EMOJI[rarity]}` : '';
  const box = createMysteryBox(rarity, itemLevel);
  set({ hero: { ...hero, inventory: [...hero.inventory, box] } });
  get().addCombatLog(`${RARITY_EMOJI[rarity]} Drop: ${box.emoji} ${box.name}${RARITY_LABEL[rarity]}${bumpTag}`, 'loot');
}

function rollInt(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function simDmg(atk: number, def: number, critChance: number): number {
  const base = atk * atk / (atk + Math.max(1, def));
  const isCrit = Math.random() < critChance;
  const variance = 0.7 + Math.random() * 0.6;
  return Math.max(1, Math.round(base * variance * (isCrit ? 2 : 1)));
}

function simulatePvp(heroAtk: number, heroDef: number, heroHp: number, oppAtk: number, oppDef: number, oppHp: number, heroCrit: number, oppCrit: number): boolean {
  let hHp = heroHp;
  let oHp = oppHp;
  for (let i = 0; i < 300; i++) {
    if (Math.random() < 0.5) {
      oHp -= simDmg(heroAtk, oppDef, heroCrit);
      if (oHp <= 0) return true;
      hHp -= simDmg(oppAtk, heroDef, oppCrit);
      if (hHp <= 0) return false;
    } else {
      hHp -= simDmg(oppAtk, heroDef, oppCrit);
      if (hHp <= 0) return false;
      oHp -= simDmg(heroAtk, oppDef, heroCrit);
      if (oHp <= 0) return true;
    }
  }
  return hHp >= oHp;
}

const DAY_MS = 86_400_000;
export const DAILY_GOLD_CAP = 250_000_000;
export const MAX_GOLD = 1_000_000_000;

/** Day number on the UTC calendar — the one the daily-reward Cloud Function and
 *  the Firestore rules use, so a reset done on the client never disagrees with them. */
export function utcDayIndex(ts: number): number {
  return Math.floor(ts / DAY_MS);
}

export function isSameUtcDay(ts: number, now = Date.now()): boolean {
  return utcDayIndex(ts) === utcDayIndex(now);
}

/** How much more gold may still be earned today without breaching the daily cap
 *  the save rules enforce (earning past it makes Firestore reject the save and the
 *  client roll back to the last cloud copy). */
function goldAllowance(hero: Hero, amount: number): number {
  if (!isFinite(amount) || amount <= 0) return 0;
  const earned = hero.goldEarnedToday ?? 0;
  return Math.max(0, Math.min(amount, DAILY_GOLD_CAP - earned, MAX_GOLD - hero.gold));
}

function challengeLoot(bossIdx: number, heroLevel: number, inventory: Item[]): Item[] {
  if (MAX_INVENTORY - inventory.length <= 0) return [];
  const legendaryChance = Math.min(0.65, bossIdx / (CHALLENGE_BOSSES.length - 1) * 0.65);
  const rarity: Rarity = Math.random() < legendaryChance ? 'legendary' : 'epic';
  const itemLevel = Math.max(1, heroLevel + rollInt(0, 4));
  return [generateItem(itemLevel, rarity)];
}

function scaledQuestDuration(durationMs: number, level: number): number {
  const MAX_MS = 20 * 60 * 1000;
  return Math.min(MAX_MS, Math.floor(durationMs * (1 + (level - 1) * 0.05)));
}

// Infer completed dungeons from hero level for save migration (dungeons unlock ~5 levels below minLevel)
const DUNGEON_LEVELS: [string, number][] = [
  ['forest', 1], ['cave', 5], ['castle', 12], ['westland', 20],
  ['dragon_lair', 28], ['neon_undercity', 35], ['zero_zone', 40], ['ghost_network', 55],
];
export function calcDungeonReward(enemy: { xpReward: number; goldReward: number }, heroLevel: number, mode: 'xp' | 'balanced' | 'loot', diff: 'easy' | 'normal' | 'hard') {
  const diffRewardMult = diff === 'easy' ? 0.7 : diff === 'hard' ? 1.6 : 1;
  const diffStatMult   = diff === 'easy' ? 0.7 : diff === 'hard' ? 1.5 : 1;
  const xpMult   = (mode === 'xp' ? 1.8 : mode === 'loot' ? 0.3 : 1) * diffRewardMult;
  const goldMult = (mode === 'xp' ? 0.4 : mode === 'loot' ? 0.3 : 1) * diffRewardMult;
  // Uncapped by request: rewards scale exponentially with hero level again.
  // NOTE: past ~level 150 this outruns the XP curve and breaches the save rules
  // in firestore.rules (level jump per write, 250M goldEarnedToday), which makes
  // Firestore reject the save and the client revert the run. See the reward
  // budget notes in gameStore.rewards.test.ts.
  const lvlMult  = Math.pow(1.02, heroLevel - 1);
  return {
    xp:           Math.round(enemy.xpReward   * xpMult   * lvlMult),
    gold:         Math.round(enemy.goldReward  * goldMult * lvlMult),
    diffStatMult,
  };
}

/** The lowest-level enemies in a pool — used when the hero is under-levelled. */
function weakestEnemies(ids: string[]): string[] {
  const known = ids.filter(id => getEnemyById(id));
  if (known.length === 0) return ids;
  const lowest = Math.min(...known.map(id => getEnemyById(id)!.level));
  return known.filter(id => getEnemyById(id)!.level === lowest);
}

function inferCompletedDungeons(level: number): string[] {
  const completed: string[] = [];
  for (let i = 0; i < DUNGEON_LEVELS.length - 1; i++) {
    const [id, minLvl] = DUNGEON_LEVELS[i];
    if (level >= minLvl + 5) completed.push(id);
  }
  return completed;
}

function createHero(name: string, skinTone = 1, hairColor = 2, clothingColor = 0, portrait: 0 | 1 = 0): Hero {
  const stats: Stats = { strength: 4, dexterity: 4, intelligence: 4, vitality: 4, magic: 4, magicResistance: 4 };
  const maxHp = getHeroMaxHp(stats, 1);
  return {
    name,
    level: 1,
    xp: 0,
    xpToNext: calcXpToNext(1),
    hp: maxHp,
    maxHp,
    restingUntil: null,
    voluntaryRestUntil: null,
    voluntaryRestHp: null,
    voluntaryRestStartAt: null,
    beggingUntil: null,
    beggingReward: null,
    beggingStartAt: null,
    dungeonRunsToday: 0,
    questsCompletedToday: 0,
    lastDailyReset: Date.now(),
    stats,
    equipment: {},
    inventory: [],
    gold: 100,
    gems: 0,
    attributePoints: 5,
    skinTone,
    hairColor,
    clothingColor,
    portrait,
    unlockedPortraits: [],
    lastRespecAt: null,
    completedDungeons: [],
    lastCasinoSpinAt: 0,
    goldEarnedToday: 0,
    kryptaRunsToday: 0,
    streakDays: 0,
  };
}

export const useGameStore = create<GameState>((set, get) => ({
  hero: createHero('Hero'),
  activeQuest: null,
  currentDungeon: null,
  currentFloor: 1,
  currentEnemy: null,
  dungeonMode: 'balanced',
  dungeonDifficulty: 'normal',
  combatLog: [],
  inCombat: false,
  awaitingEnemyTurn: false,
  defeatedAtDungeon: null,
  lastSaved: 0,
  lastCloudSyncedAt: 0,
  shopSeed: Date.now(),
  lastShopRefresh: 0,
  shopPurchased: [],
  lastPvpFight: 0,
  pvpWins: 0,
  pvpLosses: 0,
  pvpRating: 1000,
  pvpLog: [],
  lastPassiveRegenAt: Date.now(),
  challengeUnlocked: 0,
  lastChallengeAt: 0,
  challengeResult: null,
  challengeFight: null,
  challengeFightLog: [],
  challengeLastHit: null,
  guildExpBonus: 0,
  guildGoldBonus: 0,
  levelUpPending: null,
  pendingDungeonXp: 0,
  pendingDungeonGold: 0,
  mysteryBoxPending: null,
  heroReady: false,
  needsCharacterCreation: false,

  initHero: (name, skinTone = 1, hairColor = 2, skipSave = false, clothingColor = 0) => {
    const hero = createHero(name, skinTone, hairColor, clothingColor, 0);
    set({ hero, activeQuest: null, currentDungeon: null, currentFloor: 1, currentEnemy: null, combatLog: [], inCombat: false, shopSeed: Date.now(), lastShopRefresh: 0, shopPurchased: [], lastPvpFight: 0, pvpWins: 0, pvpLosses: 0, pvpRating: 1000, pvpLog: [], lastPassiveRegenAt: Date.now() });
    // skipSave = a placeholder while the player hasn't created their character yet:
    // it must never be persisted (see heroReady). A named hero is the real thing.
    if (skipSave) {
      set({ heroReady: false });
    } else {
      set({ heroReady: true, needsCharacterCreation: false });
      get().saveGame();
    }
  },

  changeAppearance: (skinTone, hairColor, clothingColor) => {
    set(s => ({ hero: { ...s.hero, skinTone, hairColor, clothingColor } }));
    get().saveGame();
  },

  respecStats: () => {
    const { hero } = get();
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    const lastRespecAt = (hero.lastRespecAt ?? 0) > now ? now : (hero.lastRespecAt ?? 0);
    if (lastRespecAt !== 0 && now - lastRespecAt < DAY) return;
    const totalPoints = hero.stats.strength + hero.stats.dexterity + hero.stats.intelligence + hero.stats.vitality + hero.stats.magic + hero.stats.magicResistance;
    const resetStats: Stats = { strength: 0, dexterity: 0, intelligence: 0, vitality: 0, magic: 0, magicResistance: 0 };
    const newMaxHp = getHeroMaxHp(resetStats, hero.level, hero.equipment);
    set({ hero: { ...hero, stats: resetStats, attributePoints: hero.attributePoints + totalPoints, maxHp: newMaxHp, hp: Math.min(hero.hp, newMaxHp), lastRespecAt: now } });
    const t = getT();
    get().addCombatLog(t.combat.statsReset, 'system');
    get().saveGame();
  },

  setGuildBonuses: (exp: number, gold: number) => {
    set({ guildExpBonus: exp, guildGoldBonus: gold });
  },

  addXp: (amount) => {
    const bonus = get().guildExpBonus;
    if (bonus > 0) amount = Math.round(amount * (1 + bonus / 100));
    const { hero } = get();
    let { xp, xpToNext, level } = hero;
    const { stats, maxHp, hp, attributePoints } = hero;
    xp += amount;
    let levelsGained = 0;
    while (xp >= xpToNext && level < MAX_LEVEL) {
      xp -= xpToNext;
      level++;
      xpToNext = calcXpToNext(level);
      levelsGained++;
    }
    if (level >= MAX_LEVEL) xp = Math.min(xp, xpToNext - 1);
    const newMaxHp = getHeroMaxHp(stats, level, hero.equipment);
    const hpGain = levelsGained > 0 ? newMaxHp - maxHp : 0;
    const newAttributePoints = attributePoints + levelsGained;
    set({ hero: { ...hero, xp, xpToNext, level, maxHp: newMaxHp, hp: Math.min(hp + hpGain, newMaxHp), attributePoints: newAttributePoints } });
    if (levelsGained > 0) {
      const t = getT();
      get().addCombatLog(t.combat.levelUp(level), 'system');
      get().addGems(3 * levelsGained);
      get().addCombatLog(t.gems.levelUpLog(3 * levelsGained), 'system');
      set({ levelUpPending: level });
    }
  },

  addGold: (amount) => {
    if (!isFinite(amount) || amount <= 0) return;
    const bonus = get().guildGoldBonus;
    if (bonus > 0) amount = Math.round(amount * (1 + bonus / 100));
    const { hero } = get();
    // Credit only what fits under the ceilings the Firestore rules enforce (gold
    // 1e9, 250M earned per day). Clamping goldEarnedToday alone while gold kept
    // growing made every save past the cap invalid, so Firestore rejected it and
    // the client rolled the whole session back.
    const gain = goldAllowance(hero, amount);
    if (gain < amount) get().addCombatLog(getT().combat.goldCapReached, 'system');
    if (gain <= 0) return;
    set({ hero: { ...hero, gold: hero.gold + gain, goldEarnedToday: (hero.goldEarnedToday ?? 0) + gain } });
  },

  addGems: (amount) => {
    if (!isFinite(amount) || amount <= 0) return;
    const { hero } = get();
    set({ hero: { ...hero, gems: hero.gems + amount } });
  },

  gemHeal: () => {
    const { hero, currentDungeon } = get();
    const COST = 30;
    if (currentDungeon) return false;
    if (hero.gems < COST || hero.hp >= hero.maxHp) return false;
    const t = getT();
    set({ hero: { ...hero, gems: hero.gems - COST, hp: hero.maxHp } });
    get().addCombatLog(t.gems.healLog, 'system');
    get().saveGame();
    return true;
  },

  gemSpeedupQuest: () => {
    const { hero, activeQuest } = get();
    if (!activeQuest) return false;
    const now = Date.now();
    const remaining = Math.max(0, activeQuest.endsAt - now);
    if (remaining <= 0) return false;
    const slots = Math.ceil(remaining / (30 * 60 * 1000));
    const cost = slots * 5;
    if (hero.gems < cost) return false;
    const t = getT();
    set({ hero: { ...hero, gems: hero.gems - cost }, activeQuest: { ...activeQuest, endsAt: now - 1000 } });
    get().addCombatLog(t.gems.questSpeedupLog(cost), 'system');
    get().saveGame();
    return true;
  },

  gemSpeedupRest: () => {
    const { hero } = get();
    if (!hero.voluntaryRestUntil || Date.now() >= hero.voluntaryRestUntil) return false;
    const now = Date.now();
    const remaining = Math.max(0, hero.voluntaryRestUntil - now);
    const slots = Math.ceil(remaining / (15 * 60 * 1000));
    const cost = slots * 5;
    if (hero.gems < cost) return false;
    const healAmount = Math.min(hero.voluntaryRestHp ?? 0, hero.maxHp - hero.hp);
    const t = getT();
    set({ hero: { ...hero, gems: hero.gems - cost, hp: hero.hp + healAmount, voluntaryRestUntil: null, voluntaryRestHp: null, voluntaryRestStartAt: null } });
    get().addCombatLog(t.gems.restSpeedupLog(cost), 'system');
    get().saveGame();
    return true;
  },

  gemBuyPortrait: (portraitIndex, price) => {
    const { hero } = get();
    if (hero.gems < price) return false;
    if (hero.unlockedPortraits.includes(portraitIndex)) return false;
    set({ hero: { ...hero, gems: hero.gems - price, unlockedPortraits: [...hero.unlockedPortraits, portraitIndex], portrait: portraitIndex } });
    get().saveGame();
    return true;
  },

  equipItem: (item: Item, invIdx?: number) => {
    if (item.slot === 'consumable') return;
    const { hero } = get();
    const oldEquipped = hero.equipment[item.slot as keyof typeof hero.equipment];
    const newInventory = [...hero.inventory];
    const idx = invIdx !== undefined ? invIdx : newInventory.findIndex(i => i === item || (i.id === item.id && i.name === item.name && i.level === item.level));
    if (idx !== -1) newInventory.splice(idx, 1);
    // If item isn't coming from inventory and inventory would overflow, abort
    if (oldEquipped && idx === -1 && newInventory.length >= MAX_INVENTORY) return;
    if (oldEquipped) newInventory.push(oldEquipped);
    const newEquipment = { ...hero.equipment, [item.slot as string]: item };
    const newMaxHp = getHeroMaxHp(hero.stats, hero.level, newEquipment);
    set({ hero: { ...hero, equipment: newEquipment, inventory: newInventory, maxHp: newMaxHp, hp: Math.min(hero.hp, newMaxHp) } });
    get().saveGame();
  },

  unequipItem: (slot: ItemSlot) => {
    if (slot === 'consumable') return;
    const { hero } = get();
    const item = hero.equipment[slot as keyof typeof hero.equipment];
    if (!item) return;
    if (hero.inventory.length >= MAX_INVENTORY) return;
    const newEquipment = { ...hero.equipment };
    delete (newEquipment as any)[slot];
    const newMaxHp = getHeroMaxHp(hero.stats, hero.level, newEquipment);
    set({ hero: { ...hero, equipment: newEquipment, inventory: [...hero.inventory, item], maxHp: newMaxHp, hp: Math.min(hero.hp, newMaxHp) } });
    get().saveGame();
  },

  sellItem: (item: Item, invIdx?: number) => {
    const { hero } = get();
    const newInventory = [...hero.inventory];
    let idx: number;
    if (invIdx !== undefined && invIdx >= 0 && invIdx < newInventory.length) {
      // Verify item at given index still matches (guard stale index)
      const atIdx = newInventory[invIdx];
      idx = (atIdx && atIdx.id === item.id) ? invIdx : newInventory.findIndex(i => i && i.id === item.id);
    } else {
      idx = newInventory.findIndex(i => i && i.id === item.id);
    }
    if (idx === -1) return;
    newInventory.splice(idx, 1);
    const value = goldAllowance(hero, item.goldValue ?? 0);
    set({ hero: { ...hero, gold: hero.gold + value, goldEarnedToday: (hero.goldEarnedToday ?? 0) + value, inventory: newInventory } });
    if (value < (item.goldValue ?? 0)) get().addCombatLog(getT().combat.goldCapReached, 'system');
    get().saveGame();
  },

  buyItem: (item, price) => {
    const { hero } = get();
    if (hero.gold < price) return false;
    if (hero.inventory.length >= MAX_INVENTORY) return false;
    set({ hero: { ...hero, gold: hero.gold - price, inventory: [...hero.inventory, item] } });
    return true;
  },

  buyShopItem: (item, price, slotIndex) => {
    const { hero, shopPurchased } = get();
    if (hero.gold < price) return false;
    if (hero.inventory.length >= MAX_INVENTORY) return false;
    if (shopPurchased.includes(slotIndex)) return false;
    set({
      hero: { ...hero, gold: hero.gold - price, inventory: [...hero.inventory, item] },
      shopPurchased: [...shopPurchased, slotIndex],
    });
    get().saveGame();
    return true;
  },

  enterDungeon: (dungeon: Dungeon, mode: 'xp' | 'balanced' | 'loot' = 'balanced', difficulty: 'easy' | 'normal' | 'hard' = 'normal') => {
    const { hero } = get();
    const t = getT();
    const now = Date.now();
    if ((hero.restingUntil !== null && now < hero.restingUntil) ||
        (hero.voluntaryRestUntil !== null && now < hero.voluntaryRestUntil)) {
      get().addCombatLog(t.combat.restingWait, 'system');
      return;
    }
    if (hero.dungeonRunsToday >= MAX_DAILY_DUNGEONS) {
      get().addCombatLog(t.combat.dungeonLimit(MAX_DAILY_DUNGEONS), 'system');
      return;
    }
    const diffStatMult = difficulty === 'easy' ? 0.7 : difficulty === 'hard' ? 1.5 : 1;
    const heroFloors = 10;
    // Use the selected dungeon's enemy pool, not the highest-tier dungeon by hero level
    const safeEnemyPool = dungeon.enemies.filter(id => {
      const e = getEnemyById(id);
      return e && e.level <= hero.level;
    });
    // Nothing at or below the hero's level means the dungeon unlocks before its
    // weakest enemy — Megacorp Fortress opens at 20 but starts at level 22. The
    // old fallback handed back the *entire* pool, so a freshly-unlocked player
    // could be matched against its level 30, 110-attack machines. Fall back to
    // the weakest tier the dungeon has instead, so being under-levelled can only
    // ever cost you the easiest fight rather than the hardest.
    const enemyPool = safeEnemyPool.length > 0 ? safeEnemyPool : weakestEnemies(dungeon.enemies);
    const enemyId = enemyPool[Math.floor(Math.random() * enemyPool.length)];
    const baseEnemy = getEnemyById(enemyId);
    if (!baseEnemy) return;
    const scaled = scaleEnemy(baseEnemy, 1);
    const enemy = {
      ...scaled,
      hp: Math.round(scaled.hp * diffStatMult),
      maxHp: Math.round(scaled.maxHp * diffStatMult),
      attack: Math.round(scaled.attack * diffStatMult),
      defense: Math.round(scaled.defense * diffStatMult),
    };
    set({
      currentDungeon: { ...dungeon, floors: heroFloors, enemies: enemyPool },
      dungeonMode: mode,
      dungeonDifficulty: difficulty,
      currentFloor: 1,
      currentEnemy: { ...enemy },
      inCombat: true,
      awaitingEnemyTurn: false,
      combatLog: [],
      pendingDungeonXp: 0,
      pendingDungeonGold: 0,
      hero: { ...hero, dungeonRunsToday: hero.dungeonRunsToday + 1 },
    });
    get().addCombatLog(t.combat.entering(dungeon.name), 'system');
    get().addCombatLog(t.combat.encounter(`${enemy.emoji} ${enemy.name} (${getLang() !== 'pl' ? 'LVL.' : 'Poz.'} ${enemy.level})`), 'system');
    get().addCombatLog(t.combat.dungeonsToday(hero.dungeonRunsToday + 1, MAX_DAILY_DUNGEONS), 'system');
  },

  exitDungeon: () => {
    const t = getT();
    set({ currentDungeon: null, currentFloor: 1, currentEnemy: null, inCombat: false, awaitingEnemyTurn: false, pendingDungeonXp: 0, pendingDungeonGold: 0 });
    get().addCombatLog(t.combat.leaving, 'system');
  },

  clearDefeat: () => {
    set({ defeatedAtDungeon: null });
  },

  attackEnemy: () => {
    const { hero, currentEnemy, currentDungeon, currentFloor, awaitingEnemyTurn } = get();
    if (!currentEnemy || !currentDungeon) return;
    if (awaitingEnemyTurn) return; // enemy's counter is pending — wait for its turn
    const t = getT();

    // ── Your turn: strike the enemy only. You never take damage on your own attack. ──
    const { damage: heroDmg, isCrit } = heroAttackEnemy(hero, currentEnemy);
    const enemyHp = Math.max(0, currentEnemy.hp - heroDmg);
    const critText = isCrit ? ` ${t.combat.critical}` : '';
    get().addCombatLog(`${t.combat.dealDamage(heroDmg)}${critText} ${currentEnemy.emoji} ${currentEnemy.name}`, 'hero');

    if (enemyHp <= 0) {
      // Enemy defeated on our strike — no counter-attack, so no damage taken.
      get().addCombatLog(t.combat.defeated(`${currentEnemy.emoji} ${currentEnemy.name}`), 'system');
      const mode = get().dungeonMode;
      const diff = get().dungeonDifficulty;
      const { xp: xpEarned, gold: goldEarned, diffStatMult } = calcDungeonReward(currentEnemy, hero.level, mode, diff);
      const newPendingXp   = get().pendingDungeonXp + xpEarned;
      const newPendingGold = get().pendingDungeonGold + goldEarned;
      set({ pendingDungeonXp: newPendingXp, pendingDungeonGold: newPendingGold });
      get().addCombatLog(t.combat.rewards(xpEarned, goldEarned), 'loot');

      const nextFloor = currentFloor + 1;
      if (nextFloor > currentDungeon.floors) {
        get().addXp(newPendingXp);
        get().addGold(newPendingGold);
        // Leave pendingDungeonXp/Gold as the run total — completion screen reads them
        get().addCombatLog(t.combat.dungeonComplete(currentDungeon.name), 'system');
        tryDungeonLoot(currentDungeon.minLevel, mode, diff, set, get);
        const freshHero = get().hero;
        const prevCompleted = freshHero.completedDungeons ?? [];
        if (diff !== 'easy' && !prevCompleted.includes(currentDungeon.id)) {
          set({ hero: { ...freshHero, completedDungeons: [...prevCompleted, currentDungeon.id] } });
        }
        set({ currentEnemy: null, currentFloor: nextFloor, inCombat: false, awaitingEnemyTurn: false });
        get().saveGame(); // save on dungeon complete (significant event)
      } else {
        const enemyId = currentDungeon.enemies[Math.floor(Math.random() * currentDungeon.enemies.length)];
        const baseEnemy = getEnemyById(enemyId);
        if (baseEnemy) {
          const scaled = scaleEnemy(baseEnemy, nextFloor);
          const nextEnemy = { ...scaled, hp: Math.round(scaled.hp * diffStatMult), maxHp: Math.round(scaled.maxHp * diffStatMult), attack: Math.round(scaled.attack * diffStatMult), defense: Math.round(scaled.defense * diffStatMult) };
          set({ currentEnemy: { ...nextEnemy }, currentFloor: nextFloor, inCombat: true, awaitingEnemyTurn: false });
          get().addCombatLog(t.combat.floorEnemy(nextFloor, `${nextEnemy.emoji} ${nextEnemy.name}`), 'system');
        }
      }
      return;
    }

    // Enemy survives — apply its HP loss and hand the turn over to the enemy.
    set({ currentEnemy: { ...currentEnemy, hp: enemyHp }, awaitingEnemyTurn: true });
  },

  enemyCounterAttack: () => {
    const { hero, currentEnemy, currentDungeon, awaitingEnemyTurn } = get();
    if (!awaitingEnemyTurn || !currentEnemy || !currentDungeon) return;
    const t = getT();

    // ── Enemy's turn: it strikes back. This is the ONLY time you take damage. ──
    const { damage: enemyDmg, isCrit: enemyCrit } = enemyAttackHero(currentEnemy, hero);
    const heroHp = Math.max(0, hero.hp - enemyDmg);
    get().addCombatLog(`${t.combat.enemyDamage(`${currentEnemy.emoji} ${currentEnemy.name}`, enemyDmg)}${enemyCrit ? ` ${t.combat.crit}` : ''}`, 'enemy');

    if (heroHp <= 0) {
      get().addCombatLog(t.combat.playerDefeated, 'system');
      set({ hero: { ...hero, hp: 1 }, currentDungeon: null, currentEnemy: null, inCombat: false, awaitingEnemyTurn: false, defeatedAtDungeon: currentDungeon.name, pendingDungeonXp: 0, pendingDungeonGold: 0 });
      get().saveGame(); // save on defeat
      return;
    }

    set({ hero: { ...hero, hp: heroHp }, awaitingEnemyTurn: false });
  },

  autoFightEnemy: () => {
    const { hero, currentEnemy, currentDungeon, currentFloor } = get();
    if (!currentEnemy || !currentDungeon) return;
    const t = getT();

    let heroHp = hero.hp;
    let enemyHp = currentEnemy.hp;

    for (let i = 0; i < 500; i++) {
      if (Math.random() < 0.5) {
        const { damage: hDmg } = heroAttackEnemy(hero, currentEnemy);
        enemyHp = Math.max(0, enemyHp - hDmg);
        if (enemyHp <= 0) break;
        const { damage: eDmg } = enemyAttackHero(currentEnemy, hero);
        heroHp = Math.max(0, heroHp - eDmg);
        if (heroHp <= 0) break;
      } else {
        const { damage: eDmg } = enemyAttackHero(currentEnemy, hero);
        heroHp = Math.max(0, heroHp - eDmg);
        if (heroHp <= 0) break;
        const { damage: hDmg } = heroAttackEnemy(hero, currentEnemy);
        enemyHp = Math.max(0, enemyHp - hDmg);
        if (enemyHp <= 0) break;
      }
    }

    if (heroHp <= 0) {
      get().addCombatLog(t.combat.enemyWins(`${currentEnemy.emoji} ${currentEnemy.name}`), 'enemy');
      get().addCombatLog(t.combat.playerDefeated, 'system');
      set({ hero: { ...get().hero, hp: 1 }, currentDungeon: null, currentEnemy: null, inCombat: false, defeatedAtDungeon: currentDungeon.name, pendingDungeonXp: 0, pendingDungeonGold: 0 });
    } else {
      get().addCombatLog(t.combat.quickFight(`${currentEnemy.emoji} ${currentEnemy.name}`), 'system');
      const mode2 = get().dungeonMode;
      const diff2 = get().dungeonDifficulty;
      const { xp: xpEarned2, gold: goldEarned2, diffStatMult: diffStatMult2 } = calcDungeonReward(currentEnemy, hero.level, mode2, diff2);
      const newPendingXp2   = get().pendingDungeonXp + xpEarned2;
      const newPendingGold2 = get().pendingDungeonGold + goldEarned2;
      set({ pendingDungeonXp: newPendingXp2, pendingDungeonGold: newPendingGold2 });
      get().addCombatLog(t.combat.rewards(xpEarned2, goldEarned2), 'loot');

      const fresh = get().hero;
      set({ hero: { ...fresh, hp: Math.min(heroHp, fresh.maxHp) } });

      const nextFloor = currentFloor + 1;
      if (nextFloor > currentDungeon.floors) {
        get().addXp(newPendingXp2);
        get().addGold(newPendingGold2);
        // Leave pendingDungeonXp/Gold as the run total — completion screen reads them
        get().addCombatLog(t.combat.dungeonComplete(currentDungeon.name), 'system');
        tryDungeonLoot(currentDungeon.minLevel, mode2, diff2, set, get);
        const freshHero2 = get().hero;
        const prevCompleted2 = freshHero2.completedDungeons ?? [];
        if (diff2 !== 'easy' && !prevCompleted2.includes(currentDungeon.id)) {
          set({ hero: { ...freshHero2, completedDungeons: [...prevCompleted2, currentDungeon.id] } });
        }
        set({ currentEnemy: null, currentFloor: nextFloor, inCombat: false });
      } else {
        const enemyId = currentDungeon.enemies[Math.floor(Math.random() * currentDungeon.enemies.length)];
        const baseEnemy = getEnemyById(enemyId);
        if (baseEnemy) {
          const scaled2 = scaleEnemy(baseEnemy, nextFloor);
          const nextEnemy = { ...scaled2, hp: Math.round(scaled2.hp * diffStatMult2), maxHp: Math.round(scaled2.maxHp * diffStatMult2), attack: Math.round(scaled2.attack * diffStatMult2), defense: Math.round(scaled2.defense * diffStatMult2) };
          set({ currentEnemy: { ...nextEnemy }, currentFloor: nextFloor, inCombat: true });
          get().addCombatLog(t.combat.floorEnemy(nextFloor, `${nextEnemy.emoji} ${nextEnemy.name}`), 'system');
        }
      }
    }
    get().saveGame();
  },

  startQuest: (quest: Quest) => {
    const { hero, activeQuest } = get();
    if (activeQuest) return;
    if (hero.questsCompletedToday >= MAX_DAILY_QUESTS) return;
    const now = Date.now();
    const duration = scaledQuestDuration(quest.durationMs, hero.level);
    const endsAt = now + duration;
    set({ activeQuest: { quest, startedAt: now, endsAt } });
    scheduleQuestNotification(quest.name, quest.nameEn, endsAt, getLang());
    get().saveGame();
  },

  collectQuest: () => {
    const { activeQuest } = get();
    if (!activeQuest) return;
    if (Date.now() < activeQuest.endsAt) return;
    cancelQuestNotification();
    const goldReward = activeQuest.quest.goldReward;
    get().addXp(activeQuest.quest.xpReward);
    // Always counted as today's earnings. A reward from a quest started before the
    // daily reset used to be added "outside" goldEarnedToday, but the save rules
    // only excuse that inside the very write that performs the reset — collected
    // later, the gold looked unearned, the save was rejected and the reward lost.
    get().addGold(goldReward);
    // Read hero AFTER addXp/addGold so level-up results are not overwritten
    const freshHero = get().hero;
    set({ activeQuest: null, hero: { ...freshHero, questsCompletedToday: freshHero.questsCompletedToday + 1 } });
    get().saveGame();
  },

  abandonQuest: () => {
    if (!get().activeQuest) return;
    cancelQuestNotification();
    set({ activeQuest: null });
    get().saveGame();
  },

  useItem: (item: Item, invIdx: number) => {
    const { hero, currentDungeon } = get();
    if (item.slot !== 'consumable') return;
    if (currentDungeon) return;
    const newInventory = hero.inventory.filter((_, i) => i !== invIdx);
    const healAmount = Math.round(hero.maxHp * (item.healPercent ?? 1));
    const actualHeal = Math.min(healAmount, hero.maxHp - hero.hp);
    const newHp = hero.hp + actualHeal;
    const t = getT();

    let restUntil   = hero.voluntaryRestUntil;
    let restHp      = hero.voluntaryRestHp;
    let restStartAt = hero.voluntaryRestStartAt;

    if (restUntil !== null && restHp !== null && Date.now() < restUntil) {
      if (newHp >= hero.maxHp) {
        restUntil = null; restHp = null; restStartAt = null;
      } else if (actualHeal > 0 && restHp > 0) {
        const total = restUntil - (restStartAt ?? restUntil);
        const timeSaved = Math.round(actualHeal * total / restHp);
        restUntil = Math.max(Date.now(), restUntil - timeSaved);
        restHp = Math.max(0, restHp - actualHeal);
      }
    }

    set({ hero: { ...hero, hp: newHp, inventory: newInventory, voluntaryRestUntil: restUntil, voluntaryRestHp: restHp, voluntaryRestStartAt: restStartAt } });
    get().addCombatLog(`${item.emoji} ${t.combat.itemUsed(getItemName(item, getLang()), actualHeal)}`, 'system');
    get().saveGame();
  },

  upgradeAttribute: (attr: keyof Stats) => {
    const { hero } = get();
    const cost = Math.round(hero.stats[attr] * 75);
    if (hero.gold < cost) return;
    const newStats = { ...hero.stats, [attr]: hero.stats[attr] + 1 };
    const newMaxHp = getHeroMaxHp(newStats, hero.level, hero.equipment);
    set({ hero: { ...hero, stats: newStats, gold: hero.gold - cost, maxHp: newMaxHp } });
    get().saveGame();
  },

  addCombatLog: (message: string, type: CombatLog['type']) => {
    set(state => ({
      combatLog: [{ message, type, timestamp: Date.now() }, ...state.combatLog].slice(0, MAX_LOG),
    }));
  },

  refreshShop: () => {
    let { lastShopRefresh } = get();
    const now = Date.now();
    if (lastShopRefresh > now) { lastShopRefresh = now; set({ lastShopRefresh: now }); }
    if (now - lastShopRefresh < SHOP_REFRESH_COOLDOWN) return;
    set({ shopSeed: now, lastShopRefresh: now, shopPurchased: [] });
    get().saveGame();
  },

  clearShopPurchased: () => set({ shopPurchased: [] }),

  performPvp: (opponent: PvpOpponent): PvpResult | null => {
    const { hero, pvpWins, pvpLosses, pvpRating, pvpLog, inCombat } = get();
    let { lastPvpFight } = get();
    if (inCombat) return null;
    const now = Date.now();
    // Sanitize future timestamp (clock set backward exploit)
    if (lastPvpFight > now) { lastPvpFight = now; set({ lastPvpFight: now }); }
    if (now - lastPvpFight < PVP_COOLDOWN) return null;
    const heroAtk  = getHeroAttack(hero);
    const heroDef  = getHeroDefense(hero);
    const heroCrit = calcCritChance(hero.stats.dexterity + getEquipmentStats(hero.equipment).dexterity, hero.level);
    const oppCrit  = calcCritChance(0, opponent.level ?? 1); // opponent crit: base only (no dex info)
    const won = simulatePvp(heroAtk, heroDef, hero.maxHp, opponent.attack ?? 10, opponent.defense ?? 5, opponent.maxHp ?? 100, heroCrit, oppCrit);
    const xpGained = won ? Math.max(10, opponent.level * 10) : 4;
    const goldGained = won ? Math.max(10, opponent.level * 10) : 0;
    const ratingDelta = won ? 25 : -15;
    const result: PvpResult = { won, opponentName: opponent.heroName, xpGained, goldGained, timestamp: now };
    set({
      lastPvpFight: now,
      pvpWins: won ? pvpWins + 1 : pvpWins,
      pvpLosses: won ? pvpLosses : pvpLosses + 1,
      pvpRating: Math.max(0, pvpRating + ratingDelta),
      pvpLog: [result, ...pvpLog].slice(0, 10),
    });
    get().addXp(xpGained);
    if (goldGained > 0) get().addGold(goldGained);
    get().saveGame();
    return result;
  },

  recordPvpResult: (won: boolean, opponent: PvpOpponent): PvpResult => {
    const { pvpWins, pvpLosses, pvpRating, pvpLog } = get();
    const now = Date.now();
    // Sanitize a backward-set clock (same guard as performPvp). The cooldown itself
    // is gated in the UI before a fight can start.
    if (get().lastPvpFight > now) set({ lastPvpFight: now });
    const xpGained = won ? Math.max(10, opponent.level * 10) : 4;
    const goldGained = won ? Math.max(10, opponent.level * 10) : 0;
    const ratingDelta = won ? 25 : -15;
    const result: PvpResult = { won, opponentName: opponent.heroName, xpGained, goldGained, timestamp: now };
    set({
      lastPvpFight: now,
      pvpWins: won ? pvpWins + 1 : pvpWins,
      pvpLosses: won ? pvpLosses : pvpLosses + 1,
      pvpRating: Math.max(0, pvpRating + ratingDelta),
      pvpLog: [result, ...pvpLog].slice(0, 10),
    });
    get().addXp(xpGained);
    if (goldGained > 0) get().addGold(goldGained);
    get().saveGame();
    return result;
  },

  restHero: (minutes: number) => {
    const { hero, inCombat, currentDungeon } = get();
    if (inCombat || currentDungeon) return;
    if (hero.voluntaryRestUntil !== null && Date.now() < hero.voluntaryRestUntil) return;
    if (hero.beggingUntil !== null && Date.now() < hero.beggingUntil) return;
    if (hero.hp >= hero.maxHp) return;
    const hpPerMin = Math.max(1, Math.round(hero.maxHp * 0.04));
    const hp = Math.min(minutes * hpPerMin, hero.maxHp - hero.hp);
    if (hp <= 0) return;
    const endsAt = Date.now() + minutes * 60 * 1000;
    const t = getT();
    set({ hero: { ...hero, voluntaryRestUntil: endsAt, voluntaryRestHp: hp, voluntaryRestStartAt: Date.now() } });
    get().addCombatLog(t.combat.restingMinutes(minutes, hp), 'system');
    scheduleRestNotification(endsAt, hp, getLang());
    get().saveGame();
  },

  cancelRest: () => {
    const { hero } = get();
    if (!hero.voluntaryRestUntil || hero.voluntaryRestHp == null) return;
    const now = Date.now();
    if (now >= hero.voluntaryRestUntil) return;
    let earned = 0;
    if (hero.voluntaryRestStartAt) {
      const elapsed = now - hero.voluntaryRestStartAt;
      const total = hero.voluntaryRestUntil - hero.voluntaryRestStartAt;
      earned = Math.floor(hero.voluntaryRestHp * elapsed / Math.max(1, total));
    }
    const healAmount = Math.min(earned, hero.maxHp - hero.hp);
    const t = getT();
    cancelRestNotification();
    set({ hero: { ...hero, hp: hero.hp + healAmount, voluntaryRestUntil: null, voluntaryRestHp: null, voluntaryRestStartAt: null } });
    if (healAmount > 0) get().addCombatLog(t.combat.restCancelledWithHp(healAmount), 'system');
    else get().addCombatLog(t.combat.restCancelled, 'system');
    get().saveGame();
  },

  startBegging: (hours: number) => {
    const { hero, inCombat, activeQuest } = get();
    if (inCombat) return;
    if (hero.beggingUntil !== null && Date.now() < hero.beggingUntil) return;
    if (hero.voluntaryRestUntil !== null && Date.now() < hero.voluntaryRestUntil) return;
    if (activeQuest) return;
    const clampedHours = Math.max(1, Math.min(10, Math.round(hours)));
    const goldReward = Math.min(
      Math.floor(clampedHours * 97 * Math.pow(1.09, hero.level - 1) * (0.8 + Math.random() * 0.4)),
      DAILY_GOLD_CAP,
    );
    const endsAt = Date.now() + clampedHours * 60 * 60 * 1000;
    const t = getT();
    set({ hero: { ...hero, beggingUntil: endsAt, beggingReward: goldReward, beggingStartAt: Date.now() } });
    get().addCombatLog(t.combat.beggingStart(clampedHours, goldReward), 'system');
    scheduleBeggingNotification(endsAt, goldReward, getLang());
    get().saveGame();
  },

  cancelBegging: () => {
    const { hero } = get();
    if (!hero.beggingUntil || hero.beggingReward == null) return;
    const now = Date.now();
    if (now >= hero.beggingUntil) return;
    let earned = 0;
    if (hero.beggingStartAt) {
      const elapsed = now - hero.beggingStartAt;
      const total = hero.beggingUntil - hero.beggingStartAt;
      earned = Math.floor(hero.beggingReward * elapsed / Math.max(1, total));
    }
    const t = getT();
    cancelBeggingNotification();
    if (earned > 0) get().addGold(earned);
    const freshHero = get().hero;
    set({ hero: { ...freshHero, beggingUntil: null, beggingReward: null, beggingStartAt: null } });
    if (earned > 0) get().addCombatLog(t.combat.beggingCancelledWithGold(earned), 'loot');
    else get().addCombatLog(t.combat.beggingCancelled, 'system');
    get().saveGame();
  },

  collectBegging: () => {
    const { hero } = get();
    if (!hero.beggingUntil || Date.now() < hero.beggingUntil) return;
    const reward = hero.beggingReward ?? 0;
    const t = getT();
    cancelBeggingNotification();
    // Always counted as today's earnings — an overnight session (started before
    // the daily reset) used to bypass goldEarnedToday, which the save rules
    // reject once the reset is in an earlier write, so the night's reward was lost.
    get().addGold(reward);
    const freshHero = get().hero;
    set({ hero: { ...freshHero, beggingUntil: null, beggingReward: null, beggingStartAt: null } });
    get().addCombatLog(t.combat.beggingDone(reward), 'loot');
    get().saveGame();
  },

  checkDailyReset: () => {
    const { hero } = get();
    const now = Date.now();
    // lastDailyReset in the future = clock was set backward — fix it, no reward
    if (hero.lastDailyReset > now) {
      set({ hero: { ...hero, lastDailyReset: now } });
      return;
    }
    // Local fallback for when the daily-reward Cloud Function can't be reached.
    // It follows the server's UTC calendar: resetting on any other boundary (it
    // used to be Warsaw midnight) produced resets the save rules rejected, and
    // each rejection rolled the player back to their last cloud save.
    if (!isSameUtcDay(hero.lastDailyReset, now)) {
      const DAILY_GEMS = 5;
      const prevStreak = hero.streakDays ?? 0;
      const wasYesterday = utcDayIndex(hero.lastDailyReset ?? 0) === utcDayIndex(now) - 1;
      const newStreak = wasYesterday ? prevStreak + 1 : 1;
      set({
        hero: {
          ...hero,
          dungeonRunsToday: 0,
          questsCompletedToday: 0,
          goldEarnedToday: 0,
          kryptaRunsToday: 0,
          lastDailyReset: now,
          gems: hero.gems + DAILY_GEMS,
          streakDays: newStreak,
        },
      });
      const t = getT();
      get().addCombatLog(t.gems.dailyLog(DAILY_GEMS), 'system');
    }
    get().settleVoluntaryRest();
  },

  settleVoluntaryRest: () => {
    // Apply voluntary rest recovery if time is up
    const hero = get().hero;
    if (hero.voluntaryRestUntil !== null && Date.now() >= hero.voluntaryRestUntil) {
      const healAmount = Math.min(hero.voluntaryRestHp ?? 0, hero.maxHp - hero.hp);
      set({ hero: { ...hero, hp: hero.hp + healAmount, voluntaryRestUntil: null, voluntaryRestHp: null, voluntaryRestStartAt: null } });
      if (healAmount > 0) { const t = getT(); get().addCombatLog(t.combat.rested(healAmount), 'system'); }
    }
  },

  applyServerDailyReset: (result, gemsMode = 'delta') => {
    // Mirror what claimDailyReward just wrote to the cloud save, so the next sync
    // carries the same reset instead of overwriting it with yesterday's counters.
    // 'delta' (mid-session): the server credited gems on top of the balance we
    // pushed right before the claim, and anything spent meanwhile still counts.
    // 'absolute' (after a cloud reload): take the server's balance as is.
    set(s => ({
      hero: {
        ...s.hero,
        dungeonRunsToday: 0,
        questsCompletedToday: 0,
        goldEarnedToday: 0,
        kryptaRunsToday: 0,
        lastDailyReset: result.lastDailyReset ?? s.hero.lastDailyReset,
        streakDays: result.streakDays ?? s.hero.streakDays,
        gems: gemsMode === 'absolute'
          ? (result.gems ?? s.hero.gems)
          : s.hero.gems + Math.max(0, result.gemsAdded ?? 0),
      },
    }));
  },

  tickPassiveRegen: () => {
    const { hero, lastPassiveRegenAt } = get();
    const now = Date.now();
    // If timestamp is in the future the clock was manipulated — reset and skip
    if (lastPassiveRegenAt > now) {
      set({ lastPassiveRegenAt: now });
      return;
    }
    const isResting = (hero.restingUntil !== null && now < hero.restingUntil) ||
                      (hero.voluntaryRestUntil !== null && now < hero.voluntaryRestUntil);
    if (isResting || hero.hp >= hero.maxHp) {
      set({ lastPassiveRegenAt: now });
      return;
    }
    // Cap elapsed to 7 days max to prevent instant-regen via clock tricks
    const elapsed = Math.min(now - lastPassiveRegenAt, 7 * 24 * 60 * 60 * 1000);
    const gain = Math.floor(elapsed * (hero.maxHp * 0.004) / 60000);
    if (gain < 1) return;
    set({ hero: { ...hero, hp: Math.min(hero.maxHp, hero.hp + gain) }, lastPassiveRegenAt: now });
  },

  startChallengeFight: (bossIdx: number) => {
    const { inCombat, challengeUnlocked } = get();
    let { lastChallengeAt } = get();
    // Refusing silently here made the boss button look broken: a player who had
    // walked away from an unfinished operation kept inCombat set for the whole
    // session, so clicking Fight simply did nothing with no explanation.
    if (inCombat) { get().addCombatLog(getT().challenge.blockedInOperation, 'system'); return; }
    const now = Date.now();
    if (lastChallengeAt > now) { lastChallengeAt = now; set({ lastChallengeAt: now }); }
    if (now - lastChallengeAt < CHALLENGE_COOLDOWN) return;
    if (bossIdx > challengeUnlocked) return;
    const boss = CHALLENGE_BOSSES[bossIdx];
    if (!boss) return;

    const shieldHp = boss.powers.includes('shield') ? Math.floor(boss.maxHp * 0.25) : 0;
    const t = getT();
    const openLog: string[] = [t.combat.bossStart(boss.name, boss.level)];
    if (boss.powers.includes('armor_break')) openLog.push(t.combat.armorBreak);
    if (shieldHp > 0) openLog.push(t.combat.bossShield(shieldHp));

    set({
      lastChallengeAt: now,
      challengeFight: { bossIdx, bossHp: boss.maxHp, shieldHp, rageActive: false, round: 0 },
      challengeFightLog: openLog,
      challengeLastHit: null,
    });
  },

  attackChallengeBoss: () => {
    const { hero, challengeFight, challengeFightLog, challengeUnlocked } = get();
    if (!challengeFight) return;

    const boss = CHALLENGE_BOSSES[challengeFight.bossIdx];
    const pw = boss.powers;
    const heroAtk = getHeroAttack(hero);
    const heroDef = getHeroDefense(hero);
    const effectiveHeroDef = pw.includes('armor_break') ? Math.floor(heroDef * 0.4) : heroDef;

    let { bossHp, shieldHp, rageActive } = challengeFight;
    const { round } = challengeFight;
    let heroHp = hero.hp;
    const heroMaxHp = hero.maxHp;
    const r = round + 1;
    const log = [...challengeFightLog];

    const t = getT();
    const event: ChallengeHitEvent = {
      heroDmg: 0, heroCrit: false, isDodge: false,
      bossDmg1: 0, bossDmg2: 0, poisonDmg: 0,
      regenAmt: 0, lifeSteal: 0, rageTrigger: false,
      ts: Date.now(),
    };

    const heroGoesFirst = Math.random() < 0.5;

    const doHeroAttack = () => {
      const critChance = calcCritChance(hero.stats.dexterity + getEquipmentStats(hero.equipment).dexterity, hero.level);
      const isCrit = Math.random() < critChance;
      if (pw.includes('dodge') && Math.random() < 0.25) {
        event.isDodge = true;
        log.push(t.combat.dodgeRound(r, boss.name));
      } else {
        const base = heroAtk * heroAtk / (heroAtk + Math.max(1, boss.defense));
        let heroDmg = Math.max(1, Math.round(base * (0.8 + Math.random() * 0.4) * (isCrit ? 2 : 1)));
        if (shieldHp > 0) {
          const abs = Math.min(shieldHp, heroDmg);
          shieldHp -= abs; heroDmg -= abs;
          log.push(`${t.combat.shieldAbsorb(r, abs)}${shieldHp > 0 ? ` (${getLang() !== 'pl' ? 'remaining' : 'pozostało'}: ${shieldHp})` : ` — ${t.combat.shieldDestroyed}`}`);
        }
        if (heroDmg > 0) {
          bossHp -= heroDmg;
          event.heroDmg = heroDmg;
          event.heroCrit = isCrit;
          log.push(`${t.combat.dealDamageRound(r, heroDmg, Math.max(0, bossHp))}/${boss.maxHp}${isCrit ? ` ${t.combat.critical}` : ''}`);
        }
      }
    };

    const doBossAttack = () => {
      // ── Boss regen ──
      if (pw.includes('regen')) {
        const rAmt = Math.round(boss.maxHp * 0.03);
        bossHp = Math.min(boss.maxHp, bossHp + rAmt);
        event.regenAmt = rAmt;
        log.push(`${t.combat.regenRound(r, rAmt, bossHp)}/${boss.maxHp}`);
      }
      // ── Rage trigger ──
      if (pw.includes('rage') && !rageActive && bossHp < boss.maxHp * 0.3) {
        rageActive = true;
        event.rageTrigger = true;
        log.push(t.combat.furyRound(r, boss.name));
      }
      // ── Boss attacks ──
      const atkMod = rageActive ? 1.6 : 1;
      const bAtkVal = boss.attack * atkMod;
      const calcBossDmg = () => {
        const base = bAtkVal * bAtkVal / (bAtkVal + Math.max(1, effectiveHeroDef));
        return Math.max(1, Math.round(base * (0.8 + Math.random() * 0.4)));
      };
      const dmg1 = calcBossDmg();
      heroHp -= dmg1;
      event.bossDmg1 = (event.bossDmg1 ?? 0) + dmg1;
      if (pw.includes('lifesteal')) {
        const steal = Math.round(dmg1 * 0.25);
        bossHp = Math.min(boss.maxHp, bossHp + steal);
        event.lifeSteal += steal;
        log.push(t.combat.vampRound(r, steal));
      }
      log.push(t.combat.bossAttack(r, boss.name, dmg1, Math.max(0, heroHp)));
      if (heroHp > 0 && pw.includes('double_strike')) {
        const dmg2 = calcBossDmg();
        heroHp -= dmg2;
        event.bossDmg2 = (event.bossDmg2 ?? 0) + dmg2;
        if (pw.includes('lifesteal')) {
          const steal2 = Math.round(dmg2 * 0.25);
          bossHp = Math.min(boss.maxHp, bossHp + steal2);
          event.lifeSteal += steal2;
        }
        log.push(t.combat.doubleHit(r, dmg2, Math.max(0, heroHp)));
      }
      if (heroHp > 0 && pw.includes('poison')) {
        const pd = Math.round(heroMaxHp * 0.04);
        heroHp -= pd;
        event.poisonDmg = pd;
        log.push(t.combat.poisonRound(r, pd, Math.max(0, heroHp)));
      }
    };

    // ── Execute in random order ──
    if (heroGoesFirst) {
      doHeroAttack();
      if (bossHp <= 0) {
        log.push(t.combat.bossVictory(boss.name, r));
        get().addXp(boss.xpReward);
        get().addGold(boss.goldReward);
        const freshHero = get().hero;
        const loot = challengeLoot(challengeFight.bossIdx, freshHero.level, freshHero.inventory);
        const newInventory = [...freshHero.inventory, ...loot];
        const newUnlocked = Math.max(challengeUnlocked, challengeFight.bossIdx + 1);
        set({ hero: { ...freshHero, inventory: newInventory }, challengeUnlocked: newUnlocked, challengeFight: null, challengeFightLog: [], challengeLastHit: { ...event, ts: Date.now() }, challengeResult: { won: true, bossIdx: challengeFight.bossIdx, log, loot } });
        get().saveGame();
        return;
      }
      doBossAttack();
    } else {
      log.push(`⚡ ${boss.name} ${getLang() !== 'pl' ? 'attacks first!' : 'atakuje pierwszy!'}`);
      doBossAttack();
      if (heroHp <= 0) {
        log.push(t.combat.bossDefeat(r));
        set({ hero: { ...hero, hp: 1 }, challengeFight: null, challengeFightLog: [], challengeLastHit: { ...event, ts: Date.now() }, challengeResult: { won: false, bossIdx: challengeFight.bossIdx, log, loot: [] } });
        get().saveGame();
        return;
      }
      doHeroAttack();
      if (bossHp <= 0) {
        log.push(t.combat.bossVictory(boss.name, r));
        get().addXp(boss.xpReward);
        get().addGold(boss.goldReward);
        const freshHero = get().hero;
        const loot = challengeLoot(challengeFight.bossIdx, freshHero.level, freshHero.inventory);
        const newInventory = [...freshHero.inventory, ...loot];
        const newUnlocked = Math.max(challengeUnlocked, challengeFight.bossIdx + 1);
        set({ hero: { ...freshHero, inventory: newInventory }, challengeUnlocked: newUnlocked, challengeFight: null, challengeFightLog: [], challengeLastHit: { ...event, ts: Date.now() }, challengeResult: { won: true, bossIdx: challengeFight.bossIdx, log, loot } });
        get().saveGame();
        return;
      }
    }

    // ── Hero death check (for hero-first path where boss attacked second) ──
    if (heroHp <= 0) {
      log.push(t.combat.bossDefeat(r));
      set({ hero: { ...hero, hp: 1 }, challengeFight: null, challengeFightLog: [], challengeLastHit: { ...event, ts: Date.now() }, challengeResult: { won: false, bossIdx: challengeFight.bossIdx, log, loot: [] } });
      get().saveGame();
      return;
    }

    set({
      hero: { ...hero, hp: heroHp },
      challengeFight: { bossIdx: challengeFight.bossIdx, bossHp, shieldHp, rageActive, round: r },
      challengeFightLog: log.slice(-40),
      challengeLastHit: { ...event, ts: Date.now() },
    });
  },

  fleeChallengeFight: () => {
    const { challengeFight } = get();
    if (!challengeFight) return;
    set({ challengeFight: null, challengeFightLog: [] });
  },

  clearChallengeResult: () => {
    set({ challengeResult: null });
  },

  takeDamageInGuildRaid: (amount: number) => {
    const { hero } = get();
    set({ hero: { ...hero, hp: Math.max(0, hero.hp - amount) } });
    get().saveGame();
  },

  enhanceItem: (source, idxOrSlot) => {
    const { hero } = get();
    const ENHANCE_COST_PER_LV = [20, 50, 100, 200, 400, 800, 1500, 2500, 4000];
    const ENHANCE_CHANCES = [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1];
    const MAX_ENHANCE = 9;

    let item: Item | undefined;
    if (source === 'inventory') {
      item = hero.inventory[idxOrSlot as number];
    } else {
      item = hero.equipment[idxOrSlot as keyof typeof hero.equipment] as Item | undefined;
    }
    if (!item) return;
    if (item.slot === 'consumable' || item.slot === 'mystery_box') return;

    const currentLevel = item.enhanceLevel ?? 0;
    if (currentLevel >= MAX_ENHANCE) return;

    const cost = (item.level ?? 1) * ENHANCE_COST_PER_LV[currentLevel];
    if (hero.gold < cost) return;

    const chance = ENHANCE_CHANCES[currentLevel];
    const success = Math.random() < chance;
    const newLevel = success ? currentLevel + 1 : Math.max(0, currentLevel - 1);
    const updatedItem: Item = { ...item, enhanceLevel: newLevel };

    const t = getT();
    const itemName = getLang() !== 'pl' ? (item.nameEn ?? item.name) : item.name;
    const plusBefore = currentLevel > 0 ? `+${currentLevel}` : '';
    const plusAfter = `+${newLevel}`;

    if (success) {
      get().addCombatLog(`⚒ ${t.smith.success(itemName, plusBefore, plusAfter)}`, 'system');
    } else {
      get().addCombatLog(`⚒ ${t.smith.fail(itemName, plusBefore, plusAfter)}`, 'system');
    }

    let updatedHero = { ...hero, gold: hero.gold - cost };
    if (source === 'inventory') {
      const inv = [...hero.inventory];
      inv[idxOrSlot as number] = updatedItem;
      updatedHero = { ...updatedHero, inventory: inv };
      // Also update equipped copy if it was synced
    } else {
      updatedHero = { ...updatedHero, equipment: { ...hero.equipment, [idxOrSlot as keyof typeof hero.equipment]: updatedItem } };
    }
    set({ hero: updatedHero });
    get().saveGame();
  },

  incrementKryptaRuns: () => {
    const { hero } = get();
    const current = Number.isFinite(hero.kryptaRunsToday) ? hero.kryptaRunsToday : 0;
    set({ hero: { ...hero, kryptaRunsToday: current + 1 } });
    get().saveGame();
  },

  addToInventory: (item) => {
    const { hero } = get();
    if (hero.inventory.length >= MAX_INVENTORY) return;
    set({ hero: { ...hero, inventory: [...hero.inventory, item] } });
    get().saveGame();
  },

  openMysteryBoxModal: (box, invIdx) => {
    // Remove box from inventory immediately on open — prevents infinite rerolling
    // by closing and reopening. The won item must be collected or discarded.
    const { hero } = get();
    const newInventory = hero.inventory.filter((_, i) => i !== invIdx);
    set({ hero: { ...hero, inventory: newInventory }, mysteryBoxPending: { box, invIdx } });
    get().saveGame();
  },

  collectMysteryBoxReward: (_box, _invIdx, wonItem) => {
    const { hero } = get();
    // Box already removed on open; just add the won item if there's space
    if (hero.inventory.length >= 20) return false;
    set({ hero: { ...hero, inventory: [...hero.inventory, wonItem] }, mysteryBoxPending: null });
    get().saveGame();
    return true;
  },

  dismissMysteryBox: () => {
    // Box already consumed — just close the modal (won item is discarded)
    set({ mysteryBoxPending: null });
  },

  saveGame: () => {
    const state = get();
    // Never persist the placeholder hero shown before a character exists (or
    // while the real one is still loading): written to localStorage it hid the
    // character-creation screen, and synced it could overwrite a real cloud save.
    if (!state.heroReady) return;
    // When the game requires an account, a save made while signed out would carry
    // no owner and could later be loaded into a different account.
    if (isFirebaseConfigured && !useAuthStore.getState().user) return;
    const save = {
      uid: useAuthStore.getState().user?.uid ?? null,
      hero: state.hero,
      activeQuest: state.activeQuest,
      lastSaved: Date.now(),
      shopSeed: state.shopSeed,
      lastShopRefresh: state.lastShopRefresh,
      shopPurchased: state.shopPurchased,
      lastPvpFight: state.lastPvpFight,
      pvpWins: state.pvpWins,
      pvpLosses: state.pvpLosses,
      pvpRating: state.pvpRating,
      pvpLog: state.pvpLog,
      lastPassiveRegenAt: state.lastPassiveRegenAt,
      challengeUnlocked: state.challengeUnlocked,
      lastChallengeAt: state.lastChallengeAt,
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch {
      // storage full or unavailable
    }
    set({ lastSaved: save.lastSaved });
  },

  loadGame: () => {
    try {
      // One-time migration from old key
      if (!localStorage.getItem(SAVE_KEY) && localStorage.getItem(OLD_SAVE_KEY)) {
        localStorage.setItem(SAVE_KEY, localStorage.getItem(OLD_SAVE_KEY)!);
        localStorage.removeItem(OLD_SAVE_KEY);
      }
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const save = JSON.parse(raw);
      // The device keeps one local save. If it belongs to a different account than
      // the one signed in, loading it would hand that account's hero — and its
      // items and gold — to this one on the next cloud sync.
      const currentUid = useAuthStore.getState().user?.uid ?? null;
      if (currentUid && save.uid && save.uid !== currentUid) return;
      if (save.hero) {
        // migrate old stat names
        const migrateStats = (s: any): Stats => ({
          strength: s.strength ?? 0,
          dexterity: s.dexterity ?? s.agility ?? 0,
          intelligence: s.intelligence ?? 0,
          vitality: s.vitality ?? s.constitution ?? 0,
          magic: s.magic ?? 4,
          magicResistance: s.magicResistance ?? 4,
        });
        const migrateItemStats = (s: any): Partial<Stats> => ({
          ...(s.strength        ? { strength:        s.strength        } : {}),
          ...(s.dexterity       ? { dexterity:       s.dexterity       } : {}),
          ...(s.intelligence    ? { intelligence:    s.intelligence    } : {}),
          ...(s.vitality        ? { vitality:        s.vitality        } : {}),
          ...(s.magic           ? { magic:           s.magic           } : {}),
          ...(s.magicResistance ? { magicResistance: s.magicResistance } : {}),
        });
        const migrateItem = (item: any) => item
          ? { ...item, level: item.level ?? 1, goldValue: item.goldValue ?? 1, stats: item.slot === 'mystery_box' ? {} : migrateItemStats(item.stats ?? {}) }
          : item;
        const migrateEquipment = (eq: any) => {
          if (!eq) return {};
          const result: any = {};
          for (const [k, v] of Object.entries(eq)) result[k] = migrateItem(v);
          return result;
        };

        const isLegacySave = save.hero.dungeonRunsToday === undefined;
        const loadedHero: Hero = {
          name: save.hero.name,
          level: save.hero.level ?? 1,
          xp: save.hero.xp ?? 0,
          // Always recompute from the current curve so live balance changes to
          // calcXpToNext apply to existing saves immediately (not just on next level-up).
          xpToNext: calcXpToNext(save.hero.level ?? 1),
          maxHp: save.hero.maxHp ?? getHeroMaxHp(migrateStats(save.hero.stats ?? {}), save.hero.level ?? 1, migrateEquipment(save.hero.equipment)),
          hp: Math.max(1, save.hero.hp ?? save.hero.maxHp ?? getHeroMaxHp(migrateStats(save.hero.stats ?? {}), save.hero.level ?? 1, migrateEquipment(save.hero.equipment))),
          restingUntil: isLegacySave ? null : (save.hero.restingUntil ?? null),
          voluntaryRestUntil: save.hero.voluntaryRestUntil ?? null,
          voluntaryRestHp: save.hero.voluntaryRestHp != null
            ? save.hero.voluntaryRestHp
            : (save.hero.voluntaryRestUntil && Date.now() < save.hero.voluntaryRestUntil
              ? Math.ceil((save.hero.voluntaryRestUntil - Date.now()) / 60000)
              : null),
          voluntaryRestStartAt: save.hero.voluntaryRestStartAt ?? null,
          beggingUntil: save.hero.beggingUntil ?? null,
          beggingReward: save.hero.beggingReward ?? null,
          beggingStartAt: save.hero.beggingStartAt ?? null,
          dungeonRunsToday: save.hero.dungeonRunsToday ?? 0,
          questsCompletedToday: save.hero.questsCompletedToday ?? 0,
          kryptaRunsToday: Number.isFinite(save.hero.kryptaRunsToday) ? save.hero.kryptaRunsToday : 0,
          lastDailyReset: save.hero.lastDailyReset ?? Date.now(),
          stats: migrateStats(save.hero.stats ?? {}),
          equipment: migrateEquipment(save.hero.equipment),
          inventory: (save.hero.inventory ?? []).map(migrateItem),
          gold: save.hero.gold ?? 100,
          gems: save.hero.gems ?? 0,
          attributePoints: save.hero.attributePoints ?? 0,
          skinTone: save.hero.skinTone ?? 1,
          hairColor: save.hero.hairColor ?? 2,
          clothingColor: save.hero.clothingColor ?? 0,
          portrait: save.hero.portrait ?? 0,
          unlockedPortraits: save.hero.unlockedPortraits ?? [],
          lastRespecAt: save.hero.lastRespecAt ?? null,
          completedDungeons: save.hero.completedDungeons ?? inferCompletedDungeons(save.hero.level ?? 1),
          lastCasinoSpinAt: save.hero.lastCasinoSpinAt ?? 0,
          goldEarnedToday: save.hero.goldEarnedToday ?? 0,
          // Dropping this reset the login streak to day 1 on every local load.
          streakDays: save.hero.streakDays ?? 0,
        };
        if (isLegacySave) loadedHero.hp = loadedHero.maxHp;
        set({
          heroReady: true,
          needsCharacterCreation: false,
          hero: loadedHero,
          activeQuest: save.activeQuest ?? null,
          lastSaved: save.lastSaved ?? 0,
          lastCloudSyncedAt: save.lastSaved ?? 0,
          shopSeed: save.shopSeed ?? Date.now(),
          lastShopRefresh: save.lastShopRefresh ?? 0,
          shopPurchased: save.shopPurchased ?? [],
          lastPvpFight: save.lastPvpFight ?? 0,
          pvpWins: save.pvpWins ?? 0,
          pvpLosses: save.pvpLosses ?? 0,
          pvpRating: save.pvpRating ?? 1000,
          pvpLog: save.pvpLog ?? [],
          lastPassiveRegenAt: save.lastPassiveRegenAt ?? Date.now(),
          challengeUnlocked: save.challengeUnlocked ?? 0,
          lastChallengeAt: save.lastChallengeAt ?? 0,
        });
        // Signed-in players get their daily reset from the claimDailyReward Cloud
        // Function (streak bonus, milestone chests); a local reset here would
        // pre-empt it. The local reset is only for offline play.
        if (currentUid) get().settleVoluntaryRest();
        else get().checkDailyReset();
      }
    } catch {
      // corrupt save
    }
  },
}));

export { scaledQuestDuration };
