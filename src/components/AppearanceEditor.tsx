import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import PixelSprite from './PixelSprite';
import { SPRITE_PORTRAIT, SKIN_TONES, HAIR_COLORS, CLOTHING_COLORS, getHeroPalette } from '../data/sprites';

const PX = (s: number) => ({ fontFamily: "'Press Start 2P', monospace", fontSize: s } as const);

interface Props {
  onClose: () => void;
}

export default function AppearanceEditor({ onClose }: Props) {
  const hero = useGameStore(s => s.hero);
  const changeAppearance = useGameStore(s => s.changeAppearance);

  const [skinTone, setSkinTone] = useState(hero.skinTone ?? 1);
  const [hairColor, setHairColor] = useState(hero.hairColor ?? 2);
  const [clothingColor, setClothingColor] = useState(hero.clothingColor ?? 0);

  const palette = getHeroPalette(skinTone, hairColor, clothingColor);

  function handleSave() {
    changeAppearance(skinTone, hairColor, clothingColor);
    onClose();
  }

  const swatchRow = (items: { name: string; light: string }[], selected: number, onSelect: (i: number) => void) => (
    <div style={{ display: 'flex', gap: 6 }}>
      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          title={item.name}
          style={{
            flex: 1, height: 34, background: item.light, cursor: 'pointer',
            border: selected === i ? '2px solid var(--gold-bright)' : '2px solid var(--border-dark)',
            borderRadius: 3,
            boxShadow: selected === i ? '0 0 8px var(--gold-glow)' : 'none',
          }}
        />
      ))}
    </div>
  );

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <p style={{ ...PX(10), color: 'var(--gold-main)', textShadow: '0 0 10px var(--gold-glow)', marginBottom: 6 }}>
            🎨 WYGLĄD POSTACI
          </p>
          <p style={{ ...PX(5), color: 'var(--text-muted)' }}>{hero.name}</p>
        </div>

        <div className="card p-4" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Live preview */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="df-portrait-bg" style={{
              width: 120, height: 160,
              border: '1px solid var(--border-main)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div className="df-fire-glow" />
              <div className="df-portrait-vignette" />
              <div style={{ position: 'relative', zIndex: 2, filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.95))' }}>
                <PixelSprite grid={SPRITE_PORTRAIT} scale={5} paletteOverrides={palette} />
              </div>
            </div>
          </div>

          {/* Skin tone */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ ...PX(6), color: 'var(--text-dim)' }}>KARNACJA</span>
              <span style={{ ...PX(6), color: 'var(--text-muted)' }}>{SKIN_TONES[skinTone].name}</span>
            </div>
            {swatchRow(SKIN_TONES, skinTone, setSkinTone)}
          </div>

          {/* Hair color */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ ...PX(6), color: 'var(--text-dim)' }}>WŁOSY</span>
              <span style={{ ...PX(6), color: 'var(--text-muted)' }}>{HAIR_COLORS[hairColor].name}</span>
            </div>
            {swatchRow(HAIR_COLORS, hairColor, setHairColor)}
          </div>

          {/* Clothing color */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ ...PX(6), color: 'var(--text-dim)' }}>UBRANIE</span>
              <span style={{ ...PX(6), color: 'var(--text-muted)' }}>{CLOTHING_COLORS[clothingColor].name}</span>
            </div>
            {swatchRow(CLOTHING_COLORS, clothingColor, setClothingColor)}
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" style={{ flex: 1, padding: '10px 0', fontSize: 6 }} onClick={onClose}>
              ✗ ANULUJ
            </button>
            <button className="btn btn-primary" style={{ flex: 2, padding: '10px 0', fontSize: 6 }} onClick={handleSave}>
              ✓ ZAPISZ
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
