import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { MAX_DAILY_DUNGEONS, MAX_DAILY_QUESTS } from '../store/gameStore';
import { getHeroAttack, getHeroDefense } from '../utils/combat';
import PixelSprite from './PixelSprite';
import { SPRITE_WARRIOR, SPRITE_MAGE, SPRITE_ROGUE, getHeroPalette } from '../data/sprites';

const CLASS_SPRITES = { warrior: SPRITE_WARRIOR, mage: SPRITE_MAGE, rogue: SPRITE_ROGUE };
const CLASS_NAME: Record<string, string> = { warrior: 'Wojownik', mage: 'Mag', rogue: 'Łotrzyk' };

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
  return <span style={{ color: '#60a5fa', textShadow: '0 0 8px rgba(96,165,250,0.6)' }}>{mins}:{secs.toString().padStart(2, '0')}</span>;
}

function StatBar({ label, value, max, color, glow }: { label: string; value: number; max: number; color: string; glow: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 6, color: '#64748b', marginBottom: 3 }}>
        <span>{label}</span>
        <span style={{ color: '#94a3b8' }}>{value}/{max}</span>
      </div>
      <div className="pixel-bar">
        <div className="pixel-bar-fill" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${glow}` }} />
      </div>
    </div>
  );
}

export default function HeroCard() {
  const hero = useGameStore(s => s.hero);
  const upgradeAttribute = useGameStore(s => s.upgradeAttribute);
  const restHero = useGameStore(s => s.restHero);
  const inCombat = useGameStore(s => s.inCombat);

  const isResting = hero.restingUntil !== null && Date.now() < hero.restingUntil;
  const isVoluntaryResting = hero.voluntaryRestUntil !== null && Date.now() < hero.voluntaryRestUntil;

  const hpPct = (hero.hp / hero.maxHp) * 100;
  const hpColor = hpPct > 50 ? '#22c55e' : hpPct > 25 ? '#f59e0b' : '#ef4444';
  const hpGlow  = hpPct > 50 ? 'rgba(34,197,94,0.5)' : hpPct > 25 ? 'rgba(245,158,11,0.5)' : 'rgba(239,68,68,0.5)';

  const attack  = getHeroAttack(hero);
  const defense = getHeroDefense(hero);
  const sprite  = CLASS_SPRITES[hero.class];
  const palette = getHeroPalette(hero.skinTone ?? 1, hero.hairColor ?? 2);

  const dungeonPct = (hero.dungeonRunsToday / MAX_DAILY_DUNGEONS) * 100;
  const questPct   = (hero.questsCompletedToday / MAX_DAILY_QUESTS) * 100;

  return (
    <div className="card p-3" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* ── Hero header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Sprite frame */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(20,30,60,0.95), rgba(10,15,35,0.98))',
          border: '1px solid rgba(90,110,190,0.3)',
          borderRadius: 4,
          padding: 8,
          boxShadow: '0 0 20px rgba(59,51,140,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
          flexShrink: 0,
        }}>
          <PixelSprite grid={sprite} scale={4} paletteOverrides={palette} />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div>
            <p style={{
              fontSize: 11, marginBottom: 2, wordBreak: 'break-all',
              background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>{hero.name}</p>
            <p style={{ color: '#64748b', fontSize: 7 }}>{CLASS_NAME[hero.class]} · POZ.{hero.level}</p>
          </div>

          {/* Combat stats */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { icon: '⚔️', val: attack,     col: '#f87171' },
              { icon: '🛡',  val: defense,    col: '#60a5fa' },
              { icon: '❤️', val: hero.maxHp,  col: '#4ade80' },
            ].map(({ icon, val, col }) => (
              <div key={icon} style={{
                background: 'rgba(15,23,42,0.8)',
                border: '1px solid rgba(51,65,85,0.6)',
                borderRadius: 3,
                padding: '3px 6px',
                display: 'flex', alignItems: 'center', gap: 3,
              }}>
                <span style={{ fontSize: 9 }}>{icon}</span>
                <span style={{ color: col, fontSize: 8 }}>{val}</span>
              </div>
            ))}
          </div>

          <p style={{
            color: '#fbbf24', fontSize: 9,
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 3,
            padding: '2px 7px',
            display: 'inline-block',
            alignSelf: 'flex-start',
          }}>🪙 {hero.gold}</p>
        </div>
      </div>

      {/* ── HP & XP bars ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <StatBar label="❤️ HP" value={hero.hp} max={hero.maxHp} color={hpColor} glow={hpGlow} />
        <StatBar label="⭐ XP" value={hero.xp} max={hero.xpToNext} color="#f59e0b" glow="rgba(245,158,11,0.5)" />
      </div>

      {/* ── Rest button ── */}
      {isVoluntaryResting ? (
        <div style={{
          background: 'rgba(10,20,40,0.7)',
          border: '1px solid rgba(51,65,85,0.5)',
          borderRadius: 4,
          padding: '7px 10px',
          textAlign: 'center',
        }}>
          <p style={{ color: '#94a3b8', fontSize: 7 }}>
            💤 Odpoczywasz — +10 HP za <RestTimer endsAt={hero.voluntaryRestUntil!} />
          </p>
        </div>
      ) : (
        <button
          onClick={restHero}
          disabled={inCombat || isResting || hero.hp >= hero.maxHp}
          className="btn btn-secondary"
          style={{ width: '100%', fontSize: 7, padding: '6px 8px' }}
        >
          {hero.hp >= hero.maxHp ? '💤 Odpoczynek (pełne HP)' : '💤 Odpoczynek — +10 HP za 10 min'}
        </button>
      )}

      {/* ── Forced rest banner ── */}
      {isResting && (
        <div style={{
          background: 'rgba(14,30,60,0.8)',
          border: '1px solid rgba(29,78,216,0.5)',
          borderRadius: 4,
          padding: '7px 10px',
          textAlign: 'center',
          boxShadow: '0 0 16px rgba(59,130,246,0.15)',
        }}>
          <p style={{ color: '#93c5fd', fontSize: 7 }}>💤 ODPOCZYWASZ — powrót za: <RestTimer endsAt={hero.restingUntil!} /></p>
          <p style={{ color: '#475569', fontSize: 6, marginTop: 3 }}>Po odpoczynku odzyskasz 50% HP</p>
        </div>
      )}

      {/* ── Daily limits ── */}
      <div style={{
        background: 'rgba(5,8,20,0.7)',
        border: '1px solid rgba(30,41,59,0.7)',
        borderRadius: 4,
        padding: '8px 10px',
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        <p style={{ color: '#475569', fontSize: 6, marginBottom: 2 }}>DZIENNY LIMIT</p>
        {[
          {
            label: '⚔️ Lochy', cur: hero.dungeonRunsToday, max: MAX_DAILY_DUNGEONS,
            pct: dungeonPct, color: hero.dungeonRunsToday >= MAX_DAILY_DUNGEONS ? '#ef4444' : '#8b5cf6',
            glow: hero.dungeonRunsToday >= MAX_DAILY_DUNGEONS ? 'rgba(239,68,68,0.4)' : 'rgba(139,92,246,0.4)',
          },
          {
            label: '📜 Zadania', cur: hero.questsCompletedToday, max: MAX_DAILY_QUESTS,
            pct: questPct, color: hero.questsCompletedToday >= MAX_DAILY_QUESTS ? '#ef4444' : '#0ea5e9',
            glow: hero.questsCompletedToday >= MAX_DAILY_QUESTS ? 'rgba(239,68,68,0.4)' : 'rgba(14,165,233,0.4)',
          },
        ].map(({ label, cur, max, pct, color, glow }) => (
          <div key={label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 6, color: '#64748b', marginBottom: 3 }}>
              <span>{label}</span>
              <span style={{ color: cur >= max ? '#f87171' : '#94a3b8' }}>{cur}/{max}</span>
            </div>
            <div className="pixel-bar">
              <div className="pixel-bar-fill" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${glow}` }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Attribute points ── */}
      {hero.attributePoints > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(28,20,8,0.9), rgba(20,14,4,0.95))',
          border: '1px solid rgba(217,119,6,0.5)',
          borderRadius: 4,
          padding: 10,
          boxShadow: '0 0 20px rgba(245,158,11,0.1)',
        }}>
          <p style={{ color: '#fbbf24', fontSize: 8, marginBottom: 8, textShadow: '0 0 10px rgba(251,191,36,0.4)' }}>
            ✨ {hero.attributePoints} PKT CECH!
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
            {(['strength', 'agility', 'intelligence', 'constitution'] as const).map(attr => (
              <button key={attr} onClick={() => upgradeAttribute(attr)} className="btn btn-primary" style={{ fontSize: 7, padding: '5px 6px' }}>
                +{({ strength: 'Siła', agility: 'Zwin', intelligence: 'Intel', constitution: 'Kond' }[attr])}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Stats grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {[
          {
            title: 'STATYSTYKI',
            rows: [
              { icon: '💪', name: 'Siła',    val: hero.stats.strength },
              { icon: '🏃', name: 'Zwinność', val: hero.stats.agility },
              { icon: '🧠', name: 'Intel',   val: hero.stats.intelligence },
              { icon: '🛡', name: 'Kondycja', val: hero.stats.constitution },
            ],
          },
        ].map(({ title, rows }) => (
          <div key={title} style={{
            background: 'rgba(5,8,20,0.7)',
            border: '1px solid rgba(30,41,59,0.6)',
            borderRadius: 4,
            padding: '8px 10px',
          }}>
            <p style={{ color: '#475569', fontSize: 6, marginBottom: 6 }}>{title}</p>
            {rows.map(({ icon, name, val }) => (
              <div key={name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 7, marginBottom: 3, color: '#64748b' }}>
                <span>{icon} {name}</span>
                <span style={{ color: '#fbbf24' }}>{val}</span>
              </div>
            ))}
          </div>
        ))}
        <div style={{
          background: 'rgba(5,8,20,0.7)',
          border: '1px solid rgba(30,41,59,0.6)',
          borderRadius: 4,
          padding: '8px 10px',
        }}>
          <p style={{ color: '#475569', fontSize: 6, marginBottom: 6 }}>WALKA</p>
          {[
            { icon: '⚔️', name: 'Atk',   val: attack,      col: '#f87171' },
            { icon: '🛡',  name: 'Def',   val: defense,     col: '#60a5fa' },
            { icon: '❤️', name: 'MaxHP', val: hero.maxHp,   col: '#4ade80' },
          ].map(({ icon, name, val, col }) => (
            <div key={name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 7, marginBottom: 3, color: '#64748b' }}>
              <span>{icon} {name}</span>
              <span style={{ color: col }}>{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
