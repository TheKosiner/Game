import { useGameStore } from '../store/gameStore';
import ItemIcon from './ItemIcon';
import type { Item, ItemSlot } from '../types';

const RARITY_COLORS: Record<string, string> = {
  common: '#94a3b8', uncommon: '#4ade80', rare: '#60a5fa',
  epic: '#c084fc', legendary: '#f59e0b',
};

const SLOTS: { slot: ItemSlot; label: string }[] = [
  { slot: 'helmet', label: 'Hełm' },
  { slot: 'weapon', label: 'Broń' },
  { slot: 'armor',  label: 'Zbroja' },
  { slot: 'ring',   label: 'Pierścień' },
  { slot: 'boots',  label: 'Buty' },
  { slot: 'amulet', label: 'Amulet' },
];

// Placeholder sprite: a faint empty slot shape (different per slot)
const SLOT_ICONS: Record<string, string> = {
  helmet: '⛑', weapon: '⚔', armor: '🛡', ring: '💍', boots: '👢', amulet: '📿',
};

function ItemBadge({ item, onUnequip }: { item: Item; onUnequip: () => void }) {
  const rc = RARITY_COLORS[item.rarity];
  return (
    <div style={{
      background: 'rgba(5,8,20,0.85)',
      border: `1px solid ${rc}44`,
      borderRadius: 4,
      padding: 7,
      display: 'flex', alignItems: 'center', gap: 7,
      boxShadow: item.rarity === 'legendary' ? `0 0 14px ${rc}22` : 'none',
    }}>
      <div style={{
        background: 'rgba(5,8,20,0.9)',
        border: `1px solid ${rc}33`,
        borderRadius: 3,
        padding: 4,
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <ItemIcon item={item} scale={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: rc, fontSize: 6, marginBottom: 1 }}>{item.name}</p>
        <p style={{ color: '#475569', fontSize: 5 }}>Poz. {item.level}</p>
      </div>
      <button
        onClick={onUnequip}
        style={{
          color: '#334155', fontSize: 8, background: 'none', border: 'none',
          cursor: 'pointer', padding: '2px 4px', lineHeight: 1,
          fontFamily: 'monospace',
        }}
        title="Zdejmij"
      >✕</button>
    </div>
  );
}

export default function EquipmentPanel() {
  const equipment = useGameStore(s => s.hero.equipment);
  const unequipItem = useGameStore(s => s.unequipItem);

  return (
    <div className="card p-4" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{
        fontSize: 10,
        background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
      }}>⚔️ EKWIPUNEK</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {SLOTS.map(({ slot, label }) => {
          const item = equipment[slot];
          return item ? (
            <ItemBadge key={slot} item={item} onUnequip={() => unequipItem(slot)} />
          ) : (
            <div key={slot} style={{
              background: 'rgba(5,8,20,0.4)',
              border: '1px dashed rgba(30,41,59,0.8)',
              borderRadius: 4,
              padding: '7px 8px',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ fontSize: 14, opacity: 0.3 }}>{SLOT_ICONS[slot]}</span>
              <span style={{ color: '#1e293b', fontSize: 6 }}>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
