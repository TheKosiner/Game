import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useT } from '../hooks/useT';
import { useLangStore } from '../store/langStore';

import logoImg from '../assets/logo.webp';
import { PX, MONO, ORB } from '../utils/styles';
import GameIcon from './GameIcon';
import CyberpunkBg from './CyberpunkBg';
import LangPicker from './LangPicker';

type Mode = 'login' | 'register' | 'reset';

const AUTH_CSS = `
@keyframes auth-in {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes auth-logo-in {
  from { opacity: 0; transform: scale(0.85); filter: blur(6px); }
  to   { opacity: 1; transform: scale(1); filter: blur(0); }
}
.auth-input {
  width: 100%;
  background: rgba(4,4,14,0.85);
  border: 1px solid rgba(255,45,120,0.25);
  padding: 10px 12px;
  color: var(--text-bright);
  font-family: 'Share Tech Mono', monospace;
  font-size: 13px;
  letter-spacing: 0.04em;
  outline: none;
  box-sizing: border-box;
  box-shadow: inset 0 1px 4px rgba(0,0,0,0.5);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.auth-input::placeholder { color: rgba(153,153,204,0.35); }
.auth-input:focus {
  border-color: rgba(0,245,255,0.7);
  box-shadow: 0 0 14px rgba(0,245,255,0.18), inset 0 1px 4px rgba(0,0,0,0.5);
}
.auth-input.err { border-color: rgba(255,68,68,0.6); }
.auth-tab {
  flex: 1;
  padding: 10px 4px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-muted);
  font-family: 'Orbitron', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s, text-shadow 0.15s;
}
.auth-tab.active {
  color: var(--pink);
  border-bottom-color: var(--pink);
  text-shadow: 0 0 10px var(--pink);
}
.auth-link {
  background: none; border: none; cursor: pointer;
  font-family: 'Share Tech Mono', monospace; font-size: 11px;
  padding: 2px 4px;
  transition: color 0.15s, text-shadow 0.15s;
}
`;

const labelStyle: React.CSSProperties = {
  ...ORB,
  fontSize: 8, fontWeight: 700,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: 'rgba(0,245,255,0.55)',
  display: 'block',
  marginBottom: 6,
};

