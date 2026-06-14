import React from 'react';

export type GameIconName =
  | 'sword' | 'shield' | 'skull' | 'boss_skull'
  | 'explosion' | 'fire' | 'wind' | 'lightning'
  | 'syringe' | 'poison' | 'regen' | 'heart' | 'magic_sparkle'
  | 'coin' | 'scroll' | 'bag' | 'tent' | 'wrench' | 'magic_orb' | 'anvil'
  | 'trophy' | 'companion' | 'email' | 'retry' | 'scale' | 'gem' | 'leaf'
  | 'fist' | 'run' | 'crosshair'
  | 'slot_armor' | 'slot_helmet' | 'slot_boots' | 'slot_ring' | 'slot_amulet'
  | 'check' | 'warning' | 'up_arrow'
  | 'monster' | 'chat' | 'cart' | 'slot_machine' | 'user' | 'users'
  | 'medal' | 'hourglass' | 'gear' | 'dot' | 'star' | 'x_mark'
  | 'dice' | 'crown' | 'bell';

const DEFAULTS: Partial<Record<GameIconName, string>> = {
  sword:         '#ff2d78',
  shield:        '#00f5ff',
  skull:         '#ff4444',
  boss_skull:    '#ff2d78',
  explosion:     '#ffaa00',
  fire:          '#ff6600',
  wind:          '#00f5ff',
  lightning:     '#ffcc00',
  syringe:       '#cc0066',
  poison:        '#44cc44',
  regen:         '#ff4444',
  heart:         '#ff4488',
  magic_sparkle: '#9d4edd',
  coin:          '#ffd700',
  scroll:        '#ffd700',
  bag:           '#94a3b8',
  tent:          '#4ade80',
  wrench:        '#94a3b8',
  magic_orb:     '#c084fc',
  anvil:         '#ffd700',
  trophy:        '#ffd700',
  companion:     '#4ade80',
  email:         '#94a3b8',
  retry:         '#00f5ff',
  scale:         '#94a3b8',
  gem:           '#60a5fa',
  leaf:          '#4ade80',
  fist:          '#ff2d78',
  run:           '#00f5ff',
  crosshair:     '#9d4edd',
  slot_armor:    '#4488cc',
  slot_helmet:   '#4488cc',
  slot_boots:    '#4488cc',
  slot_ring:     '#8844cc',
  slot_amulet:   '#8844cc',
  check:         '#4ade80',
  warning:       '#ffaa00',
  up_arrow:      '#ffd700',
  monster:       '#9d4edd',
  chat:          '#60a5fa',
  cart:          '#ffd700',
  slot_machine:  '#ffcc00',
  user:          '#94a3b8',
  users:         '#94a3b8',
  medal:         '#ffd700',
  hourglass:     '#94a3b8',
  gear:          '#94a3b8',
  dot:           '#ff4444',
  star:          '#ffd700',
  x_mark:        '#ff4444',
  dice:          '#c084fc',
  crown:         '#ffd700',
  bell:          '#fbbf24',
};

