import type { Item, Stats } from '../types';
import { useT } from '../hooks/useT';
import { useLangStore } from '../store/langStore';
import { MONO, ORB, PX } from '../utils/styles';

const RARITY_COLORS: Record<string, string> = {
  common: '#94a3b8', uncommon: '#4ade80', rare: '#60a5fa',
  epic: '#c084fc', legendary: '#f59e0b',
};

function StatDeltaRow({ label, oldVal, newVal }: { label: string; oldVal: number; newVal: number }) {
  const delta = newVal - oldVal;
  if (oldVal === 0 && newVal === 0) return null;
  const color = delta > 0 ? '#4ade80' : delta < 0 ? '#f87171' : '#94a3b8';
  const arrow = delta > 0 ? '▲' : delta < 0 ? '▼' : '';
  return (
    <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ ...MONO, fontSize: 10, color: '#64748b', flex: 1, paddingLeft: 8, paddingTop: 3, paddingBottom: 3 }}>{label}</span>
      <span style={{ ...ORB, fontSize: 10, color: '#94a3b8', width: 32, textAlign: 'right', paddingRight: 6 }}>{oldVal || '—'}</span>
      <span style={{ ...ORB, fontSize: 10, color, width: 48, textAlign: 'center' }}>
        {delta !== 0 ? `${delta > 0 ? '+' : ''}${delta} ${arrow}` : '='}
      </span>
      <span style={{ ...ORB, fontSize: 10, color, width: 32, textAlign: 'left', paddingLeft: 6 }}>{newVal || '—'}</span>
    </div>
  );
}

export function ComparePanel({ newItem, equipped }: { newItem: Item; equipped: Item | undefined }) {
  const t    = useT();
  const lang = useLangStore(s => s.lang);

  const STAT_LABELS: Record<string, string> = {
    strength: t.shop.statStrength, dexterity: t.shop.statDexterity,
    intelligence: t.shop.statIntelligence, vitality: t.shop.statVitality,
    magic: t.shop.statMagic, magicResistance: t.shop.statMagRes,
  };

  const RARITY_LABEL: Record<string, string> = {
    common: t.equipment.rarityCommon, uncommon: t.equipment.rarityUncommon,
    rare: t.equipment.rarityRare, epic: t.equipment.rarityEpic, legendary: t.equipment.rarityLegendary,
  };

  const newColor = newItem.color ?? RARITY_COLORS[newItem.rarity];
  const eqColor  = equipped ? (equipped.color ?? RARITY_COLORS[equipped.rarity]) : '#475569';
  const lvl = lang === 'en' ? 'LVL.' : 'Poz.';

  const newAtk = newItem.attackBonus  ?? 0;
  const eqAtk  = equipped?.attackBonus  ?? 0;
  const newDef = newItem.defenseBonus ?? 0;
  const eqDef  = equipped?.defenseBonus ?? 0;

  const allStats = Array.from(new Set([
    ...Object.keys(newItem.stats),
    ...(equipped ? Object.keys(equipped.stats) : []),
  ])) as (keyof Stats)[];

  return (
    <div style={{ background: 'rgba(2,6,18,0.97)', border: '1px solid rgba(255,255,255,0.1)', marginTop: 4 }}>
      {/* Header */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ flex: 1, padding: '7px 8px', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ ...PX(4), color: '#475569', marginBottom: 3 }}>{t.shop.compareEquipped}</p>
          {equipped ? (
            <>
              <p style={{ ...MONO, fontSize: 10, color: eqColor, marginBottom: 1 }}>{equipped.name}</p>
              <p style={{ ...MONO, fontSize: 10, color: '#475569' }}>{lvl} {equipped.level} · {RARITY_LABEL[equipped.rarity]}</p>
            </>
          ) : (
            <p style={{ ...MONO, fontSize: 10, color: '#334155' }}>{t.shop.compareNothingEquipped}</p>
          )}
        </div>
        <div style={{ flex: 1, padding: '7px 8px' }}>
          <p style={{ ...PX(4), color: '#475569', marginBottom: 3 }}>{t.shop.compareNew}</p>
          <p style={{ ...MONO, fontSize: 10, color: newColor, marginBottom: 1 }}>{newItem.name}</p>
          <p style={{ ...MONO, fontSize: 10, color: '#475569' }}>{lvl} {newItem.level} · {RARITY_LABEL[newItem.rarity]}</p>
        </div>
      </div>

      {/* Column labels */}
      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ ...PX(4), color: '#334155', flex: 1, paddingLeft: 8, paddingTop: 4, paddingBottom: 4 }}>{t.shop.compareStat}</span>
        <span style={{ ...PX(4), color: '#475569', width: 32, textAlign: 'right', paddingRight: 6, paddingTop: 4, paddingBottom: 4 }}>{t.shop.compareYours}</span>
        <span style={{ ...PX(4), color: '#475569', width: 48, textAlign: 'center', paddingTop: 4, paddingBottom: 4 }}>{t.shop.compareDelta}</span>
        <span style={{ ...PX(4), color: '#475569', width: 32, paddingLeft: 6, paddingTop: 4, paddingBottom: 4 }}>{t.shop.compareNew}</span>
      </div>

      {/* Stat rows */}
      {(newAtk > 0 || eqAtk > 0) && <StatDeltaRow label={t.shop.compareAtk} oldVal={eqAtk} newVal={newAtk} />}
      {(newDef > 0 || eqDef > 0) && <StatDeltaRow label={t.shop.compareDef} oldVal={eqDef} newVal={newDef} />}
      {allStats.map(k => (
        <StatDeltaRow
          key={k}
          label={STAT_LABELS[k] ?? k}
          oldVal={(equipped?.stats[k] ?? 0) as number}
          newVal={(newItem.stats[k] ?? 0) as number}
        />
      ))}
    </div>
  );
}
