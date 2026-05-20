import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { MAX_DAILY_DUNGEONS } from '../store/gameStore';
import { ALL_DUNGEONS } from '../data/dungeons';
import type { Dungeon } from '../types';
import EnemyIcon from './EnemyIcon';
import { useT } from '../hooks/useT';
import { useLangStore } from '../store/langStore';
import { PX, MONO, ORB } from '../utils/styles';
const LOG_COLORS = { hero: '#5a9040', enemy: '#903040', loot: '#9c7a3c', system: '#7a7060' };

type DungeonMode = 'xp' | 'balanced' | 'loot';
type DungeonDifficulty = 'easy' | 'normal' | 'hard';

const NODE_POS: Record<string, { x: number; y: number }> = {
  forest:         { x: 14, y: 57 },
  cave:           { x: 34, y: 44 },
  castle:         { x: 58, y: 30 },
  westland:       { x: 46, y: 16 },
  dragon_lair:    { x: 80, y: 8  },
  neon_undercity: { x: 88, y: 30 },
  zero_zone:      { x: 75, y: 52 },
  ghost_network:  { x: 55, y: 65 },
};
const CONNECTIONS: [string, string][] = [
  ['forest', 'cave'],
  ['cave', 'castle'],
  ['castle', 'westland'],
  ['westland', 'dragon_lair'],
  ['dragon_lair', 'neon_undercity'],
  ['neon_undercity', 'zero_zone'],
  ['zero_zone', 'ghost_network'],
];

type DifficultyOption = { key: DungeonDifficulty; label: string; badge: string; desc: string; color: string; border: string };
type DungeonVariant = { key: DungeonMode; label: string; badge: string; desc: string; color: string; bg: string; border: string; glow: string };

// ── Helper: hex points ─────────────────────────────────────────────────────
function hexPoints(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 180) * (60 * i - 30);
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(' ');
}

