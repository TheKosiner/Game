import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { useT } from '../hooks/useT';
import { PORTRAIT_LIST } from '../data/portraits';
import { startGemCheckout } from '../lib/gemShop';
import { isFirebaseConfigured } from '../lib/firebase';
import { MONO, ORB } from '../utils/styles';
import { useIsDesktop } from '../hooks/useIsDesktop';
import gemShopSrc from '../assets/gem-shop.webp';

const GEM_PACKAGES = [
  { id: '100',  gems: 100,  price: '$0.99' },
  { id: '550',  gems: 550,  price: '$4.99' },
  { id: '1200', gems: 1200, price: '$9.99' },
];

export default function GemsPanel() {
  const t    = useT();
  const hero = useGameStore(s => s.hero);
  const gemBuyPortrait = useGameStore(s => s.gemBuyPortrait);
  const isDesktop = useIsDesktop();

  const [buyingId, setBuyingId]     = useState<string | null>(null);
  const [flashMsg, setFlashMsg]     = useState<{ text: string; ok: boolean } | null>(null);
  // Handle return from Stripe Checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('gems_success') === '1') {
      const gems = params.get('gems');
      setFlashMsg({ text: `+${gems} 💎 ${t.gems.purchaseSuccess}`, ok: true });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('gems_cancelled') === '1') {
      setFlashMsg({ text: t.gems.purchaseCancelled, ok: false });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);


  async function handleBuy(packageId: string) {
    if (buyingId) return;
    setBuyingId(packageId);
    try {
      await startGemCheckout(packageId);
    } catch (e: any) {
      setFlashMsg({ text: e?.message ?? 'Error', ok: false });
      setBuyingId(null);
    }
  }

  const gemPortraits = PORTRAIT_LIST.filter(p => !p.hidden && p.gemPrice !== undefined);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Image + main content side by side on PC */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: isDesktop ? 'nowrap' : 'wrap' }}>

        {/* Header image – left column on PC */}
        <div style={{ flex: isDesktop ? '0 0 240px' : '0 0 100%', position: 'relative', alignSelf: 'stretch', minHeight: 100 }}>
          <img src={gemShopSrc} alt="Sklep z gemami" style={{ width: '100%', height: isDesktop ? '100%' : 'auto', objectFit: 'cover', display: 'block', border: '1px solid rgba(157,78,221,0.2)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%)' }} />
        </div>

        {/* Right column: flash + balance + earn + buy */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Flash message from Stripe return */}
          {flashMsg && (
            <div style={{
              padding: '10px 14px',
              background: flashMsg.ok ? 'rgba(0,229,100,0.1)' : 'rgba(255,45,120,0.1)',
              border: `1px solid ${flashMsg.ok ? 'rgba(0,229,100,0.4)' : 'rgba(255,45,120,0.4)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ ...MONO, fontSize: 11, color: flashMsg.ok ? '#00e564' : '#ff2d78' }}>
                {flashMsg.text}
              </span>
              <button onClick={() => setFlashMsg(null)} aria-label="Dismiss message" style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 14 }}>✕</button>
            </div>
          )}

          {/* Balance */}
          <div className="card p-3" style={{
            background: 'linear-gradient(135deg, rgba(0,229,255,0.06), rgba(0,0,0,0.8))',
            border: '1px solid rgba(0,229,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: '0 0 20px rgba(0,229,255,0.08)',
          }}>
            <div>
              <p style={{ ...ORB, fontSize: 10, color: '#00e5ff', textShadow: '0 0 8px rgba(0,229,255,0.6)', marginBottom: 4 }}>
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
            <p style={{ ...ORB, fontSize: 10, color: '#00e5ff', textShadow: '0 0 6px rgba(0,229,255,0.5)', marginBottom: 2 }}>
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

          {/* Buy gems */}
          <div className="card p-3" style={{
            background: 'linear-gradient(135deg, rgba(157,78,221,0.04), rgba(0,0,0,0.8))',
            border: '1px solid rgba(157,78,221,0.2)',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            <p style={{ ...ORB, fontSize: 10, color: '#9d4edd', textShadow: '0 0 8px rgba(157,78,221,0.5)' }}>
              {t.gems.buyGemsTitle}
            </p>
            <div style={{ display: 'flex', gap: 6 }}>
              {GEM_PACKAGES.map(pkg => {
                const isLoading = buyingId === pkg.id;
                const disabled  = !isFirebaseConfigured || !!buyingId;
                return (
                  <button
                    key={pkg.id}
                    onClick={() => handleBuy(pkg.id)}
                    disabled={disabled}
                    style={{
                      flex: 1,
                      border: `1px solid ${isLoading ? 'rgba(157,78,221,0.6)' : 'rgba(157,78,221,0.3)'}`,
                      padding: '10px 4px',
                      textAlign: 'center',
                      background: isLoading ? 'rgba(157,78,221,0.12)' : 'rgba(157,78,221,0.06)',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      opacity: disabled && !isLoading ? 0.5 : 1,
                      transition: 'all 0.15s',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    }}
                  >
                    <p style={{ ...ORB, fontSize: 10, color: '#00e5ff', margin: 0 }}>
                      {isLoading ? '⏳' : `${pkg.gems} 💎`}
                    </p>
                    <p style={{ ...MONO, fontSize: 10, color: '#9d4edd', margin: 0 }}>{pkg.price}</p>
                  </button>
                );
              })}
            </div>
            {!isFirebaseConfigured && (
              <p style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', textAlign: 'center' }}>
                {t.gems.buyGemsSoon}
              </p>
            )}
          </div>

        </div>{/* end right column */}
      </div>{/* end image+content row */}

      {/* Portrait shop – always full width below */}
      <div className="card p-3" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={{ ...ORB, fontSize: 10, color: '#ff2d78', textShadow: '0 0 8px rgba(255,45,120,0.5)', marginBottom: 2 }}>
          {t.gems.portraitShopTitle}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {gemPortraits.map(p => {
            const isOwned    = (hero.unlockedPortraits ?? []).includes(p.index);
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


                {isEquipped ? (
                  <span style={{ ...MONO, fontSize: 10, color: '#ff2d78' }}>{t.gems.portraitEquipped}</span>
                ) : isOwned ? (
                  <button
                    onClick={() => {
                      useGameStore.setState(s => ({ hero: { ...s.hero, portrait: p.index } }));
                      useGameStore.getState().saveGame();
                    }}
                    className="btn btn-secondary"
                    style={{ width: '100%', fontSize: 10, padding: '4px 0' }}
                  >
                    {t.gems.portraitOwned}
                  </button>
                ) : (
                  <button
                    onClick={() => gemBuyPortrait(p.index, p.gemPrice!)}
                    disabled={!canAfford}
                    className="btn btn-primary"
                    style={{ width: '100%', fontSize: 10, padding: '4px 0', opacity: canAfford ? 1 : 0.4 }}
                  >
                    {t.gems.portraitBuy(p.gemPrice!)}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
