export type Tab = 'hero' | 'dungeon' | 'quests' | 'shop' | 'pvp' | 'guild' | 'ranking';

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'hero',    label: 'BOHATER', icon: '☠' },
  { id: 'dungeon', label: 'LOCH',    icon: '⚔' },
  { id: 'quests',  label: 'ZADANIA', icon: '📜' },
  { id: 'shop',    label: 'SKLEP',   icon: '⚖' },
  { id: 'pvp',     label: 'ARENA',   icon: '🏆' },
  { id: 'guild',   label: 'GILDIA',  icon: '🏰' },
  { id: 'ranking', label: 'TOP',     icon: '👑' },
];

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
                fontSize: isActive ? 18 : 16,
                lineHeight: 1,
                marginBottom: 3,
                filter: isActive ? 'drop-shadow(0 0 6px #ff2d78)' : 'none',
                transition: 'all 0.15s ease',
                display: 'block',
              }}>
                {tab.icon}
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