// ── LocationIcon ───────────────────────────────────────────────────────────
function LocationIcon({ id, size = 24, color = '#ffc83a' }: { id: string; size?: number; color?: string }) {
  // viewBox "-6 -6 12 12", scale to `size`
  const vb = '-6 -6 12 12';

  if (id === 'forest') {
    return (
      <svg width={size} height={size} viewBox={vb} xmlns="http://www.w3.org/2000/svg" overflow="visible">
        {/* lewy budynek */}
        <rect x="-5" y="-1.5" width="3" height="4" fill={color} opacity="0.9"/>
        <polygon points="-5,-1.5 -3.5,-3.5 -2,-1.5" fill={color}/>
        <line x1="-4" y1="-2.5" x2="-3.2" y2="-3.5" stroke={color} strokeWidth="0.4" opacity="0.7"/>
        <rect x="-4.2" y="-0.5" width="0.9" height="1" fill="#000" opacity="0.6"/>
        {/* prawy budynek wyższy */}
        <rect x="-0.5" y="-3.5" width="3.5" height="6" fill={color} opacity="0.8"/>
        <polygon points="-0.5,-3.5 1.25,-5.2 3,-3.5" fill={color}/>
        <rect x="0.3" y="-2.5" width="1" height="1.1" fill="#000" opacity="0.6"/>
        <rect x="0.3" y="-0.9" width="1" height="1.1" fill="#000" opacity="0.6"/>
        <rect x="1.6" y="-2" width="0.8" height="0.8" fill="#000" opacity="0.5"/>
        {/* ziemia */}
        <line x1="-5.5" y1="2.5" x2="3.5" y2="2.5" stroke={color} strokeWidth="0.5" opacity="0.4"/>
      </svg>
    );
  }

  if (id === 'cave') {
    return (
      <svg width={size} height={size} viewBox={vb} xmlns="http://www.w3.org/2000/svg" overflow="visible">
        {/* obudowa racka */}
        <rect x="-4" y="-3.5" width="8" height="6.5" rx="0.5" fill={color} opacity="0.8"/>
        <rect x="-3.5" y="-3" width="7" height="1.4" rx="0.2" fill="#000" opacity="0.5"/>
        <rect x="-3.5" y="-1.2" width="7" height="1.4" rx="0.2" fill="#000" opacity="0.5"/>
        <rect x="-3.5" y="0.6" width="7" height="1.4" rx="0.2" fill="#000" opacity="0.5"/>
        {/* LEDy rząd 1 */}
        <circle cx="-2.2" cy="-2.3" r="0.45" fill="#00ffff"/>
        <circle cx="-0.8" cy="-2.3" r="0.45" fill="#00ff88"/>
        <circle cx="0.6" cy="-2.3" r="0.45" fill="#ff4444"/>
        <circle cx="2" cy="-2.3" r="0.45" fill="#00ffff"/>
        {/* LEDy rząd 2 */}
        <circle cx="-2.2" cy="-0.5" r="0.45" fill="#00ff88"/>
        <circle cx="-0.8" cy="-0.5" r="0.45" fill="#00ffff"/>
        <circle cx="0.6" cy="-0.5" r="0.45" fill="#00ff88"/>
        {/* pasek boczny */}
        <rect x="3" y="-3" width="0.8" height="5.5" rx="0.3" fill={color} opacity="0.5"/>
      </svg>
    );
  }

  if (id === 'castle') {
    return (
      <svg width={size} height={size} viewBox={vb} xmlns="http://www.w3.org/2000/svg" overflow="visible">
        {/* główna wieża */}
        <rect x="-1.5" y="-5.5" width="3" height="8" fill={color} opacity="0.9"/>
        {/* podstawa */}
        <rect x="-3" y="-1.5" width="6" height="4" fill={color} opacity="0.7"/>
        {/* szeroka podstawa */}
        <rect x="-5" y="1" width="10" height="1.5" fill={color} opacity="0.5"/>
        {/* okna wieży */}
        <rect x="-0.8" y="-4.5" width="1.6" height="0.9" fill="#000" opacity="0.6"/>
        <rect x="-0.8" y="-3.2" width="1.6" height="0.9" fill="#000" opacity="0.6"/>
        <rect x="-0.8" y="-1.9" width="1.6" height="0.9" fill="#000" opacity="0.6"/>
        {/* okna podstawy */}
        <rect x="-2.3" y="-0.8" width="1" height="1" fill="#000" opacity="0.5"/>
        <rect x="1.3" y="-0.8" width="1" height="1" fill="#000" opacity="0.5"/>
        {/* antena */}
        <line x1="0" y1="-5.5" x2="0" y2="-6" stroke={color} strokeWidth="0.5"/>
        <circle cx="0" cy="-6.2" r="0.3" fill={color}/>
      </svg>
    );
  }

  if (id === 'westland') {
    return (
      <svg width={size} height={size} viewBox={vb} xmlns="http://www.w3.org/2000/svg" overflow="visible">
        {/* czaszka */}
        <ellipse cx="0" cy="-1" rx="3.8" ry="3.2" fill={color} opacity="0.9"/>
        {/* oczodoły */}
        <ellipse cx="-1.5" cy="-1.8" rx="1.2" ry="1.1" fill="#000" opacity="0.8"/>
        <ellipse cx="1.5" cy="-1.8" rx="1.2" ry="1.1" fill="#000" opacity="0.8"/>
        {/* nos */}
        <polygon points="0,-0.5 -0.5,0.5 0.5,0.5" fill="#000" opacity="0.7"/>
        {/* szczęka */}
        <rect x="-3" y="1.6" width="6" height="1.4" rx="0.3" fill={color} opacity="0.9"/>
        {/* zęby */}
        <line x1="-2" y1="1.6" x2="-2" y2="3" stroke="#000" strokeWidth="0.6" opacity="0.7"/>
        <line x1="-0.8" y1="1.6" x2="-0.8" y2="3" stroke="#000" strokeWidth="0.6" opacity="0.7"/>
        <line x1="0.4" y1="1.6" x2="0.4" y2="3" stroke="#000" strokeWidth="0.6" opacity="0.7"/>
        <line x1="1.6" y1="1.6" x2="1.6" y2="3" stroke="#000" strokeWidth="0.6" opacity="0.7"/>
      </svg>
    );
  }

  if (id === 'dragon_lair') {
    return (
      <svg width={size} height={size} viewBox={vb} xmlns="http://www.w3.org/2000/svg" overflow="visible">
        {/* główna ściana */}
        <rect x="-4.5" y="-0.5" width="9" height="4" fill={color} opacity="0.9"/>
        {/* blanki */}
        <rect x="-4.5" y="-3" width="2.2" height="2.5" fill={color} opacity="0.9"/>
        <rect x="-1.5" y="-3" width="2.2" height="2.5" fill={color} opacity="0.9"/>
        <rect x="2.3" y="-3" width="2.2" height="2.5" fill={color} opacity="0.9"/>
        {/* brama */}
        <path d="M -1.2 3.5 L -1.2 1 Q -1.2 -0.5 0 -0.5 Q 1.2 -0.5 1.2 1 L 1.2 3.5" fill="#000" opacity="0.7"/>
        {/* strzelnice */}
        <rect x="-3.5" y="-0.2" width="1.4" height="0.8" fill="#000" opacity="0.5"/>
        <rect x="2.1" y="-0.2" width="1.4" height="0.8" fill="#000" opacity="0.5"/>
        {/* szczeliny blanek */}
        <rect x="-0.35" y="-2.2" width="0.7" height="1.2" fill="#000" opacity="0.5"/>
      </svg>
    );
  }

  if (id === 'neon_undercity') {
    return (
      <svg width={size} height={size} viewBox={vb} xmlns="http://www.w3.org/2000/svg" overflow="visible">
        {/* zewnętrzny łuk */}
        <path d="M -5 3 L -5 0 Q -5 -6 0 -6 Q 5 -6 5 0 L 5 3" fill="none" stroke={color} strokeWidth="1.3" opacity="0.9"/>
        {/* wewnętrzny łuk */}
        <path d="M -3.2 3 L -3.2 0.3 Q -3.2 -3.8 0 -3.8 Q 3.2 -3.8 3.2 0.3 L 3.2 3" fill="none" stroke={color} strokeWidth="0.8" opacity="0.6"/>
        {/* podłoga */}
        <line x1="-5" y1="3" x2="5" y2="3" stroke={color} strokeWidth="0.9"/>
        {/* neonowy orb w centrum */}
        <circle cx="0" cy="-2" r="1" fill={color} opacity="0.9"/>
        <circle cx="0" cy="-2" r="0.5" fill="#ffffff" opacity="0.9"/>
        {/* neonowe linie podłogi */}
        <line x1="-2.5" y1="2" x2="2.5" y2="2" stroke={color} strokeWidth="0.5" opacity="0.7"/>
        <line x1="-3.5" y1="1" x2="-3.5" y2="3" stroke={color} strokeWidth="0.4" opacity="0.5"/>
        <line x1="3.5" y1="1" x2="3.5" y2="3" stroke={color} strokeWidth="0.4" opacity="0.5"/>
      </svg>
    );
  }

  if (id === 'zero_zone') {
    return (
      <svg width={size} height={size} viewBox={vb} xmlns="http://www.w3.org/2000/svg" overflow="visible">
        {/* crosshair outer ring */}
        <circle cx="0" cy="0" r="4.5" fill="none" stroke={color} strokeWidth="0.9" opacity="0.9"/>
        {/* crosshair inner ring */}
        <circle cx="0" cy="0" r="2.2" fill="none" stroke={color} strokeWidth="0.6" opacity="0.7"/>
        {/* crosshair lines */}
        <line x1="-5.5" y1="0" x2="-2.8" y2="0" stroke={color} strokeWidth="0.7" opacity="0.9"/>
        <line x1="2.8" y1="0" x2="5.5" y2="0" stroke={color} strokeWidth="0.7" opacity="0.9"/>
        <line x1="0" y1="-5.5" x2="0" y2="-2.8" stroke={color} strokeWidth="0.7" opacity="0.9"/>
        <line x1="0" y1="2.8" x2="0" y2="5.5" stroke={color} strokeWidth="0.7" opacity="0.9"/>
        {/* center dot */}
        <circle cx="0" cy="0" r="0.8" fill={color} opacity="0.95"/>
        {/* tick marks */}
        <line x1="-4.5" y1="-1" x2="-4.5" y2="1" stroke={color} strokeWidth="0.5" opacity="0.5"/>
        <line x1="4.5" y1="-1" x2="4.5" y2="1" stroke={color} strokeWidth="0.5" opacity="0.5"/>
      </svg>
    );
  }

  if (id === 'ghost_network') {
    return (
      <svg width={size} height={size} viewBox={vb} xmlns="http://www.w3.org/2000/svg" overflow="visible">
        {/* ghost body */}
        <path d="M -3.5 4 L -3.5 -1 Q -3.5 -5.5 0 -5.5 Q 3.5 -5.5 3.5 -1 L 3.5 4 L 2 2.5 L 0.5 4 L -1 2.5 L -2.5 4 Z" fill={color} opacity="0.85"/>
        {/* ghost eyes */}
        <ellipse cx="-1.3" cy="-1.5" rx="1" ry="1.1" fill="#000" opacity="0.7"/>
        <ellipse cx="1.3" cy="-1.5" rx="1" ry="1.1" fill="#000" opacity="0.7"/>
        {/* ghost eye glow */}
        <circle cx="-1.3" cy="-1.5" r="0.4" fill={color} opacity="0.5"/>
        <circle cx="1.3" cy="-1.5" r="0.4" fill={color} opacity="0.5"/>
        {/* network lines */}
        <line x1="-4.5" y1="-3" x2="-3.5" y2="-2" stroke={color} strokeWidth="0.5" opacity="0.5"/>
        <line x1="4.5" y1="-3" x2="3.5" y2="-2" stroke={color} strokeWidth="0.5" opacity="0.5"/>
        <circle cx="-4.8" cy="-3.4" r="0.5" fill={color} opacity="0.6"/>
        <circle cx="4.8" cy="-3.4" r="0.5" fill={color} opacity="0.6"/>
      </svg>
    );
  }

  // fallback — generic dot
  return (
    <svg width={size} height={size} viewBox={vb} xmlns="http://www.w3.org/2000/svg">
      <circle cx="0" cy="0" r="4" fill={color} opacity="0.8"/>
    </svg>
  );
}

