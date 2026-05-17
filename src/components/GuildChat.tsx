import { useEffect, useRef, useState } from 'react';
import { onSnapshot, addDoc, collection, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useT } from '../hooks/useT';
import { portraitSrc } from '../data/portraits';

const MONO = { fontFamily: "'Share Tech Mono', monospace" } as const;
const PX = (s: number) => ({ fontFamily: "'Press Start 2P', monospace", fontSize: s } as const);

interface ChatMessage {
  id: string;
  uid: string;
  username: string;
  portrait?: number;
  text: string;
  createdAt: number;
}

interface Props {
  guildId: string;
  currentUid: string;
  username: string;
  portrait: number;
}

function timeAgo(ts: number): string {
  const d = Date.now() - ts;
  const m = Math.floor(d / 60000);
  const h = Math.floor(m / 60);
  const day = Math.floor(h / 24);
  if (day > 0) return `${day}d`;
  if (h > 0) return `${h}h`;
  if (m > 0) return `${m}m`;
  return 'now';
}

export default function GuildChat({ guildId, currentUid, username, portrait }: Props) {
  const t = useT();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [rateLimitMsg, setRateLimitMsg] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastSentAt = useRef<number>(0);

  useEffect(() => {
    if (!db || !guildId) return;
    const q = query(
      collection(db, 'guilds', guildId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(60)
    );
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage)));
    });
    return () => unsub();
  }, [guildId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    if (!db || !text.trim()) return;
    const now = Date.now();
    if (now - lastSentAt.current < 3000) {
      setRateLimitMsg(t.chat.rateLimit);
      setTimeout(() => setRateLimitMsg(''), 2000);
      return;
    }
    setSending(true);
    try {
      await addDoc(collection(db, 'guilds', guildId, 'messages'), {
        uid: currentUid,
        username,
        portrait,
        text: text.trim().slice(0, 200),
        createdAt: Date.now(),
      });
      lastSentAt.current = Date.now();
      setText('');
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p style={{ ...PX(7), color: '#00c8ff', textShadow: '0 0 10px rgba(0,200,255,0.6)' }}>
        {t.chat.guildTitle}
      </p>

      {/* Messages */}
      <div style={{
        background: 'var(--bg-deep)',
        border: '1px solid rgba(0,200,255,0.2)',
        height: 280,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        padding: '8px 6px',
      }}>
        {messages.length === 0 && (
          <p style={{ ...MONO, fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', margin: 'auto' }}>
            —
          </p>
        )}
        {messages.map(msg => {
          const isOwn = currentUid === msg.uid;
          return (
            <div key={msg.id} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 6,
              padding: '3px 4px',
              background: isOwn ? 'rgba(255,45,120,0.05)' : 'transparent',
            }}>
              {/* Portrait */}
              {msg.portrait !== undefined ? (
                <img
                  src={portraitSrc(msg.portrait)}
                  alt={msg.username}
                  style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' }}
                />
              ) : (
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  background: isOwn ? 'rgba(255,45,120,0.3)' : 'rgba(0,200,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, color: isOwn ? '#ff2d78' : '#00c8ff',
                  border: `1px solid ${isOwn ? 'rgba(255,45,120,0.4)' : 'rgba(0,200,255,0.3)'}`,
                  fontFamily: "'Share Tech Mono', monospace",
                }}>
                  {(msg.username || '?').charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{
                  ...MONO, fontSize: 10,
                  color: isOwn ? '#ff2d78' : '#00c8ff',
                  fontWeight: 700,
                  marginRight: 5,
                }}>
                  {msg.username || '…'}
                </span>
                <span style={{ ...MONO, fontSize: 10, color: 'var(--text-main)', wordBreak: 'break-word' }}>
                  {msg.text}
                </span>
              </div>
              <span style={{ ...MONO, fontSize: 8, color: 'var(--text-muted)', flexShrink: 0, marginTop: 1 }}>
                {timeAgo(msg.createdAt)}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Rate limit message */}
      {rateLimitMsg && (
        <p style={{ ...MONO, fontSize: 9, color: '#ff2d78', textAlign: 'center' }}>{rateLimitMsg}</p>
      )}

      {/* Input */}
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          maxLength={200}
          placeholder={t.chat.guildPlaceholder}
          style={{
            flex: 1,
            background: 'var(--bg-inset)',
            border: '1px solid rgba(0,200,255,0.3)',
            color: 'var(--text-bright)',
            padding: '8px 10px',
            ...MONO, fontSize: 11, outline: 'none',
          }}
        />
        <button
          onClick={handleSend}
          disabled={sending || !text.trim()}
          className="btn btn-primary"
          style={{ fontSize: 6, padding: '8px 12px', flexShrink: 0, opacity: !text.trim() ? 0.5 : 1 }}
        >
          {t.chat.send}
        </button>
      </div>
    </div>
  );
}
