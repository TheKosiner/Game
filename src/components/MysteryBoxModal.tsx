import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useGameStore } from '../store/gameStore';
import { openMysteryBox, SPIN_POOL, RARITY_ORDER } from '../data/mysteryBoxes';
import ItemIcon from './ItemIcon';
import { useLangStore } from '../store/langStore';
import { getItemName } from '../data/itemGenerator';
import type { Item, Rarity } from '../types';
import { MONO, ORB } from '../utils/styles';
import GameIcon from './GameIcon';

const RC: Record<Rarity, string> = {
  common: '#888899', uncommon: '#00cc66', rare: '#4488ff',
  epic: '#cc44ff', legendary: '#ffd700',
};

const RARITY_LABEL: Record<Rarity, string> = {
  common: 'ZWYKŁY', uncommon: 'ULEPSZ.', rare: 'RZADKI', epic: 'EPICKI', legendary: 'LEGENDA',
};

function pickSpinItem(boxRarity: Rarity): Item {
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
  const addItem      = useGameStore(s => s.addToInventory);
  const lang         = useLangStore(s => s.lang);
  const dismiss      = useGameStore(s => s.dismissMysteryBox);

  const [wonItem, setWonItem]       = useState<Item | null>(null);
  const [display, setDisplay]       = useState<Item>(SPIN_POOL[0]);
  const [phase, setPhase]           = useState<'spinning' | 'done'>('spinning');
  const [fullInv, setFullInv]       = useState(false);
  const activeRef = useRef(false);

  useEffect(() => {
    if (!pending) { setFullInv(false); return; }
    const item = openMysteryBox(pending.box);
    setWonItem(item);
    setPhase('spinning');
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
        setDisplay(wonItem!);
        setPhase('done');
        const full = useGameStore.getState().hero.inventory.length >= 20;
        if (!full) addItem(wonItem!); else setFullInv(true);
        setTimeout(() => dismiss(), 2000);
        return;
      }
      const t = elapsed / DURATION;
      const interval = Math.round(70 + t * t * 800);
      setDisplay(t > 0.85 ? wonItem! : pickSpinItem(pending!.box.rarity));
      setTimeout(tick, interval);
    }
    tick();
    return () => { activeRef.current = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, wonItem]);

  function handleSkip() {
    if (!wonItem) return;
    activeRef.current = false;
    setDisplay(wonItem);
    setPhase('done');
    // Add item immediately so it's safe even if user closes tab during the brief show window.
    // Use addItem (not collectReward) so pending stays set and the modal remains visible
    // long enough to show the result before dismissing.
    const full = useGameStore.getState().hero.inventory.length >= 20;
    if (!full) addItem(wonItem); else setFullInv(true);
    setTimeout(() => dismiss(), 600);
  }

  const modalRoot = document.getElementById('modal-root') ?? document.body;

  // Always keep the portal fiber alive so React never removes/re-adds it during
  // concurrent-mode reconciliation — avoids removeChild errors on pending→null transitions.
  if (!pending) return createPortal(null, modalRoot);

  const rc = RC[display.rarity];
  const isDone = phase === 'done';

  // key={phase} forces a full DOM remount on spinning→done transition,
  // preventing removeChild reconciliation errors in React 18 concurrent mode
  // (the two phases have different numbers/types of children).
  return createPortal(
    <div key={phase} style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.88)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)',
    }}>
      {/* Header */}
      <p style={{ ...ORB, fontSize: 11, color: 'var(--gold-main)', marginBottom: 20, letterSpacing: 2 }}>
        <ItemIcon item={pending.box} scale={1.5} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 6 }} /> {getItemName(pending.box, lang).toUpperCase()}
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

        <div style={{
          marginBottom: 10,
          filter: isDone ? `drop-shadow(0 0 14px ${rc})` : 'none',
          transition: 'filter 0.3s',
        }}>
          <ItemIcon item={display} size={96} />
        </div>
        <p style={{ ...MONO, fontSize: 11, color: rc, textAlign: 'center', padding: '0 10px', marginBottom: 6 }}>
          {getItemName(display, lang)}
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
          {wonItem.attackBonus  ? <p style={{ ...MONO, fontSize: 10, color: wonItem.magicDamage ? '#c078f0' : '#86efac', display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'center' }}><GameIcon name={wonItem.magicDamage ? 'magic_orb' : 'sword'} size={10} color={wonItem.magicDamage ? '#c078f0' : '#86efac'} /> +{wonItem.attackBonus} {wonItem.magicDamage ? 'Obrażenia mag.' : 'Atak'}</p> : null}
          {wonItem.defenseBonus ? <p style={{ ...MONO, fontSize: 10, color: '#86efac', display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'center' }}><GameIcon name="shield" size={10} color="#86efac" /> +{wonItem.defenseBonus} Obrona</p> : null}
          {Object.entries(wonItem.stats).filter(([, v]) => v).map(([k, v]) => (
            <p key={k} style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)' }}>+{v} {k}</p>
          ))}
          <p style={{ ...MONO, fontSize: 10, color: '#ffd700', marginTop: 4, display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'center' }}><GameIcon name="coin" size={10} /> {wonItem.goldValue} sprzedaż</p>
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 220 }}>
        {isDone ? (
          fullInv ? (
            <>
              <p style={{ ...MONO, fontSize: 10, color: '#f87171', textAlign: 'center' }}>
                Plecak pełny! Przedmiot przepadł.
              </p>
              <button onClick={dismiss} className="btn btn-secondary" style={{ fontSize: 9 }}>
                ✕ Zamknij
              </button>
            </>
          ) : (
            <p style={{ ...ORB, fontSize: 10, color: '#4ade80', textAlign: 'center' }}>
              <GameIcon name="check" size={10} color="#4ade80" /> Dodano do plecaka!
            </p>
          )
        ) : (
          <button onClick={handleSkip} className="btn btn-secondary" style={{ fontSize: 10 }}>
            <GameIcon name="run" size={10} color="#fff" /> Pomiń animację
          </button>
        )}
      </div>
    </div>,
    modalRoot
  );
}
