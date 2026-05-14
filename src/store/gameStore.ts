import { create } from 'zustand';
import type { GameState, Hero, ItemSlot, Quest, Dungeon, Stats, CombatLog, Item, PvpResult, PvpOpponent, ChallengeHitEvent } from '../types';
import { useAuthStore } from './authStore';
import { getEnemyById, scaleEnemy } from '../data/enemies';
import { ALL_ITEMS } from '../data/items';
import { CHALLENGE_BOSSES } from '../data/challengeBosses';
import { heroAttackEnemy, enemyAttackHero, getHeroMaxHp, calcXpToNext, getHeroAttack, getHeroDefense } from '../utils/combat';

const SAVE_KEY = 'realm_of_valor_save';
const MAX_INVENTORY = 20;
const MAX_LOG = 50;
export const MAX_DAILY_DUNGEONS = 10;
export const MAX_DAILY_QUESTS = 10;
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

function tryDungeonLoot(heroLevel: number, dropChance: number, mode: 'xp' | 'balanced' | 'loot', difficulty: 'easy' | 'normal' | 'hard', set: (partial: any) => void, get: () => GameState): void {
  if (Math.random() >= dropChance) return;
  const hero = get().hero;
  if (hero.inventory.length >= MAX_INVENTORY) return;
  const baseRarity = rollRarity(mode, difficulty);
  const { rarity, bumped } = tryBumpRarity(baseRarity, difficulty);
  const lvMin = Math.max(1, heroLevel - 3);
  const lvMax = heroLevel + 5;
  let pool = ALL_ITEMS.filter(i => i.rarity === rarity && i.level >= lvMin && i.level <= lvMax && i.slot !== 'consumable');
  if (!pool.length) pool = ALL_ITEMS.filter(i => i.rarity === rarity && i.slot !== 'consumable');
  if (!pool.length) pool = ALL_ITEMS.filter(i => i.slot !== 'consumable');
  if (!pool.length) return;
  const item = pool[Math.floor(Math.random() * pool.length)];
  set({ hero: { ...hero, inventory: [...hero.inventory, item] } });
  const bumpTag = bumped ? ` ⬆️ AWANS ${RARITY_EMOJI[baseRarity]}→${RARITY_EMOJI[rarity]}` : '';
  get().addCombatLog(`${RARITY_EMOJI[rarity]} Drop: ${item.emoji} ${item.name}${RARITY_LABEL[rarity]}${bumpTag}`, 'loot');
}

function simDmg(atk: number, def: number): number {
  const base = atk * atk / (atk + Math.max(1, def));
  const isCrit = Math.random() < 0.10;
  const variance = 0.7 + Math.random() * 0.6;
  return Math.max(1, Math.round(base * variance * (isCrit ? 2 : 1)));
}

function simulatePvp(heroAtk: number, heroDef: number, heroHp: number, oppAtk: number, oppDef: number, oppHp: number): boolean {
  let hHp = heroHp;
  let oHp = oppHp;
  for (let i = 0; i < 300; i++) {
    oHp -= simDmg(heroAtk, oppDef);
    if (oHp <= 0) return true;
    hHp -= simDmg(oppAtk, heroDef);
    if (hHp <= 0) return false;
  }
  return hHp >= oHp;
}

