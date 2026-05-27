import type { Item } from '../types';

export const MEDKIT: Item = {
  id: 'medkit_standard',
  name: 'Apteczka Polowa',
  nameEn: 'Field Medkit',
  slot: 'consumable',
  rarity: 'uncommon',
  stats: {},
  level: 1,
  goldValue: 60,
  emoji: '🩹',
  healPercent: 0.5,
  color: '#00d4b0',
};

export { generateShopItems } from './itemGenerator';
