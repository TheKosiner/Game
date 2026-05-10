import { useGameStore } from '../store/gameStore';
import ItemIcon from './ItemIcon';
import type { Item } from '../types';

const RARITY_COLORS: Record<string, string> = {
  common: '#888899', uncommon: '#00cc66', rare: '#4488ff',
  epic: '#cc44ff', legendary: '#ffd700',
};
const RARITY_LABEL: Record<string, string> = {
  common: 'ZWYKLY', uncommon: 'NIEZWYKLY', rare: 'RZADKI',
  epic: 'EPICKI', legendary: 'LEGENDARNY',
};
const SLOT_LABEL: Record<string, string> = {
  weapon: 'Bron', armor: 'Zbroja', helmet: 'Helm',
  boots: 'Buty', ring: 'Pierscień', amulet: 'Amulet',
};
const MONO = { fontFamily: "'Share Tech Mono', monospace" } as const;
const ORB  = { fontFamily: "'Orbitron', monospace", fontWeight: 700 } as const;

function ItemCard({ item, onEquip, onSell }: { item: Item; onEquip: () => void; onSell: () => void }) {
  const rc = RARITY_COLORS[item.rarity];
  const statEntries = Object.entries(item.stats).filter(([, v]) => v && (v as number) > 0);
  return (
    <div style={{
      background: `linear-gradient(135deg, rgba(0,0,0,0.6), ${rc}06)`,
      border: `1px solid ${rc}44`,
      padding: 8, display: 'flex', gap: 8, alignItems: 'center',
      boxShadow: item.rarity === 'legendary' ? `0 0 16px ${rc}20` : 'none',
    }}>
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
          <span style={{ ...MONO, fontSize: 7, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', padding: '1px 3px', flexShrink: 0 }}>
            {SLOT_LABEL[item.slot] ?? item.slot.toUpperCase()}
          </span>
          <p style={{ ...MONO, fontSize: 11, color: rc, textShadow: `0 0 6px ${rc}80` }}>{item.name}</p>
          <span style={{ ...MONO, fontSize: 8, color: rc, background: `${rc}18`, border: `1px solid ${rc}33`, padding: '1px 3px' }}>
            {RARITY_LABEL[item.rarity]}
          </span>
        </div>
        <p style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', marginBottom: 2 }}>
          {SLOT_LABEL[item.slot] ?? item.slot} · Poz. {item.level}
        </p>
        <p style={{ ...MONO, fontSize: 10, color: 'var(--text-main)' }}>
          {statEntries.map(([k, v]) => `+${v} ${{ strength: 'Moc', dexterity: 'Zwin', intelligence: 'Cel', vitality: 'Zyw' }[k] ?? k}`).join('  ')}
          {item.attackBonus ? `  ⚔+${item.attackBonus}` : ''}
          {item.defenseBonus ? `  🛡+${item.defenseBonus}` : ''}
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
        <button onClick={onEquip} className="btn btn-primary" style={{ fontSize: 7, padding: '5px 8px' }}>Zaloz</button>
        <button onClick={onSell}  className="btn btn-secondary" style={{ fontSize: 7, padding: '5px 8px' }}>🪙{item.goldValue}</button>
      </div>
    </div>
  );
}

export default function InventoryPanel() {
  const inventory  = useGameStore(s => s.hero.inventory);
  const equipItem  = useGameStore(s => s.equipItem);
  const sellItem   = useGameStore(s => s.sellItem);

  return (
    <div className="card p-3" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <p style={{ ...ORB, fontSize: 9, color: '#9d4edd', textShadow: '0 0 8px rgba(157,78,221,0.5)' }}>🎒 PLECAK</p>
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
          <p style={{ ...ORB, fontSize: 10, color: 'var(--text-dim)' }}>PLECAK PUSTY</p>
          <p style={{ ...MONO, fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Idz walczyc!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 400, overflowY: 'auto', paddingRight: 2 }}>
          {inventory.map((item: Item, idx: number) => (
            <ItemCard key={idx} item={item}
              onEquip={() => equipItem(item, idx)} onSell={() => sellItem(item, idx)} />
          ))}
        </div>
      )}
    </div>
  );
}
