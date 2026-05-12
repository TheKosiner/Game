import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { MAX_DAILY_DUNGEONS } from '../store/gameStore';
import { ALL_DUNGEONS } from '../data/dungeons';
import type { Dungeon } from '../types';
import PixelSprite from './PixelSprite';
import { ENEMY_SPRITES } from '../data/sprites';
import type { SpriteKey } from '../data/sprites';

const PX   = (s: number) => ({ fontFamily: "'Press Start 2P', monospace", fontSize: s } as const);
const MONO = { fontFamily: "'Share Tech Mono', monospace" } as const;
const ORB  = { fontFamily: "'Orbitron', monospace", fontWeight: 700 } as const;
const LOG_COLORS = { hero: '#5a9040', enemy: '#903040', loot: '#9c7a3c', system: '#7a7060' };

type DungeonMode = 'xp' | 'balanced' | 'loot';
type DungeonDifficulty = 'easy' | 'normal' | 'hard';

const DIFFICULTY_OPTIONS: { key: DungeonDifficulty; label: string; badge: string; desc: string; color: string; border: string }[] = [
  { key: 'easy',   label: 'ŁATWY',   badge: '🌿', desc: 'Słabsi wrogowie, mniej nagród.', color: '#44cc77', border: 'rgba(68,204,119,0.4)' },
  { key: 'normal', label: 'NORMALNY',badge: '⚔',  desc: 'Standardowy balans wyzwania.',   color: '#aaaaaa', border: 'rgba(160,160,160,0.3)' },
  { key: 'hard',   label: 'TRUDNY',  badge: '💀', desc: 'Silniejsi wrogowie, +60% nagród.',color: '#ff4444', border: 'rgba(255,68,68,0.45)'  },
];
const DUNGEON_VARIANTS: { key: DungeonMode; label: string; badge: string; desc: string; color: string; bg: string; border: string; glow: string }[] = [
  { key: 'xp',       label: 'TRENING',   badge: '⚡', desc: 'Duzo XP, malo zdobyczy.',     color: '#4488ff', bg: 'linear-gradient(135deg,rgba(20,30,60,0.97),rgba(10,18,50,0.99))', border: 'rgba(68,136,255,0.35)',  glow: 'rgba(68,136,255,0.08)' },
  { key: 'balanced', label: 'PATROL',    badge: '⚖',  desc: 'Standardowe wynagrodzenie.',  color: '#aaaaaa', bg: 'linear-gradient(135deg,rgba(20,20,25,0.97),rgba(12,12,18,0.99))', border: 'rgba(160,160,160,0.2)',  glow: 'rgba(160,160,160,0.04)' },
  { key: 'loot',     label: 'LOCHY',     badge: '💎', desc: 'Malo XP/zlota, duzo dropow.', color: '#cc44ff', bg: 'linear-gradient(135deg,rgba(35,10,55,0.97),rgba(22,5,40,0.99))',  border: 'rgba(200,68,255,0.35)', glow: 'rgba(200,68,255,0.08)' },
];

function EnemyBattleCard() {
  const hero = useGameStore(s => s.hero);
  const enemy = useGameStore(s => s.currentEnemy);
  const currentFloor = useGameStore(s => s.currentFloor);
  const dungeon = useGameStore(s => s.currentDungeon);
  const combatLog = useGameStore(s => s.combatLog);
  const attackEnemy = useGameStore(s => s.attackEnemy);
  const autoFightEnemy = useGameStore(s => s.autoFightEnemy);
  const exitDungeon = useGameStore(s => s.exitDungeon);

  if (!enemy || !dungeon) return null;

  const enemyHpPct = (enemy.hp / enemy.maxHp) * 100;
  const heroHpPct  = (hero.hp / hero.maxHp) * 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Floor info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ ...PX(6), color: 'var(--gold-main)' }}>{dungeon.emoji} {dungeon.name}</p>
        <p style={{ ...PX(5), color: 'var(--text-dim)' }}>Piętro {currentFloor}/{dungeon.floors}</p>
      </div>

      {/* Enemy */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(20,5,5,0.97), rgba(14,4,4,0.99))',
        border: '1px solid rgba(100,30,30,0.6)',
        padding: 10,
        boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
          {ENEMY_SPRITES[enemy.id as SpriteKey] ? (
            <div style={{
              background: 'var(--bg-deep)', border: '1px solid rgba(80,20,20,0.5)',
              padding: 4, flexShrink: 0,
              boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.5)',
            }}>
              <PixelSprite grid={ENEMY_SPRITES[enemy.id as SpriteKey]} scale={4} />
            </div>
          ) : (
            <span style={{ fontSize: 32 }}>{enemy.emoji}</span>
          )}
          <div style={{ flex: 1 }}>
            <p style={{ ...PX(8), color: '#c05050', marginBottom: 3 }}>{enemy.name}</p>
            <p style={{ ...PX(5), color: 'var(--text-dim)', marginBottom: 6 }}>POZ. {enemy.level}</p>
            <p style={{ ...PX(6), color: '#903040' }}>{enemy.hp} / {enemy.maxHp} HP</p>
          </div>
        </div>
        <div className="pixel-bar">
          <div className="pixel-bar-fill" style={{ width: `${enemyHpPct}%`, background: 'linear-gradient(90deg, #5a0e0e, #b83030)' }} />
        </div>
      </div>

      {/* Hero HP */}
      <div style={{
        background: 'var(--bg-inset)', border: '1px solid var(--border-dark)',
        padding: 8,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ ...PX(5), color: 'var(--text-dim)' }}>{hero.name}</span>
          <span style={{ ...PX(5), color: 'var(--text-dim)' }}>{hero.hp}/{hero.maxHp} HP</span>
        </div>
        <div className="pixel-bar">
          <div className="pixel-bar-fill hp-fill" style={{ width: `${heroHpPct}%` }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={attackEnemy} className="btn btn-primary" style={{ flex: 1, fontSize: 7 }}>⚔ Atakuj!</button>
        <button onClick={autoFightEnemy} className="btn btn-secondary" style={{ flex: 1, fontSize: 7 }}>⚡ Szybka walka</button>
        <button onClick={exitDungeon} className="btn btn-danger" style={{ padding: '8px 14px', fontSize: 8 }}>🚪</button>
      </div>

      <div className="combat-log">
        {combatLog.slice(0, 15).map((log, i) => (
          <p key={i} style={{ color: LOG_COLORS[log.type], marginBottom: 1 }}>{log.message}</p>
        ))}
      </div>
    </div>
  );
}

