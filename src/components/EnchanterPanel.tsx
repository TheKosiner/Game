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
interface RerollResult { oldItem: Item; newItem: Item }

const STAT_LABEL = (lang: string): Record<keyof Stats, string> =>
  lang === 'en'
    ? { strength: 'STR', dexterity: 'DEX', intelligence: 'ACC', vitality: 'VIT', magic: 'MAG', magicResistance: 'RES' }
    : { strength: 'SIŁ', dexterity: 'ZRĘ', intelligence: 'CEL', vitality: 'ŻYW', magic: 'MAG', magicResistance: 'ODP' };

function ItemStatLines({ item, lang }: { item: Item; lang: string }) {
  const labels = STAT_LABEL(lang);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {item.attackBonus ? (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ ...MONO, fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>ATK</span>
          <span style={{ ...ORB, fontSize: 10, color: '#ff6b6b' }}>+{item.attackBonus}</span>
        </div>
      ) : null}
      {item.defenseBonus ? (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ ...MONO, fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>DEF</span>
          <span style={{ ...ORB, fontSize: 10, color: '#64b5f6' }}>+{item.defenseBonus}</span>
        </div>
      ) : null}
      {(Object.entries(item.stats) as [keyof Stats, number][]).filter(([, v]) => v > 0).map(([k, v]) => (
        <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ ...MONO, fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{labels[k]}</span>
          <span style={{ ...ORB, fontSize: 10, color: '#00ff88' }}>+{v}</span>
        </div>
      ))}
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
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px',
        background: selected ? 'rgba(168,0,255,0.12)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${selected ? '#a800ff' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 6, cursor: 'pointer', textAlign: 'left', width: '100%',
        transition: 'all 0.15s',
      }}
    >
      <div style={{ flexShrink: 0 }}><ItemIcon item={item} size={32} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ ...ORB, fontSize: 10, color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {getItemName(item, lang as any)}
          </span>
          {enh > 0 && <span style={{ ...ORB, fontSize: 10, color: '#ffd700', flexShrink: 0 }}>+{enh}</span>}
        </div>
        <span style={{ ...MONO, fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>Lv.{item.level}</span>
      </div>
    </button>
  );
}

