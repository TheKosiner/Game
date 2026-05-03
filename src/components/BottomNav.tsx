export type Tab = 'hero' | 'dungeon' | 'quests' | 'shop' | 'ranking';

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'hero',    label: 'Bohater', emoji: '👤' },
  { id: 'dungeon', label: 'Loch',    emoji: '⚔️' },
  { id: 'quests',  label: 'Zadania', emoji: '📜' },
  { id: 'shop',    label: 'Sklep',   emoji: '🛒' },
  { id: 'ranking', label: 'Ranking', emoji: '🏆' },
];

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      background: 'rgba(6,9,18,0.92)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(90,110,190,0.25)',
      boxShadow: '0 -8px 32px rgba(0,0,0,0.6)',
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
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '8px 2px 10px',
                background: isActive
                  ? 'linear-gradient(180deg, rgba(245,158,11,0.08) 0%, transparent 100%)'
                  : 'none',
                border: 'none',
                borderTop: isActive
                  ? '2px solid #f59e0b'
                  : '2px solid transparent',
                color: isActive ? '#f59e0b' : '#475569',
                cursor: 'pointer',
                fontFamily: "'Press Start 2P', monospace",
                transition: 'all 0.15s ease',
                position: 'relative',
              }}
            >
              {isActive && (
                <div style={{
                  position: 'absolute', top: 0, left: '50%',
                  transform: 'translateX(-50%)',
                  width: 32, height: 2,
                  background: 'linear-gradient(90deg, transparent, #f59e0b, transparent)',
                  filter: 'blur(2px)',
                }} />
              )}
              <span style={{
                fontSize: 18,
                marginBottom: 3,
                filter: isActive ? 'drop-shadow(0 0 6px rgba(245,158,11,0.6))' : 'none',
                transition: 'filter 0.15s ease',
              }}>
                {tab.emoji}
              </span>
              <span style={{ fontSize: 5, letterSpacing: '0.05em' }}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
