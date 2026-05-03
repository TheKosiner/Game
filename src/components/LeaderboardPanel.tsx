import { useEffect, useState } from 'react';
import { getLeaderboard, type LeaderboardEntry } from '../lib/cloudSync';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import { PVP_COOLDOWN } from '../store/gameStore';
import PixelSprite from './PixelSprite';
import { SPRITE_WARRIOR, SPRITE_MAGE, SPRITE_ROGUE, getHeroPalette } from '../data/sprites';
import type { PvpResult } from '../types';

const CLASS_SPRITES = { warrior: SPRITE_WARRIOR, mage: SPRITE_MAGE, rogue: SPRITE_ROGUE };
const CLASS_NAME: Record<string, string> = { warrior: 'Wojownik', mage: 'Mag', rogue: 'Łotrzyk' };
const RANK_COLORS = ['#ffd700', '#c0c0c0', '#cd7f32'];

function CooldownTimer({ end }: { end: number }) {
  const [rem, setRem] = useState(Math.max(0, end - Date.now()));
  useEffect(() => {
    const id = setInterval(() => { const r = Math.max(0, end - Date.now()); setRem(r); if (!r) clearInterval(id); }, 1000);
    return () => clearInterval(id);
  }, [end]);
  const m = Math.floor(rem / 60000);
  const s = Math.floor((rem % 60000) / 1000);
  return <span style={{ color: '#f87171', textShadow: '0 0 6px rgba(248,113,113,0.6)' }}>{m}:{s.toString().padStart(2,'0')}</span>;
}

