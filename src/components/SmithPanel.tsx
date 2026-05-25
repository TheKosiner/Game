import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { useT } from '../hooks/useT';
import { useLangStore } from '../store/langStore';
import type { Item, ItemSlot, Equipment } from '../types';

const ORB: React.CSSProperties = { fontFamily: "'Orbitron', monospace", fontWeight: 700 };
const MONO: React.CSSProperties = { fontFamily: "'Share Tech Mono', monospace" };

const ENHANCE_COSTS = [200, 500, 1000, 2000, 4000, 8000, 15000, 25000, 40000];
const ENHANCE_CHANCES = [90, 80, 70, 60, 50, 40, 30, 20, 10];
const MAX_ENHANCE = 9;

const RARITY_COLOR: Record<string, string> = {
  common: 'rgba(255,255,255,0.6)',
  uncommon: '#4caf50',
  rare: '#2196f3',
  epic: '#9c27b0',
  legendary: '#ffd700',
};

type EquipSlot = keyof Equipment;
type Source = 'equipment' | 'inventory';
interface Selection {
  source: Source;
  idxOrSlot: number | EquipSlot;
  item: Item;
}


function ItemCard({
  item, selected, onClick,
}: {
  item: Item; selected: boolean; onClick: () => void;
}) {
  const enh = item.enhanceLevel ?? 0;
  const color = RARITY_COLOR[item.rarity] ?? 'white';
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px',
        background: selected ? 'rgba(255,45,120,0.12)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${selected ? '#ff2d78' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 6, cursor: 'pointer', textAlign: 'left', width: '100%',
        transition: 'all 0.15s',
      }}
    >
      <span style={{ fontSize: 22, flexShrink: 0 }}>{item.emoji}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ ...ORB, fontSize: 10, color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.name}
          </span>
          {enh > 0 && (
            <span style={{ ...ORB, fontSize: 10, color: '#ffd700', flexShrink: 0 }}>+{enh}</span>
          )}
        </div>
        <span style={{ ...MONO, fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>
          Lv.{item.level}
        </span>
      </div>
      {enh >= MAX_ENHANCE && (
        <span style={{ ...ORB, fontSize: 8, color: '#ffd700' }}>MAX</span>
      )}
    </button>
  );
}

