import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGameStore } from '../store/gameStore';
import { makeHero } from '../tests/fixtures';

// ── Mocks: the native plugin and the verifyPlayPurchase callable ─────────────
const calls: string[] = [];
const plugin = {
  isBillingSupported: vi.fn(async () => ({ isBillingSupported: true })),
  getProducts: vi.fn(async () => ({ products: [{ identifier: 'gems_100', priceString: '4,99 zł' }] })),
  purchaseProduct: vi.fn(),
  consumePurchase: vi.fn(async ({ purchaseToken }: { purchaseToken: string }) => { calls.push(`consume:${purchaseToken}`); }),
  getPurchases: vi.fn(),
};
vi.mock('@capgo/native-purchases', () => ({ NativePurchases: plugin, PURCHASE_TYPE: { INAPP: 'inapp', SUBS: 'subs' } }));

const verify = vi.fn();
vi.mock('firebase/functions', () => ({ httpsCallable: () => verify }));
vi.mock('./firebase', () => ({ functions: {}, db: null, auth: null, isFirebaseConfigured: false }));

const { buyGemPack, recoverPlayPurchases, loadPlayPrices } = await import('./playBilling');

beforeEach(() => {
  calls.length = 0;
  vi.clearAllMocks();
  useGameStore.setState({ hero: makeHero({ gems: 10 }), heroReady: true });
  verify.mockImplementation(async ({ purchaseToken }: { purchaseToken: string }) => {
    calls.push(`verify:${purchaseToken}`);
    return { data: { status: 'credited', gems: 100, newGems: 110 } };
  });
});

describe('buyGemPack', () => {
  it('ties the purchase to the account and leaves consuming to us', async () => {
    plugin.purchaseProduct.mockResolvedValue({ purchaseToken: 'tok-1', purchaseState: '1', productIdentifier: 'gems_100' });
    await buyGemPack('gems_100', 'uid-1');
    const opts = plugin.purchaseProduct.mock.calls[0][0];
    expect(opts.appAccountToken).toMatch(/^[0-9a-f]{64}$/);
    expect(opts.isConsumable).toBe(true);
    expect(opts.autoAcknowledgePurchases).toBe(false);
  });

  it('credits on the server first, then consumes, and adds the gems locally', async () => {
    plugin.purchaseProduct.mockResolvedValue({ purchaseToken: 'tok-1', purchaseState: '1', productIdentifier: 'gems_100' });
    const outcome = await buyGemPack('gems_100', 'uid-1');
    expect(outcome).toEqual({ status: 'credited', gems: 100 });
    expect(calls).toEqual(['verify:tok-1', 'consume:tok-1']);
    expect(useGameStore.getState().hero.gems).toBe(110);
  });

  it('does not consume when the server could not verify (recovered later)', async () => {
    plugin.purchaseProduct.mockResolvedValue({ purchaseToken: 'tok-2', purchaseState: '1', productIdentifier: 'gems_100' });
    verify.mockRejectedValueOnce(new Error('unavailable'));
    await expect(buyGemPack('gems_100', 'uid-1')).rejects.toThrow();
    expect(plugin.consumePurchase).not.toHaveBeenCalled();
    expect(useGameStore.getState().hero.gems).toBe(10);
  });

  it('treats a cancelled purchase as no-op', async () => {
    plugin.purchaseProduct.mockRejectedValue(Object.assign(new Error('Purchase is not purchased'), { code: 'USER_CANCELED' }));
    expect(await buyGemPack('gems_100', 'uid-1')).toEqual({ status: 'cancelled' });
    expect(verify).not.toHaveBeenCalled();
  });

  it('reports a pending payment without crediting or consuming', async () => {
    plugin.purchaseProduct.mockRejectedValue(new Error('Purchase is pending'));
    expect(await buyGemPack('gems_100', 'uid-1')).toEqual({ status: 'pending' });
    expect(verify).not.toHaveBeenCalled();
    expect(plugin.consumePurchase).not.toHaveBeenCalled();
  });

  it('finishes an earlier unfinished purchase when Play says the pack is already owned', async () => {
    plugin.purchaseProduct.mockRejectedValue(Object.assign(new Error('owned'), { code: 'ITEM_ALREADY_OWNED' }));
    plugin.getPurchases.mockResolvedValue({ purchases: [{ purchaseToken: 'old', purchaseState: '1', productIdentifier: 'gems_100' }] });
    expect(await buyGemPack('gems_100', 'uid-1')).toEqual({ status: 'credited', gems: 100 });
    expect(calls).toEqual(['verify:old', 'consume:old']);
  });
});

describe('recoverPlayPurchases', () => {
  it('finishes only completed purchases of known gem packs', async () => {
    plugin.getPurchases.mockResolvedValue({
      purchases: [
        { purchaseToken: 'a', purchaseState: '1', productIdentifier: 'gems_100' },
        { purchaseToken: 'b', purchaseState: '2', productIdentifier: 'gems_100' },   // still pending
        { purchaseToken: 'c', purchaseState: '1', productIdentifier: 'something_else' },
      ],
    });
    expect(await recoverPlayPurchases('uid-1')).toBe(100);
    expect(calls).toEqual(['verify:a', 'consume:a']);
  });

  it('consumes an already-credited purchase without adding gems again', async () => {
    plugin.getPurchases.mockResolvedValue({ purchases: [{ purchaseToken: 'a', purchaseState: '1', productIdentifier: 'gems_100' }] });
    verify.mockResolvedValueOnce({ data: { status: 'already_credited', gems: 0, newGems: 110 } });
    expect(await recoverPlayPurchases('uid-1')).toBe(0);
    expect(plugin.consumePurchase).toHaveBeenCalledWith({ purchaseToken: 'a' });
    expect(useGameStore.getState().hero.gems).toBe(10);
  });
});

describe('loadPlayPrices', () => {
  it('returns Play’s localized prices by product id', async () => {
    expect(await loadPlayPrices()).toEqual({ gems_100: '4,99 zł' });
  });
});
