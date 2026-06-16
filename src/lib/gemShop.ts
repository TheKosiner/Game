import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

export async function startGemCheckout(packageId: string): Promise<void> {
  if (!functions) throw new Error('Firebase not configured');
  const fn = httpsCallable<{ packageId: string; originUrl: string }, { url: string | null }>(
    functions,
    'createCheckoutSession',
  );
  const result = await fn({ packageId, originUrl: window.location.href.split('?')[0] });
  if (result.data.url) window.location.href = result.data.url;
}

export interface GemClaimResult {
  /** Gems newly claimed in this call (for the log message). */
  gems: number;
  /** Authoritative gem balance after the server credited the purchase. */
  newGems: number;
}

export async function claimGemCredits(): Promise<GemClaimResult> {
  if (!functions) return { gems: 0, newGems: 0 };
  const fn = httpsCallable<Record<string, never>, { gems: number; newGems: number }>(functions, 'claimGemCredits');
  const result = await fn({});
  return { gems: result.data.gems ?? 0, newGems: result.data.newGems ?? 0 };
}
