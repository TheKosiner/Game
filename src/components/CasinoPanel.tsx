import { useState, useRef, useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import { useGameStore } from '../store/gameStore';
import { MONO, ORB } from '../utils/styles';

interface SpinResult { result: number; won: boolean; net: number; newGold: number; newGoldEarnedToday: number }

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

interface HistEntry { n: number }

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

// ── Main panel ────────────────────────────────────────────────────────────────

export default function CasinoPanel() {
  const hero     = useGameStore(s => s.hero);
  const saveGame = useGameStore(s => s.saveGame);

  const [betType, setBetType]       = useState<BetType | null>(null);
  const [stakeInput, setStakeInput] = useState('100');
  const [spinning, setSpinning]     = useState(false);
  const [displayed, setDisplayed]   = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<{ n: number; won: boolean; net: number } | null>(null);
  const [history, setHistory]       = useState<HistEntry[]>([]);
  const [showNums, setShowNums]     = useState(false);
  const [spinError, setSpinError]   = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const maxStake = hero.gold;
  const stake    = Math.max(1, Math.min(parseInt(stakeInput) || 0, maxStake));

  const spin = useCallback(async () => {
    if (spinning || !betType || stake <= 0 || stake > hero.gold || !functions) return;
    setSpinning(true);
    setLastResult(null);
    setSpinError(null);
    resultRef.current = null;

    // Deduct stake immediately for responsive UI; restored if function fails
    useGameStore.setState(s => ({ hero: { ...s.hero, gold: s.hero.gold - stake } }));

    // Fast-spin animation runs while waiting for Cloud Function response
    const fastSpin = setInterval(() => {
      setDisplayed(Math.floor(Math.random() * 37));
    }, 75);

    // Call Cloud Function — server generates RNG and writes result to Firestore atomically
    let res: SpinResult;
    try {
      const fn = httpsCallable<{ betType: string; stake: number }, SpinResult>(functions, 'spinRoulette');
      const r = await fn({ betType, stake });
      res = r.data;
    } catch (err: any) {
      clearInterval(fastSpin);
      // Restore stake if function rejected (e.g. not enough gold race condition)
      useGameStore.setState(s => ({ hero: { ...s.hero, gold: s.hero.gold + stake } }));
      setSpinning(false);
      setDisplayed(null);
      setSpinError(err?.message ?? 'Błąd serwera — spróbuj ponownie');
      return;
    }

    clearInterval(fastSpin);

    // Slow landing animation onto the server-determined result number
    let tick = 0;
    const SLOW = 9;
    const land = () => {
      tick++;
      if (tick < SLOW) {
        setDisplayed(Math.floor(Math.random() * 37));
        timerRef.current = setTimeout(land, 100 + tick * 55);
      } else {
        // Apply authoritative server state to local store
        useGameStore.setState(s => ({
          hero: {
            ...s.hero,
            gold: res.newGold,
            goldEarnedToday: res.newGoldEarnedToday,
            lastCasinoSpinAt: Date.now(),
          },
        }));
        setDisplayed(res.result);
        setLastResult({ n: res.result, won: res.won, net: res.net });
        setHistory(h => [{ n: res.result }, ...h].slice(0, 20));
        setSpinning(false);
        // Sync local state so subsequent dungeons/quests don't overwrite server gold
        saveGame();
      }
    };
    setTimeout(land, 120);
  }, [spinning, betType, stake, hero.gold, saveGame]);

  const c = displayed !== null ? numColor(displayed) : '#334155';

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

      {/* History strip */}
      {history.length > 0 && (
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {history.map((h, i) => {
            const hc = numColor(h.n);
            return (
              <span key={i} style={{
                ...MONO, fontSize: 9,
                color: hc,
                background: hc + '18',
                border: `1px solid ${hc}44`,
                padding: '1px 5px', minWidth: 20, textAlign: 'center',
              }}>
                {h.n}
              </span>
            );
          })}
        </div>
      )}

      {/* Wheel display */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(4,2,12,0.98), rgba(8,4,18,0.98))',
        border: `2px solid ${spinning ? 'rgba(255,215,0,0.55)' : c + '55'}`,
        padding: '20px 0 16px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        boxShadow: `0 0 28px ${spinning ? 'rgba(255,215,0,0.12)' : c + '10'}`,
        transition: 'border-color 0.08s',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* CRT scanlines */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 4px)',
        }} />
        {/* Roulette ring decoration */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 60% 40% at 50% 50%, transparent 50%, rgba(0,0,0,0.4) 100%)',
        }} />

        {/* Number circle */}
        <div style={{
          width: 96, height: 96, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: displayed !== null ? c + '1a' : 'rgba(255,255,255,0.03)',
          border: `3px solid ${displayed !== null ? c : 'rgba(255,255,255,0.1)'}`,
          boxShadow: displayed !== null ? `0 0 24px ${c}55, inset 0 0 16px ${c}18` : 'none',
          transition: 'border-color 0.08s, box-shadow 0.08s',
        }}>
          <span style={{
            fontFamily: "'Orbitron', monospace", fontWeight: 900,
            fontSize: displayed !== null && displayed >= 10 ? 28 : 32,
            color: displayed !== null ? c : 'rgba(255,255,255,0.12)',
            textShadow: displayed !== null ? `0 0 14px ${c}` : 'none',
          }}>
            {displayed !== null ? displayed : '?'}
          </span>
        </div>

        {/* Status line */}
        {spinning ? (
          <p style={{ ...MONO, fontSize: 9, color: '#fbbf24', letterSpacing: 2 }}>⟳ KRĘCI...</p>
        ) : displayed !== null ? (
          <p style={{ ...MONO, fontSize: 9, color: c, letterSpacing: 1, textShadow: `0 0 8px ${c}80` }}>
            {numLabel(displayed)}
          </p>
        ) : (
          <p style={{ ...MONO, fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1 }}>
            POSTAW ZAKŁAD I ZAKRĘĆ
          </p>
        )}
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
          <button
            onClick={() => setStakeInput(String(Math.min(stake * 2, maxStake)))}
            disabled={spinning}
            className="btn btn-secondary"
            style={{ fontSize: 9, padding: '6px 9px' }}
          >
            ×2
          </button>
          <button
            onClick={() => setStakeInput(String(Math.max(1, Math.floor(stake / 2))))}
            disabled={spinning}
            className="btn btn-secondary"
            style={{ fontSize: 9, padding: '6px 9px' }}
          >
            ÷2
          </button>
        </div>
      </div>

      {/* Bet type grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <p style={{ ...MONO, fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1 }}>TYP ZAKŁADU</p>

        {/* Red / Black */}
        <div style={{ display: 'flex', gap: 5 }}>
          <button
            onClick={() => setBetType('red')}
            disabled={spinning}
            style={{
              flex: 1, padding: '10px 4px', cursor: 'pointer',
              background: betType === 'red' ? 'rgba(239,68,68,0.25)' : 'rgba(5,8,20,0.8)',
              border: `2px solid ${betType === 'red' ? '#ef4444' : 'rgba(239,68,68,0.25)'}`,
              color: '#fca5a5', fontFamily: "'Share Tech Mono', monospace", fontSize: 10,
              transition: 'border-color 0.1s',
            }}
          >
            🔴 CZERWONY<br />
            <span style={{ fontSize: 8, opacity: 0.65 }}>1:1 — 18 numerów</span>
          </button>
          <button
            onClick={() => setBetType('black')}
            disabled={spinning}
            style={{
              flex: 1, padding: '10px 4px', cursor: 'pointer',
              background: betType === 'black' ? 'rgba(148,163,184,0.15)' : 'rgba(5,8,20,0.8)',
              border: `2px solid ${betType === 'black' ? '#94a3b8' : 'rgba(148,163,184,0.2)'}`,
              color: '#cbd5e1', fontFamily: "'Share Tech Mono', monospace", fontSize: 10,
              transition: 'border-color 0.1s',
            }}
          >
            ⚫ CZARNY<br />
            <span style={{ fontSize: 8, opacity: 0.65 }}>1:1 — 18 numerów</span>
          </button>
        </div>

        {/* Even-chance row 1: odd / even / low / high */}
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

        {/* Dozens */}
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

        {/* Number picker toggle */}
        <button
          onClick={() => setShowNums(v => !v)}
          disabled={spinning}
          className="btn btn-secondary"
          style={{ fontSize: 9, padding: '5px', width: '100%' }}
        >
          {showNums ? '▲ UKRYJ NUMERY' : `▼ NUMER DOKŁADNY (35:1)${betType?.startsWith('num_') ? ` — wybrany: ${betType.slice(4)}` : ''}`}
        </button>

        {showNums && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
            {Array.from({ length: 37 }, (_, i) => {
              const nc = numColor(i);
              const active = betType === `num_${i}`;
              return (
                <button
                  key={i}
                  onClick={() => { setBetType(`num_${i}` as BetType); setShowNums(false); }}
                  disabled={spinning}
                  style={{
                    padding: '5px 2px', textAlign: 'center', cursor: 'pointer',
                    background: active ? nc + '30' : nc + '10',
                    border: `1px solid ${active ? nc : nc + '44'}`,
                    color: active ? nc : nc + 'cc',
                    fontFamily: "'Share Tech Mono', monospace", fontSize: 9,
                  }}
                >
                  {i}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Active bet summary */}
      {betType && (
        <div style={{
          background: 'rgba(255,215,0,0.05)',
          border: '1px solid rgba(255,215,0,0.25)',
          padding: '7px 12px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ ...MONO, fontSize: 10, color: '#fbbf24' }}>
            {betLabel(betType)}
            <span style={{ opacity: 0.55, marginLeft: 6 }}>({betOdds(betType)})</span>
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
          padding: '13px',
          fontSize: 11, letterSpacing: 3,
          opacity: !betType || hero.gold <= 0 ? 0.4 : 1,
          background: spinning ? undefined : 'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(245,158,11,0.08))',
          borderColor: spinning ? undefined : 'rgba(245,158,11,0.6)',
          color: '#fbbf24',
          textShadow: spinning ? 'none' : '0 0 10px rgba(245,158,11,0.7)',
        }}
      >
        {spinning
          ? '⟳ KRĘCI...'
          : hero.gold <= 0
          ? '— BRAK ZŁOTA —'
          : betType
          ? `🎰 ZAKRĘĆ — 🪙 ${stake.toLocaleString()}`
          : '← WYBIERZ ZAKŁAD'}
      </button>

      {spinError && (
        <p style={{ ...MONO, fontSize: 9, color: '#f87171', textAlign: 'center' }}>
          ⚠ {spinError}
        </p>
      )}
    </div>
  );
}