export default function SmithPanel() {
  const t = useT();
  const { lang } = useLangStore();
  const hero = useGameStore(s => s.hero);
  const enhanceItem = useGameStore(s => s.enhanceItem);

  const [selected, setSelected] = useState<Selection | null>(null);
  const [section, setSection] = useState<'equipped' | 'inventory'>('equipped');
  const [flash, setFlash] = useState<'success' | 'fail' | null>(null);

  const enhanceable: EquipSlot[] = ['weapon', 'armor', 'helmet', 'boots', 'ring', 'amulet'];

  const equippedItems: { slot: EquipSlot; item: Item }[] = enhanceable
    .filter(slot => !!hero.equipment[slot])
    .map(slot => ({ slot, item: hero.equipment[slot] as Item }));

  const inventoryItems = hero.inventory
    .map((item, idx) => ({ item, idx }))
    .filter(({ item }) => item.slot !== 'consumable' && item.slot !== 'mystery_box');

  function handleSelect(source: Source, idxOrSlot: number | EquipSlot, item: Item) {
    if (selected?.source === source && selected.idxOrSlot === idxOrSlot) {
      setSelected(null);
    } else {
      setSelected({ source, idxOrSlot, item });
    }
  }

  function handleEnhance() {
    if (!selected) return;
    const enh = selected.item.enhanceLevel ?? 0;
    if (enh >= MAX_ENHANCE) return;
    if (hero.gold < ENHANCE_COSTS[enh]) return;

    enhanceItem(selected.source, selected.idxOrSlot);

    // Detect success by checking updated item
    setTimeout(() => {
      const updatedHero = useGameStore.getState().hero;
      let updatedItem: Item | undefined;
      if (selected.source === 'inventory') {
        updatedItem = updatedHero.inventory[selected.idxOrSlot as number];
      } else {
        updatedItem = updatedHero.equipment[selected.idxOrSlot as EquipSlot] as Item | undefined;
      }
      const didSucceed = (updatedItem?.enhanceLevel ?? 0) > enh;
      setFlash(didSucceed ? 'success' : 'fail');
      setTimeout(() => setFlash(null), 1200);

      // Keep selection updated after enhance
      if (updatedItem) {
        setSelected(prev => prev ? { ...prev, item: updatedItem! } : null);
      }
    }, 0);
  }

  const sel = selected;
  const selEnh = sel ? (sel.item.enhanceLevel ?? 0) : 0;
  const canEnhance = sel && selEnh < MAX_ENHANCE;
  const cost = canEnhance ? ENHANCE_COSTS[selEnh] : null;
  const hasGold = cost !== null && hero.gold >= cost;

  // Sync selected item from store in case it was updated
  const freshSelected = (() => {
    if (!sel) return null;
    if (sel.source === 'inventory') {
      const item = hero.inventory[sel.idxOrSlot as number];
      return item ? { ...sel, item } : null;
    } else {
      const item = hero.equipment[sel.idxOrSlot as EquipSlot] as Item | undefined;
      return item ? { ...sel, item } : null;
    }
  })();
  const freshEnh = freshSelected ? (freshSelected.item.enhanceLevel ?? 0) : 0;
  const freshCost = freshSelected && freshEnh < MAX_ENHANCE ? ENHANCE_COSTS[freshEnh] : null;
  const freshChance = freshSelected && freshEnh < MAX_ENHANCE ? ENHANCE_CHANCES[freshEnh] : null;

  const isWeapon = freshSelected?.item.slot === 'weapon';
  const isDefense = freshSelected?.item.slot === 'armor' || freshSelected?.item.slot === 'helmet' || freshSelected?.item.slot === 'boots';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255,150,50,0.08), rgba(255,45,120,0.05))',
        border: '1px solid rgba(255,150,50,0.2)',
        borderRadius: 8, padding: '14px 16px',
      }}>
        <h2 style={{ ...ORB, margin: 0, fontSize: 14, color: '#ff9632', letterSpacing: 2 }}>{t.smith.title}</h2>
        <p style={{ ...MONO, margin: '4px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{t.smith.subtitle}</p>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>

        {/* Item list */}
        <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: 8 }}>

          {/* Section toggle */}
          <div style={{ display: 'flex', gap: 4 }}>
            {(['equipped', 'inventory'] as const).map(s => (
              <button key={s} onClick={() => setSection(s)} style={{
                ...ORB, flex: 1, padding: '7px 8px', fontSize: 9,
                background: section === s ? 'rgba(255,45,120,0.15)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${section === s ? '#ff2d78' : 'rgba(255,255,255,0.1)'}`,
                color: section === s ? '#ff2d78' : 'rgba(255,255,255,0.45)',
                borderRadius: 5, cursor: 'pointer',
              }}>
                {s === 'equipped' ? t.smith.equipped : t.smith.inventory}
              </button>
            ))}
          </div>

          {section === 'equipped' && (
            equippedItems.length === 0
              ? <p style={{ ...MONO, fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: 0 }}>{t.smith.noItems}</p>
              : equippedItems.map(({ slot, item }) => (
                <ItemCard
                  key={slot} item={item}
                  selected={selected?.source === 'equipment' && selected.idxOrSlot === slot}
                  onClick={() => handleSelect('equipment', slot, item)}
                />
              ))
          )}

          {section === 'inventory' && (
            inventoryItems.length === 0
              ? <p style={{ ...MONO, fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: 0 }}>{t.smith.noItems}</p>
              : inventoryItems.map(({ item, idx }) => (
                <ItemCard
                  key={idx} item={item}
                  selected={selected?.source === 'inventory' && selected.idxOrSlot === idx}
                  onClick={() => handleSelect('inventory', idx, item)}
                />
              ))
          )}
        </div>

        {/* Enhancement panel */}
        <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {!freshSelected ? (
            <div style={{
              border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 8,
              padding: 20, textAlign: 'center',
            }}>
              <p style={{ ...MONO, fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: 0 }}>{t.smith.selectItem}</p>
            </div>
          ) : (
            <div style={{
              background: flash === 'success'
                ? 'rgba(0,255,100,0.08)'
                : flash === 'fail'
                  ? 'rgba(255,50,50,0.08)'
                  : 'rgba(255,150,50,0.05)',
              border: `1px solid ${flash === 'success' ? 'rgba(0,255,100,0.3)' : flash === 'fail' ? 'rgba(255,50,50,0.3)' : 'rgba(255,150,50,0.2)'}`,
              borderRadius: 8, padding: '14px 16px',
              display: 'flex', flexDirection: 'column', gap: 10,
              transition: 'background 0.3s, border-color 0.3s',
            }}>
              {/* Item preview */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 28 }}>{freshSelected.item.emoji}</span>
                <div>
                  <div style={{ ...ORB, fontSize: 11, color: RARITY_COLOR[freshSelected.item.rarity] ?? 'white' }}>
                    {lang === 'en' ? (freshSelected.item.nameEn ?? freshSelected.item.name) : freshSelected.item.name}
                  </div>
                  <div style={{ ...MONO, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                    Lv.{freshSelected.item.level}
                  </div>
                </div>
              </div>

              {/* Current level */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ ...MONO, fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>Level</span>
                <span style={{ ...ORB, fontSize: 16, color: freshEnh > 0 ? '#ffd700' : 'rgba(255,255,255,0.4)' }}>
                  {freshEnh > 0 ? `+${freshEnh}` : '0'}
                </span>
              </div>

              {/* Progress bar */}
              <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                <div style={{
                  width: `${(freshEnh / MAX_ENHANCE) * 100}%`,
                  height: '100%',
                  background: freshEnh >= MAX_ENHANCE ? '#ffd700' : 'linear-gradient(90deg, #ff9632, #ff2d78)',
                  transition: 'width 0.3s',
                }} />
              </div>

              {freshEnh >= MAX_ENHANCE ? (
                <p style={{ ...ORB, fontSize: 11, color: '#ffd700', margin: 0, textAlign: 'center' }}>
                  {t.smith.maxLevel}
                </p>
              ) : (
                <>
                  {/* Stats */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {(isWeapon || isDefense) && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ ...MONO, fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>
                          {isWeapon ? 'ATK bonus/lv' : 'DEF bonus/lv'}
                        </span>
                        <span style={{ ...ORB, fontSize: 10, color: '#ff9632' }}>
                          +{isWeapon
                            ? Math.max(1, Math.round(freshSelected.item.level * 0.6))
                            : Math.max(1, Math.round(freshSelected.item.level * 0.4))}
                        </span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ ...MONO, fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>Success</span>
                      <span style={{ ...ORB, fontSize: 10, color: freshChance! >= 50 ? '#4caf50' : freshChance! >= 30 ? '#ff9632' : '#ff4444' }}>
                        {freshChance}%
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ ...MONO, fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>Cost</span>
                      <span style={{ ...ORB, fontSize: 10, color: hasGold ? '#ffd700' : '#ff4444' }}>
                        {freshCost}🪙
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ ...MONO, fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>On fail</span>
                      <span style={{ ...MONO, fontSize: 10, color: 'rgba(255,100,100,0.7)' }}>
                        {freshEnh > 0 ? `+${freshEnh} → +${freshEnh - 1}` : '—'}
                      </span>
                    </div>
                  </div>

                  {!hasGold && (
                    <p style={{ ...MONO, fontSize: 10, color: '#ff4444', margin: 0 }}>{t.smith.notEnoughGold}</p>
                  )}

                  <button
                    onClick={handleEnhance}
                    disabled={!hasGold}
                    style={{
                      ...ORB, fontSize: 11, padding: '10px 0',
                      background: hasGold
                        ? 'linear-gradient(135deg, rgba(255,150,50,0.2), rgba(255,45,120,0.2))'
                        : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${hasGold ? '#ff9632' : 'rgba(255,255,255,0.1)'}`,
                      color: hasGold ? '#ff9632' : 'rgba(255,255,255,0.2)',
                      borderRadius: 6, cursor: hasGold ? 'pointer' : 'not-allowed',
                      textShadow: hasGold ? '0 0 8px rgba(255,150,50,0.5)' : 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    {t.smith.enhanceBtn}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
