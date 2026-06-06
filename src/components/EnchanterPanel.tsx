import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import { syncToCloud } from '../lib/cloudSync';
import { useLangStore } from '../store/langStore';
import { generateItem, getItemName } from '../data/itemGenerator';
import ItemIcon from './ItemIcon';
import type { Item, Equipment, Stats } from '../types/index';

const ORB: React.CSSProperties = { fontFamily: "'Orbitron', monospace", fontWeight: 700 };
const MONO: React.CSSProperties = { fontFamily: "'Share Tech Mono', monospace" };

const RARITY_COLOR: Record<string, string> = {
  common:    'rgba(255,255,255,0.6)',
  uncommon:  '#4caf50',
  rare:      '#2196f3',
  epic:      '#9c27b0',
  legendary: '#ffd700',
};

const REROLL_COST_MULT: Record<string, number> = {
  common:    3,
  uncommon:  10,
  rare:      33,
  epic:      100,
  legendary: 233,
};

function rerollCost(item: Item): number {
  const mult = REROLL_COST_MULT[item.rarity] ?? 33;
  return Math.max(33, item.level * item.level * mult);
}

type EquipSlot = keyof Equipment;
type Source = 'equipment' | 'inventory';
interface Selection { source: Source; idxOrSlot: number | EquipSlot; item: Item }

function statLabel(k: keyof Stats, lang: string): string {
  if (lang === 'en') {
    const map: Record<keyof Stats, string> = {
      strength: 'STR', dexterity: 'DEX', intelligence: 'INT',
      vitality: 'VIT', magic: 'MAG', magicResistance: 'RES',
    };
    return map[k];
  }
  const map: Record<keyof Stats, string> = {
    strength: 'SIŁ', dexterity: 'ZRĘ', intelligence: 'INT',
    vitality: 'WIT', magic: 'MAG', magicResistance: 'ODP',
  };
  return map[k];
}

function ItemStats({ item, lang }: { item: Item; lang: string }) {
  const entries: React.ReactNode[] = [];
  if (item.attackBonus)  entries.push(<span key="atk" style={{ color: '#ff6b6b' }}>ATK +{item.attackBonus}</span>);
  if (item.defenseBonus) entries.push(<span key="def" style={{ color: '#64b5f6' }}>DEF +{item.defenseBonus}</span>);
  for (const [k, v] of Object.entries(item.stats) as [keyof Stats, number][]) {
    if (v) entries.push(<span key={k} style={{ color: 'rgba(255,255,255,0.55)' }}>{statLabel(k, lang)} +{v}</span>);
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 8px' }}>
      {entries.map((e, i) => <span key={i} style={{ ...MONO, fontSize: 9 }}>{e}</span>)}
    </div>
  );
}