function DungeonList() {
  const hero         = useGameStore(s => s.hero);
  const enterDungeon = useGameStore(s => s.enterDungeon);
  const isResting    = (hero.restingUntil !== null && Date.now() < hero.restingUntil) ||
                       (hero.voluntaryRestUntil !== null && Date.now() < hero.voluntaryRestUntil);
  const limitReached = hero.dungeonRunsToday >= MAX_DAILY_DUNGEONS;

  const [difficulty, setDifficulty] = useState<DungeonDifficulty>('normal');

  const available = ALL_DUNGEONS.filter((d: Dungeon) => d.minLevel <= hero.level);
  const best      = available.length > 0 ? available[available.length - 1] : null;
  const locked    = ALL_DUNGEONS.filter((d: Dungeon) => d.minLevel > hero.level);

  const blocked = isResting || limitReached;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ ...PX(8), color: 'var(--gold-main)', textShadow: '0 0 10px var(--gold-glow)' }}>LOCHY</p>
        <p style={{ ...PX(5), color: limitReached ? 'var(--hp-bright)' : 'var(--text-dim)' }}>
          {hero.dungeonRunsToday}/{MAX_DAILY_DUNGEONS} dzis
        </p>
      </div>

      {isResting && (
        <div style={{ background: 'rgba(8,12,20,0.95)', border: '1px solid rgba(30,50,80,0.5)', padding: 8, textAlign: 'center' }}>
          <p style={{ ...PX(6), color: '#5070a0' }}>Odpoczywasz — wróc gdy odzyskasz sily</p>
        </div>
      )}

      {!isResting && limitReached && (
        <div style={{ background: 'rgba(16,6,6,0.95)', border: '1px solid rgba(80,20,20,0.5)', padding: 8, textAlign: 'center' }}>
          <p style={{ ...PX(6), color: 'var(--hp-bright)' }}>Dzienny limit lochów wyczerpany!</p>
        </div>
      )}

      {!best && (
        <p style={{ ...PX(6), color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>Brak lochów dla twojego poziomu.</p>
      )}

      {best && (
        <>
          {/* Dungeon header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
            <span style={{ fontSize: 22 }}>{best.emoji}</span>
            <div style={{ flex: 1 }}>
              <p style={{ ...ORB, fontSize: 9, color: 'var(--text-bright)', marginBottom: 2 }}>{best.name}</p>
              <p style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', marginBottom: 2 }}>{best.description}</p>
              <span style={{ ...MONO, fontSize: 9, color: 'var(--text-muted)' }}>{best.floors} pięter</span>
            </div>
          </div>

          {/* Difficulty selector */}
          <div>
            <p style={{ ...MONO, fontSize: 9, color: 'var(--text-dim)', marginBottom: 6, letterSpacing: '0.08em' }}>POZIOM TRUDNOŚCI</p>
            <div style={{ display: 'flex', gap: 6 }}>
              {DIFFICULTY_OPTIONS.map(d => {
                const active = difficulty === d.key;
                return (
                  <button
                    key={d.key}
                    onClick={() => setDifficulty(d.key)}
                    style={{
                      flex: 1,
                      background: active ? `rgba(${d.key === 'easy' ? '68,204,119' : d.key === 'hard' ? '255,68,68' : '160,160,160'},0.12)` : 'var(--bg-inset)',
                      border: `1px solid ${active ? d.border : 'var(--border-dark)'}`,
                      padding: '7px 4px',
                      cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                      boxShadow: active ? `0 0 10px ${d.border}` : 'none',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                    }}
                  >
                    <span style={{ fontSize: 14 }}>{d.badge}</span>
                    <span style={{ ...ORB, fontSize: 6, color: active ? d.color : 'var(--text-dim)' }}>{d.label}</span>
                  </button>
                );
              })}
            </div>
            <p style={{ ...MONO, fontSize: 9, color: 'var(--text-muted)', marginTop: 5 }}>
              {DIFFICULTY_OPTIONS.find(d => d.key === difficulty)?.desc}
            </p>
          </div>

          {/* 3 mode cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {DUNGEON_VARIANTS.map(v => (
              <div key={v.key} style={{
                background: v.bg,
                border: `1px solid ${v.border}`,
                padding: '10px 12px',
                boxShadow: `0 0 16px ${v.glow}`,
                display: 'flex', alignItems: 'center', gap: 10,
                opacity: blocked ? 0.5 : 1,
              }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{v.badge}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ ...ORB, fontSize: 8, color: v.color, marginBottom: 3 }}>{v.label}</p>
                  <p style={{ ...MONO, fontSize: 9, color: 'var(--text-dim)' }}>{v.desc}</p>
                </div>
                <button
                  onClick={() => enterDungeon(best, v.key, difficulty)}
                  disabled={blocked}
                  className="btn btn-primary"
                  style={{ fontSize: 6, padding: '7px 10px', flexShrink: 0, cursor: blocked ? 'not-allowed' : 'pointer', borderColor: v.border }}
                >
                  {isResting ? 'ODPOCZYNEK' : limitReached ? 'LIMIT' : 'WEJDZ'}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Locked dungeons */}
      {locked.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 4 }}>
          {locked.map((d: Dungeon) => (
            <div key={d.id} style={{
              background: 'var(--bg-inset)', border: '1px solid var(--border-dark)',
              padding: '8px 10px', opacity: 0.45,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 18 }}>{d.emoji}</span>
              <div style={{ flex: 1 }}>
                <p style={{ ...PX(6), color: 'var(--text-dim)', marginBottom: 2 }}>{d.name}</p>
                <p style={{ ...MONO, fontSize: 9, color: 'var(--text-muted)' }}>{d.floors} pięter</p>
              </div>
              <span style={{ ...PX(6), color: 'var(--text-muted)' }}>🔒 POZ.{d.minLevel}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DungeonPanel() {
  const currentDungeon    = useGameStore(s => s.currentDungeon);
  const currentEnemy      = useGameStore(s => s.currentEnemy);
  const inCombat          = useGameStore(s => s.inCombat);
  const currentFloor      = useGameStore(s => s.currentFloor);
  const exitDungeon       = useGameStore(s => s.exitDungeon);
  const combatLog         = useGameStore(s => s.combatLog);
  const defeatedAtDungeon = useGameStore(s => s.defeatedAtDungeon);
  const clearDefeat       = useGameStore(s => s.clearDefeat);

  if (defeatedAtDungeon) {
    return (
      <div className="card p-3" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{
          textAlign: 'center', padding: '20px 0',
          background: 'linear-gradient(135deg, rgba(30,4,4,0.97), rgba(18,2,2,0.99))',
          border: '1px solid rgba(120,20,20,0.6)',
          boxShadow: 'inset 0 2px 12px rgba(0,0,0,0.6)',
        }}>
          <p style={{ fontSize: 40, marginBottom: 10 }}>💀</p>
          <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 11, color: 'var(--hp-bright)', textShadow: '0 0 16px #ff000066', marginBottom: 10 }}>
            PRZEGRAŁEŚ!
          </p>
          <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: 'var(--text-dim)', marginBottom: 6 }}>
            {defeatedAtDungeon}
          </p>
          <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: '#5070a0', lineHeight: 1.8 }}>
            Musisz odpocząć aby<br />odzyskać życie.
          </p>
        </div>
        <div className="combat-log">
          {combatLog.slice(0, 8).map((log, i) => (
            <p key={i} style={{ color: LOG_COLORS[log.type], marginBottom: 1 }}>{log.message}</p>
          ))}
        </div>
        <button onClick={clearDefeat} className="btn btn-secondary" style={{ width: '100%', fontSize: 7 }}>
          ◀ Wróć do miasta
        </button>
      </div>
    );
  }

  if (currentDungeon && !inCombat) {
    return (
      <div className="card p-3" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <p style={{ fontSize: 32, marginBottom: 8 }}>🏆</p>
          <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: 'var(--gold-bright)', textShadow: '0 0 12px var(--gold-glow)', marginBottom: 6 }}>
            LOCH UKOŃCZONY!
          </p>
          <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: 'var(--text-dim)' }}>
            {currentDungeon.name} — {currentFloor - 1} PIĘTER
          </p>
        </div>
        <div className="combat-log">
          {combatLog.slice(0, 10).map((log, i) => (
            <p key={i} style={{ color: LOG_COLORS[log.type], marginBottom: 1 }}>{log.message}</p>
          ))}
        </div>
        <button onClick={exitDungeon} className="btn btn-primary" style={{ width: '100%', fontSize: 7 }}>
          ▶ Wróć do miasta
        </button>
      </div>
    );
  }

  return (
    <div className="card p-3">
      {inCombat && currentEnemy ? <EnemyBattleCard /> : <DungeonList />}
    </div>
  );
}
