import { useState } from 'react';
import type { HeroClass } from '../types';
import { useGameStore } from '../store/gameStore';

const CLASSES: { id: HeroClass; name: string; emoji: string; desc: string; pros: string }[] = [
  { id: 'warrior', name: 'Wojownik', emoji: '⚔️', desc: 'Mistrz walki wręcz. Wysoka żywotność i atak siłowy.', pros: 'Wysoka Siła & Kondycja' },
  { id: 'mage', name: 'Mag', emoji: '🔮', desc: 'Władca arkaniki. Ogromna moc magii i inteligencja.', pros: 'Wysoka Inteligencja' },
  { id: 'rogue', name: 'Łotrzyk', emoji: '🗡️', desc: 'Skryty zabójca. Szybkość i krytyczne ciosy.', pros: 'Wysoka Zwinność & Krytyki' },
];

export default function CharacterCreation() {
  const [name, setName] = useState('');
  const [selectedClass, setSelectedClass] = useState<HeroClass | null>(null);
  const initHero = useGameStore(s => s.initHero);

  function handleCreate() {
    if (!name.trim() || !selectedClass) return;
    initHero(name.trim(), selectedClass);
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0f0e17 0%, #1a1a2e 100%)' }}>
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <p className="text-6xl mb-3">🏰</p>
          <h1 className="text-3xl font-bold text-amber-400">Realm of Valor</h1>
          <p className="text-slate-400 mt-2">Stwórz swojego bohatera i zacznij przygodę</p>
          <div className="mt-2 inline-block bg-green-900/30 border border-green-700 rounded-full px-3 py-0.5 text-green-400 text-xs">
            ✅ 100% Fair Play — Brak Pay to Win
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1">Imię bohatera</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Wpisz imię..."
              maxLength={20}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Wybierz klasę</label>
            <div className="space-y-2">
              {CLASSES.map(cls => (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClass(cls.id)}
                  className={`w-full text-left rounded-xl p-3 border transition-all ${selectedClass === cls.id ? 'border-amber-500 bg-amber-900/20' : 'border-slate-700 bg-slate-900/40 hover:border-slate-500'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{cls.emoji}</span>
                    <div>
                      <p className="font-bold text-sm">{cls.name}</p>
                      <p className="text-xs text-slate-400">{cls.desc}</p>
                      <p className="text-xs text-amber-400 mt-0.5">{cls.pros}</p>
                    </div>
                    {selectedClass === cls.id && <span className="ml-auto text-amber-400">✓</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={!name.trim() || !selectedClass}
            className="btn btn-primary w-full py-3 text-base"
          >
            🚀 Rozpocznij Przygodę!
          </button>
        </div>
      </div>
    </div>
  );
}
