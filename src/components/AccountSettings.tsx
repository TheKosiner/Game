import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import { useT } from '../hooks/useT';
import { MONO, ORB } from '../utils/styles';

/**
 * Account management: permanent account deletion, which Google Play requires for
 * apps with sign-in (and the GDPR right to erasure). The deletion itself runs in
 * the deleteAccount Cloud Function, because most of the player's documents can't
 * be removed by the client under the security rules.
 */
export default function AccountSettings() {
  const t = useT();
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user || !functions) return null;
  const confirmWord = user.username;
  const canDelete = typed.trim().toLowerCase() === confirmWord.toLowerCase() && !busy;

  async function handleDelete() {
    if (!canDelete || !functions) return;
    setBusy(true);
    setError(null);
    try {
      await httpsCallable(functions, 'deleteAccount')({});
      try {
        localStorage.removeItem('glitchsoul_save');
        localStorage.removeItem('cybermagic_save');
      } catch { /* storage unavailable */ }
      await logout().catch(() => {});
    } catch {
      setError(t.account.deleteFailed);
      setBusy(false);
    }
  }

  return (
    <div style={{ border: '1px solid rgba(255,68,68,0.25)', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p style={{ ...ORB, fontSize: 10, letterSpacing: 2, color: 'rgba(255,255,255,0.45)' }}>{t.account.title}</p>
      {!open ? (
        <button
          onClick={() => { setOpen(true); setTyped(''); setError(null); }}
          style={{ ...MONO, fontSize: 11, alignSelf: 'flex-start', background: 'none', border: '1px solid rgba(255,68,68,0.4)', color: '#ff6b6b', padding: '6px 10px', cursor: 'pointer' }}
        >
          {t.account.deleteBtn}
        </button>
      ) : (
        <div role="group" aria-label={t.account.deleteBtn} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ ...MONO, fontSize: 11, color: '#ff8a8a', lineHeight: 1.5 }}>{t.account.deleteWarning}</p>
          <label style={{ ...MONO, fontSize: 11, color: 'var(--text-dim)', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {t.account.deleteConfirmPrompt(confirmWord)}
            <input
              value={typed}
              onChange={e => setTyped(e.target.value)}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              disabled={busy}
              style={{ ...MONO, fontSize: 12, padding: '6px 8px', background: 'rgba(4,4,14,0.85)', border: '1px solid rgba(255,68,68,0.35)', color: 'var(--text-bright)' }}
            />
          </label>
          {error && <p role="alert" style={{ ...MONO, fontSize: 11, color: '#ff4444' }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleDelete}
              disabled={!canDelete}
              style={{ ...ORB, fontSize: 10, padding: '7px 12px', cursor: canDelete ? 'pointer' : 'not-allowed', opacity: canDelete ? 1 : 0.4, background: 'rgba(255,40,40,0.18)', border: '1px solid rgba(255,68,68,0.7)', color: '#fff' }}
            >
              {busy ? t.account.deleting : t.account.deleteConfirmBtn}
            </button>
            <button
              onClick={() => setOpen(false)}
              disabled={busy}
              style={{ ...MONO, fontSize: 11, padding: '7px 12px', cursor: 'pointer', background: 'none', border: '1px solid rgba(255,255,255,0.2)', color: 'var(--text-dim)' }}
            >
              {t.account.cancel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
