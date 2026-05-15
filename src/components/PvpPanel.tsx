import { useEffect, useState } from 'react';
import { getLeaderboard, getPvpHistory, addPvpFight, syncToCloud, type LeaderboardEntry, type PvpFightRecord } from '../lib/cloudSync';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import { PVP_COOLDOWN } from '../store/gameStore';
import { portraitSrc, resolvePortrait } from '../data/portraits';
import type { PvpOpponent, CombatLog } from '../types';
import { getHeroAttack, getHeroDefense, getHeroMaxHp } from '../utils/combat';
const PX   = (s: number) => ({ fontFamily: "'Press Start 2P', monospace", fontSize: s } as const);
const MONO = { fontFamily: "'Share Tech Mono', monospace" } as const;
const ORB  = { fontFamily: "'Orbitron', monospace", fontWeight: 700 } as const;
const LOG_COLORS = { hero: '#5a9040', enemy: '#903040', loot: '#9c7a3c', system: '#7a7060' };

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, Math.round((value / Math.max(max, 1)) * 100));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ ...MONO, fontSize: 9, color: 'var(--text-dim)', minWidth: 36 }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, boxShadow: `0 0 6px ${color}` }} />
      </div>
      <span style={{ ...ORB, fontSize: 8, color, minWidth: 26, textAlign: 'right' }}>{value}</span>
    </div>
  );
}


function pvpHit(atk: number, def: number, critChance: number): { damage: number; isCrit: boolean } {
  const base = atk * atk / (atk + Math.max(1, def));
  const isCrit = Math.random() < critChance;
  const variance = 0.7 + Math.random() * 0.6;
  return { damage: Math.max(1, Math.round(base * variance * (isCrit ? 2 : 1))), isCrit };
}

