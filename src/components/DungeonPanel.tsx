import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { MAX_DAILY_DUNGEONS } from '../store/gameStore';
import { ALL_DUNGEONS } from '../data/dungeons';
import EnemyIcon from './EnemyIcon';
import { useT } from '../hooks/useT';
import { useLangStore } from '../store/langStore';
import { syncToCloud } from '../lib/cloudSync';
import { useAuthStore } from '../store/authStore';
import { PX, MONO, ORB } from '../utils/styles';
import DungeonMapView from './DungeonMapView';
const LOG_COLORS = { hero: '#5a9040', enemy: '#903040', loot: '#9c7a3c', system: '#7a7060' };

type DungeonMode = 'xp' | 'balanced' | 'loot';
type DungeonDifficulty = 'easy' | 'normal' | 'hard';

type DifficultyOption = { key: DungeonDifficulty; label: string; badge: string; desc: string; color: string; border: string };
type DungeonVariant = { key: DungeonMode; label: string; badge: string; desc: string; color: string; bg: string; border: string; glow: string };

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

  if (id === 'sewers') {
    return (
      <svg width={size} height={size} viewBox={vb} xmlns="http://www.w3.org/2000/svg" overflow="visible">
        {/* pionowa rura */}
        <rect x="-5" y="-5.5" width="2.5" height="9" fill={color} opacity="0.85"/>
        {/* pozioma rura */}
        <rect x="-5" y="-1" width="10" height="2.2" fill={color} opacity="0.85"/>
        {/* złącze lewe */}
        <circle cx="-3.8" cy="-0.1" r="1.4" fill={color}/>
        {/* złącze prawe */}
        <circle cx="3.5" cy="-0.1" r="1.4" fill={color}/>
        {/* kapie */}
        <circle cx="3.5" cy="2.8" r="0.7" fill={color} opacity="0.7"/>
        <line x1="3.5" y1="1.3" x2="3.5" y2="2.3" stroke={color} strokeWidth="0.5" opacity="0.5"/>
      </svg>
    );
  }

  if (id === 'biotech_lab') {
    return (
      <svg width={size} height={size} viewBox={vb} xmlns="http://www.w3.org/2000/svg" overflow="visible">
        {/* szyjka kolby */}
        <rect x="-0.7" y="-6" width="1.4" height="3.5" fill={color} opacity="0.9"/>
        {/* kolba */}
        <path d="M -2.2 -2.5 Q -4.5 0.5 -4 3 Q -3.5 5 0 5 Q 3.5 5 4 3 Q 4.5 0.5 2.2 -2.5 Z" fill={color} opacity="0.7"/>
        {/* bąbelki */}
        <circle cx="-1.5" cy="1" r="0.7" fill={color} opacity="0.9"/>
        <circle cx="1.5" cy="2.5" r="0.7" fill={color} opacity="0.9"/>
        <circle cx="0" cy="0.2" r="0.5" fill={color} opacity="0.9"/>
        {/* DNA spirala lewa */}
        <path d="M -0.8 -2.5 C -3 -1 -3 0 -0.8 1" fill="none" stroke={color} strokeWidth="0.5" opacity="0.5"/>
        {/* DNA spirala prawa */}
        <path d="M 0.8 -2.5 C 3 -1 3 0 0.8 1" fill="none" stroke={color} strokeWidth="0.5" opacity="0.5"/>
      </svg>
    );
  }

  if (id === 'corrupted_matrix') {
    return (
      <svg width={size} height={size} viewBox={vb} xmlns="http://www.w3.org/2000/svg" overflow="visible">
        {/* glitched pixel blocks */}
        <rect x="-5" y="-5.5" width="2.2" height="1.5" fill={color}/>
        <rect x="-1.5" y="-5.5" width="3.5" height="1.5" fill={color} opacity="0.55"/>
        <rect x="2.5" y="-5.5" width="2.5" height="1.5" fill={color}/>
        <rect x="-5" y="-2.8" width="4.5" height="1.5" fill={color} opacity="0.35"/>
        <rect x="0.5" y="-2.8" width="2.2" height="1.5" fill={color}/>
        <rect x="-5" y="-0.2" width="1.8" height="1.5" fill={color}/>
        <rect x="-2" y="-0.2" width="5" height="1.5" fill={color} opacity="0.7"/>
        <rect x="-5" y="2.5" width="3.2" height="1.5" fill={color} opacity="0.4"/>
        <rect x="-0.5" y="2.5" width="5.5" height="1.5" fill={color}/>
      </svg>
    );
  }

  if (id === 'system_core') {
    return (
      <svg width={size} height={size} viewBox={vb} xmlns="http://www.w3.org/2000/svg" overflow="visible">
        {/* chip body */}
        <rect x="-3.5" y="-3.5" width="7" height="7" fill={color} opacity="0.8"/>
        {/* circuit inside */}
        <rect x="-2" y="-2" width="4" height="4" fill="#000" opacity="0.55"/>
        <circle cx="0" cy="0" r="1" fill={color} opacity="0.9"/>
        {/* pins left */}
        <rect x="-5.5" y="-2.5" width="2" height="0.8" fill={color}/>
        <rect x="-5.5" y="-0.4" width="2" height="0.8" fill={color}/>
        <rect x="-5.5" y="1.7" width="2" height="0.8" fill={color}/>
        {/* pins right */}
        <rect x="3.5" y="-2.5" width="2" height="0.8" fill={color}/>
        <rect x="3.5" y="-0.4" width="2" height="0.8" fill={color}/>
        <rect x="3.5" y="1.7" width="2" height="0.8" fill={color}/>
        {/* pins top */}
        <rect x="-2.5" y="-5.5" width="0.8" height="2" fill={color}/>
        <rect x="-0.4" y="-5.5" width="0.8" height="2" fill={color}/>
        <rect x="1.7" y="-5.5" width="0.8" height="2" fill={color}/>
      </svg>
    );
  }

  if (id === 'apocalypse_zone') {
    return (
      <svg width={size} height={size} viewBox={vb} xmlns="http://www.w3.org/2000/svg" overflow="visible">
        {/* base fireball */}
        <circle cx="0" cy="1" r="3.8" fill={color} opacity="0.6"/>
        {/* top spike */}
        <polygon points="0,-6 1.1,-2 -1.1,-2" fill={color} opacity="0.95"/>
        {/* left spike */}
        <polygon points="-5.5,-2.5 -2,-0.8 -3,1.5" fill={color} opacity="0.75"/>
        {/* right spike */}
        <polygon points="5.5,-2.5 2,-0.8 3,1.5" fill={color} opacity="0.75"/>
        {/* lower left */}
        <polygon points="-4,4.5 -1,2.2 -2,5.5" fill={color} opacity="0.5"/>
        {/* lower right */}
        <polygon points="4,4.5 1,2.2 2,5.5" fill={color} opacity="0.5"/>
        {/* hot center */}
        <circle cx="0" cy="1" r="1.8" fill={color} opacity="0.95"/>
      </svg>
    );
  }

  if (id === 'void_nexus') {
    return (
      <svg width={size} height={size} viewBox={vb} xmlns="http://www.w3.org/2000/svg" overflow="visible">
        {/* outer ring */}
        <circle cx="0" cy="0" r="5.5" fill="none" stroke={color} strokeWidth="0.9" opacity="0.9"/>
        {/* mid ring */}
        <circle cx="0" cy="0" r="3.8" fill="none" stroke={color} strokeWidth="0.6" opacity="0.7"/>
        {/* inner ring */}
        <circle cx="0" cy="0" r="2.2" fill="none" stroke={color} strokeWidth="0.5" opacity="0.55"/>
        {/* center eye */}
        <circle cx="0" cy="0" r="1" fill={color} opacity="0.95"/>
        {/* spiral arms */}
        <path d="M 0 -3.8 Q 2.2 -2 3.8 0" fill="none" stroke={color} strokeWidth="0.6" opacity="0.55"/>
        <path d="M 0 3.8 Q -2.2 2 -3.8 0" fill="none" stroke={color} strokeWidth="0.6" opacity="0.55"/>
        <path d="M 3.8 0 Q 2 2.5 0 3.8" fill="none" stroke={color} strokeWidth="0.4" opacity="0.35"/>
      </svg>
    );
  }

  if (id === 'network_end') {
    return (
      <svg width={size} height={size} viewBox={vb} xmlns="http://www.w3.org/2000/svg" overflow="visible">
        {/* terminal frame */}
        <rect x="-5.5" y="-5.5" width="11" height="8.5" rx="0.5" fill={color} opacity="0.75"/>
        <rect x="-4.5" y="-4.5" width="9" height="6.5" fill="#000" opacity="0.8"/>
        {/* skull */}
        <ellipse cx="0" cy="-1.8" rx="2.8" ry="2.3" fill={color} opacity="0.85"/>
        <ellipse cx="-1.1" cy="-2.3" rx="0.85" ry="0.9" fill="#000" opacity="0.9"/>
        <ellipse cx="1.1" cy="-2.3" rx="0.85" ry="0.9" fill="#000" opacity="0.9"/>
        <rect x="-2.2" y="0.2" width="4.4" height="1.2" rx="0.3" fill={color} opacity="0.85"/>
        <line x1="-1.5" y1="0.2" x2="-1.5" y2="1.4" stroke="#000" strokeWidth="0.5"/>
        <line x1="-0.3" y1="0.2" x2="-0.3" y2="1.4" stroke="#000" strokeWidth="0.5"/>
        <line x1="0.9" y1="0.2" x2="0.9" y2="1.4" stroke="#000" strokeWidth="0.5"/>
        {/* base stand */}
        <rect x="-2" y="3.5" width="4" height="0.9" fill={color} opacity="0.65"/>
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
  const battleUser  = useAuthStore(s => s.user);
  const handleFleeExit = () => {
    exitDungeon();
    if (battleUser) syncToCloud(battleUser.uid, battleUser.username).catch(() => {});
  };

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
            <p style={{ ...PX(5), color: 'var(--text-dim)', marginBottom: 6 }}>{t.dungeon.level} {hero.level}</p>
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
        <button onClick={handleFleeExit} className="btn btn-danger" aria-label="Exit dungeon" style={{ padding: '8px 14px', fontSize: 10 }}>🚪</button>
      </div>

      <div className="combat-log">
        {combatLog.slice(0, 15).map((log, i) => (
          <p key={i} style={{ color: LOG_COLORS[log.type], marginBottom: 1 }}>{log.message}</p>
        ))}
      </div>
    </div>
  );
}

