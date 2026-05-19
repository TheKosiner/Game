import { useEffect, useState } from 'react';
import { TERRITORY_LIST, type TerritoryDef } from '../data/territories';
import {
  getTerritories, captureTerritory, claimTerritoryReward,
  initOrJoinSiege, commitSiegeDamage,
  abandonTerritory, getPlayersStats,
  type TerritoryState, type Guild,
} from '../lib/cloudSync';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import { useLangStore } from '../store/langStore';
import { getHeroAttack, getHeroDefense } from '../utils/combat';
import { portraitSrc, resolvePortrait } from '../data/portraits';

import { PX, MONO } from '../utils/styles';
const DAY_MS = 24 * 60 * 60 * 1000;
const SIEGE_DURATION_MS = 5 * 60 * 60 * 1000; // 5h siege window

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
  territories, guild, heroLevel, focused, onFocus, isEn,
}: {
  territories: Record<string, TerritoryState>;
  guild: Guild | null;
  heroLevel: number;
  focused: string | null;
  onFocus: (id: string) => void;
  isEn: boolean;
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
        <span style={{ ...MONO, fontSize: 10, color: 'var(--pink)', textShadow: '0 0 8px rgba(255,45,120,0.5)', letterSpacing: '0.1em' }}>
          ◈ NEON-WARSZAWA 2087
        </span>
        <span style={{ ...MONO, fontSize: 10, color: 'var(--text-muted)' }}>{isEn ? 'ZONE MAP' : 'MAPA STREF'}</span>
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
            <g
              key={def.id}
              onClick={() => onFocus(def.id)}
              role="button"
              tabIndex={0}
              aria-label={`${isEn ? (def.nameEn ?? def.name) : def.name}${ownedByMe ? ' (your guild)' : ownedByEnemy ? ` (${state.guildTag})` : locked ? ' (locked)' : ''}`}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onFocus(def.id); } }}
              style={{ cursor: locked ? 'default' : 'pointer', outline: 'none' }}
            >
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
          GlitchSoul · MAPA STREF KONTROLI
        </text>
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, padding: '6px 10px', borderTop: '1px solid rgba(255,45,120,0.1)', flexWrap: 'wrap' }}>
        {([
          { color: '#00ff88', label: isEn ? 'Your zone'  : 'Twoja strefa' },
          { color: '#ff4444', label: isEn ? 'Enemy zone' : 'Strefa wroga' },
          { color: '#ffd700', label: isEn ? 'Free'       : 'Wolna'        },
          { color: '#333355', label: isEn ? 'Locked'     : 'Zablokowana'  },
        ]).map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, boxShadow: `0 0 5px ${color}` }} />
            <span style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Combat types ──────────────────────────────────────────────────────────────

interface Defender {
  name: string;
  username: string;
  level: number;
  portrait: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
}

