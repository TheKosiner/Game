import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { SHOP_REFRESH_COOLDOWN } from '../store/gameStore';
import { generateShopItems } from '../data/items';
import ItemIcon from './ItemIcon';
import type { Item } from '../types';

const RARITY_COLORS: Record<string, string> = {
  common: '#94a3b8',
  uncommon: '#4ade80',
  rare: '#60a5fa',
  epic: '#c084fc',
  legendary: '#f59e0b',
};

const RARITY_GLOW: Record<string, string> = {
  common: 'transparent',
  uncommon: 'rgba(74,222,128,0.15)',
  rare: 'rgba(96,165,250,0.15)',
  epic: 'rgba(192,132,252,0.2)',
  legendary: 'rgba(245,158,11,0.25)',
};

const RARITY_LABEL: Record<string, string> = {
  common: 'ZWYKŁY',
  uncommon: 'NIEZWYKŁY',
  rare: 'RZADKI',
  epic: 'EPICKI',
  legendary: 'LEGENDARNY',
};

const SLOT_LABEL: Record<string, string> = {
  weapon: 'Broń', armor: 'Zbroja', helmet: 'Hełm',
  boots: 'Buty', ring: 'Pierścień', amulet: 'Amulet',
};

function CooldownTimer({ cooldownEnd }: { cooldownEnd: number }) {
  const [remaining, setRemaining] = useState(Math.max(0, cooldownEnd - Date.now()));

  useEffect(() => {
    const id = setInterval(() => {
      const r = Math.max(0, cooldownEnd - Date.now());
      setRemaining(r);
      if (r === 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [cooldownEnd]);

  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  return (
    <span style={{ color: '#60a5fa', textShadow: '0 0 8px rgba(96,165,250,0.6)' }}>
      {mins}:{secs.toString().padStart(2, '0')}
    </span>
  );
}

export default function ShopPanel() {
  const hero = useGameStore(s => s.hero);
  const buyShopItem = useGameStore(s => s.buyShopItem);
  const refreshShop = useGameStore(s => s.refreshShop);
  const shopSeed = useGameStore(s => s.shopSeed);
  const lastShopRefresh = useGameStore(s => s.lastShopRefresh);
  const shopPurchased = useGameStore(s => s.shopPurchased);

  const [notification, setNotification] = useState<{ text: string; ok: boolean } | null>(null);

  const shopItems = generateShopItems(hero.level, shopSeed);

  const cooldownEnd = lastShopRefresh + SHOP_REFRESH_COOLDOWN;
  const canRefresh = Date.now() >= cooldownEnd;

  function handleBuy(item: Item, price: number, slotIndex: number) {
    const success = buyShopItem(item, price, slotIndex);
    if (success) {
      setNotification({ text: `Kupiono: ${item.name}`, ok: true });
    } else if (hero.gold < price) {
      setNotification({ text: 'Za mało złota!', ok: false });
    } else {
      setNotification({ text: 'Plecak pełny!', ok: false });
    }
    setTimeout(() => setNotification(null), 2500);
  }

  return (
    <div className="card p-4" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 10, marginBottom: 2,
            background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>🛒 SKLEP</p>
          <p style={{ color: '#475569', fontSize: 6 }}>Ekwipunek dobierany do Twojego poziomu</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            color: '#fbbf24', fontSize: 8,
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 3,
            padding: '3px 8px',
          }}>🪙 {hero.gold}</span>
          <button
            onClick={refreshShop}
            disabled={!canRefresh}
            className="btn btn-secondary"
            style={{ fontSize: 6, padding: '5px 8px', opacity: canRefresh ? 1 : 0.6 }}
          >
            🔄 Odśwież
          </button>
        </div>
      </div>

      {/* Cooldown banner */}
      {!canRefresh && (
        <div style={{
          background: 'rgba(10,20,40,0.7)',
          border: '1px solid rgba(51,65,85,0.5)',
          borderRadius: 4,
          padding: '6px 10px',
          textAlign: 'center',
        }}>
          <p style={{ color: '#64748b', fontSize: 6 }}>
            ⏳ Następne odświeżenie za: <CooldownTimer cooldownEnd={cooldownEnd} />
          </p>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div style={{
          background: notification.ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${notification.ok ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
          borderRadius: 4,
          padding: '7px 12px',
          textAlign: 'center',
          color: notification.ok ? '#4ade80' : '#f87171',
          fontSize: 7,
        }}>
          {notification.text}
        </div>
      )}

      {/* Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {shopItems.map(({ item, price, featured }, idx) => {
          if (shopPurchased.includes(idx)) return null;
          const canAfford = hero.gold >= price;
          const rarityColor = RARITY_COLORS[item.rarity];
          const glowBg = RARITY_GLOW[item.rarity];
          const isRare = item.rarity === 'rare' || item.rarity === 'epic' || item.rarity === 'legendary';
          const statEntries = Object.entries(item.stats).filter(([, v]) => v && (v as number) > 0);

          return (
            <div
              key={`${item.id}-${idx}`}
              style={{
                background: isRare
                  ? `linear-gradient(135deg, ${glowBg}, rgba(5,8,20,0.95))`
                  : 'rgba(5,8,20,0.7)',
                border: `1px solid ${isRare ? rarityColor + '55' : 'rgba(30,41,59,0.7)'}`,
                borderRadius: 4,
                padding: 10,
                boxShadow: isRare ? `0 0 20px ${rarityColor}22` : 'none',
                position: 'relative',
              }}
            >
              {featured && (
                <div style={{
                  position: 'absolute', top: -1, right: 8,
                  background: rarityColor,
                  color: '#000',
                  fontSize: 5,
                  padding: '2px 5px',
                  borderRadius: '0 0 3px 3px',
                  fontFamily: "'Press Start 2P', monospace",
                  letterSpacing: '0.05em',
                }}>
                  ★ OFERTA
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Icon */}
                <div style={{
                  background: 'rgba(5,8,20,0.9)',
                  border: `1px solid ${rarityColor}33`,
                  borderRadius: 3,
                  padding: '6px 8px',
                  flexShrink: 0,
                  boxShadow: isRare ? `0 0 12px ${rarityColor}44` : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <ItemIcon item={item} scale={3} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                    <span style={{
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: 5,
                      color: 'var(--text-muted)',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      padding: '1px 3px',
                      flexShrink: 0,
                    }}>
                      {SLOT_LABEL[item.slot] ?? item.slot.toUpperCase()}
                    </span>
                    <p style={{ color: rarityColor, fontSize: 7, textShadow: isRare ? `0 0 8px ${rarityColor}88` : 'none' }}>
                      {item.name}
                    </p>
                    <span style={{
                      color: rarityColor, fontSize: 5,
                      background: rarityColor + '18',
                      border: `1px solid ${rarityColor}44`,
                      borderRadius: 2,
                      padding: '1px 3px',
                    }}>
                      {RARITY_LABEL[item.rarity]}
                    </span>
                  </div>
                  <p style={{ color: '#475569', fontSize: 6, marginBottom: 3 }}>
                    {SLOT_LABEL[item.slot] ?? item.slot} · Poz. {item.level}
                  </p>
                  <p style={{ color: '#64748b', fontSize: 6 }}>
                    {statEntries.map(([k, v]) => `+${v} ${({ strength: 'Siła', dexterity: 'Zwin', intelligence: 'Intel', vitality: 'Kond' } as Record<string, string>)[k] ?? k}`).join('  ')}
                    {item.attackBonus ? `  ⚔️ +${item.attackBonus}` : ''}
                    {item.defenseBonus ? `  🛡 +${item.defenseBonus}` : ''}
                  </p>
                </div>

                {/* Buy button */}
                <button
                  onClick={() => handleBuy(item, price, idx)}
                  disabled={!canAfford}
                  style={{
                    background: canAfford
                      ? `linear-gradient(135deg, ${rarityColor}22, rgba(5,8,20,0.9))`
                      : 'rgba(15,23,42,0.6)',
                    border: `1px solid ${canAfford ? rarityColor + '55' : 'rgba(51,65,85,0.4)'}`,
                    borderRadius: 3,
                    padding: '6px 8px',
                    color: canAfford ? rarityColor : '#475569',
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: 6,
                    cursor: canAfford ? 'pointer' : 'not-allowed',
                    flexShrink: 0,
                    textAlign: 'center',
                    minWidth: 54,
                    transition: 'all 0.15s',
                    boxShadow: canAfford && isRare ? `0 0 10px ${rarityColor}33` : 'none',
                  }}
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
