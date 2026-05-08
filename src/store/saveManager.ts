import { SAVE_KEY } from '../utils/constants';
import { useHeroStore } from './heroStore';
import { useInventoryStore } from './inventoryStore';
import { useQuestStore } from './questStore';
import { useShopStore } from './shopStore';
import { usePvpStore } from './pvpStore';
import { useCombatStore } from './combatStore';

interface SaveData {
  hero: any;
  equipment: any;
  inventory: any;
  activeQuest: any;
  shopSeed: number;
  lastShopRefresh: number;
  shopPurchased: number[];
  lastPvpFight: number;
  pvpWins: number;
  pvpLosses: number;
  pvpLog: any[];
  lastSaved: number;
}

let saveTimeout: NodeJS.Timeout | null = null;
let isSaving = false;

export function saveGame(): void {
  if (isSaving) return;

  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(() => {
    isSaving = true;
    try {
      const save: SaveData = {
        hero: useHeroStore.getState().hero,
        equipment: useInventoryStore.getState().equipment,
        inventory: useInventoryStore.getState().inventory,
        activeQuest: useQuestStore.getState().activeQuest,
        shopSeed: useShopStore.getState().shopSeed,
        lastShopRefresh: useShopStore.getState().lastShopRefresh,
        shopPurchased: useShopStore.getState().shopPurchased,
        lastPvpFight: usePvpStore.getState().lastPvpFight,
        pvpWins: usePvpStore.getState().pvpWins,
        pvpLosses: usePvpStore.getState().pvpLosses,
        pvpLog: usePvpStore.getState().pvpLog,
        lastSaved: Date.now(),
      };

      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch (error) {
      console.error('Failed to save game:', error);
    } finally {
      isSaving = false;
    }
  }, 100);
}

export function loadGame(): boolean {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;

    const save: SaveData = JSON.parse(raw);

    if (save.hero) {
      const hero = {
        ...save.hero,
        restingUntil: save.hero.restingUntil ?? null,
        voluntaryRestUntil: save.hero.voluntaryRestUntil ?? null,
        voluntaryRestHpGain: save.hero.voluntaryRestHpGain ?? undefined,
        dungeonRunsToday: save.hero.dungeonRunsToday ?? 0,
        questsCompletedToday: save.hero.questsCompletedToday ?? 0,
        lastDailyReset: save.hero.lastDailyReset ?? Date.now(),
        skinTone: save.hero.skinTone ?? 1,
        hairColor: save.hero.hairColor ?? 2,
      };

      useHeroStore.setState({ hero });
    }

    if (save.equipment || save.inventory) {
      useInventoryStore.setState({
        equipment: save.equipment ?? {},
        inventory: save.inventory ?? [],
      });
    }

    if (save.activeQuest !== undefined) {
      useQuestStore.setState({ activeQuest: save.activeQuest });
    }

    if (save.shopSeed !== undefined) {
      useShopStore.setState({
        shopSeed: save.shopSeed,
        lastShopRefresh: save.lastShopRefresh ?? 0,
        shopPurchased: save.shopPurchased ?? [],
      });
    }

    if (save.lastPvpFight !== undefined) {
      usePvpStore.setState({
        lastPvpFight: save.lastPvpFight ?? 0,
        pvpWins: save.pvpWins ?? 0,
        pvpLosses: save.pvpLosses ?? 0,
        pvpLog: save.pvpLog ?? [],
      });
    }

    useHeroStore.getState().checkDailyReset();
    return true;
  } catch (error) {
    console.error('Failed to load game:', error);
    return false;
  }
}

export function deleteSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (error) {
    console.error('Failed to delete save:', error);
  }
}
