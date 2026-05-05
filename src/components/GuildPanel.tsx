import { useEffect, useState } from 'react';
import {
  getMyGuildId, getGuild, getMyInvites, createGuild, inviteToGuild,
  acceptInvite, declineInvite, leaveGuild, disbandGuild, transferLeadership,
  getLeaderboard,
  type Guild, type GuildInvite, type LeaderboardEntry,
} from '../lib/cloudSync';
import TerritoryPanel from './TerritoryPanel';
import { isFirebaseConfigured } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import PixelSprite from './PixelSprite';
import { SPRITE_PORTRAIT, getHeroPalette } from '../data/sprites';
const PX = (s: number) => ({ fontFamily: "'Press Start 2P', monospace", fontSize: s } as const);

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

// ── Create Guild Form ────────────────────────────────────────────────────────

function CreateGuildForm({ onCreated }: { onCreated: () => void }) {
  const user = useAuthStore(s => s.user);
  const hero = useGameStore(s => s.hero);
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate() {
    if (!user) return;
    const trimName = name.trim();
    const trimTag = tag.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (trimName.length < 3) { setError('Nazwa min. 3 znaki'); return; }
    if (trimTag.length < 2 || trimTag.length > 4) { setError('Tag musi mieć 2–4 znaki (A-Z, 0-9)'); return; }
    setLoading(true); setError('');
    try {
      await createGuild(user.uid, user.username, hero.name, hero.level, trimName, trimTag, desc.trim());
      onCreated();
    } catch { setError('Błąd tworzenia gildii'); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ ...PX(8), color: 'var(--gold-main)', textShadow: '0 0 10px var(--gold-glow)' }}>⚔ GILDZIE</p>
      <p style={{ ...PX(5), color: 'var(--text-dim)' }}>Stwórz gildię i zapraszaj sojuszników</p>

      <div style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-dark)', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p style={{ ...PX(5), color: 'var(--gold-main)', marginBottom: 2 }}>✦ ZAŁOŻ GILDIĘ</p>

        <div>
          <p style={{ ...PX(4), color: 'var(--text-muted)', marginBottom: 4 }}>NAZWA</p>
          <input
            value={name} onChange={e => setName(e.target.value)} maxLength={24}
            placeholder="np. Wilcza Wataha"
            style={{ width: '100%', background: 'var(--bg-deep)', border: '1px solid var(--border-main)', color: 'var(--text-bright)', fontFamily: "'Press Start 2P', monospace", fontSize: 7, padding: '7px 8px', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <p style={{ ...PX(4), color: 'var(--text-muted)', marginBottom: 4 }}>TAG [2–4 znaki]</p>
          <input
            value={tag} onChange={e => setTag(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))} maxLength={4}
            placeholder="WW"
            style={{ width: '100%', background: 'var(--bg-deep)', border: '1px solid var(--border-main)', color: 'var(--gold-bright)', fontFamily: "'Press Start 2P', monospace", fontSize: 8, padding: '7px 8px', boxSizing: 'border-box', letterSpacing: '0.1em' }}
          />
        </div>

        <div>
          <p style={{ ...PX(4), color: 'var(--text-muted)', marginBottom: 4 }}>OPIS (opcjonalnie)</p>
          <textarea
            value={desc} onChange={e => setDesc(e.target.value)} maxLength={120}
            placeholder="Jesteśmy..."
            rows={2}
            style={{ width: '100%', background: 'var(--bg-deep)', border: '1px solid var(--border-main)', color: 'var(--text-dim)', fontFamily: "'Press Start 2P', monospace", fontSize: 5, padding: '7px 8px', boxSizing: 'border-box', resize: 'none' }}
          />
        </div>

        {error && <p style={{ ...PX(5), color: 'var(--hp-bright)' }}>{error}</p>}

        <button onClick={handleCreate} disabled={loading} className="btn btn-primary" style={{ fontSize: 6, padding: '9px' }}>
          {loading ? '⏳ Tworzenie...' : '⚔ Stwórz gildię'}
        </button>
      </div>

    </div>
  );
}