function ResultModal({ result, onClose, lang }: { result: RerollResult; onClose: () => void; lang: string }) {
  const labels = STAT_LABEL(lang);

  const oldStats = result.oldItem.stats;
  const newStats = result.newItem.stats;
  const allKeys = Array.from(new Set([
    ...Object.keys(oldStats),
    ...Object.keys(newStats),
  ])) as (keyof Stats)[];

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.88)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        background: '#08080f',
        border: '2px solid rgba(168,0,255,0.5)',
        boxShadow: '0 0 40px rgba(168,0,255,0.2)',
        borderRadius: 10,
        padding: '24px 20px',
        width: '100%', maxWidth: 340,
        display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center',
      }}>
        <span style={{ fontSize: 44 }}>✨</span>

        <p style={{ ...ORB, fontSize: 13, color: '#a800ff', textAlign: 'center', letterSpacing: 1, margin: 0 }}>
          {lang === 'en' ? 'REROLL COMPLETE!' : 'PRZELOSOWANIE ZAKOŃCZONE!'}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
          <ItemIcon item={result.newItem} size={44} />
          <div>
            <p style={{ ...ORB, fontSize: 10, color: RARITY_COLOR[result.newItem.rarity] ?? '#fff', margin: 0 }}>
              {getItemName(result.newItem, lang as any)}
            </p>
            <p style={{ ...MONO, fontSize: 9, color: 'rgba(255,255,255,0.35)', margin: '2px 0 0' }}>Lv.{result.newItem.level}</p>
          </div>
        </div>

        {/* Stat comparison */}
        <div style={{
          width: '100%',
          background: 'rgba(168,0,255,0.06)',
          border: '1px solid rgba(168,0,255,0.2)',
          borderRadius: 8, padding: '10px 14px',
          display: 'flex', flexDirection: 'column', gap: 5,
        }}>
          {allKeys.map(k => {
            const o = oldStats[k] ?? 0;
            const n = newStats[k] ?? 0;
            if (!o && !n) return null;
            const better = n > o;
            const worse  = n < o;
            const delta  = n - o;
            return (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ ...MONO, fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{labels[k]}</span>
                <span style={{ ...ORB, fontSize: 10 }}>
                  <span style={{ color: 'rgba(255,255,255,0.35)' }}>{o > 0 ? `+${o}` : '—'}</span>
                  <span style={{ color: 'rgba(255,255,255,0.25)', margin: '0 4px' }}>→</span>
                  <span style={{ color: better ? '#00ff88' : worse ? '#ff4444' : '#fff' }}>
                    {n > 0 ? `+${n}` : '—'}
                  </span>
                  {delta !== 0 && (
                    <span style={{ color: better ? '#00ff8888' : '#ff444488', fontSize: 9, marginLeft: 4 }}>
                      ({delta > 0 ? '+' : ''}{delta})
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '11px 0', border: 'none', borderRadius: 7,
            background: 'linear-gradient(135deg, #4400aa, #a800ff)',
            cursor: 'pointer', ...ORB, fontSize: 11, color: '#fff', letterSpacing: 1,
            boxShadow: '0 0 16px rgba(168,0,255,0.3)',
          }}
        >
          {lang === 'en' ? 'CLOSE' : 'ZAMKNIJ'}
        </button>
      </div>
    </div>,
    document.body,
  );
}

export default function EnchanterPanel() {
  const hero = useGameStore(s => s.hero);
  const { lang } = useLangStore();
  const user = useAuthStore(s => s.user);

  const [sel, setSel]       = useState<Selection | null>(null);
  const [section, setSection] = useState<'equipped' | 'inventory'>('equipped');
  const [result, setResult] = useState<RerollResult | null>(null);

  const equip = hero.equipment;
  const equippedItems = (['weapon','armor','helmet','boots','ring','amulet'] as EquipSlot[])
    .filter(s => !!equip[s])
    .map(s => ({ slot: s, item: equip[s] as Item }));
  const inventoryItems = hero.inventory
    .map((item, idx) => ({ item, idx }))
    .filter(({ item }) => item.slot !== 'consumable' && item.slot !== 'mystery_box');

  // Keep selected item in sync with store (after reroll it gets updated)
  const freshSel = (() => {
    if (!sel) return null;
    if (sel.source === 'inventory') {
      const item = hero.inventory[sel.idxOrSlot as number];
      return item ? { ...sel, item } : null;
    }
    const item = equip[sel.idxOrSlot as EquipSlot] as Item | undefined;
    return item ? { ...sel, item } : null;
  })();

  function handleSelect(source: Source, idxOrSlot: number | EquipSlot, item: Item) {
    if (sel?.source === source && sel.idxOrSlot === idxOrSlot) { setSel(null); return; }
    setSel({ source, idxOrSlot, item });
  }

  function doReroll() {
    if (!freshSel) return;
    const cost = rerollCost(freshSel.item);
    if (hero.gold < cost) return;

    const fresh = generateItem(freshSel.item.level, freshSel.item.rarity, freshSel.item.slot);
    const rerolled: Item = { ...freshSel.item, stats: fresh.stats };
    const oldItem = { ...freshSel.item };

    useGameStore.setState(s => {
      const h = { ...s.hero, gold: s.hero.gold - cost };
      if (freshSel.source === 'equipment') {
        h.equipment = { ...h.equipment, [freshSel.idxOrSlot as EquipSlot]: rerolled };
      } else {
        const inv = [...h.inventory];
        inv[freshSel.idxOrSlot as number] = rerolled;
        h.inventory = inv;
      }
      return { hero: h };
    });

    setSel(prev => prev ? { ...prev, item: rerolled } : null);
    setResult({ oldItem, newItem: rerolled });

    if (user) syncToCloud(user.uid, user.username).catch(() => {});
  }

  const cost      = freshSel ? rerollCost(freshSel.item) : 0;
  const canAfford = hero.gold >= cost;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {result && <ResultModal result={result} onClose={() => setResult(null)} lang={lang} />}

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(168,0,255,0.1), rgba(80,0,200,0.06))',
        border: '1px solid rgba(168,0,255,0.25)',
        borderRadius: 8, padding: '14px 16px',
      }}>
        <h2 style={{ ...ORB, margin: 0, fontSize: 14, color: '#a800ff', letterSpacing: 2, textShadow: '0 0 12px rgba(168,0,255,0.5)' }}>
          🔮 {lang === 'en' ? 'THE ENCHANTER' : 'ZAKLINACZ'}
        </h2>
        <p style={{ ...MONO, margin: '4px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
          {lang === 'en'
            ? 'Reroll stat bonuses for gold. ATK/DEF and rarity stay unchanged.'
            : 'Przelosuj bonusy statystyk za złoto. ATK/DEF i rzadkość pozostają bez zmian.'}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>

        {/* Item list */}
        <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['equipped', 'inventory'] as const).map(s => (
              <button key={s} onClick={() => setSection(s)} style={{
                ...ORB, flex: 1, padding: '7px 8px', fontSize: 9,
                background: section === s ? 'rgba(168,0,255,0.15)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${section === s ? '#a800ff' : 'rgba(255,255,255,0.1)'}`,
                color: section === s ? '#a800ff' : 'rgba(255,255,255,0.45)',
                borderRadius: 5, cursor: 'pointer',
              }}>
                {s === 'equipped' ? (lang === 'en' ? 'EQUIPPED' : 'ZAŁOŻONE') : (lang === 'en' ? 'INVENTORY' : 'PLECAK')}
              </button>
            ))}
          </div>

          {section === 'equipped' && (
            equippedItems.length === 0
              ? <p style={{ ...MONO, fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: 0 }}>
                  {lang === 'en' ? 'No equipped items.' : 'Brak założonych przedmiotów.'}
                </p>
              : equippedItems.map(({ slot, item }) => (
                <ItemCard key={slot} item={item} lang={lang}
                  selected={sel?.source === 'equipment' && sel.idxOrSlot === slot}
                  onClick={() => handleSelect('equipment', slot, item)} />
              ))
          )}

          {section === 'inventory' && (
            inventoryItems.length === 0
              ? <p style={{ ...MONO, fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: 0 }}>
                  {lang === 'en' ? 'No items in inventory.' : 'Brak przedmiotów w plecaku.'}
                </p>
              : inventoryItems.map(({ item, idx }) => (
                <ItemCard key={idx} item={item} lang={lang}
                  selected={sel?.source === 'inventory' && sel.idxOrSlot === idx}
                  onClick={() => handleSelect('inventory', idx, item)} />
              ))
          )}
        </div>

        {/* Action panel */}
        <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {!freshSel ? (
            <div style={{
              border: '1px dashed rgba(168,0,255,0.2)', borderRadius: 8,
              padding: 20, textAlign: 'center',
            }}>
              <p style={{ ...MONO, fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: 0 }}>
                {lang === 'en' ? 'Select an item to enchant' : 'Wybierz przedmiot do zaczarowania'}
              </p>
            </div>
          ) : (
            <div style={{
              background: 'rgba(168,0,255,0.05)',
              border: '1px solid rgba(168,0,255,0.2)',
              borderRadius: 8, padding: '14px 16px',
              display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              {/* Item header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ItemIcon item={freshSel.item} size={44} />
                <div>
                  <div style={{ ...ORB, fontSize: 11, color: RARITY_COLOR[freshSel.item.rarity] ?? 'white' }}>
                    {getItemName(freshSel.item, lang as any)}
                  </div>
                  <div style={{ ...MONO, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                    Lv.{freshSel.item.level}
                    {(freshSel.item.enhanceLevel ?? 0) > 0 && (
                      <span style={{ color: '#ffd700', marginLeft: 6 }}>+{freshSel.item.enhanceLevel}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Current stats */}
              <div style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 6, padding: '8px 10px',
              }}>
                <p style={{ ...MONO, fontSize: 8, color: 'rgba(255,255,255,0.3)', margin: '0 0 6px', letterSpacing: 1 }}>
                  {lang === 'en' ? 'CURRENT STATS' : 'AKTUALNE STATY'}
                </p>
                <ItemStatLines item={freshSel.item} lang={lang} />
              </div>

              {/* Cost row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ ...MONO, fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>
                  {lang === 'en' ? 'Cost' : 'Koszt'}
                </span>
                <span style={{ ...ORB, fontSize: 10, color: canAfford ? '#ffd700' : '#ff4444' }}>
                  {cost.toLocaleString()}🪙
                </span>
              </div>

              {/* Gold row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ ...MONO, fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>
                  {lang === 'en' ? 'Your gold' : 'Twoje złoto'}
                </span>
                <span style={{ ...MONO, fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>
                  {hero.gold.toLocaleString()}🪙
                </span>
              </div>

              {!canAfford && (
                <p style={{ ...MONO, fontSize: 10, color: '#ff4444', margin: 0 }}>
                  {lang === 'en' ? 'Not enough gold!' : 'Za mało złota!'}
                </p>
              )}

              <button
                onClick={doReroll}
                disabled={!canAfford}
                style={{
                  ...ORB, fontSize: 11, padding: '10px 0',
                  background: canAfford
                    ? 'linear-gradient(135deg, rgba(168,0,255,0.25), rgba(80,0,200,0.2))'
                    : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${canAfford ? '#a800ff' : 'rgba(255,255,255,0.1)'}`,
                  color: canAfford ? '#a800ff' : 'rgba(255,255,255,0.2)',
                  borderRadius: 6, cursor: canAfford ? 'pointer' : 'not-allowed',
                  textShadow: canAfford ? '0 0 8px rgba(168,0,255,0.5)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                🎲 {lang === 'en' ? 'REROLL STATS' : 'PRZELOSUJ STATY'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
