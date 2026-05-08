import { create } from 'zustand';
import type { Dungeon, Enemy, CombatLog } from '../types';
import { getEnemyById, scaleEnemy } from '../data/enemies';
import { getItemById } from '../data/items';
import { heroAttackEnemy, enemyAttackHero } from '../utils/combat';
import { MAX_COMBAT_LOG, LOOT_DROP_CHANCE } from '../utils/constants';

interface CombatState {
  currentDungeon: Dungeon | null;
  currentFloor: number;
  currentEnemy: Enemy | null;
  combatLog: CombatLog[];
  inCombat: boolean;

  enterDungeon: (dungeon: Dungeon) => void;
  exitDungeon: () => void;
  attackEnemy: (heroStats: { attack: number; defense: number; hp: number; agility?: number; equipment?: any }) => {
    heroHp: number;
    enemyDefeated: boolean;
    heroDied: boolean;
    rewards?: { xp: number; gold: number; loot?: any };
    nextFloor?: number;
    dungeonComplete?: boolean;
  } | null;
  addCombatLog: (message: string, type: CombatLog['type']) => void;
  clearCombatLog: () => void;
}

export const useCombatStore = create<CombatState>((set, get) => ({
  currentDungeon: null,
  currentFloor: 1,
  currentEnemy: null,
  combatLog: [],
  inCombat: false,

  enterDungeon: (dungeon: Dungeon) => {
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
    });

    get().addCombatLog(`Wchodzisz do "${dungeon.name}" — Piętro 1`, 'system');
    get().addCombatLog(`Napotykasz: ${enemy.emoji} ${enemy.name} (Poz. ${enemy.level})`, 'system');
  },

  exitDungeon: () => {
    set({
      currentDungeon: null,
      currentFloor: 1,
      currentEnemy: null,
      inCombat: false,
    });
    get().addCombatLog('Opuszczasz loch.', 'system');
  },

  attackEnemy: (heroStats) => {
    const { currentEnemy, currentDungeon, currentFloor } = get();
    if (!currentEnemy || !currentDungeon) return null;

    // Create a minimal hero object with equipment stats applied
    const mockHero = {
      stats: { agility: heroStats.agility ?? 5 },
      equipment: heroStats.equipment ?? {},
    } as any;

    const { damage: heroDmg, isCrit } = heroAttackEnemy(
      mockHero,
      currentEnemy,
      heroStats.attack
    );

    const newEnemyHp = Math.max(0, currentEnemy.hp - heroDmg);
    const critText = isCrit ? ' (KRYTYCZNY!)' : '';
    get().addCombatLog(
      `Zadajesz ${heroDmg} obrażeń${critText} ${currentEnemy.emoji} ${currentEnemy.name}`,
      'hero'
    );

    if (newEnemyHp <= 0) {
      get().addCombatLog(`Pokonałeś ${currentEnemy.emoji} ${currentEnemy.name}!`, 'system');

      const rewards = {
        xp: currentEnemy.xpReward,
        gold: currentEnemy.goldReward,
        loot: undefined as any,
      };

      if (Math.random() < LOOT_DROP_CHANCE && currentEnemy.lootTable.length > 0) {
        const lootId = currentEnemy.lootTable[Math.floor(Math.random() * currentEnemy.lootTable.length)];
        const lootItem = getItemById(lootId);
        if (lootItem) {
          rewards.loot = lootItem;
          get().addCombatLog(`Zdobywasz: ${lootItem.emoji} ${lootItem.name}!`, 'loot');
        }
      }

      const nextFloor = currentFloor + 1;
      if (nextFloor > currentDungeon.floors) {
        get().addCombatLog(`Ukończyłeś loch "${currentDungeon.name}"! Brawo!`, 'system');
        set({ currentEnemy: null, currentFloor: nextFloor, inCombat: false });
        return {
          heroHp: heroStats.hp,
          enemyDefeated: true,
          heroDied: false,
          rewards,
          dungeonComplete: true,
        };
      } else {
        const enemyId = currentDungeon.enemies[Math.floor(Math.random() * currentDungeon.enemies.length)];
        const baseEnemy = getEnemyById(enemyId);
        if (baseEnemy) {
          const nextEnemy = scaleEnemy(baseEnemy, nextFloor);
          set({ currentEnemy: { ...nextEnemy }, currentFloor: nextFloor, inCombat: true });
          get().addCombatLog(`Piętro ${nextFloor}: ${nextEnemy.emoji} ${nextEnemy.name} atakuje!`, 'system');
        }
        return {
          heroHp: heroStats.hp,
          enemyDefeated: true,
          heroDied: false,
          rewards,
          nextFloor,
        };
      }
    } else {
      const mockHero = {
        stats: {},
        equipment: heroStats.equipment ?? {},
      } as any;
      const { damage: enemyDmg } = enemyAttackHero(currentEnemy, mockHero, heroStats.defense);
      const newHeroHp = Math.max(0, heroStats.hp - enemyDmg);
      get().addCombatLog(`${currentEnemy.emoji} ${currentEnemy.name} zadaje ci ${enemyDmg} obrażeń`, 'enemy');

      if (newHeroHp <= 0) {
        get().addCombatLog('Zostałeś pokonany! Użyj odpoczynku aby odzyskać HP.', 'system');
        set({
          currentDungeon: null,
          currentEnemy: null,
          inCombat: false,
        });
        return {
          heroHp: 1,
          enemyDefeated: false,
          heroDied: true,
        };
      } else {
        set({ currentEnemy: { ...currentEnemy, hp: newEnemyHp } });
        return {
          heroHp: newHeroHp,
          enemyDefeated: false,
          heroDied: false,
        };
      }
    }
  },

  addCombatLog: (message: string, type: CombatLog['type']) => {
    set(state => ({
      combatLog: [
        { message, type, timestamp: Date.now() },
        ...state.combatLog,
      ].slice(0, MAX_COMBAT_LOG),
    }));
  },

  clearCombatLog: () => {
    set({ combatLog: [] });
  },
}));
