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

interface BeggingCollectResult {
  valid: boolean;
  goldReward: number;
}

export async function claimDailyRewardServer(): Promise<DailyRewardResult> {
  if (!functions) throw new Error('Firebase functions not configured');
  const fn = httpsCallable<Record<string, never>, DailyRewardResult>(functions, 'claimDailyReward');
  const result = await fn({});
  return result.data;
}

export async function collectBeggingServer(): Promise<BeggingCollectResult> {
  if (!functions) throw new Error('Firebase not configured');
  const fn = httpsCallable<Record<string, never>, BeggingCollectResult>(functions, 'collectBeggingServer');
  const result = await fn({});
  return result.data;
}

export async function collectQuestServer(): Promise<QuestCollectResult> {
  if (!functions) throw new Error('Firebase not configured');
  const fn = httpsCallable<Record<string, never>, QuestCollectResult>(functions, 'collectQuestServer');
  const result = await fn({});
  return result.data;
}

export async function resetAllDailyLimits(): Promise<{ ok: boolean; resetCount: number }> {
  if (!functions) throw new Error('Firebase not configured');
  const fn = httpsCallable<Record<string, never>, { ok: boolean; resetCount: number }>(functions, 'resetAllDailyLimits');
  const result = await fn({});
  return result.data;
}

export async function sendVerificationEmailServer(lang: string): Promise<{ ok: boolean }> {
  if (!functions) throw new Error('Firebase not configured');
  const fn = httpsCallable<{ lang: string }, { ok: boolean }>(functions, 'sendVerificationEmail');
  const result = await fn({ lang });
  return result.data;
}
