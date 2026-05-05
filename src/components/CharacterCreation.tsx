import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import PixelSprite from './PixelSprite';
import { SPRITE_PORTRAIT, SKIN_TONES, HAIR_COLORS, CLOTHING_COLORS, getHeroPalette } from '../data/sprites';

export default function CharacterCreation() {
  const [name, setName] = useState('');
  const [skinTone, setSkinTone] = useState(1);
  const [hairColor, setHairColor] = useState(2);
  const [clothingColor, setClothingColor] = useState(0);
  const initHero = useGameStore(s => s.initHero);

  const palette = getHeroPalette(skinTone, hairColor, clothingColor);

  function handleCreate() {
    if (!name.trim()) return;
    initHero(name.trim(), skinTone, hairColor, false, clothingColor);
  }

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, background: '#060912',
      backgroundImage: 'radial-gradient(ellipse 80% 60% at 20% 20%, rgba(59,51,140,0.2) 0%, transparent 60%)',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <p style={{ fontSize: 36, marginBottom: 8 }}>🏰</p>
          <h1 style={{
            fontSize: 14, marginBottom: 8,
            background: 'linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            filter: 'drop-shadow(0 0 10px rgba(245,158,11,0.4))',
          }}>REALM OF VALOR</h1>
          <p style={{ color: '#475569', fontSize: 7 }}>Stwórz bohatera i zacznij przygodę</p>
        </div>

        <div className="card p-4" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Name input */}
          <div>
            <p style={{ color: '#64748b', fontSize: 6, marginBottom: 6, letterSpacing: '0.1em' }}>IMIĘ BOHATERA</p>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Wpisz imię..."
              maxLength={20}
              style={{
                width: '100%',
                background: 'rgba(5,8,20,0.9)',
                border: '1px solid rgba(90,110,190,0.3)',
                borderRadius: 4,
                padding: '10px 12px',
                color: '#e2e8f0',
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 8,
                outline: 'none',
                boxSizing: 'border-box',
                boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.4)',
              }}
            />
          </div>

          {/* Appearance */}
          <div style={{
            background: 'rgba(5,8,20,0.7)',
            border: '1px solid rgba(51,65,85,0.5)',
            borderRadius: 4,
            padding: 12,
          }}>
            <p style={{ color: '#64748b', fontSize: 6, marginBottom: 12, letterSpacing: '0.1em' }}>WYGLĄD POSTACI</p>

            {/* Live preview */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(20,30,60,0.95), rgba(10,15,35,0.98))',
                border: '1px solid rgba(90,110,190,0.3)',
                borderRadius: 6,
                padding: 12,
                boxShadow: '0 0 24px rgba(59,51,140,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
              }}>
                <PixelSprite grid={SPRITE_PORTRAIT} scale={5} paletteOverrides={palette} />
              </div>
            </div>

            {/* Skin tone */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <p style={{ color: '#64748b', fontSize: 6 }}>KARNACJA</p>
                <p style={{ color: '#475569', fontSize: 6 }}>{SKIN_TONES[skinTone].name}</p>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {SKIN_TONES.map((tone, i) => (
                  <button
                    key={i}
                    onClick={() => setSkinTone(i)}
                    title={tone.name}
                    style={{
                      width: 30, height: 30,
                      background: tone.light,
                      border: skinTone === i ? '2px solid #f59e0b' : '2px solid rgba(51,65,85,0.5)',
                      borderRadius: 3,
                      cursor: 'pointer',
                      boxShadow: skinTone === i ? '0 0 8px rgba(245,158,11,0.5)' : 'none',
                      transition: 'all 0.1s ease',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Hair color */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <p style={{ color: '#64748b', fontSize: 6 }}>WŁOSY</p>
                <p style={{ color: '#475569', fontSize: 6 }}>{HAIR_COLORS[hairColor].name}</p>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {HAIR_COLORS.map((hair, i) => (
                  <button key={i} onClick={() => setHairColor(i)} title={hair.name} style={{ width: 30, height: 30, background: hair.light, border: hairColor === i ? '2px solid #f59e0b' : '2px solid rgba(51,65,85,0.5)', borderRadius: 3, cursor: 'pointer', boxShadow: hairColor === i ? '0 0 8px rgba(245,158,11,0.5)' : 'none', transition: 'all 0.1s ease' }} />
                ))}
              </div>
            </div>

            {/* Clothing color */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <p style={{ color: '#64748b', fontSize: 6 }}>UBRANIE</p>
                <p style={{ color: '#475569', fontSize: 6 }}>{CLOTHING_COLORS[clothingColor].name}</p>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {CLOTHING_COLORS.map((c, i) => (
                  <button key={i} onClick={() => setClothingColor(i)} title={c.name} style={{ flex: 1, height: 30, background: c.light, border: clothingColor === i ? '2px solid #f59e0b' : '2px solid rgba(51,65,85,0.5)', borderRadius: 3, cursor: 'pointer', boxShadow: clothingColor === i ? '0 0 8px rgba(245,158,11,0.5)' : 'none', transition: 'all 0.1s ease' }} />
                ))}
              </div>
            </div>
          </div>

          {/* Create button */}
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="btn btn-primary"
            style={{ width: '100%', padding: '13px', fontSize: 8 }}
          >
            ▶ Rozpocznij Przygodę!
          </button>
        </div>
      </div>
    </div>
  );
}
