import { useT } from '../hooks/useT';
import type { PlaySub, SocialSub, GuildTabSub, ShopSub } from './BottomNav';
import { ORB } from '../utils/styles';

interface SubNavProps<T extends string> {
  tabs: { id: T; label: string; badge?: number }[];
  active: T;
  onChange: (id: T) => void;
  centered?: boolean;
}

export function SubNavBar<T extends string>({ tabs, active, onChange, centered }: SubNavProps<T>) {
  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 35,
      backdropFilter: 'blur(16px) saturate(160%)',
      WebkitBackdropFilter: 'blur(16px) saturate(160%)',
      background: 'rgba(5, 5, 15, 0.92)',
      borderBottom: '1px solid rgba(255,45,120,0.2)',
      boxShadow: '0 4px 24px rgba(0,0,0,0.7), inset 0 -1px 0 rgba(255,45,120,0.1)',
      display: 'flex',
      justifyContent: centered ? 'center' : 'stretch',
      overflowX: 'auto',
      scrollbarWidth: 'none',
      gap: 2,
      padding: '6px 6px 0',
    }}>
      {tabs.map(tab => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              flex: centered ? '0 0 auto' : 1,
              minWidth: centered ? 80 : 0,
              padding: '8px 10px 10px',
              background: isActive
                ? 'linear-gradient(180deg, rgba(255,45,120,0.18) 0%, rgba(255,45,120,0.08) 100%)'
                : 'transparent',
              border: 'none',
              borderRadius: '4px 4px 0 0',
              borderBottom: `2px solid ${isActive ? '#ff2d78' : 'transparent'}`,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              transition: 'all 0.18s',
              position: 'relative',
            }}
          >
            {/* Active glow line */}
            {isActive && (
              <div style={{
                position: 'absolute',
                bottom: -1, left: '20%', right: '20%',
                height: 2,
                background: 'linear-gradient(90deg, transparent, #ff2d78, transparent)',
                filter: 'blur(3px)',
              }} />
            )}
            <span style={{
              ...ORB, fontSize: 9,
              color: isActive ? '#ff2d78' : 'rgba(255,255,255,0.38)',
              textShadow: isActive ? '0 0 12px rgba(255,45,120,0.9), 0 0 24px rgba(255,45,120,0.4)' : 'none',
              letterSpacing: '0.12em',
              whiteSpace: 'nowrap',
              transition: 'color 0.18s, text-shadow 0.18s',
            }}>
              {tab.label}
            </span>
            {tab.badge != null && tab.badge > 0 && (
              <span style={{
                ...ORB, fontSize: 8,
                background: 'linear-gradient(135deg, #ff2d78, #ff6eb4)',
                color: '#fff',
                borderRadius: 8, padding: '1px 5px',
                minWidth: 16, textAlign: 'center',
                lineHeight: '14px',
                boxShadow: '0 0 8px rgba(255,45,120,0.6)',
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

export function PlaySubNav({ active, onChange, questBadge }: { active: PlaySub; onChange: (t: PlaySub) => void; questBadge?: boolean }) {
  const t = useT();
  return (
    <SubNavBar
      tabs={[
        { id: 'dungeon'   as PlaySub, label: t.nav.dungeon },
        { id: 'challenge' as PlaySub, label: t.nav.boss },
        { id: 'quests'    as PlaySub, label: t.nav.quests, badge: questBadge ? 1 : 0 },
        { id: 'pvp'       as PlaySub, label: t.nav.arena },
        { id: 'krypta'    as PlaySub, label: 'KRYPTA' },
      ]}
      active={active}
      onChange={onChange}
    />
  );
}

export function SocialSubNav({
  active, onChange, mailBadge, chatBadge,
}: {
  active: SocialSub;
  onChange: (t: SocialSub) => void;
  mailBadge?: number;
  chatBadge?: boolean;
}) {
  const t = useT();
  return (
    <SubNavBar
      tabs={[
        { id: 'ranking' as SocialSub, label: t.nav.ranking },
        { id: 'chat'    as SocialSub, label: t.nav.chat, badge: chatBadge ? 1 : 0 },
        { id: 'mail'    as SocialSub, label: t.nav.mail, badge: mailBadge },
      ]}
      active={active}
      onChange={onChange}
    />
  );
}

export const GuildSubNav = SocialSubNav;

export function GuildTabSubNav({ active, onChange }: { active: GuildTabSub; onChange: (t: GuildTabSub) => void }) {
  return (
    <SubNavBar
      tabs={[
        { id: 'info'      as GuildTabSub, label: 'INFO' },
        { id: 'boss'      as GuildTabSub, label: 'BOSS' },
        { id: 'chat'      as GuildTabSub, label: 'CHAT' },
        { id: 'territory' as GuildTabSub, label: 'MAPA' },
        { id: 'ops'       as GuildTabSub, label: 'RAJD' },
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
        { id: 'shop'      as ShopSub, label: t.nav.shop },
        { id: 'smith'     as ShopSub, label: t.nav.smith },
        { id: 'enchanter' as ShopSub, label: 'ZAKLINACZ' },
        { id: 'casino'    as ShopSub, label: t.nav.casino },
        { id: 'gems'      as ShopSub, label: t.nav.gems },
      ]}
      active={active}
      onChange={onChange}
    />
  );
}
