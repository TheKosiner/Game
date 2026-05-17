import { useState } from 'react';
import { useGameStore } from '../store/gameStore';

import { PORTRAIT_LIST } from '../data/portraits';

const PX = (s: number) => ({ fontFamily: "'Press Start 2P', monospace", fontSize: s } as const);

interface Props { onClose: () => void; }

export default function AppearanceEditor({ onClose }: Props) {
  const hero = useGameStore(s => s.hero);
  const [portrait, setPortrait] = useState(hero.portrait ?? 0);

  function handleSave() {
    useGameStore.setState(s => ({ hero: { ...s.hero, portrait } }));
    useGameStore.getState().saveGame();
    onClose();
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.88)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{ width: '100%', maxWidth: 360 }}>

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <p style={{ ...PX(9), color: 'var(--gold-main)', textShadow: '0 0 10px var(--gold-glow)', marginBottom: 6 }}>
            WYGLĄD POSTACI
          </p>
          <p style={{ ...PX(5), color: 'var(--text-muted)' }}>{hero.name}</p>
        </div>

        <div className="card p-4" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>WYBIERZ POSTAĆ</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {PORTRAIT_LIST.filter(p => !p.hidden && (!p.gemPrice || (hero.unlockedPortraits ?? []).includes(p.index) || hero.portrait === p.index)).map(p => (
              <button
                key={p.index}
                onClick={() => setPortrait(p.index)}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
              >
                <div style={{
                  width: '100%', aspectRatio: '1 / 1', overflow: 'hidden',
                  border: portrait === p.index ? '3px solid #ff2d78' : '3px solid rgba(255,255,255,0.08)',
                  boxShadow: portrait === p.index ? '0 0 20px rgba(255,45,120,0.5)' : 'none',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}>
                  <img src={p.src} alt={p.label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
                <span style={{
                  fontFamily: "'Orbitron', monospace", fontWeight: 700, fontSize: 8,
                  color: portrait === p.index ? '#ff2d78' : 'var(--text-dim)',
                  textShadow: portrait === p.index ? '0 0 8px rgba(255,45,120,0.5)' : 'none',
                }}>{p.label}</span>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" style={{ flex: 1, padding: '10px 0', fontSize: 6 }} onClick={onClose}>ANULUJ</button>
            <button className="btn btn-primary"   style={{ flex: 2, padding: '10px 0', fontSize: 6 }} onClick={handleSave}>ZAPISZ</button>
          </div>
        </div>
      </div>
    </div>
  );
}
