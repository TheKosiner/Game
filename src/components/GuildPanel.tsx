import { useEffect, useState } from 'react';
import {
  getMyGuildId, getGuild, getMyInvites, createGuild, inviteToGuild, getGuildSentInvites,
  acceptInvite, declineInvite, leaveGuild, disbandGuild, transferLeadership,
  getLeaderboard,
  type Guild, type GuildInvite, type LeaderboardEntry,
} from '../lib/cloudSync';
import TerritoryPanel from './TerritoryPanel';
import GuildChat from './GuildChat';
import GuildBossPanel from './GuildBossPanel';
import { isFirebaseConfigured } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import { useT } from '../hooks/useT';
const PX = (s: number) => ({ fontFamily: "'Press Start 2P', monospace", fontSize: s } as const);
import { portraitSrc, resolvePortrait } from '../data/portraits';

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

// ── Create Guild Form ────────────────────────────────────────────────────────

function CreateGuildForm({ onCreated }: { onCreated: () => void }) {
  const user = useAuthStore(s => s.user);
  const hero = useGameStore(s => s.hero);
  const t = useT();
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate() {
    if (!user) return;
    const trimName = name.trim();
    const trimTag = tag.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (trimName.length < 3) { setError(t.guild.nameError); return; }
    if (trimTag.length < 2 || trimTag.length > 4) { setError(t.guild.tagError); return; }
    setLoading(true); setError('');
    try {
      await createGuild(user.uid, user.username, hero.name, hero.level, trimName, trimTag, desc.trim(), hero.portrait);
      onCreated();
    } catch { setError(t.guild.createError); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ ...PX(8), color: 'var(--gold-main)', textShadow: '0 0 10px var(--gold-glow)' }}>{t.guild.title}</p>
      <p style={{ ...PX(5), color: 'var(--text-dim)' }}>{t.guild.noGuildDesc}</p>

      <div style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-dark)', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p style={{ ...PX(5), color: 'var(--gold-main)', marginBottom: 2 }}>{t.guild.createTitle}</p>

        <div>
          <p style={{ ...PX(4), color: 'var(--text-muted)', marginBottom: 4 }}>{t.guild.nameLabel}</p>
          <input
            value={name} onChange={e => setName(e.target.value)} maxLength={24}
            placeholder={t.guild.namePlaceholder}
            style={{ width: '100%', background: 'var(--bg-deep)', border: '1px solid var(--border-main)', color: 'var(--text-bright)', fontFamily: "'Press Start 2P', monospace", fontSize: 7, padding: '7px 8px', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <p style={{ ...PX(4), color: 'var(--text-muted)', marginBottom: 4 }}>{t.guild.tagLabel}</p>
          <input
            value={tag} onChange={e => setTag(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))} maxLength={4}
            placeholder={t.guild.tagPlaceholder}
            style={{ width: '100%', background: 'var(--bg-deep)', border: '1px solid var(--border-main)', color: 'var(--gold-bright)', fontFamily: "'Press Start 2P', monospace", fontSize: 8, padding: '7px 8px', boxSizing: 'border-box', letterSpacing: '0.1em' }}
          />
        </div>

        <div>
          <p style={{ ...PX(4), color: 'var(--text-muted)', marginBottom: 4 }}>{t.guild.descLabel}</p>
          <textarea
            value={desc} onChange={e => setDesc(e.target.value)} maxLength={120}
            placeholder={t.guild.descPlaceholder}
            rows={2}
            style={{ width: '100%', background: 'var(--bg-deep)', border: '1px solid var(--border-main)', color: 'var(--text-dim)', fontFamily: "'Press Start 2P', monospace", fontSize: 5, padding: '7px 8px', boxSizing: 'border-box', resize: 'none' }}
          />
        </div>

        {error && <p style={{ ...PX(5), color: 'var(--hp-bright)' }}>{error}</p>}

        <button onClick={handleCreate} disabled={loading} className="btn btn-primary" style={{ fontSize: 6, padding: '9px' }}>
          {loading ? t.guild.creating : t.guild.createBtn}
        </button>
      </div>

    </div>
  );
}