function ItemCard({ item, selected, onClick, lang }: { item: Item; selected: boolean; onClick: () => void; lang: string }) {
  const color = RARITY_COLOR[item.rarity] ?? 'white';
  const enh = item.enhanceLevel ?? 0;
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: '8px 12px',
        background: selected ? 'rgba(168,0,255,0.12)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${selected ? '#a800ff' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 6, cursor: 'pointer', textAlign: 'left', width: '100%',
        transition: 'all 0.15s',
      }}
    >
      <div style={{ flexShrink: 0, marginTop: 2 }}><ItemIcon item={item} size={32} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <span style={{ ...ORB, fontSize: 10, color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {getItemName(item, lang as any)}
          </span>
          {enh > 0 && <span style={{ ...ORB, fontSize: 10, color: '#ffd700', flexShrink: 0 }}>+{enh}</span>}
          <span style={{ ...MONO, fontSize: 9, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>Lv.{item.level}</span>
        </div>
        <ItemStats item={item} lang={lang} />
      </div>
    </button>
  );
}

export default function EnchanterPanel() {
  const hero = useGameStore(s => s.hero);
  const { lang } = useLangStore();
  const user = useAuthStore(s => s.user);

  const [sel, setSel] = useState<Selection | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const equip = hero.equipment;
  const equipSlots = Object.entries(equip).filter(([, v]) => v) as [EquipSlot, Item][];
  const inventory = hero.inventory.filter(i => i.slot !== 'consumable' && i.slot !== 'mystery_box');

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function selectItem(source: Source, idxOrSlot: number | EquipSlot, item: Item) {
    setSel({ source, idxOrSlot, item });
  }

  function doReroll() {
    if (!sel) return;
    const cost = rerollCost(sel.item);
    if (hero.gold < cost) return;

    // Only reroll stat bonuses — keep attackBonus and defenseBonus unchanged
    const fresh = generateItem(sel.item.level, sel.item.rarity, sel.item.slot);
    const rerolled: Item = { ...sel.item, stats: fresh.stats };

    useGameStore.setState(s => {
      const h = { ...s.hero };
      h.gold = h.gold - cost;

      if (sel.source === 'equipment') {
        const slot = sel.idxOrSlot as EquipSlot;
        h.equipment = { ...h.equipment, [slot]: rerolled };
      } else {
        const idx = sel.idxOrSlot as number;
        const inv = [...h.inventory];
        inv[idx] = rerolled;
        h.inventory = inv;
      }

      return { hero: h };
    });

    setSel(prev => prev ? { ...prev, item: rerolled } : null);

    if (user) {
      syncToCloud(user.uid, user.username).catch(() => {});
    }

    showToast(lang === 'en' ? 'Stats rerolled!' : 'Statystyki przelosowane!');
  }

  const selectedCost = sel ? rerollCost(sel.item) : 0;
  const canAfford = hero.gold >= selectedCost;

  return (
    <div style={{ padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(168,0,255,0.12), rgba(80,0,200,0.08))',
        border: '1px solid rgba(168,0,255,0.3)',
        borderRadius: 10, padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <span style={{ fontSize: 36 }}>🔮</span>
        <div>
          <p style={{ ...ORB, fontSize: 13, color: '#a800ff', margin: 0, letterSpacing: 1, textShadow: '0 0 12px rgba(168,0,255,0.5)' }}>
            {lang === 'en' ? 'THE ENCHANTER' : 'ZAKLINACZ'}
          </p>
          <p style={{ ...MONO, fontSize: 9, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' }}>
            {lang === 'en'
              ? 'Reroll an item\'s stat bonuses for gold. ATK/DEF and rarity stay unchanged.'
              : 'Przelosuj bonusy statystyk przedmiotu za złoto. ATK/DEF i rzadkość pozostają bez zmian.'}
          </p>
        </div>
      </div>

      {/* Gold */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6 }}>
        <span style={{ ...MONO, fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>
          {lang === 'en' ? 'Your gold:' : 'Twoje złoto:'}
        </span>
        <span style={{ ...ORB, fontSize: 11, color: '#ffd700' }}>🪙 {hero.gold.toLocaleString()}</span>
      </div>

      {/* Equipped items */}
      {equipSlots.length > 0 && (
        <section>
          <p style={{ ...MONO, fontSize: 9, color: 'rgba(255,255,255,0.35)', margin: '0 0 6px', letterSpacing: 1 }}>
            {lang === 'en' ? 'EQUIPPED' : 'ZAŁOŻONE'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {equipSlots.map(([slot, item]) => (
              <ItemCard
                key={slot}
                item={item}
                lang={lang}
                selected={sel?.source === 'equipment' && sel.idxOrSlot === slot}
                onClick={() => selectItem('equipment', slot, item)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Inventory items */}
      {inventory.length > 0 && (
        <section>
          <p style={{ ...MONO, fontSize: 9, color: 'rgba(255,255,255,0.35)', margin: '0 0 6px', letterSpacing: 1 }}>
            {lang === 'en' ? 'INVENTORY' : 'EKWIPUNEK'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {inventory.map((item, idx) => (
              <ItemCard
                key={item.id}
                item={item}
                lang={lang}
                selected={sel?.source === 'inventory' && sel.idxOrSlot === idx}
                onClick={() => selectItem('inventory', idx, item)}
              />
            ))}
          </div>
        </section>
      )}

      {equipSlots.length === 0 && inventory.length === 0 && (
        <p style={{ ...MONO, fontSize: 11, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: 32 }}>
          {lang === 'en' ? 'No items to enchant.' : 'Brak przedmiotów do zaczarowania.'}
        </p>
      )}

      {/* Action panel */}
      {sel && (
        <div style={{
          position: 'sticky', bottom: 0,
          background: 'linear-gradient(180deg, transparent 0%, #05050d 20%)',
          paddingTop: 12,
        }}>
          <div style={{
            background: '#09090f',
            border: '1px solid rgba(168,0,255,0.3)',
            borderRadius: 10, padding: '14px 16px',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ItemIcon item={sel.item} size={36} />
              <div style={{ flex: 1 }}>
                <p style={{ ...ORB, fontSize: 10, color: RARITY_COLOR[sel.item.rarity] ?? '#fff', margin: 0 }}>
                  {getItemName(sel.item, lang as any)}
                </p>
                <p style={{ ...MONO, fontSize: 9, color: 'rgba(255,255,255,0.35)', margin: '2px 0 0' }}>
                  {lang === 'en' ? 'Reroll cost:' : 'Koszt przelosowania:'}{' '}
                  <span style={{ color: canAfford ? '#ffd700' : '#ff4444' }}>
                    🪙 {selectedCost.toLocaleString()}
                  </span>
                </p>
              </div>
            </div>
            <button
              onClick={doReroll}
              disabled={!canAfford}
              style={{
                padding: '11px 0',
                background: canAfford
                  ? 'linear-gradient(135deg, #4400aa, #a800ff)'
                  : 'rgba(255,255,255,0.06)',
                border: 'none', borderRadius: 7,
                cursor: canAfford ? 'pointer' : 'not-allowed',
                ...ORB, fontSize: 11,
                color: canAfford ? '#fff' : 'rgba(255,255,255,0.25)',
                letterSpacing: 1,
                boxShadow: canAfford ? '0 0 16px rgba(168,0,255,0.3)' : 'none',
              }}
            >
              {lang === 'en' ? '🎲 REROLL STATS' : '🎲 PRZELOSUJ STATYSTYKI'}
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && createPortal(
        <div style={{
          position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(168,0,255,0.9)', color: '#fff', borderRadius: 8,
          padding: '8px 20px', zIndex: 9999,
          ...ORB, fontSize: 11, whiteSpace: 'nowrap',
          boxShadow: '0 0 20px rgba(168,0,255,0.5)',
        }}>
          {toast}
        </div>,
        document.body,
      )}
    </div>
  );
}
