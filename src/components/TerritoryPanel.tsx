import { useEffect, useState, useRef } from 'react';
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

const MAP_EDGES: [string, string][] = [
  // Original
  ['misty_forest', 'ruined_keep'],
  ['misty_forest', 'cursed_tomb'],
  ['ruined_keep', 'dark_mountain'],
  ['ruined_keep', 'dragon_peak'],
  ['cursed_tomb', 'dragon_peak'],
  // Bottom tier
  ['data_slums', 'misty_forest'],
  ['neon_bridge', 'misty_forest'],
  ['neon_bridge', 'ruined_keep'],
  ['black_market', 'ruined_keep'],
  // Middle tier
  ['hacker_den', 'ruined_keep'],
  ['hacker_den', 'cursed_tomb'],
  ['ghost_district', 'ruined_keep'],
  ['ghost_district', 'dark_mountain'],
  // Upper tier
  ['cyber_temple', 'cursed_tomb'],
  ['quantum_lab', 'dark_mountain'],
  ['megacorp_hq', 'dark_mountain'],
  // Top tier
  ['orbital_relay', 'dragon_peak'],
  ['orbital_relay', 'quantum_lab'],
  ['nexus_core', 'quantum_lab'],
  ['nexus_core', 'megacorp_hq'],
];

// ── City Map SVG ─────────────────────────────────────────────────────────────
// viewBox 160 × 90, same aesthetic as DungeonMapView

// Rescaled positions (from 100×100 → 160×90, margins preserved)
const TM_POS: Record<string, [number, number]> = {
  data_slums:    [17,  80],
  misty_forest:  [35,  67],
  neon_bridge:   [64,  82],
  black_market:  [132, 75],
  hacker_den:    [53,  50],
  cursed_tomb:   [10,  40],
  ruined_keep:   [93,  55],
  ghost_district:[111, 43],
  cyber_temple:  [24,  25],
  dark_mountain: [125, 33],
  dragon_peak:   [75,  15],
  orbital_relay: [42,   8],
  quantum_lab:   [96,  21],
  megacorp_hq:   [150, 27],
  nexus_core:    [129, 10],
};

// Deterministic city-block noise (different seed from DungeonMapView)
function trng(i: number): number {
  return Math.abs((Math.sin(i * 6271 + 31337) * 233280) % 1);
}
const T_BLOCKS = Array.from({ length: 210 }, (_, i) => ({
  x: trng(i) * 160,
  y: trng(i + 100) * 90,
  w: 0.4 + trng(i + 200) * 1.8,
  h: 0.3 + trng(i + 300) * 1.4,
  cyan: trng(i + 400) > 0.52,
  op: 0.1 + trng(i + 500) * 0.32,
}));

