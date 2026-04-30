import { useState, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { getItemsForLevel } from '../data/items';
import type { Item } from '../types';

export default function ShopPanel() {
  const hero = useGameStore(s => s.hero);
  const buyItem = useGameStore(s => s.buyItem);
  const [notification, setNotification] = useState<string | null>(null);
  const [seed, setSeed] = useState(0);

  const shopItems = useMemo(() => {
    const items = getItemsForLevel(hero.level, 6);
    return items.map(item => ({ item, price: Math.round(item.goldValue * 1.5) }));
  }, [hero.level, seed]);

  function handleBuy(item: Item, price: number) {
    const success = buyItem(item, price);
    if (success) {
      setNotification(`Kupiono: ${item.emoji} ${item.name}`);
    } else if (hero.gold < price) {
      setNotification('Za mało złota!');
    } else {
      setNotification('Plecak pełny!');
    }
    setTimeout(() => setNotification(null), 2000);
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-300">🛒 Sklep</h3>
        <div className="flex items-center gap-2">
          <span className="text-amber-400 font-bold text-sm">🪙 {hero.gold}</span>
          <button onClick={() => setSeed(s => s + 1)} className="btn btn-secondary text-xs py-1 px-2">🔄 Odśwież</button>
        </div>
      </div>

      <p className="text-slate-500 text-xs">Tylko kosmetyki i wygoda w prawdziwym sklepie — tu jest sprzęt z lochu!</p>

      {notification && (
        <div className="bg-amber-900/30 border border-amber-600 rounded-lg p-2 text-amber-300 text-sm text-center">
          {notification}
        </div>
      )}

      <div className="grid grid-cols-1 gap-2">
        {shopItems.map(({ item, price }, idx) => {
          const canAfford = hero.gold >= price;
          const statEntries = Object.entries(item.stats).filter(([, v]) => v && v > 0);
          return (
            <div key={`${item.id}-${idx}`} className={`bg-slate-900/60 rounded-lg p-3 border rarity-${item.rarity} border-current`}>
              <div className="flex items-start gap-2">
                <span className="text-2xl">{item.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm truncate rarity-${item.rarity}`}>{item.name}</p>
                  <p className="text-slate-500 text-xs capitalize">{item.slot} · Poz. {item.level}</p>
                  <p className="text-slate-400 text-xs">
                    {statEntries.map(([k, v]) => `+${v} ${k.slice(0,3)}`).join(' ')}
                    {item.attackBonus ? ` ⚔️+${item.attackBonus}` : ''}
                    {item.defenseBonus ? ` 🛡️+${item.defenseBonus}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => handleBuy(item, price)}
                  disabled={!canAfford}
                  className="btn btn-primary text-xs py-1 px-2 whitespace-nowrap"
                >
                  🪙 {price}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
