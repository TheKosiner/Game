import { useEffect, useState } from 'react';
import { useLangStore } from '../store/langStore';
import { PX } from '../utils/styles';

interface Props {
  streakDays: number;
  streakMilestone: 'epic' | 'legendary' | null;
  chestGems: number;
  gemsAdded: number;
  onClose: () => void;
}

// Days in the current 5-day cycle (1-based position)
function cyclePos(streak: number): number {
  const pos = streak % 5;
  return pos === 0 ? 5 : pos;
}

const STYLE = `
@keyframes streak-fire {
  0%,100% { transform: scale(1) rotate(-3deg); }
  50%      { transform: scale(1.18) rotate(3deg); }
}
@keyframes streak-slide-up {
  from { transform: translateY(60px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}
@keyframes streak-chest-glow {
  0%,100% { box-shadow: 0 0 12px 4px var(--glow); }
  50%      { box-shadow: 0 0 28px 12px var(--glow); }
}
@keyframes streak-chest-bounce {
  0%,100% { transform: translateY(0)   scale(1); }
  30%      { transform: translateY(-10px) scale(1.08); }
  60%      { transform: translateY(4px)  scale(0.97); }
}
@keyframes streak-bar-fill {
  from { width: 0%; }
}
@keyframes streak-sparkle {
  0%,100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.5; transform: scale(1.3); }
}
`;