const TW = 160, TH = 90;
const T_NODE_R = 2.9;

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
  const wrapRef = useRef<HTMLDivElement>(null);

  type Popup = { id: string; left: number; top: number };
  const [popup, setPopup] = useState<Popup | null>(null);

  function nodeColor(id: string): string {
    const state = territories[id];
    if (focused === id) return '#ff2d78';
    const ownedByMe    = guild && state?.guildId === guild.id;
    const ownedByEnemy = !!state?.guildId && state.guildId !== guild?.id;
    const def = TERRITORY_LIST.find(d => d.id === id);
    const locked = def ? heroLevel < def.minLevel : false;
    if (ownedByMe)    return '#00ff88';
    if (ownedByEnemy) return '#ff4444';
    if (locked)       return '#5a4a78';
    return '#ffc83a';
  }

  function edgeInfo(a: string, b: string) {
    const sa = territories[a]; const sb = territories[b];
    const myA = guild && sa?.guildId === guild.id;
    const myB = guild && sb?.guildId === guild.id;
    if (myA && myB) return { color: 'rgba(0,255,136,0.7)', flow: true };
    const hasA = !!sa?.guildId; const hasB = !!sb?.guildId;
    if (hasA || hasB) return { color: 'rgba(255,68,68,0.45)', flow: false };
    return { color: 'rgba(74,31,122,0.3)', flow: false };
  }

  function handleNodeClick(id: string, e: React.MouseEvent<SVGGElement>) {
    e.stopPropagation();
    onFocus(id);
    if (popup?.id === id) { setPopup(null); return; }
    const wrap = wrapRef.current;
    if (!wrap) return;
    const W_px = wrap.clientWidth;
    const H_px = wrap.clientHeight;
    const [sx, sy] = TM_POS[id] ?? [80, 45];
    const px = (sx / TW) * W_px;
    const py = (sy / TH) * H_px;
    const PW = 200, PH = 160;
    let left = px + 18;
    let top  = py - 50;
    if (left + PW > W_px - 8) left = px - PW - 18;
    if (top  + PH > H_px - 8) top  = H_px - PH - 8;
    if (top < 8) top = 8;
    if (left < 8) left = 8;
    setPopup({ id, left, top });
  }

  const pd   = popup ? TERRITORY_LIST.find(d => d.id === popup.id) : null;
  const pSt  = popup ? territories[popup.id] : undefined;
  const pCol = popup ? nodeColor(popup.id) : '#ffc83a';

  return (
    <div
      ref={wrapRef}
      style={{ position: 'relative', width: '100%', aspectRatio: '16/9', overflow: 'hidden',
        background: 'rgba(6,3,13,0.97)', border: '1px solid rgba(74,31,122,0.5)' }}
      onClick={() => setPopup(null)}
    >
      <svg viewBox={`0 0 ${TW} ${TH}`} width="100%" height="100%" style={{ display: 'block' }}>
        <defs>
          <filter id="tm-glow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="0.55" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <pattern id="tm-dots" x="0" y="0" width="2" height="2" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.13" fill="rgba(142,122,168,0.18)" />
          </pattern>
          <radialGradient id="tm-hot-pink" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="rgba(255,45,143,0.35)" />
            <stop offset="100%" stopColor="rgba(255,45,143,0)" />
          </radialGradient>
          <radialGradient id="tm-hot-green" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="rgba(0,255,136,0.28)" />
            <stop offset="100%" stopColor="rgba(0,255,136,0)" />
          </radialGradient>
        </defs>

        {/* Dot-grid base */}
        <rect width={TW} height={TH} fill="url(#tm-dots)" />

        {/* Location glows */}
        {TERRITORY_LIST.map(def => {
          const [nx, ny] = TM_POS[def.id] ?? [0, 0];
          const ownedByMe = guild && territories[def.id]?.guildId === guild.id;
          return (
            <circle key={def.id} cx={nx} cy={ny} r={14}
              fill={ownedByMe ? 'url(#tm-hot-green)' : 'url(#tm-hot-pink)'}
              opacity={ownedByMe ? 0.5 : 0.18}
            />
          );
        })}

        {/* City blocks */}
        {T_BLOCKS.map((b, i) => (
          <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h}
            fill={b.cyan ? 'rgba(45,229,255,1)' : 'rgba(255,45,143,1)'}
            opacity={b.op * 0.5}
          />
        ))}

        {/* Grid roads */}
        <g stroke="rgba(45,229,255,0.09)" strokeWidth="0.11" fill="none">
          {[12, 26, 40, 54, 68, 80].map(y => <line key={y} x1={0} y1={y} x2={TW} y2={y} />)}
          {[16, 32, 48, 64, 80, 96, 112, 128, 144].map(x => <line key={x} x1={x} y1={0} x2={x} y2={TH} />)}
        </g>

        {/* River */}
        <path d="M -2 78 Q 20 72 40 62 Q 60 52 82 46 Q 108 40 130 32 Q 148 26 162 22"
          stroke="rgba(45,229,255,0.14)" strokeWidth="2.1" fill="none" />
        <path d="M -2 78 Q 20 72 40 62 Q 60 52 82 46 Q 108 40 130 32 Q 148 26 162 22"
          stroke="rgba(45,229,255,0.38)" strokeWidth="0.17" fill="none" strokeDasharray="0.3 0.6" />

        {/* District labels */}
        <g fontFamily="'Press Start 2P', monospace" fontSize="1.05" letterSpacing="0.2"
          fill="rgba(90,74,120,0.7)" textAnchor="middle"
          paintOrder="stroke" stroke="rgba(6,3,13,0.9)" strokeWidth="0.3">
          <text x="22"  y="89">{isEn ? 'SLUMS'  : 'SLUMSY'}</text>
          <text x="75"  y="88">{isEn ? 'MID CITY' : 'ŚRODMIEŚCIE'}</text>
          <text x="80"  y="10">{isEn ? 'CORP DISTRICT' : 'DZIELNICA KORPORACYJNA'}</text>
          <text x="145" y="84">{isEn ? 'BLACK MARKET' : 'CZARNY RYNEK'}</text>
        </g>

        {/* Edges */}
        {MAP_EDGES.map(([a, b], i) => {
          const pa = TM_POS[a]; const pb = TM_POS[b];
          if (!pa || !pb) return null;
          const mx = (pa[0] + pb[0]) / 2;
          const my = (pa[1] + pb[1]) / 2 - 3.5;
          const pathD = `M ${pa[0]} ${pa[1]} Q ${mx} ${my} ${pb[0]} ${pb[1]}`;
          const { color, flow } = edgeInfo(a, b);
          return (
            <g key={i}>
              <path d={pathD} stroke={color} strokeWidth="0.2" fill="none" opacity={0.7} />
              {flow && (
                <path d={pathD} stroke={color} strokeWidth="0.42" fill="none" opacity={0.55}
                  strokeDasharray="1.2 1.4">
                  <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="1.4s" repeatCount="indefinite" />
                </path>
              )}
            </g>
          );
        })}

        {/* Territory nodes */}
        {TERRITORY_LIST.map(def => {
          const pos = TM_POS[def.id];
          if (!pos) return null;
          const [nx, ny] = pos;
          const state     = territories[def.id];
          const ownedByMe = guild && state?.guildId === guild.id;
          const ownedByEnemy = !!state?.guildId && state.guildId !== guild?.id;
          const locked    = heroLevel < def.minLevel;
          const isFocused = focused === def.id;
          const col       = nodeColor(def.id);
          const r         = T_NODE_R;
          const pts       = `0,${-r} ${r},0 0,${r} ${-r},0`;
          const dispName  = (isEn ? ((def as any).nameEn ?? def.name) : def.name) as string;
          const shortName = dispName.length > 11 ? dispName.slice(0, 10) + '…' : dispName;

          return (
            <g key={def.id}
              transform={`translate(${nx} ${ny})`}
              style={{ cursor: locked ? 'not-allowed' : 'pointer' }}
              onClick={e => handleNodeClick(def.id, e)}
            >
              <circle r={r + 4} fill="transparent" />

              {/* Pulse ring when focused */}
              {isFocused && (
                <polygon points={pts} fill="none" stroke={col} strokeWidth="0.22" opacity="0.85">
                  <animateTransform attributeName="transform" type="scale" values="1;3.0" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.85;0" dur="2s" repeatCount="indefinite" />
                </polygon>
              )}

              {/* Outer diamond */}
              <polygon points={pts}
                fill={locked ? 'rgba(18,10,34,0.92)' : 'rgba(10,5,22,0.97)'}
                stroke={col}
                strokeWidth={isFocused ? 0.50 : 0.30}
                filter={!locked ? 'url(#tm-glow)' : undefined}
                opacity={locked ? 0.55 : 1}
              />
              {/* Inner diamond */}
              <polygon points={`0,${-r*0.55} ${r*0.55},0 0,${r*0.55} ${-r*0.55},0`}
                fill="none" stroke={col} strokeWidth="0.12"
                opacity={locked ? 0.2 : 0.6}
              />

              {/* Emoji */}
              <text x={0} y={r * 0.40} textAnchor="middle"
                fontSize={r * 1.10} opacity={locked ? 0.35 : 1}
                style={!locked ? { filter: `drop-shadow(0 0 1.2px ${col})` } : undefined}
              >
                {def.emoji}
              </text>

              {/* Guild tag badge */}
              {(ownedByMe || ownedByEnemy) && state.guildTag && (
                <text x={r + 0.7} y={-r + 1.3} textAnchor="start" fontSize="1.4"
                  fill={ownedByMe ? '#4ade80' : '#f87171'}
                  paintOrder="stroke" stroke="rgba(6,3,13,0.9)" strokeWidth="0.4">
                  [{state.guildTag}]
                </text>
              )}

              {/* Name label */}
              <text y={r + 2.1} textAnchor="middle"
                fontFamily="'Share Tech Mono', monospace"
                fontSize="1.2" letterSpacing="0.07"
                fill={isFocused ? '#ff2d78' : locked ? '#8e7aa8' : '#e8d8ff'}
                paintOrder="stroke" stroke="rgba(6,3,13,0.95)" strokeWidth="0.38"
                style={{ textTransform: 'uppercase' }}
              >
                {shortName}
              </text>

              {/* Level / siege indicator */}
              <text y={r + 3.5} textAnchor="middle"
                fontFamily="'VT323', monospace" fontSize="1.3"
                fill={locked ? '#5a4a78' : col}
                paintOrder="stroke" stroke="rgba(6,3,13,0.95)" strokeWidth="0.3"
              >
                {locked ? `⌧ ${def.minLevel}` : state?.siegeCurrentHp != null && (state.siegeCurrentHp ?? 0) > 0 ? '⚔' : ''}
              </text>
            </g>
          );
        })}

        {/* Radar decoration */}
        <g transform="translate(156 86)">
          <circle r="2.5"  fill="rgba(10,4,22,0.7)" stroke="rgba(45,229,255,0.35)" strokeWidth="0.10" />
          <circle r="1.65" fill="none" stroke="rgba(45,229,255,0.20)" strokeWidth="0.07" />
          <circle r="0.80" fill="none" stroke="rgba(45,229,255,0.15)" strokeWidth="0.06" />
          <line x1="0" y1="0" x2="2.5" y2="0" stroke="rgba(45,229,255,0.55)" strokeWidth="0.13">
            <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="4s" repeatCount="indefinite" />
          </line>
          <circle r="0.22" fill="rgba(45,229,255,0.75)" />
        </g>

        {/* Header tag */}
        <g transform="translate(4 5)">
          <rect x="0" y="-3.5" width="42" height="5" fill="rgba(10,4,22,0.75)" stroke="rgba(255,45,143,0.3)" strokeWidth="0.12" />
          <text x="2" y="0.2" fontFamily="'Press Start 2P', monospace" fontSize="1.6" fill="rgba(255,45,143,0.9)" letterSpacing="0.3">
            {isEn ? '// TERRITORY MAP' : '// MAPA TERYTORIÓW'}
          </text>
        </g>
      </svg>

      {/* CRT scanline overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
        backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 3px)',
        opacity: 0.65,
      }} />

      {/* Popup */}
      {popup && pd && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute', left: popup.left, top: popup.top,
            width: 200,
            background: 'rgba(8,3,20,0.97)',
            border: `1px solid ${pCol}`,
            padding: '10px 12px',
            zIndex: 20,
            backdropFilter: 'blur(6px)',
            boxShadow: `0 0 0 1px ${pCol}22, 0 0 26px rgba(0,0,0,0.65)`,
          }}
        >
          <button
            onClick={() => setPopup(null)}
            style={{ position: 'absolute', top: 4, right: 6, background: 'none', border: 'none',
              color: '#5a4a78', fontSize: 13, cursor: 'pointer', padding: 0, lineHeight: 1 }}
          >✕</button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, paddingRight: 20 }}>
            <div style={{ width: 34, height: 34, display: 'grid', placeItems: 'center',
              fontSize: 18, border: `1px solid ${pCol}`, background: 'rgba(8,3,18,0.85)', flexShrink: 0 }}>
              {pd.emoji}
            </div>
            <div>
              <p style={{ fontFamily: 'monospace', fontSize: 10, color: pCol, marginBottom: 2, letterSpacing: '0.05em' }}>
                {(isEn ? ((pd as any).nameEn ?? pd.name) : pd.name) as string}
              </p>
              <p style={{ fontSize: 9, fontFamily: 'monospace', color: '#5a4a78' }}>
                {isEn ? 'MIN.' : 'MIN.'} LVL {pd.minLevel}
              </p>
            </div>
          </div>

          {/* Ownership */}
          <div style={{ marginBottom: 8 }}>
            {pSt?.guildId ? (
              <span style={{ fontSize: 9, fontFamily: 'monospace', letterSpacing: '0.1em',
                color: guild && pSt.guildId === guild.id ? '#4ade80' : '#f87171',
                border: `1px solid ${guild && pSt.guildId === guild.id ? '#4ade80' : '#f87171'}`,
                padding: '2px 6px' }}>
                [{pSt.guildTag}] {guild && pSt.guildId === guild.id
                  ? (isEn ? 'YOUR GUILD' : 'WASZA GILDIA')
                  : (isEn ? 'ENEMY' : 'WRÓG')}
              </span>
            ) : heroLevel < pd.minLevel ? (
              <span style={{ fontSize: 9, fontFamily: 'monospace', color: '#5a4a78',
                border: '1px solid #5a4a78', padding: '2px 6px' }}>
                ⌧ {isEn ? 'LOCKED' : 'ZABLOKOWANA'}
              </span>
            ) : (
              <span style={{ fontSize: 9, fontFamily: 'monospace', color: '#ffc83a',
                border: '1px solid #ffc83a', padding: '2px 6px' }}>
                {isEn ? 'NEUTRAL' : 'NEUTRALNA'}
              </span>
            )}
          </div>

          {/* Siege indicator */}
          {pSt?.siegeCurrentHp != null && (pSt.siegeCurrentHp ?? 0) > 0 && (
            <p style={{ fontSize: 9, fontFamily: 'monospace', color: '#f87171', marginBottom: 8 }}>
              ⚔ {isEn ? 'SIEGE IN PROGRESS' : 'OBLĘŻENIE W TOKU'} — {pSt.siegeGuildTag}
            </p>
          )}

          {/* Details button */}
          <button
            onClick={() => { onFocus(popup.id); setPopup(null); }}
            style={{
              display: 'block', width: '100%', padding: '7px 4px',
              background: focused === popup.id ? `rgba(255,45,120,0.12)` : 'transparent',
              border: `1px solid ${pCol}`,
              color: pCol,
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 9, cursor: 'pointer', letterSpacing: '0.1em',
            }}
          >
            {focused === popup.id ? '◆ SZCZEGÓŁY' : '► SZCZEGÓŁY'}
          </button>
        </div>
      )}
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
                  <div style={{ width: 18, height: 18, overflow: 'hidden', flexShrink: 0 }}>
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

