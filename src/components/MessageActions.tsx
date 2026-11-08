import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useT } from '../hooks/useT';
import { MONO, ORB } from '../utils/styles';
import {
  REPORT_REASONS, blockPlayer, reportContent, useModerationStore,
  type ReportKind, type ReportReason,
} from '../lib/moderation';

/**
 * "⋮" next to another player's chat message or mail: report it to the
 * moderators or block the player. Renders nothing for your own messages.
 */
export default function MessageActions({ target, kind, text, messageId, guildId }: {
  target: { uid: string; username: string };
  kind: ReportKind;
  text?: string;
  messageId?: string;
  guildId?: string;
}) {
  const t = useT();
  const user = useAuthStore(s => s.user);
  const isBlocked = useModerationStore(s => !!s.blocked[target.uid]);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'menu' | 'reasons' | 'confirmBlock' | 'done'>('menu');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState('');

  if (!user || !target.uid || target.uid === user.uid) return null;

  function close() { setOpen(false); setStep('menu'); setResult(''); setBusy(false); }

  async function sendReport(reason: ReportReason) {
    if (!user) return;
    setBusy(true);
    try {
      await reportContent({ reporter: { uid: user.uid, username: user.username }, target, kind, reason, text, messageId, guildId });
      setResult(t.moderation.reportSent);
    } catch {
      setResult(t.moderation.reportFailed);
    }
    setBusy(false);
    setStep('done');
  }

  async function confirmBlock() {
    if (!user) return;
    setBusy(true);
    try {
      await blockPlayer(user.uid, target);
      setResult(t.moderation.blockedDone(target.username));
    } catch {
      setResult(t.moderation.blockFailed);
    }
    setBusy(false);
    setStep('done');
  }

  const btn: React.CSSProperties = {
    ...MONO, fontSize: 12, padding: '9px 12px', textAlign: 'left', cursor: 'pointer',
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--text-bright)',
  };

  return (
    <>
      <button
        onClick={e => { e.stopPropagation(); setOpen(true); }}
        aria-label={t.moderation.menuLabel(target.username)}
        title={t.moderation.menuLabel(target.username)}
        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0 4px', fontSize: 13, lineHeight: 1, flexShrink: 0 }}
      >⋮</button>
      {open && (
        <div
          role="dialog" aria-modal="true" aria-label={t.moderation.menuLabel(target.username)}
          onClick={e => { e.stopPropagation(); close(); }}
          style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 340, background: 'var(--bg-panel, #0b0b18)', border: '1px solid rgba(255,45,120,0.35)', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            <p style={{ ...ORB, fontSize: 11, color: '#ff2d78', marginBottom: 2 }}>{target.username}</p>
            {text && step !== 'done' && (
              <p style={{ ...MONO, fontSize: 11, color: 'var(--text-dim)', borderLeft: '2px solid rgba(255,255,255,0.15)', paddingLeft: 8, wordBreak: 'break-word', maxHeight: 80, overflow: 'hidden' }}>{text}</p>
            )}

            {step === 'menu' && (
              <>
                <button style={btn} onClick={() => setStep('reasons')}>⚑ {t.moderation.report}</button>
                {!isBlocked && <button style={btn} onClick={() => setStep('confirmBlock')}>⛔ {t.moderation.block}</button>}
              </>
            )}

            {step === 'reasons' && (
              <>
                <p style={{ ...MONO, fontSize: 11, color: 'var(--text-main)' }}>{t.moderation.reasonTitle}</p>
                {REPORT_REASONS.map(r => (
                  <button key={r} style={btn} disabled={busy} onClick={() => sendReport(r)}>{t.moderation.reasons[r]}</button>
                ))}
              </>
            )}

            {step === 'confirmBlock' && (
              <>
                <p style={{ ...MONO, fontSize: 11, color: 'var(--text-main)', lineHeight: 1.5 }}>{t.moderation.blockConfirm(target.username)}</p>
                <button style={{ ...btn, borderColor: 'rgba(255,68,68,0.5)', color: '#ff8080' }} disabled={busy} onClick={confirmBlock}>⛔ {t.moderation.block}</button>
              </>
            )}

            {step === 'done' && <p role="status" style={{ ...MONO, fontSize: 11, color: 'var(--text-main)', lineHeight: 1.5 }}>{result}</p>}

            <button onClick={close} style={{ ...MONO, fontSize: 11, padding: '7px 12px', cursor: 'pointer', background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-dim)', marginTop: 4 }}>
              {step === 'done' ? t.moderation.close : t.moderation.cancel}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
