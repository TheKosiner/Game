import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

interface DailyRewardResult {
  claimed: boolean;
  gemsAdded?: number;
  gems?: number;
  lastDailyReset?: number;
}

interface QuestCollectResult {
  valid: boolean;
  xpReward: number;
  goldReward: number;
}

export async function claimDailyRewardServer(): Promise<DailyRewardResult> {
  if (!functions) return { claimed: false };
  const fn = httpsCallable<Record<string, never>, DailyRewardResult>(functions, 'claimDailyReward');
  const result = await fn({});
  return result.data;
}

export async function collectQuestServer(): Promise<QuestCollectResult> {
  if (!functions) throw new Error('Firebase not configured');
  const fn = httpsCallable<Record<string, never>, QuestCollectResult>(functions, 'collectQuestServer');
  const result = await fn({});
  return result.data;
}
