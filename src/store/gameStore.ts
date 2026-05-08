import { create } from 'zustand';
import type { GameState, Hero, ItemSlot, Quest, Dungeon, Stats, CombatLog, Item, PvpResult, PvpOpponent } from '../types';
import { useAuthStore } from './authStore';
import { getEnemyById, scaleEnemy } from '../data/enemies';
import { getItemById } from '../data/items';
import { heroAttackEnemy, enemyAttackHero, getHeroMaxHp, calcXpToNext, getHeroAttack, getHeroDefense } from '../utils/combat';

const SAVE_KEY = 'realm_of_valor_save';
const MAX_INVENTORY = 20;
const MAX_LOG = 50;
export const MAX_DAILY_DUNGEONS = 10;
export const MAX_DAILY_QUESTS = 10;
export const SHOP_REFRESH_COOLDOWN = 60 * 60 * 1000;
export const PVP_COOLDOWN = 15 * 60 * 1000;

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

function scaledQuestDuration(durationMs: number, level: number): number {
  return Math.floor(durationMs * (1 + (level - 1) * 0.05));
}

function createHero(name: string, skinTone = 1, hairColor = 2, clothingColor = 0): Hero {
  const stats: Stats = { strength: 4, dexterity: 4, intelligence: 4, vitality: 4 };
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
    lastRespecAt: null,
  };
}

