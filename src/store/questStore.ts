import { create } from 'zustand';
import type { Quest, ActiveQuest } from '../types';
import { QUEST_DURATION_SCALE_PER_LEVEL } from '../utils/constants';

interface QuestState {
  activeQuest: ActiveQuest | null;
  startQuest: (quest: Quest, heroLevel: number) => boolean;
  collectQuest: () => { xp: number; gold: number } | null;
  isQuestComplete: () => boolean;
}

function scaledQuestDuration(durationMs: number, level: number): number {
  return Math.floor(durationMs * (1 + (level - 1) * QUEST_DURATION_SCALE_PER_LEVEL));
}

export const useQuestStore = create<QuestState>((set, get) => ({
  activeQuest: null,

  startQuest: (quest: Quest, heroLevel: number) => {
    const { activeQuest } = get();
    if (activeQuest) return false;

    const now = Date.now();
    const duration = scaledQuestDuration(quest.durationMs, heroLevel);

    set({
      activeQuest: {
        quest,
        startedAt: now,
        endsAt: now + duration,
      },
    });

    return true;
  },

  collectQuest: () => {
    const { activeQuest } = get();
    if (!activeQuest) return null;
    if (Date.now() < activeQuest.endsAt) return null;

    const rewards = {
      xp: activeQuest.quest.xpReward,
      gold: activeQuest.quest.goldReward,
    };

    set({ activeQuest: null });
    return rewards;
  },

  isQuestComplete: () => {
    const { activeQuest } = get();
    if (!activeQuest) return false;
    return Date.now() >= activeQuest.endsAt;
  },
}));

export { scaledQuestDuration };
