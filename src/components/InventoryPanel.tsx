import { useGameStore } from '../store/gameStore';
import type { Item } from '../types';

function ItemCard({ item, onEquip, onSell }: { item: Item; onEquip: () => void; onSell: () => void }) {
  const statEntries = Object.entries(item.stats).filter(([, v]) => v && v > 0);
  return (
    <div className={`bg-slate-900/60 rounded-lg p-3 border rarity-${item.rarity} border-current`}>
      <div className="flex items-start gap-2">
        <span className="text-2xl">{item.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm truncate rarity-${item.rarity}`}>{item.name}</p>
          <p className="text-slate-500 text-xs capitalize">{item.slot} · Poz. {item.level}</p>
          {statEntries.length > 0 && (
            <p className="text-slate-400 text-xs mt-0.5">
              {statEntries.map(([k, v]) => `+${v} ${k.slice(0,3)}`).join(' ')}
            </p>
          )}
          {(item.attackBonus || item.defenseBonus) && (
            <p className="text-xs mt-0.5">
              {item.attackBonus ? <span className="text-red-400">+{item.attackBonus} Atk </span> : null}
              {item.defenseBonus ? <span className="text-blue-400">+{item.defenseBonus} Def</span> : null}
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2 mt-2">
        <button onClick={onEquip} className="btn btn-primary text-xs flex-1 py-1">Załóż</button>
        <button onClick={onSell} className="btn btn-secondary text-xs py-1">🪙 {item.goldValue}</button>
      </div>
    </div>
  );
}

export default function InventoryPanel() {
  const inventory = useGameStore(s => s.hero.inventory);
  const equipItem = useGameStore(s => s.equipItem);
  const sellItem = useGameStore(s => s.sellItem);

  return (
    <div className="card p-4">
      <h3 className="font-bold text-slate-300 mb-3">🎒 Plecak ({inventory.length}/20)</h3>
      {inventory.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-4">Plecak jest pusty. Idź walczyć!</p>
      ) : (
        <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto pr-1">
          {inventory.map((item: Item) => (
            <ItemCard
              key={`${item.id}-${item.name}`}
              item={item}
              onEquip={() => equipItem(item)}
              onSell={() => sellItem(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
