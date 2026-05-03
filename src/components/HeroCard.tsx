import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { MAX_DAILY_DUNGEONS, MAX_DAILY_QUESTS } from '../store/gameStore';
import { getHeroAttack, getHeroDefense } from '../utils/combat';
import PixelSprite from './PixelSprite';
import { SPRITE_WARRIOR, SPRITE_MAGE, SPRITE_ROGUE, getHeroPalette } from '../data/sprites';

const CLASS_SPRITES = { warrior: SPRITE_WARRIOR, mage: SPRITE_MAGE, rogue: SPRITE_ROGUE };
const CLASS_NAME: Record<string, string> = { warrior: 'Wojownik', mage: 'Mag', rogue: 'Łotrzyk' };
const PX = (s: number) => ({ fontFamily: "'Press Start 2P', monospace", fontSize: s } as const);

function RestTimer({ endsAt, restHp }: { endsAt: number; restHp: number }) {
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
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(8,16,6,0.97), rgba(6,12,4,0.99))',
      border: '1px solid rgba(50,80,30,0.5)',
      padding: '10px 12px',
      display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.4)',
    }}>
      <div className="df-flicker" style={{ fontSize: 22, lineHeight: 1 }}>🔥</div>
      <div>
        <p style={{ ...PX(7), color: 'var(--gold-bright)', textShadow: '0 0 10px var(--gold-glow)', marginBottom: 4 }}>
          ✦ ODPOCZYWASZ — {mins}:{secs.toString().padStart(2, '0')}
        </p>
        <p style={{ ...PX(5), color: '#5a8840' }}>Odzyskasz +{restHp} HP</p>
      </div>
    </div>
  );
}

function RestSlider({ hero, onRest, inCombat }: {
  hero: { hp: number; maxHp: number };
  onRest: (minutes: number) => void;
  inCombat: boolean;
}) {
  const maxMinutes = hero.maxHp - hero.hp;
  const [minutes, setMinutes] = useState(Math.min(10, maxMinutes));
  if (maxMinutes <= 0) return (
    <div style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-dark)', padding: '8px 12px', textAlign: 'center' }}>
      <p style={{ ...PX(5), color: 'var(--text-muted)' }}>HP PEŁNE — odpoczynek zbędny</p>
    </div>
  );
  const clamped = Math.min(Math.max(1, minutes), maxMinutes);
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(8,16,6,0.97), rgba(6,12,4,0.99))',
      border: '1px solid rgba(45,65,25,0.5)',
      padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ ...PX(5), color: 'var(--text-dim)' }}>🏕 ODPOCZYNEK</p>
        <p style={{ ...PX(6), color: '#6aaa40' }}>+{clamped} HP / {clamped} min</p>
      </div>
      <input type="range" min={1} max={maxMinutes} value={clamped}
        onChange={e => setMinutes(Number(e.target.value))} disabled={inCombat} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ ...PX(4), color: 'var(--text-muted)' }}>1 min = 1 HP</span>
        <span style={{ ...PX(4), color: 'var(--text-muted)' }}>max {maxMinutes} min</span>
      </div>
      <button onClick={() => onRest(clamped)} disabled={inCombat} className="btn btn-primary" style={{ width: '100%', fontSize: 6, padding: '8px' }}>
        ▶ Rozpocznij odpoczynek
      </button>
    </div>
  );
}

