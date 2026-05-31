import { useState, useRef, useCallback, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { collection, query, orderBy, limit, onSnapshot, addDoc } from 'firebase/firestore';
import { functions, db } from '../lib/firebase';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import { MONO, ORB } from '../utils/styles';

interface SpinResult { result: number; won: boolean; net: number; newGold: number }

// ── Roulette helpers ──────────────────────────────────────────────────────────

const RED_NUMS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

function numColor(n: number): string {
  if (n === 0) return '#22c55e';
  return RED_NUMS.has(n) ? '#ef4444' : '#94a3b8';
}

function numLabel(n: number): string {
  if (n === 0) return 'ZERO';
  return [
    RED_NUMS.has(n) ? 'CZERWONY' : 'CZARNY',
    n % 2 === 1 ? 'NIEPARZYSTE' : 'PARZYSTE',
    n <= 18 ? '1–18' : '19–36',
  ].join(' · ');
}

type BetType =
  | 'red' | 'black'
  | 'odd' | 'even'
  | 'low' | 'high'
  | 'dozen1' | 'dozen2' | 'dozen3'
  | `num_${number}`;

function betLabel(bet: BetType): string {
  const map: Record<string, string> = {
    red: '🔴 Czerwony', black: '⚫ Czarny',
    odd: 'Nieparzyste', even: 'Parzyste',
    low: '▼ 1–18', high: '▲ 19–36',
    dozen1: '1–12', dozen2: '13–24', dozen3: '25–36',
  };
  if (bet.startsWith('num_')) return `Numer ${bet.slice(4)}`;
  return map[bet] ?? bet;
}

function betOdds(bet: BetType): string {
  if (bet.startsWith('num_')) return '35:1';
  if (bet.startsWith('dozen')) return '2:1';
  return '1:1';
}

const QUICK_STAKES = [10, 50, 100, 500, 1000];

// ── Reel animation constants ──────────────────────────────────────────────────

const CELL_H = [36, 52, 74, 52, 36]; // outer → center → outer
const CELL_GAP = 6;
const STEP_PX = CELL_H[2] + CELL_GAP; // 80px per tape slot
const SPIN_VEL  = 9;    // cells/sec while freewheeling (slow enough to read)
const DECEL_MS  = 1200; // ms for deceleration phase

const rnd37 = () => Math.floor(Math.random() * 37);

// ── Subcomponents ─────────────────────────────────────────────────────────────

function BetBtn({
  active, onClick, children, color,
}: {
  active: boolean; onClick: () => void; children: React.ReactNode; color?: string;
}) {
  const ac = color ?? '#7dd3fc';
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: '7px 4px', cursor: 'pointer',
        background: active ? ac + '22' : 'rgba(5,8,20,0.8)',
        border: `1px solid ${active ? ac + '88' : 'rgba(255,255,255,0.1)'}`,
        color: active ? ac : 'var(--text-dim)',
        fontFamily: "'Share Tech Mono', monospace", fontSize: 9,
        transition: 'border-color 0.1s, background 0.1s',
        lineHeight: 1.4,
      }}
    >
      {children}
    </button>
  );
}

interface FeedEntry {
  id: string;
  username: string;
  won: boolean;
  net: number;
  result: number;
  stake: number;
  ts: number;
}

// ── Main panel ────────────────────────────────────────────────────────────────

