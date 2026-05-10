import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import ItemIcon from './ItemIcon';
import type { Item, ItemSlot } from '../types';

const RARITY_COLORS: Record<string, string> = {
  common: '#888899', uncommon: '#00cc66', rare: '#4488ff',
  epic: '#cc44ff', legendary: '#ffd700',
};
const RARITY_LABEL: Record<string, string> = {
  common: 'ZWYKLY', uncommon: 'NIEZWYKLY', rare: 'RZADKI',
  epic: 'EPICKI', legendary: 'LEGENDARNY',
};
const SLOT_SHORT: Record<string, string> = {
  weapon: 'BRON', armor: 'ZBR', helmet: 'HELM', boots: 'BUTY', ring: 'IMPL', amulet: 'AMU',
};
const SLOTS: { slot: ItemSlot; label: string; icon: string }[] = [
  { slot: 'helmet', label: 'Helm',      icon: '⛑' },
  { slot: 'weapon', label: 'Bron',      icon: '⚔' },
  { slot: 'armor',  label: 'Zbroja',    icon: '🛡' },
  { slot: 'ring',   label: 'Pierscień', icon: '💍' },
  { slot: 'boots',  label: 'Buty',      icon: '👢' },
  { slot: 'amulet', label: 'Amulet',    icon: '💿' },
];
const MONO = { fontFamily: "'Share Tech Mono', monospace" } as const;
const ORB  = { fontFamily: "'Orbitron', monospace", fontWeight: 700 } as const;
const STAT_NAMES: Record<string, string> = {
  strength: 'Sila', dexterity: 'Zrecznosc',
  intelligence: 'Celnosc', vitality: 'Zywotnosc',
};

function ItemDetailPanel({ item, onClose, onUnequip }: { item: Item; onClose: () => void; onUnequip: () => void }) {
  const rc = RARITY_COLORS[item.rarity];
  const statEntries = Object.entries(item.stats).filter(([, v]) => v && (v as number) > 0);

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(10,10,20,0.98), rgba(5,5,15,0.99))',
      border: `1px solid ${rc}55`,
      padding: 12,
      boxShadow: `0 0 24px ${rc}18, inset 0 2px 8px rgba(0,0,0,0.5)`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{
          background: 'rgba(0,0,0,0.6)', border: `1px solid ${rc}44`,
          padding: 6, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 10px ${rc}22`,
        }}>
          <ItemIcon item={item} scale={3} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
            <span style={{ ...MONO, fontSize: 7, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', padding: '1px 4px', flexShrink: 0 }}>
              {SLOT_SHORT[item.slot] ?? item.slot.toUpperCase()}
            </span>
            <p style={{ ...ORB, fontSize: 9, color: rc, textShadow: `0 0 8px ${rc}` }}>{item.name}</p>
          </div>
          <span style={{ ...MONO, fontSize: 9, color: rc, background: `${rc}18`, border: `1px solid ${rc}33`, padding: '1px 5px' }}>
            {RARITY_LABEL[item.rarity]}
          </span>
        </div>
        <button onClick={onClose} style={{ color: 'var(--text-dim)', fontSize: 14, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', fontFamily: 'monospace', flexShrink: 0 }}>✕</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
        <p style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', marginBottom: 3 }}>STATYSTYKI</p>
        {statEntries.map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ ...MONO, fontSize: 11, color: 'var(--text-main)' }}>{STAT_NAMES[k] ?? k}</span>
            <span style={{ ...ORB, fontSize: 10, color: '#00ff88' }}>+{v as number}</span>
          </div>
        ))}
        {item.attackBonus ? (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ ...MONO, fontSize: 11, color: 'var(--text-main)' }}>⚔ Atak</span>
            <span style={{ ...ORB, fontSize: 10, color: '#ff2d78' }}>+{item.attackBonus}</span>
          </div>
        ) : null}
        {item.defenseBonus ? (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ ...MONO, fontSize: 11, color: 'var(--text-main)' }}>🛡 Obrona</span>
            <span style={{ ...ORB, fontSize: 10, color: '#00f5ff' }}>+{item.defenseBonus}</span>
          </div>
        ) : null}
        {statEntries.length === 0 && !item.attackBonus && !item.defenseBonus && (
          <p style={{ ...MONO, fontSize: 11, color: 'var(--text-dim)' }}>Brak bonusow statystyk</p>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <p style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)' }}>Min. poziom: {item.level}</p>
        <p style={{ ...ORB, fontSize: 10, color: '#ffd700', textShadow: '0 0 8px rgba(255,215,0,0.5)' }}>{item.goldValue}🪙</p>
      </div>

      <button onClick={onUnequip} className="btn btn-secondary" style={{ width: '100%', fontSize: 8, padding: '7px' }}>
        ✕ ZDEJMIJ PRZEDMIOT
      </button>
    </div>
  );
}

function ItemBadge({ item, onSelect }: { item: Item; onSelect: () => void }) {
  const rc = RARITY_COLORS[item.rarity];
  return (
    <div onClick={onSelect} style={{
      background: `linear-gradient(135deg, rgba(0,0,0,0.6), ${rc}08)`,
      border: `1px solid ${rc}44`,
      padding: '6px 7px',
      display: 'flex', alignItems: 'center', gap: 6,
      boxShadow: item.rarity === 'legendary' || item.rarity === 'epic' ? `0 0 14px ${rc}22` : 'none',
      cursor: 'pointer',
      transition: 'border-color 0.15s, box-shadow 0.15s',
    }}>
      <div style={{ background: 'rgba(0,0,0,0.5)', border: `1px solid ${rc}33`, padding: 4, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ItemIcon item={item} scale={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
          <span style={{ ...MONO, fontSize: 6, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', padding: '1px 3px', flexShrink: 0 }}>
            {SLOT_SHORT[item.slot] ?? item.slot.toUpperCase()}
          </span>
          <p style={{ ...MONO, fontSize: 10, color: rc }}>{item.name}</p>
        </div>
        <p style={{ ...MONO, fontSize: 9, color: 'var(--text-dim)' }}>Poz. {item.level}</p>
      </div>
      <span style={{ color: 'var(--text-dim)', fontSize: 10, flexShrink: 0 }}>ℹ</span>
    </div>
  );
}

export default function EquipmentPanel() {
  const equipment  = useGameStore(s => s.hero.equipment);
  const unequipItem = useGameStore(s => s.unequipItem);
  const [selectedSlot, setSelectedSlot] = useState<ItemSlot | null>(null);
  const selectedItem = selectedSlot ? equipment[selectedSlot] : null;

  return (
    <div className="card p-3" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ ...ORB, fontSize: 9, color: '#ff2d78', textShadow: '0 0 8px rgba(255,45,120,0.5)' }}>
        ⚔ EKWIPUNEK
      </p>

      {selectedItem && selectedSlot ? (
        <ItemDetailPanel
          item={selectedItem}
          onClose={() => setSelectedSlot(null)}
          onUnequip={() => { unequipItem(selectedSlot); setSelectedSlot(null); }}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {SLOTS.map(({ slot, label, icon }) => {
            const item = equipment[slot];
            return item ? (
              <ItemBadge key={slot} item={item} onSelect={() => setSelectedSlot(slot)} />
            ) : (
              <div key={slot} className="df-slot empty" style={{ minHeight: 52 }}>
                <span style={{ fontSize: 18, opacity: 0.15 }}>{icon}</span>
                <span style={{ ...MONO, fontSize: 9, color: 'var(--text-muted)', marginTop: 3 }}>{label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
