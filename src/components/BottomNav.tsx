type Tab = 'hero' | 'dungeon' | 'quests' | 'shop';

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'hero', label: 'Bohater', emoji: '👤' },
  { id: 'dungeon', label: 'Loch', emoji: '⚔️' },
  { id: 'quests', label: 'Zadania', emoji: '📜' },
  { id: 'shop', label: 'Sklep', emoji: '🛒' },
];

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50" style={{ background: '#0f0e17', borderTop: '1px solid #334155' }}>
      <div className="flex max-w-md mx-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="flex-1 flex flex-col items-center py-2 px-1 transition-colors"
            style={{ color: active === tab.id ? '#d97706' : '#64748b' }}
          >
            <span className="text-xl">{tab.emoji}</span>
            <span className="text-xs mt-0.5">{tab.label}</span>
            {active === tab.id && <div style={{ width: 24, height: 2, background: '#d97706', borderRadius: 1, marginTop: 2 }} />}
          </button>
        ))}
      </div>
    </nav>
  );
}