function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d temu`;
  if (h > 0) return `${h}h temu`;
  if (m > 0) return `${m}m temu`;
  return 'teraz';
}

interface CombatState {
  opponent: PvpOpponent;
  oppPortrait: number;
  heroHp: number;
  heroMaxHp: number;
  oppHp: number;
  oppMaxHp: number;
  heroAtk: number;
  heroDef: number;
  oppAtk: number;
  oppDef: number;
  heroCritChance: number;
  oppCritChance: number;
  log: CombatLog[];
  done: boolean;
  won: boolean | null;
  xpGained: number;
  goldGained: number;
}

function formatMs(ms: number) {
  if (ms <= 0) return '0:00';
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function CooldownTimer({ end }: { end: number }) {
  const [rem, setRem] = useState(Math.max(0, end - Date.now()));
  useEffect(() => {
    const id = setInterval(() => { const r = Math.max(0, end - Date.now()); setRem(r); if (!r) clearInterval(id); }, 1000);
    return () => clearInterval(id);
  }, [end]);
  return <span style={{ color: 'var(--hp-bright)' }}>{formatMs(rem)}</span>;
}

function PvpCombat({ combat, onAttack, onAutoFight, onExit }: {
  combat: CombatState;
  onAttack: () => void;
  onAutoFight: () => void;
  onExit: () => void;
}) {
  const hero = useGameStore(s => s.hero);
  const heroPortraitSrc = portraitSrc(hero.portrait);

  const heroHpPct = Math.max(0, (combat.heroHp / combat.heroMaxHp) * 100);
  const oppHpPct = Math.max(0, (combat.oppHp / combat.oppMaxHp) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ ...PX(7), color: 'var(--gold-main)', textShadow: '0 0 8px var(--gold-glow)' }}>⚔ ARENA PvP</p>
        <p style={{ ...PX(5), color: 'var(--text-dim)' }}>vs {combat.opponent.heroName}</p>
      </div>

      {/* Opponent card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(20,5,5,0.97), rgba(14,4,4,0.99))',
        border: '1px solid rgba(100,30,30,0.6)',
        padding: 10,
        boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 64, height: 64, overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(80,20,20,0.5)' }}>
            <img src={portraitSrc(combat.oppPortrait)} alt="oponent" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ ...PX(7), color: '#c05050', marginBottom: 3 }}>{combat.opponent.heroName}</p>
            <p style={{ ...PX(5), color: 'var(--text-dim)', marginBottom: 6 }}>POZ. {combat.opponent.level}</p>
            <p style={{ ...PX(6), color: '#903040' }}>{Math.max(0, combat.oppHp)} / {combat.oppMaxHp} HP</p>
          </div>
        </div>
        <div className="pixel-bar">
          <div className="pixel-bar-fill" style={{ width: `${oppHpPct}%`, background: 'linear-gradient(90deg, #5a0e0e, #b83030)', transition: 'width 0.3s ease' }} />
        </div>
      </div>

      {/* Hero card */}
      <div style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-dark)', padding: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border-dark)' }}>
              <img src={heroPortraitSrc} alt="portret" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
            <span style={{ ...PX(5), color: 'var(--text-dim)' }}>{hero.name}</span>
          </div>
          <span style={{ ...PX(5), color: 'var(--text-dim)' }}>{Math.max(0, combat.heroHp)}/{combat.heroMaxHp} HP</span>
        </div>
        <div className="pixel-bar">
          <div className="pixel-bar-fill hp-fill" style={{ width: `${heroHpPct}%`, transition: 'width 0.3s ease' }} />
        </div>
      </div>

      {!combat.done ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onAttack} className="btn btn-primary" style={{ flex: 1, fontSize: 7 }}>⚔ Atakuj!</button>
          <button onClick={onAutoFight} className="btn btn-secondary" style={{ flex: 1, fontSize: 7 }}>⚡ Szybka walka</button>
        </div>
      ) : (
        <>
          <div style={{
            background: combat.won ? 'rgba(20,50,10,0.9)' : 'rgba(50,10,10,0.9)',
            border: `1px solid ${combat.won ? 'rgba(60,120,20,0.6)' : 'rgba(120,30,30,0.6)'}`,
            padding: '10px 12px', textAlign: 'center',
          }}>
            <p style={{ ...PX(9), color: combat.won ? '#6aaa30' : 'var(--hp-bright)', marginBottom: 6 }}>
              {combat.won ? '🏆 ZWYCIĘSTWO!' : '💀 PORAŻKA'}
            </p>
            <p style={{ ...PX(6), color: 'var(--gold-bright)' }}>
              +{combat.xpGained} XP{combat.goldGained > 0 ? `   +${combat.goldGained}🪙` : ''}
            </p>
          </div>
          <button onClick={onExit} className="btn btn-secondary" style={{ width: '100%', fontSize: 7 }}>◀ Wróć do areny</button>
        </>
      )}

      <div className="combat-log">
        {combat.log.slice(0, 15).map((log, i) => (
          <p key={i} style={{ color: LOG_COLORS[log.type], marginBottom: 1 }}>{log.message}</p>
        ))}
      </div>
    </div>
  );
}

function pickTwo(pool: LeaderboardEntry[], heroLevel: number): [LeaderboardEntry, LeaderboardEntry] | null {
  if (pool.length < 2) return null;
  // Prefer similar level (±15), fall back to full pool
  const nearby = pool.filter(e => Math.abs(e.level - heroLevel) <= 15);
  const src = nearby.length >= 2 ? nearby : pool;
  const shuffled = [...src].sort(() => Math.random() - 0.5);
  return [shuffled[0], shuffled[1]];
}

function ArenaCard({ entry, canFight, onChallenge }: {
  entry: LeaderboardEntry;
  canFight: boolean;
  onChallenge: (e: LeaderboardEntry) => void;
}) {
  const atk = entry.attack  ?? 0;
  const def = entry.defense ?? 0;
  const hp  = entry.maxHp   ?? 0;
  const wins   = entry.pvpWins   ?? 0;
  const losses = entry.pvpLosses ?? 0;
  const total  = wins + losses;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
  const maxStat = Math.max(atk, def, 1);

  return (
    <div style={{
      flex: 1, minWidth: 0,
      background: 'linear-gradient(160deg, rgba(20,5,5,0.98), rgba(10,3,3,0.99))',
      border: '1px solid rgba(180,40,40,0.35)',
      display: 'flex', flexDirection: 'column', gap: 8,
      boxShadow: '0 0 20px rgba(180,40,40,0.07)',
      padding: 10,
    }}>
      {/* Portrait */}
      <div style={{ width: '100%', aspectRatio: '1', overflow: 'hidden', border: '2px solid rgba(180,40,40,0.45)', boxShadow: '0 0 16px rgba(180,40,40,0.2)' }}>
        <img
          src={portraitSrc(resolvePortrait(entry.portrait, entry.username))}
          alt={entry.username}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>

      {/* Name + level */}
      <div>
        <p style={{ ...ORB, fontSize: 9, color: '#c05050', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {entry.username}
        </p>
        <p style={{ ...MONO, fontSize: 8, color: 'var(--text-muted)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {entry.heroName}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          <span style={{ ...ORB, fontSize: 7, color: '#00f5ff', background: 'rgba(0,245,255,0.08)', border: '1px solid rgba(0,245,255,0.25)', padding: '2px 5px' }}>
            POZ.{entry.level}
          </span>
          {entry.guildTag && (
            <span style={{ ...MONO, fontSize: 7, color: '#00cc66', background: 'rgba(0,204,102,0.08)', border: '1px solid rgba(0,204,102,0.25)', padding: '2px 5px' }}>
              [{entry.guildTag}]
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <StatBar label="ATK" value={atk} max={maxStat * 1.2} color="#ff2d78" />
        <StatBar label="OBR" value={def} max={maxStat * 1.2} color="#00f5ff" />
        <StatBar label="HP"  value={hp}  max={Math.max(hp, 200)} color="#00ff88" />
      </div>

      {/* Win rate */}
      <div style={{ display: 'flex', gap: 4 }}>
        <div style={{ flex: 1, background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.15)', padding: '3px 0', textAlign: 'center' }}>
          <p style={{ ...ORB, fontSize: 9, color: '#00ff88' }}>{wins}</p>
          <p style={{ ...MONO, fontSize: 7, color: 'var(--text-dim)' }}>WIN</p>
        </div>
        <div style={{ flex: 1, background: 'rgba(255,45,120,0.05)', border: '1px solid rgba(255,45,120,0.15)', padding: '3px 0', textAlign: 'center' }}>
          <p style={{ ...ORB, fontSize: 9, color: '#ff2d78' }}>{losses}</p>
          <p style={{ ...MONO, fontSize: 7, color: 'var(--text-dim)' }}>LOSS</p>
        </div>
        <div style={{ flex: 1, background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.15)', padding: '3px 0', textAlign: 'center' }}>
          <p style={{ ...ORB, fontSize: 9, color: '#ffd700' }}>{winRate}%</p>
          <p style={{ ...MONO, fontSize: 7, color: 'var(--text-dim)' }}>W/R</p>
        </div>
      </div>

      {/* Fight button */}
      <button
        onClick={() => onChallenge(entry)}
        disabled={!canFight}
        className={canFight ? 'btn btn-danger' : 'btn btn-secondary'}
        style={{ width: '100%', fontSize: 7, padding: '9px 4px', marginTop: 'auto', opacity: canFight ? 1 : 0.5 }}
      >
        ⚔ WALCZ
      </button>
    </div>
  );
}

function ArenaList({ onChallenge }: { onChallenge: (e: LeaderboardEntry) => void }) {
  const user    = useAuthStore(s => s.user);
  const hero    = useGameStore(s => s.hero);
  const pvpWins   = useGameStore(s => s.pvpWins);
  const pvpLosses = useGameStore(s => s.pvpLosses);
  const lastPvpFight = useGameStore(s => s.lastPvpFight);

  const [entries,       setEntries]       = useState<LeaderboardEntry[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [now,           setNow]           = useState(Date.now());
  const [globalHistory, setGlobalHistory] = useState<PvpFightRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [pair, setPair] = useState<[LeaderboardEntry, LeaderboardEntry] | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  async function fetchAll() {
    setLoading(true); setError('');
    setHistoryLoading(true);
    try {
      const [lb, hist] = await Promise.all([getLeaderboard(), getPvpHistory()]);
      setEntries(lb);
      setGlobalHistory(hist);
      const pool = lb.filter(e => e.uid !== user?.uid);
      setPair(pickTwo(pool, hero.level));
    } catch { setError('Błąd połączenia z serwerem'); }
    finally { setLoading(false); setHistoryLoading(false); }
  }

  function reroll() {
    const pool = entries.filter(e => e.uid !== user?.uid);
    setPair(pickTwo(pool, hero.level));
  }

  useEffect(() => { fetchAll(); }, []);

  const cooldownEnd = lastPvpFight + PVP_COOLDOWN;
  const canFight    = now >= cooldownEnd;
  const myRank      = entries.findIndex(e => e.uid === user?.uid) + 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ ...PX(8), color: 'var(--gold-main)', textShadow: '0 0 10px var(--gold-glow)' }}>⚔ ARENA PvP</p>
        <button onClick={fetchAll} className="btn btn-secondary" style={{ fontSize: 5, padding: '4px 8px' }}>↻</button>
      </div>

      {/* Stats + cooldown */}
      <div style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-dark)', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ ...PX(10), color: '#6aaa30' }}>{pvpWins}</p>
            <p style={{ ...PX(4), color: 'var(--text-muted)' }}>WYGRANE</p>
          </div>
          <div style={{ color: 'var(--border-main)', alignSelf: 'center', fontSize: 14 }}>|</div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ ...PX(10), color: 'var(--hp-bright)' }}>{pvpLosses}</p>
            <p style={{ ...PX(4), color: 'var(--text-muted)' }}>PRZEGRANE</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {myRank > 0 && <p style={{ ...PX(4), color: 'var(--gold-bright)', marginBottom: 3 }}>RANK #{myRank}</p>}
          {canFight
            ? <p style={{ ...PX(5), color: '#6aaa30' }}>✓ Gotowy</p>
            : <p style={{ ...PX(5), color: 'var(--text-dim)' }}>⏳ <CooldownTimer end={cooldownEnd} /></p>
          }
        </div>
      </div>

      {/* Two opponent cards */}
      {loading && <p style={{ ...PX(6), color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Ładowanie...</p>}
      {!loading && error && <p style={{ ...PX(6), color: 'var(--hp-bright)', textAlign: 'center', padding: 12 }}>{error}</p>}

      {!loading && !error && (
        <>
          {pair ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <ArenaCard entry={pair[0]} canFight={canFight} onChallenge={onChallenge} />
              <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                <p style={{ ...PX(8), color: 'var(--gold-main)', textShadow: '0 0 8px var(--gold-glow)', writingMode: 'vertical-rl' }}>VS</p>
              </div>
              <ArenaCard entry={pair[1]} canFight={canFight} onChallenge={onChallenge} />
            </div>
          ) : (
            <p style={{ ...PX(5), color: 'var(--text-muted)', textAlign: 'center', padding: 16 }}>Za mało graczy w rankingu.</p>
          )}

          <button onClick={reroll} className="btn btn-secondary" style={{ width: '100%', fontSize: 6, padding: '7px' }}>
            🎲 Losuj nowych przeciwników
          </button>
        </>
      )}

      {/* Fight history */}
      <div style={{ borderTop: '1px solid var(--border-dark)', paddingTop: 8 }}>
        <p style={{ ...PX(5), color: 'var(--gold-main)', marginBottom: 8 }}>📜 HISTORIA WALK</p>
        {historyLoading && <p style={{ ...PX(4), color: 'var(--text-muted)', textAlign: 'center', padding: 8 }}>⏳ Ładowanie...</p>}
        {!historyLoading && globalHistory.length === 0 && (
          <p style={{ ...PX(4), color: 'var(--text-muted)', textAlign: 'center', padding: 8 }}>Brak walk. Zacznij pierwszy!</p>
        )}
        {!historyLoading && globalHistory.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {globalHistory.map((r, i) => {
              const isMe = r.attackerUid === user?.uid || r.defenderUid === user?.uid;
              const meWon = (r.attackerUid === user?.uid && r.attackerWon) || (r.defenderUid === user?.uid && !r.attackerWon);
              return (
                <div key={i} style={{
                  background: isMe ? 'rgba(28,20,8,0.5)' : 'var(--bg-inset)',
                  border: `1px solid ${isMe ? 'var(--gold-darker)' : 'var(--border-dark)'}`,
                  padding: '6px 8px', display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span style={{ ...PX(6), color: r.attackerWon ? '#6aaa30' : 'var(--hp-bright)', flexShrink: 0 }}>
                    {r.attackerWon ? '⚔' : '💀'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ ...PX(5), color: 'var(--text-bright)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{ color: r.attackerWon ? '#6aaa30' : 'var(--hp-bright)' }}>{r.attackerHeroName}</span>
                      <span style={{ color: 'var(--text-muted)' }}> vs </span>
                      <span style={{ color: r.attackerWon ? 'var(--hp-bright)' : '#6aaa30' }}>{r.defenderHeroName}</span>
                    </p>
                    <p style={{ ...PX(4), color: 'var(--text-muted)' }}>{r.attackerUsername} vs {r.defenderUsername} · {formatTimeAgo(r.timestamp)}</p>
                  </div>
                  {isMe && <span style={{ ...PX(4), color: meWon ? '#6aaa30' : 'var(--hp-bright)', flexShrink: 0 }}>{meWon ? 'WIN' : 'LOSS'}</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PvpPanel() {
  const hero = useGameStore(s => s.hero);
  const lastPvpFight = useGameStore(s => s.lastPvpFight);
  const recordPvpResult = useGameStore(s => s.recordPvpResult);
  const user = useAuthStore(s => s.user);

  const [combat, setCombat] = useState<CombatState | null>(null);
  const [resultRecorded, setResultRecorded] = useState(false);
  const [arenaKey, setArenaKey] = useState(0);

  function startCombat(entry: LeaderboardEntry) {
    if (Date.now() - lastPvpFight < PVP_COOLDOWN) return;
    const oppAtk = entry.attack ?? (10 + entry.level * 3);
    const oppDef = entry.defense ?? (5 + entry.level * 2);
    const oppMaxHp = entry.maxHp ?? getHeroMaxHp({ strength: 5, dexterity: 5, intelligence: 5, vitality: 5, magic: 4, magicResistance: 4 }, entry.level);

    const state: CombatState = {
      opponent: {
        uid: entry.uid,
        heroName: entry.heroName,
        username: entry.username,
        level: entry.level,
        attack: oppAtk,
        defense: oppDef,
        maxHp: oppMaxHp,
        portrait: resolvePortrait(entry.portrait, entry.username),
      },
      oppPortrait: resolvePortrait(entry.portrait, entry.username),
      heroHp: hero.maxHp,
      heroMaxHp: hero.maxHp,
      oppHp: oppMaxHp,
      oppMaxHp,
      heroAtk: getHeroAttack(hero),
      heroDef: getHeroDefense(hero),
      oppAtk,
      oppDef,
      heroCritChance: 0.10 + hero.stats.dexterity * 0.005,
      oppCritChance: 0.10 + entry.level * 0.003,
      log: [{ message: `⚔ Walka z ${entry.heroName} (POZ.${entry.level}) rozpoczęta!`, type: 'system', timestamp: Date.now() }],
      done: false,
      won: null,
      xpGained: 0,
      goldGained: 0,
    };
    setCombat(state);
    setResultRecorded(false);
  }

  function handleAttack() {
    if (!combat || combat.done) return;

    const newLog = [...combat.log];
    let { heroHp, oppHp } = combat;

    const { damage: heroDmg, isCrit: heroCrit } = pvpHit(combat.heroAtk, combat.oppDef, combat.heroCritChance);
    oppHp = Math.max(0, oppHp - heroDmg);
    newLog.unshift({ message: `Atakujesz ${combat.opponent.heroName} za ${heroDmg}!${heroCrit ? ' 💥 KRYT!' : ''} (${oppHp}/${combat.oppMaxHp} HP)`, type: 'hero', timestamp: Date.now() });

    if (oppHp <= 0) {
      if (!resultRecorded) {
        setResultRecorded(true);
        const result = recordPvpResult(true, combat.opponent);
        newLog.unshift({ message: `🏆 Pokonałeś ${combat.opponent.heroName}! +${result.xpGained}XP +${result.goldGained}🪙`, type: 'loot', timestamp: Date.now() });
        setCombat({ ...combat, oppHp: 0, heroHp, log: newLog, done: true, won: true, xpGained: result.xpGained, goldGained: result.goldGained });
        if (user) {
          addPvpFight({
            attackerUid: user.uid, attackerUsername: user.username, attackerHeroName: hero.name, attackerLevel: hero.level,
            defenderUid: combat.opponent.uid, defenderUsername: combat.opponent.username, defenderHeroName: combat.opponent.heroName, defenderLevel: combat.opponent.level,
            attackerWon: true, timestamp: Date.now(),
          }).catch(() => {});
          syncToCloud(user.uid, user.username).catch(() => {});
        }
      }
      return;
    }

    const { damage: oppDmg, isCrit: oppCrit } = pvpHit(combat.oppAtk, combat.heroDef, combat.oppCritChance);
    heroHp = Math.max(0, heroHp - oppDmg);
    newLog.unshift({ message: `${combat.opponent.heroName} atakuje za ${oppDmg}!${oppCrit ? ' 💥 KRYT!' : ''} (${heroHp}/${combat.heroMaxHp} HP)`, type: 'enemy', timestamp: Date.now() });

    if (heroHp <= 0) {
      if (!resultRecorded) {
        setResultRecorded(true);
        const result = recordPvpResult(false, combat.opponent);
        newLog.unshift({ message: `💀 Przegrałeś z ${combat.opponent.heroName}. +${result.xpGained}XP`, type: 'system', timestamp: Date.now() });
        setCombat({ ...combat, oppHp, heroHp: 0, log: newLog, done: true, won: false, xpGained: result.xpGained, goldGained: 0 });
        if (user) {
          addPvpFight({
            attackerUid: user.uid, attackerUsername: user.username, attackerHeroName: hero.name, attackerLevel: hero.level,
            defenderUid: combat.opponent.uid, defenderUsername: combat.opponent.username, defenderHeroName: combat.opponent.heroName, defenderLevel: combat.opponent.level,
            attackerWon: false, timestamp: Date.now(),
          }).catch(() => {});
          syncToCloud(user.uid, user.username).catch(() => {});
        }
      }
      return;
    }

    setCombat({ ...combat, oppHp, heroHp, log: newLog });
  }

  function handleAutoFight() {
    if (!combat || combat.done || resultRecorded) return;

    let { heroHp, oppHp } = combat;
    const newLog = [...combat.log];

    for (let i = 0; i < 500; i++) {
      const { damage: heroDmg } = pvpHit(combat.heroAtk, combat.oppDef, combat.heroCritChance);
      oppHp = Math.max(0, oppHp - heroDmg);
      if (oppHp <= 0) break;
      const { damage: oppDmg } = pvpHit(combat.oppAtk, combat.heroDef, combat.oppCritChance);
      heroHp = Math.max(0, heroHp - oppDmg);
      if (heroHp <= 0) break;
    }

    const won = oppHp <= 0 || (heroHp > 0 && heroHp / combat.heroMaxHp >= oppHp / combat.oppMaxHp);
    setResultRecorded(true);
    const result = recordPvpResult(won, combat.opponent);

    if (won) {
      newLog.unshift({ message: `🏆 Pokonałeś ${combat.opponent.heroName}! (szybka walka) +${result.xpGained}XP +${result.goldGained}🪙`, type: 'loot', timestamp: Date.now() });
    } else {
      newLog.unshift({ message: `💀 Przegrałeś z ${combat.opponent.heroName}. (szybka walka) +${result.xpGained}XP`, type: 'system', timestamp: Date.now() });
    }

    if (user) {
      addPvpFight({
        attackerUid: user.uid, attackerUsername: user.username, attackerHeroName: hero.name, attackerLevel: hero.level,
        defenderUid: combat.opponent.uid, defenderUsername: combat.opponent.username, defenderHeroName: combat.opponent.heroName, defenderLevel: combat.opponent.level,
        attackerWon: won, timestamp: Date.now(),
      }).catch(() => {});
      syncToCloud(user.uid, user.username).catch(() => {});
    }

    setCombat({ ...combat, heroHp: Math.max(0, heroHp), oppHp: Math.max(0, oppHp), log: newLog, done: true, won, xpGained: result.xpGained, goldGained: result.goldGained });
  }

  return (
    <div className="card p-3">
      {combat
        ? <PvpCombat combat={combat} onAttack={handleAttack} onAutoFight={handleAutoFight} onExit={() => { setCombat(null); setResultRecorded(false); setArenaKey(k => k + 1); }} />
        : <ArenaList key={arenaKey} onChallenge={startCombat} />
      }
    </div>
  );
}
