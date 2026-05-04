import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import ItemIcon from './ItemIcon';
import type { Item, ItemSlot } from '../types';

const RARITY_COLORS: Record<string, string> = {
  common: '#7a7060', uncommon: '#3a8050', rare: '#3060a0',
  epic: '#7040a0', legendary: '#9c7a3c',
};
const RARITY_LABEL: Record<string, string> = {
  common: 'ZWYKŁY', uncommon: 'NIEZWYKŁY', rare: 'RZADKI',
  epic: 'EPICKI', legendary: 'LEGENDARNY',
};
const SLOTS: { slot: ItemSlot; label: string; icon: string }[] = [
  { slot: 'helmet', label: 'Hełm',      icon: '⛑' },
  { slot: 'weapon', label: 'Broń',      icon: '⚔' },
  { slot: 'armor',  label: 'Zbroja',    icon: '🛡' },
  { slot: 'ring',   label: 'Pierścień', icon: '💍' },
  { slot: 'boots',  label: 'Buty',      icon: '👢' },
  { slot: 'amulet', label: 'Amulet',    icon: '📿' },
];
const PX = (s: number) => ({ fontFamily: "'Press Start 2P', monospace", fontSize: s } as const);
const STAT_NAMES: Record<string, string> = {
  strength: 'Moc ciała', agility: 'Zręczność',
  intelligence: 'Wiedza', constitution: 'Żywotność',
};

function ItemDetailPanel({ item, onClose, onUnequip }: { item: Item; onClose: () => void; onUnequip: () => void }) {
  const rc = RARITY_COLORS[item.rarity];
  const statEntries = Object.entries(item.stats).filter(([, v]) => v && (v as number) > 0);

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(16,12,4,0.98), rgba(10,8,2,0.99))',
      border: `1px solid ${rc}66`,
      padding: 12,
      boxShadow: `0 0 24px ${rc}18, inset 0 2px 8px rgba(0,0,0,0.5)`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ background: 'var(--bg-deep)', border: `1px solid ${rc}44`, padding: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ItemIcon item={item} scale={3} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ ...PX(7), color: rc, marginBottom: 3 }}>{item.name}</p>
          <span style={{ ...PX(4), color: rc, background: `${rc}18`, border: `1px solid ${rc}33`, padding: '1px 4px' }}>
            {RARITY_LABEL[item.rarity]}
          </span>
        </div>
        <button onClick={onClose} style={{ color: 'var(--text-muted)', fontSize: 10, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', fontFamily: 'monospace', flexShrink: 0 }}>✕</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
        <p style={{ ...PX(4), color: 'var(--text-muted)', marginBottom: 3 }}>STATYSTYKI</p>
        {statEntries.map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ ...PX(5), color: 'var(--text-dim)' }}>{STAT_NAMES[k] ?? k}</span>
            <span style={{ ...PX(6), color: '#6aaa30' }}>+{v as number}</span>
          </div>
        ))}
        {item.attackBonus ? (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ ...PX(5), color: 'var(--text-dim)' }}>⚔ Atak</span>
            <span style={{ ...PX(6), color: '#c05050' }}>+{item.attackBonus}</span>
          </div>
        ) : null}
        {item.defenseBonus ? (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ ...PX(5), color: 'var(--text-dim)' }}>🛡 Obrona</span>
            <span style={{ ...PX(6), color: '#5070c0' }}>+{item.defenseBonus}</span>
          </div>
        ) : null}
        {statEntries.length === 0 && !item.attackBonus && !item.defenseBonus && (
          <p style={{ ...PX(5), color: 'var(--text-muted)' }}>Brak bonusów statystyk</p>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <p style={{ ...PX(4), color: 'var(--text-muted)' }}>Min. poziom: {item.level}</p>
        <p style={{ ...PX(5), color: 'var(--gold-bright)' }}>Wartość: {item.goldValue}🪙</p>
      </div>

      <button onClick={onUnequip} className="btn btn-secondary" style={{ width: '100%', fontSize: 6, padding: '7px' }}>
        ✕ Zdejmij przedmiot
      </button>
    </div>
  );
}

function ItemBadge({ item, onSelect }: { item: Item; onSelect: () => void }) {
  const rc = RARITY_COLORS[item.rarity];
  return (
    <div
      onClick={onSelect}
      style={{
        background: 'var(--bg-inset)',
        border: `1px solid ${rc}55`,
        padding: '6px 7px',
        display: 'flex', alignItems: 'center', gap: 6,
        boxShadow: item.rarity === 'legendary' || item.rarity === 'epic' ? `0 0 12px ${rc}22` : 'none',
        cursor: 'pointer',
      }}
    >
      <div style={{ background: 'var(--bg-deep)', border: `1px solid ${rc}33`, padding: 4, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ItemIcon item={item} scale={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: rc, marginBottom: 2 }}>{item.name}</p>
        <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 4, color: 'var(--text-muted)' }}>Poz. {item.level}</p>
      </div>
      <span style={{ color: 'var(--text-muted)', fontSize: 8, flexShrink: 0 }}>ℹ</span>
    </div>
  );
}

export default function EquipmentPanel() {
  const equipment = useGameStore(s => s.hero.equipment);
  const unequipItem = useGameStore(s => s.unequipItem);

  const [selectedSlot, setSelectedSlot] = useState<ItemSlot | null>(null);
  const selectedItem = selectedSlot ? equipment[selectedSlot] : null;

  return (
    <div className="card p-3" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: 'var(--gold-main)', textShadow: '0 0 10px var(--gold-glow)' }}>
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
              <div key={slot} className="df-slot empty" style={{ minHeight: 48 }}>
                <span style={{ fontSize: 16, opacity: 0.2 }}>{icon}</span>
                <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 4, color: 'var(--text-muted)', marginTop: 3 }}>{label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