// ── Invite List ──────────────────────────────────────────────────────────────

function InvitesList({ invites, onRefresh }: { invites: GuildInvite[]; onRefresh: () => void }) {
  const user = useAuthStore(s => s.user);
  const hero = useGameStore(s => s.hero);
  const t = useT();
  const [acting, setActing] = useState<string | null>(null);

  async function handleAccept(inv: GuildInvite) {
    if (!user) return;
    setActing(inv.id);
    try {
      await acceptInvite(inv.id, inv.guildId, user.uid, user.username, hero.name, hero.level, hero.portrait);
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
      <p style={{ ...PX(6), color: 'var(--gold-main)', marginBottom: 2 }}>{t.guild.invitesTitle}</p>
      {invites.map(inv => (
        <div key={inv.id} style={{ background: 'var(--bg-inset)', border: '1px solid var(--gold-darker)', padding: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <div>
              <p style={{ ...PX(7), color: 'var(--gold-bright)', marginBottom: 3 }}>[{inv.guildTag}] {inv.guildName}</p>
              <p style={{ ...PX(4), color: 'var(--text-muted)' }}>{t.guild.inviteFrom(inv.fromUsername)}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => handleAccept(inv)} disabled={acting === inv.id} className="btn btn-primary" style={{ flex: 1, fontSize: 5, padding: '6px' }}>
              {t.guild.joinBtn}
            </button>
            <button onClick={() => handleDecline(inv)} disabled={acting === inv.id} className="btn btn-secondary" style={{ flex: 1, fontSize: 5, padding: '6px' }}>
              {t.guild.declineBtn}
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
  const t = useT();
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sent, setSent] = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([
      getLeaderboard(),
      getGuildSentInvites(guild.id, user?.uid ?? ''),
    ]).then(([list, alreadyInvited]) => {
      setPlayers(list.filter(p => p.uid !== user?.uid && !guild.members[p.uid]));
      setSent(new Set(alreadyInvited));
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
          <p style={{ ...PX(6), color: 'var(--gold-main)' }}>{t.guild.inviteModalTitle}</p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer' }}>✕</button>
        </div>
        {loading && <p style={{ ...PX(5), color: 'var(--text-muted)', textAlign: 'center', padding: 12 }}>{t.guild.creating}</p>}
        {!loading && players.length === 0 && <p style={{ ...PX(5), color: 'var(--text-muted)', textAlign: 'center', padding: 12 }}>{t.guild.noPlayersToInvite}</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {players.map(p => {
            const alreadySent = sent.has(p.uid);
            return (
              <div key={p.uid} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-inset)', border: '1px solid var(--border-dark)', padding: '6px 8px' }}>
                <div style={{ width: 36, height: 36, overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border-dark)' }}>
                  <img src={portraitSrc(resolvePortrait(p.portrait, p.username))} alt="portret" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ ...PX(6), color: 'var(--text-bright)', marginBottom: 1 }}>{p.username}</p>
                  <p style={{ ...PX(4), color: 'var(--text-muted)' }}>{t.guild.levelShort}{p.level}</p>
                </div>
                <button
                  onClick={() => handleInvite(p)}
                  disabled={alreadySent}
                  className={alreadySent ? 'btn btn-secondary' : 'btn btn-primary'}
                  style={{ fontSize: 5, padding: '5px 8px', flexShrink: 0, opacity: alreadySent ? 0.6 : 1 }}
                >
                  {alreadySent ? t.guild.inviteSent : t.guild.inviteBtn}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function GuildView({ guild, myUid, onRefresh, onOpenMap, playerPortraits }: { guild: Guild; myUid: string; onRefresh: () => void; onOpenMap: () => void; playerPortraits: Record<string, number> }) {
  const t = useT();
  const [showInvite, setShowInvite] = useState(false);
  const [acting, setActing] = useState(false);
  const [guildTab, setGuildTab] = useState<'info' | 'boss' | 'chat'>('info');
  const isLeader = guild.leaderUid === myUid;
  const members = Object.entries(guild.members).map(([uid, data]) => ({ uid, ...data }))
    .sort((a, b) => (a.role === 'leader' ? -1 : b.role === 'leader' ? 1 : b.level - a.level));
  const memberCount = members.length;

  async function handleLeave() {
    if (isLeader && memberCount > 1) {
      alert(t.guild.leaderWarning);
      return;
    }
    if (!confirm(isLeader ? t.guild.disbandConfirm : t.guild.leaveConfirm)) return;
    setActing(true);
    try {
      if (isLeader) await disbandGuild(guild.id, myUid);
      else await leaveGuild(guild.id, myUid);
      onRefresh();
    } finally { setActing(false); }
  }

  async function handleKick(uid: string, username: string) {
    if (!confirm(t.guild.kickConfirm(username))) return;
    setActing(true);
    try { await leaveGuild(guild.id, uid); onRefresh(); }
    finally { setActing(false); }
  }

  async function handleTransfer(uid: string, username: string) {
    if (!confirm(t.guild.transferConfirm(username))) return;
    setActing(true);
    try { await transferLeadership(guild.id, myUid, uid); onRefresh(); }
    finally { setActing(false); }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {showInvite && <InviteModal guild={guild} onClose={() => setShowInvite(false)} />}

      {/* INFO / BOSS / CHAT tabs */}
      <div style={{ display: 'flex', gap: 6 }}>
        {(['info', 'boss', 'chat'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setGuildTab(tab)}
            className={guildTab === tab ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{ flex: 1, fontSize: 6, padding: '7px' }}
          >
            {tab === 'info' ? 'INFO' : tab === 'boss' ? '💀 BOSS' : '💬 CHAT'}
          </button>
        ))}
      </div>

      {/* CHAT view */}
      {guildTab === 'chat' && (
        <GuildChat
          guildId={guild.id}
          currentUid={myUid}
          username={members.find(m => m.uid === myUid)?.username ?? ''}
          portrait={members.find(m => m.uid === myUid)?.portrait ?? 0}
        />
      )}

      {/* BOSS view */}
      {guildTab === 'boss' && (
        <GuildBossPanel
          guildId={guild.id}
          username={members.find(m => m.uid === myUid)?.username ?? ''}
        />
      )}

      {/* INFO view */}
      {guildTab === 'info' && <>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, rgba(28,20,6,0.97), rgba(20,14,4,0.99))', border: '1px solid var(--gold-darker)', padding: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ ...PX(6), color: 'var(--gold-main)', background: 'rgba(60,40,10,0.6)', border: '1px solid var(--gold-darker)', padding: '2px 6px' }}>[{guild.tag}]</span>
              <p style={{ ...PX(9), color: 'var(--gold-bright)', textShadow: '0 0 10px var(--gold-glow)' }}>{guild.name}</p>
            </div>
            {guild.description && <p style={{ ...PX(4), color: 'var(--text-dim)', marginBottom: 4 }}>{guild.description}</p>}
            <p style={{ ...PX(4), color: 'var(--text-muted)' }}>{memberCount} {memberCount === 1 ? t.guild.member1 : t.guild.memberMany} · {t.guild.founded(formatDate(guild.createdAt))}</p>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{ ...PX(4), color: 'var(--text-muted)', marginBottom: 2 }}>{t.guild.guildXp}</p>
            <p style={{ ...PX(8), color: 'var(--gold-bright)' }}>{guild.guildXp}</p>
          </div>
        </div>
      </div>

      {/* Members */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ ...PX(5), color: 'var(--gold-main)' }}>{t.guild.membersTitle}</p>
          {isLeader && (
            <button onClick={() => setShowInvite(true)} className="btn btn-primary" style={{ fontSize: 5, padding: '4px 8px' }}>
              {t.guild.inviteBtn}
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
              <div style={{ width: 36, height: 36, overflow: 'hidden', flexShrink: 0, border: `1px solid ${m.role === 'leader' ? 'var(--gold-darker)' : 'var(--border-dark)'}` }}>
                <img src={portraitSrc(resolvePortrait(playerPortraits[m.uid] ?? m.portrait, m.username))} alt="portret" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                  <p style={{ ...PX(6), color: m.role === 'leader' ? 'var(--gold-bright)' : 'var(--text-bright)' }}>
                    {m.role === 'leader' ? '👑 ' : ''}{m.username}{isMe ? ' ◀' : ''}
                  </p>
                </div>
                <p style={{ ...PX(4), color: 'var(--text-muted)' }}>
                  {t.guild.heroLevel(m.heroName, m.level)}
                </p>
              </div>
              {isLeader && !isMe && (
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button onClick={() => handleTransfer(m.uid, m.username)} disabled={acting} className="btn btn-secondary" style={{ fontSize: 4, padding: '3px 5px' }} title="Przekaż przywództwo">👑</button>
                  <button onClick={() => handleKick(m.uid, m.username)} disabled={acting} className="btn btn-danger" style={{ fontSize: 4, padding: '3px 5px' }} title={t.guild.kickBtn}>✕</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Territory map */}
      <button onClick={onOpenMap} className="btn btn-primary" style={{ width: '100%', fontSize: 6, padding: '10px' }}>
        {t.guild.territoriesBtn}
      </button>

      {/* Leave / disband */}
      <button
        onClick={handleLeave}
        disabled={acting}
        className="btn btn-danger"
        style={{ width: '100%', fontSize: 6, padding: '8px' }}
      >
        {isLeader ? t.guild.disbandBtn : t.guild.leaveBtn}
      </button>
      </>}
    </div>
  );
}

// ── Main Panel ───────────────────────────────────────────────────────────────

export default function GuildPanel() {
  const user = useAuthStore(s => s.user);
  const t = useT();

  const [guild, setGuild] = useState<Guild | null>(null);
  const [invites, setInvites] = useState<GuildInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'guild' | 'territory'>('guild');
  const [playerPortraits, setPlayerPortraits] = useState<Record<string, number>>({});

  async function load() {
    if (!user || !isFirebaseConfigured) { setLoading(false); return; }
    setLoading(true);
    try {
      const [guildId, myInvites, leaderboard] = await Promise.all([
        getMyGuildId(user.uid),
        getMyInvites(user.uid),
        getLeaderboard(),
      ]);
      const portraits: Record<string, number> = {};
      for (const e of leaderboard) portraits[e.uid] = resolvePortrait(e.portrait, e.username);
      setPlayerPortraits(portraits);
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
        <p style={{ ...PX(8), color: 'var(--gold-main)', textShadow: '0 0 10px var(--gold-glow)', marginBottom: 10 }}>{t.guild.title}</p>
        <div style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-dark)', padding: 16, textAlign: 'center' }}>
          <p style={{ ...PX(6), color: 'var(--text-muted)' }}>{t.guild.needAccount}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card p-3">
        <p style={{ ...PX(6), color: 'var(--text-muted)', textAlign: 'center', padding: 24 }}>{t.guild.creating}</p>
      </div>
    );
  }

  if (view === 'territory') {
    return (
      <div className="card p-3">
        <TerritoryPanel guild={guild} onBack={() => setView('guild')} onRefresh={load} />
      </div>
    );
  }

  return (
    <div className="card p-3">
      {guild ? (
        <GuildView guild={guild} myUid={user.uid} onRefresh={load} onOpenMap={() => setView('territory')} playerPortraits={playerPortraits} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {invites.length > 0 && <InvitesList invites={invites} onRefresh={load} />}
          <CreateGuildForm onCreated={load} />
          <button onClick={() => setView('territory')} className="btn btn-secondary" style={{ width: '100%', fontSize: 6, padding: '9px' }}>
            {t.guild.territoriesBtn}
          </button>
        </div>
      )}
    </div>
  );
}
