import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useT } from '../hooks/useT';
import { useLangStore } from '../store/langStore';

import logoImg from '../assets/logo.png';
import { PX, MONO } from '../utils/styles';

type Mode = 'login' | 'register' | 'reset';

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#0a0a1a',
  border: '2px solid #334155',
  padding: '8px 10px',
  color: '#e2e8f0',
  fontFamily: "'Press Start 2P', monospace",
  fontSize: 10,
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  ...PX(7),
  color: '#64748b',
  display: 'block',
  marginBottom: 5,
};

function VerificationScreen() {
  const t = useT();
  const pendingEmail       = useAuthStore(s => s.pendingEmail);
  const resendVerification = useAuthStore(s => s.resendVerification);
  const checkVerification  = useAuthStore(s => s.checkVerification);
  const logout             = useAuthStore(s => s.logout);
  const error              = useAuthStore(s => s.error);

  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);

  async function handleResend() {
    setSending(true);
    await resendVerification();
    setSending(false);
    setSent(true);
    setTimeout(() => setSent(false), 10000);
  }

  async function handleCheck() {
    setChecking(true);
    await checkVerification();
    setChecking(false);
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: '#0f0e17' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <LangToggle />
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <p style={{ fontSize: 48, marginBottom: 8 }}>📧</p>
          <h1 style={{ ...PX(10), color: '#fbbf24', marginBottom: 10 }}>{t.auth.verifyTitle}</h1>
        </div>

        <div className="card p-3" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: 'rgba(250,204,21,0.08)', border: '2px solid rgba(250,204,21,0.3)', padding: '12px 14px' }}>
            <p style={{ ...MONO, fontSize: 10, color: '#fbbf24', marginBottom: 6 }}>
              {t.auth.verifySentTo}
            </p>
            <p style={{ ...PX(8), color: '#fff', wordBreak: 'break-all' }}>{pendingEmail}</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <p style={{ ...MONO, fontSize: 10, color: '#94a3b8', lineHeight: 1.6 }}>
              {t.auth.verifyStep1}
            </p>
            <p style={{ ...MONO, fontSize: 10, color: '#94a3b8', lineHeight: 1.6 }}>
              {t.auth.verifyStep2}
            </p>
            <p style={{ ...MONO, fontSize: 10, color: '#f59e0b', lineHeight: 1.6 }}>
              {t.auth.verifySpam}
            </p>
          </div>

          {error && (
            <div style={{ background: '#1c0a0a', border: '2px solid #7f1d1d', padding: '6px 8px' }}>
              <p style={{ color: '#f87171', ...MONO, fontSize: 10 }}>⚠ {error}</p>
            </div>
          )}

          {sent && (
            <div style={{ background: 'rgba(34,197,94,0.08)', border: '2px solid rgba(34,197,94,0.3)', padding: '6px 8px' }}>
              <p style={{ color: '#4ade80', ...MONO, fontSize: 10 }}>{t.auth.verifyResentOk}</p>
            </div>
          )}

          <button
            onClick={handleCheck}
            disabled={checking}
            className="btn btn-primary"
            style={{ width: '100%', padding: '10px', ...PX(7) }}
          >
            {checking ? '...' : t.auth.verifyAlready}
          </button>

          <button
            onClick={handleResend}
            disabled={sending || sent}
            className="btn btn-secondary"
            style={{ width: '100%', padding: '10px', ...PX(7), opacity: sent ? 0.6 : 1 }}
          >
            {sending ? '...' : sent ? t.auth.verifySentOk : t.auth.verifyResend}
          </button>

          <button
            onClick={() => logout()}
            className="btn"
            style={{ width: '100%', padding: '8px', ...PX(6), background: 'none', border: '1px solid #334155', color: '#475569' }}
          >
            {t.auth.verifyBack}
          </button>
        </div>
      </div>
    </div>
  );
}