export default function CasinoPanel() {
  const hero     = useGameStore(s => s.hero);
  const saveGame = useGameStore(s => s.saveGame);
  const user     = useAuthStore(s => s.user);

  const [betType, setBetType]       = useState<BetType | null>(null);
  const [stakeInput, setStakeInput] = useState('100');
  const [spinning, setSpinning]     = useState(false);
  const [lastResult, setLastResult] = useState<{ n: number; won: boolean; net: number } | null>(null);
  const [feed, setFeed]             = useState<FeedEntry[]>([]);
  const [topWin, setTopWin]         = useState<FeedEntry | null>(null);
  const [topLoss, setTopLoss]       = useState<FeedEntry | null>(null);
  const [showNums, setShowNums]     = useState(false);
  const [spinError, setSpinError]   = useState<string | null>(null);

  // ── Reel state ────────────────────────────────────────────────────────────
  const reelRef = useRef({
    tape:       Array.from({ length: 80 }, rnd37) as number[],
    pos:        30,              // tape index at center (float)
    phase:      'idle' as 'idle' | 'spin' | 'decel',
    decelStart: 0,               // performance.now() when decel began
    decelFrom:  30,              // pos at decel start
    targetPos:  30,              // tape index to land on
  });
  const prevTimeRef = useRef(performance.now());
  const [renderPos, setRenderPos] = useState(30);
  const rafRef    = useRef<number | undefined>(undefined);
  const onDoneRef = useRef<(() => void) | null>(null);
  const histRef   = useRef<number[]>([]);

  // ── RAF animation loop (always running) ──────────────────────────────────
  useEffect(() => {
    const frame = (now: number) => {
      const dt = Math.min((now - prevTimeRef.current) / 1000, 0.05);
      prevTimeRef.current = now;
      const r = reelRef.current;

      if (r.phase === 'spin') {
        r.pos += SPIN_VEL * dt;
        while (r.pos + 15 > r.tape.length) r.tape.push(rnd37());
        setRenderPos(r.pos);
      } else if (r.phase === 'decel') {
        const t = Math.min((now - r.decelStart) / DECEL_MS, 1);
        // ease-out cubic: fast start, smooth stop
        const ease = 1 - Math.pow(1 - t, 3);
        r.pos = r.decelFrom + (r.targetPos - r.decelFrom) * ease;
        setRenderPos(r.pos);
        if (t >= 1) {
          r.pos = r.targetPos;
          r.phase = 'idle';
          setRenderPos(r.pos);
          const cb = onDoneRef.current;
          onDoneRef.current = null;
          cb?.();
        }
      }

      rafRef.current = requestAnimationFrame(frame);
    };

    prevTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(frame);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  // ── Firestore feed ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!db) return;
    const qFeed = query(collection(db, 'casinoSpins'), orderBy('ts',  'desc'), limit(25));
    const qWin  = query(collection(db, 'casinoSpins'), orderBy('net', 'desc'), limit(1));
    const qLoss = query(collection(db, 'casinoSpins'), orderBy('net', 'asc'),  limit(1));
    const u1 = onSnapshot(qFeed, snap => setFeed(snap.docs.map(d => ({ id: d.id, ...d.data() } as FeedEntry))));
    const u2 = onSnapshot(qWin,  snap => {
      const e = snap.docs[0] ? { id: snap.docs[0].id, ...snap.docs[0].data() } as FeedEntry : null;
      setTopWin(e?.won ? e : null);
    });
    const u3 = onSnapshot(qLoss, snap => {
      const e = snap.docs[0] ? { id: snap.docs[0].id, ...snap.docs[0].data() } as FeedEntry : null;
      setTopLoss(e && !e.won ? e : null);
    });
    return () => { u1(); u2(); u3(); };
  }, []);

  const maxStake = hero.gold;
  const stake    = Math.max(1, Math.min(parseInt(stakeInput) || 0, maxStake));

  // ── Spin ─────────────────────────────────────────────────────────────────
  const spin = useCallback(async () => {
    if (spinning || !betType || stake <= 0 || stake > hero.gold || !functions) return;
    setSpinning(true);
    setLastResult(null);
    setSpinError(null);

    // Start freewheeling
    reelRef.current.phase = 'spin';

    useGameStore.setState(s => ({ hero: { ...s.hero, gold: s.hero.gold - stake } }));

    let res: SpinResult;
    try {
      const fn = httpsCallable<{ betType: string; stake: number }, SpinResult>(functions, 'spinRoulette');
      const r = await fn({ betType, stake });
      res = r.data;
    } catch (err: any) {
      reelRef.current.phase = 'idle';
      useGameStore.setState(s => ({ hero: { ...s.hero, gold: s.hero.gold + stake } }));
      setSpinning(false);
      setSpinError(err?.message ?? 'Błąd serwera — spróbuj ponownie');
      return;
    }

    // Plant result 5 cells ahead and switch to timed deceleration
    const r = reelRef.current;
    const plantAt = Math.ceil(r.pos) + 5;
    while (r.tape.length <= plantAt + 6) r.tape.push(rnd37());
    r.tape[plantAt] = res.result;
    for (let i = plantAt + 1; i <= plantAt + 4; i++) r.tape[i] = rnd37();
    r.decelFrom  = r.pos;
    r.targetPos  = plantAt;
    r.decelStart = performance.now();
    r.phase      = 'decel';

    onDoneRef.current = () => {
      useGameStore.setState(s => ({
        hero: {
          ...s.hero,
          gold: s.hero.gold + (res.won ? res.net + stake : 0),
          goldEarnedToday: s.hero.goldEarnedToday + Math.max(0, res.net),
          lastCasinoSpinAt: Date.now(),
        },
      }));
      setLastResult({ n: res.result, won: res.won, net: res.net });
      histRef.current = [res.result, ...histRef.current].slice(0, 20);
      setSpinning(false);
      saveGame();
      if (db && user) {
        addDoc(collection(db, 'casinoSpins'), {
          uid: user.uid,
          username: user.username,
          result: res.result,
          won: res.won,
          net: res.net,
          stake,
          ts: Date.now(),
        }).catch(() => {});
      }
    };
  }, [spinning, betType, stake, hero.gold, saveGame, user]);

  // ── Reel rendering ────────────────────────────────────────────────────────
  const centerIdx = Math.floor(renderPos);
  const frac      = renderPos - centerIdx; // 0.0 → 1.0

  // We render 7 cells (-3 … +3) to keep the viewport full during transitions
  const OFFSETS = [-3, -2, -1, 0, 1, 2, 3] as const;

  // The center number (landed or mid-spin)
  const centerNum = reelRef.current.tape[centerIdx] ?? 0;
  const c = numColor(centerNum);

  // Viewport height = 5 visible cells + gaps
  const viewH = CELL_H[0] + CELL_H[1] + CELL_H[2] + CELL_H[3] + CELL_H[4] + 4 * CELL_GAP;

  return (
    <div className="card p-3" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ ...ORB, fontSize: 11, color: '#f59e0b', textShadow: '0 0 14px rgba(245,158,11,0.7)' }}>
          🎰 KASYNO
        </p>
        <p style={{ ...MONO, fontSize: 10, color: '#ffd700' }}>
          🪙 {hero.gold.toLocaleString()} złota
        </p>
      </div>

      {/* Session history strip */}
      {histRef.current.length > 0 && (
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {histRef.current.map((n, i) => {
            const hc = numColor(n);
            return (
              <span key={i} style={{
                ...MONO, fontSize: 9, color: hc,
                background: hc + '18', border: `1px solid ${hc}44`,
                padding: '1px 5px', minWidth: 20, textAlign: 'center',
              }}>
                {n}
              </span>
            );
          })}
        </div>
      )}

      {/* ── Roulette drum (vertical reel) ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(4,2,12,0.98), rgba(8,4,18,0.98))',
        border: `2px solid ${spinning ? 'rgba(255,215,0,0.5)' : c + '66'}`,
        padding: '0',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0,
        boxShadow: `0 0 28px ${spinning ? 'rgba(255,215,0,0.12)' : c + '18'}`,
        transition: 'border-color 0.15s, box-shadow 0.15s',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* CRT scanlines */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 4px)',
        }} />

        {/* Top / bottom fade masks */}
        <div style={{
          position: 'absolute', left: 0, right: 0, top: 0, height: '30%',
          background: 'linear-gradient(to bottom, rgba(4,2,12,0.92), transparent)',
          pointerEvents: 'none', zIndex: 2,
        }} />
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, height: '30%',
          background: 'linear-gradient(to top, rgba(4,2,12,0.92), transparent)',
          pointerEvents: 'none', zIndex: 2,
        }} />

        {/* Center highlight line pair */}
        <div style={{
          position: 'absolute', left: 0, right: 0, zIndex: 2,
          top: `calc(50% - ${CELL_H[2] / 2 + 2}px)`,
          height: 2,
          background: spinning ? 'rgba(255,215,0,0.35)' : c + '55',
          transition: 'background 0.15s',
          boxShadow: spinning ? '0 0 8px rgba(255,215,0,0.3)' : `0 0 8px ${c}44`,
        }} />
        <div style={{
          position: 'absolute', left: 0, right: 0, zIndex: 2,
          bottom: `calc(50% - ${CELL_H[2] / 2 + 2}px)`,
          height: 2,
          background: spinning ? 'rgba(255,215,0,0.35)' : c + '55',
          transition: 'background 0.15s',
          boxShadow: spinning ? '0 0 8px rgba(255,215,0,0.3)' : `0 0 8px ${c}44`,
        }} />

        {/* Scrolling reel viewport */}
        <div style={{
          width: '100%', height: viewH,
          overflow: 'hidden', position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {/* The actual tape — translated by fractional offset for smooth scroll */}
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center',
            gap: CELL_GAP,
            // Shift strip upward as frac increases (new numbers enter from below)
            transform: `translateY(${-frac * STEP_PX}px)`,
            // No CSS transition — RAF handles the smoothness
          }}>
            {OFFSETS.map((offset) => {
              const tapeIdx = centerIdx + offset;
              const num = reelRef.current.tape[Math.max(0, tapeIdx)] ?? rnd37();
              const isCenter = offset === 0;
              const absOff   = Math.abs(offset);
              const sz       = absOff === 0 ? CELL_H[2] : absOff === 1 ? CELL_H[1] : CELL_H[0];
              const opacity  = absOff === 0 ? 1 : absOff === 1 ? 0.62 : 0.28;
              const cellColor = numColor(num);

              return (
                <div
                  key={offset}
                  style={{
                    width: sz, height: sz, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 6,
                    background: isCenter
                      ? cellColor + '20'
                      : 'rgba(255,255,255,0.025)',
                    border: `${isCenter ? 2 : 1}px solid ${isCenter ? cellColor + 'bb' : 'rgba(255,255,255,0.06)'}`,
                    boxShadow: isCenter ? `0 0 20px ${cellColor}44, inset 0 0 12px ${cellColor}14` : 'none',
                    opacity,
                    transition: 'opacity 0.06s',
                  }}
                >
                  <span style={{
                    fontFamily: "'Orbitron', monospace", fontWeight: 900,
                    fontSize: isCenter ? (num >= 10 ? 24 : 28) : (absOff === 1 ? (num >= 10 ? 16 : 18) : (num >= 10 ? 12 : 14)),
                    color: isCenter ? cellColor : 'rgba(255,255,255,0.4)',
                    textShadow: isCenter ? `0 0 12px ${cellColor}` : 'none',
                  }}>
                    {num}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status label */}
        <div style={{ padding: '8px 0 10px', zIndex: 3 }}>
          {spinning ? (
            <p style={{ ...MONO, fontSize: 9, color: '#fbbf24', letterSpacing: 2 }}>⟳ KRĘCI...</p>
          ) : lastResult !== null ? (
            <p style={{ ...MONO, fontSize: 9, color: c, letterSpacing: 1, textShadow: `0 0 8px ${c}80` }}>
              {numLabel(centerNum)}
            </p>
          ) : (
            <p style={{ ...MONO, fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1 }}>
              POSTAW ZAKŁAD I ZAKRĘĆ
            </p>
          )}
        </div>
      </div>

      {/* Win / loss flash */}
      {lastResult && !spinning && (
        <div style={{
          background: lastResult.won ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.08)',
          border: `1px solid ${lastResult.won ? 'rgba(34,197,94,0.45)' : 'rgba(239,68,68,0.35)'}`,
          padding: '8px 12px', textAlign: 'center',
        }}>
          <p style={{ ...ORB, fontSize: 10, color: lastResult.won ? '#4ade80' : '#f87171' }}>
            {lastResult.won
              ? `🎉 WYGRAŁEŚ +${lastResult.net.toLocaleString()} 🪙`
              : `💸 PRZEGRAŁEŚ −${Math.abs(lastResult.net).toLocaleString()} 🪙`}
          </p>
        </div>
      )}

      {/* Stake controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <p style={{ ...MONO, fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1 }}>KWOTA ZAKŁADU</p>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {QUICK_STAKES.map(q => (
            <button
              key={q}
              onClick={() => setStakeInput(String(Math.min(q, maxStake)))}
              disabled={spinning}
              className="btn btn-secondary"
              style={{ fontSize: 9, padding: '3px 7px', color: stake === q ? '#ffd700' : undefined, borderColor: stake === q ? 'rgba(255,215,0,0.5)' : undefined }}
            >
              {q}
            </button>
          ))}
          <button
            onClick={() => setStakeInput(String(maxStake))}
            disabled={spinning}
            className="btn btn-secondary"
            style={{ fontSize: 9, padding: '3px 7px', color: stake === maxStake && maxStake > 0 ? '#ffd700' : undefined, borderColor: stake === maxStake && maxStake > 0 ? 'rgba(255,215,0,0.5)' : undefined }}
          >
            MAX
          </button>
        </div>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          <input
            type="number" min={1} max={maxStake}
            value={stakeInput}
            onChange={e => setStakeInput(e.target.value)}
            disabled={spinning}
            style={{
              flex: 1, background: 'rgba(5,8,20,0.9)',
              border: '1px solid rgba(255,215,0,0.3)',
              color: '#ffd700', fontFamily: "'Share Tech Mono', monospace",
              fontSize: 13, padding: '7px 10px', outline: 'none',
            }}
          />
          <button onClick={() => setStakeInput(String(Math.min(stake * 2, maxStake)))} disabled={spinning} className="btn btn-secondary" style={{ fontSize: 9, padding: '6px 9px' }}>×2</button>
          <button onClick={() => setStakeInput(String(Math.max(1, Math.floor(stake / 2))))} disabled={spinning} className="btn btn-secondary" style={{ fontSize: 9, padding: '6px 9px' }}>÷2</button>
        </div>
      </div>

      {/* Bet type grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <p style={{ ...MONO, fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1 }}>TYP ZAKŁADU</p>

        <div style={{ display: 'flex', gap: 5 }}>
          <button onClick={() => setBetType('red')} disabled={spinning} style={{ flex: 1, padding: '10px 4px', cursor: 'pointer', background: betType === 'red' ? 'rgba(239,68,68,0.25)' : 'rgba(5,8,20,0.8)', border: `2px solid ${betType === 'red' ? '#ef4444' : 'rgba(239,68,68,0.25)'}`, color: '#fca5a5', fontFamily: "'Share Tech Mono', monospace", fontSize: 10, transition: 'border-color 0.1s' }}>
            🔴 CZERWONY<br /><span style={{ fontSize: 8, opacity: 0.65 }}>1:1 — 18 numerów</span>
          </button>
          <button onClick={() => setBetType('black')} disabled={spinning} style={{ flex: 1, padding: '10px 4px', cursor: 'pointer', background: betType === 'black' ? 'rgba(148,163,184,0.15)' : 'rgba(5,8,20,0.8)', border: `2px solid ${betType === 'black' ? '#94a3b8' : 'rgba(148,163,184,0.2)'}`, color: '#cbd5e1', fontFamily: "'Share Tech Mono', monospace", fontSize: 10, transition: 'border-color 0.1s' }}>
            ⚫ CZARNY<br /><span style={{ fontSize: 8, opacity: 0.65 }}>1:1 — 18 numerów</span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          {(['odd', 'even', 'low', 'high'] as const).map(b => {
            const labels = ['NIEP.', 'PARZ.', '1–18', '19–36'];
            const i = ['odd','even','low','high'].indexOf(b);
            return (
              <BetBtn key={b} active={betType === b} onClick={() => !spinning && setBetType(b)}>
                {labels[i]}<br /><span style={{ fontSize: 7, opacity: 0.6 }}>1:1</span>
              </BetBtn>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          {(['dozen1', 'dozen2', 'dozen3'] as const).map(b => {
            const label = b === 'dozen1' ? '1–12' : b === 'dozen2' ? '13–24' : '25–36';
            return (
              <BetBtn key={b} active={betType === b} onClick={() => !spinning && setBetType(b)} color="#c4b5fd">
                {label}<br /><span style={{ fontSize: 7, opacity: 0.6 }}>2:1</span>
              </BetBtn>
            );
          })}
        </div>

        <button onClick={() => setShowNums(v => !v)} disabled={spinning} className="btn btn-secondary" style={{ fontSize: 9, padding: '5px', width: '100%' }}>
          {showNums ? '▲ UKRYJ NUMERY' : `▼ NUMER DOKŁADNY (35:1)${betType?.startsWith('num_') ? ` — wybrany: ${betType.slice(4)}` : ''}`}
        </button>

        {showNums && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
            {Array.from({ length: 37 }, (_, i) => {
              const nc = numColor(i);
              const active = betType === `num_${i}`;
              return (
                <button key={i} onClick={() => { setBetType(`num_${i}` as BetType); setShowNums(false); }} disabled={spinning} style={{ padding: '5px 2px', textAlign: 'center', cursor: 'pointer', background: active ? nc + '30' : nc + '10', border: `1px solid ${active ? nc : nc + '44'}`, color: active ? nc : nc + 'cc', fontFamily: "'Share Tech Mono', monospace", fontSize: 9 }}>
                  {i}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Active bet summary */}
      {betType && (
        <div style={{ background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.25)', padding: '7px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ ...MONO, fontSize: 10, color: '#fbbf24' }}>
            {betLabel(betType)}<span style={{ opacity: 0.55, marginLeft: 6 }}>({betOdds(betType)})</span>
          </span>
          <span style={{ ...MONO, fontSize: 10, color: '#ffd700' }}>🪙 {stake.toLocaleString()}</span>
        </div>
      )}

      {/* Spin button */}
      <button
        onClick={spin}
        disabled={spinning || !betType || stake <= 0 || hero.gold <= 0}
        className="btn btn-primary"
        style={{
          padding: '13px', fontSize: 11, letterSpacing: 3,
          opacity: !betType || hero.gold <= 0 ? 0.4 : 1,
          background: spinning ? undefined : 'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(245,158,11,0.08))',
          borderColor: spinning ? undefined : 'rgba(245,158,11,0.6)',
          color: '#fbbf24',
          textShadow: spinning ? 'none' : '0 0 10px rgba(245,158,11,0.7)',
        }}
      >
        {spinning ? '⟳ KRĘCI...' : hero.gold <= 0 ? '— BRAK ZŁOTA —' : betType ? `🎰 ZAKRĘĆ — 🪙 ${stake.toLocaleString()}` : '← WYBIERZ ZAKŁAD'}
      </button>

      {spinError && (
        <p style={{ ...MONO, fontSize: 9, color: '#f87171', textAlign: 'center' }}>⚠ {spinError}</p>
      )}

      {/* All-time records */}
      {(topWin || topLoss) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <p style={{ ...MONO, fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1 }}>🏆 REKORDY WSZECH CZASÓW</p>
          <div style={{ display: 'flex', gap: 5 }}>
            {topWin && (
              <div style={{ flex: 1, padding: '7px 8px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.3)' }}>
                <p style={{ ...MONO, fontSize: 8, color: '#6ee7b7', marginBottom: 3 }}>▲ NAJWIĘKSZA WYGRANA</p>
                <p style={{ ...MONO, fontSize: 11, color: '#4ade80' }}>+{topWin.net.toLocaleString()} 🪙</p>
                <p style={{ ...MONO, fontSize: 8, color: 'var(--text-muted)', marginTop: 2 }}>{topWin.username}</p>
              </div>
            )}
            {topLoss && (
              <div style={{ flex: 1, padding: '7px 8px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <p style={{ ...MONO, fontSize: 8, color: '#fca5a5', marginBottom: 3 }}>▼ NAJWIĘKSZA PRZEGRANA</p>
                <p style={{ ...MONO, fontSize: 11, color: '#f87171' }}>−{Math.abs(topLoss.net).toLocaleString()} 🪙</p>
                <p style={{ ...MONO, fontSize: 8, color: 'var(--text-muted)', marginTop: 2 }}>{topLoss.username}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Global spin feed */}
      {feed.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <p style={{ ...MONO, fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 5 }}>
            OSTATNIE 25 LOSOWAŃ GRACZY
          </p>
          {feed.map((e, i) => {
            const rc = numColor(e.result);
            const won = e.won;
            return (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ ...MONO, fontSize: 9, minWidth: 22, textAlign: 'center', color: rc, background: rc + '18', border: `1px solid ${rc}44`, padding: '1px 4px', flexShrink: 0 }}>{e.result}</span>
                <span style={{ ...MONO, fontSize: 9, color: 'var(--text-dim)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.username}</span>
                <span style={{ ...MONO, fontSize: 9, flexShrink: 0, color: won ? '#4ade80' : '#f87171' }}>
                  {won ? `+${e.net.toLocaleString()}` : `−${Math.abs(e.net).toLocaleString()}`} 🪙
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
