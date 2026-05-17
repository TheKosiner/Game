import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { MAX_DAILY_DUNGEONS, MAX_DAILY_QUESTS } from '../store/gameStore';
import { getHeroAttack, getHeroDefense, getEquipmentStats, getHeroMagicResistance } from '../utils/combat';
import { portraitSrc } from '../data/portraits';
import AppearanceEditor from './AppearanceEditor';
import { useT } from '../hooks/useT';

const MONO = { fontFamily: "'Share Tech Mono', monospace" } as const;
const ORB  = { fontFamily: "'Orbitron', monospace", fontWeight: 700 } as const;

function StatBox({ icon, value, label, color }: {
  icon: string; value: number | string; label: string; color: string; glow?: string;
}) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(0,0,0,0.6), rgba(0,0,0,0.3))',
      border: `1px solid ${color}44`,
      padding: '6px 4px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      flex: 1,
      boxShadow: `inset 0 0 8px rgba(0,0,0,0.4)`,
    }}>
      <span style={{ fontSize: 10, marginBottom: 2 }}>{icon}</span>
      <span style={{ ...ORB, fontSize: 14, color, textShadow: `0 0 10px ${color}` }}>{value}</span>
      <span style={{ ...MONO, fontSize: 9, color: `${color}99`, marginTop: 1 }}>{label}</span>
    </div>
  );
}

function NeonBar({ pct, color, height = 10 }: { pct: number; color: string; glow?: string; height?: number }) {
  return (
    <div style={{
      height, background: 'rgba(0,0,0,0.5)',
      border: `1px solid ${color}22`, overflow: 'hidden', position: 'relative',
    }}>
      <div style={{
        width: `${Math.min(100, pct)}%`, height: '100%',
        background: `linear-gradient(90deg, rgba(0,0,0,0.2), ${color})`,
        boxShadow: `0 0 8px ${color}`,
        transition: 'width 0.6s ease',
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'rgba(255,255,255,0.2)' }} />
      </div>
    </div>
  );
}

