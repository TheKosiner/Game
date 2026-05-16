import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { SHOP_REFRESH_COOLDOWN } from '../store/gameStore';
import { generateShopItems } from '../data/items';
import ItemIcon from './ItemIcon';
import type { Item, Stats } from '../types';
import { useT } from '../hooks/useT';

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


const MONO = { fontFamily: "'Share Tech Mono', monospace" } as const;
const ORB  = { fontFamily: "'Orbitron', monospace", fontWeight: 700 } as const;
const PX   = (s: number) => ({ fontFamily: "'Press Start 2P', monospace", fontSize: s } as const);

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

// ── Item comparison panel ────────────────────────────────────────────────────

function StatDeltaRow({ label, oldVal, newVal }: { label: string; oldVal: number; newVal: number }) {
  const delta = newVal - oldVal;
  if (oldVal === 0 && newVal === 0) return null;
  const color = delta > 0 ? '#4ade80' : delta < 0 ? '#f87171' : '#94a3b8';
  const arrow = delta > 0 ? '▲' : delta < 0 ? '▼' : '';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ ...MONO, fontSize: 7, color: '#64748b', flex: 1, paddingLeft: 8, paddingTop: 3, paddingBottom: 3 }}>{label}</span>
      <span style={{ ...ORB, fontSize: 7, color: '#94a3b8', width: 32, textAlign: 'right', paddingRight: 6 }}>{oldVal || '—'}</span>
      <span style={{ ...ORB, fontSize: 8, color, width: 48, textAlign: 'center' }}>
        {delta !== 0 ? `${delta > 0 ? '+' : ''}${delta} ${arrow}` : '='}
      </span>
      <span style={{ ...ORB, fontSize: 7, color, width: 32, textAlign: 'left', paddingLeft: 6 }}>{newVal || '—'}</span>
    </div>
  );
}

function ComparePanel({ shopItem, equipped }: { shopItem: Item; equipped: Item | undefined }) {
  const t = useT();
  const STAT_LABELS: Record<string, string> = {
    strength: t.shop.statStrength,
    dexterity: t.shop.statDexterity,
    intelligence: t.shop.statIntelligence,
    vitality: t.shop.statVitality,
    magic: t.shop.statMagic,
    magicResistance: t.shop.statMagRes,
  };
  const shopColor  = RARITY_COLORS[shopItem.rarity];
  const eqColor    = equipped ? RARITY_COLORS[equipped.rarity] : '#475569';

  const shopAtk = shopItem.attackBonus  ?? 0;
  const eqAtk   = equipped?.attackBonus  ?? 0;
  const shopDef = shopItem.defenseBonus ?? 0;
  const eqDef   = equipped?.defenseBonus ?? 0;

  const allStats = Array.from(new Set([
    ...Object.keys(shopItem.stats),
    ...(equipped ? Object.keys(equipped.stats) : []),
  ])) as (keyof Stats)[];

  return (
    <div style={{
      background: 'rgba(2,6,18,0.97)',
      border: '1px solid rgba(255,255,255,0.1)',
      marginTop: 6,
    }}>
      {/* Header: equipped vs shop */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ flex: 1, padding: '7px 8px', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ ...PX(4), color: '#475569', marginBottom: 3 }}>{t.shop.compareEquipped}</p>
          {equipped ? (
            <>
              <p style={{ ...MONO, fontSize: 7, color: eqColor, marginBottom: 1 }}>{equipped.name}</p>
              <p style={{ ...MONO, fontSize: 6, color: '#475569' }}>Poz. {equipped.level} · {RARITY_LABEL[equipped.rarity]}</p>
            </>
          ) : (
            <p style={{ ...MONO, fontSize: 7, color: '#334155' }}>{t.shop.compareNothingEquipped}</p>
          )}
        </div>
        <div style={{ flex: 1, padding: '7px 8px' }}>
          <p style={{ ...PX(4), color: '#475569', marginBottom: 3 }}>{t.shop.compareShop}</p>
          <p style={{ ...MONO, fontSize: 7, color: shopColor, marginBottom: 1 }}>{shopItem.name}</p>
          <p style={{ ...MONO, fontSize: 6, color: '#475569' }}>Poz. {shopItem.level} · {RARITY_LABEL[shopItem.rarity]}</p>
        </div>
      </div>

      {/* Column labels */}
      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ ...PX(4), color: '#334155', flex: 1, paddingLeft: 8, paddingTop: 4, paddingBottom: 4 }}>{t.shop.compareStat}</span>
        <span style={{ ...PX(4), color: '#475569', width: 32, textAlign: 'right', paddingRight: 6, paddingTop: 4, paddingBottom: 4 }}>{t.shop.compareYours}</span>
        <span style={{ ...PX(4), color: '#475569', width: 48, textAlign: 'center', paddingTop: 4, paddingBottom: 4 }}>{t.shop.compareDelta}</span>
        <span style={{ ...PX(4), color: '#475569', width: 32, paddingLeft: 6, paddingTop: 4, paddingBottom: 4 }}>{t.shop.compareNew}</span>
      </div>

      {/* Stat rows */}
      {(shopAtk > 0 || eqAtk > 0) && <StatDeltaRow label={t.shop.compareAtk} oldVal={eqAtk} newVal={shopAtk} />}
      {(shopDef > 0 || eqDef > 0) && <StatDeltaRow label={t.shop.compareDef} oldVal={eqDef} newVal={shopDef} />}
      {allStats.map(k => (
        <StatDeltaRow
          key={k}
          label={STAT_LABELS[k] ?? k}
          oldVal={(equipped?.stats[k] ?? 0) as number}
          newVal={(shopItem.stats[k] ?? 0) as number}
        />
      ))}
    </div>
  );
}