export default function GameIcon({
  name,
  size = 16,
  color,
  style,
}: {
  name: GameIconName;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}) {
  const c = color ?? DEFAULTS[name] ?? '#aaaaaa';

  let inner: React.ReactNode;

  switch (name) {
    case 'sword':
      inner = <>
        <line x1="14" y1="2" x2="4" y2="16" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="6"  y1="2" x2="16" y2="16" stroke={c} strokeWidth="2.5" strokeLinecap="round" opacity="0.55"/>
        <line x1="2"  y1="9" x2="8"  y2="9"  stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="12" y1="9" x2="18" y2="9"  stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.55"/>
        <circle cx="3.5"  cy="17" r="1.5" fill={c}/>
        <circle cx="16.5" cy="17" r="1.5" fill={c} opacity="0.55"/>
      </>;
      break;

    case 'shield':
      inner = <>
        <path d="M10 2 L17 5 L17 12 Q17 17 10 19 Q3 17 3 12 L3 5 Z"
              fill={`${c}22`} stroke={c} strokeWidth="1.5"/>
        <line x1="10" y1="6"  x2="10" y2="15" stroke={c} strokeWidth="1.3" strokeLinecap="round" opacity="0.7"/>
        <line x1="6"  y1="10" x2="14" y2="10" stroke={c} strokeWidth="1.3" strokeLinecap="round" opacity="0.7"/>
      </>;
      break;

    case 'skull':
      inner = <>
        <ellipse cx="10" cy="8.5" rx="6.5" ry="6" fill={`${c}22`} stroke={c} strokeWidth="1.5"/>
        <rect x="4.5" y="12" width="11" height="5" rx="1" fill={`${c}22`} stroke={c} strokeWidth="1.5"/>
        <circle cx="7.5"  cy="8.5" r="2" fill={c}/>
        <circle cx="12.5" cy="8.5" r="2" fill={c}/>
        <rect x="7"  y="16"   width="2" height="1.5" rx="0.5" fill={c} opacity="0.7"/>
        <rect x="11" y="16"   width="2" height="1.5" rx="0.5" fill={c} opacity="0.7"/>
        <rect x="9"  y="15.5" width="2" height="2"   rx="0.5" fill={c} opacity="0.5"/>
      </>;
      break;

    case 'boss_skull':
      inner = <>
        <ellipse cx="10" cy="7" rx="5.5" ry="5" fill={`${c}22`} stroke={c} strokeWidth="1.5"/>
        <rect x="5.5" y="10" width="9" height="4" rx="1" fill={`${c}22`} stroke={c} strokeWidth="1.5"/>
        <circle cx="7.5"  cy="7" r="1.5" fill={c}/>
        <circle cx="12.5" cy="7" r="1.5" fill={c}/>
        <line x1="3"  y1="15.5" x2="17" y2="18.5" stroke={c} strokeWidth="2.2" strokeLinecap="round"/>
        <line x1="17" y1="15.5" x2="3"  y2="18.5" stroke={c} strokeWidth="2.2" strokeLinecap="round"/>
      </>;
      break;

    case 'explosion':
      inner = <>
        <circle cx="10" cy="10" r="3.5" fill={`${c}55`}/>
        <line x1="10" y1="2"  x2="10" y2="5.5" stroke={c} strokeWidth="2"   strokeLinecap="round"/>
        <line x1="10" y1="14.5" x2="10" y2="18" stroke={c} strokeWidth="2"   strokeLinecap="round"/>
        <line x1="2"  y1="10" x2="5.5" y2="10" stroke={c} strokeWidth="2"   strokeLinecap="round"/>
        <line x1="14.5" y1="10" x2="18" y2="10" stroke={c} strokeWidth="2"   strokeLinecap="round"/>
        <line x1="4.5" y1="4.5" x2="7"  y2="7"  stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="15.5" y1="4.5" x2="13" y2="7"  stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="4.5" y1="15.5" x2="7"  y2="13" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="15.5" y1="15.5" x2="13" y2="13" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="10" cy="10" r="2" fill={c}/>
      </>;
      break;

    case 'fire':
      inner = <>
        <path d="M10 2 Q13 5 12 8 Q15 5 14 9.5 Q17 7 16 12 Q16 17 10 18 Q4 17 4 12 Q3 7 6 9.5 Q5 5 8 8 Q7 5 10 2 Z"
              fill={`${c}44`} stroke={c} strokeWidth="1"/>
        <path d="M10 8 Q12.5 10.5 11.5 13 Q13 11.5 12.5 14.5 Q12.5 17.5 10 17.5 Q7.5 17.5 7.5 14.5 Q7 11.5 8.5 13 Q7.5 10.5 10 8 Z"
              fill={c} opacity="0.85"/>
      </>;
      break;

    case 'wind':
      inner = <>
        <path d="M3 7 Q8 5 12 7 Q15 9 17.5 7 Q19.5 5.5 17.5 4" fill="none" stroke={c} strokeWidth="2"   strokeLinecap="round"/>
        <path d="M3 11 Q9 9 14 11 Q17 13 19 11"                 fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" opacity="0.75"/>
        <path d="M3 15 Q7.5 13 11 15 Q13 16 15.5 15"           fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
      </>;
      break;

    case 'lightning':
      inner = <>
        <polygon points="12,2 7,11 11,11 8,18 14,8 10,8" fill={`${c}44`} stroke={c} strokeWidth="1"/>
        <polygon points="12,2 8,10 12,10 9,18 14,8 10,8" fill={c} opacity="0.8"/>
      </>;
      break;

    case 'syringe':
      inner = <>
        <line x1="13" y1="4"  x2="5" y2="16" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
        <rect x="5.5" y="7.5" width="8" height="5" rx="2" fill={`${c}33`} stroke={c} strokeWidth="1.2"
              transform="rotate(-45 9.5 10)"/>
        <line x1="12" y1="6" x2="16" y2="3" stroke={c} strokeWidth="2" strokeLinecap="round"/>
        <circle cx="5" cy="16.5" r="1.8" fill={c}/>
      </>;
      break;

    case 'poison':
      inner = <>
        <circle cx="10" cy="10" r="7.5" fill={`${c}22`} stroke={c} strokeWidth="1.5"/>
        <circle cx="7"  cy="8"  r="1.8" fill={c}/>
        <circle cx="13" cy="8"  r="1.8" fill={c}/>
        <circle cx="10" cy="13" r="1.8" fill={c}/>
        <circle cx="10" cy="10" r="2.2" fill={`${c}66`}/>
      </>;
      break;

    case 'regen':
      inner = <>
        <circle cx="10" cy="10" r="7.5" fill={`${c}22`} stroke={c} strokeWidth="1.5"/>
        <line x1="10" y1="5.5" x2="10" y2="14.5" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="5.5" y1="10" x2="14.5" y2="10" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
      </>;
      break;

    case 'heart':
      inner = <>
        <path d="M10 16.5 Q4 11 4 7 Q4 3 7.5 3 Q9.5 3 10 5 Q10.5 3 12.5 3 Q16 3 16 7 Q16 11 10 16.5 Z"
              fill={`${c}44`} stroke={c} strokeWidth="1.5"/>
      </>;
      break;

    case 'magic_sparkle':
      inner = <>
        <line x1="10" y1="2"  x2="10" y2="18" stroke={c} strokeWidth="1.2" opacity="0.35"/>
        <line x1="2"  y1="10" x2="18" y2="10" stroke={c} strokeWidth="1.2" opacity="0.35"/>
        <line x1="4"  y1="4"  x2="16" y2="16" stroke={c} strokeWidth="0.9" opacity="0.25"/>
        <line x1="16" y1="4"  x2="4"  y2="16" stroke={c} strokeWidth="0.9" opacity="0.25"/>
        <circle cx="10" cy="2"  r="2.2" fill={c}/>
        <circle cx="10" cy="18" r="2.2" fill={c}/>
        <circle cx="2"  cy="10" r="2.2" fill={c}/>
        <circle cx="18" cy="10" r="2.2" fill={c}/>
        <circle cx="10" cy="10" r="2.5" fill={c} opacity="0.55"/>
      </>;
      break;

    case 'coin':
      inner = <>
        <circle cx="10" cy="10" r="7.5" fill={`${c}22`} stroke={c} strokeWidth="1.5"/>
        <ellipse cx="10" cy="10" rx="3" ry="5.5" fill="none" stroke={c} strokeWidth="1.4" opacity="0.7"/>
        <line x1="10" y1="4.5" x2="10" y2="15.5" stroke={c} strokeWidth="0.8" opacity="0.35"/>
      </>;
      break;

    case 'scroll':
      inner = <>
        <rect x="5" y="4" width="11" height="13" rx="2" fill={`${c}22`} stroke={c} strokeWidth="1.5"/>
        <circle cx="5"  cy="4.5"  r="2" fill={`${c}33`} stroke={c} strokeWidth="1.5"/>
        <circle cx="5"  cy="15.5" r="2" fill={`${c}33`} stroke={c} strokeWidth="1.5"/>
        <line x1="8" y1="8"  x2="14" y2="8"  stroke={c} strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
        <line x1="8" y1="11" x2="14" y2="11" stroke={c} strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
        <line x1="8" y1="14" x2="12" y2="14" stroke={c} strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
      </>;
      break;

    case 'bag':
      inner = <>
        <path d="M5.5 8.5 L4 17.5 Q4 18.5 5 18.5 L15 18.5 Q16 18.5 16 17.5 L14.5 8.5 Z"
              fill={`${c}22`} stroke={c} strokeWidth="1.5"/>
        <path d="M7.5 8.5 Q7.5 4.5 10 4.5 Q12.5 4.5 12.5 8.5"
              fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="4.5" y1="11.5" x2="15.5" y2="11.5" stroke={c} strokeWidth="1" opacity="0.45"/>
      </>;
      break;

    case 'tent':
      inner = <>
        <polygon points="10,2 17.5,17 2.5,17" fill={`${c}22`} stroke={c} strokeWidth="1.5"/>
        <line x1="10" y1="5"  x2="10" y2="17" stroke={c} strokeWidth="1" opacity="0.4"/>
        <rect x="7.5" y="13" width="5" height="4" fill={`${c}33`} stroke={c} strokeWidth="0.8"/>
        <circle cx="10" cy="3" r="1.5" fill={c} opacity="0.7"/>
      </>;
      break;

    case 'wrench':
      inner = <>
        <path d="M5 3.5 Q3 5.5 4 7.5 L13 16.5 Q15 18.5 17 16.5 Q19 14.5 17 12.5 L8 3.5 Q6 1.5 4 3.5 Z"
              fill={`${c}33`} stroke={c} strokeWidth="1.5"/>
        <circle cx="5.5" cy="5.5" r="2.2" fill={`${c}55`}/>
        <line x1="10" y1="9" x2="15" y2="14" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
      </>;
      break;

    case 'magic_orb':
      inner = <>
        <circle cx="10" cy="10" r="7.5" fill={`${c}22`} stroke={c} strokeWidth="1.5"/>
        <ellipse cx="10" cy="10" rx="7.5" ry="3"   fill="none" stroke={c} strokeWidth="1" opacity="0.45"/>
        <ellipse cx="10" cy="10" rx="3"   ry="7.5" fill="none" stroke={c} strokeWidth="1" opacity="0.45"/>
        <circle cx="10" cy="10" r="3" fill={c} opacity="0.45"/>
        <circle cx="10" cy="10" r="1.5" fill="white" opacity="0.6"/>
      </>;
      break;

    case 'anvil':
      inner = <>
        <rect x="3"  y="8"  width="14" height="6.5" rx="1" fill={`${c}33`} stroke={c} strokeWidth="1.5"/>
        <rect x="5.5" y="4" width="9"  height="5"   rx="1" fill={`${c}33`} stroke={c} strokeWidth="1.5"/>
        <rect x="6.5" y="14.5" width="7" height="3" rx="1" fill={`${c}22`} stroke={c} strokeWidth="1"/>
      </>;
      break;

    case 'trophy':
      inner = <>
        <path d="M6 3 L14 3 L14 10 Q14 15.5 10 16.5 Q6 15.5 6 10 Z"
              fill={`${c}33`} stroke={c} strokeWidth="1.5"/>
        <path d="M6 5 Q3 5 3 8.5 Q3 11.5 6 11.5" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M14 5 Q17 5 17 8.5 Q17 11.5 14 11.5" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="10" y1="16.5" x2="10" y2="18" stroke={c} strokeWidth="1.5"/>
        <rect x="7" y="17.5" width="6" height="1.5" rx="0.5" fill={c}/>
      </>;
      break;

    case 'companion':
      inner = <>
        <circle cx="7"  cy="6"  r="3"   fill={`${c}33`} stroke={c} strokeWidth="1.5"/>
        <path d="M3 18 Q3 13.5 7 13.5 Q11 13.5 11 18"
              fill={`${c}22`} stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="14" cy="6"  r="2.5" fill={`${c}22`} stroke={c} strokeWidth="1" opacity="0.7"/>
        <path d="M10 18 Q10 13.5 14 13.5 Q18 13.5 18 18"
              fill={`${c}11`} stroke={c} strokeWidth="1" strokeLinecap="round" opacity="0.7"/>
      </>;
      break;

    case 'email':
      inner = <>
        <rect x="2" y="4.5" width="16" height="11" rx="2" fill={`${c}22`} stroke={c} strokeWidth="1.5"/>
        <polyline points="2,4.5 10,11 18,4.5" fill="none" stroke={c} strokeWidth="1.5"/>
      </>;
      break;

    case 'retry':
      inner = <>
        <path d="M10 4 Q16.5 4 16.5 10 Q16.5 16 10 16.5" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"/>
        <path d="M10 4 Q3.5 4 3.5 10 Q3.5 16 10 16.5"    fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" opacity="0.45"/>
        <polygon points="6.5,1.5 6.5,6.5 11,4" fill={c}/>
      </>;
      break;

    case 'scale':
      inner = <>
        <line x1="10" y1="2"  x2="10" y2="18" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="3"  y1="6"  x2="17" y2="6"  stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M3 6 Q1.5 9 3 12 Q4.5 9 3 6 Z"  fill={`${c}55`} stroke={c} strokeWidth="0.8"/>
        <path d="M17 6 Q15.5 9 17 12 Q18.5 9 17 6 Z" fill={`${c}55`} stroke={c} strokeWidth="0.8"/>
        <line x1="7" y1="18" x2="13" y2="18" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      </>;
      break;

    case 'gem':
      inner = <>
        <polygon points="10,2 16,6 16,13.5 10,18 4,13.5 4,6"
                 fill={`${c}33`} stroke={c} strokeWidth="1.5"/>
        <polygon points="10,4 14,7 10,9.5 6,7" fill={c} opacity="0.3"/>
        <circle cx="10" cy="13" r="2.2" fill={c} opacity="0.55"/>
      </>;
      break;

    case 'leaf':
      inner = <>
        <path d="M10 18 Q4 14.5 4 8.5 Q4 2 10 2 Q16 2 16 8.5 Q16 14.5 10 18 Z"
              fill={`${c}33`} stroke={c} strokeWidth="1.5"/>
        <line x1="10" y1="2"  x2="10" y2="18" stroke={c} strokeWidth="1.2" opacity="0.45"/>
        <line x1="7"  y1="8"  x2="10" y2="6"  stroke={c} strokeWidth="0.9" opacity="0.4"/>
        <line x1="7"  y1="12" x2="10" y2="10" stroke={c} strokeWidth="0.9" opacity="0.4"/>
        <line x1="13" y1="8"  x2="10" y2="6"  stroke={c} strokeWidth="0.9" opacity="0.4"/>
        <line x1="13" y1="12" x2="10" y2="10" stroke={c} strokeWidth="0.9" opacity="0.4"/>
      </>;
      break;

    case 'fist':
      inner = <>
        <rect x="5" y="8.5" width="10" height="7.5" rx="2" fill={`${c}33`} stroke={c} strokeWidth="1.5"/>
        <rect x="6"   y="5.5" width="2.5" height="4.5" rx="1" fill={`${c}55`} stroke={c} strokeWidth="1"/>
        <rect x="9"   y="4.5" width="2.5" height="5"   rx="1" fill={`${c}55`} stroke={c} strokeWidth="1"/>
        <rect x="12"  y="5.5" width="2.5" height="4.5" rx="1" fill={`${c}55`} stroke={c} strokeWidth="1"/>
        <rect x="3.5" y="10"  width="3"   height="4"   rx="1" fill={`${c}44`} stroke={c} strokeWidth="1"
              transform="rotate(15 5 12)"/>
      </>;
      break;

    case 'run':
      inner = <>
        <circle cx="13" cy="4"  r="2.5" fill={`${c}55`} stroke={c} strokeWidth="1.2"/>
        <line x1="13" y1="6.5" x2="11" y2="11" stroke={c} strokeWidth="2.2" strokeLinecap="round"/>
        <line x1="11" y1="11"  x2="6.5" y2="9" stroke={c} strokeWidth="2.2" strokeLinecap="round"/>
        <line x1="11" y1="11"  x2="10" y2="16" stroke={c} strokeWidth="2.2" strokeLinecap="round"/>
        <line x1="10" y1="16"  x2="14" y2="18" stroke={c} strokeWidth="2.2" strokeLinecap="round"/>
        <line x1="10" y1="16"  x2="6.5" y2="19" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.65"/>
      </>;
      break;

    case 'crosshair':
      inner = <>
        <circle cx="10" cy="10" r="7"   fill="none" stroke={c} strokeWidth="1.5"/>
        <circle cx="10" cy="10" r="2.5" fill={`${c}55`} stroke={c} strokeWidth="1"/>
        <line x1="2"    y1="10" x2="6.5" y2="10" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="13.5" y1="10" x2="18"  y2="10" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="10"   y1="2"  x2="10"  y2="6.5" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="10"   y1="13.5" x2="10" y2="18" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      </>;
      break;

    case 'slot_armor':
      inner = <>
        <path d="M4 5.5 L10 3 L16 5.5 L16 13 Q16 17 10 19 Q4 17 4 13 Z"
              fill={`${c}22`} stroke={c} strokeWidth="1.5"/>
        <circle cx="10" cy="11" r="3" fill={`${c}33`} stroke={c} strokeWidth="1"/>
      </>;
      break;

    case 'slot_helmet':
      inner = <>
        <path d="M5 12 Q5 5 10 4 Q15 5 15 12 L15 15.5 Q15 17 13 17 L7 17 Q5 17 5 15.5 Z"
              fill={`${c}22`} stroke={c} strokeWidth="1.5"/>
        <path d="M6.5 12 Q6.5 6.5 10 5.5 Q13.5 6.5 13.5 12 L13.5 14 L6.5 14 Z"
              fill={`${c}33`}/>
        <line x1="5" y1="14" x2="15" y2="14" stroke={c} strokeWidth="1" opacity="0.5"/>
      </>;
      break;

    case 'slot_boots':
      inner = <>
        <rect x="6" y="3" width="6" height="11" rx="2" fill={`${c}22`} stroke={c} strokeWidth="1.5"/>
        <path d="M6 13 L6 17 Q6 18.5 8 18.5 L15.5 18.5 Q17 18.5 17 17 L17 14.5 Q17 12.5 12 12.5 L12 13 Z"
              fill={`${c}22`} stroke={c} strokeWidth="1.5"/>
        <line x1="6" y1="18" x2="17" y2="18" stroke={c} strokeWidth="1.2" strokeLinecap="round" opacity="0.6"/>
      </>;
      break;

    case 'slot_ring':
      inner = <>
        <circle cx="10" cy="11" r="6.5" fill="none" stroke={c} strokeWidth="2.5"/>
        <circle cx="10" cy="4.5" r="2.5" fill={`${c}55`} stroke={c} strokeWidth="1.5"/>
        <circle cx="10" cy="4.5" r="1.2" fill={c} opacity="0.8"/>
      </>;
      break;

    case 'slot_amulet':
      inner = <>
        <path d="M10 3 Q15 3 17 6.5"  fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M10 3 Q5 3 3 6.5"    fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
        <polygon points="10,7.5 14.5,10.5 14.5,15.5 10,18 5.5,15.5 5.5,10.5"
                 fill={`${c}33`} stroke={c} strokeWidth="1.5"/>
        <circle cx="10" cy="13" r="2.5" fill={c} opacity="0.5"/>
      </>;
      break;

    case 'check':
      inner = <>
        <polyline points="3,10 8,15 17,5" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </>;
      break;

    case 'warning':
      inner = <>
        <polygon points="10,2 18.5,17 1.5,17" fill={`${c}22`} stroke={c} strokeWidth="1.5"/>
        <line x1="10" y1="7"  x2="10" y2="12.5" stroke={c} strokeWidth="2"   strokeLinecap="round"/>
        <circle cx="10" cy="15" r="1.3" fill={c}/>
      </>;
      break;

    case 'up_arrow':
      inner = <>
        <line x1="10" y1="17" x2="10" y2="4"  stroke={c} strokeWidth="2"   strokeLinecap="round"/>
        <polyline points="5,9 10,4 15,9" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </>;
      break;

    case 'monster':
      inner = <>
        <rect x="4" y="3" width="12" height="9" rx="3" fill={`${c}22`} stroke={c} strokeWidth="1.5"/>
        <circle cx="7.5" cy="7" r="1.5" fill={c}/>
        <circle cx="12.5" cy="7" r="1.5" fill={c}/>
        <line x1="3"  y1="17" x2="6"  y2="12" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="6"  y1="12" x2="9"  y2="15" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="9"  y1="15" x2="12" y2="12" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="12" y1="12" x2="15" y2="15" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="15" y1="15" x2="17" y2="12" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      </>;
      break;

    case 'chat':
      inner = <>
        <path d="M3 4 Q3 3 4 3 L16 3 Q17 3 17 4 L17 13 Q17 14 16 14 L8 14 L5 17.5 L5 14 L4 14 Q3 14 3 13 Z"
              fill={`${c}22`} stroke={c} strokeWidth="1.5" strokeLinejoin="round"/>
        <line x1="6.5" y1="7.5"  x2="13.5" y2="7.5"  stroke={c} strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
        <line x1="6.5" y1="10.5" x2="11"   y2="10.5" stroke={c} strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
      </>;
      break;

    case 'cart':
      inner = <>
        <path d="M2 3 L5 3 L7.5 13 L15 13" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7.5 7 L16 7 L14.5 13" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="9"  cy="16" r="1.5" fill={c}/>
        <circle cx="14" cy="16" r="1.5" fill={c}/>
      </>;
      break;

    case 'slot_machine':
      inner = <>
        <rect x="3" y="3.5" width="14" height="11" rx="2" fill={`${c}22`} stroke={c} strokeWidth="1.5"/>
        <rect x="5.5" y="5.5" width="2.5" height="7" rx="0.5" fill={`${c}33`} stroke={c} strokeWidth="1"/>
        <rect x="8.75" y="5.5" width="2.5" height="7" rx="0.5" fill={`${c}33`} stroke={c} strokeWidth="1"/>
        <rect x="12" y="5.5" width="2.5" height="7" rx="0.5" fill={`${c}33`} stroke={c} strokeWidth="1"/>
        <line x1="17" y1="7" x2="19" y2="5.5" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
        <rect x="3" y="14.5" width="14" height="2.5" rx="1" fill={`${c}33`} stroke={c} strokeWidth="1"/>
      </>;
      break;

    case 'user':
      inner = <>
        <circle cx="10" cy="6.5" r="3.5" fill={`${c}33`} stroke={c} strokeWidth="1.5"/>
        <path d="M4 18 Q4 13 10 13 Q16 13 16 18"
              fill={`${c}22`} stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      </>;
      break;

    case 'users':
      inner = <>
        <circle cx="7" cy="6.5" r="2.8" fill={`${c}33`} stroke={c} strokeWidth="1.5"/>
        <path d="M2 18 Q2 13.5 7 13.5 Q12 13.5 12 18"
              fill={`${c}22`} stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="14" cy="5.5" r="2.2" fill={`${c}22`} stroke={c} strokeWidth="1.2" opacity="0.75"/>
        <path d="M10 18 Q10 14 14 14 Q18 14 18 18"
              fill={`${c}11`} stroke={c} strokeWidth="1.2" strokeLinecap="round" opacity="0.75"/>
      </>;
      break;

    case 'medal':
      inner = <>
        <circle cx="10" cy="13" r="5.5" fill={`${c}33`} stroke={c} strokeWidth="1.5"/>
        <circle cx="10" cy="13" r="3"   fill={c} opacity="0.4"/>
        <line x1="7"  y1="9"  x2="5"  y2="4" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="13" y1="9"  x2="15" y2="4" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="5"  y1="4"  x2="15" y2="4" stroke={c} strokeWidth="2" strokeLinecap="round"/>
      </>;
      break;

    case 'hourglass':
      inner = <>
        <path d="M5 2.5 L15 2.5 L15 4 Q15 8.5 10 10 Q5 11.5 5 16 L5 17.5 L15 17.5 L15 16 Q15 11.5 10 10 Q5 8.5 5 4 Z"
              fill={`${c}22`} stroke={c} strokeWidth="1.5" strokeLinejoin="round"/>
        <line x1="5" y1="2.5" x2="15" y2="2.5" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="5" y1="17.5" x2="15" y2="17.5" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M7.5 15.5 Q10 13 12.5 15.5" fill={`${c}55`} stroke="none"/>
      </>;
      break;

    case 'gear':
      inner = <>
        <circle cx="10" cy="10" r="3" fill={`${c}33`} stroke={c} strokeWidth="1.5"/>
        <circle cx="10" cy="10" r="1.2" fill={c} opacity="0.6"/>
        <line x1="10" y1="2"   x2="10" y2="5"   stroke={c} strokeWidth="2" strokeLinecap="round"/>
        <line x1="10" y1="15"  x2="10" y2="18"  stroke={c} strokeWidth="2" strokeLinecap="round"/>
        <line x1="2"  y1="10"  x2="5"  y2="10"  stroke={c} strokeWidth="2" strokeLinecap="round"/>
        <line x1="15" y1="10"  x2="18" y2="10"  stroke={c} strokeWidth="2" strokeLinecap="round"/>
        <line x1="4.2" y1="4.2"  x2="6.5" y2="6.5"   stroke={c} strokeWidth="2" strokeLinecap="round"/>
        <line x1="13.5" y1="13.5" x2="15.8" y2="15.8" stroke={c} strokeWidth="2" strokeLinecap="round"/>
        <line x1="15.8" y1="4.2"  x2="13.5" y2="6.5"  stroke={c} strokeWidth="2" strokeLinecap="round"/>
        <line x1="6.5" y1="13.5"  x2="4.2" y2="15.8"  stroke={c} strokeWidth="2" strokeLinecap="round"/>
      </>;
      break;

    case 'dot':
      inner = <circle cx="10" cy="10" r="7" fill={c} opacity="0.9"/>;
      break;

    case 'star':
      inner = <>
        <polygon points="10,2.5 12.3,7.5 17.8,8.2 13.9,12 15,17.5 10,14.8 5,17.5 6.1,12 2.2,8.2 7.7,7.5"
                 fill={`${c}55`} stroke={c} strokeWidth="1.2"/>
      </>;
      break;

    case 'x_mark':
      inner = <>
        <line x1="4.5" y1="4.5" x2="15.5" y2="15.5" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="15.5" y1="4.5" x2="4.5" y2="15.5" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
      </>;
      break;

    case 'dice':
      inner = <>
        <rect x="3" y="3" width="14" height="14" rx="2.5" fill={`${c}22`} stroke={c} strokeWidth="1.5"/>
        <circle cx="6.5" cy="6.5"  r="1.5" fill={c}/>
        <circle cx="13.5" cy="6.5" r="1.5" fill={c}/>
        <circle cx="10"   cy="10"  r="1.5" fill={c}/>
        <circle cx="6.5"  cy="13.5" r="1.5" fill={c}/>
        <circle cx="13.5" cy="13.5" r="1.5" fill={c}/>
      </>;
      break;

    case 'crown':
      inner = <>
        <path d="M3 15 L3 7 L7 12 L10 5 L13 12 L17 7 L17 15 Z"
              fill={`${c}33`} stroke={c} strokeWidth="1.5" strokeLinejoin="round"/>
        <rect x="2.5" y="14.5" width="15" height="3" rx="1" fill={`${c}44`} stroke={c} strokeWidth="1"/>
        <circle cx="10" cy="5"  r="1.5" fill={c}/>
        <circle cx="3"  cy="7"  r="1.2" fill={c}/>
        <circle cx="17" cy="7"  r="1.2" fill={c}/>
      </>;
      break;

    case 'bell':
      inner = <>
        <path d="M10 2 Q13.5 2 15.5 5 Q17.5 7.5 17.5 11 L18.5 14 L1.5 14 L2.5 11 Q2.5 7.5 4.5 5 Q6.5 2 10 2 Z"
              fill={`${c}22`} stroke={c} strokeWidth="1.5"/>
        <line x1="1.5" y1="14" x2="18.5" y2="14" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M8 14 Q8 17 10 17 Q12 17 12 14" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="10" cy="2.5" r="1.5" fill={c} opacity="0.7"/>
      </>;
      break;

    default:
      inner = <circle cx="10" cy="10" r="7" fill="none" stroke={c} strokeWidth="1.5"/>;
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline', verticalAlign: 'middle', flexShrink: 0, ...style }}
      aria-hidden
    >
      {inner}
    </svg>
  );
}