function RestTimer({ endsAt, restHp, startAt, cancelRest, gemSpeedupRest, gems }: {
  endsAt: number; restHp: number; startAt: number;
  cancelRest: () => void;
  gemSpeedupRest: () => boolean;
  gems: number;
}) {
  const t = useT();
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
  const totalDuration = Math.max(1, endsAt - startAt);
  const elapsed = totalDuration - remaining;
  const earnedNow = Math.floor(restHp * Math.min(elapsed, totalDuration) / totalDuration);
  const progressPct = Math.min(100, (elapsed / totalDuration) * 100);
  const skipCost = Math.ceil(remaining / (15 * 60 * 1000)) * 5;
  const canSkip = gems >= skipCost && remaining > 0;

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(0,245,255,0.04), rgba(0,0,0,0.8))',
      border: '1px solid rgba(0,245,255,0.25)',
      padding: '10px 12px',
      boxShadow: '0 0 16px rgba(0,245,255,0.08)',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 20, filter: 'drop-shadow(0 0 6px #ff6600)' }}>🔥</span>
        <div style={{ flex: 1 }}>
          <p style={{ ...ORB, fontSize: 9, color: '#00f5ff', textShadow: '0 0 10px #00f5ff', marginBottom: 3 }}>
            {t.hero.restingActive(`${mins}:${secs.toString().padStart(2, '0')}`)}
          </p>
          <p style={{ ...MONO, fontSize: 11, color: '#00ff88' }}>
            {t.hero.restingRecover(earnedNow, restHp)}
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
          <button onClick={cancelRest} className="btn btn-secondary" style={{ fontSize: 8, padding: '4px 8px' }}>
            {t.hero.restStop}
          </button>
          <button
            onClick={gemSpeedupRest}
            disabled={!canSkip}
            style={{
              ...MONO, fontSize: 8, padding: '4px 8px',
              background: canSkip ? 'rgba(0,229,255,0.12)' : 'rgba(0,0,0,0.3)',
              border: `1px solid ${canSkip ? 'rgba(0,229,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
              color: canSkip ? '#00e5ff' : 'var(--text-dim)',
              cursor: canSkip ? 'pointer' : 'not-allowed',
            }}
          >
            {t.gems.speedupRestBtn(skipCost)}
          </button>
        </div>
      </div>
      <NeonBar pct={progressPct} color="#00f5ff" height={6} />
    </div>
  );
}

function RestSlider({ hero, onRest, inCombat, blocked, blockedReason }: {
  hero: { hp: number; maxHp: number };
  onRest: (minutes: number) => void;
  inCombat: boolean;
  blocked?: boolean;
  blockedReason?: string;
}) {
  const t = useT();
  const hpPerMin   = Math.max(1, Math.round(hero.maxHp * 0.04));
  const missing    = hero.maxHp - hero.hp;
  const maxMinutes = Math.ceil(missing / hpPerMin);
  const [minutes, setMinutes] = useState(Math.min(10, maxMinutes));

  if (blocked && blockedReason) return (
    <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,245,255,0.1)', padding: '8px 12px', textAlign: 'center' }}>
      <p style={{ ...MONO, fontSize: 11, color: 'var(--text-dim)' }}>{t.hero.restBlocked(blockedReason)}</p>
    </div>
  );

  if (missing <= 0) return (
    <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,245,255,0.1)', padding: '8px 12px', textAlign: 'center' }}>
      <p style={{ ...MONO, fontSize: 11, color: 'var(--text-dim)' }}>{t.hero.restFull}</p>
    </div>
  );

  const clamped    = Math.min(Math.max(1, minutes), maxMinutes);
  const healPreview = Math.min(clamped * hpPerMin, missing);

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(0,245,255,0.03), rgba(0,0,0,0.7))',
      border: '1px solid rgba(0,245,255,0.15)',
      padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ ...ORB, fontSize: 8, color: 'var(--text-dim)' }}>{t.hero.restTitle}</p>
        <p style={{ ...ORB, fontSize: 9, color: '#00ff88', textShadow: '0 0 8px #00ff88' }}>{t.hero.restPreview(healPreview, clamped)}</p>
      </div>
      <input type="range" min={1} max={maxMinutes} value={clamped}
        onChange={e => setMinutes(Number(e.target.value))} disabled={inCombat} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)' }}>{t.hero.restRate(hpPerMin)}</span>
        <span style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)' }}>{t.hero.restMax(maxMinutes)}</span>
      </div>
      <button onClick={() => onRest(clamped)} disabled={inCombat} className="btn btn-secondary" style={{ width: '100%', fontSize: 8, padding: '8px' }}>
        {t.hero.restStart}
      </button>
    </div>
  );
}

function BeggingTimer({ endsAt, reward, startAt, cancelBegging }: {
  endsAt: number; reward: number; startAt: number; cancelBegging: () => void;
}) {
  const t = useT();
  const [remaining, setRemaining] = useState(Math.max(0, endsAt - Date.now()));
  useEffect(() => {
    const id = setInterval(() => {
      const r = Math.max(0, endsAt - Date.now());
      setRemaining(r);
      if (r === 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  const timeStr = h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`;
  const totalDuration = Math.max(1, endsAt - startAt);
  const elapsed = totalDuration - remaining;
  const earnedNow = Math.floor(reward * Math.min(elapsed, totalDuration) / totalDuration);
  const progressPct = Math.min(100, (elapsed / totalDuration) * 100);

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(157,78,221,0.04), rgba(0,0,0,0.8))',
      border: '1px solid rgba(157,78,221,0.3)',
      padding: '10px 12px',
      boxShadow: '0 0 16px rgba(157,78,221,0.08)',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 20 }}>🙏</span>
        <div style={{ flex: 1 }}>
          <p style={{ ...ORB, fontSize: 9, color: '#9d4edd', textShadow: '0 0 10px #9d4edd', marginBottom: 3 }}>
            {t.hero.beggingActive(timeStr)}
          </p>
          <p style={{ ...MONO, fontSize: 11, color: '#ffd700' }}>{t.hero.beggingProgress(earnedNow, reward)}</p>
        </div>
        <button onClick={cancelBegging} className="btn btn-secondary" style={{ fontSize: 8, padding: '4px 8px', flexShrink: 0 }}>
          {t.hero.restStop}
        </button>
      </div>
      <NeonBar pct={progressPct} color="#9d4edd" height={6} />
    </div>
  );
}

function BeggingCollect({ reward, onCollect }: { reward: number; onCollect: () => void }) {
  const t = useT();
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(255,215,0,0.06), rgba(0,0,0,0.8))',
      border: '1px solid rgba(255,215,0,0.3)',
      padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8,
      boxShadow: '0 0 16px rgba(255,215,0,0.1)',
    }}>
      <p style={{ ...ORB, fontSize: 9, color: '#ffd700', textShadow: '0 0 10px #ffd700' }}>
        {t.hero.beggingDoneMsg(reward)}
      </p>
      <button onClick={onCollect} className="btn btn-primary" style={{ width: '100%', fontSize: 8, padding: '8px' }}>
        {t.hero.beggingPickup}
      </button>
    </div>
  );
}

