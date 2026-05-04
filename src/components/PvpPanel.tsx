import { useEffect, useState } from 'react';
import { getLeaderboard, type LeaderboardEntry } from '../lib/cloudSync';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import { PVP_COOLDOWN } from '../store/gameStore';
import PixelSprite from './PixelSprite';
import { SPRITE_WARRIOR, SPRITE_MAGE, SPRITE_ROGUE, getHeroPalette } from '../data/sprites';
import type { PvpOpponent, CombatLog } from '../types';
import { getHeroAttack, getHeroDefense, getHeroMaxHp } from '../utils/combat';

const CLASS_SPRITES = { warrior: SPRITE_WARRIOR, mage: SPRITE_MAGE, rogue: SPRITE_ROGUE };
const CLASS_NAME: Record<string, string> = { warrior: 'Wojownik', mage: 'Mag', rogue: 'Łotrzyk' };
const RANK_COLORS = ['#ffd700', '#c0c0c0', '#cd7f32'];
const PX = (s: number) => ({ fontFamily: "'Press Start 2P', monospace", fontSize: s } as const);
const LOG_COLORS = { hero: '#5a9040', enemy: '#903040', loot: '#9c7a3c', system: '#7a7060' };

interface CombatState {
  opponent: PvpOpponent;
  oppSprite: string[][] | undefined;
  heroHp: number;
  heroMaxHp: number;
  oppHp: number;
  oppMaxHp: number;
  heroAtk: number;
  heroDef: number;
  oppAtk: number;
  oppDef: number;
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

function PvpCombat({ combat, onAttack, onExit }: {
  combat: CombatState;
  onAttack: () => void;
  onExit: () => void;
}) {
  const hero = useGameStore(s => s.hero);
  const heroPalette = getHeroPalette(hero.skinTone, hero.hairColor);
  const heroSprite = CLASS_SPRITES[hero.class as keyof typeof CLASS_SPRITES];

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
          {combat.oppSprite ? (
            <div style={{ background: 'var(--bg-deep)', border: '1px solid rgba(80,20,20,0.5)', padding: 4, flexShrink: 0 }}>
              <PixelSprite grid={combat.oppSprite} scale={4} />
            </div>
          ) : (
            <span style={{ fontSize: 32 }}>🧙</span>
          )}
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
            {heroSprite && (
              <div style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-dark)', padding: 2, flexShrink: 0 }}>
                <PixelSprite grid={heroSprite} scale={2} paletteOverrides={heroPalette} />
              </div>
            )}
            <span style={{ ...PX(5), color: 'var(--text-dim)' }}>{hero.name}</span>
          </div>
          <span style={{ ...PX(5), color: 'var(--text-dim)' }}>{Math.max(0, combat.heroHp)}/{combat.heroMaxHp} HP</span>
        </div>
        <div className="pixel-bar">
          <div className="pixel-bar-fill hp-fill" style={{ width: `${heroHpPct}%`, transition: 'width 0.3s ease' }} />
        </div>
      </div>