// Shared page shell: aurora background + centered column + language toggle
function AuthShell({ children, onBack }: { children: React.ReactNode; onBack?: () => void }) {
  const lang = useLangStore(s => s.lang);
  return (
    <div style={{
      minHeight: '100dvh', position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
      background: 'radial-gradient(ellipse at 50% 0%, #0d0a1e 0%, #060410 55%, #030208 100%)',
    }}>
      <style>{AUTH_CSS}</style>
      <CyberpunkBg />
      <div style={{ width: '100%', maxWidth: 380, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {onBack && (
            <button onClick={onBack} style={{
              ...MONO, fontSize: 11, color: 'var(--text-muted)',
              background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 12px',
            }}>
              {lang !== 'pl' ? '← Home' : '← Strona główna'}
            </button>
          )}
          <span style={{ flex: 1 }} />
          <LangToggle />
        </div>
        {children}
      </div>
    </div>
  );
}

function BrandHeader({ compact }: { compact?: boolean }) {
  const t = useT();
  return (
    <div style={{ textAlign: 'center', marginBottom: 20, animation: 'auth-logo-in 0.6s ease both' }}>
      <img src={logoImg} alt="GlitchSoul" style={{
        width: compact ? 110 : 150, height: 'auto', display: 'block', margin: '0 auto 10px',
        filter: 'drop-shadow(0 0 20px rgba(140,60,255,0.9)) drop-shadow(0 0 40px rgba(0,200,255,0.4))',
      }} />
      <h1 style={{ ...ORB, fontSize: 22, fontWeight: 900, letterSpacing: 1, marginBottom: 10, lineHeight: 1 }}>
        <span style={{ color: '#00f5ff', textShadow: '0 0 10px #00f5ff, 0 0 26px #00e5ff' }}>Glitch</span>
        <span style={{ color: '#ff2d78', textShadow: '0 0 10px #ff2d78, 0 0 26px #ff2d78' }}>Soul</span>
      </h1>
      <div style={{
        display: 'inline-block',
        background: 'linear-gradient(90deg, rgba(220,38,38,0.12), rgba(220,38,38,0.22), rgba(220,38,38,0.12))',
        border: '1px solid rgba(220,38,38,0.8)',
        padding: '5px 16px',
        marginBottom: 10,
        boxShadow: '0 0 18px rgba(220,38,38,0.4), 0 0 40px rgba(220,38,38,0.15)',
        animation: 'neon-pulse 2.4s ease-in-out infinite',
      }}>
        <span style={{
          ...ORB, fontSize: 10, fontWeight: 700,
          color: '#f87171', letterSpacing: 3,
          textShadow: '0 0 10px #dc2626',
        }}>
          <GameIcon name="warning" size={10} color="#f87171" /> EARLY ACCESS <GameIcon name="warning" size={10} color="#f87171" />
        </span>
      </div>
      <p style={{ ...MONO, color: 'var(--text-muted)', fontSize: 11, letterSpacing: '0.08em' }}>{t.app.tagline}</p>
    </div>
  );
}

function ErrorBox({ text }: { text: string }) {
  return (
    <div style={{ background: 'rgba(255,68,68,0.07)', border: '1px solid rgba(255,68,68,0.45)', padding: '8px 10px', boxShadow: '0 0 12px rgba(255,68,68,0.08)' }}>
      <p style={{ color: '#f87171', ...MONO, fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}>
        <GameIcon name="warning" size={11} color="#f87171" /> {text}
      </p>
    </div>
  );
}

function SuccessBox({ text }: { text: string }) {
  return (
    <div style={{ background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.35)', padding: '8px 10px', boxShadow: '0 0 12px rgba(0,255,136,0.08)' }}>
      <p style={{ color: '#4ade80', ...MONO, fontSize: 11, textAlign: 'center' }}>{text}</p>
    </div>
  );
}

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
    <AuthShell>
      <div style={{ textAlign: 'center', marginBottom: 20, animation: 'auth-logo-in 0.6s ease both' }}>
        <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'center', filter: 'drop-shadow(0 0 16px rgba(0,245,255,0.6))' }}>
          <GameIcon name="email" size={48} color="#00f5ff" />
        </div>
        <h1 style={{ ...ORB, fontSize: 15, fontWeight: 900, color: '#00f5ff', textShadow: '0 0 12px #00f5ff', marginBottom: 6, letterSpacing: '0.08em' }}>
          {t.auth.verifyTitle}
        </h1>
      </div>

      <div className="card p-3" style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'auth-in 0.5s ease 0.1s both' }}>
        <div style={{ background: 'rgba(0,245,255,0.05)', border: '1px solid rgba(0,245,255,0.3)', padding: '12px 14px' }}>
          <p style={{ ...MONO, fontSize: 10, color: 'rgba(0,245,255,0.7)', marginBottom: 6, letterSpacing: '0.06em' }}>
            {t.auth.verifySentTo}
          </p>
          <p style={{ ...PX(8), color: '#fff', wordBreak: 'break-all' }}>{pendingEmail}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <p style={{ ...MONO, fontSize: 11, color: 'var(--text-main)', lineHeight: 1.6 }}>{t.auth.verifyStep1}</p>
          <p style={{ ...MONO, fontSize: 11, color: 'var(--text-main)', lineHeight: 1.6 }}>{t.auth.verifyStep2}</p>
          <p style={{ ...MONO, fontSize: 11, color: '#f59e0b', lineHeight: 1.6 }}>{t.auth.verifySpam}</p>
        </div>

        {error && <ErrorBox text={error} />}
        {sent && <SuccessBox text={t.auth.verifyResentOk} />}

        <button
          onClick={handleCheck}
          disabled={checking}
          className="btn btn-primary"
          style={{ width: '100%', padding: '11px', fontSize: 10 }}
        >
          {checking ? '...' : t.auth.verifyAlready}
        </button>

        <button
          onClick={handleResend}
          disabled={sending || sent}
          className="btn btn-secondary"
          style={{ width: '100%', padding: '11px', fontSize: 10, opacity: sent ? 0.6 : 1 }}
        >
          {sending ? '...' : sent ? t.auth.verifySentOk : <><GameIcon name="retry" size={10} color="#00f5ff" style={{ marginRight: 4 }} />{t.auth.verifyResend}</>}
        </button>

        <button
          onClick={() => logout()}
          className="auth-link"
          style={{ width: '100%', color: 'var(--text-muted)' }}
        >
          {t.auth.verifyBack}
        </button>
      </div>
    </AuthShell>
  );
}

function LangToggle() {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
      <LangPicker />
    </div>
  );
}

