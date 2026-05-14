import { useEffect, useState } from 'react';
import { TERRITORY_LIST, type TerritoryDef } from '../data/territories';
import {
  getTerritories, captureTerritory, claimTerritoryReward,
  initOrJoinSiege, commitSiegeDamage,
  abandonTerritory, recordGuildSiegeAttempt,
  type TerritoryState, type Guild,
} from '../lib/cloudSync';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import { getHeroAttack, getHeroDefense } from '../utils/combat';

const PX = (s: number) => ({ fontFamily: "'Press Start 2P', monospace", fontSize: s } as const);
const MONO = { fontFamily: "'Share Tech Mono', monospace" } as const;
const DAY_MS = 24 * 60 * 60 * 1000;

// ── Map constants ─────────────────────────────────────────────────────────────

const MAP_POS: Record<string, { x: number; y: number }> = {
  misty_forest:  { x: 28, y: 76 },
  ruined_keep:   { x: 60, y: 62 },
  dark_mountain: { x: 78, y: 36 },
  cursed_tomb:   { x: 14, y: 44 },
  dragon_peak:   { x: 50, y: 14 },
};
const MAP_EDGES: [string, string][] = [
  ['misty_forest', 'ruined_keep'],
  ['misty_forest', 'cursed_tomb'],
  ['ruined_keep', 'dark_mountain'],
  ['ruined_keep', 'dragon_peak'],
  ['cursed_tomb', 'dragon_peak'],
];
const BUILDINGS = [
  { x: 3,  y: 3,  w: 13, h: 8  },
  { x: 63, y: 3,  w: 16, h: 9  },
  { x: 85, y: 18, w: 10, h: 6  },
  { x: 7,  y: 25, w: 4,  h: 14 },
  { x: 86, y: 56, w: 9,  h: 13 },
  { x: 66, y: 76, w: 14, h: 9  },
  { x: 3,  y: 80, w: 10, h: 14 },
  { x: 34, y: 30, w: 9,  h: 5  },
  { x: 37, y: 83, w: 17, h: 8  },
];

// ── City Map SVG ──────────────────────────────────────────────────────────────

