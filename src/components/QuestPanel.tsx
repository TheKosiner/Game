import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { MAX_DAILY_QUESTS, scaledQuestDuration } from '../store/gameStore';
import { ALL_QUESTS } from '../data/quests';
import type { Quest } from '../types';

const PX = (s: number) => ({ fontFamily: "'Press Start 2P', monospace", fontSize: s } as const);

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

  const isResting = (hero.restingUntil !== null && now < hero.restingUntil) ||
                    (hero.voluntaryRestUntil !== null && now < hero.voluntaryRestUntil);

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
    <div className="card p-3" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ ...PX(8), color: 'var(--gold-main)', textShadow: '0 0 10px var(--gold-glow)' }}>📜 ZADANIA</p>
        <p style={{ ...PX(5), color: limitReached ? 'var(--hp-bright)' : 'var(--text-dim)' }}>
          {hero.questsCompletedToday}/{MAX_DAILY_QUESTS} dziś
        </p>
      </div>

      {limitReached && !activeQuest && (
        <div style={{ background: 'rgba(16,6,6,0.95)', border: '1px solid rgba(80,20,20,0.5)', padding: 8, textAlign: 'center' }}>
          <p style={{ ...PX(6), color: 'var(--hp-bright)' }}>Dzienny limit zadań wyczerpany!</p>
        </div>
      )}

      {activeQuest && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(24,18,6,0.97), rgba(18,14,4,0.99))',
          border: '1px solid var(--gold-darker)',
          padding: 12,
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.4)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 22 }}>{activeQuest.quest.emoji}</span>
            <div style={{ flex: 1 }}>
              <p style={{ ...PX(7), color: 'var(--gold-bright)', marginBottom: 4 }}>{activeQuest.quest.name}</p>
              <p style={{ ...PX(5), color: 'var(--text-dim)' }}>{activeQuest.quest.description}</p>
            </div>
          </div>

          <div style={{ height: 8, background: 'var(--bg-inset)', border: '1px solid var(--border-dark)', marginBottom: 8, overflow: 'hidden' }}>
            <div style={{
              width: `${progress}%`, height: '100%',
              background: canCollect
                ? 'linear-gradient(90deg, #3a7a1a, #6aaa30)'
                : 'linear-gradient(90deg, var(--xp-dark), var(--xp-bright))',
              transition: 'width 1s linear',
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: canCollect ? 10 : 0 }}>
            <p style={{ ...PX(5), color: canCollect ? '#6aaa30' : 'var(--text-dim)' }}>
              {canCollect ? '✓ Gotowe do odbioru!' : `⏳ ${formatTime(remaining)}`}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <span style={{ ...PX(5), color: 'var(--gold-bright)' }}>+{activeQuest.quest.goldReward}🪙</span>
              <span style={{ ...PX(5), color: '#5070a0' }}>+{activeQuest.quest.xpReward}XP</span>
            </div>
          </div>

          {canCollect && (
            <button onClick={collectQuest} className="btn btn-primary" style={{ width: '100%', fontSize: 7 }}>
              🎁 Odbierz nagrodę!
            </button>
          )}
        </div>
      )}

      {isResting && !activeQuest && (
        <div style={{ background: 'rgba(8,12,20,0.95)', border: '1px solid rgba(30,50,80,0.5)', padding: 8, textAlign: 'center' }}>
          <p style={{ ...PX(6), color: '#5070a0' }}>💤 Odpoczywasz — wróć gdy odzyskasz siły</p>
        </div>
      )}

      {!activeQuest && !limitReached && !isResting && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 420, overflowY: 'auto' }}>
          {available.length === 0 ? (
            <p style={{ ...PX(6), color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
              Brak zadań dla twojego poziomu.
            </p>
          ) : (
            available.map((quest: Quest) => {
              const duration = scaledQuestDuration(quest.durationMs, hero.level);
              return (
                <div key={quest.id} style={{
                  background: 'var(--bg-inset)',
                  border: '1px solid var(--border-dark)',
                  padding: 10,
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 18 }}>{quest.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ ...PX(6), color: 'var(--text-bright)', marginBottom: 4 }}>{quest.name}</p>
                      <p style={{ ...PX(5), color: 'var(--text-muted)' }}>{quest.description}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <span style={{ ...PX(5), color: 'var(--gold-bright)' }}>🪙 {quest.goldReward}</span>
                      <span style={{ ...PX(5), color: '#5070a0' }}>✦ {quest.xpReward} XP</span>
                      <span style={{ ...PX(5), color: 'var(--text-dim)' }}>⏱ {formatTime(duration)}</span>
                    </div>
                    <button onClick={() => startQuest(quest)} className="btn btn-primary" style={{ fontSize: 5, padding: '6px 10px' }}>
                      Start ▶
                    </button>
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
