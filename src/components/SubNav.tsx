import { useT } from '../hooks/useT';
import type { PlaySub, SocialSub, ShopSub } from './BottomNav';

const ORB = { fontFamily: "'Orbitron', monospace", fontWeight: 700 } as const;

interface SubNavProps<T extends string> {
  tabs: { id: T; label: string; badge?: number }[];
  active: T;
  onChange: (id: T) => void;
}

function SubNavBar<T extends string>({ tabs, active, onChange }: SubNavProps<T>) {
  return (
    <div style={{
      display: 'flex',
      background: 'rgba(0,0,0,0.6)',
      borderBottom: '1px solid rgba(255,45,120,0.15)',
      overflowX: 'auto',
      scrollbarWidth: 'none',
    }}>
      {tabs.map(tab => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              flex: '0 0 auto',
              padding: '9px 14px',
              background: isActive ? 'rgba(255,45,120,0.1)' : 'transparent',
              border: 'none',
              borderBottom: `2px solid ${isActive ? '#ff2d78' : 'transparent'}`,
              cursor: 'pointer',
              position: 'relative',
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            <span style={{
              ...ORB, fontSize: 7,
              color: isActive ? '#ff2d78' : 'rgba(255,255,255,0.35)',
              textShadow: isActive ? '0 0 8px rgba(255,45,120,0.5)' : 'none',
              letterSpacing: '0.08em',
              whiteSpace: 'nowrap',
            }}>
              {tab.label}
            </span>
            {tab.badge != null && tab.badge > 0 && (
              <span style={{
                ...ORB, fontSize: 6,
                background: '#ff2d78', color: '#000',
                borderRadius: 10, padding: '1px 5px',
                minWidth: 16, textAlign: 'center',
              }}>
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function PlaySubNav({ active, onChange }: { active: PlaySub; onChange: (t: PlaySub) => void }) {
  const t = useT();
  return (
    <SubNavBar
      tabs={[
        { id: 'dungeon'   as PlaySub, label: t.nav.dungeon },
        { id: 'challenge' as PlaySub, label: t.nav.boss },
        { id: 'quests'    as PlaySub, label: t.nav.quests },
      ]}
      active={active}
      onChange={onChange}
    />
  );
}

export function SocialSubNav({
  active, onChange, mailBadge,
}: {
  active: SocialSub;
  onChange: (t: SocialSub) => void;
  mailBadge?: number;
}) {
  const t = useT();
  return (
    <SubNavBar
      tabs={[
        { id: 'guild'   as SocialSub, label: t.nav.guild },
        { id: 'pvp'     as SocialSub, label: t.nav.arena },
        { id: 'ranking' as SocialSub, label: t.nav.ranking },
        { id: 'chat'    as SocialSub, label: t.nav.chat },
        { id: 'mail'    as SocialSub, label: t.nav.mail, badge: mailBadge },
      ]}
      active={active}
      onChange={onChange}
    />
  );
}

export function ShopSubNav({ active, onChange }: { active: ShopSub; onChange: (t: ShopSub) => void }) {
  const t = useT();
  return (
    <SubNavBar
      tabs={[
        { id: 'shop' as ShopSub, label: t.nav.shop },
        { id: 'gems' as ShopSub, label: t.nav.gems },
      ]}
      active={active}
      onChange={onChange}
    />
  );
}
