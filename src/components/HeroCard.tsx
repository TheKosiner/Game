import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { getHeroAttack, getHeroDefense } from '../utils/combat';
import PixelSprite from './PixelSprite';
import { SPRITE_WARRIOR, SPRITE_MAGE, SPRITE_ROGUE } from '../data/sprites';

const CLASS_SPRITES = { warrior: SPRITE_WARRIOR, mage: SPRITE_MAGE, rogue: SPRITE_ROGUE };
const CLASS_NAME: Record<string, string> = { warrior: 'Wojownik', mage: 'Mag', rogue: 'Lotrzyk' };

function RestTimer({ endsAt }: { endsAt: number }) {
  const [remaining, setRemaining] = useState(Math.max(0, endsAt - Date.now()));
  useEffect(() => {
    const id = setInterval(() => {
      const r = Math.max(0, endsAt - Date.now());
      setRemaining(r);
      if (r === 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  return <span style={{ color: '#60a5fa' }}>{mins}:{secs.toString().padStart(2, '0')}</span>;
}

export default function HeroCard() {
  const hero = useGameStore(s => s.hero);
  const upgradeAttribute = useGameStore(s => s.upgradeAttribute);
  const xpPct = Math.min(100, (hero.xp / hero.xpToNext) * 100);
  const hpPct = Math.min(100, (hero.hp / hero.maxHp) * 100);
  const energyPct = Math.min(100, (hero.energy / hero.maxEnergy) * 100);
  const isResting = hero.restingUntil !== null && Date.now() < hero.restingUntil;
  const attack = getHeroAttack(hero);
  const defense = getHeroDefense(hero);
  const sprite = CLASS_SPRITES[hero.class];

  return (
    <div className="card p-3 space-y-3">
      {/* Header with sprite */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ background: '#0a0a1a', border: '3px solid #334155', padding: 6, boxShadow: '3px 3px 0 #000', flexShrink: 0 }}>
          <PixelSprite grid={sprite} scale={3} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ color: '#fbbf24', fontSize: 11, marginBottom: 2, wordBreak: 'break-all' }}>{hero.name}</p>
          <p style={{ color: '#64748b', fontSize: 8, marginBottom: 4 }}>{CLASS_NAME[hero.class]} — POZ.{hero.level}</p>
          <p style={{ color: '#fbbf24', fontSize: 9 }}>🪙 {hero.gold}</p>
        </div>
      </div>

      {/* HP Bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 7, color: '#64748b', marginBottom: 3 }}>
          <span>HP</span>
          <span>{hero.hp}/{hero.maxHp}</span>
        </div>
        <div className="pixel-bar">
          <div className="pixel-bar-fill" style={{ width: `${hpPct}%`, background: hpPct > 50 ? '#16a34a' : hpPct > 25 ? '#d97706' : '#dc2626' }} />
        </div>
      </div>

      {/* XP Bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 7, color: '#64748b', marginBottom: 3 }}>
          <span>XP</span>
          <span>{hero.xp}/{hero.xpToNext}</span>
        </div>
        <div className="pixel-bar">
          <div className="pixel-bar-fill" style={{ width: `${xpPct}%`, background: '#d97706' }} />
        </div>
      </div>

      {/* Energy Bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 7, color: '#64748b', marginBottom: 3 }}>
          <span>⚡ ENERGIA</span>
          <span>{Math.floor(hero.energy)}/{hero.maxEnergy}</span>
        </div>
        <div className="pixel-bar">
          <div className="pixel-bar-fill" style={{ width: `${energyPct}%`, background: energyPct > 50 ? '#3b82f6' : energyPct > 20 ? '#8b5cf6' : '#475569' }} />
        </div>
      </div>

      {/* Forced rest banner */}
      {isResting && (
        <div style={{ background: '#0c1220', border: '2px solid #1d4ed8', padding: '6px 10px', textAlign: 'center' }}>
          <p style={{ color: '#93c5fd', fontSize: 7 }}>💤 ODPOCZYWASZ — powrót za: <RestTimer endsAt={hero.restingUntil!} /></p>
          <p style={{ color: '#475569', fontSize: 6, marginTop: 2 }}>Po odpoczynku odzyskasz 50% HP</p>
        </div>
      )}

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 7 }}>
        <div style={{ background: '#0a0a1a', border: '2px solid #1e293b', padding: '6px 8px' }}>
          <p style={{ color: '#64748b', marginBottom: 4 }}>STATYSTYKI</p>
          <p>💪 Sila: <span style={{ color: '#fbbf24' }}>{hero.stats.strength}</span></p>
          <p>🏃 Zwinnosc: <span style={{ color: '#fbbf24' }}>{hero.stats.agility}</span></p>
          <p>🧠 Intel: <span style={{ color: '#fbbf24' }}>{hero.stats.intelligence}</span></p>
          <p>🛡 Kondy: <span style={{ color: '#fbbf24' }}>{hero.stats.constitution}</span></p>
        </div>
        <div style={{ background: '#0a0a1a', border: '2px solid #1e293b', padding: '6px 8px' }}>
          <p style={{ color: '#64748b', marginBottom: 4 }}>WALKA</p>
          <p>⚔️ Atk: <span style={{ color: '#f87171' }}>{attack}</span></p>
          <p>🛡 Def: <span style={{ color: '#60a5fa' }}>{defense}</span></p>
          <p>❤️ MaxHP: <span style={{ color: '#4ade80' }}>{hero.maxHp}</span></p>
        </div>
      </div>

      {/* Attribute points */}
      {hero.attributePoints > 0 && (
        <div style={{ background: '#1c1408', border: '2px solid #d97706', padding: 8 }}>
          <p style={{ color: '#fbbf24', fontSize: 8, marginBottom: 6 }}>✨ {hero.attributePoints} PKT CECH!</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            {(['strength', 'agility', 'intelligence', 'constitution'] as const).map(attr => (
              <button key={attr} onClick={() => upgradeAttribute(attr)} className="btn btn-secondary" style={{ fontSize: 7, padding: '4px 6px' }}>
                +{({ strength: 'Sila', agility: 'Zwin', intelligence: 'Intel', constitution: 'Kond' }[attr])}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
