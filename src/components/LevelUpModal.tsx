import { useGameStore } from '../store/gameStore';
import { MONO } from '../utils/styles';

export default function LevelUpModal() {
  const level = useGameStore(s => s.levelUpPending);

  if (!level) return null;

  const dismiss = () => useGameStore.setState({ levelUpPending: null });

  return (
    <div
      onClick={dismiss}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0a0a12',
          border: '2px solid #ffc83a',
          borderRadius: 6,
          padding: '32px 28px',
          textAlign: 'center',
          boxShadow: '0 0 40px rgba(255,200,58,0.4)',
          maxWidth: 300,
          width: '90%',
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 12 }}>⭐</div>
        <p style={{ ...MONO, fontSize: 22, color: '#ffc83a', marginBottom: 6, letterSpacing: '0.05em' }}>
          POZIOM {level}!
        </p>
        <p style={{ ...MONO, fontSize: 13, color: '#eee', marginBottom: 4 }}>
          Gratulacje!
        </p>
        <p style={{ ...MONO, fontSize: 11, color: '#aaa', marginBottom: 20 }}>
          Wbiłeś kolejny poziom!!! 🎉
        </p>
        <p style={{ ...MONO, fontSize: 10, color: '#5a9040', marginBottom: 20 }}>
          +3 gemy • +{(level > 1 ? 8 : 0)} MaxHP • +1 punkt atrybutów
        </p>
        <button
          onClick={dismiss}
          style={{
            ...MONO, fontSize: 12,
            background: 'linear-gradient(135deg, #7a5a00, #ffc83a)',
            border: 'none', borderRadius: 4,
            color: '#000', padding: '10px 32px',
            cursor: 'pointer', letterSpacing: '0.08em',
          }}
        >
          DALEJ
        </button>
      </div>
    </div>
  );
}