function EnemyBattleCard() {
  const t = useT();
  const hero = useGameStore(s => s.hero);
  const enemy = useGameStore(s => s.currentEnemy);
  const currentFloor = useGameStore(s => s.currentFloor);
  const dungeon = useGameStore(s => s.currentDungeon);
  const combatLog = useGameStore(s => s.combatLog);
  const attackEnemy = useGameStore(s => s.attackEnemy);
  const autoFightEnemy = useGameStore(s => s.autoFightEnemy);
  const exitDungeon = useGameStore(s => s.exitDungeon);

  if (!enemy || !dungeon) return null;

  const enemyHpPct = (enemy.hp / enemy.maxHp) * 100;
  const heroHpPct  = (hero.hp / hero.maxHp) * 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Floor info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ ...PX(6), color: 'var(--gold-main)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ display: 'inline-flex', verticalAlign: 'middle', marginRight: 4 }}>
            <LocationIcon id={dungeon.id} size={14} color="var(--gold-main)" />
          </span>
          {dungeon.name}
        </p>
        <p style={{ ...PX(5), color: 'var(--text-dim)' }}>{t.dungeon.floor(currentFloor, dungeon.floors)}</p>
      </div>

      {/* Enemy */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(20,5,5,0.97), rgba(14,4,4,0.99))',
        border: '1px solid rgba(100,30,30,0.6)',
        padding: 10,
        boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
          <EnemyIcon id={enemy.id} size={64} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ ...PX(10), color: '#c05050', marginBottom: 3 }}>{enemy.name}</p>
            <p style={{ ...PX(5), color: 'var(--text-dim)', marginBottom: 6 }}>{t.dungeon.level} {enemy.level}</p>
            <p style={{ ...PX(6), color: '#903040' }}>{enemy.hp} / {enemy.maxHp} HP</p>
          </div>
        </div>
        <div className="pixel-bar">
          <div className="pixel-bar-fill" style={{ width: `${enemyHpPct}%`, background: 'linear-gradient(90deg, #5a0e0e, #b83030)' }} />
        </div>
      </div>

      {/* Hero HP */}
      <div style={{
        background: 'var(--bg-inset)', border: '1px solid var(--border-dark)',
        padding: 8,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ ...PX(5), color: 'var(--text-dim)' }}>{hero.name}</span>
          <span style={{ ...PX(5), color: 'var(--text-dim)' }}>{hero.hp}/{hero.maxHp} HP</span>
        </div>
        <div className="pixel-bar">
          <div className="pixel-bar-fill hp-fill" style={{ width: `${heroHpPct}%` }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={attackEnemy} className="btn btn-primary" style={{ flex: 1, fontSize: 10 }}>{t.dungeon.attack}</button>
        <button onClick={autoFightEnemy} className="btn btn-secondary" style={{ flex: 1, fontSize: 10 }}>{t.dungeon.quickFight}</button>
        <button onClick={exitDungeon} className="btn btn-danger" aria-label="Exit dungeon" style={{ padding: '8px 14px', fontSize: 10 }}>🚪</button>
      </div>

      <div className="combat-log">
        {combatLog.slice(0, 15).map((log, i) => (
          <p key={i} style={{ color: LOG_COLORS[log.type], marginBottom: 1 }}>{log.message}</p>
        ))}
      </div>
    </div>
  );
}