export const useGameStore = create<GameState>((set, get) => ({
  hero: createHero('Hero'),
  activeQuest: null,
  currentDungeon: null,
  currentFloor: 1,
  currentEnemy: null,
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

  initHero: (name, skinTone = 1, hairColor = 2, skipSave = false, clothingColor = 0) => {
    const hero = createHero(name, skinTone, hairColor, clothingColor);
    set({ hero, activeQuest: null, currentDungeon: null, currentFloor: 1, currentEnemy: null, combatLog: [], inCombat: false, shopSeed: Date.now(), lastShopRefresh: 0, shopPurchased: [], lastPvpFight: 0, pvpWins: 0, pvpLosses: 0, pvpLog: [] });
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
    const totalPoints = hero.stats.strength + hero.stats.dexterity + hero.stats.intelligence + hero.stats.vitality;
    const resetStats: Stats = { strength: 0, dexterity: 0, intelligence: 0, vitality: 0 };
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
    const { hero } = get();
    const oldEquipped = hero.equipment[item.slot];
    const newInventory = [...hero.inventory];
    const idx = invIdx !== undefined ? invIdx : newInventory.findIndex(i => i === item || (i.id === item.id && i.name === item.name && i.level === item.level));
    if (idx !== -1) newInventory.splice(idx, 1);
    if (oldEquipped) newInventory.push(oldEquipped);
    const newEquipment = { ...hero.equipment, [item.slot]: item };
    const newMaxHp = getHeroMaxHp(hero.stats, hero.level, newEquipment);
    set({ hero: { ...hero, equipment: newEquipment, inventory: newInventory, maxHp: newMaxHp, hp: Math.min(hero.hp, newMaxHp) } });
  },

  unequipItem: (slot: ItemSlot) => {
    const { hero } = get();
    const item = hero.equipment[slot];
    if (!item) return;
    if (hero.inventory.length >= MAX_INVENTORY) return;
    const newEquipment = { ...hero.equipment };
    delete newEquipment[slot];
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

  enterDungeon: (dungeon: Dungeon) => {
    const { hero } = get();
    if (hero.level < dungeon.minLevel) return;
    if (hero.restingUntil !== null && Date.now() < hero.restingUntil) {
      get().addCombatLog('Odpoczywasz po walce! Poczekaj aż wrócą siły.', 'system');
      return;
    }
    if (hero.dungeonRunsToday >= MAX_DAILY_DUNGEONS) {
      get().addCombatLog(`Dzienny limit lochów (${MAX_DAILY_DUNGEONS}) wyczerpany! Wróć jutro.`, 'system');
      return;
    }
    const enemyId = dungeon.enemies[Math.floor(Math.random() * dungeon.enemies.length)];
    const baseEnemy = getEnemyById(enemyId);
    if (!baseEnemy) return;
    const enemy = scaleEnemy(baseEnemy, 1);
    set({
      currentDungeon: dungeon,
      currentFloor: 1,
      currentEnemy: { ...enemy },
      inCombat: true,
      combatLog: [],
      hero: { ...hero, dungeonRunsToday: hero.dungeonRunsToday + 1 },
    });
    get().addCombatLog(`Wchodzisz do "${dungeon.name}" — Piętro 1`, 'system');
    get().addCombatLog(`Napotykasz: ${enemy.emoji} ${enemy.name} (Poz. ${enemy.level})`, 'system');
    get().addCombatLog(`Lochy dziś: ${hero.dungeonRunsToday + 1}/${MAX_DAILY_DUNGEONS}`, 'system');
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
      get().addCombatLog(`Pokonałeś ${currentEnemy.emoji} ${currentEnemy.name}!`, 'system');
      get().addXp(currentEnemy.xpReward);
      get().addGold(currentEnemy.goldReward);
      get().addCombatLog(`+${currentEnemy.xpReward} XP, +${currentEnemy.goldReward} złota`, 'loot');

      if (Math.random() < 0.3 && currentEnemy.lootTable.length > 0) {
        const lootId = currentEnemy.lootTable[Math.floor(Math.random() * currentEnemy.lootTable.length)];
        const lootItem = getItemById(lootId);
        if (lootItem && get().hero.inventory.length < MAX_INVENTORY) {
          const storeHero = get().hero;
          set({ hero: { ...storeHero, inventory: [...storeHero.inventory, lootItem] } });
          get().addCombatLog(`Zdobywasz: ${lootItem.emoji} ${lootItem.name}!`, 'loot');
        }
      }

      const nextFloor = currentFloor + 1;
      if (nextFloor > currentDungeon.floors) {
        get().addCombatLog(`Ukończyłeś loch "${currentDungeon.name}"! Brawo!`, 'system');
        set({ currentEnemy: null, currentFloor: nextFloor, inCombat: false });
      } else {
        const enemyId = currentDungeon.enemies[Math.floor(Math.random() * currentDungeon.enemies.length)];
        const baseEnemy = getEnemyById(enemyId);
        if (baseEnemy) {
          const nextEnemy = scaleEnemy(baseEnemy, nextFloor);
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
      get().addCombatLog(`Pokonałeś ${currentEnemy.emoji} ${currentEnemy.name}! (szybka walka)`, 'system');
      get().addXp(currentEnemy.xpReward);
      get().addGold(currentEnemy.goldReward);
      get().addCombatLog(`+${currentEnemy.xpReward} XP, +${currentEnemy.goldReward} złota`, 'loot');

      if (Math.random() < 0.3 && currentEnemy.lootTable.length > 0) {
        const lootId = currentEnemy.lootTable[Math.floor(Math.random() * currentEnemy.lootTable.length)];
        const lootItem = getItemById(lootId);
        if (lootItem && get().hero.inventory.length < MAX_INVENTORY) {
          const h2 = get().hero;
          set({ hero: { ...h2, inventory: [...h2.inventory, lootItem] } });
          get().addCombatLog(`Zdobywasz: ${lootItem.emoji} ${lootItem.name}!`, 'loot');
        }
      }

      const fresh = get().hero;
      set({ hero: { ...fresh, hp: Math.min(heroHp, fresh.maxHp) } });

      const nextFloor = currentFloor + 1;
      if (nextFloor > currentDungeon.floors) {
        get().addCombatLog(`Ukończyłeś loch "${currentDungeon.name}"! Brawo!`, 'system');
        set({ currentEnemy: null, currentFloor: nextFloor, inCombat: false });
      } else {
        const enemyId = currentDungeon.enemies[Math.floor(Math.random() * currentDungeon.enemies.length)];
        const baseEnemy = getEnemyById(enemyId);
        if (baseEnemy) {
          const nextEnemy = scaleEnemy(baseEnemy, nextFloor);
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
    if (hero.level < quest.minLevel) return;
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
    const hpPerMin = Math.max(1, Math.round(hero.maxHp * 0.02));
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
    set({ hero: { ...hero, beggingUntil: endsAt, beggingReward: goldReward } });
    get().addCombatLog(`Zacząłeś żebrać na ${clampedHours}h. Zarobisz ~${goldReward}🪙.`, 'system');
    get().saveGame();
  },

  collectBegging: () => {
    const { hero } = get();
    if (!hero.beggingUntil || Date.now() < hero.beggingUntil) return;
    const reward = hero.beggingReward ?? 0;
    set({ hero: { ...hero, gold: hero.gold + reward, beggingUntil: null, beggingReward: null } });
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
        });
        get().checkDailyReset();
      }
    } catch {
      // corrupt save
    }
  },
}));

export { scaledQuestDuration };
