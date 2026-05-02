import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { MAX_DAILY_QUESTS, scaledQuestDuration } from '../store/gameStore';
import { ALL_QUESTS } from '../data/quests';
import type { Quest } from '../types';

function formatTime(ms: number): string {
  if (ms <= 0) return 'Gotowe!';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

export default function QuestPanel() {
  const hero = useGameStore(s => s.hero);
  const activeQuest = useGameStore(s => s.activeQuest);
  const startQuest = useGameStore(s => s.startQuest);
  const collectQuest = useGameStore(s => s.collectQuest);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const available = ALL_QUESTS.filter(q => q.minLevel <= hero.level);
  const remaining = activeQuest ? activeQuest.endsAt - now : 0;
  const canCollect = activeQuest && now >= activeQuest.endsAt;
  const progress = activeQuest
    ? Math.min(100, ((now - activeQuest.startedAt) / (activeQuest.endsAt - activeQuest.startedAt)) * 100)
    : 0;
  const limitReached = hero.questsCompletedToday >= MAX_DAILY_QUESTS;

  return (
    <div className="card p-4 space-y-3">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="font-bold text-slate-300">📜 Zadania</h3>
        <p style={{ fontSize: 7, color: limitReached ? '#f87171' : '#94a3b8' }}>
          {hero.questsCompletedToday}/{MAX_DAILY_QUESTS} dziś
        </p>
      </div>

      {limitReached && !activeQuest && (
        <div style={{ background: '#12100a', border: '2px solid #7f1d1d', padding: 8, textAlign: 'center' }}>
          <p style={{ color: '#f87171', fontSize: 7 }}>📜 Dzienny limit zadań wyczerpany — wróć jutro!</p>
        </div>
      )}

      {activeQuest && (
        <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{activeQuest.quest.emoji}</span>
            <div className="flex-1">
              <p className="font-bold text-sm">{activeQuest.quest.name}</p>
              <p className="text-xs text-slate-400">{activeQuest.quest.description}</p>
            </div>
          </div>
          <div style={{ height: 6, background: '#1e293b', borderRadius: 4, marginBottom: 8 }}>
            <div style={{ width: `${progress}%`, height: '100%', background: canCollect ? '#22c55e' : '#d97706', borderRadius: 4, transition: 'width 1s linear' }} />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              {canCollect ? '✅ Gotowe do odbioru!' : `⏳ ${formatTime(remaining)}`}
            </p>
            <div className="flex gap-2 text-xs">
              <span className="text-amber-400">+{activeQuest.quest.goldReward}🪙</span>
              <span className="text-blue-400">+{activeQuest.quest.xpReward}XP</span>
            </div>
          </div>
          {canCollect && (
            <button onClick={collectQuest} className="btn btn-primary w-full mt-2 text-sm">
              🎁 Odbierz nagrodę!
            </button>
          )}
        </div>
      )}

      {!activeQuest && !limitReached && (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {available.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-4">Brak dostępnych zadań dla twojego poziomu.</p>
          ) : (
            available.map((quest: Quest) => {
              const duration = scaledQuestDuration(quest.durationMs, hero.level);
              return (
                <div key={quest.id} className="bg-slate-900/60 rounded-lg p-3 border border-slate-700">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-xl">{quest.emoji}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{quest.name}</p>
                      <p className="text-xs text-slate-400">{quest.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-3 text-xs">
                      <span className="text-amber-400">🪙 {quest.goldReward}</span>
                      <span className="text-blue-400">⭐ {quest.xpReward} XP</span>
                      <span className="text-slate-400">⏱ {formatTime(duration)}</span>
                    </div>
                    <button onClick={() => startQuest(quest)} className="btn btn-primary text-xs py-1 px-3">Start</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