function LangToggle() {
  const lang    = useLangStore(s => s.lang);
  const setLang = useLangStore(s => s.setLang);
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12, gap: 4 }}>
      {(['pl', 'en'] as const).map(l => (
        <button
          key={l}
          onClick={() => setLang(l)}
          style={{
            background: lang === l ? 'rgba(217,119,6,0.15)' : 'transparent',
            border: `1px solid ${lang === l ? '#d97706' : '#334155'}`,
            color: lang === l ? '#fbbf24' : '#475569',
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 10,
            padding: '4px 8px',
            cursor: 'pointer',
          }}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export default function AuthScreen() {
  const t = useT();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const login         = useAuthStore(s => s.login);
  const register      = useAuthStore(s => s.register);
  const resetPassword = useAuthStore(s => s.resetPassword);
  const error         = useAuthStore(s => s.error);
  const needsVerification = useAuthStore(s => s.needsVerification);
  const clearError = useAuthStore(s => s.clearError);

  if (needsVerification) return <VerificationScreen />;

  function switchMode(m: Mode) {
    setMode(m);
    clearError();
    setEmail('');
    setPassword('');
    setUsername('');
    setResetSent(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    if (mode === 'login') {
      await login(email, password);
    } else if (mode === 'register') {
      if (!username.trim()) { setSubmitting(false); return; }
      await register(email, password, username.trim());
    } else {
      const ok = await resetPassword(email);
      if (ok) setResetSent(true);
    }
    setSubmitting(false);
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: '#0f0e17' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <LangToggle />
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src={logoImg} alt="GlitchSoul" style={{
            width: 160, height: 'auto', display: 'block', margin: '0 auto 8px',
            filter: 'drop-shadow(0 0 20px rgba(140,60,255,0.9)) drop-shadow(0 0 40px rgba(0,200,255,0.4))',
          }} />
          <h1 style={{ color: '#fbbf24', fontSize: 13, marginBottom: 10, letterSpacing: 1 }}>GlitchSoul</h1>
          <div style={{
            display: 'inline-block',
            background: 'linear-gradient(90deg, rgba(220,38,38,0.15), rgba(220,38,38,0.25), rgba(220,38,38,0.15))',
            border: '2px solid #dc2626',
            padding: '6px 18px',
            marginBottom: 10,
            boxShadow: '0 0 18px rgba(220,38,38,0.5), 0 0 40px rgba(220,38,38,0.2)',
            animation: 'neon-pulse 2s ease-in-out infinite',
          }}>
            <span style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 13,
              color: '#f87171',
              letterSpacing: 3,
              textShadow: '0 0 10px #dc2626, 0 0 20px #dc2626',
            }}>
              ⚠ EARLY ACCESS ⚠
            </span>
          </div>
          <p style={{ color: '#475569', fontSize: 10 }}>{t.app.tagline}</p>
        </div>

        {/* Mode tabs — hidden on reset screen */}
        {mode !== 'reset' && (
          <div style={{ display: 'flex', marginBottom: 16, border: '2px solid #334155' }}>
            {(['login', 'register'] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                style={{
                  flex: 1,
                  padding: '8px 4px',
                  background: mode === m ? '#1c1408' : '#0a0a1a',
                  border: 'none',
                  borderBottom: mode === m ? '2px solid #d97706' : '2px solid transparent',
                  color: mode === m ? '#fbbf24' : '#475569',
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: 10,
                  cursor: 'pointer',
                }}
              >
                {m === 'login' ? t.auth.login : t.auth.register}
              </button>
            ))}
          </div>
        )}

        {/* Discord */}
        <a
          href="https://discord.gg/8vCk7jxna"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: 'rgba(88,101,242,0.12)',
            border: '2px solid rgba(88,101,242,0.5)',
            color: '#7289da',
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 10,
            padding: '9px 16px',
            marginBottom: 16,
            textDecoration: 'none',
            cursor: 'pointer',
            boxShadow: '0 0 14px rgba(88,101,242,0.2)',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
        >
          <svg width="18" height="14" viewBox="0 0 24 18" fill="#7289da" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.317 1.492a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 1.492a.07.07 0 0 0-.032.027C.533 6.168-.32 10.702.099 15.179c.002.025.016.049.035.064a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.1.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 12.278c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
          DISCORD — DOŁĄCZ DO SERWERA
        </a>

        {/* Form */}
        <div className="card p-3">
          {mode === 'reset' && (
            <h2 style={{ ...PX(8), color: '#fbbf24', marginBottom: 12, textAlign: 'center' }}>
              {t.auth.resetTitle}
            </h2>
          )}

          {resetSent ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: 'rgba(34,197,94,0.08)', border: '2px solid rgba(34,197,94,0.3)', padding: '12px 14px' }}>
                <p style={{ ...MONO, fontSize: 10, color: '#4ade80', textAlign: 'center' }}>
                  {t.auth.resetSent}
                </p>
              </div>
              <button
                onClick={() => switchMode('login')}
                className="btn btn-secondary"
                style={{ width: '100%', padding: '10px', ...PX(7) }}
              >
                {t.auth.resetBack}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {mode === 'register' && (
                <div>
                  <label htmlFor="auth-username" style={labelStyle}>{t.auth.username}</label>
                  <input
                    id="auth-username"
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder={t.auth.usernamePlaceholder}
                    maxLength={20}
                    required
                    style={inputStyle}
                  />
                </div>
              )}

              <div>
                <label htmlFor="auth-email" style={labelStyle}>{t.auth.email}</label>
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t.auth.emailPlaceholder}
                  required
                  style={inputStyle}
                />
              </div>

              {mode !== 'reset' && (
                <div>
                  <label htmlFor="auth-password" style={labelStyle}>{t.auth.password}</label>
                  <input
                    id="auth-password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={t.auth.passwordPlaceholder}
                    required
                    style={inputStyle}
                  />
                </div>
              )}

              {mode === 'reset' && (
                <p style={{ ...MONO, fontSize: 10, color: '#64748b', lineHeight: 1.5 }}>
                  {t.auth.resetDesc}
                </p>
              )}

              {mode === 'register' && (
                <p style={{ ...MONO, fontSize: 10, color: '#475569', lineHeight: 1.5 }}>
                  {t.auth.registerNote}
                </p>
              )}

              {error && (
                <div style={{ background: '#1c0a0a', border: '2px solid #7f1d1d', padding: '6px 8px' }}>
                  <p style={{ color: '#f87171', fontSize: 10 }}>⚠ {error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{ width: '100%', padding: '10px', fontSize: 10 }}
              >
                {submitting ? '...' : mode === 'login' ? t.auth.loginBtn : mode === 'register' ? t.auth.registerBtn : t.auth.resetBtn}
              </button>

              {mode === 'reset' && (
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  style={{ background: 'none', border: 'none', color: '#475569', fontFamily: "'Press Start 2P', monospace", fontSize: 10, cursor: 'pointer', padding: '4px' }}
                >
                  {t.auth.resetBack}
                </button>
              )}
            </form>
          )}

          {mode !== 'reset' && !resetSent && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <p style={{ color: '#334155', fontSize: 10, textAlign: 'center' }}>
                {mode === 'login' ? t.auth.noAccount : t.auth.hasAccount}{' '}
                <button
                  onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                  style={{ background: 'none', border: 'none', color: '#d97706', fontFamily: "'Press Start 2P', monospace", fontSize: 10, cursor: 'pointer' }}
                >
                  {mode === 'login' ? t.auth.signUpLink : t.auth.signInLink}
                </button>
              </p>
              {mode === 'login' && (
                <button
                  onClick={() => switchMode('reset')}
                  style={{ background: 'none', border: 'none', color: '#475569', fontFamily: "'Press Start 2P', monospace", fontSize: 10, cursor: 'pointer' }}
                >
                  {t.auth.forgotPassword}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