function ResultBanner({ result, onClose }: { result: PvpResult; onClose: () => void }) {
  return (
    <div style={{
      background: result.won ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
      border: `1px solid ${result.won ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.4)'}`,
      borderRadius: 4, padding: '10px 12px',
      boxShadow: result.won ? '0 0 20px rgba(34,197,94,0.15)' : '0 0 20px rgba(239,68,68,0.1)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ color: result.won ? '#4ade80' : '#f87171', fontSize: 9, marginBottom: 4 }}>
            {result.won ? '⚔️ ZWYCIĘSTWO!' : '💀 PORAŻKA'}
          </p>
          <p style={{ color: '#64748b', fontSize: 6, marginBottom: 3 }}>
            vs {result.opponentName}
          </p>
          <p style={{ color: '#fbbf24', fontSize: 7 }}>
            +{result.xpGained} XP{result.goldGained > 0 ? `  +${result.goldGained} 🪙` : ''}
          </p>
        </div>
        <button onClick={onClose} style={{ color: '#334155', background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, fontFamily: 'monospace' }}>✕</button>
      </div>
    </div>
  );
}

export default function LeaderboardPanel() {
  const user = useAuthStore(s => s.user);
  const pvpWins = useGameStore(s => s.pvpWins);
  const pvpLosses = useGameStore(s => s.pvpLosses);
  const lastPvpFight = useGameStore(s => s.lastPvpFight);
  const pvpLog = useGameStore(s => s.pvpLog);
  const performPvp = useGameStore(s => s.performPvp);

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [latestResult, setLatestResult] = useState<PvpResult | null>(null);
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

  function handleChallenge(entry: LeaderboardEntry) {
    const result = performPvp({
      uid: entry.uid,
      heroName: entry.heroName,
      username: entry.username,
      level: entry.level,
      attack: entry.attack,
      defense: entry.defense,
      maxHp: entry.maxHp,
    });
    if (result) setLatestResult(result);
  }

  return (
    <div className="card p-3" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: 10, background: 'linear-gradient(90deg, #f59e0b, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          🏆 ARENA PvP
        </p>
        <button onClick={fetchLeaderboard} className="btn btn-secondary" style={{ fontSize: 6, padding: '4px 8px' }}>↻ ODŚWIEŻ</button>
      </div>

      {/* PvP stats + cooldown */}
      <div style={{
        background: 'rgba(5,8,20,0.8)',
        border: '1px solid rgba(30,41,59,0.8)',
        borderRadius: 4, padding: '8px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
      }}>
        <div style={{ display: 'flex', gap: 14 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#4ade80', fontSize: 11 }}>{pvpWins}</p>
            <p style={{ color: '#475569', fontSize: 5 }}>WYGRANE</p>
          </div>
          <div style={{ color: '#1e293b', fontSize: 14, alignSelf: 'center' }}>|</div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#f87171', fontSize: 11 }}>{pvpLosses}</p>
            <p style={{ color: '#475569', fontSize: 5 }}>PRZEGRANE</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {canFight
            ? <p style={{ color: '#22c55e', fontSize: 7 }}>⚔️ Gotowy do walki</p>
            : <p style={{ color: '#64748b', fontSize: 6 }}>⏳ Cooldown: <CooldownTimer end={cooldownEnd} /></p>
          }
        </div>
      </div>

      {/* Latest fight result */}
      {latestResult && <ResultBanner result={latestResult} onClose={() => setLatestResult(null)} />}

      {/* My rank */}
      {myRank > 0 && (
        <div style={{ background: 'rgba(28,20,8,0.8)', border: '1px solid rgba(217,119,6,0.4)', borderRadius: 4, padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ color: '#64748b', fontSize: 6 }}>TWOJE MIEJSCE</p>
          <p style={{ color: '#fbbf24', fontSize: 11 }}>#{myRank}</p>
        </div>
      )}

      {/* Loading / error / empty */}
      {loading && <p style={{ color: '#475569', fontSize: 7, textAlign: 'center', padding: 16 }}>⏳ Ładowanie...</p>}
      {!loading && error && <p style={{ color: '#f87171', fontSize: 7, textAlign: 'center', padding: 12 }}>{error}</p>}
      {!loading && !error && entries.length === 0 && <p style={{ color: '#334155', fontSize: 7, textAlign: 'center', padding: 16 }}>Brak graczy. Bądź pierwszy!</p>}

      {/* Entries */}
      {!loading && entries.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {entries.map((entry, i) => {
            const rank = i + 1;
            const isMe = entry.uid === user?.uid;
            const sprite = CLASS_SPRITES[entry.heroClass as keyof typeof CLASS_SPRITES];
            const rankColor = rank <= 3 ? RANK_COLORS[rank - 1] : '#334155';
            const palette = getHeroPalette(entry.skinTone ?? 1, entry.hairColor ?? 2);

            return (
              <div key={entry.uid} style={{
                background: isMe ? 'rgba(28,20,8,0.7)' : 'rgba(5,8,20,0.7)',
                border: `1px solid ${isMe ? 'rgba(217,119,6,0.4)' : 'rgba(30,41,59,0.7)'}`,
                borderRadius: 4, padding: '7px 8px',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                {/* Rank */}
                <div style={{ minWidth: 22, textAlign: 'center', flexShrink: 0 }}>
                  {rank <= 3
                    ? <span style={{ fontSize: 13 }}>{['🥇','🥈','🥉'][rank-1]}</span>
                    : <p style={{ color: rankColor, fontSize: 6 }}>#{rank}</p>
                  }
                </div>

                {/* Sprite */}
                {sprite && (
                  <div style={{ background: 'rgba(5,8,20,0.9)', border: `1px solid ${isMe ? 'rgba(217,119,6,0.3)' : 'rgba(30,41,59,0.8)'}`, borderRadius: 3, padding: 2, flexShrink: 0 }}>
                    <PixelSprite grid={sprite} scale={2} paletteOverrides={palette} />
                  </div>
                )}

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: isMe ? '#fbbf24' : '#cbd5e1', fontSize: 7, marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.username}{isMe ? ' ◀' : ''}
                  </p>
                  <p style={{ color: '#475569', fontSize: 5, marginBottom: 1 }}>
                    {CLASS_NAME[entry.heroClass] ?? entry.heroClass} · {entry.heroName}
                  </p>
                  {(entry.pvpWins !== undefined || entry.pvpLosses !== undefined) && (
                    <p style={{ color: '#334155', fontSize: 5 }}>
                      ⚔ {entry.pvpWins ?? 0}W / {entry.pvpLosses ?? 0}L
                    </p>
                  )}
                </div>

                {/* Level + fight button */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                  <p style={{ color: '#fbbf24', fontSize: 8 }}>POZ.{entry.level}</p>
                  {!isMe && (
                    <button
                      onClick={() => handleChallenge(entry)}
                      disabled={!canFight}
                      style={{
                        background: canFight ? 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(5,8,20,0.9))' : 'rgba(15,23,42,0.5)',
                        border: `1px solid ${canFight ? 'rgba(239,68,68,0.5)' : 'rgba(30,41,59,0.5)'}`,
                        borderRadius: 3, padding: '3px 6px',
                        color: canFight ? '#f87171' : '#334155',
                        fontFamily: "'Press Start 2P', monospace",
                        fontSize: 5, cursor: canFight ? 'pointer' : 'not-allowed',
                        transition: 'all 0.15s',
                      }}
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

      {/* PvP log */}
      {pvpLog.length > 0 && (
        <div style={{ borderTop: '1px solid rgba(30,41,59,0.6)', paddingTop: 8 }}>
          <p style={{ color: '#334155', fontSize: 5, marginBottom: 6 }}>HISTORIA WALK</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {pvpLog.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 6 }}>
                <span style={{ color: r.won ? '#4ade80' : '#f87171' }}>{r.won ? '✓' : '✗'}</span>
                <span style={{ color: '#475569', flex: 1 }}>vs {r.opponentName}</span>
                <span style={{ color: r.won ? '#fbbf24' : '#334155' }}>
                  {r.won ? `+${r.xpGained}XP +${r.goldGained}🪙` : `+${r.xpGained}XP`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p style={{ color: '#1e293b', fontSize: 5, textAlign: 'center' }}>Top 50 · cooldown 15 min · zapis auto</p>
    </div>
  );
}
