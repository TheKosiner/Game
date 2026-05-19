import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useT } from '../hooks/useT';
import { useLangStore } from '../store/langStore';

import logoImg from '../assets/logo.png';

type Mode = 'login' | 'register' | 'reset';

const PX = (s: number) => ({ fontFamily: "'Press Start 2P', monospace", fontSize: s } as const);
const MONO = { fontFamily: "'Share Tech Mono', monospace" } as const;

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#0a0a1a',
  border: '2px solid #334155',
  padding: '8px 10px',
  color: '#e2e8f0',
  fontFamily: "'Press Start 2P', monospace",
  fontSize: 8,
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
            <p style={{ ...MONO, fontSize: 9, color: '#94a3b8', lineHeight: 1.6 }}>
              {t.auth.verifyStep1}
            </p>
            <p style={{ ...MONO, fontSize: 9, color: '#94a3b8', lineHeight: 1.6 }}>
              {t.auth.verifyStep2}
            </p>
            <p style={{ ...MONO, fontSize: 9, color: '#f59e0b', lineHeight: 1.6 }}>
              {t.auth.verifySpam}
            </p>
          </div>

          {error && (
            <div style={{ background: '#1c0a0a', border: '2px solid #7f1d1d', padding: '6px 8px' }}>
              <p style={{ color: '#f87171', ...MONO, fontSize: 9 }}>⚠ {error}</p>
            </div>
          )}

          {sent && (
            <div style={{ background: 'rgba(34,197,94,0.08)', border: '2px solid rgba(34,197,94,0.3)', padding: '6px 8px' }}>
              <p style={{ color: '#4ade80', ...MONO, fontSize: 9 }}>{t.auth.verifyResentOk}</p>
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
            fontSize: 7,
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
          <h1 style={{ color: '#fbbf24', fontSize: 13, marginBottom: 6, letterSpacing: 1 }}>GlitchSoul</h1>
          <p style={{ color: '#475569', fontSize: 6 }}>{t.app.tagline}</p>
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
                  fontSize: 7,
                  cursor: 'pointer',
                }}
              >
                {m === 'login' ? t.auth.login : t.auth.register}
              </button>
            ))}
          </div>
        )}

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
                  <label style={labelStyle}>{t.auth.username}</label>
                  <input
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
                <label style={labelStyle}>{t.auth.email}</label>
                <input
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
                  <label style={labelStyle}>{t.auth.password}</label>
                  <input
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
                <p style={{ ...MONO, fontSize: 9, color: '#64748b', lineHeight: 1.5 }}>
                  {t.auth.resetDesc}
                </p>
              )}

              {mode === 'register' && (
                <p style={{ ...MONO, fontSize: 8, color: '#475569', lineHeight: 1.5 }}>
                  {t.auth.registerNote}
                </p>
              )}

              {error && (
                <div style={{ background: '#1c0a0a', border: '2px solid #7f1d1d', padding: '6px 8px' }}>
                  <p style={{ color: '#f87171', fontSize: 7 }}>⚠ {error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{ width: '100%', padding: '10px', fontSize: 8 }}
              >
                {submitting ? '...' : mode === 'login' ? t.auth.loginBtn : mode === 'register' ? t.auth.registerBtn : t.auth.resetBtn}
              </button>

              {mode === 'reset' && (
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  style={{ background: 'none', border: 'none', color: '#475569', fontFamily: "'Press Start 2P', monospace", fontSize: 6, cursor: 'pointer', padding: '4px' }}
                >
                  {t.auth.resetBack}
                </button>
              )}
            </form>
          )}

          {mode !== 'reset' && !resetSent && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <p style={{ color: '#334155', fontSize: 6, textAlign: 'center' }}>
                {mode === 'login' ? t.auth.noAccount : t.auth.hasAccount}{' '}
                <button
                  onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                  style={{ background: 'none', border: 'none', color: '#d97706', fontFamily: "'Press Start 2P', monospace", fontSize: 6, cursor: 'pointer' }}
                >
                  {mode === 'login' ? t.auth.signUpLink : t.auth.signInLink}
                </button>
              </p>
              {mode === 'login' && (
                <button
                  onClick={() => switchMode('reset')}
                  style={{ background: 'none', border: 'none', color: '#475569', fontFamily: "'Press Start 2P', monospace", fontSize: 6, cursor: 'pointer' }}
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
