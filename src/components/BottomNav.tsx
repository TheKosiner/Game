export type Tab = 'hero' | 'dungeon' | 'quests' | 'shop' | 'pvp' | 'guild' | 'ranking' | 'mail';

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'hero',    label: 'BOHATER' },
  { id: 'dungeon', label: 'OPERACJE' },
  { id: 'quests',  label: 'ZADANIA' },
  { id: 'shop',    label: 'SKLEP'   },
  { id: 'pvp',     label: 'ARENA'   },
  { id: 'guild',   label: 'GILDIA'  },
  { id: 'ranking', label: 'TOP'     },
  { id: 'mail',    label: 'POCZTA'  },
];

const svgBase = {
  width: 18, height: 18,
  viewBox: '0 0 18 18',
  fill: 'none',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function TabIcon({ id, color }: { id: Tab; color: string }) {
  const p = { ...svgBase, stroke: color };
  switch (id) {
    case 'hero': return (
      <svg {...p}>
        {/* warrior helmet */}
        <path d="M4 13V8Q4 2 9 2Q14 2 14 8V13"/>
        <line x1="2" y1="13" x2="16" y2="13"/>
        <line x1="5" y1="9" x2="13" y2="9"/>
      </svg>
    );
    case 'dungeon': return (
      <svg {...p}>
        {/* arch gate */}
        <path d="M3 15V9Q3 3 9 3Q15 3 15 9V15"/>
        <line x1="9" y1="9" x2="9" y2="15"/>
        <line x1="3" y1="11" x2="15" y2="11"/>
      </svg>
    );
    case 'quests': return (
      <svg {...p}>
        {/* scroll / list */}
        <rect x="4" y="2" width="10" height="14" rx="1"/>
        <line x1="6.5" y1="7" x2="11.5" y2="7"/>
        <line x1="6.5" y1="10" x2="11.5" y2="10"/>
        <line x1="6.5" y1="13" x2="9.5" y2="13"/>
      </svg>
    );
    case 'shop': return (
      <svg {...p}>
        {/* gem diamond */}
        <polygon points="9,2 15,8 9,16 3,8" strokeLinejoin="miter"/>
        <line x1="3" y1="8" x2="15" y2="8"/>
      </svg>
    );
    case 'pvp': return (
      <svg {...p}>
        {/* crossed swords */}
        <line x1="2" y1="16" x2="16" y2="2"/>
        <line x1="2" y1="2" x2="16" y2="16"/>
        <line x1="2" y1="5" x2="5" y2="2"/>
        <line x1="13" y1="16" x2="16" y2="13"/>
      </svg>
    );
    case 'guild': return (
      <svg {...p}>
        {/* shield */}
        <path d="M9 2L15 5V10Q15 16 9 17Q3 16 3 10V5Z"/>
        <line x1="9" y1="5" x2="9" y2="14"/>
        <line x1="6" y1="9" x2="12" y2="9"/>
      </svg>
    );
    case 'ranking': return (
      <svg {...p}>
        {/* trophy */}
        <path d="M5 3H13V9Q13 13 9 13Q5 13 5 9Z"/>
        <path d="M2 3H5Q3 7 5 9"/>
        <path d="M13 3H16Q18 7 13 9"/>
        <line x1="9" y1="13" x2="9" y2="15"/>
        <line x1="5.5" y1="15" x2="12.5" y2="15"/>
      </svg>
    );
    case 'mail': return (
      <svg {...p}>
        {/* envelope */}
        <rect x="2" y="4" width="14" height="11" rx="1"/>
        <polyline points="2,4 9,11 16,4"/>
      </svg>
    );
  }
}

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      background: 'linear-gradient(0deg, #040408 0%, #0a0a14 100%)',
      borderTop: '1px solid rgba(255,45,120,0.3)',
      boxShadow: '0 -4px 24px rgba(255,45,120,0.08), 0 -1px 0 rgba(255,45,120,0.15)',
    }}>
      <div style={{ display: 'flex', maxWidth: 480, margin: '0 auto' }}>
        {TABS.map(tab => {
          const isActive = active === tab.id;
          const iconColor = isActive ? '#ff2d78' : 'var(--text-muted)';
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              style={{
                flex: 1,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '8px 2px 10px',
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
                  position: 'absolute', top: 0, left: '10%', right: '10%',
                  height: 2,
                  background: 'linear-gradient(90deg, transparent, #ff2d78, transparent)',
                  filter: 'blur(4px)',
                }} />
              )}

              <span style={{
                marginBottom: 3,
                display: 'block',
                filter: isActive ? 'drop-shadow(0 0 5px #ff2d78)' : 'none',
                transition: 'filter 0.15s ease',
              }}>
                <TabIcon id={tab.id} color={iconColor} />
              </span>

              <span style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: '7px',
                fontWeight: isActive ? 700 : 400,
                letterSpacing: '0.05em',
                color: isActive ? '#ff2d78' : 'var(--text-muted)',
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
