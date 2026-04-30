import { useState } from 'react';
import { useAuthStore } from '../store/authStore';

type Mode = 'login' | 'register';

export default function AuthScreen() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const login = useAuthStore(s => s.login);
  const register = useAuthStore(s => s.register);
  const error = useAuthStore(s => s.error);
  const clearError = useAuthStore(s => s.clearError);

  function switchMode(m: Mode) {
    setMode(m);
    clearError();
    setEmail('');
    setPassword('');
    setUsername('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    if (mode === 'login') {
      await login(email, password);
    } else {
      if (!username.trim()) { setSubmitting(false); return; }
      await register(email, password, username.trim());
    }
    setSubmitting(false);
  }

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
    color: '#64748b',
    fontSize: 7,
    display: 'block',
    marginBottom: 5,
  };

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: '#0f0e17' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <p style={{ fontSize: 40, marginBottom: 8 }}>🏰</p>
          <h1 style={{ color: '#fbbf24', fontSize: 13, marginBottom: 6, letterSpacing: 1 }}>REALM OF VALOR</h1>
          <p style={{ color: '#475569', fontSize: 6 }}>FAIR PLAY RPG — BEZ PAY TO WIN</p>
        </div>

        {/* Mode tabs */}
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
              {m === 'login' ? 'LOGOWANIE' : 'REJESTRACJA'}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="card p-3">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {mode === 'register' && (
              <div>
                <label style={labelStyle}>NICK GRACZA</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Twój nick w rankingu..."
                  maxLength={20}
                  required
                  style={inputStyle}
                />
              </div>
            )}

            <div>
              <label style={labelStyle}>EMAIL</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="gracz@email.com"
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>HASŁO</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="min. 6 znaków"
                required
                style={inputStyle}
              />
            </div>

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
              {submitting ? '...' : mode === 'login' ? '▶ ZALOGUJ SIĘ' : '▶ UTWÓRZ KONTO'}
            </button>
          </form>

          <p style={{ color: '#334155', fontSize: 6, textAlign: 'center', marginTop: 12 }}>
            {mode === 'login' ? 'Nie masz konta?' : 'Masz już konto?'}{' '}
            <button
              onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
              style={{ background: 'none', border: 'none', color: '#d97706', fontFamily: "'Press Start 2P', monospace", fontSize: 6, cursor: 'pointer' }}
            >
              {mode === 'login' ? 'Zarejestruj się' : 'Zaloguj się'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
