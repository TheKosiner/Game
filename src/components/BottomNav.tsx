import { useT } from '../hooks/useT';

export type MainTab   = 'hero' | 'play' | 'guild' | 'social' | 'shop';
export type PlaySub   = 'dungeon' | 'challenge' | 'quests' | 'smith' | 'pvp';
export type SocialSub = 'ranking' | 'mail' | 'chat';
export type GuildSub  = SocialSub;
export type ShopSub   = 'shop' | 'gems';

// legacy alias for any code that still imports Tab
export type Tab = MainTab;

interface Props {
  active: MainTab;
  onChange: (tab: MainTab) => void;
  badges?: Partial<Record<MainTab, boolean>>;
}

const svgBase = {
  width: 22, height: 22, viewBox: '0 0 22 22', fill: 'none',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function TabIcon({ id, color }: { id: MainTab; color: string }) {
  const p = { ...svgBase, stroke: color };
  switch (id) {
    case 'hero': return (
      <svg {...p}>
        <path d="M5 15V9Q5 3 11 3Q17 3 17 9V15"/>
        <line x1="3" y1="15" x2="19" y2="15"/>
        <line x1="7" y1="11" x2="15" y2="11"/>
      </svg>
    );
    case 'play': return (
      <svg {...p}>
        <path d="M4 18V10Q4 4 11 4Q18 4 18 10V18"/>
        <line x1="11" y1="10" x2="11" y2="18"/>
        <line x1="4" y1="13" x2="18" y2="13"/>
      </svg>
    );
    case 'guild': return (
      <svg {...p}>
        <path d="M11 2L4 6v5c0 4.4 3 8.5 7 9.5 4-1 7-5.1 7-9.5V6z"/>
        <path d="M8 11l2 2 4-4"/>
      </svg>
    );
    case 'social': return (
      <svg {...p}>
        <circle cx="8" cy="8" r="3.5"/>
        <circle cx="16" cy="8" r="3"/>
        <path d="M1 20Q1 14 8 14Q15 14 15 20"/>
        <path d="M16 11Q20 12 20 17"/>
      </svg>
    );
    case 'shop': return (
      <svg {...p}>
        <path d="M3 8h16l-2 11H5Z"/>
        <path d="M8 8V6a3 3 0 0 1 6 0v2"/>
        <circle cx="9" cy="13" r="1.2" fill={color} stroke="none"/>
        <circle cx="13" cy="13" r="1.2" fill={color} stroke="none"/>
      </svg>
    );
  }
}

export default function BottomNav({ active, onChange, badges }: Props) {
  const t = useT();

  const TABS: { id: MainTab; label: string }[] = [
    { id: 'hero',   label: t.nav.hero },
    { id: 'play',   label: t.nav.play },
    { id: 'guild',  label: t.nav.guild },
    { id: 'social', label: t.nav.social },
    { id: 'shop',   label: t.nav.shop },
  ];

  return (
    <nav style={{
      flexShrink: 0,
      background: 'linear-gradient(0deg, #040408 0%, #0a0a14 100%)',
      borderTop: '1px solid rgba(255,45,120,0.3)',
      boxShadow: '0 -4px 24px rgba(255,45,120,0.08)',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      <div style={{ display: 'flex', maxWidth: 480, margin: '0 auto' }}>
        {TABS.map(tab => {
          const isActive = active === tab.id;
          const color = isActive ? '#ff2d78' : 'var(--text-muted)';
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              style={{
                flex: 1,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '8px 2px 12px',
                background: isActive
                  ? 'linear-gradient(180deg, rgba(255,45,120,0.12) 0%, transparent 100%)'
                  : 'transparent',
                border: 'none',
                borderTop: `2px solid ${isActive ? '#ff2d78' : 'transparent'}`,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                position: 'relative',
              }}
            >
              {isActive && (
                <div style={{
                  position: 'absolute', top: 0, left: '15%', right: '15%', height: 2,
                  background: 'linear-gradient(90deg, transparent, #ff2d78, transparent)',
                  filter: 'blur(4px)',
                }} />
              )}
              {badges?.[tab.id] && !isActive && (
                <span style={{
                  position: 'absolute', top: 8, right: '50%', transform: 'translateX(14px)',
                  width: 8, height: 8, borderRadius: '50%',
                  background: '#ff2d78', boxShadow: '0 0 8px #ff2d78',
                }} />
              )}
              <span style={{
                marginBottom: 4,
                filter: isActive ? 'drop-shadow(0 0 6px #ff2d78)' : 'none',
              }}>
                <TabIcon id={tab.id} color={color} />
              </span>
              <span style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: '9px',
                fontWeight: isActive ? 700 : 400,
                letterSpacing: '0.05em',
                color,
                textShadow: isActive ? '0 0 8px rgba(255,45,120,0.6)' : 'none',
              }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