function BeggingSlider({ onBeg, inCombat, blocked, blockedReason }: {
  onBeg: (hours: number) => void;
  inCombat: boolean;
  blocked?: boolean;
  blockedReason?: string;
}) {
  const t = useT();
  const [hours, setHours] = useState(2);
  if (blocked && blockedReason) return (
    <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(157,78,221,0.15)', padding: '8px 12px', textAlign: 'center' }}>
      <p style={{ ...MONO, fontSize: 11, color: 'var(--text-dim)' }}>{t.hero.beggingActive(blockedReason)}</p>
    </div>
  );
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(157,78,221,0.03), rgba(0,0,0,0.7))',
      border: '1px solid rgba(157,78,221,0.15)',
      padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ ...ORB, fontSize: 8, color: 'var(--text-dim)' }}>{t.hero.beggingTitle}</p>
        <p style={{ ...ORB, fontSize: 9, color: '#9d4edd', textShadow: '0 0 8px #9d4edd' }}>{t.hero.beggingHours(hours)}</p>
      </div>
      <input type="range" min={1} max={10} value={hours}
        onChange={e => setHours(Number(e.target.value))} disabled={inCombat} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)' }}>{t.hero.beggingMin}</span>
        <span style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)' }}>{t.hero.beggingMax}</span>
      </div>
      <button onClick={() => onBeg(hours)} disabled={inCombat} className="btn btn-secondary" style={{
        width: '100%', fontSize: 8, padding: '8px',
        borderColor: 'rgba(157,78,221,0.4)', color: '#9d4edd', textShadow: '0 0 6px #9d4edd',
      }}>
        {t.hero.beggingStartBtn}
      </button>
    </div>
  );
}

