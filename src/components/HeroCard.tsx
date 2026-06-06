import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { MAX_DAILY_DUNGEONS, MAX_DAILY_QUESTS } from '../store/gameStore';
import { getHeroAttack, getHeroDefense, getEquipmentStats, getHeroMagicResistance, calcCritChance, calcDmgRange, getEnhanceAttackBonus, getEnhanceDefenseBonus, getEnhanceStatBonus } from '../utils/combat';
import { portraitSrc } from '../data/portraits';
import AppearanceEditor from './AppearanceEditor';
import { useT } from '../hooks/useT';
import { useAuthStore } from '../store/authStore';
import { collectBeggingServer } from '../lib/serverActions';
import { syncToCloud } from '../lib/cloudSync';
import ItemIcon from './ItemIcon';
import type { Item, ItemSlot } from '../types';
import { useLangStore } from '../store/langStore';
import { getItemName } from '../data/itemGenerator';
import { MONO, ORB } from '../utils/styles';

function StatBox({ icon, value, label, color }: {
  icon: string; value: number | string; label: string; color: string; glow?: string;
}) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(0,0,0,0.6), rgba(0,0,0,0.3))',
      border: `1px solid ${color}44`,
      padding: '6px 4px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      flex: 1,
      boxShadow: `inset 0 0 8px rgba(0,0,0,0.4)`,
    }}>
      <span style={{ fontSize: 10, marginBottom: 2 }}>{icon}</span>
      <span style={{ ...ORB, fontSize: 14, color, textShadow: `0 0 10px ${color}` }}>{value}</span>
      <span style={{ ...MONO, fontSize: 10, color: `${color}99`, marginTop: 1 }}>{label}</span>
    </div>
  );
}

function NeonBar({ pct, color, height = 10 }: { pct: number; color: string; glow?: string; height?: number }) {
  return (
    <div style={{
      height, background: 'rgba(0,0,0,0.5)',
      border: `1px solid ${color}22`, overflow: 'hidden', position: 'relative',
    }}>
      <div style={{
        width: `${Math.min(100, pct)}%`, height: '100%',
        background: `linear-gradient(90deg, rgba(0,0,0,0.2), ${color})`,
        boxShadow: `0 0 8px ${color}`,
        transition: 'width 0.6s ease',
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'rgba(255,255,255,0.2)' }} />
      </div>
    </div>
  );
}

const RARITY_COLOR: Record<string, string> = {
  common: '#94a3b8', uncommon: '#4ade80', rare: '#60a5fa', epic: '#c084fc', legendary: '#f59e0b',
};
const SLOT_ICON: Record<string, string> = {
  weapon: '⚔', armor: '🦺', helmet: '⛑', boots: '👟', ring: '💉', amulet: '📿',
};

function EquipSlot({ item, slot, label, size = 50, selected, onClick }: {
  item?: Item; slot: string; label: string; size?: number; selected?: boolean; onClick?: () => void;
}) {
  const color = item ? (item.color ?? RARITY_COLOR[item.rarity] ?? '#888') : 'rgba(100,116,139,0.3)';
  return (
    <div
      onClick={item ? onClick : undefined}
      role={item ? 'button' : undefined}
      tabIndex={item ? 0 : undefined}
      onKeyDown={item ? (e) => { if (e.key === 'Enter' || e.key === ' ') e.currentTarget.click(); } : undefined}
      style={{
        width: size, height: size, flexShrink: 0,
        background: selected ? `${color}22` : item ? `${color}10` : 'rgba(0,0,0,0.35)',
        border: `1px solid ${selected ? color + 'bb' : item ? color + '55' : 'rgba(100,116,139,0.2)'}`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 1, cursor: item ? 'pointer' : 'default',
        boxShadow: selected ? `0 0 14px ${color}44` : item ? `0 0 8px ${color}22` : 'none',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        position: 'relative',
      }}
    >
      {item
        ? <>
            <ItemIcon item={item} size={size - 16} />
            {(item.enhanceLevel ?? 0) > 0 && (
              <span style={{
                position: 'absolute', bottom: 0, right: 0,
                ...ORB, fontSize: 8, color: '#ffd700',
                background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,215,0,0.5)',
                padding: '0 3px', lineHeight: '14px',
                pointerEvents: 'none',
              }}>+{item.enhanceLevel}</span>
            )}
          </>
        : <span style={{ fontSize: size * 0.34, opacity: 0.18 }}>{SLOT_ICON[slot] ?? '?'}</span>
      }
      <span style={{
        ...MONO, fontSize: 10, color: item ? color : 'rgba(100,116,139,0.35)',
        whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: size - 4, textAlign: 'center',
      }}>
        {label}
      </span>
    </div>
  );
}

