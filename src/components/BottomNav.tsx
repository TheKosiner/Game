export type Tab = 'hero' | 'dungeon' | 'quests' | 'shop' | 'ranking';

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'hero', label: 'Bohater', emoji: '👤' },
  { id: 'dungeon', label: 'Loch', emoji: '⚔️' },
  { id: 'quests', label: 'Zadania', emoji: '📜' },
  { id: 'shop', label: 'Sklep', emoji: '🛒' },
  { id: 'ranking', label: 'Ranking', emoji: '🏆' },
];

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: '#0f0e17', borderTop: '2px solid #334155' }}>
      <div style={{ display: 'flex', maxWidth: 480, margin: '0 auto' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '6px 2px',
              background: 'none',
              border: 'none',
              borderTop: active === tab.id ? '2px solid #d97706' : '2px solid transparent',
              color: active === tab.id ? '#d97706' : '#64748b',
              cursor: 'pointer',
              fontFamily: "'Press Start 2P', monospace",
            }}
          >
            <span style={{ fontSize: 16, marginBottom: 2 }}>{tab.emoji}</span>
            <span style={{ fontSize: 5 }}>{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