export default function HeroCard() {
  const t              = useT();
  const hero           = useGameStore(s => s.hero);
  const upgradeAttribute = useGameStore(s => s.upgradeAttribute);
  const restHero       = useGameStore(s => s.restHero);
  const cancelRest     = useGameStore(s => s.cancelRest);
  const gemHeal        = useGameStore(s => s.gemHeal);
  const gemSpeedupRest = useGameStore(s => s.gemSpeedupRest);
  const startBegging   = useGameStore(s => s.startBegging);
  const cancelBegging  = useGameStore(s => s.cancelBegging);
  const collectBegging = useGameStore(s => s.collectBegging);
  const inCombat       = useGameStore(s => s.inCombat);
  const activeQuest    = useGameStore(s => s.activeQuest);
  const currentDungeon = useGameStore(s => s.currentDungeon);
  const [, forceUpdate] = useState(0);
  const [editingAppearance, setEditingAppearance] = useState(false);

  useEffect(() => {
    const id = setInterval(() => forceUpdate(n => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const isResting   = hero.voluntaryRestUntil !== null && Date.now() < hero.voluntaryRestUntil;
  const earnedRestHp = isResting && hero.voluntaryRestStartAt && hero.voluntaryRestHp && hero.voluntaryRestUntil
    ? Math.floor(hero.voluntaryRestHp * Math.min(Date.now() - hero.voluntaryRestStartAt, hero.voluntaryRestUntil - hero.voluntaryRestStartAt) / Math.max(1, hero.voluntaryRestUntil - hero.voluntaryRestStartAt))
    : 0;
  const isBegging   = hero.beggingUntil !== null && Date.now() < hero.beggingUntil;
  const beggingDone = hero.beggingUntil !== null && Date.now() >= hero.beggingUntil;
  const hasQuest    = activeQuest !== null;
  const inDungeon   = currentDungeon !== null || inCombat;

  const restBlockReason    = isBegging ? 'postać zbiera złom' : hasQuest ? 'postać wykonuje zadanie' : inDungeon ? 'postać jest w lochu' : undefined;
  const beggingBlockReason = isResting ? 'postać odpoczywa' : hasQuest ? 'postać wykonuje zadanie' : inDungeon ? 'postać jest w lochu' : undefined;

  const displayHp  = hero.hp + earnedRestHp;
  const hpPct      = (displayHp / hero.maxHp) * 100;
  const attack     = getHeroAttack(hero);
  const defense    = getHeroDefense(hero);
  const magicRes   = getHeroMagicResistance(hero);
  const eqStats    = getEquipmentStats(hero.equipment);
  const isMagicWpn = !!hero.equipment.weapon?.magicDamage;
  const dungeonPct = (hero.dungeonRunsToday / MAX_DAILY_DUNGEONS) * 100;
  const questPct   = (hero.questsCompletedToday / MAX_DAILY_QUESTS) * 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

      {/* HERO PANEL */}
      <div className="card p-3" style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>

        {/* Portrait */}
        <div style={{ width: 112, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{
            width: 112, height: 112, overflow: 'hidden', flexShrink: 0,
            border: '2px solid rgba(255,45,120,0.4)',
            boxShadow: '0 0 20px rgba(255,45,120,0.15), inset 0 0 12px rgba(0,0,0,0.5)',
          }}>
            <img
              src={portraitSrc(hero.portrait)}
              alt="portret"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
          <button onClick={() => setEditingAppearance(true)} style={{
            background: 'rgba(255,45,120,0.06)', border: '1px solid rgba(255,45,120,0.2)',
            color: 'rgba(255,45,120,0.7)', cursor: 'pointer', width: '100%',
            padding: '5px 0', ...MONO, fontSize: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}>
            {t.hero.appearance}
          </button>
        </div>

        {/* Stats column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
          <div>
            <p style={{ ...ORB, fontSize: 14, color: '#ffffff', textShadow: '0 0 12px rgba(255,255,255,0.25)', marginBottom: 2, wordBreak: 'break-all' }}>
              {hero.name}
            </p>
            <p style={{ ...MONO, fontSize: 11, color: 'var(--text-dim)' }}>{t.app.level(hero.level)}</p>
          </div>

          <div style={{ display: 'flex', gap: 4 }}>
            <StatBox icon={isMagicWpn ? '🔮' : '⚔'} value={attack}    label={isMagicWpn ? t.hero.magic : t.hero.attack} color={isMagicWpn ? '#9d4edd' : '#ff2d78'} />
            <StatBox icon="🛡" value={defense}   label={t.hero.defense}  color="#00f5ff" />
            <StatBox icon="♥" value={hero.maxHp} label={t.hero.maxHp} color="#ff4444" />
            <StatBox icon="✨" value={magicRes}  label={t.hero.magRes} color="#9d4edd" />
          </div>

          <div style={{
            background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.2)',
            padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
            boxShadow: '0 0 10px rgba(255,215,0,0.08)',
          }}>
            <span style={{ fontSize: 13 }}>🪙</span>
            <span style={{ ...ORB, fontSize: 11, color: '#ffd700', textShadow: '0 0 10px rgba(255,215,0,0.6)' }}>{hero.gold}</span>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
              <span style={{ ...MONO, fontSize: 10, color: '#ff4444' }}>{t.hero.vitality}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)' }}>{displayHp}/{hero.maxHp}</span>
                {hero.hp < hero.maxHp && (
                  <button
                    onClick={gemHeal}
                    disabled={hero.gems < 30}
                    style={{
                      ...MONO, fontSize: 8, padding: '1px 5px',
                      background: hero.gems >= 30 ? 'rgba(0,229,255,0.12)' : 'rgba(0,0,0,0.3)',
                      border: `1px solid ${hero.gems >= 30 ? 'rgba(0,229,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
                      color: hero.gems >= 30 ? '#00e5ff' : 'var(--text-dim)',
                      cursor: hero.gems >= 30 ? 'pointer' : 'not-allowed',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {t.gems.healBtn(30)}
                  </button>
                )}
              </div>
            </div>
            <NeonBar pct={hpPct} color="#ff2d78" />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ ...MONO, fontSize: 10, color: '#ffd700' }}>{t.hero.experience}</span>
              <span style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)' }}>{hero.xp}/{hero.xpToNext}</span>
            </div>
            <NeonBar pct={(hero.xp / hero.xpToNext) * 100} color="#ffd700" />
          </div>
        </div>
      </div>

      {editingAppearance && <AppearanceEditor onClose={() => setEditingAppearance(false)} />}

      {/* REST */}
      {isResting
        ? <RestTimer endsAt={hero.voluntaryRestUntil!} restHp={hero.voluntaryRestHp ?? 0} startAt={hero.voluntaryRestStartAt ?? hero.voluntaryRestUntil!} cancelRest={cancelRest} gemSpeedupRest={gemSpeedupRest} gems={hero.gems} />
        : <RestSlider hero={hero} onRest={restHero} inCombat={inCombat} blocked={!!restBlockReason} blockedReason={restBlockReason} />
      }

      {/* BEGGING */}
      {isBegging
        ? <BeggingTimer endsAt={hero.beggingUntil!} reward={hero.beggingReward ?? 0} startAt={hero.beggingStartAt ?? hero.beggingUntil!} cancelBegging={cancelBegging} />
        : beggingDone
          ? <BeggingCollect reward={hero.beggingReward ?? 0} onCollect={collectBegging} />
          : <BeggingSlider onBeg={startBegging} inCombat={inCombat} blocked={!!beggingBlockReason} blockedReason={beggingBlockReason} />
      }

      {/* DZIENNY LIMIT */}
      <div className="card p-3" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p style={{ ...ORB, fontSize: 9, color: '#ff2d78', textShadow: '0 0 8px rgba(255,45,120,0.5)', marginBottom: 2 }}>{t.hero.dailyLimit}</p>
        {[
          { label: t.hero.dungeons, cur: hero.dungeonRunsToday,     max: MAX_DAILY_DUNGEONS, pct: dungeonPct, color: hero.dungeonRunsToday >= MAX_DAILY_DUNGEONS ? '#ff4444' : '#ff2d78' },
          { label: t.hero.quests,   cur: hero.questsCompletedToday, max: MAX_DAILY_QUESTS,   pct: questPct,   color: hero.questsCompletedToday >= MAX_DAILY_QUESTS ? '#ff4444' : '#00f5ff' },
        ].map(({ label, cur, max, pct, color }) => (
          <div key={label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ ...MONO, fontSize: 11, color: 'var(--text-main)' }}>{label}</span>
              <span style={{ ...ORB, fontSize: 9, color, textShadow: `0 0 6px ${color}` }}>{cur}/{max}</span>
            </div>
            <NeonBar pct={pct} color={color} height={8} />
          </div>
        ))}
      </div>

      {/* STATYSTYKI */}
      <div className="card p-3" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p style={{ ...ORB, fontSize: 9, color: '#9d4edd', textShadow: '0 0 8px rgba(157,78,221,0.5)', marginBottom: 2 }}>{t.hero.statsTitle}</p>
        {([
          { attr: 'strength',       icon: '💪', name: t.hero.statStrength,   desc: t.hero.statStrDesc,    note: t.hero.statStrNote,    color: '#ff2d78' },
          { attr: 'dexterity',      icon: '🏃', name: t.hero.statDexterity,  desc: t.hero.statDexDesc,    note: t.hero.statDexNote,    color: '#00f5ff' },
          { attr: 'intelligence',   icon: '🎯', name: t.hero.statAccuracy,   desc: t.hero.statAccDesc,    note: t.hero.statAccNote,    color: '#9d4edd' },
          { attr: 'vitality',       icon: '♥',  name: t.hero.statVitality,   desc: t.hero.statVitDesc,    note: t.hero.statVitNote,    color: '#ff4444' },
          { attr: 'magic',          icon: '🔮', name: t.hero.statMagic,      desc: t.hero.statMagDesc,    note: t.hero.statMagNote,    color: '#cc44ff' },
          { attr: 'magicResistance',icon: '✨', name: t.hero.statMagRes,     desc: t.hero.statMagResDesc, note: t.hero.statMagResNote, color: '#00ff88' },
        ] as { attr: 'strength'|'dexterity'|'intelligence'|'vitality'|'magic'|'magicResistance'; icon: string; name: string; desc: string; note: string; color: string }[]).map(({ attr, icon, name, desc, note, color }) => {
          const base = hero.stats[attr];
          const eq   = eqStats[attr];
          const cost = Math.round(base * 75);
          const canAfford = hero.gold >= cost;
          return (
            <div key={attr} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 12 }}>{icon}</span>
                  <span style={{ ...MONO, fontSize: 11, color }}>{name}</span>
                </div>
                <p style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', marginTop: 1 }}>{desc}</p>
                <p style={{ ...MONO, fontSize: 9, color, opacity: 0.6, marginTop: 1 }}>{note}</p>
              </div>
              <span style={{ ...ORB, fontSize: 13, color, textShadow: `0 0 8px ${color}`, minWidth: 28, textAlign: 'right' }}>{base + eq}</span>
              {eq > 0 && <span style={{ ...MONO, fontSize: 10, color: '#00ff88', minWidth: 26 }}>+{eq}♦</span>}
              <button
                onClick={() => upgradeAttribute(attr)}
                disabled={!canAfford}
                className="btn btn-primary"
                style={{ fontSize: 7, padding: '4px 6px', opacity: canAfford ? 1 : 0.3, minWidth: 52 }}
              >
                🪙{cost}
              </button>
            </div>
          );
        })}
        <p style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>{t.hero.eqBonus}</p>
      </div>

    </div>
  );
}
