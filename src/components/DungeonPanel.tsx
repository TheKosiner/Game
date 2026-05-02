import { useGameStore } from '../store/gameStore';
import { ENERGY_COST_PER_FLOOR } from '../store/gameStore';
import { ALL_DUNGEONS } from '../data/dungeons';
import type { Dungeon } from '../types';
import PixelSprite from './PixelSprite';
import { ENEMY_SPRITES } from '../data/sprites';
import type { SpriteKey } from '../data/sprites';

function EnemyBattleCard() {
  const hero = useGameStore(s => s.hero);
  const enemy = useGameStore(s => s.currentEnemy);
  const currentFloor = useGameStore(s => s.currentFloor);
  const dungeon = useGameStore(s => s.currentDungeon);
  const combatLog = useGameStore(s => s.combatLog);
  const attackEnemy = useGameStore(s => s.attackEnemy);
  const exitDungeon = useGameStore(s => s.exitDungeon);

  if (!enemy || !dungeon) return null;

  const enemyHpPct = (enemy.hp / enemy.maxHp) * 100;
  const heroHpPct = (hero.hp / hero.maxHp) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>{dungeon.emoji} {dungeon.name}</span>
        <span>Piętro {currentFloor} / {dungeon.floors}</span>
      </div>

      {/* Enemy */}
      <div style={{ background: '#0f0a0a', border: '2px solid #7f1d1d', padding: 8 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
          {ENEMY_SPRITES[enemy.id as SpriteKey] ? (
            <div style={{ background: '#0a0a1a', border: '3px solid #334155', padding: 4, boxShadow: '3px 3px 0 #000', flexShrink: 0 }}>
              <PixelSprite grid={ENEMY_SPRITES[enemy.id as SpriteKey]} scale={4} />
            </div>
          ) : (
            <span style={{ fontSize: 32 }}>{enemy.emoji}</span>
          )}
          <div style={{ flex: 1 }}>
            <p style={{ color: '#f87171', fontSize: 9, marginBottom: 2 }}>{enemy.name}</p>
            <p style={{ color: '#64748b', fontSize: 7, marginBottom: 4 }}>POZ. {enemy.level}</p>
            <p style={{ color: '#f87171', fontSize: 8 }}>{enemy.hp}/{enemy.maxHp} HP</p>
          </div>
        </div>
        <div className="pixel-bar">
          <div className="pixel-bar-fill" style={{ width: `${enemyHpPct}%`, background: '#dc2626' }} />
        </div>
      </div>

      {/* Hero HP */}
      <div style={{ background: '#0a1408', border: '2px solid #1e293b', padding: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 7, color: '#64748b', marginBottom: 4 }}>
          <span>HP — {hero.name}</span>
          <span>{hero.hp}/{hero.maxHp}</span>
        </div>
        <div className="pixel-bar">
          <div className="pixel-bar-fill" style={{ width: `${heroHpPct}%`, background: heroHpPct > 50 ? '#16a34a' : heroHpPct > 25 ? '#d97706' : '#dc2626' }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={attackEnemy} className="btn btn-primary" style={{ flex: 1, fontSize: 8 }}>⚔️ Atakuj!</button>
        <button onClick={exitDungeon} className="btn btn-danger" style={{ padding: '8px 12px', fontSize: 8 }}>🚪</button>
      </div>

      {/* Combat Log */}
      <div className="combat-log" style={{ padding: 8, maxHeight: 120, overflowY: 'auto' }}>
        {combatLog.slice(0, 15).map((log, i) => (
          <p key={i} style={{ color: { hero: '#4ade80', enemy: '#f87171', loot: '#fbbf24', system: '#cbd5e1' }[log.type], marginBottom: 2 }}>
            {log.message}
          </p>
        ))}
      </div>
    </div>
  );
}

function DungeonList() {
  const hero = useGameStore(s => s.hero);
  const enterDungeon = useGameStore(s => s.enterDungeon);
  const isResting = hero.restingUntil !== null && Date.now() < hero.restingUntil;
  const hasEnergy = hero.energy >= ENERGY_COST_PER_FLOOR;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <p style={{ color: '#fbbf24', fontSize: 9 }}>⚔️ WYBIERZ LOCH</p>
        <p style={{ fontSize: 7, color: hasEnergy ? '#3b82f6' : '#475569' }}>⚡ {Math.floor(hero.energy)}/{hero.maxEnergy}</p>
      </div>

      {isResting && (
        <div style={{ background: '#0c1220', border: '2px solid #1d4ed8', padding: 8, textAlign: 'center' }}>
          <p style={{ color: '#93c5fd', fontSize: 7 }}>💤 Odpoczywasz po walce — wróć gdy odzyskasz siły</p>
        </div>
      )}

      {!isResting && !hasEnergy && (
        <div style={{ background: '#12100a', border: '2px solid #475569', padding: 8, textAlign: 'center' }}>
          <p style={{ color: '#94a3b8', fontSize: 7 }}>⚡ Brak energii — regeneruje się automatycznie</p>
        </div>
      )}

      {ALL_DUNGEONS.map((dungeon: Dungeon) => {
        const locked = hero.level < dungeon.minLevel;
        const blocked = locked || isResting || !hasEnergy;
        const totalCost = dungeon.floors * ENERGY_COST_PER_FLOOR;
        return (
          <div key={dungeon.id} style={{ background: '#0a0a1a', border: `2px solid ${locked ? '#1e293b' : '#334155'}`, padding: 10, opacity: blocked ? 0.6 : 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 20 }}>{dungeon.emoji}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 8, color: '#e2e8f0', marginBottom: 2 }}>{dungeon.name}</p>
                <p style={{ fontSize: 6, color: '#64748b' }}>{dungeon.description}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 6, color: '#64748b' }}>MIN. POZ.</p>
                <p style={{ fontSize: 9, color: '#fbbf24' }}>{dungeon.minLevel}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 6, color: '#475569' }}>{dungeon.floors} pięter</p>
                <p style={{ fontSize: 6, color: '#3b82f6' }}>⚡ {ENERGY_COST_PER_FLOOR}/piętro ({totalCost} łącznie)</p>
              </div>
              <button
                onClick={() => enterDungeon(dungeon)}
                disabled={blocked}
                className="btn btn-primary"
                style={{ fontSize: 7, padding: '4px 10px' }}
              >
                {locked ? `🔒 POZ.${dungeon.minLevel}` : isResting ? '💤 Odpoczynek' : !hasEnergy ? '⚡ Brak energii' : 'Wejdź ▶'}
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
  const currentEnemy = useGameStore(s => s.currentEnemy);
  const inCombat = useGameStore(s => s.inCombat);
  const currentFloor = useGameStore(s => s.currentFloor);
  const exitDungeon = useGameStore(s => s.exitDungeon);
  const combatLog = useGameStore(s => s.combatLog);

  if (currentDungeon && !inCombat) {
    return (
      <div className="card p-3" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <p style={{ fontSize: 28, marginBottom: 8 }}>🏆</p>
          <p style={{ color: '#fbbf24', fontSize: 9, marginBottom: 4 }}>LOCH UKOŃCZONY!</p>
          <p style={{ color: '#64748b', fontSize: 7 }}>{currentDungeon.name} — {currentFloor - 1} PIĘTER</p>
        </div>
        <div className="combat-log" style={{ padding: 8, maxHeight: 120, overflowY: 'auto' }}>
          {combatLog.slice(0, 10).map((log, i) => (
            <p key={i} style={{ color: { hero: '#4ade80', enemy: '#f87171', loot: '#fbbf24', system: '#cbd5e1' }[log.type], marginBottom: 2 }}>{log.message}</p>
          ))}
        </div>
        <button onClick={exitDungeon} className="btn btn-primary" style={{ width: '100%', fontSize: 8 }}>🏠 Wróć do miasta</button>
      </div>
    );
  }

  return (
    <div className="card p-4">
      {inCombat && currentEnemy ? <EnemyBattleCard /> : <DungeonList />}
    </div>
  );
}
