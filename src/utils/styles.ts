/** Shared style constants — enforces WCAG minimum font sizes */

import type { Item } from '../types';

/** Press Start 2P pixel font. Minimum enforced at 10px for WCAG readability. */
export const PX = (s: number) => ({
  fontFamily: "'Press Start 2P', monospace",
  fontSize: Math.max(s, 10),
} as const);

/** Share Tech Mono — body/value text */
export const MONO = { fontFamily: "'Share Tech Mono', monospace" } as const;

/** Orbitron — accent/title text */
export const ORB  = { fontFamily: "'Orbitron', monospace", fontWeight: 700 } as const;

/** Weapon type badges: WRĘCZ / DYSTANSOWA / MAGICZNA */
export function WeaponBadges({ item, ml = 0 }: { item: Item; ml?: number }): JSX.Element | null {
  if (item.slot !== 'weapon') return null;
  const s: React.CSSProperties = {
    ...MONO, fontSize: 10,
    padding: '1px 5px',
    marginLeft: ml,
    display: 'inline-block',
  };
  if (!item.ranged && !item.magicDamage) return (
    <span style={{ ...s, color: '#ff9632', background: 'rgba(255,150,50,0.08)', border: '1px solid rgba(255,150,50,0.3)' }}>
      ⚔ WRĘCZ
    </span>
  );
  return (
    <>
      {item.ranged && (
        <span style={{ ...s, color: '#00f5ff', background: 'rgba(0,245,255,0.08)', border: '1px solid rgba(0,245,255,0.3)' }}>
          🔫 DYST
        </span>
      )}
      {item.magicDamage && (
        <span style={{ ...s, color: '#c078f0', background: 'rgba(192,120,240,0.08)', border: '1px solid rgba(192,120,240,0.3)', marginLeft: item.ranged ? 4 : ml }}>
          🔮 MAGICZNA
        </span>
      )}
    </>
  );
}
