import PixelSprite from './PixelSprite';
import { getItemSprite, getRarityPalette } from '../data/itemSprites';
import type { Item } from '../types';

interface Props {
  item: Item;
  scale?: number;
  style?: React.CSSProperties;
}

export default function ItemIcon({ item, scale = 3, style }: Props) {
  const grid = getItemSprite(item);
  const palette = getRarityPalette(item.rarity);
  return <PixelSprite grid={grid} scale={scale} paletteOverrides={palette} style={style} />;
}
