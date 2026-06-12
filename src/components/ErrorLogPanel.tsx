import { useEffect, useRef, useState } from 'react';
import {
  collection, query, orderBy, limit,
  onSnapshot, deleteDoc, doc, getDocs,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { MONO } from '../utils/styles';

const ADMIN_EMAIL = 'thekosiner@gmail.com';

interface ClientError {
  id: string;
  uid: string;
  username: string;
  message: string;
  stack: string;
  url: string;
  ts: number;
  ua: string;
  type: 'react' | 'js' | 'promise';
}

const TYPE_COLOR: Record<string, string> = {
  react:   '#ff4466',
  js:      '#ffaa00',
  promise: '#44aaff',
};

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60)   return `${s}s temu`;
  if (s < 3600) return `${Math.floor(s / 60)}m temu`;
  if (s < 86400) return `${Math.floor(s / 3600)}h temu`;
  return `${Math.floor(s / 86400)}d temu`;
}

export default function ErrorLogPanel({ userEmail }: { userEmail: string }) {
  if (userEmail !== ADMIN_EMAIL) return null;

  const [errors, setErrors]     = useState<ClientError[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [unseen, setUnseen]     = useState(0);
  const [open, setOpen]         = useState(false);
  const prevCount = useRef(0);

  useEffect(() => {
    if (!db) return;
    const q = query(
      collection(db, 'clientErrors'),
      orderBy('ts', 'desc'),
      limit(100),
    );
    const unsub = onSnapshot(q, snap => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as ClientError));
      setErrors(items);
      const newCount = items.length - prevCount.current;
      if (prevCount.current > 0 && newCount > 0) setUnseen(n => n + newCount);
      prevCount.current = items.length;
    });
    return unsub;
  }, []);

  const deleteOne = async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'clientErrors', id));
  };

  const clearAll = async () => {
    if (!db) return;
    if (!confirm(`Usunąć wszystkie ${errors.length} błędy?`)) return;
    const snap = await getDocs(collection(db, 'clientErrors'));
    await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
  };

  const handleOpen = () => { setOpen(o => !o); setUnseen(0); };

  return (
    <div style={{ marginTop: 10 }}>
      {/* Toggle button */}
      <button
        onClick={handleOpen}
        style={{
          ...MONO, width: '100%', fontSize: 10,
          background: errors.length ? '#1a0008' : '#0a0a0a',
          border: `1px solid ${errors.length ? '#ff2255' : '#333'}`,
          color: errors.length ? '#ff4466' : '#555',
          padding: '6px 10px', borderRadius: 3, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <span>🪲 BŁĘDY KLIENTÓW ({errors.length})</span>
        {unseen > 0 && (
          <span style={{ background: '#ff2255', color: '#fff', borderRadius: 999, padding: '1px 7px', fontSize: 9, fontWeight: 700 }}>
            +{unseen}
          </span>
        )}
        <span style={{ opacity: 0.5 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{
          background: '#060610', border: '1px solid #ff224433',
          borderTop: 'none', borderRadius: '0 0 3px 3px',
          maxHeight: 520, overflowY: 'auto',
        }}>
          {/* Toolbar */}
          <div style={{ padding: '6px 8px', borderBottom: '1px solid #1a1a2a', display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ ...MONO, fontSize: 9, color: '#666', flex: 1 }}>
              Ostatnie 100 · realtime
            </span>
            <span style={{ ...MONO, fontSize: 8, color: '#ff4466' }}>
              <span style={{ background: '#ff446622', padding: '1px 5px', borderRadius: 2 }}>react</span>
            </span>
            <span style={{ ...MONO, fontSize: 8, color: '#ffaa00' }}>
              <span style={{ background: '#ffaa0022', padding: '1px 5px', borderRadius: 2 }}>js</span>
            </span>
            <span style={{ ...MONO, fontSize: 8, color: '#44aaff' }}>
              <span style={{ background: '#44aaff22', padding: '1px 5px', borderRadius: 2 }}>promise</span>
            </span>
            {errors.length > 0 && (
              <button onClick={clearAll} style={{ ...MONO, fontSize: 8, background: '#2a0010', border: '1px solid #ff2255', color: '#ff4466', padding: '2px 7px', borderRadius: 2, cursor: 'pointer' }}>
                Wyczyść wszystkie
              </button>
            )}
          </div>

          {errors.length === 0 ? (
            <p style={{ ...MONO, fontSize: 10, color: '#444', padding: '16px', textAlign: 'center' }}>
              Brak błędów 🎉
            </p>
          ) : (
            errors.map(err => {
              const tc = TYPE_COLOR[err.type] ?? '#aaa';
              const isExp = expanded === err.id;
              return (
                <div
                  key={err.id}
                  style={{
                    borderBottom: '1px solid #0e0e1e',
                    padding: '6px 8px',
                  }}
                >
                  {/* Header row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <span style={{ ...MONO, fontSize: 8, color: tc, background: `${tc}18`, border: `1px solid ${tc}44`, padding: '1px 5px', borderRadius: 2, flexShrink: 0, marginTop: 1 }}>
                      {err.type}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 2, flexWrap: 'wrap' }}>
                        <span style={{ ...MONO, fontSize: 9, color: '#ffc83a' }}>{err.username}</span>
                        <span style={{ ...MONO, fontSize: 8, color: '#444' }}>{err.uid.slice(0, 8)}</span>
                        <span style={{ ...MONO, fontSize: 8, color: '#555' }}>{err.url}</span>
                        <span style={{ ...MONO, fontSize: 8, color: '#444', marginLeft: 'auto' }}>{timeAgo(err.ts)}</span>
                      </div>
                      <p
                        style={{ ...MONO, fontSize: 9, color: '#ddd', cursor: 'pointer', wordBreak: 'break-word' }}
                        onClick={() => setExpanded(isExp ? null : err.id)}
                        title="Kliknij aby zobaczyć stack trace"
                      >
                        {err.message}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteOne(err.id)}
                      style={{ background: 'none', border: 'none', color: '#443333', cursor: 'pointer', fontSize: 12, padding: '0 2px', flexShrink: 0 }}
                      title="Usuń"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Stack trace (collapsible) */}
                  {isExp && (
                    <pre style={{
                      ...MONO, fontSize: 7.5, color: '#667',
                      background: '#08080f', border: '1px solid #1a1a2a',
                      padding: '6px 8px', marginTop: 6, overflowX: 'auto',
                      whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                      maxHeight: 200, overflowY: 'auto',
                    }}>
                      {err.stack || '(brak stack trace)'}
                    </pre>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