export default function StreakModal({ streakDays, streakMilestone, chestGems, gemsAdded, onClose }: Props) {
  const isEn = useLangStore(s => s.lang) === 'en';
  const [showChest, setShowChest] = useState(false);
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    if (streakMilestone) {
      const t = setTimeout(() => setShowChest(true), 700);
      return () => clearTimeout(t);
    }
  }, [streakMilestone]);

  const isLegendary = streakMilestone === 'legendary';
  const isEpic      = streakMilestone === 'epic';
  const hasMilestone = isEpic || isLegendary;

  const pos      = cyclePos(streakDays);
  const nextMile = hasMilestone ? (isLegendary ? 20 : 5) : (pos < 5 ? 5 - pos : 0);

  const glowColor = isLegendary ? '#ffd700' : '#a855f7';

  return (
    <>
      <style>{STYLE}</style>
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(0,0,0,0.88)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          padding: '0 12px 0',
        }}
        onClick={onClose}
      >
        <div
          style={{
            width: '100%', maxWidth: 420,
            background: 'var(--bg-panel)',
            border: `1px solid ${hasMilestone ? glowColor : 'var(--border-main)'}`,
            boxShadow: hasMilestone ? `0 0 24px ${glowColor}44` : 'none',
            padding: '20px 18px 28px',
            display: 'flex', flexDirection: 'column', gap: 16,
            animation: 'streak-slide-up 0.35s ease-out',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ textAlign: 'center' }}>
            <span style={{
              fontSize: 42, display: 'inline-block',
              animation: 'streak-fire 0.9s ease-in-out infinite',
            }}>🔥</span>
            <p style={{ ...PX(10), color: 'var(--gold-bright)', marginTop: 6, textShadow: '0 0 12px rgba(255,215,0,0.6)' }}>
              {streakDays}
            </p>
            <p style={{ ...PX(5), color: 'var(--text-muted)', marginTop: 3 }}>
              {isEn
                ? `day${streakDays === 1 ? '' : 's'} in a row!`
                : streakDays === 1 ? 'dzień z rzędu!' : streakDays < 5 ? 'dni z rzędu!' : 'dni z rzędu!'}
            </p>
          </div>

          {/* 5-day cycle progress dots */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
              {[1, 2, 3, 4, 5].map(i => {
                const filled  = i <= pos;
                const isMile  = i === 5;
                return (
                  <div key={i} style={{
                    width: 32, height: 32,
                    borderRadius: 4,
                    background: filled
                      ? (isMile ? 'var(--gold-main)' : '#a855f7')
                      : 'var(--bg-inset)',
                    border: `1px solid ${filled ? (isMile ? '#ffd700' : '#a855f7') : 'var(--border-dark)'}`,
                    boxShadow: filled ? `0 0 8px ${isMile ? '#ffd700' : '#a855f7'}88` : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14,
                    transition: 'all 0.3s',
                  }}>
                    {isMile ? '🏆' : filled ? '✓' : ''}
                  </div>
                );
              })}
            </div>
            {/* Progress bar */}
            <div style={{ background: 'var(--bg-inset)', height: 8, borderRadius: 4, overflow: 'hidden', border: '1px solid var(--border-dark)' }}>
              <div style={{
                height: '100%',
                width: `${(pos / 5) * 100}%`,
                background: pos === 5
                  ? 'linear-gradient(90deg, #a855f7, #ffd700)'
                  : 'linear-gradient(90deg, #7c3aed, #a855f7)',
                borderRadius: 4,
                animation: 'streak-bar-fill 0.6s ease-out',
                boxShadow: '0 0 6px #a855f744',
              }} />
            </div>
            <p style={{ ...PX(4), color: 'var(--text-muted)', textAlign: 'center', marginTop: 5 }}>
              {hasMilestone
                ? (isEn ? '🏆 Milestone reached!' : '🏆 Osiągnięto kamień milowy!')
                : (isEn ? `${nextMile} more day${nextMile === 1 ? '' : 's'} to epic chest` : `Jeszcze ${nextMile} ${nextMile === 1 ? 'dzień' : 'dni'} do epickiej skrzynki`)}
            </p>
          </div>

          {/* Gem reward info */}
          <div style={{
            background: 'var(--bg-inset)',
            border: '1px solid rgba(0,229,255,0.2)',
            padding: '8px 12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 16 }}>💎</span>
            <p style={{ ...PX(5), color: '#00e5ff' }}>
              {isEn ? `+${gemsAdded} gems` : `+${gemsAdded} klejnotów`}
            </p>
            {streakDays > 1 && (
              <span style={{ ...PX(4), color: 'var(--text-muted)' }}>
                {isEn ? '(streak bonus included)' : '(bonus za serię)'}
              </span>
            )}
          </div>

          {/* Milestone chest */}
          {hasMilestone && showChest && !opened && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  '--glow': glowColor,
                  width: 80, height: 80,
                  background: isLegendary
                    ? 'linear-gradient(135deg, #7c3a00, #ffd700)'
                    : 'linear-gradient(135deg, #3b0764, #a855f7)',
                  border: `2px solid ${glowColor}`,
                  borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 38,
                  animation: 'streak-chest-glow 1.2s ease-in-out infinite, streak-chest-bounce 1.2s ease-in-out infinite',
                  cursor: 'pointer',
                } as React.CSSProperties}
                onClick={() => setOpened(true)}
              >
                {isLegendary ? '👑' : '🎁'}
              </div>
              <p style={{ ...PX(5), color: glowColor, textShadow: `0 0 8px ${glowColor}` }}>
                {isLegendary
                  ? (isEn ? '⚡ LEGENDARY CHEST!' : '⚡ LEGENDARNA SKRZYNKA!')
                  : (isEn ? '✦ EPIC CHEST!' : '✦ EPICKA SKRZYNKA!')}
              </p>
              <p style={{ ...PX(4), color: 'var(--text-muted)' }}>
                {isEn ? 'Tap to open!' : 'Kliknij, żeby otworzyć!'}
              </p>
            </div>
          )}

          {/* Chest opened */}
          {hasMilestone && opened && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36, animation: 'streak-sparkle 0.6s ease-in-out 3' }}>✨</div>
              <p style={{ ...PX(7), color: glowColor, marginTop: 4, textShadow: `0 0 12px ${glowColor}` }}>
                +{chestGems} 💎
              </p>
              <p style={{ ...PX(4), color: 'var(--text-muted)', marginTop: 4 }}>
                {isEn ? 'Gems added to your account!' : 'Klejnoty dodane do konta!'}
              </p>
            </div>
          )}

          {/* Close button */}
          {(!hasMilestone || opened) && (
            <button
              onClick={onClose}
              className="btn btn-primary"
              style={{ fontSize: 10, padding: '10px', marginTop: 4 }}
            >
              {isEn ? '▶ Continue' : '▶ Kontynuuj'}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
