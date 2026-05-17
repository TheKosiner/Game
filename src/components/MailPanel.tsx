import { useEffect, useState, useRef } from 'react';
import {
  getMyMail, sendMail, markMailRead, deleteMail,
  getMyInvites, acceptInvite, declineInvite,
  getLeaderboard,
  type MailMessage, type GuildInvite, type LeaderboardEntry,
} from '../lib/cloudSync';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import { useT } from '../hooks/useT';

const PX = (s: number) => ({ fontFamily: "'Press Start 2P', monospace", fontSize: s } as const);
const MONO = { fontFamily: "'Share Tech Mono', monospace" } as const;

function timeAgo(ts: number): string {
  const d = Date.now() - ts;
  const m = Math.floor(d / 60000);
  const h = Math.floor(m / 60);
  const day = Math.floor(h / 24);
  if (day > 0) return `${day}d temu`;
  if (h > 0) return `${h}h temu`;
  if (m > 0) return `${m}m temu`;
  return 'teraz';
}

// ── Invite card ──────────────────────────────────────────────────────────────

function InviteCard({ invite, onAccept, onDecline }: {
  invite: GuildInvite;
  onAccept: () => Promise<void>;
  onDecline: () => Promise<void>;
}) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  async function handle(fn: () => Promise<void>) {
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  }
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(20,10,40,0.95), rgba(10,5,20,0.98))',
      border: '1px solid rgba(160,80,255,0.45)',
      padding: '10px 12px',
      boxShadow: '0 0 16px rgba(160,80,255,0.08)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 22, flexShrink: 0 }}>🏰</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ ...PX(6), color: '#c080ff', marginBottom: 4 }}>
            {t.mail.guildInviteLabel}
          </p>
          <p style={{ ...MONO, fontSize: 11, color: 'var(--text-bright)', marginBottom: 2 }}>
            [{invite.guildTag}] {invite.guildName}
          </p>
          <p style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)' }}>
            {t.mail.from(invite.fromUsername, timeAgo(invite.createdAt))}
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => handle(onAccept)}
          disabled={busy}
          className="btn btn-primary"
          style={{ flex: 1, fontSize: 6, padding: '6px' }}
        >
          {t.mail.acceptBtn}
        </button>
        <button
          onClick={() => handle(onDecline)}
          disabled={busy}
          className="btn btn-secondary"
          style={{ flex: 1, fontSize: 6, padding: '6px' }}
        >
          {t.mail.declineBtn}
        </button>
      </div>
    </div>
  );
}

// ── Message card ─────────────────────────────────────────────────────────────

