export type Tab = 'hero' | 'dungeon' | 'quests' | 'shop' | 'pvp' | 'ranking';

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'hero',    label: 'BOHATER', icon: '☠' },
  { id: 'dungeon', label: 'LOCH',    icon: '🗡' },
  { id: 'quests',  label: 'ZADANIA', icon: '📜' },
  { id: 'shop',    label: 'SKLEP',   icon: '⚖' },
  { id: 'pvp',     label: 'ARENA',   icon: '⚔' },
  { id: 'ranking', label: 'RANKING', icon: '👑' },
];

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      background: 'linear-gradient(180deg, #0e0c09 0%, #0a0907 100%)',
      borderTop: '2px solid var(--border-main)',
      boxShadow: '0 -6px 24px rgba(0,0,0,0.8)',
      backgroundImage: 'linear-gradient(var(--gold-darker), var(--gold-darker)), linear-gradient(180deg, #0e0c09 0%, #0a0907 100%)',
      backgroundSize: '100% 1px, 100% 100%',
      backgroundPosition: 'top, top',
      backgroundRepeat: 'no-repeat',
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
                padding: '8px 1px 10px',
                background: isActive
                  ? 'linear-gradient(180deg, rgba(92,72,32,0.25) 0%, transparent 100%)'
                  : 'transparent',
                border: 'none',
                borderTop: `2px solid ${isActive ? 'var(--gold-main)' : 'transparent'}`,
                cursor: 'pointer',
                fontFamily: "'Press Start 2P', monospace",
                transition: 'all 0.15s ease',
                position: 'relative',
              }}
            >
              {isActive && (
                <div style={{
                  position: 'absolute', top: 0, left: '15%', right: '15%',
                  height: 2,
                  background: 'linear-gradient(90deg, transparent, var(--gold-main), transparent)',
                  filter: 'blur(3px)',
                }} />
              )}

              <span style={{
                fontSize: isActive ? 17 : 15,
                lineHeight: 1,
                marginBottom: 3,
                color: isActive ? 'var(--gold-bright)' : 'var(--text-muted)',
                textShadow: isActive ? '0 0 10px var(--gold-glow)' : 'none',
                filter: isActive ? 'drop-shadow(0 0 4px rgba(180,130,40,0.5))' : 'none',
                transition: 'all 0.15s ease',
                display: 'block',
              }}>
                {tab.icon}
              </span>

              <span style={{
                fontSize: 3,
                letterSpacing: '0.06em',
                color: isActive ? 'var(--gold-main)' : 'var(--text-muted)',
                textShadow: isActive ? '0 0 6px var(--gold-glow)' : 'none',
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
