import { useGameStore } from '../store/gameStore';
import type { Item, ItemSlot } from '../types';

const SLOTS: { slot: ItemSlot; label: string; emoji: string }[] = [
  { slot: 'helmet', label: 'Hełm', emoji: '⛑️' },
  { slot: 'weapon', label: 'Broń', emoji: '⚔️' },
  { slot: 'armor', label: 'Zbroja', emoji: '🛡️' },
  { slot: 'ring', label: 'Pierścień', emoji: '💍' },
  { slot: 'boots', label: 'Buty', emoji: '👢' },
  { slot: 'amulet', label: 'Amulet', emoji: '📿' },
];

function ItemBadge({ item, onUnequip }: { item: Item; onUnequip: () => void }) {
  return (
    <div className={`bg-slate-900/80 rounded-lg p-2 border rarity-${item.rarity} border-current`}>
      <div className="flex items-center justify-between gap-1">
        <span className="text-lg">{item.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-semibold truncate rarity-${item.rarity}`}>{item.name}</p>
          <p className="text-slate-500 text-xs">Poz. {item.level}</p>
        </div>
        <button onClick={onUnequip} className="text-slate-500 hover:text-red-400 text-xs px-1" title="Zdejmij">✕</button>
      </div>
    </div>
  );
}

export default function EquipmentPanel() {
  const equipment = useGameStore(s => s.hero.equipment);
  const unequipItem = useGameStore(s => s.unequipItem);

  return (
    <div className="card p-4">
      <h3 className="font-bold text-slate-300 mb-3">⚔️ Ekwipunek</h3>
      <div className="grid grid-cols-2 gap-2">
        {SLOTS.map(({ slot, label, emoji }) => {
          const item = equipment[slot];
          return item ? (
            <ItemBadge key={slot} item={item} onUnequip={() => unequipItem(slot)} />
          ) : (
            <div key={slot} className="bg-slate-900/40 rounded-lg p-2 border border-slate-700 border-dashed flex items-center gap-2">
              <span className="text-slate-600">{emoji}</span>
              <span className="text-slate-600 text-xs">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
