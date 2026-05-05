import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { MAX_DAILY_DUNGEONS, MAX_DAILY_QUESTS } from '../store/gameStore';
import { getHeroAttack, getHeroDefense } from '../utils/combat';
import PixelSprite from './PixelSprite';
import { SPRITE_PORTRAIT, getHeroPalette } from '../data/sprites';
import AppearanceEditor from './AppearanceEditor';
const PX = (s: number) => ({ fontFamily: "'Press Start 2P', monospace", fontSize: s } as const);

function RestTimer({ endsAt, restHp }: { endsAt: number; restHp: number }) {
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
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(8,16,6,0.97), rgba(6,12,4,0.99))',
      border: '1px solid rgba(50,80,30,0.5)',
      padding: '10px 12px',
      display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.4)',
    }}>
      <div className="df-flicker" style={{ fontSize: 22, lineHeight: 1 }}>🔥</div>
      <div>
        <p style={{ ...PX(7), color: 'var(--gold-bright)', textShadow: '0 0 10px var(--gold-glow)', marginBottom: 4 }}>
          ✦ ODPOCZYWASZ — {mins}:{secs.toString().padStart(2, '0')}
        </p>
        <p style={{ ...PX(5), color: '#5a8840' }}>Odzyskasz +{restHp} HP</p>
      </div>
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
  const hpPerMin = Math.max(1, Math.round(hero.maxHp * 0.02));
  const missing = hero.maxHp - hero.hp;
  const maxMinutes = Math.ceil(missing / hpPerMin);
  const [minutes, setMinutes] = useState(Math.min(10, maxMinutes));
  if (blocked && blockedReason) return (
    <div style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-dark)', padding: '8px 12px', textAlign: 'center' }}>
      <p style={{ ...PX(5), color: 'var(--text-muted)' }}>🏕 Odpoczynek — {blockedReason}</p>
    </div>
  );
  if (missing <= 0) return (
    <div style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-dark)', padding: '8px 12px', textAlign: 'center' }}>
      <p style={{ ...PX(5), color: 'var(--text-muted)' }}>HP PEŁNE — odpoczynek zbędny</p>
    </div>
  );
  const clamped = Math.min(Math.max(1, minutes), maxMinutes);
  const healPreview = Math.min(clamped * hpPerMin, missing);
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(8,16,6,0.97), rgba(6,12,4,0.99))',
      border: '1px solid rgba(45,65,25,0.5)',
      padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ ...PX(5), color: 'var(--text-dim)' }}>🏕 ODPOCZYNEK</p>
        <p style={{ ...PX(6), color: '#6aaa40' }}>+{healPreview} HP / {clamped} min</p>
      </div>
      <input type="range" min={1} max={maxMinutes} value={clamped}
        onChange={e => setMinutes(Number(e.target.value))} disabled={inCombat} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ ...PX(4), color: 'var(--text-muted)' }}>1 min = 2% HP (~{hpPerMin} HP)</span>
        <span style={{ ...PX(4), color: 'var(--text-muted)' }}>max {maxMinutes} min</span>
      </div>
      <button onClick={() => onRest(clamped)} disabled={inCombat} className="btn btn-primary" style={{ width: '100%', fontSize: 6, padding: '8px' }}>
        ▶ Rozpocznij odpoczynek
      </button>
    </div>
  );
}

function BeggingTimer({ endsAt, reward }: { endsAt: number; reward: number }) {
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
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(6,10,18,0.97), rgba(4,8,14,0.99))',
      border: '1px solid rgba(30,50,80,0.5)',
      padding: '10px 12px',
      display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.4)',
    }}>
      <div style={{ fontSize: 22 }}>🙏</div>
      <div>
        <p style={{ ...PX(7), color: '#5070a0', marginBottom: 4 }}>✦ ŻEBRANIE — {timeStr}</p>
        <p style={{ ...PX(5), color: 'var(--gold-bright)' }}>Zarobisz +{reward}🪙</p>
      </div>
    </div>
  );
}

