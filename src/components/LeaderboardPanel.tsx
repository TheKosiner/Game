import { useEffect, useState } from 'react';
import { getLeaderboard, type LeaderboardEntry } from '../lib/cloudSync';
import { useAuthStore } from '../store/authStore';
import { portraitSrc, resolvePortrait } from '../data/portraits';

const RANK_COLORS = ['#ffd700', '#c0c0c0', '#cd7f32'];
const PX = (s: number) => ({ fontFamily: "'Press Start 2P', monospace", fontSize: s } as const);
const MONO = { fontFamily: "'Share Tech Mono', monospace" } as const;
const ORB  = { fontFamily: "'Orbitron', monospace", fontWeight: 700 } as const;

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

function PlayerProfile({ entry, rank, onClose }: { entry: LeaderboardEntry; rank: number; onClose: () => void }) {
  const rankColor = rank <= 3 ? RANK_COLORS[rank - 1] : 'var(--text-dim)';
  const atk = entry.attack ?? 0;
  const def = entry.defense ?? 0;
  const hp  = entry.maxHp ?? 0;
  const wins    = entry.pvpWins   ?? 0;
  const losses  = entry.pvpLosses ?? 0;
  const rating  = entry.pvpRating ?? 1000;
  const total   = wins + losses;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

  const maxStat = Math.max(atk, def, hp / 4, 1);

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(10,10,20,0.98), rgba(5,5,15,0.99))',
      border: '1px solid rgba(255,215,0,0.25)',
      padding: 14,
      display: 'flex', flexDirection: 'column', gap: 12,
      boxShadow: '0 0 30px rgba(255,215,0,0.08)',
    }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {rank <= 3
            ? <span style={{ fontSize: 16 }}>{['🥇','🥈','🥉'][rank-1]}</span>
            : <span style={{ ...PX(7), color: rankColor }}>#{rank}</span>
          }
          <span style={{ ...ORB, fontSize: 8, color: 'var(--gold-bright)' }}>PROFIL GRACZA</span>
        </div>
        <button onClick={onClose} style={{ color: 'var(--text-dim)', fontSize: 14, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', fontFamily: 'monospace' }}>✕</button>
      </div>

      {/* portrait + identity */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{
          width: 80, height: 80, overflow: 'hidden', flexShrink: 0,
          border: '2px solid rgba(255,215,0,0.35)',
          boxShadow: '0 0 16px rgba(255,215,0,0.12)',
        }}>
          <img src={portraitSrc(resolvePortrait(entry.portrait, entry.username))} alt="portret" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
          <p style={{ ...ORB, fontSize: 11, color: 'var(--gold-bright)', textShadow: '0 0 8px rgba(255,215,0,0.5)' }}>
            {entry.username}
          </p>
          <p style={{ ...MONO, fontSize: 10, color: 'var(--text-main)' }}>{entry.heroName}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ ...ORB, fontSize: 8, color: '#00f5ff', background: 'rgba(0,245,255,0.08)', border: '1px solid rgba(0,245,255,0.25)', padding: '2px 6px' }}>
              POZ.{entry.level}
            </span>
            {entry.guildTag && (
              <span style={{ ...MONO, fontSize: 9, color: '#00cc66', background: 'rgba(0,204,102,0.1)', border: '1px solid rgba(0,204,102,0.3)', padding: '2px 6px' }}>
                [{entry.guildTag}]
              </span>
            )}
          </div>
        </div>
      </div>

      {/* stats */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <p style={{ ...MONO, fontSize: 9, color: 'var(--text-dim)' }}>STATYSTYKI BOJOWE</p>
        <StatBar label="ATK" value={atk} max={maxStat * 1.2} color="#ff2d78" />
        <StatBar label="OBR" value={def} max={maxStat * 1.2} color="#00f5ff" />
        <StatBar label="HP" value={hp}  max={Math.max(hp, 200)} color="#00ff88" />
      </div>

      {/* pvp */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <p style={{ ...MONO, fontSize: 9, color: 'var(--text-dim)' }}>STATYSTYKI PVP</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.2)', padding: '6px 8px', textAlign: 'center' }}>
            <p style={{ ...ORB, fontSize: 14, color: '#00ff88' }}>{wins}</p>
            <p style={{ ...MONO, fontSize: 8, color: 'var(--text-dim)', marginTop: 2 }}>WYGRANE</p>
          </div>
          <div style={{ flex: 1, background: 'rgba(255,45,120,0.06)', border: '1px solid rgba(255,45,120,0.2)', padding: '6px 8px', textAlign: 'center' }}>
            <p style={{ ...ORB, fontSize: 14, color: '#ff2d78' }}>{losses}</p>
            <p style={{ ...MONO, fontSize: 8, color: 'var(--text-dim)', marginTop: 2 }}>PRZEGRANE</p>
          </div>
          <div style={{ flex: 1, background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.2)', padding: '6px 8px', textAlign: 'center' }}>
            <p style={{ ...ORB, fontSize: 14, color: '#ffd700' }}>{winRate}%</p>
            <p style={{ ...MONO, fontSize: 8, color: 'var(--text-dim)', marginTop: 2 }}>WIN RATE</p>
          </div>
          <div style={{ flex: 1, background: 'rgba(192,132,252,0.06)', border: '1px solid rgba(192,132,252,0.25)', padding: '6px 8px', textAlign: 'center' }}>
            <p style={{ ...ORB, fontSize: 14, color: '#c084fc' }}>{rating}</p>
            <p style={{ ...MONO, fontSize: 8, color: 'var(--text-dim)', marginTop: 2 }}>RANKING</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LeaderboardPanel() {
  const user = useAuthStore(s => s.user);

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<LeaderboardEntry | null>(null);
  const [selectedRank, setSelectedRank] = useState(0);

  async function fetchLeaderboard() {
    setLoading(true); setError('');
    try { setEntries(await getLeaderboard()); }
    catch { setError('Blad polaczenia z serwerem'); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchLeaderboard(); }, []);

  const myRank = entries.findIndex(e => e.uid === user?.uid) + 1;

  function selectEntry(entry: LeaderboardEntry, rank: number) {
    if (selected?.uid === entry.uid) { setSelected(null); return; }
    setSelected(entry);
    setSelectedRank(rank);
  }

  return (
    <div className="card p-3" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ ...PX(8), color: 'var(--gold-main)', textShadow: '0 0 10px var(--gold-glow)' }}>👑 RANKING</p>
        <button onClick={fetchLeaderboard} className="btn btn-secondary" style={{ fontSize: 5, padding: '4px 8px' }}>↻ ODSWIEZ</button>
      </div>

      {myRank > 0 && (
        <div style={{ background: 'rgba(28,20,8,0.8)', border: '1px solid var(--gold-darker)', padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ ...PX(5), color: 'var(--text-dim)' }}>TWOJE MIEJSCE</p>
          <p style={{ ...PX(10), color: 'var(--gold-bright)' }}>#{myRank}</p>
        </div>
      )}

      {selected && (
        <PlayerProfile
          entry={selected}
          rank={selectedRank}
          onClose={() => setSelected(null)}
        />
      )}

      {loading && <p style={{ ...PX(6), color: 'var(--text-muted)', textAlign: 'center', padding: 16 }}>Ladowanie...</p>}
      {!loading && error && <p style={{ ...PX(6), color: 'var(--hp-bright)', textAlign: 'center', padding: 12 }}>{error}</p>}
      {!loading && !error && entries.length === 0 && <p style={{ ...PX(6), color: 'var(--text-muted)', textAlign: 'center', padding: 16 }}>Brak graczy. Badz pierwszy!</p>}

      {!loading && entries.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {entries.map((entry, i) => {
            const rank = i + 1;
            const isMe = entry.uid === user?.uid;
            const isSelected = selected?.uid === entry.uid;
            const rankColor = rank <= 3 ? RANK_COLORS[rank - 1] : 'var(--text-dim)';

            return (
              <div
                key={entry.uid}
                onClick={() => selectEntry(entry, rank)}
                style={{
                  background: isSelected ? 'rgba(255,215,0,0.06)' : isMe ? 'rgba(28,20,8,0.7)' : 'var(--bg-inset)',
                  border: `1px solid ${isSelected ? 'rgba(255,215,0,0.4)' : isMe ? 'var(--gold-darker)' : 'var(--border-dark)'}`,
                  padding: '7px 8px',
                  display: 'flex', alignItems: 'center', gap: 8,
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
              >
                <div style={{ minWidth: 22, textAlign: 'center', flexShrink: 0 }}>
                  {rank <= 3
                    ? <span style={{ fontSize: 13 }}>{['🥇','🥈','🥉'][rank-1]}</span>
                    : <p style={{ ...PX(5), color: rankColor }}>#{rank}</p>
                  }
                </div>

                <div style={{ width: 36, height: 36, overflow: 'hidden', flexShrink: 0, border: `1px solid ${isMe ? 'var(--gold-darker)' : 'var(--border-dark)'}` }}>
                  <img src={portraitSrc(resolvePortrait(entry.portrait, entry.username))} alt="portret" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ ...PX(6), color: isMe ? 'var(--gold-bright)' : 'var(--text-bright)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.username}{isMe ? ' ◀' : ''}
                  </p>
                  <p style={{ ...PX(4), color: 'var(--text-muted)', marginBottom: 1 }}>
                    {entry.heroName}
                  </p>
                  {(entry.pvpWins !== undefined || entry.pvpLosses !== undefined) && (
                    <p style={{ ...PX(4), color: 'var(--text-muted)' }}>
                      {entry.pvpWins ?? 0}W / {entry.pvpLosses ?? 0}L
                    </p>
                  )}
                </div>

                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                  <p style={{ ...PX(7), color: 'var(--gold-bright)' }}>POZ.{entry.level}</p>
                  {entry.pvpRating !== undefined && (
                    <span style={{ ...ORB, fontSize: 7, color: '#c084fc', background: 'rgba(192,132,252,0.1)', border: '1px solid rgba(192,132,252,0.3)', padding: '1px 5px' }}>
                      ⚔ {entry.pvpRating}
                    </span>
                  )}
                  {entry.guildTag && (
                    <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, color: '#00cc66', background: 'rgba(0,204,102,0.1)', border: '1px solid rgba(0,204,102,0.3)', padding: '1px 4px' }}>
                      [{entry.guildTag}]
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p style={{ ...PX(4), color: 'var(--text-muted)', textAlign: 'center' }}>Top 50 · zapis co 30s</p>
    </div>
  );
}