export default function AuthScreen({ onBack }: { onBack?: () => void } = {}) {
  const t = useT();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const USERNAME_RE = /^[a-zA-Z0-9_-]*$/;
  const usernameError = mode === 'register' && username.length > 0
    ? username.length < 3
      ? t.auth.errUsernameTooShort
      : !USERNAME_RE.test(username)
      ? t.auth.errUsernameInvalidChars
      : null
    : null;

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
      if (!username.trim() || usernameError) { setSubmitting(false); return; }
      await register(email, password, username.trim());
    } else {
      const ok = await resetPassword(email);
      if (ok) setResetSent(true);
    }
    setSubmitting(false);
  }

  return (
    <AuthShell onBack={onBack}>
      <BrandHeader />

      <div style={{ animation: 'auth-in 0.5s ease 0.15s both' }}>
        {/* Discord */}
        <a
          href="https://discord.gg/8vCk7jxna"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: 'rgba(88,101,242,0.1)',
            border: '1px solid rgba(88,101,242,0.5)',
            color: '#8fa1ff',
            ...ORB, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
            padding: '10px 16px',
            marginBottom: 16,
            textDecoration: 'none',
            cursor: 'pointer',
            boxShadow: '0 0 14px rgba(88,101,242,0.15)',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
        >
          <svg width="18" height="14" viewBox="0 0 24 18" fill="#8fa1ff" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.317 1.492a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 1.492a.07.07 0 0 0-.032.027C.533 6.168-.32 10.702.099 15.179c.002.025.016.049.035.064a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.1.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 12.278c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
          {t.auth.discordJoin}
        </a>

        {/* Mode tabs — hidden on reset screen */}
        {mode !== 'reset' && (
          <div style={{
            display: 'flex', marginBottom: 16,
            background: 'rgba(4,4,14,0.7)',
            border: '1px solid rgba(255,45,120,0.15)',
            borderBottom: '1px solid rgba(255,45,120,0.25)',
          }}>
            {(['login', 'register'] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`auth-tab${mode === m ? ' active' : ''}`}
              >
                {m === 'login' ? t.auth.login : t.auth.register}
              </button>
            ))}
          </div>
        )}

        {/* Form */}
        <div className="card p-4">
          {mode === 'reset' && (
            <h2 style={{ ...ORB, fontSize: 12, fontWeight: 700, color: '#00f5ff', textShadow: '0 0 10px rgba(0,245,255,0.5)', marginBottom: 14, textAlign: 'center', letterSpacing: '0.1em' }}>
              {t.auth.resetTitle}
            </h2>
          )}

          {resetSent ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <SuccessBox text={t.auth.resetSent} />
              <button
                onClick={() => switchMode('login')}
                className="btn btn-secondary"
                style={{ width: '100%', padding: '11px', fontSize: 10 }}
              >
                {t.auth.resetBack}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                    className={`auth-input${usernameError ? ' err' : ''}`}
                  />
                  {usernameError && (
                    <p style={{ ...MONO, fontSize: 10, color: '#f87171', marginTop: 5 }}>
                      <GameIcon name="warning" size={9} color="#f87171" /> {usernameError}
                    </p>
                  )}
                  {!usernameError && username.length >= 3 && (
                    <p style={{ ...MONO, fontSize: 10, color: '#4ade80', marginTop: 5 }}>
                      <GameIcon name="check" size={9} color="#4ade80" />
                    </p>
                  )}
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
                  className="auth-input"
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
                    className="auth-input"
                  />
                </div>
              )}

              {mode === 'reset' && (
                <p style={{ ...MONO, fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.6 }}>
                  {t.auth.resetDesc}
                </p>
              )}

              {mode === 'register' && (
                <p style={{ ...MONO, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  {t.auth.registerNote}
                </p>
              )}

              {error && <ErrorBox text={error} />}

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', fontSize: 11, marginTop: 2 }}
              >
                {submitting ? '...' : mode === 'login' ? t.auth.loginBtn : mode === 'register' ? t.auth.registerBtn : t.auth.resetBtn}
              </button>

              {mode === 'reset' && (
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="auth-link"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {t.auth.resetBack}
                </button>
              )}
            </form>
          )}

          {mode !== 'reset' && !resetSent && (
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <p style={{ ...MONO, color: 'var(--text-muted)', fontSize: 11, textAlign: 'center' }}>
                {mode === 'login' ? t.auth.noAccount : t.auth.hasAccount}{' '}
                <button
                  onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                  className="auth-link"
                  style={{ color: '#ff2d78', textShadow: '0 0 8px rgba(255,45,120,0.5)' }}
                >
                  {mode === 'login' ? t.auth.signUpLink : t.auth.signInLink}
                </button>
              </p>
              {mode === 'login' && (
                <button
                  onClick={() => switchMode('reset')}
                  className="auth-link"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {t.auth.forgotPassword}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </AuthShell>
  );
}