function MessageCard({ msg, onDelete, onMarkRead, onReply }: {
  msg: MailMessage;
  onDelete: () => void;
  onMarkRead: () => void;
  onReply?: () => void;
}) {
  const t = useT();
  const [expanded, setExpanded] = useState(false);

  function toggle() {
    setExpanded(v => !v);
    if (!msg.read) onMarkRead();
  }

  return (
    <div style={{
      background: msg.read
        ? 'var(--bg-inset)'
        : 'linear-gradient(135deg, rgba(0,200,255,0.06), rgba(5,8,20,0.97))',
      border: `1px solid ${msg.read ? 'var(--border-dark)' : 'rgba(0,200,255,0.35)'}`,
      padding: '10px 12px',
      boxShadow: msg.read ? 'none' : '0 0 12px rgba(0,200,255,0.06)',
    }}>
      <div
        onClick={toggle}
        style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }}
      >
        <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>
          {msg.read ? '📩' : '📨'}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
            <p style={{ ...MONO, fontSize: 11, color: msg.read ? 'var(--text-main)' : 'var(--text-bright)', fontWeight: msg.read ? 400 : 700 }}>
              {msg.fromUsername}
            </p>
            <p style={{ ...MONO, fontSize: 9, color: 'var(--text-muted)' }}>{timeAgo(msg.createdAt)}</p>
          </div>
          {!msg.read && (
            <span style={{ ...MONO, fontSize: 8, color: '#00c8ff', background: 'rgba(0,200,255,0.12)', border: '1px solid rgba(0,200,255,0.3)', padding: '1px 5px' }}>
              {t.mail.newBadge}
            </span>
          )}
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: 12, flexShrink: 0 }}>
          {expanded ? '▲' : '▼'}
        </span>
      </div>

      {expanded && (
        <div style={{ marginTop: 10 }}>
          <div style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-dark)', padding: '8px 10px', marginBottom: 8 }}>
            <p style={{ ...MONO, fontSize: 11, color: 'var(--text-main)', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {msg.body}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {onReply && (
              <button
                onClick={e => { e.stopPropagation(); onReply(); }}
                className="btn btn-primary"
                style={{ fontSize: 6, padding: '4px 10px' }}
              >
                {t.mail.replyBtn}
              </button>
            )}
            <button
              onClick={e => { e.stopPropagation(); onDelete(); }}
              className="btn btn-secondary"
              style={{ fontSize: 6, padding: '4px 10px' }}
            >
              {t.mail.deleteBtn}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Compose ──────────────────────────────────────────────────────────────────

function ComposePanel({ myUid, onSent, initialRecipient }: { myUid: string; onSent: () => void; initialRecipient?: { uid: string; username: string } }) {
  const user = useAuthStore(s => s.user);
  const t = useT();
  const [search, setSearch] = useState('');
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [filtered, setFiltered] = useState<LeaderboardEntry[]>([]);
  const [recipient, setRecipient] = useState<LeaderboardEntry | null>(
    initialRecipient ? { uid: initialRecipient.uid, username: initialRecipient.username, heroName: '', level: 0, xp: 0, gold: 0, updatedAt: 0 } : null
  );
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getLeaderboard().then(list => {
      setPlayers(list.filter(p => p.uid !== myUid));
      setLoadingPlayers(false);
    });
  }, [myUid]);

  useEffect(() => {
    if (!search.trim()) { setFiltered([]); return; }
    const q = search.toLowerCase();
    setFiltered(players.filter(p =>
      p.username.toLowerCase().includes(q) || p.heroName.toLowerCase().includes(q)
    ).slice(0, 6));
  }, [search, players]);

  async function handleSend() {
    if (!recipient || !body.trim() || !user) return;
    setSending(true);
    try {
      await sendMail(myUid, user.username, recipient.uid, recipient.username, body.trim());
      setDone(true);
      setTimeout(() => { setDone(false); setRecipient(null); setBody(''); setSearch(''); onSent(); }, 1800);
    } finally { setSending(false); }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ ...PX(7), color: 'var(--gold-main)', textShadow: '0 0 10px var(--gold-glow)' }}>
        {t.mail.composeTitle}
      </p>

      {done && (
        <div style={{ background: 'rgba(20,60,20,0.9)', border: '1px solid rgba(60,160,60,0.5)', padding: '10px 14px', textAlign: 'center' }}>
          <p style={{ ...PX(6), color: '#60c060' }}>{t.mail.sentOk}</p>
        </div>
      )}

      {/* Recipient */}
      <div style={{ position: 'relative' }}>
        <p style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', marginBottom: 5 }}>{t.mail.recipientLabel}</p>
        {recipient ? (
          <div style={{
            background: 'var(--bg-inset)', border: '1px solid var(--gold-darker)',
            padding: '8px 10px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <p style={{ ...MONO, fontSize: 11, color: 'var(--text-bright)', marginBottom: 2 }}>{recipient.username}</p>
              {recipient.heroName && <p style={{ ...MONO, fontSize: 9, color: 'var(--text-muted)' }}>{recipient.heroName} · Poz.{recipient.level}</p>}
            </div>
            <button onClick={() => { setRecipient(null); setSearch(''); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer' }}>✕</button>
          </div>
        ) : (
          <div>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={loadingPlayers ? t.mail.loadingPlayers : t.mail.recipientPlaceholder}
              disabled={loadingPlayers}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'var(--bg-inset)', border: '1px solid var(--border-main)',
                color: 'var(--text-bright)', padding: '8px 10px',
                ...MONO, fontSize: 11, outline: 'none',
              }}
            />
            {filtered.length > 0 && (
              <div ref={dropdownRef} style={{
                position: 'absolute', left: 0, right: 0, zIndex: 10,
                background: 'var(--bg-deep)', border: '1px solid var(--border-main)',
                borderTop: 'none', maxHeight: 200, overflowY: 'auto',
              }}>
                {filtered.map(p => (
                  <div
                    key={p.uid}
                    onClick={() => { setRecipient(p); setSearch(''); setFiltered([]); }}
                    style={{
                      padding: '8px 10px', cursor: 'pointer',
                      borderBottom: '1px solid var(--border-dark)',
                      display: 'flex', justifyContent: 'space-between',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ ...MONO, fontSize: 11, color: 'var(--text-bright)' }}>{p.username}</span>
                    <span style={{ ...MONO, fontSize: 9, color: 'var(--text-muted)' }}>{p.heroName} · Poz.{p.level}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <div>
        <p style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', marginBottom: 5 }}>{t.mail.messageLabel}</p>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          maxLength={500}
          rows={5}
          placeholder={t.mail.messagePlaceholder}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'var(--bg-inset)', border: '1px solid var(--border-main)',
            color: 'var(--text-bright)', padding: '8px 10px',
            ...MONO, fontSize: 11, outline: 'none', resize: 'vertical',
            lineHeight: 1.6,
          }}
        />
        <p style={{ ...MONO, fontSize: 9, color: 'var(--text-muted)', textAlign: 'right', marginTop: 3 }}>
          {body.length}/500
        </p>
      </div>

      <button
        onClick={handleSend}
        disabled={!recipient || !body.trim() || sending || done}
        className="btn btn-primary"
        style={{ width: '100%', fontSize: 7, padding: '10px', opacity: (!recipient || !body.trim()) ? 0.5 : 1 }}
      >
        {sending ? t.mail.sending : t.mail.sendBtn}
      </button>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function MailPanel() {
  const user = useAuthStore(s => s.user);
  const hero = useGameStore(s => s.hero);
  const t = useT();

  const [view, setView] = useState<'inbox' | 'compose'>('inbox');
  const [messages, setMessages] = useState<MailMessage[]>([]);
  const [invites, setInvites] = useState<GuildInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteResult, setInviteResult] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<{ uid: string; username: string } | null>(null);

  async function reload() {
    if (!user) return;
    const [msgs, invs] = await Promise.all([
      getMyMail(user.uid),
      getMyInvites(user.uid),
    ]);
    setMessages(msgs);
    setInvites(invs);
    setLoading(false);
  }

  useEffect(() => { reload(); }, [user?.uid]);

  const unreadCount = messages.filter(m => !m.read).length;
  const totalCount = invites.length + messages.length;

  async function handleAcceptInvite(invite: GuildInvite) {
    if (!user) return;
    await acceptInvite(invite.id, invite.guildId, user.uid, user.username, hero.name, hero.level);
    setInviteResult(t.mail.joinedGuild(invite.guildTag, invite.guildName));
    setTimeout(() => setInviteResult(null), 3000);
    await reload();
  }

  async function handleDeclineInvite(invite: GuildInvite) {
    await declineInvite(invite.id);
    await reload();
  }

  async function handleDeleteMsg(msg: MailMessage) {
    await deleteMail(msg.id);
    setMessages(prev => prev.filter(m => m.id !== msg.id));
  }

  async function handleMarkRead(msg: MailMessage) {
    if (msg.read) return;
    await markMailRead(msg.id);
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, read: true } : m));
  }

  if (!user) {
    return (
      <div className="card p-3" style={{ textAlign: 'center', padding: 30 }}>
        <p style={{ ...PX(6), color: 'var(--text-muted)' }}>{t.mail.notLoggedIn}</p>
      </div>
    );
  }

  return (
    <div className="card p-3" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <p style={{ ...PX(8), color: 'var(--gold-main)', textShadow: '0 0 10px var(--gold-glow)' }}>
            {t.mail.title}
          </p>
          {unreadCount > 0 && (
            <span style={{
              ...PX(6), color: '#000',
              background: '#ff2d78', padding: '2px 6px',
              borderRadius: 10, minWidth: 18, textAlign: 'center',
            }}>
              {unreadCount}
            </span>
          )}
        </div>
        <button onClick={reload} className="btn btn-secondary" style={{ fontSize: 5, padding: '4px 8px' }}>⟳</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6 }}>
        {(['inbox', 'compose'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={view === v ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{ flex: 1, fontSize: 6, padding: '7px' }}
          >
            {v === 'inbox'
              ? `${t.mail.inboxTab}${totalCount > 0 ? ` (${totalCount})` : ''}`
              : t.mail.composeTab}
          </button>
        ))}
      </div>

      {/* Invite result banner */}
      {inviteResult && (
        <div style={{ background: 'rgba(20,50,10,0.9)', border: '1px solid rgba(40,120,40,0.5)', padding: '8px 12px', textAlign: 'center' }}>
          <p style={{ ...PX(5), color: '#60c060' }}>{inviteResult}</p>
        </div>
      )}

      {/* Content */}
      {view === 'inbox' ? (
        loading ? (
          <p style={{ ...PX(5), color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>⏳ Ładowanie...</p>
        ) : totalCount === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <p style={{ fontSize: 32, marginBottom: 10 }}>📭</p>
            <p style={{ ...PX(6), color: 'var(--text-muted)' }}>{t.mail.noMessages}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Guild invites first */}
            {invites.length > 0 && (
              <>
                <p style={{ ...MONO, fontSize: 9, color: 'var(--text-dim)' }}>{t.mail.guildInvitesHeader}</p>
                {invites.map(inv => (
                  <InviteCard
                    key={inv.id}
                    invite={inv}
                    onAccept={() => handleAcceptInvite(inv)}
                    onDecline={() => handleDeclineInvite(inv)}
                  />
                ))}
              </>
            )}

            {/* Messages */}
            {messages.length > 0 && (
              <>
                <p style={{ ...MONO, fontSize: 9, color: 'var(--text-dim)', marginTop: invites.length > 0 ? 4 : 0 }}>{t.mail.messagesHeader}</p>
                {messages.map(msg => (
                  <MessageCard
                    key={msg.id}
                    msg={msg}
                    onDelete={() => handleDeleteMsg(msg)}
                    onMarkRead={() => handleMarkRead(msg)}
                    onReply={() => { setReplyTo({ uid: msg.fromUid, username: msg.fromUsername }); setView('compose'); }}
                  />
                ))}
              </>
            )}
          </div>
        )
      ) : (
        <ComposePanel myUid={user.uid} onSent={() => { setView('inbox'); setReplyTo(null); reload(); }} initialRecipient={replyTo ?? undefined} />
      )}
    </div>
  );
}
