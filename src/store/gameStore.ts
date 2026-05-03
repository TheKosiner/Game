import { create } from 'zustand';
import type { GameState, Hero, HeroClass, ItemSlot, Quest, Dungeon, Stats, CombatLog, Item } from '../types';
import { getEnemyById, scaleEnemy } from '../data/enemies';
import { getItemById } from '../data/items';
import { heroAttackEnemy, enemyAttackHero, getHeroMaxHp, calcXpToNext } from '../utils/combat';

const SAVE_KEY = 'realm_of_valor_save';
const MAX_INVENTORY = 20;
const MAX_LOG = 50;
export const MAX_DAILY_DUNGEONS = 10;
export const MAX_DAILY_QUESTS = 10;
const REST_DURATION_MS = 5 * 60 * 1000;
const REST_HP_RESTORE = 0.5;
export const SHOP_REFRESH_COOLDOWN = 60 * 60 * 1000;

function isSameDay(ts: number): boolean {
  const a = new Date(ts);
  const b = new Date();
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function scaledQuestDuration(durationMs: number, level: number): number {
  return Math.floor(durationMs * (1 + (level - 1) * 0.05));
}

function createHero(name: string, heroClass: HeroClass, skinTone = 1, hairColor = 2): Hero {
  const baseStats: Record<HeroClass, Stats> = {
    warrior: { strength: 8, agility: 4, intelligence: 2, constitution: 6 },
    mage: { strength: 2, agility: 4, intelligence: 10, constitution: 4 },
    rogue: { strength: 5, agility: 9, intelligence: 3, constitution: 3 },
  };
  const stats = baseStats[heroClass];
  const maxHp = getHeroMaxHp(stats, 1);
  return {
    name,
    class: heroClass,
    level: 1,
    xp: 0,
    xpToNext: calcXpToNext(1),
    hp: maxHp,
    maxHp,
    restingUntil: null,
    voluntaryRestUntil: null,
    voluntaryRestHp: null,
    dungeonRunsToday: 0,
    questsCompletedToday: 0,
    lastDailyReset: Date.now(),
    stats,
    equipment: {},
    inventory: [],
    gold: 100,
    gems: 0,
    attributePoints: 0,
    skinTone,
    hairColor,
  };
}

export const useGameStore = create<GameState>((set, get) => ({
  hero: createHero('Hero', 'warrior'),
  activeQuest: null,
  currentDungeon: null,
  currentFloor: 1,
  currentEnemy: null,
  combatLog: [],
  inCombat: false,
  lastSaved: Date.now(),
  shopSeed: Date.now(),
  lastShopRefresh: 0,
  shopPurchased: [],

  initHero: (name, heroClass, skinTone = 1, hairColor = 2) => {
    const hero = createHero(name, heroClass, skinTone, hairColor);
    set({ hero, activeQuest: null, currentDungeon: null, currentFloor: 1, currentEnemy: null, combatLog: [], inCombat: false, shopSeed: Date.now(), lastShopRefresh: 0, shopPurchased: [] });
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
      attributePoints++;
      leveled = true;
    }
    const newMaxHp = getHeroMaxHp(stats, level);
    const hpGain = leveled ? newMaxHp - maxHp : 0;
    set({ hero: { ...hero, xp, xpToNext, level, maxHp: newMaxHp, hp: Math.min(hp + hpGain, newMaxHp), attributePoints } });
    if (leveled) get().addCombatLog(`Awansowałeś na poziom ${level}!`, 'system');
  },

  addGold: (amount) => {
    const { hero } = get();
    set({ hero: { ...hero, gold: hero.gold + amount } });
  },

  equipItem: (item: Item) => {
    const { hero } = get();
    const oldEquipped = hero.equipment[item.slot];
    const newInventory = [...hero.inventory];
    const idx = newInventory.findIndex(i => i === item || (i.id === item.id && i.name === item.name && i.level === item.level));
    if (idx !== -1) newInventory.splice(idx, 1);
    if (oldEquipped) newInventory.push(oldEquipped);
    set({ hero: { ...hero, equipment: { ...hero.equipment, [item.slot]: item }, inventory: newInventory } });
  },

  unequipItem: (slot: ItemSlot) => {
    const { hero } = get();
    const item = hero.equipment[slot];
    if (!item) return;
    if (hero.inventory.length >= MAX_INVENTORY) return;
    const newEquipment = { ...hero.equipment };
    delete newEquipment[slot];
    set({ hero: { ...hero, equipment: newEquipment, inventory: [...hero.inventory, item] } });
  },

  sellItem: (item: Item) => {
    const { hero } = get();
    const newInventory = [...hero.inventory];
    const idx = newInventory.findIndex(i => i === item || (i.id === item.id && i.name === item.name && i.level === item.level));
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
      const { damage: enemyDmg } = enemyAttackHero(currentEnemy, hero);
      const newHeroHp = Math.max(0, hero.hp - enemyDmg);
      get().addCombatLog(`${currentEnemy.emoji} ${currentEnemy.name} zadaje ci ${enemyDmg} obrażeń`, 'enemy');

      if (newHeroHp <= 0) {
        get().addCombatLog('Zostałeś pokonany! Skorzystaj z odpoczynku by odzyskać HP.', 'system');
        const updatedHero = get().hero;
        set({
          hero: { ...updatedHero, hp: 1 },
          currentDungeon: null,
          currentEnemy: null,
          inCombat: false,
        });
      } else {
        set({ hero: { ...hero, hp: newHeroHp }, currentEnemy: { ...currentEnemy, hp: newEnemyHp } });
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
    if (hero.attributePoints <= 0) return;
    const newStats = { ...hero.stats, [attr]: hero.stats[attr] + 1 };
    const newMaxHp = getHeroMaxHp(newStats, hero.level);
    set({ hero: { ...hero, stats: newStats, maxHp: newMaxHp, attributePoints: hero.attributePoints - 1 } });
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

  restHero: (minutes: number) => {
    const { hero, inCombat } = get();
    if (inCombat) return;
    if (hero.voluntaryRestUntil !== null && Date.now() < hero.voluntaryRestUntil) return;
    if (hero.hp >= hero.maxHp) return;
    const hp = Math.min(minutes, hero.maxHp - hero.hp);
    if (hp <= 0) return;
    const endsAt = Date.now() + minutes * 60 * 1000;
    set({ hero: { ...hero, voluntaryRestUntil: endsAt, voluntaryRestHp: hp } });
    get().addCombatLog(`Odpoczywasz ${minutes} min... Odzyskasz ${hp} HP.`, 'system');
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
      set({ hero: { ...updated, hp: updated.hp + healAmount, voluntaryRestUntil: null, voluntaryRestHp: null } });
      if (healAmount > 0) get().addCombatLog(`Odpocząłeś! +${healAmount} HP.`, 'system');
    }
  },

  saveGame: () => {
    const state = get();
    const save = {
      hero: state.hero,
      activeQuest: state.activeQuest,
      lastSaved: Date.now(),
      shopSeed: state.shopSeed,
      lastShopRefresh: state.lastShopRefresh,
      shopPurchased: state.shopPurchased,
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
        const isLegacySave = save.hero.dungeonRunsToday === undefined;
        const loadedHero: Hero = {
          ...save.hero,
          restingUntil: isLegacySave ? null : (save.hero.restingUntil ?? null),
          voluntaryRestUntil: save.hero.voluntaryRestUntil ?? null,
          voluntaryRestHp: save.hero.voluntaryRestHp ?? null,
          dungeonRunsToday: save.hero.dungeonRunsToday ?? 0,
          questsCompletedToday: save.hero.questsCompletedToday ?? 0,
          lastDailyReset: save.hero.lastDailyReset ?? Date.now(),
          skinTone: save.hero.skinTone ?? 1,
          hairColor: save.hero.hairColor ?? 2,
        };
        if (isLegacySave) loadedHero.hp = loadedHero.maxHp;
        set({
          hero: loadedHero,
          activeQuest: save.activeQuest ?? null,
          lastSaved: save.lastSaved ?? Date.now(),
          shopSeed: save.shopSeed ?? Date.now(),
          lastShopRefresh: save.lastShopRefresh ?? 0,
          shopPurchased: save.shopPurchased ?? [],
        });
        get().checkDailyReset();
      }
    } catch {
      // corrupt save
    }
  },
}));

export { scaledQuestDuration };