// ── Main panel ───────────────────────────────────────────────────────────────

export default function ShopPanel() {
  const t = useT();
  const hero = useGameStore(s => s.hero);
  const buyShopItem = useGameStore(s => s.buyShopItem);
  const refreshShop = useGameStore(s => s.refreshShop);
  const shopSeed = useGameStore(s => s.shopSeed);
  const lastShopRefresh = useGameStore(s => s.lastShopRefresh);
  const shopPurchased = useGameStore(s => s.shopPurchased);

  const SLOT_LABEL: Record<string, string> = {
    weapon: t.shop.slotWeapon,
    armor: t.shop.slotArmor,
    helmet: t.shop.slotHelmet,
    boots: t.shop.slotBoots,
    ring: t.shop.slotRing,
    amulet: t.shop.slotAmulet,
  };

  const [notification, setNotification] = useState<{ text: string; ok: boolean } | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const shopItems = generateShopItems(hero.level, shopSeed);

  const cooldownEnd = lastShopRefresh + SHOP_REFRESH_COOLDOWN;
  const canRefresh = Date.now() >= cooldownEnd;

  function handleBuy(e: React.MouseEvent, item: Item, price: number, slotIndex: number) {
    e.stopPropagation();
    const success = buyShopItem(item, price, slotIndex);
    if (success) {
      setNotification({ text: t.shop.bought(item.name), ok: true });
      setSelectedIdx(null);
    } else if (hero.gold < price) {
      setNotification({ text: t.shop.notEnoughGold, ok: false });
    } else {
      setNotification({ text: t.shop.backpackFull, ok: false });
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
          }}>{t.shop.title}</p>
          <p style={{ color: '#475569', fontSize: 6 }}>{t.shop.subtitle}</p>
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
            {t.shop.refresh}
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
            {t.shop.nextRefresh('')} <CooldownTimer cooldownEnd={cooldownEnd} />
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
          const isSelected = selectedIdx === idx;
          const statEntries = Object.entries(item.stats).filter(([, v]) => v && (v as number) > 0);
          const equipped = item.slot !== 'consumable' ? hero.equipment[item.slot as keyof typeof hero.equipment] : undefined;

          return (
            <div key={`${item.id}-${idx}`}>
              <div
                onClick={() => setSelectedIdx(isSelected ? null : idx)}
                style={{
                  background: isRare
                    ? `linear-gradient(135deg, ${glowBg}, rgba(5,8,20,0.95))`
                    : 'rgba(5,8,20,0.7)',
                  border: `1px solid ${isSelected ? rarityColor + 'aa' : isRare ? rarityColor + '55' : 'rgba(30,41,59,0.7)'}`,
                  borderRadius: isSelected ? '4px 4px 0 0' : 4,
                  padding: 10,
                  boxShadow: isRare ? `0 0 20px ${rarityColor}22` : 'none',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
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
                    {t.shop.featured}
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
                      {item.ranged && (
                        <span style={{
                          fontFamily: "'Share Tech Mono', monospace",
                          fontSize: 5, color: '#00f5ff',
                          background: 'rgba(0,245,255,0.08)',
                          border: '1px solid rgba(0,245,255,0.3)',
                          padding: '1px 3px', flexShrink: 0,
                        }}>
                          🔫 {t.shop.ranged}
                        </span>
                      )}
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
                      {statEntries.map(([k, v]) => `+${v} ${({ strength: t.shop.statStr, dexterity: t.shop.statDex, intelligence: t.shop.statInt, vitality: t.shop.statVit } as Record<string, string>)[k] ?? k}`).join('  ')}
                      {item.attackBonus ? `  ⚔️ +${item.attackBonus}` : ''}
                      {item.defenseBonus ? `  🛡 +${item.defenseBonus}` : ''}
                    </p>
                  </div>

                  {/* Buy button */}
                  <button
                    onClick={(e) => handleBuy(e, item, price, idx)}
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

              {/* Inline comparison panel */}
              {isSelected && (
                <ComparePanel shopItem={item} equipped={equipped as Item | undefined} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
