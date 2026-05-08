import { describe, it, expect, beforeEach } from 'vitest';
import { useInventoryStore } from '../store/inventoryStore';
import type { Item } from '../types';

describe('InventoryStore', () => {
  const mockItem: Item = {
    id: 'sword1',
    name: 'Iron Sword',
    slot: 'weapon',
    rarity: 'common',
    stats: { strength: 5 },
    attackBonus: 10,
    level: 1,
    goldValue: 50,
    emoji: '⚔️',
  };

  beforeEach(() => {
    useInventoryStore.setState({
      equipment: {},
      inventory: [],
    });
  });

  describe('addItem', () => {
    it('should add item to inventory', () => {
      const { addItem } = useInventoryStore.getState();

      const success = addItem(mockItem);

      expect(success).toBe(true);
      const { inventory } = useInventoryStore.getState();
      expect(inventory).toHaveLength(1);
      expect(inventory[0]).toEqual(mockItem);
    });

    it('should not add item when inventory is full', () => {
      const { addItem } = useInventoryStore.getState();

      for (let i = 0; i < 20; i++) {
        addItem({ ...mockItem, id: `item${i}` });
      }

      const success = addItem({ ...mockItem, id: 'item21' });

      expect(success).toBe(false);
      const { inventory } = useInventoryStore.getState();
      expect(inventory).toHaveLength(20);
    });
  });

  describe('equipItem', () => {
    it('should equip item from inventory', () => {
      const { addItem, equipItem } = useInventoryStore.getState();

      addItem(mockItem);
      const success = equipItem(mockItem);

      expect(success).toBe(true);
      const { equipment, inventory } = useInventoryStore.getState();
      expect(equipment.weapon).toEqual(mockItem);
      expect(inventory).toHaveLength(0);
    });

    it('should swap equipped item', () => {
      const { addItem, equipItem } = useInventoryStore.getState();
      const item2: Item = { ...mockItem, id: 'sword2', name: 'Steel Sword' };

      addItem(mockItem);
      equipItem(mockItem);
      addItem(item2);
      equipItem(item2);

      const { equipment, inventory } = useInventoryStore.getState();
      expect(equipment.weapon).toEqual(item2);
      expect(inventory).toHaveLength(1);
      expect(inventory[0]).toEqual(mockItem);
    });
  });

  describe('unequipItem', () => {
    it('should unequip item to inventory', () => {
      const { addItem, equipItem, unequipItem } = useInventoryStore.getState();

      addItem(mockItem);
      equipItem(mockItem);
      const success = unequipItem('weapon');

      expect(success).toBe(true);
      const { equipment, inventory } = useInventoryStore.getState();
      expect(equipment.weapon).toBeUndefined();
      expect(inventory).toHaveLength(1);
    });

    it('should not unequip when inventory is full', () => {
      const { addItem, equipItem, unequipItem } = useInventoryStore.getState();

      addItem(mockItem);
      equipItem(mockItem);

      for (let i = 0; i < 20; i++) {
        addItem({ ...mockItem, id: `item${i}`, slot: 'ring' });
      }

      const success = unequipItem('weapon');

      expect(success).toBe(false);
      const { equipment } = useInventoryStore.getState();
      expect(equipment.weapon).toEqual(mockItem);
    });
  });
});