// ── Icon shapes as inline SVG <g> elements for use inside the main map SVG ─
// Each renders at the node's (cx,cy) with a scale transform so the viewBox
// "-6 -6 12 12" maps to ~8 SVG units on the map.
function MapIcon({ id, cx, cy, color }: { id: string; cx: number; cy: number; color: string }) {
  // scale factor: we want the icon to occupy ~8 units on the map
  // viewBox is 12 wide → scale = 8/12 ≈ 0.667
  const s = 8 / 12;
  const transform = `translate(${cx},${cy}) scale(${s})`;

  if (id === 'forest') return (
    <g transform={transform}>
      <rect x="-5" y="-1.5" width="3" height="4" fill={color} opacity="0.9"/>
      <polygon points="-5,-1.5 -3.5,-3.5 -2,-1.5" fill={color}/>
      <line x1="-4" y1="-2.5" x2="-3.2" y2="-3.5" stroke={color} strokeWidth="0.4" opacity="0.7"/>
      <rect x="-4.2" y="-0.5" width="0.9" height="1" fill="#000" opacity="0.6"/>
      <rect x="-0.5" y="-3.5" width="3.5" height="6" fill={color} opacity="0.8"/>
      <polygon points="-0.5,-3.5 1.25,-5.2 3,-3.5" fill={color}/>
      <rect x="0.3" y="-2.5" width="1" height="1.1" fill="#000" opacity="0.6"/>
      <rect x="0.3" y="-0.9" width="1" height="1.1" fill="#000" opacity="0.6"/>
      <rect x="1.6" y="-2" width="0.8" height="0.8" fill="#000" opacity="0.5"/>
      <line x1="-5.5" y1="2.5" x2="3.5" y2="2.5" stroke={color} strokeWidth="0.5" opacity="0.4"/>
    </g>
  );

  if (id === 'cave') return (
    <g transform={transform}>
      <rect x="-4" y="-3.5" width="8" height="6.5" rx="0.5" fill={color} opacity="0.8"/>
      <rect x="-3.5" y="-3" width="7" height="1.4" rx="0.2" fill="#000" opacity="0.5"/>
      <rect x="-3.5" y="-1.2" width="7" height="1.4" rx="0.2" fill="#000" opacity="0.5"/>
      <rect x="-3.5" y="0.6" width="7" height="1.4" rx="0.2" fill="#000" opacity="0.5"/>
      <circle cx="-2.2" cy="-2.3" r="0.45" fill="#00ffff"/>
      <circle cx="-0.8" cy="-2.3" r="0.45" fill="#00ff88"/>
      <circle cx="0.6" cy="-2.3" r="0.45" fill="#ff4444"/>
      <circle cx="2" cy="-2.3" r="0.45" fill="#00ffff"/>
      <circle cx="-2.2" cy="-0.5" r="0.45" fill="#00ff88"/>
      <circle cx="-0.8" cy="-0.5" r="0.45" fill="#00ffff"/>
      <circle cx="0.6" cy="-0.5" r="0.45" fill="#00ff88"/>
      <rect x="3" y="-3" width="0.8" height="5.5" rx="0.3" fill={color} opacity="0.5"/>
    </g>
  );

  if (id === 'castle') return (
    <g transform={transform}>
      <rect x="-1.5" y="-5.5" width="3" height="8" fill={color} opacity="0.9"/>
      <rect x="-3" y="-1.5" width="6" height="4" fill={color} opacity="0.7"/>
      <rect x="-5" y="1" width="10" height="1.5" fill={color} opacity="0.5"/>
      <rect x="-0.8" y="-4.5" width="1.6" height="0.9" fill="#000" opacity="0.6"/>
      <rect x="-0.8" y="-3.2" width="1.6" height="0.9" fill="#000" opacity="0.6"/>
      <rect x="-0.8" y="-1.9" width="1.6" height="0.9" fill="#000" opacity="0.6"/>
      <rect x="-2.3" y="-0.8" width="1" height="1" fill="#000" opacity="0.5"/>
      <rect x="1.3" y="-0.8" width="1" height="1" fill="#000" opacity="0.5"/>
      <line x1="0" y1="-5.5" x2="0" y2="-6" stroke={color} strokeWidth="0.5"/>
      <circle cx="0" cy="-6.2" r="0.3" fill={color}/>
    </g>
  );

  if (id === 'westland') return (
    <g transform={transform}>
      <ellipse cx="0" cy="-1" rx="3.8" ry="3.2" fill={color} opacity="0.9"/>
      <ellipse cx="-1.5" cy="-1.8" rx="1.2" ry="1.1" fill="#000" opacity="0.8"/>
      <ellipse cx="1.5" cy="-1.8" rx="1.2" ry="1.1" fill="#000" opacity="0.8"/>
      <polygon points="0,-0.5 -0.5,0.5 0.5,0.5" fill="#000" opacity="0.7"/>
      <rect x="-3" y="1.6" width="6" height="1.4" rx="0.3" fill={color} opacity="0.9"/>
      <line x1="-2" y1="1.6" x2="-2" y2="3" stroke="#000" strokeWidth="0.6" opacity="0.7"/>
      <line x1="-0.8" y1="1.6" x2="-0.8" y2="3" stroke="#000" strokeWidth="0.6" opacity="0.7"/>
      <line x1="0.4" y1="1.6" x2="0.4" y2="3" stroke="#000" strokeWidth="0.6" opacity="0.7"/>
      <line x1="1.6" y1="1.6" x2="1.6" y2="3" stroke="#000" strokeWidth="0.6" opacity="0.7"/>
    </g>
  );

  if (id === 'dragon_lair') return (
    <g transform={transform}>
      <rect x="-4.5" y="-0.5" width="9" height="4" fill={color} opacity="0.9"/>
      <rect x="-4.5" y="-3" width="2.2" height="2.5" fill={color} opacity="0.9"/>
      <rect x="-1.5" y="-3" width="2.2" height="2.5" fill={color} opacity="0.9"/>
      <rect x="2.3" y="-3" width="2.2" height="2.5" fill={color} opacity="0.9"/>
      <path d="M -1.2 3.5 L -1.2 1 Q -1.2 -0.5 0 -0.5 Q 1.2 -0.5 1.2 1 L 1.2 3.5" fill="#000" opacity="0.7"/>
      <rect x="-3.5" y="-0.2" width="1.4" height="0.8" fill="#000" opacity="0.5"/>
      <rect x="2.1" y="-0.2" width="1.4" height="0.8" fill="#000" opacity="0.5"/>
      <rect x="-0.35" y="-2.2" width="0.7" height="1.2" fill="#000" opacity="0.5"/>
    </g>
  );

  if (id === 'neon_undercity') return (
    <g transform={transform}>
      <path d="M -5 3 L -5 0 Q -5 -6 0 -6 Q 5 -6 5 0 L 5 3" fill="none" stroke={color} strokeWidth="1.3" opacity="0.9"/>
      <path d="M -3.2 3 L -3.2 0.3 Q -3.2 -3.8 0 -3.8 Q 3.2 -3.8 3.2 0.3 L 3.2 3" fill="none" stroke={color} strokeWidth="0.8" opacity="0.6"/>
      <line x1="-5" y1="3" x2="5" y2="3" stroke={color} strokeWidth="0.9"/>
      <circle cx="0" cy="-2" r="1" fill={color} opacity="0.9"/>
      <circle cx="0" cy="-2" r="0.5" fill="#ffffff" opacity="0.9"/>
      <line x1="-2.5" y1="2" x2="2.5" y2="2" stroke={color} strokeWidth="0.5" opacity="0.7"/>
      <line x1="-3.5" y1="1" x2="-3.5" y2="3" stroke={color} strokeWidth="0.4" opacity="0.5"/>
      <line x1="3.5" y1="1" x2="3.5" y2="3" stroke={color} strokeWidth="0.4" opacity="0.5"/>
    </g>
  );

  if (id === 'zero_zone') return (
    <g transform={transform}>
      <circle cx="0" cy="0" r="4.5" fill="none" stroke={color} strokeWidth="0.9" opacity="0.9"/>
      <circle cx="0" cy="0" r="2.2" fill="none" stroke={color} strokeWidth="0.6" opacity="0.7"/>
      <line x1="-5.5" y1="0" x2="-2.8" y2="0" stroke={color} strokeWidth="0.7" opacity="0.9"/>
      <line x1="2.8" y1="0" x2="5.5" y2="0" stroke={color} strokeWidth="0.7" opacity="0.9"/>
      <line x1="0" y1="-5.5" x2="0" y2="-2.8" stroke={color} strokeWidth="0.7" opacity="0.9"/>
      <line x1="0" y1="2.8" x2="0" y2="5.5" stroke={color} strokeWidth="0.7" opacity="0.9"/>
      <circle cx="0" cy="0" r="0.8" fill={color} opacity="0.95"/>
      <line x1="-4.5" y1="-1" x2="-4.5" y2="1" stroke={color} strokeWidth="0.5" opacity="0.5"/>
      <line x1="4.5" y1="-1" x2="4.5" y2="1" stroke={color} strokeWidth="0.5" opacity="0.5"/>
    </g>
  );

  if (id === 'ghost_network') return (
    <g transform={transform}>
      <path d="M -3.5 4 L -3.5 -1 Q -3.5 -5.5 0 -5.5 Q 3.5 -5.5 3.5 -1 L 3.5 4 L 2 2.5 L 0.5 4 L -1 2.5 L -2.5 4 Z" fill={color} opacity="0.85"/>
      <ellipse cx="-1.3" cy="-1.5" rx="1" ry="1.1" fill="#000" opacity="0.7"/>
      <ellipse cx="1.3" cy="-1.5" rx="1" ry="1.1" fill="#000" opacity="0.7"/>
      <circle cx="-1.3" cy="-1.5" r="0.4" fill={color} opacity="0.5"/>
      <circle cx="1.3" cy="-1.5" r="0.4" fill={color} opacity="0.5"/>
      <line x1="-4.5" y1="-3" x2="-3.5" y2="-2" stroke={color} strokeWidth="0.5" opacity="0.5"/>
      <line x1="4.5" y1="-3" x2="3.5" y2="-2" stroke={color} strokeWidth="0.5" opacity="0.5"/>
      <circle cx="-4.8" cy="-3.4" r="0.5" fill={color} opacity="0.6"/>
      <circle cx="4.8" cy="-3.4" r="0.5" fill={color} opacity="0.6"/>
    </g>
  );

  // fallback
  return <circle cx={cx} cy={cy} r="4" fill={color} opacity="0.8"/>;
}

