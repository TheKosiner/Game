// Pure logic for Google Play in-app purchases (gem packs).
// No Firebase imports — unit-tested in playBillingLogic.test.ts.
import { createHash } from 'crypto';

export const PLAY_PACKAGE_NAME = 'com.glitchsoul.game';

/**
 * Consumable gem packs. The keys are the product IDs created in Play Console
 * (Monetize → Products → In-app products) and must match src/lib/playBilling.ts.
 */
export const PLAY_GEM_PRODUCTS: Readonly<Record<string, number>> = {
  gems_100: 100,
  gems_550: 550,
  gems_1200: 1200,
};

const sha256Hex = (s: string) => createHash('sha256').update(s).digest('hex');

/**
 * The obfuscated account id the client attaches to every purchase: the SHA-256
 * of the Firebase uid (64 hex chars, the Play maximum). It ties a purchase to the
 * account that made it, so nobody else can redeem its token.
 */
export function playAccountId(uid: string): string {
  return sha256Hex(uid);
}

/** Firestore document id for a purchase token (tokens are long and not id-safe). */
export function purchaseDocId(purchaseToken: string): string {
  return sha256Hex(purchaseToken);
}

/** The fields of the Android Publisher API `ProductPurchase` resource we rely on. */
export interface PlayProductPurchase {
  /** 0 purchased, 1 canceled, 2 pending. */
  purchaseState?: number;
  /** 0 not yet consumed, 1 consumed. */
  consumptionState?: number;
  orderId?: string;
  purchaseTimeMillis?: string;
  obfuscatedExternalAccountId?: string;
  /** 0 test (license tester), 1 promo code, 2 rewarded; absent for a real purchase. */
  purchaseType?: number;
  quantity?: number;
}

export type PlayCreditDecision =
  | { action: 'credit'; gems: number }
  | { action: 'already_credited' }
  | { action: 'pending' }
  | { action: 'reject'; reason: 'unknown_product' | 'not_purchased' | 'wrong_account' | 'owned_by_other_user' };

/**
 * What to do with a purchase the client reports, given what Google Play says
 * about it and whether we already credited it (`existing`).
 *
 * A consumed purchase is still credited if we never did: the player paid, and
 * Google won't refund a consumed purchase.
 */
export function decidePlayCredit(
  productId: string,
  purchase: PlayProductPurchase,
  uid: string,
  existing: { uid: string } | null,
): PlayCreditDecision {
  const gemsPerUnit = PLAY_GEM_PRODUCTS[productId];
  if (!gemsPerUnit) return { action: 'reject', reason: 'unknown_product' };
  if (existing) {
    return existing.uid === uid ? { action: 'already_credited' } : { action: 'reject', reason: 'owned_by_other_user' };
  }
  if (purchase.purchaseState === 2) return { action: 'pending' };
  if (purchase.purchaseState !== 0) return { action: 'reject', reason: 'not_purchased' };
  if (purchase.obfuscatedExternalAccountId !== playAccountId(uid)) return { action: 'reject', reason: 'wrong_account' };
  const quantity = Math.max(1, Math.floor(purchase.quantity ?? 1));
  return { action: 'credit', gems: gemsPerUnit * quantity };
}

/**
 * Gem balance after a refunded/charged-back purchase is revoked. Gems already
 * spent can't be clawed back below zero.
 */
export function gemsAfterRevocation(currentGems: number, purchasedGems: number): number {
  return Math.max(0, (currentGems || 0) - Math.max(0, purchasedGems || 0));
}
