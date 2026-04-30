import { useGameStore } from '../store/gameStore';
import { getHeroAttack, getHeroDefense } from '../utils/combat';

const CLASS_EMOJI: Record<string, string> = { warrior: '⚔️', mage: '🔮', rogue: '🗡️' };
const CLASS_NAME: Record<string, string> = { warrior: 'Wojownik', mage: 'Mag', rogue: 'Łotrzyk' };

export default function HeroCard() {
  const hero = useGameStore(s => s.hero);
  const upgradeAttribute = useGameStore(s => s.upgradeAttribute);
  const xpPct = Math.min(100, (hero.xp / hero.xpToNext) * 100);
  const hpPct = Math.min(100, (hero.hp / hero.maxHp) * 100);
  const attack = getHeroAttack(hero);
  const defense = getHeroDefense(hero);

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-4xl">{CLASS_EMOJI[hero.class]}</span>
        <div>
          <h2 className="font-bold text-xl text-amber-400">{hero.name}</h2>
          <p className="text-slate-400 text-sm">{CLASS_NAME[hero.class]} — Poziom {hero.level}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-amber-400 font-bold">🪙 {hero.gold}</p>
          <p className="text-purple-400 text-sm">💎 {hero.gems}</p>
        </div>
      </div>

      {/* HP Bar */}
      <div>
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>❤️ Życie</span>
          <span>{hero.hp} / {hero.maxHp}</span>
        </div>
        <div style={{ height: 8, background: '#1e293b', borderRadius: 4 }}>
          <div style={{ width: `${hpPct}%`, height: '100%', background: hpPct > 50 ? '#22c55e' : hpPct > 25 ? '#f59e0b' : '#ef4444', borderRadius: 4, transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* XP Bar */}
      <div>
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>⭐ Doświadczenie</span>
          <span>{hero.xp} / {hero.xpToNext}</span>
        </div>
        <div style={{ height: 6, background: '#1e293b', borderRadius: 4 }}>
          <div style={{ width: `${xpPct}%`, height: '100%', background: '#d97706', borderRadius: 4, transition: 'width 0.5s' }} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-slate-900/60 rounded-lg p-2">
          <p className="text-slate-400 text-xs mb-1">Statystyki</p>
          <p>💪 Siła: <span className="text-amber-400 font-bold">{hero.stats.strength}</span></p>
          <p>🏃 Zwinność: <span className="text-amber-400 font-bold">{hero.stats.agility}</span></p>
          <p>🧠 Inteligencja: <span className="text-amber-400 font-bold">{hero.stats.intelligence}</span></p>
          <p>🛡️ Kondycja: <span className="text-amber-400 font-bold">{hero.stats.constitution}</span></p>
        </div>
        <div className="bg-slate-900/60 rounded-lg p-2">
          <p className="text-slate-400 text-xs mb-1">Walka</p>
          <p>⚔️ Atak: <span className="text-red-400 font-bold">{attack}</span></p>
          <p>🛡️ Obrona: <span className="text-blue-400 font-bold">{defense}</span></p>
          <p>❤️ Max HP: <span className="text-green-400 font-bold">{hero.maxHp}</span></p>
        </div>
      </div>

      {/* Attribute points */}
      {hero.attributePoints > 0 && (
        <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-3">
          <p className="text-amber-400 font-bold text-sm mb-2">✨ {hero.attributePoints} punkty cech do rozdysponowania!</p>
          <div className="grid grid-cols-2 gap-1">
            {(['strength', 'agility', 'intelligence', 'constitution'] as const).map(attr => (
              <button key={attr} onClick={() => upgradeAttribute(attr)} className="btn btn-secondary text-xs py-1">
                + {{ strength: '💪 Siła', agility: '🏃 Zwinność', intelligence: '🧠 Intel.', constitution: '🛡️ Kondycja' }[attr]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