function ItemDetailPanel({ item, onClose, onUnequip }: { item: Item; onClose: () => void; onUnequip: () => void }) {
  const t    = useT();
  const lang = useLangStore(s => s.lang);
  const rc   = item.color ?? RARITY_COLOR[item.rarity] ?? '#888';
  const rarityLabel: Record<string, string> = {
    common: t.equipment.rarityCommon, uncommon: t.equipment.rarityUncommon,
    rare: t.equipment.rarityRare, epic: t.equipment.rarityEpic, legendary: t.equipment.rarityLegendary,
  };
  const statNames: Record<string, string> = {
    strength: t.equipment.statStrength, dexterity: t.equipment.statDexterity,
    intelligence: t.equipment.statIntelligence, vitality: t.equipment.statVitality,
    magic: t.equipment.statMagic, magicResistance: t.equipment.statMagRes,
  };
  const statEntries = Object.entries(item.stats).filter(([, v]) => (v as number) > 0);
  return (
    <div style={{
      background: `linear-gradient(135deg, rgba(10,10,20,0.98), rgba(5,5,15,0.99))`,
      border: `1px solid ${rc}55`, padding: '10px 12px',
      boxShadow: `0 0 20px ${rc}18`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={{
          background: 'rgba(0,0,0,0.6)', border: `1px solid ${rc}44`, padding: 6, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ItemIcon item={item} size={48} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <p style={{ ...ORB, fontSize: 10, color: rc, textShadow: `0 0 8px ${rc}` }}>{getItemName(item, lang)}</p>
            {(item.enhanceLevel ?? 0) > 0 && (
              <span style={{ ...ORB, fontSize: 11, color: '#ffd700', background: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.4)', padding: '1px 6px', flexShrink: 0 }}>
                +{item.enhanceLevel}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <span style={{ ...MONO, fontSize: 10, color: rc, background: `${rc}18`, border: `1px solid ${rc}33`, padding: '1px 5px' }}>
              {rarityLabel[item.rarity]}
            </span>
            {item.slot === 'weapon' && !item.ranged && !item.magicDamage && (
              <span style={{ ...MONO, fontSize: 10, color: '#ff9632', background: 'rgba(255,150,50,0.08)', border: '1px solid rgba(255,150,50,0.3)', padding: '1px 4px' }}>
                ⚔ WRĘCZ
              </span>
            )}
            {item.ranged && (
              <span style={{ ...MONO, fontSize: 10, color: '#00f5ff', background: 'rgba(0,245,255,0.08)', border: '1px solid rgba(0,245,255,0.3)', padding: '1px 4px' }}>
                🔫 <span aria-hidden="true">DYST</span><span className="sr-only">Ranged</span>
              </span>
            )}
            {item.magicDamage && (
              <span style={{ ...MONO, fontSize: 10, color: '#c078f0', background: 'rgba(192,120,240,0.08)', border: '1px solid rgba(192,120,240,0.3)', padding: '1px 4px' }}>
                🔮 MAGICZNA
              </span>
            )}
          </div>
        </div>
        <button aria-label="Close" onClick={onClose} style={{ color: 'var(--text-dim)', fontSize: 14, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', flexShrink: 0 }}>✕</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
        {statEntries.map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ ...MONO, fontSize: 10, color: 'var(--text-main)' }}>{statNames[k] ?? k}</span>
            <span style={{ ...ORB, fontSize: 10, color: '#00ff88' }}>+{v as number}</span>
          </div>
        ))}
        {item.attackBonus ? (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ ...MONO, fontSize: 10, color: 'var(--text-main)' }}>{item.magicDamage ? (lang === 'en' ? '🔮 Magic Dmg.' : '🔮 Obrażenia mag.') : t.equipment.atk}</span>
            <span style={{ ...ORB, fontSize: 10, color: item.magicDamage ? '#c078f0' : '#ff2d78' }}>+{item.attackBonus}</span>
          </div>
        ) : null}
        {item.defenseBonus ? (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ ...MONO, fontSize: 10, color: 'var(--text-main)' }}>{t.equipment.def}</span>
            <span style={{ ...ORB, fontSize: 10, color: '#00f5ff' }}>+{item.defenseBonus}</span>
          </div>
        ) : null}
        {getEnhanceAttackBonus(item) > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ ...MONO, fontSize: 10, color: '#ffd700' }}>⚒ {lang === 'en' ? 'Enhance ATK' : 'Bonus kowal ATK'}</span>
            <span style={{ ...ORB, fontSize: 10, color: '#ffd700' }}>+{getEnhanceAttackBonus(item)}</span>
          </div>
        )}
        {getEnhanceDefenseBonus(item) > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ ...MONO, fontSize: 10, color: '#ffd700' }}>⚒ {lang === 'en' ? 'Enhance DEF' : 'Bonus kowal DEF'}</span>
            <span style={{ ...ORB, fontSize: 10, color: '#ffd700' }}>+{getEnhanceDefenseBonus(item)}</span>
          </div>
        )}
        {(() => {
          const sb = getEnhanceStatBonus(item);
          const enhStatEntries = (Object.entries(sb) as [string, number][]).filter(([, v]) => v > 0);
          if (!enhStatEntries.length) return null;
          const STAT_NAMES: Record<string, string> = { strength: lang === 'en' ? 'Strength' : 'Siła', dexterity: lang === 'en' ? 'Dexterity' : 'Zręczność', intelligence: lang === 'en' ? 'Accuracy' : 'Celność', vitality: lang === 'en' ? 'Vitality' : 'Żywotność', magic: 'Magic', magicResistance: lang === 'en' ? 'Mag. Res.' : 'Odp. Mag.' };
          return enhStatEntries.map(([stat, val]) => (
            <div key={stat} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ ...MONO, fontSize: 10, color: '#ffd700' }}>⚒ {STAT_NAMES[stat] ?? stat}</span>
              <span style={{ ...ORB, fontSize: 10, color: '#ffd700' }}>+{val}</span>
            </div>
          ));
        })()}
        {statEntries.length === 0 && !item.attackBonus && !item.defenseBonus && getEnhanceAttackBonus(item) === 0 && getEnhanceDefenseBonus(item) === 0 && Object.values(getEnhanceStatBonus(item)).every(v => !v) && (
          <p style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)' }}>{lang === 'en' ? 'No bonuses' : 'Brak bonusów'}</p>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)' }}>{lang === 'en' ? 'Min. lvl.' : 'Min. poz.'} {item.level}</span>
        <span style={{ ...ORB, fontSize: 10, color: '#ffd700' }}>{item.goldValue}🪙</span>
      </div>

      <button onClick={onUnequip} className="btn btn-secondary" style={{ width: '100%', fontSize: 10, padding: '6px' }}>
        {t.equipment.unequip}
      </button>
    </div>
  );
}

