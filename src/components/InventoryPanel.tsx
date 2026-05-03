import { useGameStore } from '../store/gameStore';
import ItemIcon from './ItemIcon';
import type { Item } from '../types';

const RARITY_COLORS: Record<string, string> = {
  common: '#94a3b8', uncommon: '#4ade80', rare: '#60a5fa',
  epic: '#c084fc', legendary: '#f59e0b',
};
const RARITY_LABEL: Record<string, string> = {
  common: 'ZWYKŁY', uncommon: 'NIEZWYKŁY', rare: 'RZADKI',
  epic: 'EPICKI', legendary: 'LEGENDARNY',
};
const SLOT_LABEL: Record<string, string> = {
  weapon: 'Broń', armor: 'Zbroja', helmet: 'Hełm',
  boots: 'Buty', ring: 'Pierścień', amulet: 'Amulet',
};

function ItemCard({ item, onEquip, onSell }: { item: Item; onEquip: () => void; onSell: () => void }) {
  const rc = RARITY_COLORS[item.rarity];
  const statEntries = Object.entries(item.stats).filter(([, v]) => v && (v as number) > 0);
  return (
    <div style={{
      background: 'rgba(5,8,20,0.8)',
      border: `1px solid ${rc}44`,
      borderRadius: 4,
      padding: 8,
      display: 'flex', gap: 8, alignItems: 'center',
    }}>
      {/* Sprite */}
      <div style={{
        background: 'rgba(5,8,20,0.9)',
        border: `1px solid ${rc}33`,
        borderRadius: 3,
        padding: 5,
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <ItemIcon item={item} scale={3} />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
          <p style={{ color: rc, fontSize: 7 }}>{item.name}</p>
          <span style={{
            color: rc, fontSize: 5,
            background: rc + '18', border: `1px solid ${rc}44`,
            borderRadius: 2, padding: '1px 3px',
          }}>{RARITY_LABEL[item.rarity]}</span>
        </div>
        <p style={{ color: '#475569', fontSize: 6, marginBottom: 2 }}>
          {SLOT_LABEL[item.slot] ?? item.slot} · Poz. {item.level}
        </p>
        <p style={{ color: '#64748b', fontSize: 6 }}>
          {statEntries.map(([k, v]) => `+${v} ${({ strength: 'Siła', agility: 'Zwin', intelligence: 'Intel', constitution: 'Kond' } as Record<string,string>)[k] ?? k}`).join('  ')}
          {item.attackBonus ? `  ⚔️+${item.attackBonus}` : ''}
          {item.defenseBonus ? `  🛡+${item.defenseBonus}` : ''}
        </p>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
        <button onClick={onEquip} className="btn btn-primary" style={{ fontSize: 6, padding: '4px 7px' }}>Załóż</button>
        <button onClick={onSell} className="btn btn-secondary" style={{ fontSize: 6, padding: '4px 7px' }}>🪙 {item.goldValue}</button>
      </div>
    </div>
  );
}

export default function InventoryPanel() {
  const inventory = useGameStore(s => s.hero.inventory);
  const equipItem = useGameStore(s => s.equipItem);
  const sellItem = useGameStore(s => s.sellItem);

  return (
    <div className="card p-4" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{
        fontSize: 10,
        background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
      }}>🎒 PLECAK <span style={{ color: '#475569', WebkitTextFillColor: '#475569' }}>({inventory.length}/20)</span></p>

      {inventory.length === 0 ? (
        <p style={{ color: '#334155', fontSize: 7, textAlign: 'center', padding: '16px 0' }}>Plecak jest pusty. Idź walczyć!</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 420, overflowY: 'auto', paddingRight: 2 }}>
          {inventory.map((item: Item) => (
            <ItemCard
              key={`${item.id}-${item.name}`}
              item={item}
              onEquip={() => equipItem(item)}
              onSell={() => sellItem(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
