import { useGameStore } from '../store/gameStore';
import { MONO } from '../utils/styles';
import GameIcon from './GameIcon';

const CSS = `
@keyframes lvl-pop {
  0%   { opacity: 0; transform: scale(0.6); filter: blur(8px); }
  60%  { opacity: 1; transform: scale(1.06); filter: blur(0); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes lvl-star {
  0%   { transform: scale(0) rotate(-180deg); opacity: 0; }
  60%  { transform: scale(1.3) rotate(10deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
@keyframes lvl-glow {
  0%,100% { box-shadow: 0 0 40px rgba(255,200,58,0.4); }
  50%      { box-shadow: 0 0 70px rgba(255,200,58,0.7), 0 0 120px rgba(255,200,58,0.25); }
}
@keyframes lvl-ray {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@keyframes lvl-fade-in { from { opacity: 0; } to { opacity: 1; } }
`;

export default function LevelUpModal() {
  const level = useGameStore(s => s.levelUpPending);

  if (!level) return null;

  const dismiss = () => useGameStore.setState({ levelUpPending: null });

  return (
    <div
      onClick={dismiss}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.78)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'lvl-fade-in 0.25s ease',
      }}
    >
      <style>{CSS}</style>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          background: '#0a0a12',
          border: '2px solid #ffc83a',
          borderRadius: 6,
          padding: '32px 28px',
          textAlign: 'center',
          maxWidth: 300,
          width: '90%',
          overflow: 'hidden',
          animation: 'lvl-pop 0.45s cubic-bezier(0.34, 1.4, 0.64, 1) both, lvl-glow 2.2s ease-in-out 0.45s infinite',
        }}
      >
        {/* Rotating light rays behind the star */}
        <div style={{
          position: 'absolute', top: -40, left: '50%', width: 220, height: 220,
          marginLeft: -110, pointerEvents: 'none', opacity: 0.35,
          background: 'conic-gradient(from 0deg, transparent 0deg, rgba(255,200,58,0.5) 12deg, transparent 24deg, transparent 90deg, rgba(255,200,58,0.4) 102deg, transparent 114deg, transparent 180deg, rgba(255,200,58,0.5) 192deg, transparent 204deg, transparent 270deg, rgba(255,200,58,0.4) 282deg, transparent 294deg)',
          animation: 'lvl-ray 9s linear infinite',
          maskImage: 'radial-gradient(circle, black 0%, transparent 68%)',
          WebkitMaskImage: 'radial-gradient(circle, black 0%, transparent 68%)',
        }} />

        <div style={{ marginBottom: 12, position: 'relative', animation: 'lvl-star 0.6s cubic-bezier(0.34, 1.5, 0.64, 1) 0.15s both' }}>
          <GameIcon name="star" size={48} color="#ffc83a" style={{ display: 'block', margin: '0 auto', filter: 'drop-shadow(0 0 14px #ffc83a)' }} />
        </div>
        <p style={{ ...MONO, fontSize: 22, color: '#ffc83a', marginBottom: 6, letterSpacing: '0.05em', position: 'relative', textShadow: '0 0 16px rgba(255,200,58,0.7)' }}>
          POZIOM {level}!
        </p>
        <p style={{ ...MONO, fontSize: 13, color: '#eee', marginBottom: 4, position: 'relative' }}>
          Gratulacje!
        </p>
        <p style={{ ...MONO, fontSize: 11, color: '#aaa', marginBottom: 20, position: 'relative' }}>
          Wbiłeś kolejny poziom!!!
        </p>
        <p style={{ ...MONO, fontSize: 10, color: '#5a9040', marginBottom: 20, position: 'relative' }}>
          +3 gemy • +{(level > 1 ? 8 : 0)} MaxHP
        </p>
        <button
          onClick={dismiss}
          style={{
            ...MONO, fontSize: 12,
            background: 'linear-gradient(135deg, #7a5a00, #ffc83a)',
            border: 'none', borderRadius: 4,
            color: '#000', padding: '10px 32px',
            cursor: 'pointer', letterSpacing: '0.08em',
            position: 'relative',
          }}
        >
          DALEJ
        </button>
      </div>
    </div>
  );
}