function RestTimer({ endsAt, restHp, startAt, cancelRest, gemSpeedupRest, gems }: {
  endsAt: number; restHp: number; startAt: number;
  cancelRest: () => void;
  gemSpeedupRest: () => boolean;
  gems: number;
}) {
  const t = useT();
  const [remaining, setRemaining] = useState(Math.max(0, endsAt - Date.now()));
  useEffect(() => {
    const id = setInterval(() => {
      const r = Math.max(0, endsAt - Date.now());
      setRemaining(r);
      if (r === 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  const totalDuration = Math.max(1, endsAt - startAt);
  const elapsed = totalDuration - remaining;
  const earnedNow = Math.floor(restHp * Math.min(elapsed, totalDuration) / totalDuration);
  const progressPct = Math.min(100, (elapsed / totalDuration) * 100);
  const skipCost = Math.ceil(remaining / (15 * 60 * 1000)) * 5;
  const canSkip = gems >= skipCost && remaining > 0;

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(0,245,255,0.04), rgba(0,0,0,0.8))',
      border: '1px solid rgba(0,245,255,0.25)',
      padding: '10px 12px',
      boxShadow: '0 0 16px rgba(0,245,255,0.08)',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 20, filter: 'drop-shadow(0 0 6px #ff6600)' }}>🔥</span>
        <div style={{ flex: 1 }}>
          <p style={{ ...ORB, fontSize: 10, color: '#00f5ff', textShadow: '0 0 10px #00f5ff', marginBottom: 3 }}>
            {t.hero.restingActive(`${mins}:${secs.toString().padStart(2, '0')}`)}
          </p>
          <p style={{ ...MONO, fontSize: 11, color: '#00ff88' }}>
            {t.hero.restingRecover(earnedNow, restHp)}
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
          <button onClick={cancelRest} className="btn btn-secondary" style={{ fontSize: 10, padding: '4px 8px' }}>
            {t.hero.restStop}
          </button>
          <button
            onClick={gemSpeedupRest}
            disabled={!canSkip}
            style={{
              ...MONO, fontSize: 10, padding: '4px 8px',
              background: canSkip ? 'rgba(0,229,255,0.12)' : 'rgba(0,0,0,0.3)',
              border: `1px solid ${canSkip ? 'rgba(0,229,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
              color: canSkip ? '#00e5ff' : 'var(--text-dim)',
              cursor: canSkip ? 'pointer' : 'not-allowed',
            }}
          >
            {t.gems.speedupRestBtn(skipCost)}
          </button>
        </div>
      </div>
      <NeonBar pct={progressPct} color="#00f5ff" height={6} />
    </div>
  );
}

function RestSlider({ hero, onRest, inCombat, blocked, blockedReason }: {
  hero: { hp: number; maxHp: number };
  onRest: (minutes: number) => void;
  inCombat: boolean;
  blocked?: boolean;
  blockedReason?: string;
}) {
  const t = useT();
  const hpPerMin   = Math.max(1, Math.round(hero.maxHp * 0.04));
  const missing    = hero.maxHp - hero.hp;
  const maxMinutes = Math.ceil(missing / hpPerMin);
  const [minutes, setMinutes] = useState(Math.min(10, maxMinutes));

  if (blocked && blockedReason) return (
    <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,245,255,0.1)', padding: '8px 12px', textAlign: 'center' }}>
      <p style={{ ...MONO, fontSize: 11, color: 'var(--text-dim)' }}>{t.hero.restBlocked(blockedReason)}</p>
    </div>
  );

  if (missing <= 0) return (
    <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,245,255,0.1)', padding: '8px 12px', textAlign: 'center' }}>
      <p style={{ ...MONO, fontSize: 11, color: 'var(--text-dim)' }}>{t.hero.restFull}</p>
    </div>
  );

  const clamped    = Math.min(Math.max(1, minutes), maxMinutes);
  const healPreview = Math.min(clamped * hpPerMin, missing);

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(0,245,255,0.03), rgba(0,0,0,0.7))',
      border: '1px solid rgba(0,245,255,0.15)',
      padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ ...ORB, fontSize: 10, color: 'var(--text-dim)' }}>{t.hero.restTitle}</p>
        <p style={{ ...ORB, fontSize: 10, color: '#00ff88', textShadow: '0 0 8px #00ff88' }}>{t.hero.restPreview(healPreview, clamped)}</p>
      </div>
      <input type="range" min={1} max={maxMinutes} value={clamped}
        onChange={e => setMinutes(Number(e.target.value))} disabled={inCombat} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)' }}>{t.hero.restRate(hpPerMin)}</span>
        <span style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)' }}>{t.hero.restMax(maxMinutes)}</span>
      </div>
      <button onClick={() => onRest(clamped)} disabled={inCombat} className="btn btn-secondary" style={{ width: '100%', fontSize: 10, padding: '8px' }}>
        {t.hero.restStart}
      </button>
    </div>
  );
}

function BeggingTimer({ endsAt, reward, startAt, cancelBegging }: {
  endsAt: number; reward: number; startAt: number; cancelBegging: () => void;
}) {
  const t = useT();
  const [remaining, setRemaining] = useState(Math.max(0, endsAt - Date.now()));
  useEffect(() => {
    const id = setInterval(() => {
      const r = Math.max(0, endsAt - Date.now());
      setRemaining(r);
      if (r === 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  const timeStr = h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`;
  const totalDuration = Math.max(1, endsAt - startAt);
  const elapsed = totalDuration - remaining;
  const earnedNow = Math.floor(reward * Math.min(elapsed, totalDuration) / totalDuration);
  const progressPct = Math.min(100, (elapsed / totalDuration) * 100);

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(157,78,221,0.04), rgba(0,0,0,0.8))',
      border: '1px solid rgba(157,78,221,0.3)',
      padding: '10px 12px',
      boxShadow: '0 0 16px rgba(157,78,221,0.08)',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 20 }}>🙏</span>
        <div style={{ flex: 1 }}>
          <p style={{ ...ORB, fontSize: 10, color: '#9d4edd', textShadow: '0 0 10px #9d4edd', marginBottom: 3 }}>
            {t.hero.beggingActive(timeStr)}
          </p>
          <p style={{ ...MONO, fontSize: 11, color: '#ffd700' }}>{t.hero.beggingProgress(earnedNow, reward)}</p>
        </div>
        <button onClick={cancelBegging} className="btn btn-secondary" style={{ fontSize: 10, padding: '4px 8px', flexShrink: 0 }}>
          {t.hero.restStop}
        </button>
      </div>
      <NeonBar pct={progressPct} color="#9d4edd" height={6} />
    </div>
  );
}

