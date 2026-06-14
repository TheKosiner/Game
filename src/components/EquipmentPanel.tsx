import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import ItemIcon from './ItemIcon';
import type { Item, ItemSlot } from '../types';
import { useT } from '../hooks/useT';
import { useLangStore } from '../store/langStore';
import { getItemName } from '../data/itemGenerator';
import { MONO, ORB, WeaponBadges } from '../utils/styles';
import GameIcon, { type GameIconName } from './GameIcon';

const RARITY_COLORS: Record<string, string> = {
  common: '#888899', uncommon: '#00cc66', rare: '#4488ff',
  epic: '#cc44ff', legendary: '#ffd700',
};
const STAT_NAMES: Record<string, string> = {
  strength: 'Siła', dexterity: 'Zręczność',
  intelligence: 'Celność', vitality: 'Żywotność',
  magic: 'Magia', magicResistance: 'Odp. mag.',
};

function primaryStat(item: Item): string | null {
  const entries = Object.entries(item.stats).filter(([, v]) => (v as number) > 0);
  if (!entries.length) return null;
  entries.sort((a, b) => (b[1] as number) - (a[1] as number));
  const [k, v] = entries[0];
  return `${STAT_NAMES[k] ?? k} +${v}`;
}

function mainBonus(item: Item, lang?: string): { icon: GameIconName; label: string; value: string; color: string } | null {
  if (item.attackBonus) {
    const isMagic = (item as any).magicDamage;
    return { icon: isMagic ? 'magic_orb' : 'sword', label: isMagic ? 'Mag' : 'Atak', value: `+${item.attackBonus}`, color: isMagic ? '#c078f0' : '#ff2d78' };
  }
  if (item.defenseBonus) return { icon: 'shield', label: lang === 'en' ? 'Defense' : 'Obrona', value: `+${item.defenseBonus}`, color: '#00f5ff' };
  const ps = primaryStat(item);
  if (ps) return { icon: 'up_arrow', label: ps.split(' ')[0], value: ps.split(' ').slice(1).join(' '), color: '#00ff88' };
  return null;
}

