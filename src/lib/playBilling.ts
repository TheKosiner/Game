// Google Play Billing for gem packs — used only in the Play Store build.
//
// Flow: buy in Google Play → send the purchase token to the verifyPlayPurchase
// Cloud Function, which confirms it with Google and credits the gems (once per
// token) → only then consume the purchase so the pack can be bought again. A
// purchase interrupted anywhere along the way (app killed, offline) stays
// unconsumed and is picked up by recoverPlayPurchases() on the next launch;
// Google refunds purchases that are never acknowledged within three days.
import { Capacitor } from '@capacitor/core';
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';
import { withServerWrite } from './cloudSync';
import { useGameStore } from '../store/gameStore';

/** The Google Play build (VITE_DISTRIBUTION=play): gems are sold through Play Billing only. */
export const IS_PLAY_BUILD = Capacitor.isNativePlatform() && import.meta.env.VITE_DISTRIBUTION === 'play';

/** Consumable gem packs. Product IDs must match Play Console and functions/src/playBillingLogic.ts. */
export const PLAY_GEM_PACKS = [
  { productId: 'gems_100', gems: 100 },
  { productId: 'gems_550', gems: 550 },
  { productId: 'gems_1200', gems: 1200 },
] as const;

export type PlayPurchaseOutcome =
  | { status: 'credited'; gems: number }
  | { status: 'pending' }
  | { status: 'cancelled' };

interface VerifyResult {
  status: 'credited' | 'already_credited' | 'pending';
  gems: number;
  newGems: number;
}

// Loaded on demand so the web build never ships the native plugin.
const loadPlugin = () => import('@capgo/native-purchases');

/** SHA-256 of the uid, hex — the obfuscated account id that ties a purchase to this account. */
async function accountToken(uid: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(uid));
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function errorCode(e: unknown): string {
  return (e && typeof e === 'object' && 'code' in e ? String((e as { code: unknown }).code) : '') || '';
}

/** Localized prices from Google Play, keyed by product ID (empty if billing is unavailable). */
export async function loadPlayPrices(): Promise<Record<string, string>> {
  const { NativePurchases, PURCHASE_TYPE } = await loadPlugin();
  const { isBillingSupported } = await NativePurchases.isBillingSupported();
  if (!isBillingSupported) return {};
  const { products } = await NativePurchases.getProducts({
    productIdentifiers: PLAY_GEM_PACKS.map(p => p.productId),
    productType: PURCHASE_TYPE.INAPP,
  });
  return Object.fromEntries(products.map(p => [p.identifier, p.priceString]));
}

/**
 * Credit a purchase on the server, then consume it. Client saves are held while
 * the function writes the save, so none can overwrite the new gem balance.
 */
async function verifyAndConsume(productId: string, purchaseToken: string): Promise<VerifyResult> {
  if (!functions) throw new Error('Firebase not configured');
  const verify = httpsCallable<{ productId: string; purchaseToken: string }, VerifyResult>(functions, 'verifyPlayPurchase');
  const result = await withServerWrite(async () => {
    const { data } = await verify({ productId, purchaseToken });
    if (data.status === 'credited') {
      // The server added the gems on top of the balance it had; add the same
      // amount here so unsynced local changes (spending, level-ups) survive too.
      useGameStore.setState(s => ({ hero: { ...s.hero, gems: s.hero.gems + data.gems } }));
      useGameStore.getState().saveGame();
    }
    return data;
  });
  if (result.status !== 'pending') {
    // Safe to consume only now that the gems are on the account.
    const { NativePurchases } = await loadPlugin();
    await NativePurchases.consumePurchase({ purchaseToken }).catch(() => { /* retried by recovery */ });
  }
  return result;
}

/** Buy a gem pack through Google Play. */
export async function buyGemPack(productId: string, uid: string): Promise<PlayPurchaseOutcome> {
  const { NativePurchases, PURCHASE_TYPE } = await loadPlugin();
  let transaction;
  try {
    transaction = await NativePurchases.purchaseProduct({
      productIdentifier: productId,
      productType: PURCHASE_TYPE.INAPP,
      appAccountToken: await accountToken(uid),
      isConsumable: true,
      // Don't let the plugin consume or acknowledge: that happens after the server credits it.
      autoAcknowledgePurchases: false,
    });
  } catch (e) {
    const code = errorCode(e);
    if (code === 'USER_CANCELED') return { status: 'cancelled' };
    if (/pending/i.test(e instanceof Error ? e.message : String(e))) return { status: 'pending' };
    if (code === 'ITEM_ALREADY_OWNED') {
      // An earlier purchase of this pack was never finished — finish it now.
      const recovered = await recoverPlayPurchases(uid);
      if (recovered > 0) return { status: 'credited', gems: recovered };
    }
    throw e;
  }
  if (!transaction.purchaseToken) throw new Error('Google Play returned no purchase token');
  if (transaction.purchaseState === '2') return { status: 'pending' };
  const result = await verifyAndConsume(productId, transaction.purchaseToken);
  return result.status === 'pending'
    ? { status: 'pending' }
    : { status: 'credited', gems: result.gems };
}

/**
 * Finish purchases this account made but that were never consumed — the app was
 * closed mid-purchase, verification failed, or a pending payment has cleared.
 * Returns the number of gems newly credited.
 */
export async function recoverPlayPurchases(uid: string): Promise<number> {
  const { NativePurchases, PURCHASE_TYPE } = await loadPlugin();
  const { purchases } = await NativePurchases.getPurchases({
    productType: PURCHASE_TYPE.INAPP,
    appAccountToken: await accountToken(uid),
  });
  let credited = 0;
  for (const p of purchases) {
    // Billing Library states: 1 = purchased, 2 = pending.
    if (p.purchaseState !== '1' || !p.purchaseToken) continue;
    if (!PLAY_GEM_PACKS.some(pack => pack.productId === p.productIdentifier)) continue;
    try {
      const result = await verifyAndConsume(p.productIdentifier, p.purchaseToken);
      if (result.status === 'credited') credited += result.gems;
    } catch {
      // Left unconsumed — tried again on the next launch.
    }
  }
  return credited;
}