function BeggingCollect({ reward, onCollect }: { reward: number; onCollect: () => void }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(28,20,4,0.97), rgba(20,15,3,0.99))',
      border: '1px solid var(--gold-darker)',
      padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <p style={{ ...PX(6), color: 'var(--gold-bright)', textShadow: '0 0 8px var(--gold-glow)' }}>
        🙏 Żebranie zakończone! +{reward}🪙
      </p>
      <button onClick={onCollect} className="btn btn-primary" style={{ width: '100%', fontSize: 6, padding: '8px' }}>
        🪙 Odbierz jałmużnę
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
  const [hours, setHours] = useState(2);
  if (blocked && blockedReason) return (
    <div style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-dark)', padding: '8px 12px', textAlign: 'center' }}>
      <p style={{ ...PX(5), color: 'var(--text-muted)' }}>🙏 Żebranie — {blockedReason}</p>
    </div>
  );
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(6,10,18,0.97), rgba(4,8,14,0.99))',
      border: '1px solid rgba(25,40,65,0.5)',
      padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ ...PX(5), color: 'var(--text-dim)' }}>🙏 ŻEBRANIE</p>
        <p style={{ ...PX(6), color: '#5070a0' }}>{hours}h</p>
      </div>
      <input type="range" min={1} max={10} value={hours}
        onChange={e => setHours(Number(e.target.value))} disabled={inCombat} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ ...PX(4), color: 'var(--text-muted)' }}>1h min</span>
        <span style={{ ...PX(4), color: 'var(--text-muted)' }}>10h max</span>
      </div>
      <button onClick={() => onBeg(hours)} disabled={inCombat} className="btn btn-secondary" style={{ width: '100%', fontSize: 6, padding: '8px' }}>
        ▶ Zacznij żebrać
      </button>
    </div>
  );
}