const CAPTURE_COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6h between captures
const MAX_TERRITORIES = 3; // max zones a guild can hold simultaneously

export default function TerritoryPanel({ guild, onBack, onRefresh }: { guild: Guild | null; onBack: () => void; onRefresh?: () => void }) {
  const hero                    = useGameStore(s => s.hero);
  const addGold                 = useGameStore(s => s.addGold);
  const addXp                   = useGameStore(s => s.addXp);
  const recordTerritoryClaimAt  = useGameStore(s => s.recordTerritoryClaimAt);
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
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

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
    try {
      return await _handleAttack(def, state);
    } catch (err: unknown) {
      setAlertMsg(isEn
        ? `Siege error: ${err instanceof Error ? err.message : String(err)}`
        : `Błąd oblężenia: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async function _handleAttack(def: TerritoryDef, state: TerritoryState | undefined) {
    if (!guild) return;

    if (myOwnedCount >= MAX_TERRITORIES && state?.guildId !== guild.id) {
      setAlertMsg(isEn
        ? `Your guild already controls ${MAX_TERRITORIES} zones (maximum). Lose one or abandon it first.`
        : `Twoja gildia kontroluje już ${MAX_TERRITORIES} strefy (maksimum). Najpierw ją stracisz lub porzucisz.`);
      return;
    }

    const now = Date.now();
    if (guild.lastCaptureAt && now - guild.lastCaptureAt < CAPTURE_COOLDOWN_MS) {
      const left = CAPTURE_COOLDOWN_MS - (now - guild.lastCaptureAt);
      setAlertMsg(isEn
        ? `Your guild can capture another zone in ${formatCountdown(left)}.`
        : `Wasza gildia może przejąć kolejną strefę za ${formatCountdown(left)}.`);
      return;
    }
    if (guild.lastLostAt && now - guild.lastLostAt < CAPTURE_COOLDOWN_MS) {
      const left = CAPTURE_COOLDOWN_MS - (now - guild.lastLostAt);
      setAlertMsg(isEn
        ? `Your guild lost a zone recently. You can attack in ${formatCountdown(left)}.`
        : `Wasza gildia straciła strefę. Można atakować za ${formatCountdown(left)}.`);
      return;
    }

    const isMyActiveSiege = state?.siegeGuildId === guild.id && (state?.siegeCurrentHp ?? 0) > 0;
    const siegeExpired = isMyActiveSiege && state?.siegeStartedAt != null && Date.now() - state.siegeStartedAt >= SIEGE_DURATION_MS;

    if (isMyActiveSiege && !siegeExpired && myUid && (state?.siegeAttackers ?? []).includes(myUid)) {
      setAlertMsg(isEn
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
      setAlertMsg(isEn
        ? `Another siege is underway: [${result.byTag}]. Ends in ${formatCountdown(Math.max(0, remaining))}.`
        : `Inne oblężenie trwa: [${result.byTag}]. Kończy się za ${formatCountdown(Math.max(0, remaining))}.`);
      return;
    }

    if (myUid && result.attackers.includes(myUid)) {
      setAlertMsg(isEn
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
        recordTerritoryClaimAt(def.id);
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
        <p style={{ ...PX(6), color: 'var(--gold-main)' }}>⏳ {isEn ? 'Saving damage...' : 'Zapisywanie obrażeń...'}</p>
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
      {guild && myOwnedCount >= MAX_TERRITORIES && (
        <div style={{ background: 'rgba(10,30,10,0.7)', border: '1px solid rgba(40,120,40,0.4)', padding: 8 }}>
          <p style={{ ...PX(4), color: '#60c060' }}>
            {isEn
              ? `✦ Your guild controls ${myOwnedCount}/${MAX_TERRITORIES} zones (maximum). Abandon one to capture another.`
              : `✦ Twoja gildia kontroluje ${myOwnedCount}/${MAX_TERRITORIES} stref (maksimum). Porzuć jedną, by przejąć kolejną.`}
          </p>
        </div>
      )}

      {guild && myOwnedCount > 0 && myOwnedCount < MAX_TERRITORIES && (
        <div style={{ background: 'rgba(10,30,10,0.5)', border: '1px solid rgba(40,120,40,0.3)', padding: 8 }}>
          <p style={{ ...PX(4), color: '#60c060' }}>
            {isEn
              ? `✦ Zones: ${myOwnedCount}/${MAX_TERRITORIES} — you can still capture ${MAX_TERRITORIES - myOwnedCount} more.`
              : `✦ Strefy: ${myOwnedCount}/${MAX_TERRITORIES} — możecie przejąć jeszcze ${MAX_TERRITORIES - myOwnedCount}.`}
          </p>
        </div>
      )}

      {guild && (() => {
        const now2 = Date.now();
        const capCd = guild.lastCaptureAt && now2 - guild.lastCaptureAt < CAPTURE_COOLDOWN_MS
          ? CAPTURE_COOLDOWN_MS - (now2 - guild.lastCaptureAt) : null;
        const lostCd = guild.lastLostAt && now2 - guild.lastLostAt < CAPTURE_COOLDOWN_MS
          ? CAPTURE_COOLDOWN_MS - (now2 - guild.lastLostAt) : null;
        if (!capCd && !lostCd) return null;
        return (
          <div style={{ background: 'rgba(40,20,0,0.7)', border: '1px solid rgba(180,100,0,0.4)', padding: 8 }}>
            <p style={{ ...PX(4), color: '#e09040' }}>
              {lostCd
                ? (isEn ? `⏳ Lost a zone — next attack in ${formatCountdown(lostCd)}` : `⏳ Straciliście strefę — kolejny atak za ${formatCountdown(lostCd)}`)
                : (isEn ? `⏳ Zone captured — next capture in ${formatCountdown(capCd!)}` : `⏳ Przejęliście strefę — kolejne przejęcie za ${formatCountdown(capCd!)}`)}
            </p>
          </div>
        );
      })()}

      {alertMsg && (
        <div style={{ background: 'rgba(40,10,10,0.85)', border: '1px solid rgba(220,60,60,0.5)', padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ ...MONO, fontSize: 10, color: '#f87171' }}>{alertMsg}</p>
          <button onClick={() => setAlertMsg(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer', flexShrink: 0, marginLeft: 8 }}>✕</button>
        </div>
      )}

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

        const myLastClaim = hero.lastTerritoryClaimAt?.[def.id] ?? null;
        const canClaim = ownedByMyGuild && guild &&
          (myLastClaim === null || now - myLastClaim >= DAY_MS);
        const nextClaimIn = ownedByMyGuild && !canClaim && myLastClaim !== null
          ? DAY_MS - (now - myLastClaim)
          : null;

        const now2 = Date.now();
        const captureCooldown = guild?.lastCaptureAt && now2 - guild.lastCaptureAt < CAPTURE_COOLDOWN_MS
          ? CAPTURE_COOLDOWN_MS - (now2 - guild.lastCaptureAt) : null;
        const lostCooldown = guild?.lastLostAt && now2 - guild.lastLostAt < CAPTURE_COOLDOWN_MS
          ? CAPTURE_COOLDOWN_MS - (now2 - guild.lastLostAt) : null;
        const onCooldown = !!(captureCooldown || lostCooldown);
        const canAttack = !locked && !ownedByMyGuild && !!guild && myOwnedCount < MAX_TERRITORIES && !alreadyAttacked && !onCooldown;

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

            {!locked && !ownedByMyGuild && guild && myOwnedCount >= MAX_TERRITORIES && (
              <p style={{ ...PX(4), color: 'var(--text-muted)' }}>🔒 {isEn ? `Guild zone limit reached (${MAX_TERRITORIES}/${MAX_TERRITORIES})` : `Limit stref gildii osiągnięty (${MAX_TERRITORIES}/${MAX_TERRITORIES})`}</p>
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