function BeggingCollect({ reward, onCollect }: { reward: number; onCollect: () => void }) {
  const t = useT();
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(255,215,0,0.06), rgba(0,0,0,0.8))',
      border: '1px solid rgba(255,215,0,0.3)',
      padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8,
      boxShadow: '0 0 16px rgba(255,215,0,0.1)',
    }}>
      <p style={{ ...ORB, fontSize: 10, color: '#ffd700', textShadow: '0 0 10px #ffd700' }}>
        {t.hero.beggingDoneMsg(reward)}
      </p>
      <button onClick={onCollect} className="btn btn-primary" style={{ width: '100%', fontSize: 10, padding: '8px' }}>
        {t.hero.beggingPickup}
      </button>
    </div>
  );
}

function BeggingSlider({ onBeg, inCombat, blocked, blockedReason }: {
  onBeg: (hours: number) => void;
  inCombat: boolean;
  blocked?: boolean;
  blockedReason?: string;
}) {
  const t = useT();
  const level = useGameStore(s => s.hero.level);
  const [hours, setHours] = useState(2);
  const goldPerHour = Math.floor(97 * Math.pow(1.09, level - 1));
  const goldTotal = goldPerHour * hours;
  if (blocked && blockedReason) return (
    <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(157,78,221,0.15)', padding: '8px 12px', textAlign: 'center' }}>
      <p style={{ ...MONO, fontSize: 11, color: 'var(--text-dim)' }}>{t.hero.beggingActive(blockedReason)}</p>
    </div>
  );
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(157,78,221,0.03), rgba(0,0,0,0.7))',
      border: '1px solid rgba(157,78,221,0.15)',
      padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ ...ORB, fontSize: 10, color: 'var(--text-dim)' }}>{t.hero.beggingTitle}</p>
        <p style={{ ...ORB, fontSize: 10, color: '#9d4edd', textShadow: '0 0 8px #9d4edd' }}>{t.hero.beggingHours(hours)}</p>
      </div>
      <input type="range" min={1} max={10} value={hours}
        onChange={e => setHours(Number(e.target.value))} disabled={inCombat} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)' }}>{t.hero.beggingMin}</span>
        <span style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)' }}>{t.hero.beggingMax}</span>
      </div>
      <p style={{ ...MONO, fontSize: 10, color: '#ffd700', textAlign: 'center' }}>
        ~{goldPerHour}🪙/h · ~{goldTotal}🪙
      </p>
      <button onClick={() => onBeg(hours)} disabled={inCombat} className="btn btn-secondary" style={{
        width: '100%', fontSize: 10, padding: '8px',
        borderColor: 'rgba(157,78,221,0.4)', color: '#9d4edd', textShadow: '0 0 6px #9d4edd',
      }}>
        {t.hero.beggingStartBtn}
      </button>
    </div>
  );
}