function isDungeonUnlocked(_dungeon: Dungeon, index: number, completedDungeons: string[]): boolean {
  if (index === 0) return true;
  const prev = ALL_DUNGEONS[index - 1];
  return completedDungeons.includes(prev.id);
}

function DungeonList() {
  const t = useT();
  const lang = useLangStore(s => s.lang);
  const isEn = lang === 'en';
  const hero         = useGameStore(s => s.hero);
  const enterDungeon = useGameStore(s => s.enterDungeon);
  const isResting    = (hero.restingUntil !== null && Date.now() < hero.restingUntil) ||
                       (hero.voluntaryRestUntil !== null && Date.now() < hero.voluntaryRestUntil);
  const limitReached = hero.dungeonRunsToday >= MAX_DAILY_DUNGEONS;

  const completedDungeons = hero.completedDungeons ?? [];
  const lastUnlocked = ALL_DUNGEONS.reduce<Dungeon | null>((acc, d, i) =>
    isDungeonUnlocked(d, i, completedDungeons) ? d : acc, null);
  const defaultDungeon = lastUnlocked ?? (ALL_DUNGEONS.length > 0 ? ALL_DUNGEONS[0] : null);

  const [selectedDungeon, setSelectedDungeon] = useState<Dungeon | null>(defaultDungeon);
  const [difficulty, setDifficulty] = useState<DungeonDifficulty>('normal');

  const chosenDungeon = selectedDungeon ?? defaultDungeon;
  const chosenIdx = chosenDungeon ? ALL_DUNGEONS.findIndex(d => d.id === chosenDungeon.id) : -1;
  const chosenIsUnlocked = chosenDungeon ? isDungeonUnlocked(chosenDungeon, chosenIdx, completedDungeons) : true;
  const blocked = isResting || limitReached || !chosenIsUnlocked;
  const chosen = chosenDungeon;

  const DIFFICULTY_OPTIONS: DifficultyOption[] = [
    { key: 'easy',   label: t.dungeon.diffEasy,   badge: '🌿', desc: t.dungeon.diffEasyDesc,   color: '#44cc77', border: 'rgba(68,204,119,0.4)' },
    { key: 'normal', label: t.dungeon.diffNormal,  badge: '⚔',  desc: t.dungeon.diffNormalDesc, color: '#aaaaaa', border: 'rgba(160,160,160,0.3)' },
    { key: 'hard',   label: t.dungeon.diffHard,    badge: '💀', desc: t.dungeon.diffHardDesc,   color: '#ff4444', border: 'rgba(255,68,68,0.45)'  },
  ];
  const DUNGEON_VARIANTS: DungeonVariant[] = [
    { key: 'xp',       label: t.dungeon.modeTraining, badge: '⚡', desc: t.dungeon.modeTrainingDesc, color: '#4488ff', bg: 'linear-gradient(135deg,rgba(20,30,60,0.97),rgba(10,18,50,0.99))', border: 'rgba(68,136,255,0.35)',  glow: 'rgba(68,136,255,0.08)' },
    { key: 'balanced', label: t.dungeon.modePatrol,   badge: '⚖',  desc: t.dungeon.modePatrolDesc,   color: '#aaaaaa', bg: 'linear-gradient(135deg,rgba(20,20,25,0.97),rgba(12,12,18,0.99))', border: 'rgba(160,160,160,0.2)',  glow: 'rgba(160,160,160,0.04)' },
    { key: 'loot',     label: t.dungeon.modeLoot,     badge: '💎', desc: t.dungeon.modeLootDesc,      color: '#cc44ff', bg: 'linear-gradient(135deg,rgba(35,10,55,0.97),rgba(22,5,40,0.99))',  border: 'rgba(200,68,255,0.35)', glow: 'rgba(200,68,255,0.08)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ ...PX(10), color: 'var(--gold-main)', textShadow: '0 0 10px var(--gold-glow)' }}>{t.dungeon.title}</p>
        <p style={{ ...PX(5), color: limitReached ? 'var(--hp-bright)' : 'var(--text-dim)' }}>
          {hero.dungeonRunsToday}/{MAX_DAILY_DUNGEONS} {t.dungeon.today}
        </p>
      </div>

      {isResting && (
        <div style={{ background: 'rgba(8,12,20,0.95)', border: '1px solid rgba(30,50,80,0.5)', padding: 8, textAlign: 'center' }}>
          <p style={{ ...PX(6), color: '#5070a0' }}>{t.dungeon.resting}</p>
        </div>
      )}
      {!isResting && limitReached && (
        <div style={{ background: 'rgba(16,6,6,0.95)', border: '1px solid rgba(80,20,20,0.5)', padding: 8, textAlign: 'center' }}>
          <p style={{ ...PX(6), color: 'var(--hp-bright)' }}>{t.dungeon.limitReached}</p>
        </div>
      )}

      {/* ── WORLD MAP ─────────────────────────────── */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(180deg, #06030d 0%, #0a0518 100%)',
        border: '1px solid rgba(185,77,255,0.22)',
        boxShadow: '0 0 30px rgba(185,77,255,0.06) inset',
        overflow: 'hidden',
      }}>
        {/* map title */}
        <div style={{ position: 'absolute', top: 8, left: 10, zIndex: 2, pointerEvents: 'none' }}>
          <p style={{ ...PX(5), color: '#ff2d78', textShadow: '0 0 8px rgba(255,45,120,0.7)', letterSpacing: 3 }}>NEON-WARSZAWA 2087</p>
        </div>

        <svg viewBox="0 0 100 68" style={{ display: 'block', width: '100%' }}>
          <defs>
            {/* base grid — coarse 8-unit lines */}
            <pattern id="mapgrid8" width="8" height="8" patternUnits="userSpaceOnUse">
              <path d="M 8 0 L 0 0 0 8" fill="none" stroke="rgba(100,60,160,0.12)" strokeWidth="0.4"/>
            </pattern>
            {/* fine 2-unit grid */}
            <pattern id="mapgrid2" width="2" height="2" patternUnits="userSpaceOnUse">
              <path d="M 2 0 L 0 0 0 2" fill="none" stroke="rgba(185,77,255,0.035)" strokeWidth="0.15"/>
            </pattern>
            {/* atmospheric gradient */}
            <linearGradient id="atmoGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a0535" stopOpacity="0.7"/>
              <stop offset="100%" stopColor="#06030d" stopOpacity="0"/>
            </linearGradient>
            {/* fog at bottom */}
            <linearGradient id="fogGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(6,3,13,0)" stopOpacity="0"/>
              <stop offset="100%" stopColor="#06030d" stopOpacity="0.7"/>
            </linearGradient>
            {/* glow filters */}
            <filter id="glow-pink" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.5" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="glow-gold" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.2" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* background layers */}
          <rect width="100" height="68" fill="url(#mapgrid2)"/>
          <rect width="100" height="68" fill="url(#mapgrid8)"/>
          {/* atmospheric tint at top */}
          <rect width="100" height="30" fill="url(#atmoGrad)"/>

          {/* district zone highlights */}
          {/* Slumsy — reddish near forest (12,57) */}
          <polygon points="2,48 24,48 28,68 0,68" fill="rgba(220,60,60,0.07)"/>
          {/* Tech Podziemia — blue near cave (34,44) */}
          <polygon points="20,36 46,36 50,54 16,54" fill="rgba(60,120,220,0.07)"/>
          {/* Corp HQ — greenish near castle (58,30) */}
          <polygon points="44,20 70,20 74,42 40,42" fill="rgba(60,200,100,0.06)"/>
          {/* Pustkowia — orange near westland (44,16) */}
          <polygon points="28,4 60,4 64,28 24,28" fill="rgba(220,130,40,0.07)"/>
          {/* Twierdza — purple near dragon_lair (80,8) */}
          <polygon points="66,0 100,0 100,20 62,20" fill="rgba(140,60,220,0.07)"/>
          {/* Neon Undercity — cyan near neon_undercity (88,30) */}
          <polygon points="74,18 100,18 100,44 70,44" fill="rgba(0,200,220,0.06)"/>

          {/* city silhouette — back layer (taller, narrower) */}
          <rect x="0" y="52" width="100" height="16" fill="rgba(10,5,20,0.5)"/>
          {[3,9,15,22,30,38,46,54,62,70,78,86,93].map((x, i) => (
            <rect key={`bg-${i}`} x={x} y={38 + (i % 4) * 3} width={1.5 + (i % 3)} height={14 + (i % 5) * 4} fill="rgba(20,6,40,0.55)"/>
          ))}
          {/* city silhouette — front layer (wider, shorter) */}
          {[1,6,12,19,26,33,40,47,55,63,71,79,87,94].map((x, i) => (
            <rect key={`fg-${i}`} x={x} y={46 + (i % 3) * 2} width={2.5 + (i % 4)} height={8 + (i % 4) * 2} fill="rgba(30,10,50,0.65)"/>
          ))}

          {/* fog overlay at bottom third */}
          <rect x="0" y="45" width="100" height="23" fill="url(#fogGrad)"/>

          {/* Connection lines — outer glow */}
          {CONNECTIONS.map(([a, b]) => {
            const p1 = NODE_POS[a];
            const p2 = NODE_POS[b];
            if (!p1 || !p2) return null;
            return (
              <line key={`outer-${a}-${b}`}
                x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                stroke="rgba(255,200,58,0.15)"
                strokeWidth="1.8"
              />
            );
          })}
          {/* Connection lines — inner animated dashes */}
          {CONNECTIONS.map(([a, b]) => {
            const p1 = NODE_POS[a];
            const p2 = NODE_POS[b];
            if (!p1 || !p2) return null;
            return (
              <line key={`inner-${a}-${b}`}
                x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                stroke="rgba(255,200,58,0.55)"
                strokeWidth="0.7"
                strokeDasharray="2.5 4"
                style={{ animation: 'mapFlow 1.8s linear infinite' }}
              />
            );
          })}

          {/* Nodes */}
          {ALL_DUNGEONS.map((d, idx) => {
            const pos = NODE_POS[d.id];
            if (!pos) return null;
            const isChosen = chosen?.id === d.id;
            const isUnlocked = isDungeonUnlocked(d, idx, completedDungeons);
            const col = isChosen ? '#ff2d78' : isUnlocked ? '#ffc83a' : '#555577';
            return (
              <g key={d.id}
                onClick={() => setSelectedDungeon(d)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true })); }}
                style={{ cursor: 'pointer', outline: 'none' }}
              >
                {/* outer glow ring */}
                <circle cx={pos.x} cy={pos.y} r={6.5} fill="none"
                  stroke={isChosen ? '#ff2d78' : isUnlocked ? '#ffc83a' : '#555577'} strokeWidth="0.4" opacity={isChosen ? 0.8 : isUnlocked ? 0.4 : 0.25}
                />
                {/* hexagonal background */}
                <polygon
                  points={hexPoints(pos.x, pos.y, 5.2)}
                  fill={isChosen ? 'rgba(255,45,120,0.2)' : isUnlocked ? 'rgba(255,200,58,0.1)' : 'rgba(40,40,60,0.3)'}
                  stroke={col}
                  strokeWidth={isChosen ? 0.9 : 0.6}
                  filter={isChosen ? 'url(#glow-pink)' : isUnlocked ? 'url(#glow-gold)' : 'none'}
                  opacity={isUnlocked ? 1 : 0.55}
                />
                {/* location icon inline (no foreignObject) */}
                <g opacity={isUnlocked ? 1 : 0.35}>
                  <MapIcon id={d.id} cx={pos.x} cy={pos.y} color={col} />
                </g>
                {/* lock icon for locked dungeons */}
                {!isUnlocked && (
                  <g transform={`translate(${pos.x + 3.2},${pos.y - 3.2})`}>
                    <circle cx="0" cy="0" r="2.2" fill="rgba(10,5,20,0.85)" stroke="#555577" strokeWidth="0.5"/>
                    <text textAnchor="middle" dominantBaseline="central" fontSize="2.5" style={{ pointerEvents: 'none' }}>🔒</text>
                  </g>
                )}
                {/* name */}
                <text x={pos.x} y={pos.y + 8.5} textAnchor="middle"
                  fill={isChosen ? '#ff2d78' : isUnlocked ? '#e2e8f0' : '#555577'}
                  fontSize="1.8" fontFamily="'Share Tech Mono',monospace" letterSpacing="0.1"
                  style={{ pointerEvents: 'none' }}>
                  {(() => { const n = isEn ? (d as typeof d & { nameEn?: string }).nameEn ?? d.name : d.name; return n.length > 16 ? n.slice(0, 14) + '…' : n; })()}
                </text>
                {/* level */}
                <text x={pos.x} y={pos.y - 7.5} textAnchor="middle"
                  fill={isChosen ? '#ff8ab0' : isUnlocked ? '#ffc83a' : '#555577'}
                  fontSize="1.7" fontFamily="'VT323',monospace"
                  style={{ pointerEvents: 'none' }}>
                  {t.dungeon.level}{d.minLevel}
                </text>
              </g>
            );
          })}
        </svg>

        {/* legend */}
        <div style={{ display: 'flex', gap: 14, padding: '6px 10px', borderTop: '1px solid rgba(185,77,255,0.12)', flexWrap: 'wrap' }}>
          {[
            { col: '#ff2d78', label: t.dungeon.selected },
            { col: '#ffc83a', label: t.dungeon.available },
          ].map(({ col, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: col, boxShadow: `0 0 5px ${col}` }}/>
              <span style={{ ...MONO, fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── SELECTED DUNGEON DETAILS ─────────────── */}
      {chosen && (
        <>
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            background: 'rgba(255,45,120,0.04)', border: '1px solid rgba(255,45,120,0.2)',
            padding: '10px 12px',
          }}>
            <div style={{ flexShrink: 0, width: 48, height: 48 }}>
              <LocationIcon id={chosen.id} size={48} color="#ff2d78" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ ...ORB, fontSize: 10, color: '#ff2d78', textShadow: '0 0 8px rgba(255,45,120,0.4)', marginBottom: 3 }}>
                {isEn ? (chosen as typeof chosen & { nameEn?: string }).nameEn ?? chosen.name : chosen.name}
              </p>
              <p style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', marginBottom: 3 }}>
                {isEn ? (chosen as typeof chosen & { descEn?: string }).descEn ?? chosen.description : chosen.description}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ ...MONO, fontSize: 10, color: 'var(--text-muted)' }}>{chosen.floors} {t.dungeon.floors}</span>
                <span style={{ ...MONO, fontSize: 10, color: '#ffc83a' }}>{t.dungeon.level}{chosen.minLevel}</span>
              </div>
            </div>
          </div>

          {/* Difficulty selector */}
          <div>
            <p style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', marginBottom: 6, letterSpacing: '0.08em' }}>{t.dungeon.difficultyLabel}</p>
            <div style={{ display: 'flex', gap: 6 }}>
              {DIFFICULTY_OPTIONS.map(d => {
                const active = difficulty === d.key;
                return (
                  <button key={d.key} onClick={() => setDifficulty(d.key)} style={{
                    flex: 1,
                    background: active ? `rgba(${d.key === 'easy' ? '68,204,119' : d.key === 'hard' ? '255,68,68' : '160,160,160'},0.12)` : 'var(--bg-inset)',
                    border: `1px solid ${active ? d.border : 'var(--border-dark)'}`,
                    padding: '7px 4px', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                    boxShadow: active ? `0 0 10px ${d.border}` : 'none',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}>
                    <span style={{ fontSize: 14 }}>{d.badge}</span>
                    <span style={{ ...ORB, fontSize: 10, color: active ? d.color : 'var(--text-dim)' }}>{d.label}</span>
                  </button>
                );
              })}
            </div>
            <p style={{ ...MONO, fontSize: 10, color: 'var(--text-muted)', marginTop: 5 }}>
              {DIFFICULTY_OPTIONS.find(d => d.key === difficulty)?.desc}
            </p>
          </div>

          {/* Locked dungeon notice */}
          {!chosenIsUnlocked && chosenIdx > 0 && (
            <div style={{
              background: 'rgba(40,20,60,0.6)', border: '1px solid rgba(85,85,119,0.5)',
              padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 20 }}>🔒</span>
              <div>
                <p style={{ ...ORB, fontSize: 10, color: '#8888aa', marginBottom: 3 }}>{isEn ? 'LOCATION LOCKED' : 'LOKACJA ZABLOKOWANA'}</p>
                <p style={{ ...MONO, fontSize: 10, color: 'var(--text-muted)' }}>
                  {isEn ? <>Complete <span style={{ color: '#ffc83a' }}>{(ALL_DUNGEONS[chosenIdx - 1] as typeof ALL_DUNGEONS[0] & { nameEn?: string }).nameEn ?? ALL_DUNGEONS[chosenIdx - 1].name}</span> on Normal or Hard</>
                    : <>Ukończ <span style={{ color: '#ffc83a' }}>{ALL_DUNGEONS[chosenIdx - 1].name}</span> na poziomie Normal lub Hard</>}
                </p>
              </div>
            </div>
          )}

          {/* Mode cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {DUNGEON_VARIANTS.map(v => (
              <div key={v.key} style={{
                background: v.bg, border: `1px solid ${v.border}`,
                padding: '10px 12px', boxShadow: `0 0 16px ${v.glow}`,
                display: 'flex', alignItems: 'center', gap: 10,
                opacity: blocked ? 0.5 : 1,
              }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{v.badge}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ ...ORB, fontSize: 10, color: v.color, marginBottom: 3 }}>{v.label}</p>
                  <p style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)' }}>{v.desc}</p>
                </div>
                <button
                  onClick={() => enterDungeon(chosen, v.key, difficulty)}
                  disabled={blocked}
                  className="btn btn-primary"
                  style={{ fontSize: 10, padding: '7px 10px', flexShrink: 0, cursor: blocked ? 'not-allowed' : 'pointer', borderColor: v.border }}
                >
                  {!chosenIsUnlocked ? '🔒' : isResting ? t.dungeon.rest : limitReached ? t.dungeon.limit : t.dungeon.enter}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function DungeonPanel() {
  const t = useT();
  const currentDungeon    = useGameStore(s => s.currentDungeon);
  const currentEnemy      = useGameStore(s => s.currentEnemy);
  const inCombat          = useGameStore(s => s.inCombat);
  const currentFloor      = useGameStore(s => s.currentFloor);
  const exitDungeon       = useGameStore(s => s.exitDungeon);
  const combatLog         = useGameStore(s => s.combatLog);
  const defeatedAtDungeon = useGameStore(s => s.defeatedAtDungeon);
  const clearDefeat       = useGameStore(s => s.clearDefeat);

  if (defeatedAtDungeon) {
    return (
      <div className="card p-3" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{
          textAlign: 'center', padding: '20px 0',
          background: 'linear-gradient(135deg, rgba(30,4,4,0.97), rgba(18,2,2,0.99))',
          border: '1px solid rgba(120,20,20,0.6)',
          boxShadow: 'inset 0 2px 12px rgba(0,0,0,0.6)',
        }}>
          <p style={{ fontSize: 40, marginBottom: 10 }}>💀</p>
          <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 11, color: 'var(--hp-bright)', textShadow: '0 0 16px #ff000066', marginBottom: 10 }}>
            {t.dungeon.defeated}
          </p>
          <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: 'var(--text-dim)', marginBottom: 6 }}>
            {defeatedAtDungeon}
          </p>
          <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: '#5070a0', lineHeight: 1.8 }}>
            {t.dungeon.mustRest}<br />{t.dungeon.recoverLife}
          </p>
        </div>
        <div className="combat-log">
          {combatLog.slice(0, 8).map((log, i) => (
            <p key={i} style={{ color: LOG_COLORS[log.type], marginBottom: 1 }}>{log.message}</p>
          ))}
        </div>
        <button onClick={clearDefeat} className="btn btn-secondary" style={{ width: '100%', fontSize: 10 }}>
          {t.dungeon.backToCity}
        </button>
      </div>
    );
  }

  if (currentDungeon && !inCombat) {
    return (
      <div className="card p-3" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <p style={{ fontSize: 32, marginBottom: 8 }}>🏆</p>
          <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: 'var(--gold-bright)', textShadow: '0 0 12px var(--gold-glow)', marginBottom: 6 }}>
            {t.dungeon.opComplete}
          </p>
          <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: 'var(--text-dim)' }}>
            {currentDungeon.name} — {currentFloor - 1} {t.dungeon.floors}
          </p>
        </div>
        <div className="combat-log">
          {combatLog.slice(0, 10).map((log, i) => (
            <p key={i} style={{ color: LOG_COLORS[log.type], marginBottom: 1 }}>{log.message}</p>
          ))}
        </div>
        <button onClick={exitDungeon} className="btn btn-primary" style={{ width: '100%', fontSize: 10 }}>
          {t.dungeon.backToCity2}
        </button>
      </div>
    );
  }

  return (
    <div className="card p-3">
      {inCombat && currentEnemy ? <EnemyBattleCard /> : <DungeonList />}
    </div>
  );
}
