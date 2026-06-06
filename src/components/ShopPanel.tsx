import { useState, useEffect, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { SHOP_REFRESH_COOLDOWN } from '../store/gameStore';
import { generateShopItems } from '../data/items';
import ItemIcon from './ItemIcon';
import type { Item } from '../types';
import { useT } from '../hooks/useT';
import { useLangStore } from '../store/langStore';
import { getItemName } from '../data/itemGenerator';
import { ComparePanel } from './ItemCompare';
import { WeaponBadges } from '../utils/styles';

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
  const t    = useT();
  const lang = useLangStore(s => s.lang);
  const hero = useGameStore(s => s.hero);
  const buyShopItem  = useGameStore(s => s.buyShopItem);
  const refreshShop  = useGameStore(s => s.refreshShop);
  const shopSeed     = useGameStore(s => s.shopSeed);
  const lastShopRefresh = useGameStore(s => s.lastShopRefresh);
  const shopPurchased   = useGameStore(s => s.shopPurchased);

  const SLOT_LABEL = useMemo<Record<string, string>>(() => ({
    weapon: t.shop.slotWeapon, armor: t.shop.slotArmor,
    helmet: t.shop.slotHelmet, boots: t.shop.slotBoots,
    ring: t.shop.slotRing, amulet: t.shop.slotAmulet,
    consumable: t.inventory.slotConsumable,
  }), [t]);

  const [notification, setNotification] = useState<{ text: string; ok: boolean } | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const allItems = useMemo(() => generateShopItems(hero.level, shopSeed), [hero.level, shopSeed]);
  const shopItems = useMemo(
    () => allItems.map((s, idx) => ({ ...s, idx })).filter(({ idx }) => !shopPurchased.includes(idx)),
    [allItems, shopPurchased],
  );

  const cooldownEnd = lastShopRefresh + SHOP_REFRESH_COOLDOWN;
  const canRefresh  = Date.now() >= cooldownEnd;

  function handleBuy(e: React.MouseEvent, item: Item, price: number, slotIndex: number) {
    e.stopPropagation();
    const success = buyShopItem(item, price, slotIndex);
    if (success) {
      setNotification({ text: t.shop.bought(getItemName(item, lang)), ok: true });
      setSelectedIdx(null);
    } else if (hero.gold < price) {
      setNotification({ text: t.shop.notEnoughGold, ok: false });
    } else {
      setNotification({ text: t.shop.backpackFull, ok: false });
    }
    setTimeout(() => setNotification(null), 2500);
  }

  const selectedEntry = selectedIdx !== null ? allItems[selectedIdx] : null;
  const equippedForSelected = selectedEntry && selectedEntry.item.slot !== 'consumable'
    ? hero.equipment[selectedEntry.item.slot as keyof typeof hero.equipment] as Item | undefined
    : undefined;

  function ShopItemCard({ item, price, idx }: { item: Item; price: number; idx: number }) {
    const canAfford   = hero.gold >= price;
    const rarityColor = item.color ?? RARITY_COLORS[item.rarity];
    const glowBg      = item.color ? `${item.color}22` : RARITY_GLOW[item.rarity];
    const isRare      = item.rarity === 'rare' || item.rarity === 'epic' || item.rarity === 'legendary' || !!item.color;
    const isSelected  = selectedIdx === idx;

    return (
      <div
        onClick={() => setSelectedIdx(isSelected ? null : idx)}
        role="button" tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') e.currentTarget.click(); }}
        style={{
          background: isRare ? `linear-gradient(135deg, ${glowBg}, rgba(5,8,20,0.95))` : 'rgba(5,8,20,0.8)',
          border: `1px solid ${isSelected ? rarityColor + 'cc' : isRare ? rarityColor + '55' : 'rgba(30,41,59,0.7)'}`,
          padding: '6px 5px',
          cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          boxShadow: isSelected ? `0 0 12px ${rarityColor}44` : 'none',
        }}
      >
        {/* Icon */}
        <div style={{
          background: 'rgba(5,8,20,0.9)', border: `1px solid ${rarityColor}33`,
          padding: '4px 5px', boxShadow: isRare ? `0 0 8px ${rarityColor}44` : 'none',
        }}>
          <ItemIcon item={item} scale={2} />
        </div>
        {/* Slot label */}
        <p style={{ fontSize: 7, color: 'var(--text-muted)', fontFamily: "'Share Tech Mono', monospace", textAlign: 'center', lineHeight: 1.2 }}>
          {SLOT_LABEL[item.slot] ?? item.slot}
        </p>
        {/* Name */}
        <p style={{
          fontSize: 7, color: rarityColor,
          textShadow: isRare ? `0 0 6px ${rarityColor}88` : 'none',
          textAlign: 'center', lineHeight: 1.3,
          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {getItemName(item, lang)}
        </p>
        <WeaponBadges item={item} />
        {/* Buy button */}
        <button
          onClick={e => handleBuy(e, item, price, idx)}
          disabled={!canAfford}
          style={{
            background: canAfford ? `linear-gradient(135deg, ${rarityColor}33, rgba(5,8,20,0.9))` : 'rgba(15,23,42,0.6)',
            border: `1px solid ${canAfford ? rarityColor + '66' : 'rgba(51,65,85,0.4)'}`,
            color: canAfford ? rarityColor : '#475569',
            fontFamily: "'Press Start 2P', monospace", fontSize: 8,
            padding: '4px 5px', width: '100%', cursor: canAfford ? 'pointer' : 'not-allowed',
            textAlign: 'center',
            boxShadow: canAfford && isRare ? `0 0 8px ${rarityColor}33` : 'none',
          }}
        >
          🪙{price}
        </button>
      </div>
    );
  }

  return (
    <div className="card p-4" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{
            fontSize: 10, marginBottom: 2,
            background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>{t.shop.title}</p>
          <p style={{ color: '#475569', fontSize: 10 }}>{t.shop.subtitle}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#fbbf24', fontSize: 10, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', padding: '3px 8px' }}>
            🪙 {hero.gold}
          </span>
          <button onClick={refreshShop} disabled={!canRefresh} className="btn btn-secondary"
            style={{ fontSize: 10, padding: '5px 8px', opacity: canRefresh ? 1 : 0.6 }}>
            {t.shop.refresh}
          </button>
        </div>
      </div>

      {/* Cooldown */}
      {!canRefresh && (
        <div style={{ background: 'rgba(10,20,40,0.7)', border: '1px solid rgba(51,65,85,0.5)', padding: '6px 10px', textAlign: 'center' }}>
          <p style={{ color: '#64748b', fontSize: 10 }}>{t.shop.nextRefresh('')} <CooldownTimer cooldownEnd={cooldownEnd} /></p>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div style={{
          background: notification.ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${notification.ok ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
          padding: '7px 12px', textAlign: 'center',
          color: notification.ok ? '#4ade80' : '#f87171', fontSize: 10,
        }}>
          {notification.text}
        </div>
      )}

      {/* Shop image */}
      <div style={{ position: 'relative' }}>
        <img
          src="/shop_bg.jpg"
          alt="Shop"
          style={{ width: '100%', height: 'auto', display: 'block', border: '1px solid rgba(245,158,11,0.2)' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%)' }} />
      </div>

      {/* All items below the image */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {shopItems.map(({ item, price, idx }) => (
          <ShopItemCard key={idx} item={item} price={price} idx={idx} />
        ))}
      </div>

      {/* Comparison panel below the grid */}
      {selectedEntry && (
        <ComparePanel newItem={selectedEntry.item} equipped={equippedForSelected} />
      )}
    </div>
  );
}