export default function HeroCard() {
  const t              = useT();
  const lang           = useLangStore(s => s.lang);
  const hero           = useGameStore(s => s.hero);
  const upgradeAttribute = useGameStore(s => s.upgradeAttribute);
  const restHero       = useGameStore(s => s.restHero);
  const cancelRest     = useGameStore(s => s.cancelRest);
  const gemSpeedupRest = useGameStore(s => s.gemSpeedupRest);
  const startBegging   = useGameStore(s => s.startBegging);
  const cancelBegging  = useGameStore(s => s.cancelBegging);
  const collectBegging = useGameStore(s => s.collectBegging);
  const user = useAuthStore(s => s.user);
  const inCombat       = useGameStore(s => s.inCombat);

  async function handleCollectBegging() {
    collectBegging();
    if (user) collectBeggingServer().catch(() => {});
  }
  const activeQuest    = useGameStore(s => s.activeQuest);
  const currentDungeon = useGameStore(s => s.currentDungeon);
  const unequipItem    = useGameStore(s => s.unequipItem);
  const [, forceUpdate] = useState(0);
  const [editingAppearance, setEditingAppearance] = useState(false);
  type EquipSlotKey = 'weapon' | 'armor' | 'helmet' | 'boots' | 'ring' | 'amulet';
  const [selectedSlot, setSelectedSlot] = useState<EquipSlotKey | null>(null);

  function toggleSlot(slot: EquipSlotKey) {
    setSelectedSlot(prev => prev === slot ? null : slot);
  }

  useEffect(() => {
    const id = setInterval(() => forceUpdate(n => n + 1), 5000);
    return () => clearInterval(id);
  }, []);

  const isResting   = hero.voluntaryRestUntil !== null && Date.now() < hero.voluntaryRestUntil;
  const earnedRestHp = isResting && hero.voluntaryRestStartAt && hero.voluntaryRestHp && hero.voluntaryRestUntil
    ? Math.floor(hero.voluntaryRestHp * Math.min(Date.now() - hero.voluntaryRestStartAt, hero.voluntaryRestUntil - hero.voluntaryRestStartAt) / Math.max(1, hero.voluntaryRestUntil - hero.voluntaryRestStartAt))
    : 0;
  const isBegging   = hero.beggingUntil !== null && Date.now() < hero.beggingUntil;
  const beggingDone = hero.beggingUntil !== null && Date.now() >= hero.beggingUntil;
  const hasQuest    = activeQuest !== null;
  const inDungeon   = currentDungeon !== null || inCombat;

  const restBlockReason    = isBegging ? (lang === 'en' ? 'character is scavenging' : 'postać zbiera złom') : inDungeon ? (lang === 'en' ? 'character is in a dungeon' : 'postać jest w lochu') : undefined;
  const beggingBlockReason = isResting ? (lang === 'en' ? 'character is resting' : 'postać odpoczywa') : hasQuest ? (lang === 'en' ? 'character is on a quest' : 'postać wykonuje zadanie') : inDungeon ? (lang === 'en' ? 'character is in a dungeon' : 'postać jest w lochu') : undefined;

  const displayHp  = hero.hp + earnedRestHp;
  const hpPct      = (displayHp / hero.maxHp) * 100;
  const attack     = getHeroAttack(hero);
  const defense    = getHeroDefense(hero);
  const magicRes   = getHeroMagicResistance(hero);
  const eqStats    = getEquipmentStats(hero.equipment);
  const dmgRange   = calcDmgRange(attack);
  const critChance = calcCritChance(hero.stats.dexterity + eqStats.dexterity, hero.level);
  const critPct    = Math.round(critChance * 100);
  const dungeonPct = (hero.dungeonRunsToday / MAX_DAILY_DUNGEONS) * 100;
  const questPct   = (hero.questsCompletedToday / MAX_DAILY_QUESTS) * 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

      {/* HERO PANEL */}
      <div className="card p-3" style={{
        display: 'flex', flexDirection: 'column', gap: 10,
        backgroundColor: 'rgba(4,6,20,0.95)',
        position: 'relative',
        overflow: 'hidden',
        zIndex: 9997,
      }}>
        {/* Background image — fixed square ratio, always same crop */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          aspectRatio: '1 / 1',
          backgroundImage: 'url(/hero-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 0,
        }} />
        {/* content sits above the photo */}
        <div style={{
          position: 'relative', display: 'flex', flexDirection: 'column', gap: 10,
          background: 'rgba(4, 6, 20, 0.52)',
          borderRadius: 4,
          padding: 8,
          margin: -4,
        }}>

        {/* Name + level + gold */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <p style={{ ...ORB, fontSize: 14, color: '#ffffff', textShadow: '0 0 12px rgba(255,255,255,0.25)', flex: 1, wordBreak: 'break-all' }}>
            {hero.name}
          </p>
          <p style={{ ...MONO, fontSize: 11, color: 'var(--text-dim)' }}>{t.app.level(hero.level)}</p>
          <div style={{
            background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.2)',
            padding: '3px 7px', display: 'inline-flex', alignItems: 'center', gap: 4,
          }}>
            <span style={{ fontSize: 12 }}>🪙</span>
            <span style={{ ...ORB, fontSize: 11, color: '#ffd700', textShadow: '0 0 10px rgba(255,215,0,0.6)' }}>{hero.gold}</span>
          </div>
        </div>

        {/* ── Paper doll ── */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'stretch', justifyContent: 'center' }}>

          {/* Left: armor + ring */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', gap: 4 }}>
            <EquipSlot item={hero.equipment.armor}  slot="armor"  label={t.inventory.slotArmor}  selected={selectedSlot === 'armor'}  onClick={() => toggleSlot('armor')} />
            <EquipSlot item={hero.equipment.ring}   slot="ring"   label={t.inventory.slotRing}   selected={selectedSlot === 'ring'}   onClick={() => toggleSlot('ring')} />
          </div>

          {/* Center: helmet → portrait → weapon */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
            <EquipSlot item={hero.equipment.helmet} slot="helmet" label={t.inventory.slotHelmet} selected={selectedSlot === 'helmet'} onClick={() => toggleSlot('helmet')} />
            <div style={{
              width: 96, height: 96, overflow: 'hidden', flexShrink: 0,
              boxShadow: 'inset 0 0 12px rgba(0,0,0,0.5)',
            }}>
              <img src={portraitSrc(hero.portrait)} alt={hero.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
            <EquipSlot item={hero.equipment.weapon} slot="weapon" label={t.inventory.slotWeapon} size={96} selected={selectedSlot === 'weapon'} onClick={() => toggleSlot('weapon')} />
          </div>

          {/* Right: amulet + boots */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', gap: 4 }}>
            <EquipSlot item={hero.equipment.amulet} slot="amulet" label={t.inventory.slotAmulet} selected={selectedSlot === 'amulet'} onClick={() => toggleSlot('amulet')} />
            <EquipSlot item={hero.equipment.boots}  slot="boots"  label={t.inventory.slotBoots}  selected={selectedSlot === 'boots'}  onClick={() => toggleSlot('boots')} />
          </div>

        </div>

        {/* Appearance button */}
        <button onClick={() => setEditingAppearance(true)} aria-label={t.hero.appearance} style={{
          background: 'rgba(255,45,120,0.05)', border: '1px solid rgba(255,45,120,0.2)',
          color: 'rgba(255,45,120,0.7)', cursor: 'pointer', width: '100%',
          padding: '5px 0', ...MONO, fontSize: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
        }}>
          ✏ {t.hero.appearance}
        </button>

        {/* Selected item detail */}
        {selectedSlot && hero.equipment[selectedSlot] && (
          <ItemDetailPanel
            item={hero.equipment[selectedSlot]!}
            onClose={() => setSelectedSlot(null)}
            onUnequip={() => { unequipItem(selectedSlot as ItemSlot); setSelectedSlot(null); const u = useAuthStore.getState().user; if (u) syncToCloud(u.uid, u.username).catch(() => {}); }}
          />
        )}

        {/* Main stats */}
        <div style={{ display: 'flex', gap: 4 }}>
          <StatBox icon="⚔" value={attack} label={t.hero.attack} color="#ff2d78" />
          <StatBox icon="🛡" value={defense}   label={t.hero.defense}  color="#00f5ff" />
          <StatBox icon="♥" value={hero.maxHp} label={t.hero.maxHp} color="#ff4444" />
          <StatBox icon="✨" value={magicRes}  label={t.hero.magRes} color="#9d4edd" />
        </div>

        {/* DMG range */}
        <div style={{
          background: 'rgba(0,0,0,0.35)',
          border: '1px solid rgba(255,45,120,0.15)',
          borderRadius: 3,
          padding: '5px 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 6,
        }}>
          <span style={{ ...MONO, fontSize: 10, color: '#475569' }}>
            {lang === 'en' ? 'DMG RANGE' : 'ZAKRES DMG'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ ...ORB, fontSize: 11, color: '#ff2d78' }}>
              {dmgRange.min}–{dmgRange.max}
            </span>
            <span style={{ ...MONO, fontSize: 10, color: '#475569' }}>·</span>
            <span style={{ ...MONO, fontSize: 10, color: '#f59e0b' }}>
              💥 {lang === 'en' ? 'CRIT' : 'KRYT'} {critPct}%
            </span>
            <span style={{ ...ORB, fontSize: 11, color: '#f59e0b' }}>
              {dmgRange.critMin}–{dmgRange.critMax}
            </span>
          </div>
        </div>

        {/* HP bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
            <span style={{ ...MONO, fontSize: 10, color: '#ff4444' }}>{t.hero.vitality}</span>
            <span style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)' }}>{displayHp}/{hero.maxHp}</span>
          </div>
          <NeonBar pct={hpPct} color="#ff2d78" />
        </div>

        {/* XP bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ ...MONO, fontSize: 10, color: '#ffd700' }}>{t.hero.experience}</span>
            <span style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)' }}>{hero.xp}/{hero.xpToNext}</span>
          </div>
          <NeonBar pct={(hero.xp / hero.xpToNext) * 100} color="#ffd700" />
        </div>

        </div>{/* end content wrapper */}
      </div>

      {editingAppearance && <AppearanceEditor onClose={() => setEditingAppearance(false)} />}

      {/* REST */}
      {isResting
        ? <RestTimer endsAt={hero.voluntaryRestUntil!} restHp={hero.voluntaryRestHp ?? 0} startAt={hero.voluntaryRestStartAt ?? hero.voluntaryRestUntil!} cancelRest={cancelRest} gemSpeedupRest={() => { const ok = gemSpeedupRest(); if (ok && user) syncToCloud(user.uid, user.username).catch(() => {}); return ok; }} gems={hero.gems} />
        : <RestSlider hero={hero} onRest={restHero} inCombat={inCombat} blocked={!!restBlockReason} blockedReason={restBlockReason} />
      }

      {/* BEGGING */}
      {isBegging
        ? <BeggingTimer endsAt={hero.beggingUntil!} reward={hero.beggingReward ?? 0} startAt={hero.beggingStartAt ?? hero.beggingUntil!} cancelBegging={cancelBegging} />
        : beggingDone
          ? <BeggingCollect reward={hero.beggingReward ?? 0} onCollect={handleCollectBegging} />
          : <BeggingSlider onBeg={startBegging} inCombat={inCombat} blocked={!!beggingBlockReason} blockedReason={beggingBlockReason} />
      }

      {/* DZIENNY LIMIT */}
      <div className="card p-3" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p style={{ ...ORB, fontSize: 10, color: '#ff2d78', textShadow: '0 0 8px rgba(255,45,120,0.5)', marginBottom: 2 }}>{t.hero.dailyLimit}</p>
        {[
          { label: t.hero.dungeons, cur: hero.dungeonRunsToday,     max: MAX_DAILY_DUNGEONS, pct: dungeonPct, color: hero.dungeonRunsToday >= MAX_DAILY_DUNGEONS ? '#ff4444' : '#ff2d78' },
          { label: t.hero.quests,   cur: hero.questsCompletedToday, max: MAX_DAILY_QUESTS,   pct: questPct,   color: hero.questsCompletedToday >= MAX_DAILY_QUESTS ? '#ff4444' : '#00f5ff' },
        ].map(({ label, cur, max, pct, color }) => (
          <div key={label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ ...MONO, fontSize: 11, color: 'var(--text-main)' }}>{label}</span>
              <span style={{ ...ORB, fontSize: 10, color, textShadow: `0 0 6px ${color}` }}>{cur}/{max}</span>
            </div>
            <NeonBar pct={pct} color={color} height={8} />
          </div>
        ))}
      </div>

      {/* STATYSTYKI */}
      <div className="card p-3" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p style={{ ...ORB, fontSize: 10, color: '#9d4edd', textShadow: '0 0 8px rgba(157,78,221,0.5)', marginBottom: 2 }}>{t.hero.statsTitle}</p>
        {([
          { attr: 'vitality',       icon: '♥',  name: t.hero.statVitality,   desc: t.hero.statVitDesc,    note: t.hero.statVitNote,    color: '#ff4444' },
          { attr: 'strength',       icon: '💪', name: t.hero.statStrength,   desc: t.hero.statStrDesc,    note: t.hero.statStrNote,    color: '#ff2d78' },
          { attr: 'dexterity',      icon: '🏃', name: t.hero.statDexterity,  desc: t.hero.statDexDesc,    note: t.hero.statDexNote,    color: '#00f5ff' },
          { attr: 'intelligence',   icon: '🎯', name: t.hero.statAccuracy,   desc: t.hero.statAccDesc,    note: t.hero.statAccNote,    color: '#9d4edd' },
          { attr: 'magic',          icon: '🔮', name: t.hero.statMagic,      desc: t.hero.statMagDesc,    note: t.hero.statMagNote,    color: '#cc44ff' },
          { attr: 'magicResistance',icon: '✨', name: t.hero.statMagRes,     desc: t.hero.statMagResDesc, note: t.hero.statMagResNote, color: '#00ff88' },
        ] as { attr: 'strength'|'dexterity'|'intelligence'|'vitality'|'magic'|'magicResistance'; icon: string; name: string; desc: string; note: string; color: string }[]).map(({ attr, icon, name, desc, note, color }) => {
          const base = hero.stats[attr];
          const eq   = eqStats[attr];
          const cost = Math.round(base * 75);
          const canAfford = hero.gold >= cost;
          return (
            <div key={attr} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 12 }}>{icon}</span>
                  <span style={{ ...MONO, fontSize: 11, color }}>{name}</span>
                  {attr === 'vitality' && (
                    <span style={{ ...ORB, fontSize: 10, color: '#ff4444', opacity: 0.85, marginLeft: 4 }}>
                      ❤ {hero.maxHp} HP
                    </span>
                  )}
                  {attr === 'dexterity' && (
                    <span style={{ ...ORB, fontSize: 10, color: '#00f5ff', opacity: 0.85, marginLeft: 4 }}>
                      💥 {critPct}%
                    </span>
                  )}
                </div>
                <p style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', marginTop: 1 }}>{desc}</p>
                <p style={{ ...MONO, fontSize: 10, color, opacity: 0.6, marginTop: 1 }}>{note}</p>
              </div>
              <span style={{ ...ORB, fontSize: 13, color, textShadow: `0 0 8px ${color}`, minWidth: 28, textAlign: 'right' }}>{base + eq}</span>
              {eq > 0 && <span style={{ ...MONO, fontSize: 10, color: '#00ff88', minWidth: 26 }}>+{eq}♦</span>}
              <button
                onClick={() => upgradeAttribute(attr)}
                disabled={!canAfford}
                className="btn btn-primary"
                style={{ fontSize: 10, padding: '4px 6px', opacity: canAfford ? 1 : 0.3, minWidth: 52 }}
              >
                🪙{cost}
              </button>
            </div>
          );
        })}
        <p style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>{t.hero.eqBonus}</p>
      </div>

      {/* Discord */}
      <a
        href="https://discord.gg/8vCk7jxna"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          background: 'rgba(88,101,242,0.1)',
          border: '1px solid rgba(88,101,242,0.4)',
          color: '#7289da',
          fontFamily: "'Orbitron', monospace",
          fontWeight: 700,
          fontSize: 10,
          padding: '10px 16px',
          textDecoration: 'none',
          cursor: 'pointer',
          boxShadow: '0 0 12px rgba(88,101,242,0.15)',
          letterSpacing: '0.05em',
        }}
      >
        <svg width="18" height="14" viewBox="0 0 24 18" fill="#7289da" xmlns="http://www.w3.org/2000/svg">
          <path d="M20.317 1.492a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 1.492a.07.07 0 0 0-.032.027C.533 6.168-.32 10.702.099 15.179c.002.025.016.049.035.064a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.1.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 12.278c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
        </svg>
        DISCORD
      </a>

    </div>
  );
}