export default function HeroCard() {
  const hero = useGameStore(s => s.hero);
  const upgradeAttribute = useGameStore(s => s.upgradeAttribute);
  const restHero = useGameStore(s => s.restHero);
  const inCombat = useGameStore(s => s.inCombat);

  const isResting = hero.voluntaryRestUntil !== null && Date.now() < hero.voluntaryRestUntil;
  const hpPct  = (hero.hp / hero.maxHp) * 100;
  const attack  = getHeroAttack(hero);
  const defense = getHeroDefense(hero);
  const sprite  = CLASS_SPRITES[hero.class];
  const palette = getHeroPalette(hero.skinTone ?? 1, hero.hairColor ?? 2);
  const dungeonPct = (hero.dungeonRunsToday / MAX_DAILY_DUNGEONS) * 100;
  const questPct   = (hero.questsCompletedToday / MAX_DAILY_QUESTS) * 100;

  return (
    <div className="card p-3" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* ── PORTRAIT + INFO ── */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>

        {/* Portrait scene */}
        <div className="df-portrait-bg" style={{
          width: 108, flexShrink: 0, minHeight: 152,
          border: '1px solid var(--border-main)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div className="df-fire-glow" />
          <div className="df-portrait-vignette" />
          <div style={{ position: 'relative', zIndex: 2, filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.95))' }}>
            <PixelSprite grid={sprite} scale={4} paletteOverrides={palette} />
          </div>
        </div>

        {/* Info column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7, justifyContent: 'center' }}>
          <div>
            <p style={{ ...PX(11), color: 'var(--gold-bright)', textShadow: '0 0 14px var(--gold-glow)', marginBottom: 4, wordBreak: 'break-all' }}>
              {hero.name}
            </p>
            <p style={{ ...PX(5), color: 'var(--text-dim)' }}>{CLASS_NAME[hero.class]} · POZ. {hero.level}</p>
          </div>

          {/* ATK / DEF / HP boxes */}
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { icon: '⚔', val: attack,    col: '#c05050', label: 'ATAK' },
              { icon: '🛡', val: defense,   col: '#5070c0', label: 'OBRON' },
              { icon: '♥', val: hero.maxHp, col: '#c04040', label: 'MAX HP' },
            ].map(({ icon, val, col, label }) => (
              <div key={label} style={{
                background: 'var(--bg-inset)', border: '1px solid var(--border-dark)',
                padding: '5px 4px', display: 'flex', flexDirection: 'column',
                alignItems: 'center', flex: 1,
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
              }}>
                <span style={{ fontSize: 9 }}>{icon}</span>
                <span style={{ ...PX(8), color: col, marginTop: 2 }}>{val}</span>
                <span style={{ ...PX(4), color: 'var(--text-muted)', marginTop: 1 }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Gold */}
          <div style={{
            background: 'rgba(50,36,14,0.4)', border: '1px solid var(--gold-darker)',
            padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
          }}>
            <span style={{ fontSize: 12 }}>🪙</span>
            <span style={{ ...PX(9), color: 'var(--gold-bright)', textShadow: '0 0 8px var(--gold-glow)' }}>{hero.gold}</span>
          </div>
        </div>
      </div>

      {/* ── HP / XP BARS ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ ...PX(5), color: '#904040' }}>♥ ŻYWOTNOŚĆ</span>
            <span style={{ ...PX(5), color: 'var(--text-dim)' }}>{hero.hp} / {hero.maxHp}</span>
          </div>
          <div className="pixel-bar">
            <div className="pixel-bar-fill hp-fill" style={{ width: `${hpPct}%` }} />
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ ...PX(5), color: '#906830' }}>✦ DOŚWIADCZENIE</span>
            <span style={{ ...PX(5), color: 'var(--text-dim)' }}>{hero.xp} / {hero.xpToNext}</span>
          </div>
          <div className="pixel-bar">
            <div className="pixel-bar-fill xp-fill" style={{ width: `${(hero.xp / hero.xpToNext) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* ── REST ── */}
      {isResting
        ? <RestTimer endsAt={hero.voluntaryRestUntil!} restHp={hero.voluntaryRestHp ?? 0} />
        : <RestSlider hero={hero} onRest={restHero} inCombat={inCombat} />
      }

      {/* ── DZIENNY LIMIT + STATYSTYKI ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>

        <div className="df-section">
          <p style={{ ...PX(5), color: 'var(--text-dim)', marginBottom: 8 }}>DZIENNY LIMIT</p>
          {[
            { label: 'Lochy',   cur: hero.dungeonRunsToday,    max: MAX_DAILY_DUNGEONS, pct: dungeonPct, col: hero.dungeonRunsToday >= MAX_DAILY_DUNGEONS ? 'var(--hp-color)' : '#7060b8' },
            { label: 'Zadania', cur: hero.questsCompletedToday, max: MAX_DAILY_QUESTS,   pct: questPct,   col: hero.questsCompletedToday >= MAX_DAILY_QUESTS ? 'var(--hp-color)' : '#306880' },
          ].map(({ label, cur, max, pct, col }) => (
            <div key={label} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ ...PX(5), color: 'var(--text-dim)' }}>{label}</span>
                <span style={{ ...PX(5), color: cur >= max ? 'var(--hp-bright)' : 'var(--text-dim)' }}>{cur}/{max}</span>
              </div>
              <div className="pixel-bar">
                <div className="pixel-bar-fill" style={{ width: `${pct}%`, background: col }} />
              </div>
            </div>
          ))}
        </div>

        <div className="df-section">
          <p style={{ ...PX(5), color: 'var(--text-dim)', marginBottom: 8 }}>STATYSTYKI</p>
          {[
            { icon: '💪', name: 'Moc ciała', val: hero.stats.strength },
            { icon: '🏃', name: 'Zręczność', val: hero.stats.agility },
            { icon: '🧠', name: 'Wiedza',     val: hero.stats.intelligence },
            { icon: '♥',  name: 'Żywotność', val: hero.stats.constitution },
          ].map(({ icon, name, val }) => (
            <div key={name} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ ...PX(5), color: 'var(--text-dim)' }}>{icon} {name}</span>
              <span style={{ ...PX(6), color: 'var(--gold-bright)' }}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── ATTRIBUTE POINTS ── */}
      {hero.attributePoints > 0 && (
        <div className="df-glow-pulse" style={{
          background: 'linear-gradient(135deg, rgba(40,28,8,0.97), rgba(28,20,6,0.99))',
          border: '1px solid var(--gold-dim)', padding: 12,
        }}>
          <p style={{ ...PX(7), color: 'var(--gold-bright)', textShadow: '0 0 10px var(--gold-glow)', marginBottom: 10 }}>
            ✨ {hero.attributePoints} PKT CECH!
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {(['strength', 'agility', 'intelligence', 'constitution'] as const).map(attr => (
              <button key={attr} onClick={() => upgradeAttribute(attr)} className="btn btn-primary" style={{ fontSize: 5, padding: '7px 4px' }}>
                + {({ strength: 'Moc ciała', agility: 'Zręczność', intelligence: 'Wiedza', constitution: 'Żywotność' }[attr])}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
