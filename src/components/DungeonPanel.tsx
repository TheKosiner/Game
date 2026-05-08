import { useGameStore } from '../store/gameStore';
import { MAX_DAILY_DUNGEONS } from '../store/gameStore';
import { ALL_DUNGEONS } from '../data/dungeons';
import type { Dungeon } from '../types';
import PixelSprite from './PixelSprite';
import { ENEMY_SPRITES } from '../data/sprites';
import type { SpriteKey } from '../data/sprites';

const PX = (s: number) => ({ fontFamily: "'Press Start 2P', monospace", fontSize: s } as const);
const LOG_COLORS = { hero: '#5a9040', enemy: '#903040', loot: '#9c7a3c', system: '#7a7060' };

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
  const hero = useGameStore(s => s.hero);
  const enterDungeon = useGameStore(s => s.enterDungeon);
  const isResting = (hero.restingUntil !== null && Date.now() < hero.restingUntil) ||
                    (hero.voluntaryRestUntil !== null && Date.now() < hero.voluntaryRestUntil);
  const limitReached = hero.dungeonRunsToday >= MAX_DAILY_DUNGEONS;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
        <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: 'var(--gold-main)', textShadow: '0 0 10px var(--gold-glow)' }}>
          ⚔ LOCHY
        </p>
        <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: limitReached ? 'var(--hp-bright)' : 'var(--text-dim)' }}>
          {hero.dungeonRunsToday}/{MAX_DAILY_DUNGEONS} dziś
        </p>
      </div>

      {isResting && (
        <div style={{ background: 'rgba(8,12,20,0.95)', border: '1px solid rgba(30,50,80,0.5)', padding: 8, textAlign: 'center' }}>
          <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: '#5070a0' }}>💤 Odpoczywasz — wróć gdy odzyskasz siły</p>
        </div>
      )}

      {!isResting && limitReached && (
        <div style={{ background: 'rgba(16,6,6,0.95)', border: '1px solid rgba(80,20,20,0.5)', padding: 8, textAlign: 'center' }}>
          <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: 'var(--hp-bright)' }}>⚔ Dzienny limit lochów wyczerpany!</p>
        </div>
      )}

      {ALL_DUNGEONS.map((dungeon: Dungeon) => {
        const locked = hero.level < dungeon.minLevel;
        const blocked = locked || isResting || limitReached;
        return (
          <div key={dungeon.id} style={{
            background: 'var(--bg-inset)',
            border: `1px solid ${locked ? 'var(--border-dark)' : 'var(--border-main)'}`,
            padding: 10, opacity: blocked ? 0.55 : 1,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
              <span style={{ fontSize: 20 }}>{dungeon.emoji}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: 'var(--text-bright)', marginBottom: 3 }}>{dungeon.name}</p>
                <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: 'var(--text-muted)' }}>{dungeon.description}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 4, color: 'var(--text-muted)' }}>MIN. POZ.</p>
                <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: 'var(--gold-bright)' }}>{dungeon.minLevel}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 4, color: 'var(--text-muted)' }}>{dungeon.floors} pięter</p>
              <button onClick={() => enterDungeon(dungeon)} disabled={blocked} className="btn btn-primary" style={{ fontSize: 6, padding: '5px 10px' }}>
                {locked ? `🔒 POZ.${dungeon.minLevel}` : isResting ? '💤 Odpoczynek' : limitReached ? '⛔ Limit' : 'Wejdź ▶'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function DungeonPanel() {
  const currentDungeon = useGameStore(s => s.currentDungeon);
  const currentEnemy   = useGameStore(s => s.currentEnemy);
  const inCombat       = useGameStore(s => s.inCombat);
  const currentFloor   = useGameStore(s => s.currentFloor);
  const exitDungeon    = useGameStore(s => s.exitDungeon);
  const combatLog      = useGameStore(s => s.combatLog);

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
