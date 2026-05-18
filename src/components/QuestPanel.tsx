import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { MAX_DAILY_QUESTS, scaledQuestDuration } from '../store/gameStore';
import { ALL_QUESTS, RANDOM_QUEST_NAMES } from '../data/quests';
import type { Quest } from '../types';
import { useT } from '../hooks/useT';
import { useAuthStore } from '../store/authStore';
import { collectQuestServer } from '../lib/serverActions';
import { syncToCloud } from '../lib/cloudSync';

const PX   = (s: number) => ({ fontFamily: "'Press Start 2P', monospace", fontSize: s } as const);
const MONO = { fontFamily: "'Share Tech Mono', monospace" } as const;
const ORB  = { fontFamily: "'Orbitron', monospace", fontWeight: 700 } as const;

const VARIANTS_BASE = [
  {
    key: 'xp',
    labelKey: 'typeXp' as const,
    descKey: 'typeXpDesc' as const,
    badge: '⚡',
    xpMult: 1.8, goldMult: 0.3,
    color: '#4488ff',
    bg: 'linear-gradient(135deg, rgba(20,30,60,0.97), rgba(10,18,50,0.99))',
    border: 'rgba(68,136,255,0.35)',
    glow: 'rgba(68,136,255,0.08)',
  },
  {
    key: 'bal',
    labelKey: 'typeContract' as const,
    descKey: 'typeContractDesc' as const,
    badge: '⚖',
    xpMult: 1.0, goldMult: 1.0,
    color: '#aaaaaa',
    bg: 'linear-gradient(135deg, rgba(20,20,25,0.97), rgba(12,12,18,0.99))',
    border: 'rgba(160,160,160,0.2)',
    glow: 'rgba(160,160,160,0.04)',
  },
  {
    key: 'gold',
    labelKey: 'typeLoot' as const,
    descKey: 'typeLootDesc' as const,
    badge: '🪙',
    xpMult: 0.3, goldMult: 1.8,
    color: '#ffd700',
    bg: 'linear-gradient(135deg, rgba(40,28,5,0.97), rgba(28,18,3,0.99))',
    border: 'rgba(255,215,0,0.3)',
    glow: 'rgba(255,215,0,0.07)',
  },
];

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
  const t = useT();
  const hero        = useGameStore(s => s.hero);
  const activeQuest  = useGameStore(s => s.activeQuest);
  const startQuest      = useGameStore(s => s.startQuest);
  const handleStartQuest = (quest: Quest) => {
    startQuest(quest);
    // Sync immediately so the CF has the activeQuest data when collecting
    if (user) syncToCloud(user.uid, user.username).catch(() => {});
  };
  const collectQuest    = useGameStore(s => s.collectQuest);
  const abandonQuest    = useGameStore(s => s.abandonQuest);
  const gemSpeedupQuest = useGameStore(s => s.gemSpeedupQuest);
  const user = useAuthStore(s => s.user);
  const [now, setNow] = useState(Date.now());
  const [confirmAbandon, setConfirmAbandon] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const [questDisplayName, setQuestDisplayName] = useState(
    () => RANDOM_QUEST_NAMES[Math.floor(Math.random() * RANDOM_QUEST_NAMES.length)]
  );

  useEffect(() => {
    if (!activeQuest) {
      setQuestDisplayName(RANDOM_QUEST_NAMES[Math.floor(Math.random() * RANDOM_QUEST_NAMES.length)]);
    }
  }, [activeQuest]);

  async function handleCollect() {
    if (collecting) return;
    setCollecting(true);
    try {
      if (user) {
        try {
          await collectQuestServer();
        } catch (err: any) {
          // CF explicitly said quest isn't done yet — respect that
          if (err?.code === 'functions/failed-precondition') {
            setCollecting(false);
            return;
          }
          // Any other error (not deployed, network, quest not in Firestore yet) —
          // fall back to local time check so the game still works
        }
      }
      collectQuest();
    } finally {
      setCollecting(false);
    }
  }

  const isResting = (hero.restingUntil !== null && now < hero.restingUntil) ||
                    (hero.voluntaryRestUntil !== null && now < hero.voluntaryRestUntil);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const eligible = ALL_QUESTS.filter(q => q.minLevel <= hero.level);
  const base = eligible.length > 0 ? eligible[eligible.length - 1] : ALL_QUESTS[0];
  const levelRewardMult = 1 + (hero.level - 1) * 0.08;

  const remaining  = activeQuest ? activeQuest.endsAt - now : 0;
  const canCollect = activeQuest && now >= activeQuest.endsAt;
  const progress   = activeQuest
    ? Math.min(100, ((now - activeQuest.startedAt) / (activeQuest.endsAt - activeQuest.startedAt)) * 100)
    : 0;
  const limitReached = hero.questsCompletedToday >= MAX_DAILY_QUESTS;

  return (
    <div className="card p-3" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ ...PX(8), color: 'var(--gold-main)', textShadow: '0 0 10px var(--gold-glow)' }}>{t.quests.title}</p>
        <p style={{ ...PX(5), color: limitReached ? 'var(--hp-bright)' : 'var(--text-dim)' }}>
          {hero.questsCompletedToday}/{MAX_DAILY_QUESTS} {t.quests.today}
        </p>
      </div>

      {limitReached && !activeQuest && (
        <div style={{ background: 'rgba(16,6,6,0.95)', border: '1px solid rgba(80,20,20,0.5)', padding: 10, textAlign: 'center' }}>
          <p style={{ ...PX(6), color: 'var(--hp-bright)' }}>{t.quests.limitReached}</p>
        </div>
      )}

      {/* Active quest card */}
      {activeQuest && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(24,18,6,0.97), rgba(18,14,4,0.99))',
          border: '1px solid var(--gold-darker)',
          padding: 12,
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.4)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 24 }}>{activeQuest.quest.emoji}</span>
            <div style={{ flex: 1 }}>
              <p style={{ ...ORB, fontSize: 9, color: 'var(--gold-bright)', marginBottom: 3 }}>{activeQuest.quest.name}</p>
              <p style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)' }}>{activeQuest.quest.description}</p>
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
            <p style={{ ...MONO, fontSize: 10, color: canCollect ? '#6aaa30' : 'var(--text-dim)' }}>
              {canCollect ? t.quests.readyToCollect : formatTime(remaining)}
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <span style={{ ...ORB, fontSize: 9, color: 'var(--gold-bright)' }}>+{activeQuest.quest.goldReward}🪙</span>
              <span style={{ ...ORB, fontSize: 9, color: '#4488ff' }}>+{activeQuest.quest.xpReward} XP</span>
            </div>
          </div>

          {canCollect && (
            <button onClick={handleCollect} disabled={collecting} className="btn btn-primary" style={{ width: '100%', fontSize: 7, opacity: collecting ? 0.6 : 1 }}>
              {collecting ? '...' : t.quests.collect}
            </button>
          )}

          {!canCollect && (() => {
            const skipCost = Math.ceil(remaining / (30 * 60 * 1000)) * 5;
            const canSkip  = hero.gems >= skipCost;
            return (
              <button
                onClick={gemSpeedupQuest}
                disabled={!canSkip}
                style={{
                  width: '100%', fontSize: 7, padding: '7px',
                  background: canSkip ? 'rgba(0,229,255,0.1)' : 'rgba(0,0,0,0.3)',
                  border: `1px solid ${canSkip ? 'rgba(0,229,255,0.35)' : 'rgba(255,255,255,0.08)'}`,
                  color: canSkip ? '#00e5ff' : 'var(--text-dim)',
                  cursor: canSkip ? 'pointer' : 'not-allowed',
                  fontFamily: "'Orbitron', monospace", fontWeight: 700,
                  marginTop: 4,
                }}
              >
                {t.gems.speedupQuestBtn(skipCost)}
              </button>
            );
          })()}

          {!canCollect && !confirmAbandon && (
            <button onClick={() => setConfirmAbandon(true)} className="btn btn-secondary" style={{ width: '100%', fontSize: 6, marginTop: 4, opacity: 0.7 }}>
              {t.quests.cancel}
            </button>
          )}
          {!canCollect && confirmAbandon && (
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <button onClick={() => setConfirmAbandon(false)} className="btn btn-secondary" style={{ flex: 1, fontSize: 6 }}>{t.quests.cancelConfirm}</button>
              <button onClick={() => { abandonQuest(); setConfirmAbandon(false); }} className="btn btn-danger" style={{ flex: 1, fontSize: 6 }}>{t.quests.cancel}</button>
            </div>
          )}
        </div>
      )}

      {isResting && !activeQuest && (
        <div style={{ background: 'rgba(8,12,20,0.95)', border: '1px solid rgba(30,50,80,0.5)', padding: 8, textAlign: 'center' }}>
          <p style={{ ...PX(6), color: '#5070a0' }}>{t.quests.resting}</p>
        </div>
      )}

      {!activeQuest && !limitReached && !isResting && (
        <>
          {!base ? (
            <p style={{ ...PX(6), color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
              {t.quests.noQuests}
            </p>
          ) : (
            <>
              {/* Base quest info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
                <span style={{ fontSize: 20 }}>{base.emoji}</span>
                <div>
                  <p style={{ ...ORB, fontSize: 9, color: 'var(--text-bright)', marginBottom: 2 }}>{questDisplayName}</p>
                  <p style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)' }}>{base.description}</p>
                </div>
              </div>

              {/* 3 variant cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {VARIANTS_BASE.map(v => {
                  const duration = scaledQuestDuration(base.durationMs, hero.level);
                  const xp   = Math.round(base.xpReward * v.xpMult * levelRewardMult);
                  const gold = Math.round(base.goldReward * v.goldMult * levelRewardMult);
                  return (
                    <div key={v.key} style={{
                      background: v.bg,
                      border: `1px solid ${v.border}`,
                      padding: '10px 12px',
                      boxShadow: `0 0 16px ${v.glow}`,
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                      <span style={{ fontSize: 20, flexShrink: 0 }}>{v.badge}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ ...ORB, fontSize: 8, color: v.color, marginBottom: 4 }}>{t.quests[v.labelKey]}</p>
                        <p style={{ ...MONO, fontSize: 9, color: 'var(--text-dim)', marginBottom: 5 }}>{t.quests[v.descKey]}</p>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <span style={{ ...ORB, fontSize: 8, color: '#4488ff' }}>+{xp} XP</span>
                          <span style={{ ...ORB, fontSize: 8, color: '#c8a020' }}>+{gold}🪙</span>
                          <span style={{ ...MONO, fontSize: 9, color: 'var(--text-dim)' }}>⏱ {formatTime(duration)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleStartQuest({ ...base, id: `${base.id}_${v.key}`, xpReward: xp, goldReward: gold, name: questDisplayName } as Quest)}
                        className="btn btn-primary"
                        style={{ fontSize: 6, padding: '7px 10px', flexShrink: 0, borderColor: v.border }}
                      >
                        {t.quests.start}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
