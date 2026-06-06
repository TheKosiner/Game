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
      background: 'linear-gradient(180deg, #07070f 0%, #0c0c1a 100%)',
      borderBottom: '2px solid rgba(255,45,120,0.25)',
      boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
      display: 'flex',
      justifyContent: centered ? 'center' : 'stretch',
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
              flex: centered ? '0 0 auto' : 1,
              minWidth: centered ? 80 : 0,
              padding: '12px 6px',
              background: isActive
                ? 'linear-gradient(180deg, rgba(255,45,120,0.15) 0%, rgba(255,45,120,0.05) 100%)'
                : 'transparent',
              border: 'none',
              borderBottom: `3px solid ${isActive ? '#ff2d78' : 'transparent'}`,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'all 0.15s',
            }}
          >
            <span style={{
              ...ORB, fontSize: 10,
              color: isActive ? '#ff2d78' : 'rgba(255,255,255,0.45)',
              textShadow: isActive ? '0 0 10px rgba(255,45,120,0.7)' : 'none',
              letterSpacing: '0.1em',
              whiteSpace: 'nowrap',
            }}>
              {tab.label}
            </span>
            {tab.badge != null && tab.badge > 0 && (
              <span style={{
                ...ORB, fontSize: 10,
                background: '#ff2d78', color: '#000',
                borderRadius: 10, padding: '1px 6px',
                minWidth: 18, textAlign: 'center',
                lineHeight: '14px',
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
        { id: 'gems'      as ShopSub, label: t.nav.gems },
        { id: 'smith'     as ShopSub, label: t.nav.smith },
        { id: 'casino'    as ShopSub, label: t.nav.casino },
        { id: 'enchanter' as ShopSub, label: 'ZAKLINACZ' },
      ]}
      active={active}
      onChange={onChange}
    />
  );
}
