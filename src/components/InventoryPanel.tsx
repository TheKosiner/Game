import { useGameStore } from '../store/gameStore';
import ItemIcon from './ItemIcon';
import type { Item } from '../types';
import { useT } from '../hooks/useT';
import { useLangStore } from '../store/langStore';
import { getItemName } from '../data/itemGenerator';

const RARITY_COLORS: Record<string, string> = {
  common: '#888899', uncommon: '#00cc66', rare: '#4488ff',
  epic: '#cc44ff', legendary: '#ffd700',
};
const MONO = { fontFamily: "'Share Tech Mono', monospace" } as const;
const ORB  = { fontFamily: "'Orbitron', monospace", fontWeight: 700 } as const;

function ItemCard({ item, onEquip, onSell, onUse }: { item: Item; onEquip: () => void; onSell: () => void; onUse?: () => void }) {
  const t    = useT();
  const lang = useLangStore(s => s.lang);
  const rarityLabel: Record<string, string> = {
    common: t.equipment.rarityCommon, uncommon: t.equipment.rarityUncommon,
    rare: t.equipment.rarityRare, epic: t.equipment.rarityEpic, legendary: t.equipment.rarityLegendary,
  };
  const slotLabel: Record<string, string> = {
    weapon: t.inventory.slotWeapon, armor: t.inventory.slotArmor, helmet: t.inventory.slotHelmet,
    boots: t.inventory.slotBoots, ring: t.inventory.slotRing, amulet: t.inventory.slotAmulet,
    consumable: t.inventory.slotConsumable,
  };
  const statAbbr: Record<string, string> = {
    strength: t.inventory.statStr, dexterity: t.inventory.statDex,
    intelligence: t.inventory.statInt, vitality: t.inventory.statVit,
  };
  const rc = item.color ?? RARITY_COLORS[item.rarity];
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
            {slotLabel[item.slot] ?? item.slot.toUpperCase()}
          </span>
          <p style={{ ...MONO, fontSize: 11, color: rc, textShadow: `0 0 6px ${rc}80` }}>{getItemName(item, lang)}</p>
          <span style={{ ...MONO, fontSize: 8, color: rc, background: `${rc}18`, border: `1px solid ${rc}33`, padding: '1px 3px' }}>
            {rarityLabel[item.rarity]}
          </span>
        </div>
        <p style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', marginBottom: 2 }}>
          {slotLabel[item.slot] ?? item.slot} · Poz. {item.level}
        </p>
        <p style={{ ...MONO, fontSize: 10, color: item.slot === 'consumable' ? rc : 'var(--text-main)' }}>
          {item.slot === 'consumable'
            ? `♥ +${Math.round((item.healPercent ?? 1) * 100)}% HP`
            : <>
                {statEntries.map(([k, v]) => `+${v} ${statAbbr[k] ?? k}`).join('  ')}
                {item.attackBonus ? `  ⚔+${item.attackBonus}` : ''}
                {item.defenseBonus ? `  🛡+${item.defenseBonus}` : ''}
              </>
          }
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
        {item.slot === 'consumable'
          ? <button onClick={onUse} className="btn btn-primary" style={{ fontSize: 7, padding: '5px 8px' }}>{t.inventory.use}</button>
          : <button onClick={onEquip} className="btn btn-primary" style={{ fontSize: 7, padding: '5px 8px' }}>{t.inventory.equip}</button>
        }
        <button onClick={onSell} className="btn btn-secondary" style={{ fontSize: 7, padding: '5px 8px' }}>🪙{item.goldValue}</button>
      </div>
    </div>
  );
}

export default function InventoryPanel() {
  const t = useT();
  const inventory  = useGameStore(s => s.hero.inventory);
  const equipItem  = useGameStore(s => s.equipItem);
  const sellItem   = useGameStore(s => s.sellItem);
  const useItem    = useGameStore(s => s.useItem);

  return (
    <div className="card p-3" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <p style={{ ...ORB, fontSize: 9, color: '#9d4edd', textShadow: '0 0 8px rgba(157,78,221,0.5)' }}>{t.inventory.title}</p>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 400, overflowY: 'auto', paddingRight: 2 }}>
          {inventory.map((item: Item, idx: number) => (
            <ItemCard key={idx} item={item}
              onEquip={() => equipItem(item, idx)} onSell={() => sellItem(item, idx)} onUse={() => useItem(item, idx)} />
          ))}
        </div>
      )}
    </div>
  );
}
