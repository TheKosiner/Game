import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useGameStore } from '../store/gameStore';
import ItemIcon from './ItemIcon';
import type { Item } from '../types';
import { useT } from '../hooks/useT';
import { useLangStore } from '../store/langStore';
import { getItemName } from '../data/itemGenerator';
import { MONO, ORB } from '../utils/styles';
import { getEnhanceAttackBonus, getEnhanceDefenseBonus, getEnhanceStatBonus } from '../utils/combat';
import { ComparePanel } from './ItemCompare';
import mysteryBoxSrc from '../assets/mystery-box.png';
import mysteryBoxUncommonSrc from '../assets/mystery-box-uncommon.png';
import mysteryBoxCommonSrc from '../assets/mystery-box-common.png';

const BOX_IMG: Partial<Record<string, string>> = {
  common:   mysteryBoxCommonSrc,
  uncommon: mysteryBoxUncommonSrc,
};
function getBoxImg(rarity: string) {
  return BOX_IMG[rarity] ?? mysteryBoxSrc;
}

const RARITY_COLORS: Record<string, string> = {
  common: '#888899', uncommon: '#00cc66', rare: '#4488ff',
  epic: '#cc44ff', legendary: '#ffd700',
};

function ItemCard({
  item, selected, onToggle, onEquip, onSell, onUse, onOpen,
}: {
  item: Item; selected: boolean;
  onToggle: () => void; onEquip: () => void; onSell: () => void; onUse?: () => void; onOpen?: () => void;
}) {
  const t    = useT();
  const lang = useLangStore(s => s.lang);
  const equipment = useGameStore(s => s.hero.equipment);

  const rarityLabel: Record<string, string> = {
    common: t.equipment.rarityCommon, uncommon: t.equipment.rarityUncommon,
    rare: t.equipment.rarityRare, epic: t.equipment.rarityEpic, legendary: t.equipment.rarityLegendary,
  };
  const slotLabel: Record<string, string> = {
    weapon: t.inventory.slotWeapon, armor: t.inventory.slotArmor, helmet: t.inventory.slotHelmet,
    boots: t.inventory.slotBoots, ring: t.inventory.slotRing, amulet: t.inventory.slotAmulet,
    consumable: t.inventory.slotConsumable, mystery_box: 'SKRZYNKA',
  };
  const statAbbr: Record<string, string> = {
    strength: t.inventory.statStr, dexterity: t.inventory.statDex,
    intelligence: t.inventory.statInt, vitality: t.inventory.statVit,
  };

  const rc = item.color ?? RARITY_COLORS[item.rarity];
  const isBox = item.slot === 'mystery_box';
  const isComparable = item.slot !== 'consumable' && !isBox;
  const equipped = isComparable ? (equipment[item.slot as keyof typeof equipment] as Item | undefined) : undefined;
  const statEntries = Object.entries(item.stats).filter(([, v]) => v && (v as number) > 0);

  return (
    <div style={{ borderRadius: selected ? '4px 4px 0 0' : 4 }}>
      <div
        onClick={isComparable ? onToggle : undefined}
        role={isComparable ? 'button' : undefined}
        tabIndex={isComparable ? 0 : undefined}
        onKeyDown={isComparable ? (e) => { if (e.key === 'Enter' || e.key === ' ') onToggle(); } : undefined}
        style={{
          background: `linear-gradient(135deg, rgba(0,0,0,0.6), ${rc}06)`,
          border: `1px solid ${selected ? rc + '99' : rc + '44'}`,
          borderRadius: selected ? '4px 4px 0 0' : 4,
          padding: 8, display: 'flex', gap: 8, alignItems: 'center',
          boxShadow: item.rarity === 'legendary' ? `0 0 16px ${rc}20` : 'none',
          cursor: isComparable ? 'pointer' : 'default',
          transition: 'border-color 0.15s',
        }}
      >
        <div style={{
          background: 'rgba(0,0,0,0.5)', border: `1px solid ${rc}33`,
          padding: 5, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 8px ${rc}15`,
        }}>
          <ItemIcon item={item} scale={3} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
            <span style={{ ...MONO, fontSize: 10, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', padding: '1px 3px', flexShrink: 0 }}>
              {slotLabel[item.slot] ?? item.slot.toUpperCase()}
            </span>
            <p style={{ ...MONO, fontSize: 11, color: rc, textShadow: `0 0 6px ${rc}80` }}>{getItemName(item, lang)}</p>
            {(item.enhanceLevel ?? 0) > 0 && (
              <span style={{ ...ORB, fontSize: 10, color: '#ffd700', background: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.35)', padding: '1px 5px', flexShrink: 0 }}>
                +{item.enhanceLevel}
              </span>
            )}
            <span style={{ ...MONO, fontSize: 10, color: rc, background: `${rc}18`, border: `1px solid ${rc}33`, padding: '1px 3px' }}>
              {rarityLabel[item.rarity]}
            </span>
          </div>
          <p style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', marginBottom: 2 }}>
            {slotLabel[item.slot] ?? item.slot} · {lang === 'en' ? 'LVL.' : 'Poz.'} {item.level}
          </p>
          <p style={{ ...MONO, fontSize: 10, color: item.slot === 'consumable' ? rc : 'var(--text-main)' }}>
            {item.slot === 'consumable'
              ? `♥ +${Math.round((item.healPercent ?? 1) * 100)}% HP`
              : <>
                  {statEntries.map(([k, v]) => `+${v} ${statAbbr[k] ?? k}`).join('  ')}
                  {item.attackBonus ? `  ⚔+${item.attackBonus}` : ''}
                  {item.defenseBonus ? `  🛡+${item.defenseBonus}` : ''}
                  {getEnhanceAttackBonus(item) > 0 && <span style={{ color: '#ffd700' }}>{`  ⚒⚔+${getEnhanceAttackBonus(item)}`}</span>}
                  {getEnhanceDefenseBonus(item) > 0 && <span style={{ color: '#ffd700' }}>{`  ⚒🛡+${getEnhanceDefenseBonus(item)}`}</span>}
                  {(() => {
                    const sb = getEnhanceStatBonus(item);
                    const entries = Object.entries(sb).filter(([, v]) => (v ?? 0) > 0);
                    if (!entries.length) return null;
                    const [stat, val] = entries[0];
                    const abbr: Record<string, string> = { strength: 'STR', dexterity: 'DEX', intelligence: 'ACC', vitality: 'VIT', magic: 'MAG', magicResistance: 'RES' };
                    return <span style={{ color: '#ffd700' }}>{`  ⚒${abbr[stat] ?? stat}+${val}`}</span>;
                  })()}
                </>
            }
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
          {isBox
            ? <button onClick={e => { e.stopPropagation(); onOpen?.(); }} className="btn btn-primary" style={{ padding: '5px 8px', fontSize: 10 }}>📦 OTWÓRZ</button>
            : item.slot === 'consumable'
            ? <button onClick={e => { e.stopPropagation(); onUse?.(); }} className="btn btn-primary" style={{ padding: '5px 8px' }}>{t.inventory.use}</button>
            : <button onClick={e => { e.stopPropagation(); onEquip(); }} className="btn btn-primary" style={{ padding: '5px 8px' }}>{t.inventory.equip}</button>
          }
          <button onClick={e => { e.stopPropagation(); onSell(); }} className="btn btn-secondary" style={{ padding: '5px 8px' }}>🪙{item.goldValue}</button>
        </div>
      </div>

      {selected && isComparable && (
        <ComparePanel newItem={item} equipped={equipped} />
      )}
    </div>
  );
}

export default function InventoryPanel() {
  const t         = useT();
  const inventory  = useGameStore(s => s.hero.inventory);
  const equipItem  = useGameStore(s => s.equipItem);
  const sellItem        = useGameStore(s => s.sellItem);
  const useItem         = useGameStore(s => s.useItem);
  const openBoxModal    = useGameStore(s => s.openMysteryBoxModal);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [sellConfirm, setSellConfirm] = useState<{ item: Item; idx: number } | null>(null);
  const [boxConfirm,  setBoxConfirm]  = useState<{ item: Item; idx: number } | null>(null);

  const rc = sellConfirm ? (RARITY_COLORS[sellConfirm.item.rarity] ?? '#aaa') : '#aaa';

  return (
    <div className="card p-3" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <p style={{ ...ORB, fontSize: 10, color: '#9d4edd', textShadow: '0 0 8px rgba(157,78,221,0.5)' }}>{t.inventory.title}</p>
        <span style={{
          ...MONO, fontSize: 10, color: inventory.length >= 18 ? '#ff4444' : 'var(--text-dim)',
          background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(157,78,221,0.2)',
          padding: '2px 7px',
        }}>
          {inventory.length}/20
        </span>
      </div>

      {inventory.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <p style={{ ...ORB, fontSize: 10, color: 'var(--text-dim)' }}>{t.inventory.empty}</p>
          <p style={{ ...MONO, fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>{t.inventory.emptyHint}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 500, overflowY: 'auto', paddingRight: 2 }}>
          {inventory.map((item: Item, idx: number) => (
            <ItemCard
              key={idx}
              item={item}
              selected={selectedIdx === idx}
              onToggle={() => setSelectedIdx(prev => prev === idx ? null : idx)}
              onEquip={() => { equipItem(item, idx); setSelectedIdx(null); }}
              onSell={() => { setSellConfirm({ item, idx }); setSelectedIdx(null); }}
              onUse={() => { useItem(item, idx); setSelectedIdx(null); }}
              onOpen={() => { setBoxConfirm({ item, idx }); setSelectedIdx(null); }}
            />
          ))}
        </div>
      )}

      {/* Box open confirmation overlay — portal bypasses zoom stacking context */}
      {boxConfirm && createPortal((() => {
        const bc = RARITY_COLORS[boxConfirm.item.rarity] ?? '#aaa';
        return (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.88)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
          }}>
            <div style={{
              background: '#08080f',
              border: `2px solid ${bc}66`,
              boxShadow: `0 0 40px ${bc}33`,
              padding: '20px 22px',
              width: '100%', maxWidth: 320,
              display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center',
            }}>
              <p style={{ ...ORB, fontSize: 10, color: bc, textAlign: 'center', letterSpacing: 2 }}>
                OTWORZYĆ SKRZYNKĘ?
              </p>
              <img
                src={getBoxImg(boxConfirm.item.rarity)}
                alt={boxConfirm.item.name}
                style={{ width: '100%', maxWidth: 220, display: 'block', objectFit: 'contain' }}
              />
              <p style={{ ...MONO, fontSize: 11, color: bc, textAlign: 'center' }}>
                {boxConfirm.item.name}
              </p>
              <p style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', textAlign: 'center' }}>
                Po otwarciu skrzynka zniknie z plecaka.
              </p>
              <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                <button
                  onClick={() => { openBoxModal(boxConfirm.item, boxConfirm.idx); setBoxConfirm(null); }}
                  className="btn btn-primary"
                  style={{ flex: 1, fontSize: 10 }}
                >
                  ✓ Otwórz
                </button>
                <button
                  onClick={() => setBoxConfirm(null)}
                  className="btn btn-secondary"
                  style={{ flex: 1, fontSize: 10 }}
                >
                  ✕ Anuluj
                </button>
              </div>
            </div>
          </div>
        );
      })(), document.body)}

      {/* Sell confirmation overlay — portal bypasses zoom stacking context */}
      {sellConfirm && createPortal(
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.82)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }}>
          <div style={{
            background: '#08080f',
            border: `2px solid ${rc}66`,
            boxShadow: `0 0 30px ${rc}22`,
            padding: '20px 22px',
            width: '100%', maxWidth: 320,
            display: 'flex', flexDirection: 'column', gap: 14,
          }}>
            <p style={{ ...ORB, fontSize: 10, color: rc, textAlign: 'center' }}>
              SPRZEDAĆ PRZEDMIOT?
            </p>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'rgba(255,255,255,0.03)', border: `1px solid ${rc}33`, padding: '10px 12px',
            }}>
              <ItemIcon item={sellConfirm.item} scale={4} />
              <div>
                <p style={{ ...MONO, fontSize: 11, color: rc }}>{sellConfirm.item.name}</p>
                <p style={{ ...MONO, fontSize: 10, color: '#ffd700', marginTop: 4 }}>
                  🪙 {sellConfirm.item.goldValue} złota
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { sellItem(sellConfirm.item, sellConfirm.idx); setSellConfirm(null); }}
                className="btn btn-primary"
                style={{ flex: 1, fontSize: 10 }}
              >
                ✓ Sprzedaj
              </button>
              <button
                onClick={() => setSellConfirm(null)}
                className="btn btn-secondary"
                style={{ flex: 1, fontSize: 10 }}
              >
                ✕ Anuluj
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
