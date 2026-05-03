import { useGameStore } from '../store/gameStore';
import ItemIcon from './ItemIcon';
import type { Item, ItemSlot } from '../types';

const RARITY_COLORS: Record<string, string> = {
  common: '#7a7060', uncommon: '#3a8050', rare: '#3060a0',
  epic: '#7040a0', legendary: '#9c7a3c',
};

const SLOTS: { slot: ItemSlot; label: string; icon: string }[] = [
  { slot: 'helmet', label: 'Hełm',      icon: '⛑' },
  { slot: 'weapon', label: 'Broń',      icon: '⚔' },
  { slot: 'armor',  label: 'Zbroja',    icon: '🛡' },
  { slot: 'ring',   label: 'Pierścień', icon: '💍' },
  { slot: 'boots',  label: 'Buty',      icon: '👢' },
  { slot: 'amulet', label: 'Amulet',    icon: '📿' },
];

function ItemBadge({ item, onUnequip }: { item: Item; onUnequip: () => void }) {
  const rc = RARITY_COLORS[item.rarity];
  return (
    <div style={{
      background: 'var(--bg-inset)',
      border: `1px solid ${rc}55`,
      padding: '6px 7px',
      display: 'flex', alignItems: 'center', gap: 6,
      boxShadow: item.rarity === 'legendary' || item.rarity === 'epic' ? `0 0 12px ${rc}22` : 'none',
    }}>
      <div style={{
        background: 'var(--bg-deep)', border: `1px solid ${rc}33`,
        padding: 4, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <ItemIcon item={item} scale={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: rc, marginBottom: 2 }}>{item.name}</p>
        <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 4, color: 'var(--text-muted)' }}>Poz. {item.level}</p>
      </div>
      <button onClick={onUnequip} style={{
        color: 'var(--text-muted)', fontSize: 9, background: 'none', border: 'none',
        cursor: 'pointer', padding: '2px 4px', fontFamily: 'monospace',
      }}>✕</button>
    </div>
  );
}

export default function EquipmentPanel() {
  const equipment = useGameStore(s => s.hero.equipment);
  const unequipItem = useGameStore(s => s.unequipItem);

  return (
    <div className="card p-3" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: 'var(--gold-main)', textShadow: '0 0 10px var(--gold-glow)' }}>
        ⚔ EKWIPUNEK
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {SLOTS.map(({ slot, label, icon }) => {
          const item = equipment[slot];
          return item ? (
            <ItemBadge key={slot} item={item} onUnequip={() => unequipItem(slot)} />
          ) : (
            <div key={slot} className="df-slot empty" style={{ minHeight: 48 }}>
              <span style={{ fontSize: 16, opacity: 0.2 }}>{icon}</span>
              <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 4, color: 'var(--text-muted)', marginTop: 3 }}>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
