import { useGameStore } from '../store/gameStore';
import ItemIcon from './ItemIcon';
import type { Item } from '../types';

const RARITY_COLORS: Record<string, string> = {
  common: '#7a7060', uncommon: '#3a8050', rare: '#3060a0',
  epic: '#7040a0', legendary: '#9c7a3c',
};
const RARITY_LABEL: Record<string, string> = {
  common: 'ZWYKŁY', uncommon: 'NIEZWYKŁY', rare: 'RZADKI',
  epic: 'EPICKI', legendary: 'LEGENDARNY',
};
const SLOT_LABEL: Record<string, string> = {
  weapon: 'Broń', armor: 'Zbroja', helmet: 'Hełm',
  boots: 'Buty', ring: 'Pierścień', amulet: 'Amulet',
};

const PX = (s: number) => ({ fontFamily: "'Press Start 2P', monospace", fontSize: s } as const);

function ItemCard({ item, onEquip, onSell }: { item: Item; onEquip: () => void; onSell: () => void }) {
  const rc = RARITY_COLORS[item.rarity];
  const statEntries = Object.entries(item.stats).filter(([, v]) => v && (v as number) > 0);
  return (
    <div style={{
      background: 'var(--bg-inset)',
      border: `1px solid ${rc}44`,
      padding: 8, display: 'flex', gap: 8, alignItems: 'center',
      boxShadow: item.rarity === 'legendary' ? `0 0 14px ${rc}20` : 'none',
    }}>
      <div style={{
        background: 'var(--bg-deep)', border: `1px solid ${rc}33`,
        padding: 5, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <ItemIcon item={item} scale={3} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
          <p style={{ ...PX(6), color: rc }}>{item.name}</p>
          <span style={{ ...PX(4), color: rc, background: `${rc}18`, border: `1px solid ${rc}33`, padding: '1px 3px' }}>
            {RARITY_LABEL[item.rarity]}
          </span>
        </div>
        <p style={{ ...PX(5), color: 'var(--text-muted)', marginBottom: 2 }}>
          {SLOT_LABEL[item.slot] ?? item.slot} · Poz. {item.level}
        </p>
        <p style={{ ...PX(5), color: 'var(--text-dim)' }}>
          {statEntries.map(([k, v]) => `+${v} ${({ strength: 'Moc', agility: 'Zwin', intelligence: 'Wied', constitution: 'Żyw' } as Record<string, string>)[k] ?? k}`).join('  ')}
          {item.attackBonus ? `  ⚔+${item.attackBonus}` : ''}
          {item.defenseBonus ? `  🛡+${item.defenseBonus}` : ''}
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
        <button onClick={onEquip} className="btn btn-primary" style={{ fontSize: 5, padding: '5px 7px' }}>Załóż</button>
        <button onClick={onSell} className="btn btn-secondary" style={{ fontSize: 5, padding: '5px 7px' }}>🪙 {item.goldValue}</button>
      </div>
    </div>
  );
}

export default function InventoryPanel() {
  const inventory = useGameStore(s => s.hero.inventory);
  const equipItem = useGameStore(s => s.equipItem);
  const sellItem = useGameStore(s => s.sellItem);

  return (
    <div className="card p-3" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <p style={{ ...PX(8), color: 'var(--gold-main)', textShadow: '0 0 10px var(--gold-glow)' }}>🎒 PLECAK</p>
        <span style={{
          ...PX(5), color: 'var(--text-muted)',
          background: 'var(--bg-inset)', border: '1px solid var(--border-dark)',
          padding: '2px 6px',
        }}>
          {inventory.length}/20
        </span>
      </div>

      {inventory.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <p style={{ ...PX(6), color: 'var(--text-muted)' }}>Plecak pusty.</p>
          <p style={{ ...PX(5), color: 'var(--text-muted)', marginTop: 6 }}>Idź walczyć!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 400, overflowY: 'auto', paddingRight: 2 }}>
          {inventory.map((item: Item) => (
            <ItemCard key={`${item.id}-${item.name}`} item={item}
              onEquip={() => equipItem(item)} onSell={() => sellItem(item)} />
          ))}
        </div>
      )}
    </div>
  );
}
