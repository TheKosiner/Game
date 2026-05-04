import { useEffect, useState } from 'react';
import { getLeaderboard, type LeaderboardEntry } from '../lib/cloudSync';
import { useAuthStore } from '../store/authStore';
import PixelSprite from './PixelSprite';
import { SPRITE_WARRIOR, getHeroPalette } from '../data/sprites';
const RANK_COLORS = ['#ffd700', '#c0c0c0', '#cd7f32'];
const PX = (s: number) => ({ fontFamily: "'Press Start 2P', monospace", fontSize: s } as const);

export default function LeaderboardPanel() {
  const user = useAuthStore(s => s.user);

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function fetchLeaderboard() {
    setLoading(true); setError('');
    try { setEntries(await getLeaderboard()); }
    catch { setError('Błąd połączenia z serwerem'); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchLeaderboard(); }, []);

  const myRank = entries.findIndex(e => e.uid === user?.uid) + 1;

  return (
    <div className="card p-3" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ ...PX(8), color: 'var(--gold-main)', textShadow: '0 0 10px var(--gold-glow)' }}>👑 RANKING</p>
        <button onClick={fetchLeaderboard} className="btn btn-secondary" style={{ fontSize: 5, padding: '4px 8px' }}>↻ ODŚWIEŻ</button>
      </div>

      {myRank > 0 && (
        <div style={{ background: 'rgba(28,20,8,0.8)', border: '1px solid var(--gold-darker)', padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ ...PX(5), color: 'var(--text-dim)' }}>TWOJE MIEJSCE</p>
          <p style={{ ...PX(10), color: 'var(--gold-bright)' }}>#{myRank}</p>
        </div>
      )}

      {loading && <p style={{ ...PX(6), color: 'var(--text-muted)', textAlign: 'center', padding: 16 }}>⏳ Ładowanie...</p>}
      {!loading && error && <p style={{ ...PX(6), color: 'var(--hp-bright)', textAlign: 'center', padding: 12 }}>{error}</p>}
      {!loading && !error && entries.length === 0 && <p style={{ ...PX(6), color: 'var(--text-muted)', textAlign: 'center', padding: 16 }}>Brak graczy. Bądź pierwszy!</p>}

      {!loading && entries.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {entries.map((entry, i) => {
            const rank = i + 1;
            const isMe = entry.uid === user?.uid;
            const sprite = SPRITE_WARRIOR;
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
                  <p style={{ ...PX(4), color: 'var(--text-muted)', marginBottom: 1 }}>
                    {entry.heroName}
                  </p>
                  {(entry.pvpWins !== undefined || entry.pvpLosses !== undefined) && (
                    <p style={{ ...PX(4), color: 'var(--text-muted)' }}>
                      ⚔ {entry.pvpWins ?? 0}W / {entry.pvpLosses ?? 0}L
                    </p>
                  )}
                </div>

                <p style={{ ...PX(8), color: 'var(--gold-bright)', flexShrink: 0 }}>POZ.{entry.level}</p>
              </div>
            );
          })}
        </div>
      )}

      <p style={{ ...PX(4), color: 'var(--text-muted)', textAlign: 'center' }}>Top 50 · zapis co 30s</p>
    </div>
  );
}
