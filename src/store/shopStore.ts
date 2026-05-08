import { create } from 'zustand';
import { SHOP_REFRESH_COOLDOWN_MS } from '../utils/constants';

interface ShopState {
  shopSeed: number;
  lastShopRefresh: number;
  shopPurchased: number[];

  refreshShop: () => boolean;
  canRefresh: () => boolean;
  purchaseItem: (slotIndex: number) => void;
  isPurchased: (slotIndex: number) => boolean;
}

export const useShopStore = create<ShopState>((set, get) => ({
  shopSeed: Date.now(),
  lastShopRefresh: 0,
  shopPurchased: [],

  refreshShop: () => {
    const { lastShopRefresh } = get();
    if (Date.now() - lastShopRefresh < SHOP_REFRESH_COOLDOWN_MS) {
      return false;
    }

    set({
      shopSeed: Date.now(),
      lastShopRefresh: Date.now(),
      shopPurchased: [],
    });

    return true;
  },

  canRefresh: () => {
    const { lastShopRefresh } = get();
    return Date.now() - lastShopRefresh >= SHOP_REFRESH_COOLDOWN_MS;
  },

  purchaseItem: (slotIndex: number) => {
    set(state => ({
      shopPurchased: [...state.shopPurchased, slotIndex],
    }));
  },

  isPurchased: (slotIndex: number) => {
    return get().shopPurchased.includes(slotIndex);
  },
}));