type FullDungeon = (typeof ALL_DUNGEONS)[0];

function DungeonList() {
  const t = useT();
  const lang = useLangStore(s => s.lang);
  const isEn = lang === 'en';
  const hero         = useGameStore(s => s.hero);
  const enterDungeon = useGameStore(s => s.enterDungeon);
  const isResting    = (hero.restingUntil !== null && Date.now() < hero.restingUntil) ||
                       (hero.voluntaryRestUntil !== null && Date.now() < hero.voluntaryRestUntil);
  const limitReached = hero.dungeonRunsToday >= MAX_DAILY_DUNGEONS;

  const completed = hero.completedDungeons ?? [];

  // Unlock rule: first dungeon is free; each next requires the previous completed on normal/hard.
  // Backward compat: also unlock if hero.level >= dungeon.minLevel (existing saves).
  const isDungeonUnlocked = (idx: number): boolean => {
    if (idx === 0) return true;
    if (completed.includes(ALL_DUNGEONS[idx - 1].id)) return true;
    return hero.level >= ALL_DUNGEONS[idx].minLevel; // legacy gate for existing saves
  };

  // Default selection: last played dungeon (from localStorage), fallback to highest unlocked
  const [selected, setSelected] = useState<FullDungeon>(() => {
    try {
      const lastId = localStorage.getItem('glitchsoul_last_dungeon');
      if (lastId) {
        const found = ALL_DUNGEONS.find(d => d.id === lastId);
        if (found) return found;
      }
    } catch {}
    let last = ALL_DUNGEONS[0];
    for (let i = 1; i < ALL_DUNGEONS.length; i++) {
      if (completed.includes(ALL_DUNGEONS[i - 1].id) || hero.level >= ALL_DUNGEONS[i].minLevel) {
        last = ALL_DUNGEONS[i];
      } else break;
    }
    return last;
  });

  const handleSelectDungeon = (d: FullDungeon) => {
    setSelected(d);
    try { localStorage.setItem('glitchsoul_last_dungeon', d.id); } catch {}
  };
  const [difficulty, setDifficulty] = useState<DungeonDifficulty>('normal');
  const blocked = isResting || limitReached;

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

      {/* ── Interactive dungeon map ───────────────────────────────────────── */}
      <DungeonMapView
        isDungeonUnlocked={isDungeonUnlocked}
        completed={completed}
        selected={selected}
        onSelect={handleSelectDungeon}
        isEn={isEn}
      />

      {/* ── Selected dungeon details ─────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        background: 'rgba(255,45,120,0.04)', border: '1px solid rgba(255,45,120,0.2)',
        padding: '10px 12px',
      }}>
        <div style={{ flexShrink: 0, width: 48, height: 48 }}>
          <LocationIcon id={selected.id} size={48} color="#ff2d78" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <p style={{ ...ORB, fontSize: 10, color: '#ff2d78', textShadow: '0 0 8px rgba(255,45,120,0.4)' }}>
              {isEn ? (selected as typeof selected & { nameEn?: string }).nameEn ?? selected.name : selected.name}
            </p>
            {completed.includes(selected.id) && (
              <span style={{ ...MONO, fontSize: 8, color: '#4ade80' }}>✓ ukończony</span>
            )}
          </div>
          <p style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', marginBottom: 3 }}>
            {isEn ? (selected as typeof selected & { descEn?: string }).descEn ?? selected.description : selected.description}
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ ...MONO, fontSize: 10, color: 'var(--text-muted)' }}>{selected.floors} {t.dungeon.floors}</span>
            <span style={{ ...MONO, fontSize: 10, color: '#ffc83a' }}>
              {isEn ? 'Rec.' : 'Pol.'} POZ. {selected.minLevel}
            </span>
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
              onClick={() => enterDungeon(selected, v.key, difficulty)}
              disabled={blocked}
              className="btn btn-primary"
              style={{ fontSize: 10, padding: '7px 10px', flexShrink: 0, cursor: blocked ? 'not-allowed' : 'pointer', borderColor: v.border }}
            >
              {isResting ? t.dungeon.rest : limitReached ? t.dungeon.limit : t.dungeon.enter}
            </button>
          </div>
        ))}
      </div>
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
  const dungeonUser       = useAuthStore(s => s.user);
  const handleExit = () => {
    exitDungeon();
    if (dungeonUser) syncToCloud(dungeonUser.uid, dungeonUser.username).catch(() => {});
  };

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
        <button onClick={handleExit} className="btn btn-primary" style={{ width: '100%', fontSize: 10 }}>
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
