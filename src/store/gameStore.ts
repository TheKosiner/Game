import { create } from 'zustand';
import type { GameState, Hero, HeroClass, ItemSlot, Quest, Dungeon, Stats, CombatLog } from '../types';
import { getEnemyById, scaleEnemy } from '../data/enemies';
import { getItemById } from '../data/items';
import { heroAttackEnemy, enemyAttackHero, getHeroMaxHp, calcXpToNext } from '../utils/combat';

const SAVE_KEY = 'realm_of_valor_save';
const MAX_INVENTORY = 20;
const MAX_LOG = 50;

function createHero(name: string, heroClass: HeroClass): Hero {
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
    stats,
    equipment: {},
    inventory: [],
    gold: 100,
    gems: 0,
    attributePoints: 0,
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

  initHero: (name, heroClass) => {
    const hero = createHero(name, heroClass);
    set({ hero, activeQuest: null, currentDungeon: null, currentFloor: 1, currentEnemy: null, combatLog: [], inCombat: false });
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

  equipItem: (item) => {
    const { hero } = get();
    const oldEquipped = hero.equipment[item.slot];
    const newInventory = hero.inventory.filter(i => i.id !== item.id);
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

  sellItem: (itemId) => {
    const { hero } = get();
    const item = hero.inventory.find(i => i.id === itemId);
    if (!item) return;
    set({ hero: { ...hero, gold: hero.gold + item.goldValue, inventory: hero.inventory.filter(i => i.id !== itemId) } });
  },

  buyItem: (item, price) => {
    const { hero } = get();
    if (hero.gold < price) return false;
    if (hero.inventory.length >= MAX_INVENTORY) return false;
    set({ hero: { ...hero, gold: hero.gold - price, inventory: [...hero.inventory, item] } });
    return true;
  },

  enterDungeon: (dungeon: Dungeon) => {
    const { hero } = get();
    if (hero.level < dungeon.minLevel) return;
    const enemyId = dungeon.enemies[Math.floor(Math.random() * dungeon.enemies.length)];
    const baseEnemy = getEnemyById(enemyId);
    if (!baseEnemy) return;
    const enemy = scaleEnemy(baseEnemy, 1);
    set({ currentDungeon: dungeon, currentFloor: 1, currentEnemy: { ...enemy }, inCombat: true, combatLog: [] });
    get().addCombatLog(`Wchodzisz do "${dungeon.name}" — Piętro 1`, 'system');
    get().addCombatLog(`Napotykasz: ${enemy.emoji} ${enemy.name} (Poz. ${enemy.level})`, 'system');
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

      // Loot drop
      if (Math.random() < 0.3 && currentEnemy.lootTable.length > 0) {
        const lootId = currentEnemy.lootTable[Math.floor(Math.random() * currentEnemy.lootTable.length)];
        const lootItem = getItemById(lootId);
        if (lootItem && get().hero.inventory.length < MAX_INVENTORY) {
          const storeHero = get().hero;
          set({ hero: { ...storeHero, inventory: [...storeHero.inventory, lootItem] } });
          get().addCombatLog(`Zdobywasz: ${lootItem.emoji} ${lootItem.name}!`, 'loot');
        }
      }

      // Next floor or new enemy
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
        get().addCombatLog('Zostałeś pokonany! Wychodzisz z lochu...', 'system');
        const updatedHero = get().hero;
        const maxHp = updatedHero.maxHp;
        set({
          hero: { ...updatedHero, hp: Math.floor(maxHp * 0.3) },
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
    const now = Date.now();
    set({ activeQuest: { quest, startedAt: now, endsAt: now + quest.durationMs } });
    get().saveGame();
  },

  collectQuest: () => {
    const { activeQuest } = get();
    if (!activeQuest) return;
    if (Date.now() < activeQuest.endsAt) return;
    get().addXp(activeQuest.quest.xpReward);
    get().addGold(activeQuest.quest.goldReward);
    set({ activeQuest: null });
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
    // Shop items are generated on-the-fly based on hero level in the component
  },

  saveGame: () => {
    const state = get();
    const save = {
      hero: state.hero,
      activeQuest: state.activeQuest,
      lastSaved: Date.now(),
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
        set({
          hero: save.hero,
          activeQuest: save.activeQuest ?? null,
          lastSaved: save.lastSaved ?? Date.now(),
        });
      }
    } catch {
      // corrupt save
    }
  },
}));