// ── Invite List ──────────────────────────────────────────────────────────────

function InvitesList({ invites, onRefresh }: { invites: GuildInvite[]; onRefresh: () => void }) {
  const user = useAuthStore(s => s.user);
  const hero = useGameStore(s => s.hero);
  const [acting, setActing] = useState<string | null>(null);

  async function handleAccept(inv: GuildInvite) {
    if (!user) return;
    setActing(inv.id);
    try {
      await acceptInvite(inv.id, inv.guildId, user.uid, user.username, hero.name, hero.level);
      onRefresh();
    } finally { setActing(null); }
  }

  async function handleDecline(inv: GuildInvite) {
    setActing(inv.id);
    try { await declineInvite(inv.id); onRefresh(); }
    finally { setActing(null); }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p style={{ ...PX(6), color: 'var(--gold-main)', marginBottom: 2 }}>📨 ZAPROSZENIA DO GILDII</p>
      {invites.map(inv => (
        <div key={inv.id} style={{ background: 'var(--bg-inset)', border: '1px solid var(--gold-darker)', padding: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <div>
              <p style={{ ...PX(7), color: 'var(--gold-bright)', marginBottom: 3 }}>[{inv.guildTag}] {inv.guildName}</p>
              <p style={{ ...PX(4), color: 'var(--text-muted)' }}>od {inv.fromUsername}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => handleAccept(inv)} disabled={acting === inv.id} className="btn btn-primary" style={{ flex: 1, fontSize: 5, padding: '6px' }}>
              ✓ Dołącz
            </button>
            <button onClick={() => handleDecline(inv)} disabled={acting === inv.id} className="btn btn-secondary" style={{ flex: 1, fontSize: 5, padding: '6px' }}>
              ✕ Odrzuć
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Guild View ───────────────────────────────────────────────────────────────

function InviteModal({ guild, onClose }: { guild: Guild; onClose: () => void }) {
  const user = useAuthStore(s => s.user);
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sent, setSent] = useState<Set<string>>(new Set());

  useEffect(() => {
    getLeaderboard().then(list => {
      setPlayers(list.filter(p => p.uid !== user?.uid && !guild.members[p.uid]));
      setLoading(false);
    });
  }, []);

  async function handleInvite(entry: LeaderboardEntry) {
    if (!user || !guild) return;
    setSent(s => new Set(s).add(entry.uid));
    try {
      await inviteToGuild(guild.id, guild.name, guild.tag, user.uid, user.username, entry.uid, entry.username);
    } catch { setSent(s => { const n = new Set(s); n.delete(entry.uid); return n; }); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-end' }}
      onClick={onClose}>
      <div style={{ width: '100%', maxWidth: 480, margin: '0 auto', background: 'var(--bg-panel)', border: '1px solid var(--border-main)', padding: 14, maxHeight: '70vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <p style={{ ...PX(6), color: 'var(--gold-main)' }}>📨 ZAPROŚ GRACZA</p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer' }}>✕</button>
        </div>
        {loading && <p style={{ ...PX(5), color: 'var(--text-muted)', textAlign: 'center', padding: 12 }}>⏳ Ładowanie...</p>}
        {!loading && players.length === 0 && <p style={{ ...PX(5), color: 'var(--text-muted)', textAlign: 'center', padding: 12 }}>Brak graczy do zaproszenia</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {players.map(p => {
            const palette = getHeroPalette(p.skinTone ?? 1, p.hairColor ?? 2, p.clothingColor ?? 0);
            const alreadySent = sent.has(p.uid);
            return (
              <div key={p.uid} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-inset)', border: '1px solid var(--border-dark)', padding: '6px 8px' }}>
                <div style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-dark)', padding: 2, flexShrink: 0 }}>
                  <PixelSprite grid={SPRITE_PORTRAIT} scale={2} paletteOverrides={palette} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ ...PX(6), color: 'var(--text-bright)', marginBottom: 1 }}>{p.username}</p>
                  <p style={{ ...PX(4), color: 'var(--text-muted)' }}>POZ.{p.level}</p>
                </div>
                <button
                  onClick={() => handleInvite(p)}
                  disabled={alreadySent}
                  className={alreadySent ? 'btn btn-secondary' : 'btn btn-primary'}
                  style={{ fontSize: 5, padding: '5px 8px', flexShrink: 0, opacity: alreadySent ? 0.6 : 1 }}
                >
                  {alreadySent ? '✓ Wysłano' : '+ Zaproś'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function GuildView({ guild, myUid, onRefresh, onOpenMap }: { guild: Guild; myUid: string; onRefresh: () => void; onOpenMap: () => void }) {
  const [showInvite, setShowInvite] = useState(false);
  const [acting, setActing] = useState(false);
  const isLeader = guild.leaderUid === myUid;
  const members = Object.entries(guild.members).map(([uid, data]) => ({ uid, ...data }))
    .sort((a, b) => (a.role === 'leader' ? -1 : b.role === 'leader' ? 1 : b.level - a.level));
  const memberCount = members.length;

  async function handleLeave() {
    if (isLeader && memberCount > 1) {
      alert('Jesteś liderem. Przekaż przywództwo lub rozwiąż gildię.');
      return;
    }
    if (!confirm(isLeader ? 'Rozwiązać gildię?' : 'Opuścić gildię?')) return;
    setActing(true);
    try {
      if (isLeader) await disbandGuild(guild.id, myUid);
      else await leaveGuild(guild.id, myUid);
      onRefresh();
    } finally { setActing(false); }
  }

  async function handleKick(uid: string, username: string) {
    if (!confirm(`Wyrzucić ${username}?`)) return;
    setActing(true);
    try { await leaveGuild(guild.id, uid); onRefresh(); }
    finally { setActing(false); }
  }

  async function handleTransfer(uid: string, username: string) {
    if (!confirm(`Przekazać przywództwo graczowi ${username}?`)) return;
    setActing(true);
    try { await transferLeadership(guild.id, myUid, uid); onRefresh(); }
    finally { setActing(false); }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {showInvite && <InviteModal guild={guild} onClose={() => setShowInvite(false)} />}

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, rgba(28,20,6,0.97), rgba(20,14,4,0.99))', border: '1px solid var(--gold-darker)', padding: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ ...PX(6), color: 'var(--gold-main)', background: 'rgba(60,40,10,0.6)', border: '1px solid var(--gold-darker)', padding: '2px 6px' }}>[{guild.tag}]</span>
              <p style={{ ...PX(9), color: 'var(--gold-bright)', textShadow: '0 0 10px var(--gold-glow)' }}>{guild.name}</p>
            </div>
            {guild.description && <p style={{ ...PX(4), color: 'var(--text-dim)', marginBottom: 4 }}>{guild.description}</p>}
            <p style={{ ...PX(4), color: 'var(--text-muted)' }}>{memberCount} {memberCount === 1 ? 'członek' : memberCount < 5 ? 'członków' : 'członków'} · założona {formatDate(guild.createdAt)}</p>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{ ...PX(4), color: 'var(--text-muted)', marginBottom: 2 }}>GILDIA XP</p>
            <p style={{ ...PX(8), color: 'var(--gold-bright)' }}>{guild.guildXp}</p>
          </div>
        </div>
      </div>

      {/* Members */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ ...PX(5), color: 'var(--gold-main)' }}>⚔ CZŁONKOWIE</p>
          {isLeader && (
            <button onClick={() => setShowInvite(true)} className="btn btn-primary" style={{ fontSize: 5, padding: '4px 8px' }}>
              + Zaproś
            </button>
          )}
        </div>

        {members.map(m => {
          const isMe = m.uid === myUid;
          return (
            <div key={m.uid} style={{
              background: isMe ? 'rgba(28,20,8,0.7)' : 'var(--bg-inset)',
              border: `1px solid ${m.role === 'leader' ? 'var(--gold-darker)' : 'var(--border-dark)'}`,
              padding: '7px 8px',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <div style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-dark)', padding: 2, flexShrink: 0 }}>
                <PixelSprite grid={SPRITE_PORTRAIT} scale={2} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                  <p style={{ ...PX(6), color: m.role === 'leader' ? 'var(--gold-bright)' : 'var(--text-bright)' }}>
                    {m.role === 'leader' ? '👑 ' : ''}{m.username}{isMe ? ' ◀' : ''}
                  </p>
                </div>
                <p style={{ ...PX(4), color: 'var(--text-muted)' }}>
                  {m.heroName} · POZ.{m.level}
                </p>
              </div>
              {isLeader && !isMe && (
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button onClick={() => handleTransfer(m.uid, m.username)} disabled={acting} className="btn btn-secondary" style={{ fontSize: 4, padding: '3px 5px' }} title="Przekaż przywództwo">👑</button>
                  <button onClick={() => handleKick(m.uid, m.username)} disabled={acting} className="btn btn-danger" style={{ fontSize: 4, padding: '3px 5px' }} title="Wyrzuć">✕</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Territory map */}
      <button onClick={onOpenMap} className="btn btn-primary" style={{ width: '100%', fontSize: 6, padding: '10px' }}>
        🗺 MAPA TERYTORIÓW
      </button>

      {/* Leave / disband */}
      <button
        onClick={handleLeave}
        disabled={acting}
        className="btn btn-danger"
        style={{ width: '100%', fontSize: 6, padding: '8px' }}
      >
        {isLeader ? '💀 Rozwiąż gildię' : '🚪 Opuść gildię'}
      </button>
    </div>
  );
}

// ── Main Panel ───────────────────────────────────────────────────────────────

export default function GuildPanel() {
  const user = useAuthStore(s => s.user);

  const [guild, setGuild] = useState<Guild | null>(null);
  const [invites, setInvites] = useState<GuildInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'guild' | 'territory'>('guild');

  async function load() {
    if (!user || !isFirebaseConfigured) { setLoading(false); return; }
    setLoading(true);
    try {
      const [guildId, myInvites] = await Promise.all([
        getMyGuildId(user.uid),
        getMyInvites(user.uid),
      ]);
      setInvites(myInvites);
      if (guildId) {
        const g = await getGuild(guildId);
        setGuild(g);
      } else {
        setGuild(null);
      }
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [user?.uid]);

  if (!isFirebaseConfigured || !user) {
    return (
      <div className="card p-3">
        <p style={{ ...PX(8), color: 'var(--gold-main)', textShadow: '0 0 10px var(--gold-glow)', marginBottom: 10 }}>⚔ GILDIE</p>
        <div style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-dark)', padding: 16, textAlign: 'center' }}>
          <p style={{ ...PX(6), color: 'var(--text-muted)' }}>Wymagane konto gracza</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card p-3">
        <p style={{ ...PX(6), color: 'var(--text-muted)', textAlign: 'center', padding: 24 }}>⏳ Ładowanie...</p>
      </div>
    );
  }

  if (view === 'territory') {
    return (
      <div className="card p-3">
        <TerritoryPanel guild={guild} onBack={() => setView('guild')} />
      </div>
    );
  }

  return (
    <div className="card p-3">
      {guild ? (
        <GuildView guild={guild} myUid={user.uid} onRefresh={load} onOpenMap={() => setView('territory')} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {invites.length > 0 && <InvitesList invites={invites} onRefresh={load} />}
          <CreateGuildForm onCreated={load} />
          <button onClick={() => setView('territory')} className="btn btn-secondary" style={{ width: '100%', fontSize: 6, padding: '9px' }}>
            🗺 Mapa terytoriów
          </button>
        </div>
      )}
    </div>
  );
}
