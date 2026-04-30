import { useGameStore } from '../store/gameStore';
import { ALL_DUNGEONS } from '../data/dungeons';
import type { Dungeon } from '../types';

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
      <div className="bg-slate-900/60 rounded-xl p-3 border border-red-900/40">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-3xl">{enemy.emoji}</span>
          <div className="flex-1">
            <p className="font-bold text-red-400">{enemy.name}</p>
            <p className="text-xs text-slate-400">Poziom {enemy.level}</p>
          </div>
          <p className="text-red-400 font-bold text-sm">{enemy.hp}/{enemy.maxHp} HP</p>
        </div>
        <div style={{ height: 8, background: '#1e293b', borderRadius: 4 }}>
          <div style={{ width: `${enemyHpPct}%`, height: '100%', background: '#ef4444', borderRadius: 4, transition: 'width 0.2s' }} />
        </div>
      </div>

      {/* Hero HP */}
      <div className="bg-slate-900/60 rounded-xl p-2">
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>❤️ {hero.name}</span>
          <span>{hero.hp}/{hero.maxHp}</span>
        </div>
        <div style={{ height: 6, background: '#1e293b', borderRadius: 4 }}>
          <div style={{ width: `${heroHpPct}%`, height: '100%', background: heroHpPct > 50 ? '#22c55e' : heroHpPct > 25 ? '#f59e0b' : '#ef4444', borderRadius: 4, transition: 'width 0.3s' }} />
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={attackEnemy} className="btn btn-primary flex-1">⚔️ Atakuj!</button>
        <button onClick={exitDungeon} className="btn btn-danger px-3">🚪</button>
      </div>

      {/* Combat Log */}
      <div className="bg-slate-950/60 rounded-lg p-2 max-h-40 overflow-y-auto text-xs space-y-0.5">
        {combatLog.slice(0, 15).map((log, i) => (
          <p key={i} className={{
            hero: 'text-green-400',
            enemy: 'text-red-400',
            loot: 'text-amber-400',
            system: 'text-slate-300',
          }[log.type]}>
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

  return (
    <div className="space-y-2">
      <h3 className="font-bold text-slate-300">⚔️ Wybierz Loch</h3>
      {ALL_DUNGEONS.map((dungeon: Dungeon) => {
        const locked = hero.level < dungeon.minLevel;
        return (
          <div key={dungeon.id} className={`bg-slate-900/60 rounded-xl p-3 border ${locked ? 'border-slate-700 opacity-60' : 'border-slate-600 hover:border-amber-600'} transition-colors`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{dungeon.emoji}</span>
              <div className="flex-1">
                <p className="font-bold text-sm">{dungeon.name}</p>
                <p className="text-xs text-slate-400">{dungeon.description}</p>
              </div>
              <div className="text-right text-xs">
                <p className="text-slate-400">Min. Poz.</p>
                <p className="text-amber-400 font-bold">{dungeon.minLevel}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">{dungeon.floors} pięter</p>
              <button
                onClick={() => enterDungeon(dungeon)}
                disabled={locked}
                className="btn btn-primary text-xs py-1 px-3"
              >
                {locked ? `🔒 Poz. ${dungeon.minLevel}` : 'Wejdź'}
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
    // Dungeon completed or between floors
    return (
      <div className="card p-4 space-y-3">
        <div className="text-center py-4">
          <p className="text-3xl mb-2">🏆</p>
          <p className="text-amber-400 font-bold">Loch ukończony!</p>
          <p className="text-slate-400 text-sm">{currentDungeon.name} — {currentFloor - 1} pięter</p>
        </div>
        <div className="bg-slate-950/60 rounded-lg p-2 max-h-40 overflow-y-auto text-xs space-y-0.5">
          {combatLog.slice(0, 10).map((log, i) => (
            <p key={i} className={{ hero: 'text-green-400', enemy: 'text-red-400', loot: 'text-amber-400', system: 'text-slate-300' }[log.type]}>{log.message}</p>
          ))}
        </div>
        <button onClick={exitDungeon} className="btn btn-primary w-full">🏠 Wróć do miasta</button>
      </div>
    );
  }

  return (
    <div className="card p-4">
      {inCombat && currentEnemy ? <EnemyBattleCard /> : <DungeonList />}
    </div>
  );
}