interface SiegeCombatState {
  territory: TerritoryDef;
  heroHp: number;
  heroMaxHp: number;
  heroAtk: number;
  heroDef: number;
  // Current enemy (either guardian or current defender from queue)
  enemyHp: number;
  enemyStartHp: number;
  enemyMaxHp: number;  // total siege HP for the progress bar
  enemyAtk: number;
  enemyDef: number;
  enemyName: string;
  enemyEmoji: string;
  // Defender queue (for owned territories)
  defenders: Defender[];
  defenderIdx: number;  // -1 = fighting guardian (not owned), >=0 = index in defenders
  log: string[];
  done: boolean;
  won: boolean;
  damageDealt: number;
  siegeStartedAt: number;
  siegeAttackers: string[];
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
  state, onAttack, onAutoFight, onRetreat, isEn,
}: {
  state: SiegeCombatState;
  onAttack: () => void;
  onAutoFight: () => void;
  onRetreat: () => void;
  isEn: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ ...PX(7), color: 'var(--gold-main)', textShadow: '0 0 10px var(--gold-glow)' }}>
        ⚔ {isEn ? 'SIEGE' : 'OBLĘŻENIE'} — {state.territory.emoji} {(isEn ? (state.territory as typeof state.territory & { nameEn?: string }).nameEn ?? state.territory.name : state.territory.name).toUpperCase()}
      </p>

      {/* Siege overall progress */}
      <div style={{ background: 'var(--bg-inset)', border: '1px solid rgba(100,60,180,0.4)', padding: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <p style={{ ...PX(4), color: '#a080e0' }}>⚡ {isEn ? 'Siege (total)' : 'Oblężenie (łącznie)'}</p>
          <p style={{ ...PX(4), color: 'var(--text-muted)' }}>{state.enemyHp}/{state.enemyMaxHp} HP</p>
        </div>
        <HpBar current={state.enemyHp} max={state.enemyMaxHp} color="#7040c0" />
        <p style={{ ...PX(4), color: 'var(--text-muted)', marginTop: 4 }}>⚔ {isEn ? `Dealt so far: ${state.damageDealt} dmg (session)` : `Zadałeś już: ${state.damageDealt} obrażeń (sesja)`}</p>
      </div>

      {/* Enemy */}
      <div style={{ background: 'var(--bg-inset)', border: '1px solid rgba(180,40,40,0.4)', padding: 10 }}>
        {/* Portrait row for guild defenders */}
        {state.defenderIdx >= 0 && (() => {
          const cur = state.defenders[state.defenderIdx];
          return (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
              <div style={{
                width: 72, height: 72, flexShrink: 0, overflow: 'hidden',
                border: '2px solid rgba(220,60,60,0.7)',
                boxShadow: '0 0 16px rgba(220,60,60,0.35)',
              }}>
                <img
                  src={portraitSrc(cur.portrait)}
                  alt={cur.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p style={{ ...PX(7), color: '#e06060' }}>{cur.name}</p>
                <p style={{ ...MONO, fontSize: 10, color: 'var(--text-muted)' }}>@{cur.username}</p>
                <p style={{ ...MONO, fontSize: 10, color: 'var(--text-muted)' }}>{isEn ? 'LVL.' : 'POZ.'} {cur.level}</p>
                <p style={{ ...PX(5), color: 'var(--text-muted)' }}>{state.enemyHp}/{state.enemyStartHp} HP</p>
              </div>
            </div>
          );
        })()}

        {/* Guardian (no portrait) */}
        {state.defenderIdx < 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <p style={{ ...PX(6), color: '#e06060' }}>{state.enemyEmoji} {state.enemyName}</p>
            <p style={{ ...PX(5), color: 'var(--text-muted)' }}>{state.enemyHp}/{state.enemyStartHp} HP</p>
          </div>
        )}

        <HpBar current={state.enemyHp} max={state.enemyStartHp} color="#c03030" />

        {/* Remaining defender queue */}
        {state.defenderIdx >= 0 && state.defenders.length > 1 && (
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {state.defenders.map((d, i) => {
              const beaten = i < state.defenderIdx;
              const current = i === state.defenderIdx;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4,
                  padding: '2px 6px',
                  border: `1px solid ${current ? '#e06060' : beaten ? 'rgba(100,100,100,0.3)' : 'rgba(180,80,80,0.4)'}`,
                  background: current ? 'rgba(180,40,40,0.15)' : 'transparent',
                  opacity: beaten ? 0.4 : 1,
                }}>
                  <div style={{ width: 18, height: 18, overflow: 'hidden', border: `1px solid ${current ? '#e06060' : '#555'}`, flexShrink: 0 }}>
                    <img src={portraitSrc(d.portrait)} alt={d.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <span style={{ ...MONO, fontSize: 10, color: current ? '#e06060' : 'rgba(200,120,120,0.8)', textDecoration: beaten ? 'line-through' : 'none' }}>
                    {beaten ? '✓' : current ? '⚔' : '○'} {d.name} {d.level}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Hero */}
      <div style={{ background: 'var(--bg-inset)', border: '1px solid rgba(40,130,40,0.4)', padding: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <p style={{ ...PX(6), color: '#60c060' }}>🛡 {isEn ? 'YOU' : 'TY'}</p>
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
            {state.won ? (isEn ? '⚡ ZONE CAPTURED!' : '⚡ STREFA PRZEJĘTA!') : (isEn ? '💀 RETREAT' : '💀 ODWRÓT')}
          </p>
          <p style={{ ...PX(5), color: 'var(--text-dim)' }}>
            {state.won
              ? (isEn ? 'Zone controlled by your guild!' : 'Strefa kontrolowana przez waszą gildię!')
              : (isEn ? `Dealt ${state.damageDealt} dmg. Return with your guild!` : `Zadałeś ${state.damageDealt} obrażeń. Wróć z resztą gildii!`)}
          </p>
          <button onClick={onRetreat} className="btn btn-primary" style={{ marginTop: 10, fontSize: 10, padding: '8px 16px' }}>
            {isEn ? 'Back to map' : 'Powrót do mapy'}
          </button>
        </div>
      )}

      {/* Buttons */}
      {!state.done && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onAttack} className="btn btn-danger" style={{ flex: 1, fontSize: 10, padding: '10px' }}>
            ⚔ {isEn ? 'ATTACK' : 'ATAKUJ'}
          </button>
          <button onClick={onAutoFight} className="btn btn-secondary" style={{ flex: 1, fontSize: 10, padding: '10px' }}>
            ⚡ {isEn ? 'Quick fight' : 'Szybka walka'}
          </button>
          <button onClick={onRetreat} className="btn btn-secondary" style={{ fontSize: 10, padding: '10px 14px' }}>
            {isEn ? 'Retreat' : 'Odwrót'}
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
  const lang    = useLangStore(s => s.lang);
  const isEn    = lang === 'en';

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
      alert(isEn
        ? 'Your guild can only hold one zone at a time. You must lose it or have it retaken first.'
        : 'Twoja gildia może posiadać tylko jedną strefę na raz. Najpierw ją stracisz lub zostanie odbita.');
      return;
    }

    const now = Date.now();
    if (guild.lastCaptureAt && now - guild.lastCaptureAt < DAY_MS) {
      const left = DAY_MS - (now - guild.lastCaptureAt);
      alert(isEn
        ? `Your guild can capture another zone in ${formatCountdown(left)}. (Limit: 1 capture per day)`
        : `Wasza gildia może przejąć kolejną strefę za ${formatCountdown(left)}. (Limit: 1 przejęcie na dobę)`);
      return;
    }
    if (guild.lastLostAt && now - guild.lastLostAt < DAY_MS) {
      const left = DAY_MS - (now - guild.lastLostAt);
      alert(isEn
        ? `Your guild lost a zone and needs to recover. You can attack in ${formatCountdown(left)}.`
        : `Wasza gildia straciła strefę i musi odpocząć. Można atakować za ${formatCountdown(left)}.`);
      return;
    }

    const isMyActiveSiege = state?.siegeGuildId === guild.id && (state?.siegeCurrentHp ?? 0) > 0;
    const siegeExpired = isMyActiveSiege && state?.siegeStartedAt != null && Date.now() - state.siegeStartedAt >= SIEGE_DURATION_MS;

    if (isMyActiveSiege && !siegeExpired && myUid && (state?.siegeAttackers ?? []).includes(myUid)) {
      alert(isEn
        ? 'You already attacked in this siege. Each player can attack only once per siege.'
        : 'Już zaatakowałeś w tym oblężeniu. Każdy gracz może zaatakować tylko raz podczas oblężenia.');
      return;
    }

    // Build defender queue or guardian
    let defenders: Defender[] = [];
    let defenderIdx = -1;
    let firstEnemyAtk   = def.siegeAtk;
    let firstEnemyDef   = def.siegeDef;
    let firstEnemyName  = def.guardianName;
    let firstEnemyEmoji = def.guardianEmoji;
    let siegeMaxHp      = def.siegeHp;

    if (state?.guildId && state.guildId !== guild.id) {
      // Build defenders from stored member list, sorted weakest first
      const rawMembers: TerritoryState['defenderMembers'] =
        (state.defenderMembers ?? []).length > 0
          ? state.defenderMembers
          : Array.from({ length: Math.max(1, state.defenderMemberCount || 1) }, (_, i) => ({
              name: isEn ? `Defender ${i + 1}` : `Obrońca ${i + 1}`,
              level: state.defenderAvgLevel > 0 ? state.defenderAvgLevel : def.minLevel,
            }));

      // Fetch real stats for defenders who have a stored UID
      const defUids = rawMembers.map(m => m.uid).filter((u): u is string => !!u);
      const realStats = await getPlayersStats(defUids);

      defenders = [...rawMembers]
        .sort((a, b) => a.level - b.level)
        .map(m => {
          const ps = m.uid ? realStats[m.uid] : null;
          const hp = ps?.maxHp ?? (80 + m.level * 8);
          return {
            name: m.name,
            username: m.username ?? m.name,
            level: ps?.level ?? m.level,
            portrait: resolvePortrait(m.portrait, m.username ?? m.name),
            hp,
            maxHp: hp,
            atk: ps?.attack  ?? Math.round((5 + m.level * 2) * 1.2),
            def: ps?.defense ?? Math.round(2 + m.level * 1.2),
          };
        });

      siegeMaxHp = defenders.reduce((s, d) => s + d.maxHp, 0);
      defenderIdx = 0;
      firstEnemyAtk   = defenders[0].atk;
      firstEnemyDef   = defenders[0].def;
      firstEnemyName  = `[${state.guildTag}] ${defenders[0].name} (${isEn ? 'lvl.' : 'poz.'}${defenders[0].level})`;
      firstEnemyEmoji = '⚔';
    }

    const result = await initOrJoinSiege(def.id, guild.id, guild.tag, siegeMaxHp);
    if ('blocked' in result) {
      const remaining = result.endsAt - Date.now();
      alert(isEn
        ? `Another siege is underway: [${result.byTag}]. Ends in ${formatCountdown(Math.max(0, remaining))}.`
        : `Inne oblężenie trwa: [${result.byTag}]. Kończy się za ${formatCountdown(Math.max(0, remaining))}.`);
      return;
    }

    if (myUid && result.attackers.includes(myUid)) {
      alert(isEn
        ? 'You already attacked in this siege. Each player can attack only once per siege.'
        : 'Już zaatakowałeś w tym oblężeniu. Każdy gracz może zaatakować tylko raz podczas oblężenia.');
      return;
    }

    const heroHp    = hero.maxHp;
    const currentHp = Math.min(result.currentHp, siegeMaxHp);

    // Align defenderIdx to remaining HP so rejoining players start on correct defender
    if (defenderIdx >= 0 && defenders.length > 0) {
      const totalHp = siegeMaxHp;
      const hpDealt = totalHp - currentHp;
      let accumulated = 0;
      for (let i = 0; i < defenders.length; i++) {
        if (accumulated + defenders[i].maxHp > hpDealt) {
          defenderIdx = i;
          defenders[i] = { ...defenders[i], hp: defenders[i].maxHp - (hpDealt - accumulated) };
          break;
        }
        accumulated += defenders[i].maxHp;
        if (i === defenders.length - 1) defenderIdx = i;
      }
      firstEnemyAtk   = defenders[defenderIdx].atk;
      firstEnemyDef   = defenders[defenderIdx].def;
      firstEnemyName  = `[${state!.guildTag}] ${defenders[defenderIdx].name} (${isEn ? 'lvl.' : 'poz.'}${defenders[defenderIdx].level})`;
    }

    setCombat({
      territory: def,
      heroHp, heroMaxHp: heroHp,
      heroAtk: getHeroAttack(hero), heroDef: getHeroDefense(hero),
      enemyHp: defenderIdx >= 0 ? defenders[defenderIdx].hp : currentHp,
      enemyStartHp: defenderIdx >= 0 ? defenders[defenderIdx].maxHp : currentHp,
      enemyMaxHp: siegeMaxHp,
      enemyAtk: firstEnemyAtk, enemyDef: firstEnemyDef,
      enemyName: firstEnemyName, enemyEmoji: firstEnemyEmoji,
      defenders, defenderIdx,
      log: defenderIdx >= 0
        ? [isEn
            ? `Siege of ${def.nameEn ?? def.name}! Fighting ${defenders.length} defender(s). First: ${firstEnemyName}`
            : `Oblężenie ${def.name}! Walczysz z ${defenders.length} obrońcami. Pierwszy: ${firstEnemyName}`]
        : [isEn
            ? `Joined siege of ${def.nameEn ?? def.name}! Guardian HP: ${currentHp}`
            : `Dołączyłeś do oblężenia ${def.name}! HP strażnika: ${currentHp}`],
      done: false, won: false, damageDealt: 0,
      siegeStartedAt: result.startedAt,
      siegeAttackers: result.attackers,
    });
  }

  function advanceDefender(prev: SiegeCombatState, heroHp: number, damageDealt: number, log: string[]): SiegeCombatState {
    const nextIdx = prev.defenderIdx + 1;
    if (nextIdx >= prev.defenders.length) {
      log.push(isEn ? 'All defenders defeated! Zone captured!' : 'Wszyscy obrońcy pokonani! Strefa przejęta!');
      return { ...prev, heroHp, enemyHp: 0, damageDealt, log, done: true, won: true };
    }
    const next = prev.defenders[nextIdx];
    log.push(isEn
      ? `▶ Next defender: ${next.name} (lvl.${next.level}) — ${next.hp} HP`
      : `▶ Następny obrońca: ${next.name} (poz.${next.level}) — ${next.hp} HP`);
    return {
      ...prev, heroHp, damageDealt, log,
      defenderIdx: nextIdx,
      enemyHp: next.hp, enemyStartHp: next.maxHp,
      enemyAtk: next.atk, enemyDef: next.def,
      enemyName: `⚔ ${next.name} (${isEn ? 'lvl.' : 'poz.'}${next.level})`,
    };
  }

  function handleCombatAttack() {
    setCombat(prev => {
      if (!prev || prev.done) return prev;
      let { heroHp, heroAtk, heroDef, enemyHp, enemyAtk, enemyDef, damageDealt } = prev;
      const log = [...prev.log];

      const heroDmg = siegeDmg(heroAtk, enemyDef);
      enemyHp = Math.max(0, enemyHp - heroDmg);
      damageDealt += heroDmg;
      log.push(isEn ? `You deal ${heroDmg} damage. (Total: ${damageDealt})` : `Zadajesz ${heroDmg} obrażeń. (Razem: ${damageDealt})`);

      if (enemyHp <= 0) {
        if (prev.defenderIdx < 0) {
          log.push(isEn ? 'Guardian defeated! Zone captured!' : 'Strażnik pokonany! Strefa przejęta!');
          return { ...prev, heroHp, enemyHp: 0, damageDealt, log, done: true, won: true };
        }
        log.push(isEn ? `${prev.defenders[prev.defenderIdx].name} defeated!` : `${prev.defenders[prev.defenderIdx].name} pokonany!`);
        return advanceDefender({ ...prev, enemyHp: 0 }, heroHp, damageDealt, log);
      }

      const enemyDmg = siegeDmg(enemyAtk, heroDef);
      heroHp = Math.max(0, heroHp - enemyDmg);
      log.push(isEn ? `${prev.enemyName} deals ${enemyDmg} damage to you.` : `${prev.enemyName} zadaje ci ${enemyDmg} obrażeń.`);

      if (heroHp <= 0) {
        log.push(isEn ? `You fell! You dealt ${damageDealt} damage this session.` : `Padłeś! Zadałeś ${damageDealt} obrażeń w tej sesji.`);
        return { ...prev, heroHp: 0, enemyHp, damageDealt, log, done: true, won: false };
      }

      return { ...prev, heroHp, enemyHp, damageDealt, log };
    });
  }

  function handleAutoFight() {
    setCombat(prev => {
      if (!prev || prev.done) return prev;
      let state = { ...prev, log: [...prev.log, isEn ? '⚡ Quick fight...' : '⚡ Szybka walka...'] };

      for (let i = 0; i < 1000; i++) {
        let { heroHp, heroAtk, heroDef, enemyHp, enemyAtk, enemyDef, damageDealt } = state;
        const heroDmg = siegeDmg(heroAtk, enemyDef);
        enemyHp = Math.max(0, enemyHp - heroDmg);
        damageDealt += heroDmg;

        if (enemyHp <= 0) {
          if (state.defenderIdx < 0) {
            state.log.push(isEn ? 'Guardian defeated! Zone captured!' : 'Strażnik pokonany! Strefa przejęta!');
            return { ...state, heroHp, enemyHp: 0, damageDealt, done: true, won: true };
          }
          state.log.push(isEn ? `${state.defenders[state.defenderIdx].name} defeated!` : `${state.defenders[state.defenderIdx].name} pokonany!`);
          state = advanceDefender({ ...state, enemyHp: 0 }, heroHp, damageDealt, state.log);
          if (state.done) return state;
          continue;
        }

        const enemyDmg = siegeDmg(enemyAtk, heroDef);
        heroHp = Math.max(0, heroHp - enemyDmg);
        if (heroHp <= 0) {
          state.log.push(isEn ? `You fell! You dealt ${damageDealt} damage this session.` : `Padłeś! Zadałeś ${damageDealt} obrażeń w tej sesji.`);
          return { ...state, heroHp: 0, enemyHp, damageDealt, done: true, won: false };
        }
        state = { ...state, heroHp, enemyHp, enemyAtk, enemyDef, damageDealt };
      }

      state.log.push(isEn ? `Fight paused. You dealt ${state.damageDealt} damage.` : `Walka wstrzymana. Zadałeś ${state.damageDealt} obrażeń.`);
      return state;
    });
  }

  async function handleRetreat() {
    if (!combat || !guild) { setCombat(null); return; }
    setCommitting(true);
    try {
      const newHp = await commitSiegeDamage(combat.territory.id, guild.id, combat.damageDealt, myUid ?? 'unknown');
      if (newHp <= 0 || combat.won) {
        const members  = Object.values(guild.members);
        const avgLevel = members.length > 0
          ? Math.round(members.reduce((s, m) => s + m.level, 0) / members.length)
          : hero.level;
        const defenderMembers = Object.entries(guild.members).map(([uid, m]) => ({ uid, name: m.heroName || m.username, username: m.username, level: m.level, portrait: m.portrait ?? 0 }));
        const prevOwner = territories[combat.territory.id]?.guildId ?? undefined;
        await captureTerritory(combat.territory.id, guild.id, guild.name, guild.tag, members.length, avgLevel, defenderMembers, prevOwner);
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
    if (!confirm(isEn
      ? 'Are you sure you want to abandon this zone? Your guild will not be able to siege any zone for 24h.'
      : 'Czy na pewno chcesz porzucić tę strefę? Gildia nie będzie mogła oblężyć żadnej przez 24h.')) return;
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
    return <SiegeCombat state={combat} onAttack={handleCombatAttack} onAutoFight={handleAutoFight} onRetreat={handleRetreat} isEn={isEn} />;
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
        <p style={{ ...PX(7), color: 'var(--pink)', textShadow: '0 0 10px rgba(255,45,120,0.5)' }}>⚡ {isEn ? 'CONTROL ZONES' : 'STREFY KONTROLI'}</p>
      </div>

      {/* City map */}
      <CityMap
        territories={territories}
        guild={guild}
        heroLevel={hero.level}
        focused={focused}
        onFocus={id => setFocused(prev => prev === id ? null : id)}
        isEn={isEn}
      />

      {focused && (
        <p style={{ ...MONO, fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>
          {isEn ? 'Click node again to deselect • selected:' : 'Kliknij węzeł ponownie aby odznaczyć • wybrana:'}{' '}
          <span style={{ color: 'var(--cyan)' }}>
            {(() => { const d = TERRITORY_LIST.find(t => t.id === focused); return isEn ? (d?.nameEn ?? d?.name) : d?.name; })()}
          </span>
        </p>
      )}

      {/* Alerts */}
      {guild && myOwnedCount >= 1 && (
        <div style={{ background: 'rgba(10,30,10,0.7)', border: '1px solid rgba(40,120,40,0.4)', padding: 8 }}>
          <p style={{ ...PX(4), color: '#60c060' }}>
            {isEn ? '✦ Your guild controls a zone. Limit: 1 — it must be recaptured first.' : '✦ Twoja gildia kontroluje strefę. Limit: 1 — musi zostać najpierw odbita.'}
          </p>
        </div>
      )}

      {guild && (() => {
        const now2 = Date.now();
        const capCd = guild.lastCaptureAt && now2 - guild.lastCaptureAt < DAY_MS
          ? DAY_MS - (now2 - guild.lastCaptureAt) : null;
        const lostCd = guild.lastLostAt && now2 - guild.lastLostAt < DAY_MS
          ? DAY_MS - (now2 - guild.lastLostAt) : null;
        if (!capCd && !lostCd) return null;
        return (
          <div style={{ background: 'rgba(40,20,0,0.7)', border: '1px solid rgba(180,100,0,0.4)', padding: 8 }}>
            <p style={{ ...PX(4), color: '#e09040' }}>
              {lostCd
                ? (isEn ? `⏳ You lost a zone — next attack in ${formatCountdown(lostCd)}` : `⏳ Straciliście strefę — kolejny atak za ${formatCountdown(lostCd)}`)
                : (isEn ? `⏳ Zone captured today — next capture in ${formatCountdown(capCd!)}` : `⏳ Przejęliście strefę dziś — kolejne przejęcie za ${formatCountdown(capCd!)}`)}
            </p>
          </div>
        );
      })()}

      {loading && (
        <p style={{ ...PX(5), color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>⏳ {isEn ? 'Loading...' : 'Ładowanie...'}</p>
      )}


      {/* Territory cards */}
      {!loading && sortedTerritories.map(def => {
        const state        = territories[def.id];
        const ownedByMyGuild = state?.guildId === guild?.id;
        const ownedByEnemy   = !!state?.guildId && !ownedByMyGuild;
        const unowned        = !state?.guildId;
        const locked         = hero.level < def.minLevel;
        const isFocused      = focused === def.id;

        const now = Date.now();
        const siegeExpired = state?.siegeStartedAt != null && now - state.siegeStartedAt >= SIEGE_DURATION_MS;
        const mySiegeActive    = state?.siegeGuildId === guild?.id && (state?.siegeCurrentHp ?? 0) > 0 && !siegeExpired;
        const enemySiegeActive = state?.siegeGuildId && state.siegeGuildId !== guild?.id && (state?.siegeCurrentHp ?? 0) > 0 && !siegeExpired;
        const alreadyAttacked  = mySiegeActive && myUid != null && (state?.siegeAttackers ?? []).includes(myUid);
        const siegeTimeLeft    = mySiegeActive && state?.siegeStartedAt ? (state.siegeStartedAt + SIEGE_DURATION_MS) - now : null;
        const attackerCount    = mySiegeActive ? (state?.siegeAttackers ?? []).length : 0;

        const canClaim = ownedByMyGuild && guild &&
          (state.lastRewardAt === null || now - (state.lastRewardAt ?? 0) >= DAY_MS);
        const nextClaimIn = ownedByMyGuild && !canClaim && state?.lastRewardAt
          ? DAY_MS - (now - state.lastRewardAt)
          : null;

        const now2 = Date.now();
        const captureCooldown = guild?.lastCaptureAt && now2 - guild.lastCaptureAt < DAY_MS
          ? DAY_MS - (now2 - guild.lastCaptureAt) : null;
        const lostCooldown = guild?.lastLostAt && now2 - guild.lastLostAt < DAY_MS
          ? DAY_MS - (now2 - guild.lastLostAt) : null;
        const onCooldown = !!(captureCooldown || lostCooldown);
        const canAttack = !locked && !ownedByMyGuild && !!guild && myOwnedCount < 1 && !alreadyAttacked && !onCooldown;

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
                    {isEn ? (def.nameEn ?? def.name) : def.name}
                  </p>
                </div>
                <p style={{ ...PX(4), color: 'var(--text-muted)', marginBottom: 4 }}>
                  {isEn ? (def.descEn ?? def.description) : def.description}
                </p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ ...PX(4), color: 'var(--text-muted)', marginBottom: 2 }}>{isEn ? 'Reward/day' : 'Nagroda/dzień'}</p>
                <p style={{ ...PX(5), color: 'var(--gold-bright)' }}>🪙{def.dailyGold}</p>
                <p style={{ ...PX(4), color: '#80a0ff' }}>✨{def.dailyXp} XP</p>
              </div>
            </div>

            <p style={{ ...PX(4), color: 'var(--text-muted)', marginBottom: 6 }}>
              Min. LVL.{def.minLevel} · {def.guardianEmoji} {isEn ? (def.guardianNameEn ?? def.guardianName) : def.guardianName} · {isEn ? '~3 players required' : 'wymaga ~3 graczy'}
            </p>

            {/* Siege progress */}
            {(mySiegeActive || enemySiegeActive) && state.siegeMaxHp && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <p style={{ ...PX(4), color: mySiegeActive ? '#a080e0' : '#e09040' }}>
                    {mySiegeActive
                      ? (isEn ? '⚔ Your siege' : '⚔ Wasze oblężenie')
                      : `⚔ ${isEn ? 'Siege' : 'Oblężenie'} [${state.siegeGuildTag}]`}
                  </p>
                  <p style={{ ...PX(4), color: 'var(--text-muted)' }}>
                    {state.siegeCurrentHp}/{state.siegeMaxHp} HP
                  </p>
                </div>
                <HpBar current={state.siegeCurrentHp ?? 0} max={state.siegeMaxHp} color={mySiegeActive ? '#7040c0' : '#c07020'} />
                {mySiegeActive && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <p style={{ ...MONO, fontSize: 10, color: '#a080e0' }}>
                      👥 {attackerCount} {isEn ? (attackerCount === 1 ? 'player attacked' : 'players attacked') : (attackerCount === 1 ? 'gracz zaatakował' : 'graczy zaatakowało')}
                    </p>
                    {siegeTimeLeft !== null && (
                      <p style={{ ...MONO, fontSize: 10, color: siegeTimeLeft < 30 * 60 * 1000 ? '#ff6060' : 'var(--text-muted)' }}>
                        ⏱ {formatCountdown(Math.max(0, siegeTimeLeft))}
                      </p>
                    )}
                  </div>
                )}
                {mySiegeActive && alreadyAttacked && (
                  <p style={{ ...MONO, fontSize: 10, color: '#e09040', marginTop: 3 }}>
                    {isEn ? '✓ Already attacked — wait for allies' : '✓ Już zaatakowałeś — czekaj na sojuszników'}
                  </p>
                )}
              </div>
            )}

            {/* Ownership */}
            {unowned        && <p style={{ ...PX(4), color: 'var(--text-muted)', marginBottom: 6 }}>{isEn ? 'Zone uncontrolled' : 'Strefa niekontrolowana'}</p>}
            {ownedByMyGuild && (
              <div style={{ marginBottom: 6 }}>
                <p style={{ ...PX(5), color: '#60c060', marginBottom: 3 }}>⚡ Wasza gildia [{guild?.tag}]</p>
                {(() => {
                  const ttl = state?.expiresAt ? state.expiresAt - Date.now() : null;
                  return ttl !== null && ttl > 0
                    ? <p style={{ ...PX(4), color: 'var(--text-muted)' }}>⏳ {isEn ? `Expires in ${formatCountdown(ttl)}` : `Wygasa za ${formatCountdown(ttl)}`}</p>
                    : null;
                })()}
              </div>
            )}
            {ownedByEnemy   && <p style={{ ...PX(5), color: '#e06060', marginBottom: 6 }}>⚡ [{state.guildTag}] {state.guildName}</p>}

            {/* Actions */}
            {locked && <p style={{ ...PX(4), color: 'var(--text-muted)' }}>🔒 {isEn ? `Level ${def.minLevel} required` : `Wymagany poziom ${def.minLevel}`}</p>}

            {!locked && !ownedByMyGuild && !guild && (
              <p style={{ ...PX(4), color: 'var(--text-muted)' }}>{isEn ? 'Join a guild to capture zones' : 'Dołącz do gildii, by przejmować strefy'}</p>
            )}

            {!locked && !ownedByMyGuild && guild && myOwnedCount >= 1 && (
              <p style={{ ...PX(4), color: 'var(--text-muted)' }}>🔒 {isEn ? 'Your guild already controls a zone' : 'Twoja gildia już kontroluje strefę'}</p>
            )}

            {canAttack && (
              <button
                onClick={() => handleAttack(def, state)}
                className={mySiegeActive ? 'btn btn-primary' : 'btn btn-danger'}
                style={{ width: '100%', fontSize: 10, padding: '7px' }}
              >
                {mySiegeActive
                  ? (isEn ? `⚔ Continue siege (${state.siegeCurrentHp} HP left)` : `⚔ Kontynuuj oblężenie (${state.siegeCurrentHp} HP zostało)`)
                  : unowned
                  ? (isEn ? `⚔ Capture zone (vs ${def.guardianEmoji} ${def.guardianNameEn ?? def.guardianName})` : `⚔ Przejmij strefę (vs ${def.guardianEmoji} ${def.guardianName})`)
                  : (isEn ? `⚔ Besiege (vs ⚔ Master [${state.guildTag}] — stronger defender!)` : `⚔ Oblęż (vs ⚔ Mistrz [${state.guildTag}] — silniejszy obrońca!)`)}
              </button>
            )}

            {ownedByMyGuild && canClaim && (
              <button
                onClick={() => handleClaim(def)}
                disabled={claimingId === def.id}
                className="btn btn-primary"
                style={{ width: '100%', fontSize: 10, padding: '7px', marginTop: 4 }}
              >
                {claimingId === def.id
                  ? (isEn ? '⏳ Claiming...' : '⏳ Odbieram...')
                  : (isEn ? `🪙 Claim tax (+${def.dailyGold}🪙, +${def.dailyXp}XP)` : `🪙 Odbierz podatek (+${def.dailyGold}🪙, +${def.dailyXp}XP)`)}
              </button>
            )}

            {ownedByMyGuild && !canClaim && nextClaimIn !== null && (
              <p style={{ ...PX(4), color: 'var(--text-muted)', marginTop: 4 }}>
                ⏳ {isEn ? `Next tax in ${formatCountdown(nextClaimIn)}` : `Następny podatek za ${formatCountdown(nextClaimIn)}`}
              </p>
            )}

            {ownedByMyGuild && myUid === guild?.leaderUid && (
              <button
                onClick={() => handleAbandon(def.id)}
                disabled={abandoning === def.id}
                className="btn btn-secondary"
                style={{ width: '100%', fontSize: 10, padding: '7px', marginTop: 4 }}
              >
                🏳 {isEn ? 'Abandon zone' : 'Porzuć strefę'}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