function isSameDay(ts: number): boolean {
  const a = new Date(ts);
  const b = new Date();
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function challengeLoot(bossIdx: number, heroLevel: number, inventory: Item[]): Item[] {
  const slots = MAX_INVENTORY - inventory.length;
  if (slots <= 0) return [];
  const count = Math.min(slots, bossIdx >= 5 ? 3 : bossIdx >= 2 ? 2 : 1);
  const results: Item[] = [];
  for (let i = 0; i < count; i++) {
    const forceRarity: Rarity = bossIdx >= 5 ? 'legendary' : (bossIdx >= 2 && Math.random() < 0.5 ? 'legendary' : 'epic');
    const lvMin = Math.max(1, heroLevel - 5);
    const lvMax = heroLevel + 10;
    let pool = ALL_ITEMS.filter(it => it.rarity === forceRarity && it.level >= lvMin && it.level <= lvMax && it.slot !== 'consumable');
    if (!pool.length) pool = ALL_ITEMS.filter(it => it.rarity === forceRarity && it.slot !== 'consumable');
    if (!pool.length) continue;
    results.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  return results;
}

function scaledQuestDuration(durationMs: number, level: number): number {
  return Math.floor(durationMs * (1 + (level - 1) * 0.05));
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
    lastRespecAt: null,
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
  defeatedAtDungeon: null,
  lastSaved: Date.now(),
  shopSeed: Date.now(),
  lastShopRefresh: 0,
  shopPurchased: [],
  lastPvpFight: 0,
  pvpWins: 0,
  pvpLosses: 0,
  pvpLog: [],
  lastPassiveRegenAt: Date.now(),
  challengeUnlocked: 0,
  lastChallengeAt: 0,
  challengeResult: null,
  challengeFight: null,
  challengeFightLog: [],
  challengeLastHit: null,

  initHero: (name, skinTone = 1, hairColor = 2, skipSave = false, clothingColor = 0) => {
    const hero = createHero(name, skinTone, hairColor, clothingColor, 0);
    set({ hero, activeQuest: null, currentDungeon: null, currentFloor: 1, currentEnemy: null, combatLog: [], inCombat: false, shopSeed: Date.now(), lastShopRefresh: 0, shopPurchased: [], lastPvpFight: 0, pvpWins: 0, pvpLosses: 0, pvpLog: [], lastPassiveRegenAt: Date.now() });
    if (!skipSave) get().saveGame();
  },

  changeAppearance: (skinTone, hairColor, clothingColor) => {
    set(s => ({ hero: { ...s.hero, skinTone, hairColor, clothingColor } }));
    get().saveGame();
  },

  respecStats: () => {
    const { hero } = get();
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    if (hero.lastRespecAt !== null && now - hero.lastRespecAt < DAY) return;
    const totalPoints = hero.stats.strength + hero.stats.dexterity + hero.stats.intelligence + hero.stats.vitality + hero.stats.magic + hero.stats.magicResistance;
    const resetStats: Stats = { strength: 0, dexterity: 0, intelligence: 0, vitality: 0, magic: 0, magicResistance: 0 };
    const newMaxHp = getHeroMaxHp(resetStats, hero.level, hero.equipment);
    set({ hero: { ...hero, stats: resetStats, attributePoints: hero.attributePoints + totalPoints, maxHp: newMaxHp, hp: Math.min(hero.hp, newMaxHp), lastRespecAt: now } });
    get().addCombatLog('Statystyki zresetowane! Rozdziel punkty cech.', 'system');
    get().saveGame();
  },

  addXp: (amount) => {
    const { hero } = get();
    let { xp, xpToNext, level, stats, maxHp, hp, attributePoints } = hero;
    xp += amount;
    let leveled = false;
    while (xp >= xpToNext) {
      xp -= xpToNext;
      level++;
      xpToNext = calcXpToNext(level);
      leveled = true;
    }
    const newMaxHp = getHeroMaxHp(stats, level, hero.equipment);
    const hpGain = leveled ? newMaxHp - maxHp : 0;
    set({ hero: { ...hero, xp, xpToNext, level, maxHp: newMaxHp, hp: Math.min(hp + hpGain, newMaxHp), attributePoints } });
    if (leveled) get().addCombatLog(`Awansowałeś na poziom ${level}!`, 'system');
  },

  addGold: (amount) => {
    const { hero } = get();
    set({ hero: { ...hero, gold: hero.gold + amount } });
  },

  equipItem: (item: Item, invIdx?: number) => {
    if (item.slot === 'consumable') return;
    const { hero } = get();
    const oldEquipped = hero.equipment[item.slot as keyof typeof hero.equipment];
    const newInventory = [...hero.inventory];
    const idx = invIdx !== undefined ? invIdx : newInventory.findIndex(i => i === item || (i.id === item.id && i.name === item.name && i.level === item.level));
    if (idx !== -1) newInventory.splice(idx, 1);
    if (oldEquipped) newInventory.push(oldEquipped);
    const newEquipment = { ...hero.equipment, [item.slot as string]: item };
    const newMaxHp = getHeroMaxHp(hero.stats, hero.level, newEquipment);
    set({ hero: { ...hero, equipment: newEquipment, inventory: newInventory, maxHp: newMaxHp, hp: Math.min(hero.hp, newMaxHp) } });
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
  },

  sellItem: (item: Item, invIdx?: number) => {
    const { hero } = get();
    const newInventory = [...hero.inventory];
    const idx = invIdx !== undefined ? invIdx : newInventory.findIndex(i => i === item || (i.id === item.id && i.name === item.name && i.level === item.level));
    if (idx === -1) return;
    newInventory.splice(idx, 1);
    set({ hero: { ...hero, gold: hero.gold + item.goldValue, inventory: newInventory } });
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
    if (hero.restingUntil !== null && Date.now() < hero.restingUntil) {
      get().addCombatLog('Odpoczywasz po walce! Poczekaj az wroca sily.', 'system');
      return;
    }
    if (hero.dungeonRunsToday >= MAX_DAILY_DUNGEONS) {
      get().addCombatLog(`Dzienny limit lochow (${MAX_DAILY_DUNGEONS}) wyczerpany! Wróc jutro.`, 'system');
      return;
    }
    const diffStatMult = difficulty === 'easy' ? 0.7 : difficulty === 'hard' ? 1.5 : 1;
    const enemyId = dungeon.enemies[Math.floor(Math.random() * dungeon.enemies.length)];
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
      currentDungeon: dungeon,
      dungeonMode: mode,
      dungeonDifficulty: difficulty,
      currentFloor: 1,
      currentEnemy: { ...enemy },
      inCombat: true,
      combatLog: [],
      hero: { ...hero, dungeonRunsToday: hero.dungeonRunsToday + 1 },
    });
    get().addCombatLog(`Wchodzisz do "${dungeon.name}" — Pietro 1`, 'system');
    get().addCombatLog(`Napotykasz: ${enemy.emoji} ${enemy.name} (Poz. ${enemy.level})`, 'system');
    get().addCombatLog(`Lochy dzis: ${hero.dungeonRunsToday + 1}/${MAX_DAILY_DUNGEONS}`, 'system');
  },

  exitDungeon: () => {
    set({ currentDungeon: null, currentFloor: 1, currentEnemy: null, inCombat: false });
    get().addCombatLog('Opuszczasz loch.', 'system');
  },

  clearDefeat: () => {
    set({ defeatedAtDungeon: null });
  },

  attackEnemy: () => {
    const { hero, currentEnemy, currentDungeon, currentFloor } = get();
    if (!currentEnemy || !currentDungeon) return;

    const { damage: heroDmg, isCrit } = heroAttackEnemy(hero, currentEnemy);
    const newEnemyHp = Math.max(0, currentEnemy.hp - heroDmg);
    const critText = isCrit ? ' (KRYTYCZNY!)' : '';
    get().addCombatLog(`Zadajesz ${heroDmg} obrażeń${critText} ${currentEnemy.emoji} ${currentEnemy.name}`, 'hero');

    if (newEnemyHp <= 0) {
      get().addCombatLog(`Pokonales ${currentEnemy.emoji} ${currentEnemy.name}!`, 'system');
      const mode = get().dungeonMode;
      const diff = get().dungeonDifficulty;
      const diffRewardMult = diff === 'easy' ? 0.7 : diff === 'hard' ? 1.6 : 1;
      const diffStatMult   = diff === 'easy' ? 0.7 : diff === 'hard' ? 1.5 : 1;
      const xpMult  = (mode === 'xp' ? 1.8 : mode === 'loot' ? 0.3 : 1) * diffRewardMult;
      const goldMult = (mode === 'xp' ? 0.4 : mode === 'loot' ? 0.3 : 1) * diffRewardMult;
      const dropChance = mode === 'xp' ? 0.30 : mode === 'loot' ? 1.0 : 0.60;
      const xpEarned   = Math.round(currentEnemy.xpReward * xpMult);
      const goldEarned = Math.round(currentEnemy.goldReward * goldMult);
      get().addXp(xpEarned);
      get().addGold(goldEarned);
      get().addCombatLog(`+${xpEarned} XP, +${goldEarned} zlota`, 'loot');

      const nextFloor = currentFloor + 1;
      if (nextFloor > currentDungeon.floors) {
        get().addCombatLog(`Ukończyłeś loch "${currentDungeon.name}"! Brawo!`, 'system');
        tryDungeonLoot(get().hero.level, dropChance, mode, diff, set, get);
        set({ currentEnemy: null, currentFloor: nextFloor, inCombat: false });
      } else {
        const enemyId = currentDungeon.enemies[Math.floor(Math.random() * currentDungeon.enemies.length)];
        const baseEnemy = getEnemyById(enemyId);
        if (baseEnemy) {
          const scaled = scaleEnemy(baseEnemy, nextFloor);
          const nextEnemy = { ...scaled, hp: Math.round(scaled.hp * diffStatMult), maxHp: Math.round(scaled.maxHp * diffStatMult), attack: Math.round(scaled.attack * diffStatMult), defense: Math.round(scaled.defense * diffStatMult) };
          set({ currentEnemy: { ...nextEnemy }, currentFloor: nextFloor, inCombat: true });
          get().addCombatLog(`Piętro ${nextFloor}: ${nextEnemy.emoji} ${nextEnemy.name} atakuje!`, 'system');
        }
      }
    } else {
      const { damage: enemyDmg, isCrit: enemyCrit } = enemyAttackHero(currentEnemy, hero);
      const newHeroHp = Math.max(0, hero.hp - enemyDmg);
      get().addCombatLog(`${currentEnemy.emoji} ${currentEnemy.name} zadaje ci ${enemyDmg} obrażeń${enemyCrit ? ' 💥 KRYT!' : ''}`, 'enemy');

      if (newHeroHp <= 0) {
        get().addCombatLog('Zostałeś pokonany! Skorzystaj z odpoczynku by odzyskać HP.', 'system');
        const updatedHero = get().hero;
        set({
          hero: { ...updatedHero, hp: 1 },
          currentDungeon: null,
          currentEnemy: null,
          inCombat: false,
          defeatedAtDungeon: currentDungeon.name,
        });
      } else {
        set({ hero: { ...hero, hp: newHeroHp }, currentEnemy: { ...currentEnemy, hp: newEnemyHp } });
      }
    }
    get().saveGame();
  },

  autoFightEnemy: () => {
    const { hero, currentEnemy, currentDungeon, currentFloor } = get();
    if (!currentEnemy || !currentDungeon) return;

    let heroHp = hero.hp;
    let enemyHp = currentEnemy.hp;

    for (let i = 0; i < 500; i++) {
      const { damage: hDmg } = heroAttackEnemy(hero, currentEnemy);
      enemyHp = Math.max(0, enemyHp - hDmg);
      if (enemyHp <= 0) break;
      const { damage: eDmg } = enemyAttackHero(currentEnemy, hero);
      heroHp = Math.max(0, heroHp - eDmg);
      if (heroHp <= 0) break;
    }

    if (heroHp <= 0) {
      get().addCombatLog(`${currentEnemy.emoji} ${currentEnemy.name} cię pokonał!`, 'enemy');
      get().addCombatLog('Skorzystaj z odpoczynku by odzyskać HP.', 'system');
      set({ hero: { ...get().hero, hp: 1 }, currentDungeon: null, currentEnemy: null, inCombat: false, defeatedAtDungeon: currentDungeon.name });
    } else {
      get().addCombatLog(`Pokonales ${currentEnemy.emoji} ${currentEnemy.name}! (szybka walka)`, 'system');
      const mode2 = get().dungeonMode;
      const diff2 = get().dungeonDifficulty;
      const diffRewardMult2 = diff2 === 'easy' ? 0.7 : diff2 === 'hard' ? 1.6 : 1;
      const diffStatMult2   = diff2 === 'easy' ? 0.7 : diff2 === 'hard' ? 1.5 : 1;
      const xpMult2   = (mode2 === 'xp' ? 1.8 : mode2 === 'loot' ? 0.3 : 1) * diffRewardMult2;
      const goldMult2 = (mode2 === 'xp' ? 0.4 : mode2 === 'loot' ? 0.3 : 1) * diffRewardMult2;
      const dropChance2 = mode2 === 'xp' ? 0.30 : mode2 === 'loot' ? 1.0 : 0.60;
      const xpEarned2   = Math.round(currentEnemy.xpReward * xpMult2);
      const goldEarned2 = Math.round(currentEnemy.goldReward * goldMult2);
      get().addXp(xpEarned2);
      get().addGold(goldEarned2);
      get().addCombatLog(`+${xpEarned2} XP, +${goldEarned2} zlota`, 'loot');

      const fresh = get().hero;
      set({ hero: { ...fresh, hp: Math.min(heroHp, fresh.maxHp) } });

      const nextFloor = currentFloor + 1;
      if (nextFloor > currentDungeon.floors) {
        get().addCombatLog(`Ukończyłeś loch "${currentDungeon.name}"! Brawo!`, 'system');
        tryDungeonLoot(get().hero.level, dropChance2, mode2, diff2, set, get);
        set({ currentEnemy: null, currentFloor: nextFloor, inCombat: false });
      } else {
        const enemyId = currentDungeon.enemies[Math.floor(Math.random() * currentDungeon.enemies.length)];
        const baseEnemy = getEnemyById(enemyId);
        if (baseEnemy) {
          const scaled2 = scaleEnemy(baseEnemy, nextFloor);
          const nextEnemy = { ...scaled2, hp: Math.round(scaled2.hp * diffStatMult2), maxHp: Math.round(scaled2.maxHp * diffStatMult2), attack: Math.round(scaled2.attack * diffStatMult2), defense: Math.round(scaled2.defense * diffStatMult2) };
          set({ currentEnemy: { ...nextEnemy }, currentFloor: nextFloor, inCombat: true });
          get().addCombatLog(`Piętro ${nextFloor}: ${nextEnemy.emoji} ${nextEnemy.name} atakuje!`, 'system');
        }
      }
    }
    get().saveGame();
  },

  startQuest: (quest: Quest) => {
    const { hero, activeQuest } = get();
    if (activeQuest) return;
    if (hero.questsCompletedToday >= MAX_DAILY_QUESTS) {
      return;
    }
    const now = Date.now();
    const duration = scaledQuestDuration(quest.durationMs, hero.level);
    set({ activeQuest: { quest, startedAt: now, endsAt: now + duration } });
    get().saveGame();
  },

  collectQuest: () => {
    const { activeQuest, hero } = get();
    if (!activeQuest) return;
    if (Date.now() < activeQuest.endsAt) return;
    get().addXp(activeQuest.quest.xpReward);
    get().addGold(activeQuest.quest.goldReward);
    set({ activeQuest: null, hero: { ...get().hero, questsCompletedToday: hero.questsCompletedToday + 1 } });
    get().saveGame();
  },

  abandonQuest: () => {
    if (!get().activeQuest) return;
    set({ activeQuest: null });
    get().saveGame();
  },

  useItem: (item: Item, invIdx: number) => {
    const hero = get().hero;
    if (item.slot !== 'consumable') return;
    const newInventory = hero.inventory.filter((_, i) => i !== invIdx);
    const healAmount = Math.round(hero.maxHp * 1);
    const newHp = Math.min(hero.maxHp, hero.hp + healAmount);
    set({ hero: { ...hero, hp: newHp, inventory: newInventory } });
    get().addCombatLog(`${item.emoji} Użyto ${item.name}: +${newHp - hero.hp} HP`, 'system');
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
    const { lastShopRefresh } = get();
    const now = Date.now();
    if (now - lastShopRefresh < SHOP_REFRESH_COOLDOWN) return;
    set({ shopSeed: now, lastShopRefresh: now, shopPurchased: [] });
    get().saveGame();
  },

  performPvp: (opponent: PvpOpponent): PvpResult | null => {
    const { hero, lastPvpFight, pvpWins, pvpLosses, pvpLog, inCombat } = get();
    if (inCombat) return null;
    const now = Date.now();
    if (now - lastPvpFight < PVP_COOLDOWN) return null;
    const heroAtk = getHeroAttack(hero);
    const heroDef = getHeroDefense(hero);
    const won = simulatePvp(heroAtk, heroDef, hero.maxHp, opponent.attack ?? 10, opponent.defense ?? 5, opponent.maxHp ?? 100);
    const xpGained = won ? Math.max(20, opponent.level * 20) : 8;
    const goldGained = won ? Math.max(10, opponent.level * 10) : 0;
    const result: PvpResult = { won, opponentName: opponent.heroName, xpGained, goldGained, timestamp: now };
    set({
      lastPvpFight: now,
      pvpWins: won ? pvpWins + 1 : pvpWins,
      pvpLosses: won ? pvpLosses : pvpLosses + 1,
      pvpLog: [result, ...pvpLog].slice(0, 10),
    });
    get().addXp(xpGained);
    if (goldGained > 0) get().addGold(goldGained);
    get().saveGame();
    return result;
  },

  recordPvpResult: (won: boolean, opponent: PvpOpponent): PvpResult => {
    const { pvpWins, pvpLosses, pvpLog } = get();
    const now = Date.now();
    const xpGained = won ? Math.max(20, opponent.level * 20) : 8;
    const goldGained = won ? Math.max(10, opponent.level * 10) : 0;
    const result: PvpResult = { won, opponentName: opponent.heroName, xpGained, goldGained, timestamp: now };
    set({
      lastPvpFight: now,
      pvpWins: won ? pvpWins + 1 : pvpWins,
      pvpLosses: won ? pvpLosses : pvpLosses + 1,
      pvpLog: [result, ...pvpLog].slice(0, 10),
    });
    get().addXp(xpGained);
    if (goldGained > 0) get().addGold(goldGained);
    get().saveGame();
    return result;
  },

  restHero: (minutes: number) => {
    const { hero, inCombat, activeQuest } = get();
    if (inCombat) return;
    if (hero.voluntaryRestUntil !== null && Date.now() < hero.voluntaryRestUntil) return;
    if (hero.beggingUntil !== null && Date.now() < hero.beggingUntil) return;
    if (activeQuest) return;
    if (hero.hp >= hero.maxHp) return;
    const hpPerMin = Math.max(1, Math.round(hero.maxHp * 0.04));
    const hp = Math.min(minutes * hpPerMin, hero.maxHp - hero.hp);
    if (hp <= 0) return;
    const endsAt = Date.now() + minutes * 60 * 1000;
    set({ hero: { ...hero, voluntaryRestUntil: endsAt, voluntaryRestHp: hp, voluntaryRestStartAt: Date.now() } });
    get().addCombatLog(`Odpoczywasz ${minutes} min... Odzyskasz ${hp} HP.`, 'system');
    get().saveGame();
  },

  cancelRest: () => {
    const { hero } = get();
    if (!hero.voluntaryRestUntil || !hero.voluntaryRestHp) return;
    const now = Date.now();
    if (now >= hero.voluntaryRestUntil) return;
    let earned = 0;
    if (hero.voluntaryRestStartAt) {
      const elapsed = now - hero.voluntaryRestStartAt;
      const total = hero.voluntaryRestUntil - hero.voluntaryRestStartAt;
      earned = Math.floor(hero.voluntaryRestHp * elapsed / Math.max(1, total));
    }
    const healAmount = Math.min(earned, hero.maxHp - hero.hp);
    set({ hero: { ...hero, hp: hero.hp + healAmount, voluntaryRestUntil: null, voluntaryRestHp: null, voluntaryRestStartAt: null } });
    if (healAmount > 0) get().addCombatLog(`Przerwałeś odpoczynek. Odzyskałeś +${healAmount} HP.`, 'system');
    else get().addCombatLog('Przerwałeś odpoczynek.', 'system');
    get().saveGame();
  },

  startBegging: (hours: number) => {
    const { hero, inCombat, activeQuest } = get();
    if (inCombat) return;
    if (hero.beggingUntil !== null && Date.now() < hero.beggingUntil) return;
    if (hero.voluntaryRestUntil !== null && Date.now() < hero.voluntaryRestUntil) return;
    if (activeQuest) return;
    const clampedHours = Math.max(1, Math.min(10, Math.round(hours)));
    const goldReward = Math.floor(clampedHours * (5 + hero.level * 2) * (0.8 + Math.random() * 0.4));
    const endsAt = Date.now() + clampedHours * 60 * 60 * 1000;
    set({ hero: { ...hero, beggingUntil: endsAt, beggingReward: goldReward, beggingStartAt: Date.now() } });
    get().addCombatLog(`Zacząłeś żebrać na ${clampedHours}h. Zarobisz ~${goldReward}🪙.`, 'system');
    get().saveGame();
  },

  cancelBegging: () => {
    const { hero } = get();
    if (!hero.beggingUntil || !hero.beggingReward) return;
    const now = Date.now();
    if (now >= hero.beggingUntil) return;
    let earned = 0;
    if (hero.beggingStartAt) {
      const elapsed = now - hero.beggingStartAt;
      const total = hero.beggingUntil - hero.beggingStartAt;
      earned = Math.floor(hero.beggingReward * elapsed / Math.max(1, total));
    }
    set({ hero: { ...hero, gold: hero.gold + earned, beggingUntil: null, beggingReward: null, beggingStartAt: null } });
    if (earned > 0) get().addCombatLog(`Przerwałeś żebranie. Zarobiłeś +${earned}🪙.`, 'loot');
    else get().addCombatLog('Przerwałeś żebranie.', 'system');
    get().saveGame();
  },

  collectBegging: () => {
    const { hero } = get();
    if (!hero.beggingUntil || Date.now() < hero.beggingUntil) return;
    const reward = hero.beggingReward ?? 0;
    set({ hero: { ...hero, gold: hero.gold + reward, beggingUntil: null, beggingReward: null, beggingStartAt: null } });
    get().addCombatLog(`Zebrałeś jałmużnę! +${reward}🪙`, 'loot');
    get().saveGame();
  },

  checkDailyReset: () => {
    const { hero } = get();
    if (!isSameDay(hero.lastDailyReset)) {
      set({
        hero: {
          ...hero,
          dungeonRunsToday: 0,
          questsCompletedToday: 0,
          lastDailyReset: Date.now(),
        },
      });
    }
    // Apply voluntary rest recovery if time is up
    if (hero.voluntaryRestUntil !== null && Date.now() >= hero.voluntaryRestUntil) {
      const updated = get().hero;
      const healAmount = Math.min(updated.voluntaryRestHp ?? 0, updated.maxHp - updated.hp);
      set({ hero: { ...updated, hp: updated.hp + healAmount, voluntaryRestUntil: null, voluntaryRestHp: null, voluntaryRestStartAt: null } });
      if (healAmount > 0) get().addCombatLog(`Odpocząłeś! +${healAmount} HP.`, 'system');
    }
  },

  tickPassiveRegen: () => {
    const { hero, lastPassiveRegenAt } = get();
    const now = Date.now();
    const isResting = (hero.restingUntil !== null && now < hero.restingUntil) ||
                      (hero.voluntaryRestUntil !== null && now < hero.voluntaryRestUntil);
    if (isResting || hero.hp >= hero.maxHp) {
      set({ lastPassiveRegenAt: now });
      return;
    }
    const elapsed = now - lastPassiveRegenAt;
    const gain = Math.floor(elapsed * (hero.maxHp * 0.004) / 60000);
    if (gain < 1) return;
    set({ hero: { ...hero, hp: Math.min(hero.maxHp, hero.hp + gain) }, lastPassiveRegenAt: now });
  },

  startChallengeFight: (bossIdx: number) => {
    const { inCombat, lastChallengeAt, challengeUnlocked } = get();
    if (inCombat) return;
    const now = Date.now();
    if (now - lastChallengeAt < CHALLENGE_COOLDOWN) return;
    if (bossIdx > challengeUnlocked) return;
    const boss = CHALLENGE_BOSSES[bossIdx];
    if (!boss) return;

    const shieldHp = boss.powers.includes('shield') ? Math.floor(boss.maxHp * 0.25) : 0;
    const openLog: string[] = [`⚡ Walka z ${boss.name} rozpoczęta! (Poz. ${boss.level})`];
    if (boss.powers.includes('armor_break')) openLog.push(`💥 ARMOR BREAK: Twoja obrona zredukowana o 60%!`);
    if (shieldHp > 0) openLog.push(`🛡 TARCZA: Boss ma tarczę pochłaniającą ${shieldHp} obrażeń!`);

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

    let { bossHp, shieldHp, rageActive, round } = challengeFight;
    let heroHp = hero.hp;
    const heroMaxHp = hero.maxHp;
    const r = round + 1;
    const log = [...challengeFightLog];

    const event: ChallengeHitEvent = {
      heroDmg: 0, heroCrit: false, isDodge: false,
      bossDmg1: 0, bossDmg2: 0, poisonDmg: 0,
      regenAmt: 0, lifeSteal: 0, rageTrigger: false,
      ts: Date.now(),
    };

    // ── Hero attacks ──
    const critChance = 0.10 + hero.stats.dexterity * 0.005;
    const isCrit = Math.random() < critChance;
    if (pw.includes('dodge') && Math.random() < 0.25) {
      event.isDodge = true;
      log.push(`R${r} 💨 UNIK: ${boss.name} unika ataku!`);
    } else {
      const base = heroAtk * heroAtk / (heroAtk + Math.max(1, boss.defense));
      let heroDmg = Math.max(1, Math.round(base * (0.8 + Math.random() * 0.4) * (isCrit ? 2 : 1)));
      if (shieldHp > 0) {
        const abs = Math.min(shieldHp, heroDmg);
        shieldHp -= abs; heroDmg -= abs;
        log.push(`R${r} 🛡 Tarcza pochłania ${abs}${shieldHp > 0 ? ` (pozostało: ${shieldHp})` : ' — ZNISZCZONA!'}`);
      }
      if (heroDmg > 0) {
        bossHp -= heroDmg;
        event.heroDmg = heroDmg;
        event.heroCrit = isCrit;
        log.push(`R${r} ⚔${isCrit ? ' KRYT!' : ''} Zadajesz ${heroDmg} → Boss: ${Math.max(0, bossHp)}/${boss.maxHp}`);
      }
    }

    // ── Boss death? ──
    if (bossHp <= 0) {
      log.push(`🏆 ZWYCIĘSTWO! Pokonałeś ${boss.name} w rundzie ${r}!`);
      const loot = challengeLoot(challengeFight.bossIdx, hero.level, hero.inventory);
      const newInventory = [...hero.inventory, ...loot];
      const newUnlocked = Math.max(challengeUnlocked, Math.min(challengeFight.bossIdx + 1, CHALLENGE_BOSSES.length - 1));
      set({
        hero: { ...hero, inventory: newInventory },
        challengeUnlocked: newUnlocked,
        challengeFight: null,
        challengeFightLog: [],
        challengeLastHit: { ...event, ts: Date.now() },
        challengeResult: { won: true, bossIdx: challengeFight.bossIdx, log, loot },
      });
      get().addXp(boss.xpReward);
      get().addGold(boss.goldReward);
      get().saveGame();
      return;
    }

    // ── Boss regen ──
    if (pw.includes('regen')) {
      const rAmt = Math.round(boss.maxHp * 0.03);
      bossHp = Math.min(boss.maxHp, bossHp + rAmt);
      event.regenAmt = rAmt;
      log.push(`R${r} 🔴 REGEN: +${rAmt} HP → ${bossHp}/${boss.maxHp}`);
    }

    // ── Rage trigger ──
    if (pw.includes('rage') && !rageActive && bossHp < boss.maxHp * 0.3) {
      rageActive = true;
      event.rageTrigger = true;
      log.push(`R${r} 🔥 FURIA: ${boss.name} wchodzi w szał! ATK x1.6!`);
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
    event.bossDmg1 = dmg1;
    if (pw.includes('lifesteal')) {
      const steal = Math.round(dmg1 * 0.25);
      bossHp = Math.min(boss.maxHp, bossHp + steal);
      event.lifeSteal += steal;
      log.push(`R${r} 💉 VAMP: +${steal} HP`);
    }
    log.push(`R${r} 🤖 ${boss.name}: -${dmg1} HP → Ty: ${Math.max(0, heroHp)}/${heroMaxHp}`);

    if (heroHp > 0 && pw.includes('double_strike')) {
      const dmg2 = calcBossDmg();
      heroHp -= dmg2;
      event.bossDmg2 = dmg2;
      if (pw.includes('lifesteal')) {
        const steal2 = Math.round(dmg2 * 0.25);
        bossHp = Math.min(boss.maxHp, bossHp + steal2);
        event.lifeSteal += steal2;
      }
      log.push(`R${r} ⚡ [x2]: -${dmg2} HP → Ty: ${Math.max(0, heroHp)}/${heroMaxHp}`);
    }

    // ── Poison ──
    if (heroHp > 0 && pw.includes('poison')) {
      const pd = Math.round(heroMaxHp * 0.04);
      heroHp -= pd;
      event.poisonDmg = pd;
      log.push(`R${r} 🟢 TRUCIZNA: -${pd} HP → ${Math.max(0, heroHp)}/${heroMaxHp}`);
    }

    // ── Hero death? ──
    if (heroHp <= 0) {
      log.push(`💀 KLĘSKA! Pokonany w rundzie ${r}.`);
      set({
        hero: { ...hero, hp: 1 },
        challengeFight: null,
        challengeFightLog: [],
        challengeLastHit: { ...event, ts: Date.now() },
        challengeResult: { won: false, bossIdx: challengeFight.bossIdx, log, loot: [] },
      });
      get().addXp(Math.floor(boss.xpReward * 0.1));
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

  saveGame: () => {
    const state = get();
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
    set({ lastSaved: Date.now() });
  },

  loadGame: () => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const save = JSON.parse(raw);
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
        const migrateItem = (item: any) => item ? { ...item, stats: migrateStats(item.stats ?? {}) } : item;
        const migrateEquipment = (eq: any) => {
          if (!eq) return {};
          const result: any = {};
          for (const [k, v] of Object.entries(eq)) result[k] = migrateItem(v);
          return result;
        };

        const isLegacySave = save.hero.dungeonRunsToday === undefined;
        const loadedHero: Hero = {
          name: save.hero.name,
          level: save.hero.level,
          xp: save.hero.xp,
          xpToNext: save.hero.xpToNext,
          hp: save.hero.hp,
          maxHp: save.hero.maxHp,
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
          portrait: (save.hero.portrait ?? 0) as 0 | 1,
          lastRespecAt: save.hero.lastRespecAt ?? null,
        };
        if (isLegacySave) loadedHero.hp = loadedHero.maxHp;
        set({
          hero: loadedHero,
          activeQuest: save.activeQuest ?? null,
          lastSaved: save.lastSaved ?? Date.now(),
          shopSeed: save.shopSeed ?? Date.now(),
          lastShopRefresh: save.lastShopRefresh ?? 0,
          shopPurchased: save.shopPurchased ?? [],
          lastPvpFight: save.lastPvpFight ?? 0,
          pvpWins: save.pvpWins ?? 0,
          pvpLosses: save.pvpLosses ?? 0,
          pvpLog: save.pvpLog ?? [],
          lastPassiveRegenAt: save.lastPassiveRegenAt ?? Date.now(),
          challengeUnlocked: save.challengeUnlocked ?? 0,
          lastChallengeAt: save.lastChallengeAt ?? 0,
        });
        get().checkDailyReset();
      }
    } catch {
      // corrupt save
    }
  },
}));

export { scaledQuestDuration };
