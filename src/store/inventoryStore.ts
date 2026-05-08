import { create } from 'zustand';
import type { Item, ItemSlot, Equipment } from '../types';
import { MAX_INVENTORY } from '../utils/constants';

interface InventoryState {
  equipment: Equipment;
  inventory: Item[];
  equipItem: (item: Item) => boolean;
  unequipItem: (slot: ItemSlot) => boolean;
  addItem: (item: Item) => boolean;
  removeItem: (item: Item) => boolean;
  sellItem: (item: Item, goldValue: number) => boolean;
  canAddItem: () => boolean;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  equipment: {},
  inventory: [],

  equipItem: (item: Item) => {
    const { equipment, inventory } = get();
    const oldEquipped = equipment[item.slot];
    const newInventory = [...inventory];

    const idx = newInventory.findIndex(
      i => i === item || (i.id === item.id && i.name === item.name && i.level === item.level)
    );

    if (idx === -1) return false;

    newInventory.splice(idx, 1);
    if (oldEquipped) newInventory.push(oldEquipped);

    set({
      equipment: { ...equipment, [item.slot]: item },
      inventory: newInventory,
    });

    return true;
  },

  unequipItem: (slot: ItemSlot) => {
    const { equipment, inventory } = get();
    const item = equipment[slot];

    if (!item) return false;
    if (inventory.length >= MAX_INVENTORY) return false;

    const newEquipment = { ...equipment };
    delete newEquipment[slot];

    set({
      equipment: newEquipment,
      inventory: [...inventory, item],
    });

    return true;
  },

  addItem: (item: Item) => {
    const { inventory } = get();
    if (inventory.length >= MAX_INVENTORY) return false;

    set({ inventory: [...inventory, item] });
    return true;
  },

  removeItem: (item: Item) => {
    const { inventory } = get();
    const newInventory = [...inventory];
    const idx = newInventory.findIndex(
      i => i === item || (i.id === item.id && i.name === item.name && i.level === item.level)
    );

    if (idx === -1) return false;

    newInventory.splice(idx, 1);
    set({ inventory: newInventory });
    return true;
  },

  sellItem: (item: Item, goldValue: number) => {
    const removed = get().removeItem(item);
    return removed;
  },

  canAddItem: () => {
    return get().inventory.length < MAX_INVENTORY;
  },
}));