function CityMap({
  territories, guild, heroLevel, focused, onFocus,
}: {
  territories: Record<string, TerritoryState>;
  guild: Guild | null;
  heroLevel: number;
  focused: string | null;
  onFocus: (id: string) => void;
}) {
  return (
    <div style={{
      background: '#020210',
      border: '1px solid rgba(255,45,120,0.2)',
      boxShadow: '0 0 20px rgba(255,45,120,0.05), inset 0 0 40px rgba(0,0,0,0.5)',
      position: 'relative',
    }}>
      {/* Map title */}
      <div style={{ padding: '6px 10px', borderBottom: '1px solid rgba(255,45,120,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ ...MONO, fontSize: 9, color: 'var(--pink)', textShadow: '0 0 8px rgba(255,45,120,0.5)', letterSpacing: '0.1em' }}>
          ◈ NEON-WARSZAWA 2087
        </span>
        <span style={{ ...MONO, fontSize: 8, color: 'var(--text-muted)' }}>MAPA STREF</span>
      </div>

      <svg viewBox="0 0 100 100" style={{ width: '100%', display: 'block' }}
        xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="tgrid" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,45,120,0.07)" strokeWidth="0.3"/>
          </pattern>
          <filter id="tglow-g" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.2" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="tglow-r" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.2" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="tglow-y" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.0" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Background */}
        <rect x="0" y="0" width="100" height="100" fill="#020210"/>
        <rect x="0" y="0" width="100" height="100" fill="url(#tgrid)"/>

        {/* City buildings */}
        {BUILDINGS.map((b, i) => (
          <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h}
            fill="rgba(8,8,22,0.9)" stroke="rgba(255,45,120,0.12)" strokeWidth="0.3"
          />
        ))}

        {/* Connection lines */}
        {MAP_EDGES.map(([a, b]) => {
          const pa = MAP_POS[a]; const pb = MAP_POS[b];
          if (!pa || !pb) return null;
          return (
            <line key={`${a}-${b}`}
              x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
              stroke="rgba(255,45,120,0.2)"
              strokeWidth="0.6"
              strokeDasharray="3 2"
              style={{ animation: 'mapFlow 2s linear infinite' }}
            />
          );
        })}

        {/* Territory nodes */}
        {TERRITORY_LIST.map(def => {
          const state = territories[def.id];
          const pos = MAP_POS[def.id];
          if (!pos) return null;

          const ownedByMe  = guild && state?.guildId === guild.id;
          const ownedByEnemy = !!state?.guildId && state.guildId !== guild?.id;
          const locked = heroLevel < def.minLevel;
          const isFocused = focused === def.id;

          const color = ownedByMe
            ? '#00ff88'
            : ownedByEnemy
            ? '#ff4444'
            : locked
            ? '#333355'
            : '#ffd700';

          const filterId = ownedByMe ? 'tglow-g' : ownedByEnemy ? 'tglow-r' : 'tglow-y';

          return (
            <g key={def.id} onClick={() => onFocus(def.id)} style={{ cursor: 'pointer' }}>
              {/* Outer pulse ring */}
              {!locked && (
                <circle cx={pos.x} cy={pos.y} r={5} fill="none" stroke={color} strokeWidth="0.5" opacity={0}
                  style={{ animation: 'mapPulse 2.4s ease-out infinite' }}
                />
              )}
              {/* Focus ring */}
              {isFocused && (
                <circle cx={pos.x} cy={pos.y} r={7.5} fill="none" stroke={color} strokeWidth="0.8" opacity={0.7}/>
              )}
              {/* Main node */}
              <circle
                cx={pos.x} cy={pos.y} r={isFocused ? 4.5 : 3.5}
                fill={color}
                opacity={locked ? 0.25 : 1}
                filter={!locked ? `url(#${filterId})` : undefined}
              />
              {/* Ownership tag */}
              {ownedByMe && (
                <text x={pos.x} y={pos.y - 7} textAnchor="middle"
                  fill="#00ff88" fontSize="3" opacity={0.9} fontFamily="monospace">
                  [{guild?.tag}]
                </text>
              )}
              {ownedByEnemy && (
                <text x={pos.x} y={pos.y - 7} textAnchor="middle"
                  fill="#ff4444" fontSize="3" opacity={0.9} fontFamily="monospace">
                  [{state.guildTag}]
                </text>
              )}
              {/* Zone name */}
              <text x={pos.x} y={pos.y + 8.5} textAnchor="middle"
                fill={color} fontSize="3.2"
                opacity={locked ? 0.3 : 0.9}
                fontFamily="monospace">
                {def.name}
              </text>
              {/* Level lock */}
              {locked && (
                <text x={pos.x} y={pos.y + 13} textAnchor="middle"
                  fill="#555577" fontSize="2.8" fontFamily="monospace">
                  [POZ.{def.minLevel}]
                </text>
              )}
            </g>
          );
        })}

        {/* Bottom credit */}
        <text x="50" y="99" textAnchor="middle"
          fill="rgba(255,45,120,0.2)" fontSize="2.5" fontFamily="monospace">
          CyberMagic · MAPA STREF KONTROLI
        </text>
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, padding: '6px 10px', borderTop: '1px solid rgba(255,45,120,0.1)', flexWrap: 'wrap' }}>
        {([
          { color: '#00ff88', label: 'Twoja strefa' },
          { color: '#ff4444', label: 'Strefa wroga' },
          { color: '#ffd700', label: 'Wolna'        },
          { color: '#333355', label: 'Zablokowana'  },
        ] as const).map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, boxShadow: `0 0 5px ${color}` }} />
            <span style={{ ...MONO, fontSize: 8, color: 'var(--text-dim)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Combat types ──────────────────────────────────────────────────────────────

interface SiegeCombatState {
  territory: TerritoryDef;
  heroHp: number;
  heroMaxHp: number;
  heroAtk: number;
  heroDef: number;
  enemyHp: number;
  enemyStartHp: number;
  enemyMaxHp: number;
  enemyAtk: number;
  enemyDef: number;
  enemyName: string;
  enemyEmoji: string;
  log: string[];
  done: boolean;
  won: boolean;
  damageDealt: number;
}

// ── HP Bar ────────────────────────────────────────────────────────────────────

function HpBar({ current, max, color }: { current: number; max: number; color: string }) {
  const pct = Math.max(0, Math.min(1, current / max));
  return (
    <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-dark)', height: 8, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, width: `${pct * 100}%`, background: color, transition: 'width 0.2s ease' }} />
    </div>
  );
}

function siegeDmg(atk: number, def: number, critChance = 0.08): number {
  const base = atk * atk / (atk + Math.max(1, def));
  const isCrit = Math.random() < critChance;
  const variance = 0.7 + Math.random() * 0.6;
  return Math.max(1, Math.round(base * variance * (isCrit ? 2 : 1)));
}

// ── Siege Combat ──────────────────────────────────────────────────────────────

function SiegeCombat({
  state, onAttack, onAutoFight, onRetreat,
}: {
  state: SiegeCombatState;
  onAttack: () => void;
  onAutoFight: () => void;
  onRetreat: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ ...PX(7), color: 'var(--gold-main)', textShadow: '0 0 10px var(--gold-glow)' }}>
        ⚔ OBLĘŻENIE — {state.territory.emoji} {state.territory.name.toUpperCase()}
      </p>

      {/* Siege overall progress */}
      <div style={{ background: 'var(--bg-inset)', border: '1px solid rgba(100,60,180,0.4)', padding: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <p style={{ ...PX(4), color: '#a080e0' }}>⚡ Oblężenie (łącznie)</p>
          <p style={{ ...PX(4), color: 'var(--text-muted)' }}>{state.enemyHp}/{state.enemyMaxHp} HP</p>
        </div>
        <HpBar current={state.enemyHp} max={state.enemyMaxHp} color="#7040c0" />
        <p style={{ ...PX(4), color: 'var(--text-muted)', marginTop: 4 }}>⚔ Zadałeś już: {state.damageDealt} obrażeń (sesja)</p>
      </div>

      {/* Enemy */}
      <div style={{ background: 'var(--bg-inset)', border: '1px solid rgba(180,40,40,0.4)', padding: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <p style={{ ...PX(6), color: '#e06060' }}>{state.enemyEmoji} {state.enemyName}</p>
          <p style={{ ...PX(5), color: 'var(--text-muted)' }}>{state.enemyHp}/{state.enemyStartHp} HP</p>
        </div>
        <HpBar current={state.enemyHp} max={state.enemyStartHp} color="#c03030" />
      </div>

      {/* Hero */}
      <div style={{ background: 'var(--bg-inset)', border: '1px solid rgba(40,130,40,0.4)', padding: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <p style={{ ...PX(6), color: '#60c060' }}>🛡 TY</p>
          <p style={{ ...PX(5), color: 'var(--text-muted)' }}>{state.heroHp}/{state.heroMaxHp} HP</p>
        </div>
        <HpBar current={state.heroHp} max={state.heroMaxHp} color="#30a030" />
      </div>

      {/* Result banner */}
      {state.done && (
        <div style={{
          background: state.won ? 'rgba(20,60,20,0.9)' : 'rgba(60,10,10,0.9)',
          border: `1px solid ${state.won ? '#40a040' : '#a03030'}`,
          padding: 12, textAlign: 'center',
        }}>
          <p style={{ ...PX(9), color: state.won ? '#60e060' : '#e06060', marginBottom: 6 }}>
            {state.won ? '⚡ STREFA PRZEJĘTA!' : '💀 ODWRÓT'}
          </p>
          <p style={{ ...PX(5), color: 'var(--text-dim)' }}>
            {state.won
              ? 'Strefa kontrolowana przez waszą gildię!'
              : `Zadałeś ${state.damageDealt} obrażeń. Wróć z resztą gildii!`}
          </p>
          <button onClick={onRetreat} className="btn btn-primary" style={{ marginTop: 10, fontSize: 6, padding: '8px 16px' }}>
            Powrót do mapy
          </button>
        </div>
      )}

      {/* Buttons */}
      {!state.done && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onAttack} className="btn btn-danger" style={{ flex: 1, fontSize: 7, padding: '10px' }}>
            ⚔ ATAKUJ
          </button>
          <button onClick={onAutoFight} className="btn btn-secondary" style={{ flex: 1, fontSize: 7, padding: '10px' }}>
            ⚡ Szybka walka
          </button>
          <button onClick={onRetreat} className="btn btn-secondary" style={{ fontSize: 6, padding: '10px 14px' }}>
            Odwrót
          </button>
        </div>
      )}

      {/* Log */}
      <div style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-dark)', padding: 8, maxHeight: 120, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {state.log.slice().reverse().map((line, i) => (
          <p key={i} style={{ ...PX(4), color: 'var(--text-dim)', lineHeight: 1.6 }}>{line}</p>
        ))}
      </div>
    </div>
  );
}

