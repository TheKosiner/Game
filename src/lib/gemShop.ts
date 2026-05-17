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

export async function claimGemCredits(): Promise<number> {
  if (!functions) return 0;
  const fn = httpsCallable<Record<string, never>, { gems: number }>(functions, 'claimGemCredits');
  const result = await fn({});
  return result.data.gems ?? 0;
}
