import { describe, it, expect } from 'vitest';
import {
  PLAY_GEM_PRODUCTS, decidePlayCredit, gemsAfterRevocation, playAccountId, purchaseDocId,
  type PlayProductPurchase,
} from './playBillingLogic';

const UID = 'user-123';
const purchased = (o: Partial<PlayProductPurchase> = {}): PlayProductPurchase => ({
  purchaseState: 0, consumptionState: 0, orderId: 'GPA.1', obfuscatedExternalAccountId: playAccountId(UID), ...o,
});

describe('playAccountId / purchaseDocId', () => {
  it('is a stable 64-char hex hash (the Play obfuscated-id maximum)', () => {
    expect(playAccountId(UID)).toMatch(/^[0-9a-f]{64}$/);
    expect(playAccountId(UID)).toBe(playAccountId(UID));
    expect(playAccountId(UID)).not.toBe(playAccountId('other'));
    expect(purchaseDocId('tok')).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('decidePlayCredit', () => {
  it('credits a fresh purchase with the pack size', () => {
    expect(decidePlayCredit('gems_550', purchased(), UID, null)).toEqual({ action: 'credit', gems: 550 });
  });

  it('multiplies by quantity when multi-quantity purchases are enabled', () => {
    expect(decidePlayCredit('gems_100', purchased({ quantity: 3 }), UID, null)).toEqual({ action: 'credit', gems: 300 });
  });

  it('still credits a purchase that was consumed but never credited', () => {
    expect(decidePlayCredit('gems_100', purchased({ consumptionState: 1 }), UID, null)).toEqual({ action: 'credit', gems: 100 });
  });

  it('is idempotent: a token credited before is not credited again', () => {
    expect(decidePlayCredit('gems_100', purchased(), UID, { uid: UID })).toEqual({ action: 'already_credited' });
  });

  it('refuses a token already credited to another account', () => {
    expect(decidePlayCredit('gems_100', purchased(), UID, { uid: 'someone-else' }))
      .toEqual({ action: 'reject', reason: 'owned_by_other_user' });
  });

  it('refuses a purchase made by a different account', () => {
    expect(decidePlayCredit('gems_100', purchased({ obfuscatedExternalAccountId: playAccountId('thief') }), UID, null))
      .toEqual({ action: 'reject', reason: 'wrong_account' });
    expect(decidePlayCredit('gems_100', purchased({ obfuscatedExternalAccountId: undefined }), UID, null))
      .toEqual({ action: 'reject', reason: 'wrong_account' });
  });

  it('waits on pending purchases and refuses cancelled ones', () => {
    expect(decidePlayCredit('gems_100', purchased({ purchaseState: 2 }), UID, null)).toEqual({ action: 'pending' });
    expect(decidePlayCredit('gems_100', purchased({ purchaseState: 1 }), UID, null)).toEqual({ action: 'reject', reason: 'not_purchased' });
  });

  it('refuses unknown products', () => {
    expect(decidePlayCredit('gems_999999', purchased(), UID, null)).toEqual({ action: 'reject', reason: 'unknown_product' });
  });

  it('knows the three gem packs', () => {
    expect(PLAY_GEM_PRODUCTS).toEqual({ gems_100: 100, gems_550: 550, gems_1200: 1200 });
  });
});

describe('gemsAfterRevocation', () => {
  it('removes the refunded gems, never below zero', () => {
    expect(gemsAfterRevocation(700, 550)).toBe(150);
    expect(gemsAfterRevocation(100, 550)).toBe(0);
  });
});
