import { useGameStore } from '../store/gameStore';
import { useT } from '../hooks/useT';
import { PORTRAIT_LIST } from '../data/portraits';

const ORB  = { fontFamily: "'Orbitron', monospace", fontWeight: 700 } as const;
const MONO = { fontFamily: "'Share Tech Mono', monospace" } as const;

export default function GemsPanel() {
  const t    = useT();
  const hero = useGameStore(s => s.hero);
  const gemBuyPortrait = useGameStore(s => s.gemBuyPortrait);

  const gemPortraits = PORTRAIT_LIST.filter(p => !p.hidden && p.gemPrice !== undefined);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Balance */}
      <div className="card p-3" style={{
        background: 'linear-gradient(135deg, rgba(0,229,255,0.06), rgba(0,0,0,0.8))',
        border: '1px solid rgba(0,229,255,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 0 20px rgba(0,229,255,0.08)',
      }}>
        <div>
          <p style={{ ...ORB, fontSize: 9, color: '#00e5ff', textShadow: '0 0 8px rgba(0,229,255,0.6)', marginBottom: 4 }}>
            {t.gems.title}
          </p>
          <p style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)' }}>{t.gems.earnTitle}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ ...ORB, fontSize: 28, color: '#00e5ff', textShadow: '0 0 16px rgba(0,229,255,0.8)', lineHeight: 1 }}>
            💎 {hero.gems}
          </p>
        </div>
      </div>

      {/* How to earn */}
      <div className="card p-3" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p style={{ ...ORB, fontSize: 8, color: '#00e5ff', textShadow: '0 0 6px rgba(0,229,255,0.5)', marginBottom: 2 }}>
          {t.gems.earnTitle}
        </p>
        {[
          { icon: '📅', text: t.gems.earnDaily },
          { icon: '⬆', text: t.gems.earnLevel },
        ].map(({ icon, text }) => (
          <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16, width: 24, textAlign: 'center' }}>{icon}</span>
            <span style={{ ...MONO, fontSize: 11, color: 'var(--text-main)' }}>{text}</span>
          </div>
        ))}
      </div>

      {/* Portrait shop */}
      <div className="card p-3" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={{ ...ORB, fontSize: 8, color: '#ff2d78', textShadow: '0 0 8px rgba(255,45,120,0.5)', marginBottom: 2 }}>
          {t.gems.portraitShopTitle}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {gemPortraits.map(p => {
            const isOwned    = hero.unlockedPortraits.includes(p.index);
            const isEquipped = hero.portrait === p.index;
            const canAfford  = hero.gems >= (p.gemPrice ?? 0);

            return (
              <div key={p.index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: '100%', aspectRatio: '1 / 1', overflow: 'hidden',
                  border: isEquipped
                    ? '3px solid #ff2d78'
                    : isOwned
                      ? '3px solid #00e5ff'
                      : '3px solid rgba(255,255,255,0.08)',
                  boxShadow: isEquipped
                    ? '0 0 16px rgba(255,45,120,0.4)'
                    : isOwned
                      ? '0 0 12px rgba(0,229,255,0.3)'
                      : 'none',
                  position: 'relative',
                }}>
                  <img
                    src={p.src} alt={p.label}
                    style={{
                      width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                      opacity: isOwned || isEquipped ? 1 : 0.5,
                      filter: isOwned || isEquipped ? 'none' : 'grayscale(60%)',
                    }}
                  />
                  {!isOwned && !isEquipped && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(0,0,0,0.3)',
                    }}>
                      <span style={{ fontSize: 20 }}>🔒</span>
                    </div>
                  )}
                </div>

                <span style={{
                  ...ORB, fontSize: 7,
                  color: isEquipped ? '#ff2d78' : isOwned ? '#00e5ff' : 'var(--text-dim)',
                  textAlign: 'center',
                }}>{p.label}</span>

                {isEquipped ? (
                  <span style={{ ...MONO, fontSize: 8, color: '#ff2d78' }}>{t.gems.portraitEquipped}</span>
                ) : isOwned ? (
                  <button
                    onClick={() => {
                      useGameStore.setState(s => ({ hero: { ...s.hero, portrait: p.index } }));
                      useGameStore.getState().saveGame();
                    }}
                    className="btn btn-secondary"
                    style={{ width: '100%', fontSize: 6, padding: '4px 0' }}
                  >
                    {t.gems.portraitOwned}
                  </button>
                ) : (
                  <button
                    onClick={() => gemBuyPortrait(p.index, p.gemPrice!)}
                    disabled={!canAfford}
                    className="btn btn-primary"
                    style={{ width: '100%', fontSize: 6, padding: '4px 0', opacity: canAfford ? 1 : 0.4 }}
                  >
                    {t.gems.portraitBuy(p.gemPrice!)}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Buy gems placeholder */}
      <div className="card p-3" style={{
        background: 'linear-gradient(135deg, rgba(157,78,221,0.04), rgba(0,0,0,0.8))',
        border: '1px solid rgba(157,78,221,0.2)',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ ...ORB, fontSize: 8, color: '#9d4edd', textShadow: '0 0 8px rgba(157,78,221,0.5)' }}>
            {t.gems.buyGemsTitle}
          </p>
          <span style={{
            ...ORB, fontSize: 7, color: '#ffd700',
            background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)',
            padding: '2px 6px',
          }}>{t.gems.comingSoon}</span>
        </div>
        <p style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)' }}>{t.gems.buyGemsSoon}</p>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { gems: '100 💎', price: '$0.99' },
            { gems: '550 💎', price: '$4.99' },
            { gems: '1200 💎', price: '$9.99' },
          ].map(({ gems, price }) => (
            <div key={price} style={{
              flex: 1, border: '1px solid rgba(157,78,221,0.2)',
              padding: '8px 4px', textAlign: 'center',
              background: 'rgba(157,78,221,0.04)', opacity: 0.5,
            }}>
              <p style={{ ...ORB, fontSize: 9, color: '#00e5ff', marginBottom: 2 }}>{gems}</p>
              <p style={{ ...MONO, fontSize: 10, color: '#9d4edd' }}>{price}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
