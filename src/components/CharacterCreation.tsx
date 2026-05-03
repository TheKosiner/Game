import { useState } from 'react';
import type { HeroClass } from '../types';
import { useGameStore } from '../store/gameStore';
import PixelSprite from './PixelSprite';
import { SPRITE_WARRIOR, SPRITE_MAGE, SPRITE_ROGUE, SKIN_TONES, HAIR_COLORS, getHeroPalette } from '../data/sprites';

const CLASS_SPRITES = { warrior: SPRITE_WARRIOR, mage: SPRITE_MAGE, rogue: SPRITE_ROGUE };

const CLASSES: { id: HeroClass; name: string; desc: string; pros: string }[] = [
  { id: 'warrior', name: 'Wojownik', desc: 'Mistrz walki wręcz. Wysoka żywotność i atak siłowy.', pros: 'Wysoka Siła & Kondycja' },
  { id: 'mage', name: 'Mag', desc: 'Władca arkaniki. Ogromna moc magii i inteligencja.', pros: 'Wysoka Inteligencja' },
  { id: 'rogue', name: 'Łotrzyk', desc: 'Skryty zabójca. Szybkość i krytyczne ciosy.', pros: 'Wysoka Zwinność & Krytyki' },
];

export default function CharacterCreation() {
  const [name, setName] = useState('');
  const [selectedClass, setSelectedClass] = useState<HeroClass | null>(null);
  const [skinTone, setSkinTone] = useState(1);
  const [hairColor, setHairColor] = useState(2);
  const initHero = useGameStore(s => s.initHero);

  const palette = getHeroPalette(skinTone, hairColor);

  function handleCreate() {
    if (!name.trim() || !selectedClass) return;
    initHero(name.trim(), selectedClass, skinTone, hairColor);
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: '#0f0e17' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <p style={{ fontSize: 40, marginBottom: 8 }}>🏰</p>
          <h1 style={{ color: '#fbbf24', fontSize: 14, marginBottom: 8 }}>REALM OF VALOR</h1>
          <p style={{ color: '#64748b', fontSize: 7, marginBottom: 8 }}>Stwórz bohatera i zacznij przygodę</p>
          <div style={{ display: 'inline-block', background: '#052e16', border: '2px solid #166534', padding: '4px 10px' }}>
            <span style={{ color: '#4ade80', fontSize: 6 }}>✅ 100% FAIR PLAY — BRAK PAY TO WIN</span>
          </div>
        </div>

        <div className="card p-3" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <p style={{ color: '#94a3b8', fontSize: 7, marginBottom: 6 }}>IMIĘ BOHATERA</p>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Wpisz imię..."
              maxLength={20}
              style={{
                width: '100%', background: '#0a0a1a', border: '2px solid #334155', padding: '8px 10px',
                color: '#e2e8f0', fontFamily: "'Press Start 2P', monospace", fontSize: 8,
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <p style={{ color: '#94a3b8', fontSize: 7, marginBottom: 8 }}>WYBIERZ KLASĘ</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {CLASSES.map(cls => (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClass(cls.id)}
                  style={{
                    width: '100%', textAlign: 'left', background: selectedClass === cls.id ? '#1c1408' : '#0a0a1a',
                    border: `2px solid ${selectedClass === cls.id ? '#d97706' : '#334155'}`,
                    padding: 10, cursor: 'pointer', fontFamily: "'Press Start 2P', monospace",
                    boxShadow: selectedClass === cls.id ? '3px 3px 0 #000' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ background: '#0a0a1a', border: '2px solid #334155', padding: 4, flexShrink: 0 }}>
                      <PixelSprite grid={CLASS_SPRITES[cls.id]} scale={3} paletteOverrides={palette} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: '#e2e8f0', fontSize: 8, marginBottom: 4 }}>{cls.name}</p>
                      <p style={{ color: '#64748b', fontSize: 6, marginBottom: 3 }}>{cls.desc}</p>
                      <p style={{ color: '#fbbf24', fontSize: 6 }}>{cls.pros}</p>
                    </div>
                    {selectedClass === cls.id && <span style={{ color: '#fbbf24', fontSize: 10 }}>▶</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Appearance section */}
          <div style={{ background: '#0a0a1a', border: '2px solid #1e293b', padding: 10 }}>
            <p style={{ color: '#94a3b8', fontSize: 7, marginBottom: 10 }}>WYGLĄD POSTACI</p>

            {/* Live preview */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
              <div style={{ background: '#111827', border: '2px solid #334155', padding: 8 }}>
                <PixelSprite
                  grid={CLASS_SPRITES[selectedClass ?? 'warrior']}
                  scale={5}
                  paletteOverrides={palette}
                />
              </div>
            </div>

            {/* Skin tone */}
            <div style={{ marginBottom: 8 }}>
              <p style={{ color: '#64748b', fontSize: 6, marginBottom: 5 }}>KARNACJA</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {SKIN_TONES.map((tone, i) => (
                  <button
                    key={i}
                    onClick={() => setSkinTone(i)}
                    title={tone.name}
                    style={{
                      width: 28, height: 28,
                      background: tone.light,
                      border: `3px solid ${skinTone === i ? '#fbbf24' : '#334155'}`,
                      cursor: 'pointer',
                      boxShadow: skinTone === i ? '0 0 0 1px #fbbf24' : 'none',
                    }}
                  />
                ))}
              </div>
              <p style={{ color: '#475569', fontSize: 6, marginTop: 4 }}>{SKIN_TONES[skinTone].name}</p>
            </div>

            {/* Hair color */}
            <div>
              <p style={{ color: '#64748b', fontSize: 6, marginBottom: 5 }}>KOLOR WŁOSÓW</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {HAIR_COLORS.map((hair, i) => (
                  <button
                    key={i}
                    onClick={() => setHairColor(i)}
                    title={hair.name}
                    style={{
                      width: 28, height: 28,
                      background: hair.light,
                      border: `3px solid ${hairColor === i ? '#fbbf24' : '#334155'}`,
                      cursor: 'pointer',
                      boxShadow: hairColor === i ? '0 0 0 1px #fbbf24' : 'none',
                    }}
                  />
                ))}
              </div>
              <p style={{ color: '#475569', fontSize: 6, marginTop: 4 }}>{HAIR_COLORS[hairColor].name}</p>
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={!name.trim() || !selectedClass}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: 8 }}
          >
            ▶ Rozpocznij Przygodę!
          </button>
        </div>
      </div>
    </div>
  );
}
