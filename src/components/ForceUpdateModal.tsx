import { useLangStore } from '../store/langStore';
import type { UpdateInfo } from '../lib/appUpdate';

const ORB: React.CSSProperties = { fontFamily: "'Orbitron', monospace", fontWeight: 700 };
const MONO: React.CSSProperties = { fontFamily: "'Share Tech Mono', monospace" };

// Fully blocking update gate — no dismiss. Shown only on native when a newer
// APK build exists. The button opens the APK download in the system browser.
export default function ForceUpdateModal({ info }: { info: UpdateInfo }) {
  const isEn = useLangStore(s => s.lang) === 'en';

  function handleUpdate() {
    // _blank → Capacitor opens it in the external browser, where the APK downloads.
    window.open(info.apkUrl, '_blank');
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'radial-gradient(ellipse at 50% 40%, rgba(10,0,30,0.97), rgba(2,0,8,0.99))',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        width: '100%', maxWidth: 360,
        background: 'linear-gradient(160deg, rgba(12,6,26,0.98), rgba(6,2,14,0.99))',
        border: '1px solid rgba(0,229,255,0.4)',
        boxShadow: '0 0 40px rgba(0,229,255,0.15), inset 0 0 30px rgba(0,0,0,0.6)',
        padding: '28px 22px', textAlign: 'center',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <img
          src="/favicon.png"
          alt="GlitchSoul"
          style={{ width: 84, height: 84, objectFit: 'contain', margin: '0 auto', display: 'block',
            filter: 'drop-shadow(0 0 16px rgba(0,229,255,0.45))' }}
        />
        <div style={{
          ...ORB, fontSize: 16, letterSpacing: 1, color: '#00e5ff',
          textShadow: '0 0 14px #00e5ff',
        }}>
          {isEn ? 'UPDATE REQUIRED' : 'WYMAGANA AKTUALIZACJA'}
        </div>
        <p style={{ ...MONO, fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7 }}>
          {isEn
            ? 'A new version of the game is available. Please update to keep playing.'
            : 'Dostępna jest nowa wersja gry. Zaktualizuj, aby kontynuować grę.'}
        </p>
        <p style={{ ...MONO, fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
          {isEn ? 'Build' : 'Wersja'} {info.currentBuild} → {info.latestBuild}
        </p>
        <button
          onClick={handleUpdate}
          style={{
            ...ORB, fontSize: 12, letterSpacing: 1,
            padding: '12px 18px', cursor: 'pointer',
            background: 'linear-gradient(135deg, rgba(0,229,255,0.25), rgba(0,229,255,0.1))',
            border: '1px solid rgba(0,229,255,0.6)',
            color: '#fff', textShadow: '0 0 8px #00e5ff',
          }}
        >
          {isEn ? '⬇ DOWNLOAD UPDATE' : '⬇ POBIERZ AKTUALIZACJĘ'}
        </button>
      </div>
    </div>
  );
}
