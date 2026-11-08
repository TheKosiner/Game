import { useEffect, useState } from 'react';
import { collection, deleteDoc, doc, getDocs, limit, orderBy, query, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { MONO } from '../utils/styles';

const ADMIN_EMAIL = 'thekosiner@gmail.com';

interface Report {
  id: string;
  reporterUid: string;
  reporterName: string;
  targetUid: string;
  targetName: string;
  kind: 'globalChat' | 'guildChat' | 'lobbyChat' | 'mail' | 'player';
  reason: string;
  text: string;
  messageId: string | null;
  guildId: string | null;
  status: 'open' | 'resolved';
  createdAt: number;
}

const KIND_LABEL: Record<Report['kind'], string> = {
  globalChat: 'czat globalny', guildChat: 'czat gildii', lobbyChat: 'czat lobby', mail: 'poczta', player: 'gracz',
};

/** Where the reported message lives, so a moderator can remove it. */
function messagePath(r: Report): string[] | null {
  if (!r.messageId) return null;
  switch (r.kind) {
    case 'globalChat': return ['globalChat', r.messageId];
    case 'lobbyChat': return ['lobbyChat', r.messageId];
    case 'mail': return ['mail', r.messageId];
    case 'guildChat': return r.guildId ? ['guilds', r.guildId, 'messages', r.messageId] : null;
    default: return null;
  }
}

// Admin-only: reports filed by players (chat, mail, players). Google Play requires
// an app with user content to act on reports — remove the message, mute the
// player (chatBans), or close the report.
export default function ReportsPanel({ userEmail }: { userEmail: string }) {
  if (userEmail !== ADMIN_EMAIL) return null;
  return <ReportsPanelInner />;
}

function ReportsPanelInner() {
  const [open, setOpen] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [muted, setMuted] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    if (!db) return;
    setLoading(true);
    try {
      const [snap, bans] = await Promise.all([
        getDocs(query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(100))),
        getDocs(collection(db, 'chatBans')),
      ]);
      setReports(snap.docs.map(d => ({ id: d.id, ...d.data() } as Report)));
      setMuted(new Set(bans.docs.map(d => d.id)));
    } catch (e: any) {
      setMsg(`❌ ${e?.message ?? e}`);
    }
    setLoading(false);
  }

  useEffect(() => { if (open) load(); }, [open]);

  async function act(label: string, fn: () => Promise<unknown>) {
    try { await fn(); setMsg(`✅ ${label}`); await load(); }
    catch (e: any) { setMsg(`❌ ${e?.message ?? e}`); }
  }

  const openCount = reports.filter(r => r.status === 'open').length;
  const btn: React.CSSProperties = { ...MONO, fontSize: 10, padding: '3px 8px', cursor: 'pointer', background: '#1a1a2a', border: '1px solid #444', color: '#ddd' };

  return (
    <div style={{ background: '#0a0a12', border: '2px solid #ffaa00', borderRadius: 4, padding: 12 }}>
      <button onClick={() => setOpen(v => !v)} style={{ ...MONO, fontSize: 12, background: 'none', border: 'none', color: '#ffaa00', cursor: 'pointer', padding: 0 }}>
        ⚑ ZGŁOSZENIA {open && `(${openCount} otwartych)`} {open ? '▲' : '▼'}
      </button>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
          {msg && <p style={{ ...MONO, fontSize: 11, color: '#ccc' }}>{msg}</p>}
          {loading && <p style={{ ...MONO, fontSize: 11, color: '#888' }}>Wczytywanie…</p>}
          {!loading && reports.length === 0 && <p style={{ ...MONO, fontSize: 11, color: '#888' }}>Brak zgłoszeń.</p>}
          {reports.map(r => {
            const path = messagePath(r);
            const isMuted = muted.has(r.targetUid);
            return (
              <div key={r.id} style={{ border: `1px solid ${r.status === 'open' ? '#ffaa0066' : '#333'}`, padding: 8, opacity: r.status === 'open' ? 1 : 0.55 }}>
                <p style={{ ...MONO, fontSize: 11, color: '#ffcc66' }}>
                  {r.targetName} <span style={{ color: '#888' }}>← zgłosił(a) {r.reporterName}</span>
                </p>
                <p style={{ ...MONO, fontSize: 10, color: '#888' }}>
                  {KIND_LABEL[r.kind] ?? r.kind} · {r.reason} · {new Date(r.createdAt).toLocaleString('pl-PL')}{r.status !== 'open' && ' · zamknięte'}
                </p>
                {r.text && <p style={{ ...MONO, fontSize: 11, color: '#ddd', margin: '4px 0', wordBreak: 'break-word' }}>„{r.text}”</p>}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {path && (
                    <button style={btn} onClick={() => act('Wiadomość usunięta', () => deleteDoc(doc(db!, path[0], ...path.slice(1))))}>Usuń wiadomość</button>
                  )}
                  {isMuted ? (
                    <button style={btn} onClick={() => act(`Cofnięto wyciszenie: ${r.targetName}`, () => deleteDoc(doc(db!, 'chatBans', r.targetUid)))}>Cofnij wyciszenie</button>
                  ) : (
                    <button style={btn} onClick={() => act(`Wyciszono: ${r.targetName}`, () => setDoc(doc(db!, 'chatBans', r.targetUid), { username: r.targetName, bannedAt: Date.now(), reportId: r.id }))}>Wycisz gracza</button>
                  )}
                  {r.status === 'open' ? (
                    <button style={btn} onClick={() => act('Zgłoszenie zamknięte', () => updateDoc(doc(db!, 'reports', r.id), { status: 'resolved', resolvedAt: Date.now() }))}>Zamknij zgłoszenie</button>
                  ) : (
                    <button style={btn} onClick={() => act('Zgłoszenie usunięte', () => deleteDoc(doc(db!, 'reports', r.id)))}>Usuń zgłoszenie</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
