import { useEffect, useState } from 'react';
import { getLeaderboard, type LeaderboardEntry } from '../lib/cloudSync';
import { useAuthStore } from '../store/authStore';
import PixelSprite from './PixelSprite';
import { SPRITE_WARRIOR, SPRITE_MAGE, SPRITE_ROGUE } from '../data/sprites';

const CLASS_SPRITES = {
  warrior: SPRITE_WARRIOR,
  mage: SPRITE_MAGE,
  rogue: SPRITE_ROGUE,
};

const CLASS_NAME: Record<string, string> = {
  warrior: 'Wojownik',
  mage: 'Mag',
  rogue: 'Łotrzyk',
};

const RANK_COLORS = ['#ffd700', '#c0c0c0', '#cd7f32'];

export default function LeaderboardPanel() {
  const user = useAuthStore(s => s.user);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function fetchLeaderboard() {
    setLoading(true);
    setError('');
    try {
      const data = await getLeaderboard();
      setEntries(data);
    } catch {
      setError('Błąd połączenia z serwerem');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchLeaderboard(); }, []);

  const myRank = entries.findIndex(e => e.uid === user?.uid) + 1;

  return (
    <div className="card p-3" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ color: '#fbbf24', fontSize: 9 }}>🏆 RANKING GRACZY</p>
        <button
          onClick={fetchLeaderboard}
          className="btn btn-secondary"
          style={{ fontSize: 6, padding: '4px 8px' }}
        >
          ↻ ODŚWIEŻ
        </button>
      </div>

      {/* My rank callout */}
      {myRank > 0 && (
        <div style={{ background: '#1c1408', border: '2px solid #d97706', padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ color: '#94a3b8', fontSize: 7 }}>TWOJE MIEJSCE</p>
          <p style={{ color: '#fbbf24', fontSize: 11 }}>#{myRank}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 24 }}>
          <p style={{ color: '#64748b', fontSize: 8 }}>⏳ Ładowanie...</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div style={{ background: '#1c0a0a', border: '2px solid #7f1d1d', padding: 8, textAlign: 'center' }}>
          <p style={{ color: '#f87171', fontSize: 7 }}>{error}</p>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && entries.length === 0 && (
        <div style={{ textAlign: 'center', padding: 24 }}>
          <p style={{ color: '#475569', fontSize: 7 }}>Brak graczy w rankingu.</p>
          <p style={{ color: '#475569', fontSize: 7, marginTop: 6 }}>Bądź pierwszy!</p>
        </div>
      )}

      {/* Entries */}
      {!loading && entries.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {entries.map((entry, i) => {
            const rank = i + 1;
            const isMe = entry.uid === user?.uid;
            const sprite = CLASS_SPRITES[entry.heroClass as keyof typeof CLASS_SPRITES];
            const rankColor = rank <= 3 ? RANK_COLORS[rank - 1] : '#475569';

            return (
              <div
                key={entry.uid}
                style={{
                  background: isMe ? '#1c1408' : '#0a0a1a',
                  border: `2px solid ${isMe ? '#d97706' : rank <= 3 ? '#334155' : '#1e293b'}`,
                  padding: '6px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {/* Rank */}
                <div style={{ minWidth: 24, textAlign: 'center' }}>
                  {rank <= 3
                    ? <span style={{ fontSize: 14 }}>{['🥇', '🥈', '🥉'][rank - 1]}</span>
                    : <p style={{ color: rankColor, fontSize: 7 }}>#{rank}</p>
                  }
                </div>

                {/* Sprite */}
                {sprite ? (
                  <div style={{ background: '#0a0a1a', border: '2px solid #1e293b', padding: 2, flexShrink: 0 }}>
                    <PixelSprite grid={sprite} scale={2} />
                  </div>
                ) : null}

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: isMe ? '#fbbf24' : '#e2e8f0', fontSize: 8, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.username}{isMe ? ' ◀' : ''}
                  </p>
                  <p style={{ color: '#64748b', fontSize: 6 }}>
                    {CLASS_NAME[entry.heroClass] ?? entry.heroClass} — {entry.heroName}
                  </p>
                </div>

                {/* Level */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ color: '#fbbf24', fontSize: 9 }}>POZ.{entry.level}</p>
                  <p style={{ color: '#475569', fontSize: 6 }}>{entry.xp} XP</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p style={{ color: '#1e293b', fontSize: 6, textAlign: 'center' }}>Top 50 graczy • aktualizuje się co zapis</p>
    </div>
  );
}