function ItemDetailPanel({ item, onClose, onUnequip }: { item: Item; onClose: () => void; onUnequip: () => void }) {
  const t    = useT();
  const lang = useLangStore(s => s.lang);
  const rarityLabel: Record<string, string> = {
    common: t.equipment.rarityCommon, uncommon: t.equipment.rarityUncommon,
    rare: t.equipment.rarityRare, epic: t.equipment.rarityEpic, legendary: t.equipment.rarityLegendary,
  };
  const statNames: Record<string, string> = {
    strength: t.equipment.statStrength, dexterity: t.equipment.statDexterity,
    intelligence: t.equipment.statIntelligence, vitality: t.equipment.statVitality,
    magic: t.equipment.statMagic, magicResistance: t.equipment.statMagRes,
  };
  const rc = RARITY_COLORS[item.rarity];
  const statEntries = Object.entries(item.stats).filter(([, v]) => v && (v as number) > 0);
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(10,10,20,0.98), rgba(5,5,15,0.99))',
      border: `1px solid ${rc}55`, padding: 12,
      boxShadow: `0 0 24px ${rc}18, inset 0 2px 8px rgba(0,0,0,0.5)`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{
          background: 'rgba(0,0,0,0.6)', border: `1px solid ${rc}44`, padding: 8, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 10px ${rc}22`,
        }}>
          <ItemIcon item={item} size={56} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ ...ORB, fontSize: 10, color: rc, textShadow: `0 0 8px ${rc}`, marginBottom: 4 }}>{getItemName(item, lang)}</p>
          <span style={{ ...MONO, fontSize: 10, color: rc, background: `${rc}18`, border: `1px solid ${rc}33`, padding: '1px 5px' }}>
            {rarityLabel[item.rarity]}
          </span>
          <WeaponBadges item={item} ml={4} />
        </div>
        <button aria-label="Close" onClick={onClose} style={{ color: 'var(--text-dim)', fontSize: 14, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', fontFamily: 'monospace', flexShrink: 0 }}>✕</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
        <p style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', marginBottom: 2 }}>{t.equipment.stat}</p>
        {statEntries.map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ ...MONO, fontSize: 11, color: 'var(--text-main)' }}>{statNames[k] ?? k}</span>
            <span style={{ ...ORB, fontSize: 10, color: '#00ff88' }}>+{v as number}</span>
          </div>
        ))}
        {item.attackBonus ? (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ ...MONO, fontSize: 11, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <GameIcon name={(item as any).magicDamage ? 'magic_orb' : 'sword'} size={10} color={(item as any).magicDamage ? '#c078f0' : '#ff2d78'} />
              {(item as any).magicDamage ? (lang === 'en' ? 'Magic Dmg.' : 'Obrażenia mag.') : t.equipment.atk}
            </span>
            <span style={{ ...ORB, fontSize: 10, color: (item as any).magicDamage ? '#c078f0' : '#ff2d78' }}>+{item.attackBonus}</span>
          </div>
        ) : null}
        {item.defenseBonus ? (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ ...MONO, fontSize: 11, color: 'var(--text-main)' }}>{t.equipment.def}</span>
            <span style={{ ...ORB, fontSize: 10, color: '#00f5ff' }}>+{item.defenseBonus}</span>
          </div>
        ) : null}
        {statEntries.length === 0 && !item.attackBonus && !item.defenseBonus && (
          <p style={{ ...MONO, fontSize: 11, color: 'var(--text-dim)' }}>{lang === 'en' ? 'No stat bonuses' : 'Brak bonusów statystyk'}</p>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <p style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)' }}>{lang === 'en' ? 'Min. lvl.' : 'Min. poz.'} {item.level}</p>
        <p style={{ ...ORB, fontSize: 10, color: '#ffd700', textShadow: '0 0 8px rgba(255,215,0,0.5)', display: 'flex', alignItems: 'center', gap: 2 }}>{item.goldValue}<GameIcon name="coin" size={10} /></p>
      </div>

      <button onClick={onUnequip} className="btn btn-secondary" style={{ width: '100%', fontSize: 10, padding: '7px' }}>
        {t.equipment.unequip}
      </button>
    </div>
  );
}

function WeaponSlot({ item, onSelect }: { item: Item | undefined; onSelect: () => void }) {
  const t    = useT();
  const lang = useLangStore(s => s.lang);
  const rarityLabel: Record<string, string> = {
    common: t.equipment.rarityCommon, uncommon: t.equipment.rarityUncommon,
    rare: t.equipment.rarityRare, epic: t.equipment.rarityEpic, legendary: t.equipment.rarityLegendary,
  };
  const rc = item ? RARITY_COLORS[item.rarity] : '#333344';
  const bonus = item ? mainBonus(item, lang) : null;
  const ps = item ? primaryStat(item) : null;

  return (
    <div
      onClick={item ? onSelect : undefined}
      role={item ? 'button' : undefined}
      tabIndex={item ? 0 : undefined}
      onKeyDown={item ? (e) => { if (e.key === 'Enter' || e.key === ' ') e.currentTarget.click(); } : undefined}
      style={{
        background: item
          ? `linear-gradient(135deg, rgba(0,0,0,0.7), ${rc}12)`
          : 'rgba(255,255,255,0.03)',
        border: `1px solid ${item ? rc + '55' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 2,
        padding: '10px 14px',
        display: 'flex', alignItems: 'center', gap: 14,
        cursor: item ? 'pointer' : 'default',
        minHeight: 80,
        boxShadow: item && (item.rarity === 'legendary' || item.rarity === 'epic')
          ? `0 0 20px ${rc}28, inset 0 0 12px ${rc}08` : 'none',
        transition: 'border-color 0.15s',
      }}>
      {item ? (
        <>
          <div style={{
            background: 'rgba(0,0,0,0.6)', border: `1px solid ${rc}44`,
            padding: 8, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 12px ${rc}30`,
          }}>
            <ItemIcon item={item} size={56} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <span style={{ ...MONO, fontSize: 10, color: rc, background: `${rc}18`, border: `1px solid ${rc}33`, padding: '1px 5px' }}>
                {rarityLabel[item.rarity]}
              </span>
              <WeaponBadges item={item} />
            </div>
            <p style={{ ...ORB, fontSize: 12, color: rc, textShadow: `0 0 8px ${rc}88`, marginBottom: 4 }}>{getItemName(item, lang)}</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {bonus && (
                <span style={{ ...ORB, fontSize: 10, color: bonus.color, textShadow: `0 0 6px ${bonus.color}88`, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <GameIcon name={bonus.icon} size={10} color={bonus.color} />{bonus.label} {bonus.value}
                </span>
              )}
              {ps && bonus && ps !== `${bonus.label} ${bonus.value}` && (
                <span style={{ ...MONO, fontSize: 10, color: '#00ff88' }}>+{ps.split('+')[1]} {ps.split(' +')[0]}</span>
              )}
            </div>
            <p style={{ ...MONO, fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{lang === 'en' ? 'Level:' : 'Poziom:'} {item.level}</p>
          </div>
          <span style={{ color: 'var(--text-dim)', fontSize: 12, flexShrink: 0 }}>ℹ</span>
        </>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <GameIcon name="sword" size={28} color="rgba(255,255,255,0.1)" />
          <span style={{ ...MONO, fontSize: 10, color: 'var(--text-muted)' }}>{t.equipment.slotWeapon}</span>
        </div>
      )}
    </div>
  );
}

function SmallSlot({ item, label, icon, onSelect }: { item: Item | undefined; label: string; icon: GameIconName; onSelect: () => void }) {
  const lang = useLangStore(s => s.lang);
  const rc = item ? RARITY_COLORS[item.rarity] : '#333344';
  const bonus = item ? mainBonus(item, lang) : null;

  return (
    <div
      onClick={item ? onSelect : undefined}
      role={item ? 'button' : undefined}
      tabIndex={item ? 0 : undefined}
      onKeyDown={item ? (e) => { if (e.key === 'Enter' || e.key === ' ') e.currentTarget.click(); } : undefined}
      style={{
        background: item
          ? `linear-gradient(135deg, rgba(0,0,0,0.6), ${rc}08)`
          : 'rgba(255,255,255,0.03)',
        border: `1px solid ${item ? rc + '44' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 2,
        padding: '7px 9px',
        display: 'flex', alignItems: 'center', gap: 8,
        cursor: item ? 'pointer' : 'default',
        minHeight: 58,
        boxShadow: item && (item.rarity === 'legendary' || item.rarity === 'epic')
          ? `0 0 12px ${rc}20` : 'none',
        transition: 'border-color 0.15s',
      }}>
      {item ? (
        <>
          <div style={{
            background: 'rgba(0,0,0,0.5)', border: `1px solid ${rc}33`,
            padding: 5, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ItemIcon item={item} size={36} />
          </div>
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <p style={{ ...MONO, fontSize: 10, color: rc, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getItemName(item, lang)}</p>
            {bonus && (
              <span style={{ ...ORB, fontSize: 10, color: bonus.color }}>
                {bonus.value}
              </span>
            )}
            <p style={{ ...MONO, fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>poz. {item.level}</p>
          </div>
        </>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <GameIcon name={icon} size={18} color="rgba(255,255,255,0.1)" />
          <span style={{ ...MONO, fontSize: 10, color: 'var(--text-muted)' }}>{label}</span>
        </div>
      )}
    </div>
  );
}

export default function EquipmentPanel() {
  const t = useT();
  const SIDE_SLOTS: { slot: ItemSlot; label: string; icon: GameIconName }[] = [
    { slot: 'helmet', label: t.equipment.slotHelmet, icon: 'slot_helmet' },
    { slot: 'armor',  label: t.equipment.slotArmor,  icon: 'slot_armor' },
    { slot: 'ring',   label: t.equipment.slotRing,   icon: 'slot_ring' },
    { slot: 'boots',  label: t.equipment.slotBoots,  icon: 'slot_boots' },
    { slot: 'amulet', label: t.equipment.slotAmulet, icon: 'slot_amulet' },
  ];
  const equipment   = useGameStore(s => s.hero.equipment);
  const unequipItem = useGameStore(s => s.unequipItem);
  const [selectedSlot, setSelectedSlot] = useState<ItemSlot | null>(null);
  const selectedItem = selectedSlot ? equipment[selectedSlot as keyof typeof equipment] : null;

  return (
    <div className="card p-3" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p style={{ ...ORB, fontSize: 10, color: '#ff2d78', textShadow: '0 0 8px rgba(255,45,120,0.5)' }}>
        {t.equipment.title}
      </p>

      {selectedItem && selectedSlot ? (
        <ItemDetailPanel
          item={selectedItem}
          onClose={() => setSelectedSlot(null)}
          onUnequip={() => { unequipItem(selectedSlot); setSelectedSlot(null); }}
        />
      ) : (
        <>
          {/* Weapon — full width, large */}
          <WeaponSlot
            item={equipment.weapon}
            onSelect={() => setSelectedSlot('weapon')}
          />

          {/* Other slots — 2-column grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {SIDE_SLOTS.map(({ slot, label, icon }) => (
              <SmallSlot
                key={slot}
                item={equipment[slot as keyof typeof equipment]}
                label={label}
                icon={icon}
                onSelect={() => setSelectedSlot(slot)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
