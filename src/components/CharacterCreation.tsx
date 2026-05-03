import { useState } from 'react';
import type { HeroClass } from '../types';
import { useGameStore } from '../store/gameStore';
import PixelSprite from './PixelSprite';
import { SPRITE_WARRIOR, SPRITE_MAGE, SPRITE_ROGUE, SKIN_TONES, HAIR_COLORS, getHeroPalette } from '../data/sprites';

const CLASS_SPRITES = { warrior: SPRITE_WARRIOR, mage: SPRITE_MAGE, rogue: SPRITE_ROGUE };

const CLASSES: { id: HeroClass; name: string; desc: string; pros: string; color: string }[] = [
  { id: 'warrior', name: 'Wojownik', desc: 'Mistrz walki wręcz. Wysoka żywotność i atak siłowy.', pros: '💪 Siła & Kondycja', color: '#ef4444' },
  { id: 'mage',    name: 'Mag',      desc: 'Władca arkaniki. Ogromna moc magii i inteligencja.',  pros: '🧠 Inteligencja',    color: '#8b5cf6' },
  { id: 'rogue',   name: 'Łotrzyk',  desc: 'Skryty zabójca. Szybkość i krytyczne ciosy.',         pros: '🏃 Zwinność & Krytyki', color: '#22c55e' },
];

export default function CharacterCreation() {
  const [name, setName] = useState('');
  const [selectedClass, setSelectedClass] = useState<HeroClass | null>(null);
  const [skinTone, setSkinTone] = useState(1);
  const [hairColor, setHairColor] = useState(2);
  const initHero = useGameStore(s => s.initHero);

  const palette = getHeroPalette(skinTone, hairColor);
  const activeClass = selectedClass ?? 'warrior';

  function handleCreate() {
    if (!name.trim() || !selectedClass) return;
    initHero(name.trim(), selectedClass, skinTone, hairColor);
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

          {/* Class selection */}
          <div>
            <p style={{ color: '#64748b', fontSize: 6, marginBottom: 10, letterSpacing: '0.1em' }}>WYBIERZ KLASĘ</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {CLASSES.map(cls => {
                const isSelected = selectedClass === cls.id;
                return (
                  <button
                    key={cls.id}
                    onClick={() => setSelectedClass(cls.id)}
                    style={{
                      width: '100%', textAlign: 'left',
                      background: isSelected
                        ? `linear-gradient(135deg, rgba(${cls.id === 'warrior' ? '239,68,68' : cls.id === 'mage' ? '139,92,246' : '34,197,94'},0.08) 0%, rgba(5,8,20,0.95) 100%)`
                        : 'rgba(5,8,20,0.7)',
                      border: `1px solid ${isSelected ? (cls.id === 'warrior' ? 'rgba(239,68,68,0.4)' : cls.id === 'mage' ? 'rgba(139,92,246,0.4)' : 'rgba(34,197,94,0.4)') : 'rgba(51,65,85,0.5)'}`,
                      borderRadius: 4,
                      padding: 10,
                      cursor: 'pointer',
                      fontFamily: "'Press Start 2P', monospace",
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? `0 0 16px ${cls.color}22` : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        background: 'rgba(5,8,20,0.9)',
                        border: `1px solid ${isSelected ? cls.color + '44' : 'rgba(51,65,85,0.4)'}`,
                        borderRadius: 3,
                        padding: 5,
                        flexShrink: 0,
                        boxShadow: isSelected ? `0 0 12px ${cls.color}33` : 'none',
                      }}>
                        <PixelSprite grid={CLASS_SPRITES[cls.id]} scale={3} paletteOverrides={palette} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ color: isSelected ? '#e2e8f0' : '#94a3b8', fontSize: 8, marginBottom: 4 }}>{cls.name}</p>
                        <p style={{ color: '#475569', fontSize: 6, marginBottom: 3, lineHeight: 1.6 }}>{cls.desc}</p>
                        <p style={{ color: cls.color, fontSize: 6 }}>{cls.pros}</p>
                      </div>
                      {isSelected && <span style={{ color: cls.color, fontSize: 10 }}>▶</span>}
                    </div>
                  </button>
                );
              })}
            </div>
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
                <PixelSprite grid={CLASS_SPRITES[activeClass]} scale={5} paletteOverrides={palette} />
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
                  <button
                    key={i}
                    onClick={() => setHairColor(i)}
                    title={hair.name}
                    style={{
                      width: 30, height: 30,
                      background: hair.light,
                      border: hairColor === i ? '2px solid #f59e0b' : '2px solid rgba(51,65,85,0.5)',
                      borderRadius: 3,
                      cursor: 'pointer',
                      boxShadow: hairColor === i ? '0 0 8px rgba(245,158,11,0.5)' : 'none',
                      transition: 'all 0.1s ease',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Create button */}
          <button
            onClick={handleCreate}
            disabled={!name.trim() || !selectedClass}
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
