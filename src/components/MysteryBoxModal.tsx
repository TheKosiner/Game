import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { openMysteryBox, SPIN_POOL, RARITY_ORDER } from '../data/mysteryBoxes';
import type { Item, Rarity } from '../types';
import { MONO, ORB } from '../utils/styles';

const RC: Record<Rarity, string> = {
  common: '#888899', uncommon: '#00cc66', rare: '#4488ff',
  epic: '#cc44ff', legendary: '#ffd700',
};

const RARITY_LABEL: Record<Rarity, string> = {
  common: 'ZWYKŁY', uncommon: 'ULEPSZ.', rare: 'RZADKI', epic: 'EPICKI', legendary: 'LEGENDA',
};

interface SpinEntry { name: string; emoji: string; rarity: Rarity }

function pickSpinItem(boxRarity: Rarity): SpinEntry {
  const boxIdx = RARITY_ORDER.indexOf(boxRarity);
  // Bias toward items at or below box rarity — higher box = more exciting spins
  const weights = SPIN_POOL.map(item => {
    const idx = RARITY_ORDER.indexOf(item.rarity);
    return idx <= boxIdx ? (idx + 1) * 2 : 1;
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < SPIN_POOL.length; i++) {
    r -= weights[i];
    if (r <= 0) return SPIN_POOL[i];
  }
  return SPIN_POOL[0];
}

export default function MysteryBoxModal() {
  const pending      = useGameStore(s => s.mysteryBoxPending);
  const collectReward = useGameStore(s => s.collectMysteryBoxReward);
  const dismiss      = useGameStore(s => s.dismissMysteryBox);
  const heroLevel    = useGameStore(s => s.hero.level);

  const [wonItem, setWonItem]       = useState<Item | null>(null);
  const [display, setDisplay]       = useState<SpinEntry>(SPIN_POOL[0]);
  const [phase, setPhase]           = useState<'spinning' | 'done'>('spinning');
  const [collected, setCollected]   = useState(false);
  const [fullInv, setFullInv]       = useState(false);
  const activeRef = useRef(false);

  useEffect(() => {
    if (!pending) { setCollected(false); setFullInv(false); return; }
    const item = openMysteryBox(pending.box, heroLevel);
    setWonItem(item);
    setPhase('spinning');
    setCollected(false);
    setFullInv(false);
    activeRef.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending?.box.id]);

  useEffect(() => {
    if (phase !== 'spinning' || !wonItem) return;
    activeRef.current = true;
    const start = Date.now();
    const DURATION = 5000;

    function tick() {
      if (!activeRef.current) return;
      const elapsed = Date.now() - start;
      if (elapsed >= DURATION) {
        setDisplay({ name: wonItem!.name, emoji: wonItem!.emoji, rarity: wonItem!.rarity });
        setPhase('done');
        return;
      }
      const t = elapsed / DURATION;
      const interval = Math.round(70 + t * t * 800);
      setDisplay(pickSpinItem(pending!.box.rarity));
      setTimeout(tick, interval);
    }
    tick();
    return () => { activeRef.current = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, wonItem]);

  function handleSkip() {
    if (!wonItem) return;
    activeRef.current = false;
    setDisplay({ name: wonItem.name, emoji: wonItem.emoji, rarity: wonItem.rarity });
    setPhase('done');
  }

  function handleCollect() {
    if (!pending || !wonItem) return;
    const ok = collectReward(pending.box, pending.invIdx, wonItem);
    if (!ok) { setFullInv(true); return; }
    setCollected(true);
    setTimeout(() => dismiss(), 1200);
  }

  if (!pending) return null;

  const rc = RC[display.rarity];
  const isDone = phase === 'done';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.88)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)',
    }}>
      {/* Header */}
      <p style={{ ...ORB, fontSize: 11, color: 'var(--gold-main)', marginBottom: 20, letterSpacing: 2 }}>
        {pending.box.emoji} {pending.box.name.toUpperCase()}
      </p>

      {/* Spinning card */}
      <div style={{
        width: 220, height: 220,
        background: `linear-gradient(135deg, rgba(0,0,0,0.9), ${rc}14)`,
        border: `2px solid ${rc}${isDone ? 'cc' : '55'}`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        boxShadow: isDone ? `0 0 40px ${rc}55, 0 0 80px ${rc}22` : `0 0 12px ${rc}20`,
        transition: 'border-color 0.3s, box-shadow 0.3s',
        position: 'relative',
        overflow: 'hidden',
        marginBottom: 20,
      }}>
        {/* Rarity stripes (top/bottom) */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: rc, opacity: 0.7 }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: rc, opacity: 0.7 }} />

        <span style={{
          fontSize: 72, lineHeight: 1, marginBottom: 10,
          transition: isDone ? 'none' : 'opacity 0.05s',
          filter: isDone ? `drop-shadow(0 0 12px ${rc})` : 'none',
        }}>
          {display.emoji}
        </span>
        <p style={{ ...MONO, fontSize: 11, color: rc, textAlign: 'center', padding: '0 10px', marginBottom: 6 }}>
          {display.name}
        </p>
        <span style={{
          ...ORB, fontSize: 9, padding: '2px 8px',
          background: `${rc}22`, border: `1px solid ${rc}55`, color: rc,
        }}>
          {RARITY_LABEL[display.rarity]}
        </span>
      </div>

      {/* Won item stats (shown after reveal) */}
      {isDone && wonItem && (
        <div style={{
          background: 'rgba(5,10,20,0.9)', border: `1px solid ${rc}44`,
          padding: '8px 14px', marginBottom: 16, minWidth: 200, textAlign: 'center',
        }}>
          {wonItem.attackBonus  ? <p style={{ ...MONO, fontSize: 10, color: '#86efac' }}>⚔ +{wonItem.attackBonus} Atak</p> : null}
          {wonItem.defenseBonus ? <p style={{ ...MONO, fontSize: 10, color: '#86efac' }}>🛡 +{wonItem.defenseBonus} Obrona</p> : null}
          {Object.entries(wonItem.stats).filter(([, v]) => v).map(([k, v]) => (
            <p key={k} style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)' }}>+{v} {k}</p>
          ))}
          <p style={{ ...MONO, fontSize: 10, color: '#ffd700', marginTop: 4 }}>🪙 {wonItem.goldValue} sprzedaż</p>
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 220 }}>
        {isDone ? (
          collected ? (
            <p style={{ ...ORB, fontSize: 10, color: '#4ade80', textAlign: 'center' }}>✓ Odebrano!</p>
          ) : fullInv ? (
            <p style={{ ...MONO, fontSize: 10, color: '#f87171', textAlign: 'center' }}>
              Plecak pełny! Zwolnij miejsce.
            </p>
          ) : (
            <button onClick={handleCollect} className="btn btn-primary" style={{ fontSize: 11 }}>
              🎁 ODBIERZ
            </button>
          )
        ) : (
          <button onClick={handleSkip} className="btn btn-secondary" style={{ fontSize: 10 }}>
            ⏭ Pomiń animację
          </button>
        )}
        <button onClick={dismiss} className="btn btn-secondary" style={{ fontSize: 9, opacity: 0.6 }}>
          ✕ Zamknij
        </button>
      </div>
    </div>
  );
}