// ── LogLine ─────────────────────────────────────────────────────────────────
// Renders a battle-log text string, replacing known emoji with inline SVG icons.

const LOG_EMOJI: [RegExp, GameIconName, string][] = [
  [/⚔️|⚔/g,  'sword',      '#ff2d78'],
  [/🛡️|🛡/g,  'shield',     '#00f5ff'],
  [/💀/g,     'skull',      '#ff4444'],
  [/💥/g,     'explosion',  '#ffaa00'],
  [/✅/g,     'check',      '#4ade80'],
  [/🤝/g,     'companion',  '#4ade80'],
  [/🪙/g,     'coin',       '#ffd700'],
  [/📈/g,     'up_arrow',   '#ffd700'],
  [/☠️/g,     'boss_skull', '#ff2d78'],
  [/🚶/g,     'run',        '#94a3b8'],
  [/📜/g,     'scroll',     '#ffd700'],
  [/💉/g,     'syringe',    '#cc0066'],
  [/🏆/g,     'trophy',     '#ffd700'],
  [/⚡/g,     'lightning',  '#ffcc00'],
];

export function LogLine({
  text,
  iconSize = 11,
}: {
  text: string;
  iconSize?: number;
}) {
  let parts: (string | React.ReactNode)[] = [text];

  for (const [pattern, iconName, iconColor] of LOG_EMOJI) {
    const next: (string | React.ReactNode)[] = [];
    for (const part of parts) {
      if (typeof part !== 'string') { next.push(part); continue; }
      const segs = part.split(pattern);
      for (let i = 0; i < segs.length; i++) {
        if (segs[i]) next.push(segs[i]);
        if (i < segs.length - 1) {
          next.push(
            <GameIcon
              key={`${iconName}-${next.length}`}
              name={iconName}
              size={iconSize}
              color={iconColor}
              style={{ marginRight: 2, marginLeft: 1, verticalAlign: 'middle' }}
            />,
          );
        }
      }
    }
    parts = next;
  }

  return <>{parts}</>;
}
