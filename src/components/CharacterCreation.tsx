import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { useT } from '../hooks/useT';

import { PORTRAIT_LIST } from '../data/portraits';

export default function CharacterCreation() {
  const [name, setName] = useState('');
  const [portrait, setPortrait] = useState(0);
  const initHero = useGameStore(s => s.initHero);
  const t = useT();

  function handleCreate() {
    if (!name.trim()) return;
    initHero(name.trim(), 1, 2, false, 0);
    // store portrait separately after hero is created
    useGameStore.setState(s => ({ hero: { ...s.hero, portrait } }));
  }

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, background: '#060912',
      backgroundImage: 'radial-gradient(ellipse 80% 60% at 20% 20%, rgba(59,51,140,0.2) 0%, transparent 60%)',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <p style={{ fontSize: 36, marginBottom: 8 }}>⊕</p>
          <h1 style={{
            fontFamily: "'Orbitron', monospace", fontWeight: 900,
            fontSize: 14, marginBottom: 8,
            background: 'linear-gradient(90deg, #ff2d78, #ff2d78, #ff2d78)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            filter: 'drop-shadow(0 0 10px rgba(255,45,120,0.5))',
          }}>GlitchSoul</h1>
          <p style={{ fontFamily: "'Share Tech Mono', monospace", color: '#475569', fontSize: 10 }}>{t.creation.subtitle}</p>
        </div>

        <div className="card p-4" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Name */}
          <div>
            <label htmlFor="hero-name" style={{ fontFamily: "'Share Tech Mono', monospace", color: '#64748b', fontSize: 10, marginBottom: 6, letterSpacing: '0.1em', display: 'block' }}>{t.creation.nameLabel}</label>
            <input
              id="hero-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder={t.creation.namePlaceholder}
              maxLength={20}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(5,8,20,0.9)',
                border: '1px solid rgba(255,45,120,0.3)',
                padding: '10px 12px',
                color: '#e2e8f0',
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 12,
                outline: 'none',
                boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.4)',
              }}
            />
          </div>

          {/* Portrait picker */}
          <div>
            <p style={{ fontFamily: "'Share Tech Mono', monospace", color: '#64748b', fontSize: 10, marginBottom: 10, letterSpacing: '0.1em' }}>{t.creation.chooseLabel}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {PORTRAIT_LIST.filter(p => !p.hidden).map(p => (
                <button
                  key={p.index}
                  onClick={() => setPortrait(p.index)}
                  style={{
                    background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  }}
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
                    fontFamily: "'Orbitron', monospace", fontWeight: 700, fontSize: 10,
                    color: portrait === p.index ? '#ff2d78' : '#475569',
                    textShadow: portrait === p.index ? '0 0 8px rgba(255,45,120,0.5)' : 'none',
                  }}>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="btn btn-primary"
            style={{ width: '100%', padding: '13px', fontSize: 10 }}
          >
            {t.creation.startBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