      {!combat.done ? (
        <button onClick={onAttack} className="btn btn-primary" style={{ width: '100%', fontSize: 7 }}>⚔ Atakuj!</button>
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

function ArenaList({ onChallenge }: { onChallenge: (e: LeaderboardEntry) => void }) {
  const user = useAuthStore(s => s.user);
  const pvpWins = useGameStore(s => s.pvpWins);
  const pvpLosses = useGameStore(s => s.pvpLosses);
  const lastPvpFight = useGameStore(s => s.lastPvpFight);
  const pvpLog = useGameStore(s => s.pvpLog);

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  async function fetchLeaderboard() {
    setLoading(true); setError('');
    try { setEntries(await getLeaderboard()); }
    catch { setError('Błąd połączenia z serwerem'); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchLeaderboard(); }, []);

  const myRank = entries.findIndex(e => e.uid === user?.uid) + 1;
  const cooldownEnd = lastPvpFight + PVP_COOLDOWN;
  const canFight = now >= cooldownEnd;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ ...PX(8), color: 'var(--gold-main)', textShadow: '0 0 10px var(--gold-glow)' }}>⚔ ARENA PvP</p>
        <button onClick={fetchLeaderboard} className="btn btn-secondary" style={{ fontSize: 5, padding: '4px 8px' }}>↻</button>
      </div>

      {/* Stats + cooldown */}
      <div style={{
        background: 'var(--bg-inset)', border: '1px solid var(--border-dark)',
        padding: '8px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
      }}>
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
          {canFight
            ? <p style={{ ...PX(6), color: '#6aaa30' }}>✓ Gotowy do walki</p>
            : <p style={{ ...PX(5), color: 'var(--text-dim)' }}>⏳ <CooldownTimer end={cooldownEnd} /></p>
          }
        </div>
      </div>

      {myRank > 0 && (
        <div style={{ background: 'rgba(28,20,8,0.8)', border: '1px solid var(--gold-darker)', padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ ...PX(5), color: 'var(--text-dim)' }}>TWOJE MIEJSCE</p>
          <p style={{ ...PX(10), color: 'var(--gold-bright)' }}>#{myRank}</p>
        </div>
      )}

      {loading && <p style={{ ...PX(6), color: 'var(--text-muted)', textAlign: 'center', padding: 16 }}>⏳ Ładowanie...</p>}
      {!loading && error && <p style={{ ...PX(6), color: 'var(--hp-bright)', textAlign: 'center', padding: 12 }}>{error}</p>}
      {!loading && !error && entries.length === 0 && <p style={{ ...PX(6), color: 'var(--text-muted)', textAlign: 'center', padding: 16 }}>Brak graczy.</p>}

      {!loading && entries.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {entries.map((entry, i) => {
            const rank = i + 1;
            const isMe = entry.uid === user?.uid;
            const sprite = CLASS_SPRITES[entry.heroClass as keyof typeof CLASS_SPRITES];
            const rankColor = rank <= 3 ? RANK_COLORS[rank - 1] : 'var(--text-dim)';
            const palette = getHeroPalette(entry.skinTone ?? 1, entry.hairColor ?? 2);

            return (
              <div key={entry.uid} style={{
                background: isMe ? 'rgba(28,20,8,0.7)' : 'var(--bg-inset)',
                border: `1px solid ${isMe ? 'var(--gold-darker)' : 'var(--border-dark)'}`,
                padding: '7px 8px',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <div style={{ minWidth: 22, textAlign: 'center', flexShrink: 0 }}>
                  {rank <= 3
                    ? <span style={{ fontSize: 13 }}>{['🥇','🥈','🥉'][rank-1]}</span>
                    : <p style={{ ...PX(5), color: rankColor }}>#{rank}</p>
                  }
                </div>

                {sprite && (
                  <div style={{ background: 'var(--bg-deep)', border: `1px solid ${isMe ? 'var(--gold-darker)' : 'var(--border-dark)'}`, padding: 2, flexShrink: 0 }}>
                    <PixelSprite grid={sprite} scale={2} paletteOverrides={palette} />
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ ...PX(6), color: isMe ? 'var(--gold-bright)' : 'var(--text-bright)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.username}{isMe ? ' ◀' : ''}
                  </p>
                  <p style={{ ...PX(4), color: 'var(--text-muted)' }}>
                    {CLASS_NAME[entry.heroClass] ?? entry.heroClass} · {entry.heroName}
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                  <p style={{ ...PX(7), color: 'var(--gold-bright)' }}>POZ.{entry.level}</p>
                  {!isMe && (
                    <button
                      onClick={() => onChallenge(entry)}
                      disabled={!canFight}
                      className={canFight ? 'btn btn-danger' : 'btn btn-secondary'}
                      style={{ fontSize: 5, padding: '3px 7px', opacity: canFight ? 1 : 0.5, cursor: canFight ? 'pointer' : 'not-allowed' }}
                    >
                      ⚔ WALCZ
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pvpLog.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border-dark)', paddingTop: 8 }}>
          <p style={{ ...PX(4), color: 'var(--text-muted)', marginBottom: 6 }}>OSTATNIE WALKI</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {pvpLog.slice(0, 8).map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ ...PX(5), color: r.won ? '#6aaa30' : 'var(--hp-bright)' }}>{r.won ? '✓' : '✗'}</span>
                <span style={{ ...PX(4), color: 'var(--text-dim)', flex: 1 }}>vs {r.opponentName}</span>
                <span style={{ ...PX(4), color: r.won ? 'var(--gold-bright)' : 'var(--text-muted)' }}>
                  {r.won ? `+${r.xpGained}XP +${r.goldGained}🪙` : `+${r.xpGained}XP`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PvpPanel() {
  const hero = useGameStore(s => s.hero);
  const lastPvpFight = useGameStore(s => s.lastPvpFight);
  const recordPvpResult = useGameStore(s => s.recordPvpResult);

  const [combat, setCombat] = useState<CombatState | null>(null);
  const [resultRecorded, setResultRecorded] = useState(false);

  function startCombat(entry: LeaderboardEntry) {
    if (Date.now() - lastPvpFight < PVP_COOLDOWN) return;
    const oppAtk = entry.attack ?? (10 + entry.level * 3);
    const oppDef = entry.defense ?? (5 + entry.level * 2);
    const oppMaxHp = entry.maxHp ?? getHeroMaxHp({ strength: 5, agility: 5, intelligence: 5, constitution: 5 }, entry.level);

    const sprite = CLASS_SPRITES[entry.heroClass as keyof typeof CLASS_SPRITES];

    const state: CombatState = {
      opponent: {
        uid: entry.uid,
        heroName: entry.heroName,
        username: entry.username,
        level: entry.level,
        attack: oppAtk,
        defense: oppDef,
        maxHp: oppMaxHp,
      },
      oppSprite: sprite,
      heroHp: hero.maxHp,
      heroMaxHp: hero.maxHp,
      oppHp: oppMaxHp,
      oppMaxHp,
      heroAtk: getHeroAttack(hero),
      heroDef: getHeroDefense(hero),
      oppAtk,
      oppDef,
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

    const heroDmg = Math.max(1, Math.round(combat.heroAtk * (0.85 + Math.random() * 0.3)) - combat.oppDef);
    oppHp = Math.max(0, oppHp - heroDmg);
    newLog.unshift({ message: `Atakujesz ${combat.opponent.heroName} za ${heroDmg}! (${oppHp}/${combat.oppMaxHp} HP)`, type: 'hero', timestamp: Date.now() });

    if (oppHp <= 0) {
      if (!resultRecorded) {
        setResultRecorded(true);
        const result = recordPvpResult(true, combat.opponent);
        newLog.unshift({ message: `🏆 Pokonałeś ${combat.opponent.heroName}! +${result.xpGained}XP +${result.goldGained}🪙`, type: 'loot', timestamp: Date.now() });
        setCombat({ ...combat, oppHp: 0, heroHp, log: newLog, done: true, won: true, xpGained: result.xpGained, goldGained: result.goldGained });
      }
      return;
    }

    const oppDmg = Math.max(1, Math.round(combat.oppAtk * (0.85 + Math.random() * 0.3)) - combat.heroDef);
    heroHp = Math.max(0, heroHp - oppDmg);
    newLog.unshift({ message: `${combat.opponent.heroName} atakuje za ${oppDmg}! (${heroHp}/${combat.heroMaxHp} HP)`, type: 'enemy', timestamp: Date.now() });

    if (heroHp <= 0) {
      if (!resultRecorded) {
        setResultRecorded(true);
        const result = recordPvpResult(false, combat.opponent);
        newLog.unshift({ message: `💀 Przegrałeś z ${combat.opponent.heroName}. +${result.xpGained}XP`, type: 'system', timestamp: Date.now() });
        setCombat({ ...combat, oppHp, heroHp: 0, log: newLog, done: true, won: false, xpGained: result.xpGained, goldGained: 0 });
      }
      return;
    }

    setCombat({ ...combat, oppHp, heroHp, log: newLog });
  }

  return (
    <div className="card p-3">
      {combat
        ? <PvpCombat combat={combat} onAttack={handleAttack} onExit={() => { setCombat(null); setResultRecorded(false); }} />
        : <ArenaList onChallenge={startCombat} />
      }
    </div>
  );
}