export default function HeroCard() {
  const hero = useGameStore(s => s.hero);
  const upgradeAttribute = useGameStore(s => s.upgradeAttribute);
  const respecStats = useGameStore(s => s.respecStats);
  const restHero = useGameStore(s => s.restHero);
  const startBegging = useGameStore(s => s.startBegging);
  const collectBegging = useGameStore(s => s.collectBegging);
  const inCombat = useGameStore(s => s.inCombat);
  const activeQuest = useGameStore(s => s.activeQuest);
  const [, forceUpdate] = useState(0);
  const [editingAppearance, setEditingAppearance] = useState(false);

  useEffect(() => {
    const id = setInterval(() => forceUpdate(n => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const isResting = hero.voluntaryRestUntil !== null && Date.now() < hero.voluntaryRestUntil;
  const isBegging = hero.beggingUntil !== null && Date.now() < hero.beggingUntil;
  const beggingDone = hero.beggingUntil !== null && Date.now() >= hero.beggingUntil;
  const hasQuest = activeQuest !== null;

  const restBlockReason = isBegging ? 'postać żebrze' : hasQuest ? 'postać wykonuje zadanie' : undefined;
  const beggingBlockReason = isResting ? 'postać odpoczywa' : hasQuest ? 'postać wykonuje zadanie' : undefined;
  const hpPct  = (hero.hp / hero.maxHp) * 100;
  const attack  = getHeroAttack(hero);
  const defense = getHeroDefense(hero);
  const sprite  = SPRITE_PORTRAIT;
  const palette = getHeroPalette(hero.skinTone ?? 1, hero.hairColor ?? 2);
  const dungeonPct = (hero.dungeonRunsToday / MAX_DAILY_DUNGEONS) * 100;
  const questPct   = (hero.questsCompletedToday / MAX_DAILY_QUESTS) * 100;

  return (
    <div className="card p-3" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* ── PORTRAIT + INFO ── */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>

        {/* Portrait scene + appearance button */}
        <div style={{ width: 108, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div className="df-portrait-bg" style={{
            flex: 1, minHeight: 152,
            border: '1px solid var(--border-main)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div className="df-fire-glow" />
            <div className="df-portrait-vignette" />
            <div style={{ position: 'relative', zIndex: 2, filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.95))' }}>
              <PixelSprite grid={sprite} scale={4} paletteOverrides={palette} />
            </div>
          </div>
          <button
            onClick={() => setEditingAppearance(true)}
            style={{
              background: 'var(--bg-inset)', border: '1px solid var(--border-dark)',
              color: 'var(--text-muted)', cursor: 'pointer', width: '100%',
              padding: '5px 0', ...PX(4),
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            }}
          >
            <span>🎨</span>
            <span>ZMIEŃ WYGLĄD</span>
          </button>
        </div>

        {/* Info column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7, justifyContent: 'center' }}>
          <div>
            <p style={{ ...PX(11), color: 'var(--gold-bright)', textShadow: '0 0 14px var(--gold-glow)', marginBottom: 4, wordBreak: 'break-all' }}>
              {hero.name}
            </p>
            <p style={{ ...PX(5), color: 'var(--text-dim)' }}>POZ. {hero.level}</p>
          </div>

          {/* ATK / DEF / HP boxes */}
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { icon: '⚔', val: attack,    col: '#c05050', label: 'ATAK' },
              { icon: '🛡', val: defense,   col: '#5070c0', label: 'OBRON' },
              { icon: '♥', val: hero.maxHp, col: '#c04040', label: 'MAX HP' },
            ].map(({ icon, val, col, label }) => (
              <div key={label} style={{
                background: 'var(--bg-inset)', border: '1px solid var(--border-dark)',
                padding: '5px 4px', display: 'flex', flexDirection: 'column',
                alignItems: 'center', flex: 1,
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
              }}>
                <span style={{ fontSize: 9 }}>{icon}</span>
                <span style={{ ...PX(8), color: col, marginTop: 2 }}>{val}</span>
                <span style={{ ...PX(4), color: 'var(--text-muted)', marginTop: 1 }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Gold */}
          <div style={{
            background: 'rgba(50,36,14,0.4)', border: '1px solid var(--gold-darker)',
            padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
          }}>
            <span style={{ fontSize: 12 }}>🪙</span>
            <span style={{ ...PX(9), color: 'var(--gold-bright)', textShadow: '0 0 8px var(--gold-glow)' }}>{hero.gold}</span>
          </div>
        </div>
      </div>

      {editingAppearance && <AppearanceEditor onClose={() => setEditingAppearance(false)} />}

      {/* ── HP / XP BARS ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ ...PX(5), color: '#904040' }}>♥ ŻYWOTNOŚĆ</span>
            <span style={{ ...PX(5), color: 'var(--text-dim)' }}>{hero.hp} / {hero.maxHp}</span>
          </div>
          <div className="pixel-bar">
            <div className="pixel-bar-fill hp-fill" style={{ width: `${hpPct}%` }} />
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ ...PX(5), color: '#906830' }}>✦ DOŚWIADCZENIE</span>
            <span style={{ ...PX(5), color: 'var(--text-dim)' }}>{hero.xp} / {hero.xpToNext}</span>
          </div>
          <div className="pixel-bar">
            <div className="pixel-bar-fill xp-fill" style={{ width: `${(hero.xp / hero.xpToNext) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* ── REST ── */}
      {isResting
        ? <RestTimer endsAt={hero.voluntaryRestUntil!} restHp={hero.voluntaryRestHp ?? 0} />
        : <RestSlider hero={hero} onRest={restHero} inCombat={inCombat} blocked={!!restBlockReason} blockedReason={restBlockReason} />
      }

      {/* ── ŻEBRANIE ── */}
      {isBegging
        ? <BeggingTimer endsAt={hero.beggingUntil!} reward={hero.beggingReward ?? 0} />
        : beggingDone
          ? <BeggingCollect reward={hero.beggingReward ?? 0} onCollect={collectBegging} />
          : <BeggingSlider onBeg={startBegging} inCombat={inCombat} blocked={!!beggingBlockReason} blockedReason={beggingBlockReason} />
      }

      {/* ── DZIENNY LIMIT + STATYSTYKI ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>

        <div className="df-section">
          <p style={{ ...PX(5), color: 'var(--text-dim)', marginBottom: 8 }}>DZIENNY LIMIT</p>
          {[
            { label: 'Lochy',   cur: hero.dungeonRunsToday,    max: MAX_DAILY_DUNGEONS, pct: dungeonPct, col: hero.dungeonRunsToday >= MAX_DAILY_DUNGEONS ? 'var(--hp-color)' : '#7060b8' },
            { label: 'Zadania', cur: hero.questsCompletedToday, max: MAX_DAILY_QUESTS,   pct: questPct,   col: hero.questsCompletedToday >= MAX_DAILY_QUESTS ? 'var(--hp-color)' : '#306880' },
          ].map(({ label, cur, max, pct, col }) => (
            <div key={label} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ ...PX(5), color: 'var(--text-dim)' }}>{label}</span>
                <span style={{ ...PX(5), color: cur >= max ? 'var(--hp-bright)' : 'var(--text-dim)' }}>{cur}/{max}</span>
              </div>
              <div className="pixel-bar">
                <div className="pixel-bar-fill" style={{ width: `${pct}%`, background: col }} />
              </div>
            </div>
          ))}
        </div>

        <div className="df-section">
          <p style={{ ...PX(5), color: 'var(--text-dim)', marginBottom: 8 }}>STATYSTYKI</p>
          {[
            { icon: '💪', name: 'Siła',       val: hero.stats.strength },
            { icon: '🏃', name: 'Zręczność', val: hero.stats.dexterity },
            { icon: '🧠', name: 'Wiedza',     val: hero.stats.intelligence },
            { icon: '♥',  name: 'Żywotność', val: hero.stats.vitality },
          ].map(({ icon, name, val }) => (
            <div key={name} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ ...PX(5), color: 'var(--text-dim)' }}>{icon} {name}</span>
              <span style={{ ...PX(6), color: 'var(--gold-bright)' }}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── ATTRIBUTE POINTS ── */}
      {hero.attributePoints > 0 && (
        <div className="df-glow-pulse" style={{
          background: 'linear-gradient(135deg, rgba(40,28,8,0.97), rgba(28,20,6,0.99))',
          border: '1px solid var(--gold-dim)', padding: 12,
        }}>
          <p style={{ ...PX(7), color: 'var(--gold-bright)', textShadow: '0 0 10px var(--gold-glow)', marginBottom: 10 }}>
            ✨ {hero.attributePoints} PKT CECH!
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {(['strength', 'dexterity', 'intelligence', 'vitality'] as const).map(attr => (
              <button key={attr} onClick={() => upgradeAttribute(attr)} className="btn btn-primary" style={{ fontSize: 5, padding: '7px 4px' }}>
                + {({ strength: 'Siła', dexterity: 'Zręczność', intelligence: 'Wiedza', vitality: 'Żywotność' }[attr])}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── RESPEC ── */}
      {(() => {
        const now = Date.now();
        const DAY = 24 * 60 * 60 * 1000;
        const canRespec = hero.lastRespecAt === null || now - hero.lastRespecAt >= DAY;
        const nextRespecIn = !canRespec && hero.lastRespecAt ? DAY - (now - hero.lastRespecAt) : 0;
        const hh = Math.floor(nextRespecIn / 3600000);
        const mm = Math.floor((nextRespecIn % 3600000) / 60000);
        return (
          <div style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-dark)', padding: 10 }}>
            <p style={{ ...PX(5), color: 'var(--text-dim)', marginBottom: 6 }}>🔄 RESET STATYSTYK</p>
            {canRespec ? (
              <button onClick={() => { if (confirm('Zresetować wszystkie statystyki? Dostępne raz na 24h.')) respecStats(); }} className="btn btn-secondary" style={{ width: '100%', fontSize: 5, padding: '7px' }}>
                Resetuj statystyki (raz na 24h)
              </button>
            ) : (
              <p style={{ ...PX(4), color: 'var(--text-muted)', textAlign: 'center' }}>Dostępny za {hh}h {mm}m</p>
            )}
          </div>
        );
      })()}
    </div>
  );
}