// ── Territory Panel ───────────────────────────────────────────────────────────

export default function TerritoryPanel({ guild, onBack, onRefresh }: { guild: Guild | null; onBack: () => void; onRefresh?: () => void }) {
  const hero    = useGameStore(s => s.hero);
  const addGold = useGameStore(s => s.addGold);
  const addXp   = useGameStore(s => s.addXp);
  const myUid   = useAuthStore(s => s.user?.uid);

  const [territories, setTerritories] = useState<Record<string, TerritoryState>>({});
  const [loading,     setLoading]     = useState(true);
  const [combat,      setCombat]      = useState<SiegeCombatState | null>(null);
  const [claimingId,  setClaimingId]  = useState<string | null>(null);
  const [committing,  setCommitting]  = useState(false);
  const [abandoning,  setAbandoning]  = useState<string | null>(null);
  const [focused,     setFocused]     = useState<string | null>(null);
  const [, forceUpdate] = useState(0);

  async function reloadTerritories() {
    const t = await getTerritories();
    setTerritories(t);
  }

  useEffect(() => {
    reloadTerritories().then(() => setLoading(false));
    const id = setInterval(() => forceUpdate(n => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const formatCountdown = (ms: number) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${m}m`;
  };

  const myOwnedCount = guild
    ? Object.values(territories).filter(t => t.guildId === guild.id).length
    : 0;

  async function handleAttack(def: TerritoryDef, state: TerritoryState | undefined) {
    if (!guild) return;

    if (myOwnedCount >= 1 && state?.guildId !== guild.id) {
      alert('Twoja gildia może posiadać tylko jedną strefę na raz. Najpierw ją stracisz lub zostanie odbita.');
      return;
    }

    const isMyActiveSiege = state?.siegeGuildId === guild.id && (state?.siegeCurrentHp ?? 0) > 0;

    if (!isMyActiveSiege) {
      const lastSiege = (guild as any).lastSiegeAt ?? 0;
      if (Date.now() - lastSiege < DAY_MS) {
        const remaining = (lastSiege + DAY_MS) - Date.now();
        alert(`Dzienna próba oblężenia zużyta. Następna za ${formatCountdown(remaining)}.`);
        return;
      }
    }

    const result = await initOrJoinSiege(def.id, guild.id, guild.tag, def.siegeHp);
    if ('blocked' in result) {
      alert(`Inne oblężenie trwa: [${result.byTag}]. Poczekaj aż wygaśnie (2h bez aktywności).`);
      return;
    }

    if (!isMyActiveSiege && 'currentHp' in result) {
      await recordGuildSiegeAttempt(guild.id);
      onRefresh?.();
    }

    let enemyAtk  = def.siegeAtk;
    let enemyDef  = def.siegeDef;
    let enemyName = def.guardianName;
    let enemyEmoji = def.guardianEmoji;

    if (state?.guildId && state.guildId !== guild.id) {
      const mult = Math.min(2.5, 1 + Math.sqrt(state.defenderMemberCount || 1) * (state.defenderAvgLevel || 1) / 30);
      enemyAtk  = Math.round(def.siegeAtk * mult);
      enemyDef  = Math.round(def.siegeDef * mult);
      enemyName = `[${state.guildTag}] ${state.guildName}`;
      enemyEmoji = '🏢';
    }

    const heroHp    = hero.maxHp;
    const currentHp = result.currentHp;

    setCombat({
      territory: def,
      heroHp, heroMaxHp: heroHp,
      heroAtk: getHeroAttack(hero), heroDef: getHeroDefense(hero),
      enemyHp: currentHp, enemyStartHp: currentHp, enemyMaxHp: def.siegeHp,
      enemyAtk, enemyDef,
      enemyName, enemyEmoji,
      log: [`Dołączyłeś do oblężenia ${def.name}! HP wroga: ${currentHp}/${def.siegeHp}`],
      done: false, won: false, damageDealt: 0,
    });
  }

  function handleCombatAttack() {
    setCombat(prev => {
      if (!prev || prev.done) return prev;
      let { heroHp, heroAtk, heroDef, enemyHp, enemyAtk, enemyDef, damageDealt } = prev;
      const log = [...prev.log];

      const heroDmg = siegeDmg(heroAtk, enemyDef);
      enemyHp = Math.max(0, enemyHp - heroDmg);
      damageDealt += heroDmg;
      log.push(`Zadajesz ${heroDmg} obrażeń. (Razem: ${damageDealt})`);

      if (enemyHp <= 0) {
        log.push('Strefa przejęta!');
        return { ...prev, heroHp, enemyHp: 0, damageDealt, log, done: true, won: true };
      }

      const enemyDmg = siegeDmg(enemyAtk, heroDef);
      heroHp = Math.max(0, heroHp - enemyDmg);
      log.push(`Wróg zadaje ci ${enemyDmg} obrażeń.`);

      if (heroHp <= 0) {
        log.push(`Padłeś! Zadałeś ${damageDealt} obrażeń w tej sesji.`);
        return { ...prev, heroHp: 0, enemyHp, damageDealt, log, done: true, won: false };
      }

      return { ...prev, heroHp, enemyHp, damageDealt, log };
    });
  }

  function handleAutoFight() {
    setCombat(prev => {
      if (!prev || prev.done) return prev;
      let { heroHp, heroAtk, heroDef, enemyHp, enemyAtk, enemyDef, damageDealt } = prev;
      const log = [...prev.log, '⚡ Szybka walka...'];

      for (let i = 0; i < 500; i++) {
        const heroDmg = siegeDmg(heroAtk, enemyDef);
        enemyHp = Math.max(0, enemyHp - heroDmg);
        damageDealt += heroDmg;
        if (enemyHp <= 0) {
          log.push('Strefa przejęta!');
          return { ...prev, heroHp, enemyHp: 0, damageDealt, log, done: true, won: true };
        }
        const enemyDmg = siegeDmg(enemyAtk, heroDef);
        heroHp = Math.max(0, heroHp - enemyDmg);
        if (heroHp <= 0) {
          log.push(`Padłeś! Zadałeś ${damageDealt} obrażeń w tej sesji.`);
          return { ...prev, heroHp: 0, enemyHp, damageDealt, log, done: true, won: false };
        }
      }

      log.push(`Walka wstrzymana po 500 rundach. Zadałeś ${damageDealt} obrażeń.`);
      return { ...prev, heroHp, enemyHp, damageDealt, log };
    });
  }

  async function handleRetreat() {
    if (!combat || !guild) { setCombat(null); return; }
    setCommitting(true);
    try {
      const newHp = await commitSiegeDamage(combat.territory.id, guild.id, combat.damageDealt);
      if (newHp <= 0 || combat.won) {
        const members  = Object.values(guild.members);
        const avgLevel = members.length > 0
          ? Math.round(members.reduce((s, m) => s + m.level, 0) / members.length)
          : hero.level;
        await captureTerritory(combat.territory.id, guild.id, guild.name, guild.tag, members.length, avgLevel);
      }
      await reloadTerritories();
    } finally {
      setCommitting(false);
      setCombat(null);
    }
  }

  async function handleClaim(def: TerritoryDef) {
    if (!guild) return;
    setClaimingId(def.id);
    try {
      const result = await claimTerritoryReward(def.id, guild.id);
      if (result !== null) {
        addGold(def.dailyGold);
        addXp(def.dailyXp);
        await reloadTerritories();
      }
    } finally { setClaimingId(null); }
  }

  async function handleAbandon(territoryId: string) {
    if (!guild) return;
    if (!confirm('Czy na pewno chcesz porzucić tę strefę? Gildia nie będzie mogła oblężyć żadnej przez 24h.')) return;
    setAbandoning(territoryId);
    try {
      await abandonTerritory(territoryId, guild.id);
      await reloadTerritories();
      onRefresh?.();
    } finally { setAbandoning(null); }
  }

  if (committing) {
    return (
      <div style={{ textAlign: 'center', padding: 30 }}>
        <p style={{ ...PX(6), color: 'var(--gold-main)' }}>⏳ Zapisywanie obrażeń...</p>
      </div>
    );
  }

  if (combat) {
    return <SiegeCombat state={combat} onAttack={handleCombatAttack} onAutoFight={handleAutoFight} onRetreat={handleRetreat} />;
  }

  // Sorted: focused first, then rest
  const sortedTerritories = focused
    ? [
        ...TERRITORY_LIST.filter(d => d.id === focused),
        ...TERRITORY_LIST.filter(d => d.id !== focused),
      ]
    : TERRITORY_LIST;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer' }}>←</button>
        <p style={{ ...PX(7), color: 'var(--pink)', textShadow: '0 0 10px rgba(255,45,120,0.5)' }}>⚡ STREFY KONTROLI</p>
      </div>

      {/* City map */}
      <CityMap
        territories={territories}
        guild={guild}
        heroLevel={hero.level}
        focused={focused}
        onFocus={id => setFocused(prev => prev === id ? null : id)}
      />

      {focused && (
        <p style={{ ...MONO, fontSize: 9, color: 'var(--text-muted)', textAlign: 'center' }}>
          Kliknij węzeł ponownie aby odznaczyć • wybrana: <span style={{ color: 'var(--cyan)' }}>{TERRITORY_LIST.find(d => d.id === focused)?.name}</span>
        </p>
      )}

      {/* Alerts */}
      {guild && myOwnedCount >= 1 && (
        <div style={{ background: 'rgba(10,30,10,0.7)', border: '1px solid rgba(40,120,40,0.4)', padding: 8 }}>
          <p style={{ ...PX(4), color: '#60c060' }}>
            ✦ Twoja gildia kontroluje strefę. Limit: 1 — musi zostać najpierw odbita.
          </p>
        </div>
      )}

      {loading && (
        <p style={{ ...PX(5), color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>⏳ Ładowanie...</p>
      )}

      {guild && (guild as any).lastSiegeAt && Date.now() - (guild as any).lastSiegeAt < DAY_MS && (
        <div style={{ background: 'rgba(40,20,8,0.8)', border: '1px solid var(--gold-darker)', padding: 8 }}>
          <p style={{ ...PX(4), color: 'var(--gold-main)' }}>
            ⚔ Dzienna próba oblężenia zużyta — następna za {formatCountdown((guild as any).lastSiegeAt + DAY_MS - Date.now())}
          </p>
        </div>
      )}

      {/* Territory cards */}
      {!loading && sortedTerritories.map(def => {
        const state        = territories[def.id];
        const ownedByMyGuild = state?.guildId === guild?.id;
        const ownedByEnemy   = !!state?.guildId && !ownedByMyGuild;
        const unowned        = !state?.guildId;
        const locked         = hero.level < def.minLevel;
        const isFocused      = focused === def.id;

        const mySiegeActive    = state?.siegeGuildId === guild?.id && (state?.siegeCurrentHp ?? 0) > 0;
        const enemySiegeActive = state?.siegeGuildId && state.siegeGuildId !== guild?.id && (state?.siegeCurrentHp ?? 0) > 0;

        const now = Date.now();
        const canClaim = ownedByMyGuild && guild &&
          (state.lastRewardAt === null || now - (state.lastRewardAt ?? 0) >= DAY_MS);
        const nextClaimIn = ownedByMyGuild && !canClaim && state?.lastRewardAt
          ? DAY_MS - (now - state.lastRewardAt)
          : null;

        const siegeLimitReached = !!guild?.lastSiegeAt && Date.now() - (guild as any).lastSiegeAt < DAY_MS;
        const canAttack = !locked && !ownedByMyGuild && !!guild && myOwnedCount < 1 && (!siegeLimitReached || mySiegeActive);

        const borderColor = isFocused
          ? 'rgba(0,245,255,0.6)'
          : ownedByMyGuild
          ? 'rgba(40,160,40,0.5)'
          : ownedByEnemy
          ? 'rgba(160,40,40,0.5)'
          : 'var(--border-dark)';

        return (
          <div key={def.id} style={{
            background: ownedByMyGuild
              ? 'linear-gradient(135deg, rgba(20,40,12,0.95), rgba(14,28,8,0.98))'
              : ownedByEnemy
              ? 'linear-gradient(135deg, rgba(40,12,12,0.95), rgba(28,8,8,0.98))'
              : 'var(--bg-inset)',
            border: `1px solid ${borderColor}`,
            boxShadow: isFocused ? '0 0 14px rgba(0,245,255,0.15)' : 'none',
            padding: 12,
            opacity: locked ? 0.5 : 1,
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: 16 }}>{def.emoji}</span>
                  <p style={{ ...PX(7), color: ownedByMyGuild ? '#60c060' : ownedByEnemy ? '#e06060' : 'var(--text-bright)' }}>
                    {def.name}
                  </p>
                </div>
                <p style={{ ...PX(4), color: 'var(--text-muted)', marginBottom: 4 }}>{def.description}</p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ ...PX(4), color: 'var(--text-muted)', marginBottom: 2 }}>Nagroda/dzień</p>
                <p style={{ ...PX(5), color: 'var(--gold-bright)' }}>🪙{def.dailyGold}</p>
                <p style={{ ...PX(4), color: '#80a0ff' }}>✨{def.dailyXp} XP</p>
              </div>
            </div>

            <p style={{ ...PX(4), color: 'var(--text-muted)', marginBottom: 6 }}>
              Min. POZ.{def.minLevel} · {def.guardianEmoji} {def.guardianName} · wymaga ~3 graczy
            </p>

            {/* Siege progress */}
            {(mySiegeActive || enemySiegeActive) && state.siegeMaxHp && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <p style={{ ...PX(4), color: mySiegeActive ? '#a080e0' : '#e09040' }}>
                    {mySiegeActive ? '⚔ Wasze oblężenie' : `⚔ Oblężenie [${state.siegeGuildTag}]`}
                  </p>
                  <p style={{ ...PX(4), color: 'var(--text-muted)' }}>
                    {state.siegeCurrentHp}/{state.siegeMaxHp} HP
                  </p>
                </div>
                <HpBar current={state.siegeCurrentHp ?? 0} max={state.siegeMaxHp} color={mySiegeActive ? '#7040c0' : '#c07020'} />
              </div>
            )}

            {/* Ownership */}
            {unowned        && <p style={{ ...PX(4), color: 'var(--text-muted)', marginBottom: 6 }}>Strefa niekontrolowana</p>}
            {ownedByMyGuild && (
              <div style={{ marginBottom: 6 }}>
                <p style={{ ...PX(5), color: '#60c060', marginBottom: 3 }}>⚡ Wasza gildia [{guild?.tag}]</p>
                {(() => {
                  const ttl = state?.expiresAt ? state.expiresAt - Date.now() : null;
                  return ttl !== null && ttl > 0
                    ? <p style={{ ...PX(4), color: 'var(--text-muted)' }}>⏳ Wygasa za {formatCountdown(ttl)}</p>
                    : null;
                })()}
              </div>
            )}
            {ownedByEnemy   && <p style={{ ...PX(5), color: '#e06060', marginBottom: 6 }}>⚡ [{state.guildTag}] {state.guildName}</p>}

            {/* Actions */}
            {locked && <p style={{ ...PX(4), color: 'var(--text-muted)' }}>🔒 Wymagany poziom {def.minLevel}</p>}

            {!locked && !ownedByMyGuild && !guild && (
              <p style={{ ...PX(4), color: 'var(--text-muted)' }}>Dołącz do gildii, by przejmować strefy</p>
            )}

            {!locked && !ownedByMyGuild && guild && myOwnedCount >= 1 && (
              <p style={{ ...PX(4), color: 'var(--text-muted)' }}>🔒 Twoja gildia już kontroluje strefę</p>
            )}

            {canAttack && (
              <button
                onClick={() => handleAttack(def, state)}
                className={mySiegeActive ? 'btn btn-primary' : 'btn btn-danger'}
                style={{ width: '100%', fontSize: 5, padding: '7px' }}
              >
                {mySiegeActive
                  ? `⚔ Kontynuuj oblężenie (${state.siegeCurrentHp} HP zostało)`
                  : unowned
                  ? `⚔ Przejmij strefę (vs ${def.guardianEmoji} — ~3 graczy)`
                  : `⚔ Oblęż (vs [${state.guildTag}] — ~3 graczy)`}
              </button>
            )}

            {ownedByMyGuild && canClaim && (
              <button
                onClick={() => handleClaim(def)}
                disabled={claimingId === def.id}
                className="btn btn-primary"
                style={{ width: '100%', fontSize: 5, padding: '7px', marginTop: 4 }}
              >
                {claimingId === def.id ? '⏳ Odbieram...' : `🪙 Odbierz podatek (+${def.dailyGold}🪙, +${def.dailyXp}XP)`}
              </button>
            )}

            {ownedByMyGuild && !canClaim && nextClaimIn !== null && (
              <p style={{ ...PX(4), color: 'var(--text-muted)', marginTop: 4 }}>
                ⏳ Następny podatek za {formatCountdown(nextClaimIn)}
              </p>
            )}

            {ownedByMyGuild && myUid === guild?.leaderUid && (
              <button
                onClick={() => handleAbandon(def.id)}
                disabled={abandoning === def.id}
                className="btn btn-secondary"
                style={{ width: '100%', fontSize: 5, padding: '7px', marginTop: 4 }}
              >
                🏳 Porzuć strefę
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
