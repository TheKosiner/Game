import logoImg from '../assets/logo.png';
import { useGameStore } from '../store/gameStore';
import { useT } from '../hooks/useT';
import { useLangStore } from '../store/langStore';
import { TabIcon, type MainTab, type PlaySub, type SocialSub, type ShopSub } from './BottomNav';

const ORB: React.CSSProperties = { fontFamily: "'Orbitron', monospace", fontWeight: 700 };
const MONO: React.CSSProperties = { fontFamily: "'Share Tech Mono', monospace" };

interface Props {
  tab: MainTab;
  playSub: PlaySub;
  socialSub: SocialSub;
  shopSub: ShopSub;
  questBadge: boolean;
  mailUnread: number;
  chatHasNew: boolean;
  onTab: (t: MainTab) => void;
  onPlay: (t: PlaySub) => void;
  onSocial: (t: SocialSub) => void;
  onShop: (t: ShopSub) => void;
  onLogout: () => void;
  onReset: () => void;
}

function NavItem({
  label, icon, active, onClick, badge,
}: {
  label: string; icon: string; active: boolean;
  onClick: () => void; badge?: number | boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="desktop-nav-btn"
      style={{
        width: '100%', padding: '8px 16px 8px 20px',
        display: 'flex', alignItems: 'center', gap: 10,
        background: active ? 'rgba(255,45,120,0.1)' : 'transparent',
        borderLeft: `3px solid ${active ? '#ff2d78' : 'transparent'}`,
        border: 'none',
        borderLeftWidth: 3,
        borderLeftStyle: 'solid',
        borderLeftColor: active ? '#ff2d78' : 'transparent',
        cursor: 'pointer',
        transition: 'all 0.15s',
        textAlign: 'left',
        position: 'relative',
      }}
    >
      <span style={{ fontSize: 14, width: 18, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
      <span style={{
        ...MONO, fontSize: 11,
        color: active ? '#fff' : 'rgba(255,255,255,0.55)',
        textShadow: active ? '0 0 8px rgba(255,45,120,0.6)' : 'none',
        letterSpacing: 0.5,
      }}>{label}</span>
      {badge !== undefined && badge !== false && badge !== 0 && (
        <span style={{
          ...ORB, fontSize: 8,
          background: '#ff2d78', color: '#fff',
          borderRadius: 999, padding: '1px 5px',
          marginLeft: 'auto',
          minWidth: 16, textAlign: 'center',
        }}>
          {typeof badge === 'number' ? badge : '●'}
        </span>
      )}
    </button>
  );
}

function SectionNavItem({
  label, tabId, active, onClick,
}: {
  label: string; tabId: MainTab; active: boolean; onClick: () => void;
}) {
  const color = active ? '#ff2d78' : 'rgba(255,255,255,0.45)';
  return (
    <button
      onClick={onClick}
      className="desktop-nav-top"
      style={{
        width: '100%', padding: '10px 16px',
        display: 'flex', alignItems: 'center', gap: 10,
        background: active ? 'rgba(255,45,120,0.1)' : 'transparent',
        border: 'none',
        borderLeft: `3px solid ${active ? '#ff2d78' : 'transparent'}`,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.15s',
      }}
    >
      <span style={{
        flexShrink: 0,
        filter: active ? 'drop-shadow(0 0 5px #ff2d78)' : 'none',
        display: 'flex', alignItems: 'center',
      }}>
        <TabIcon id={tabId} color={color} />
      </span>
      <span style={{
        ...ORB, fontSize: 11,
        color: active ? '#fff' : 'rgba(255,255,255,0.55)',
        textShadow: active ? '0 0 8px rgba(255,45,120,0.6)' : 'none',
        letterSpacing: 1,
      }}>{label}</span>
    </button>
  );
}

export default function DesktopSidebar({
  tab, playSub, socialSub, shopSub,
  questBadge, mailUnread, chatHasNew,
  onTab, onPlay, onSocial, onShop,
  onLogout, onReset,
}: Props) {
  const hero = useGameStore(s => s.hero);
  const { lang, setLang } = useLangStore();
  const t = useT();

  return (
    <aside style={{
      width: 230,
      flexShrink: 0,
      background: 'linear-gradient(180deg, #05050e 0%, #07070f 100%)',
      borderRight: '1px solid rgba(255,45,120,0.2)',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
      overflowX: 'hidden',
    }}>

      {/* Logo */}
      <div style={{
        padding: '14px 16px 10px',
        borderBottom: '1px solid rgba(255,45,120,0.15)',
        display: 'flex', alignItems: 'center', gap: 10,
        flexShrink: 0,
      }}>
        <img src={logoImg} alt="Glitch Soul" style={{ width: 32, height: 32, objectFit: 'contain', filter: 'drop-shadow(0 0 8px rgba(140,60,255,0.7))' }} />
        <span style={{ ...ORB, fontSize: 14, fontWeight: 900, letterSpacing: 1 }}>
          <span style={{ color: '#00f5ff', textShadow: '0 0 8px #00f5ff' }}>Glitch</span>
          <span style={{ color: '#ff2d78', textShadow: '0 0 8px #ff2d78' }}>Soul</span>
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, paddingTop: 4 }}>

        {/* Hero */}
        <SectionNavItem tabId="hero" label={t.nav.hero} active={tab === 'hero'} onClick={() => onTab('hero')} />

        {/* Play */}
        <SectionNavItem tabId="play" label={t.nav.play} active={tab === 'play'} onClick={() => { onTab('play'); onPlay('dungeon'); }} />
        <NavItem icon="🏰" label={t.nav.dungeon} active={tab === 'play' && playSub === 'dungeon'}
          onClick={() => { onTab('play'); onPlay('dungeon'); }} />
        <NavItem icon="💀" label={t.nav.boss} active={tab === 'play' && playSub === 'challenge'}
          onClick={() => { onTab('play'); onPlay('challenge'); }} />
        <NavItem icon="📋" label={t.nav.quests} active={tab === 'play' && playSub === 'quests'}
          onClick={() => { onTab('play'); onPlay('quests'); }} badge={questBadge} />

        {/* Social */}
        <SectionNavItem tabId="social" label={t.nav.social} active={tab === 'social'} onClick={() => { onTab('social'); onSocial('guild'); }} />
        <NavItem icon="⚔" label={t.nav.arena} active={tab === 'social' && socialSub === 'pvp'}
          onClick={() => { onTab('social'); onSocial('pvp'); }} />
        <NavItem icon="🏛" label={t.nav.guild} active={tab === 'social' && socialSub === 'guild'}
          onClick={() => { onTab('social'); onSocial('guild'); }} />
        <NavItem icon="🏆" label={t.nav.ranking} active={tab === 'social' && socialSub === 'ranking'}
          onClick={() => { onTab('social'); onSocial('ranking'); }} />
        <NavItem icon="💬" label={t.nav.chat} active={tab === 'social' && socialSub === 'chat'}
          onClick={() => { onTab('social'); onSocial('chat'); }} badge={chatHasNew} />
        <NavItem icon="✉" label={t.nav.mail} active={tab === 'social' && socialSub === 'mail'}
          onClick={() => { onTab('social'); onSocial('mail'); }} badge={mailUnread || undefined} />

        {/* Shop */}
        <SectionNavItem tabId="shop" label={t.nav.shop} active={tab === 'shop'} onClick={() => { onTab('shop'); onShop('shop'); }} />
        <NavItem icon="🛒" label={t.nav.shop} active={tab === 'shop' && shopSub === 'shop'}
          onClick={() => { onTab('shop'); onShop('shop'); }} />
        <NavItem icon="💎" label={t.nav.gems} active={tab === 'shop' && shopSub === 'gems'}
          onClick={() => { onTab('shop'); onShop('gems'); }} />

      </nav>

      {/* Bottom: stats + controls */}
      <div style={{
        borderTop: '1px solid rgba(255,45,120,0.15)',
        padding: '12px 14px',
        display: 'flex', flexDirection: 'column', gap: 8,
        flexShrink: 0,
      }}>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{
            ...ORB, fontSize: 10, color: '#ffd700',
            background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)',
            padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 3,
          }}>🪙 {hero.gold}</span>
          <span style={{
            ...ORB, fontSize: 10, color: '#00e5ff',
            background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)',
            padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 3,
          }}>💎 {hero.gems}</span>
          <span style={{
            ...ORB, fontSize: 10, color: '#00f5ff',
            background: 'rgba(0,245,255,0.08)', border: '1px solid rgba(0,245,255,0.2)',
            padding: '3px 8px',
          }}>{t.app.level(hero.level)}</span>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button onClick={() => setLang('pl')} aria-label="Język Polski" aria-pressed={lang === 'pl'} style={{
            ...ORB, fontSize: 9,
            color: lang === 'pl' ? '#00f5ff' : 'rgba(0,245,255,0.3)',
            background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
          }}>PL</button>
          <button onClick={() => setLang('en')} aria-label="English" aria-pressed={lang === 'en'} style={{
            ...ORB, fontSize: 9,
            color: lang === 'en' ? '#00f5ff' : 'rgba(0,245,255,0.3)',
            background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
          }}>EN</button>
          <span style={{ flex: 1 }} />
          <button onClick={onLogout} style={{
            ...MONO, fontSize: 9, color: 'rgba(255,45,120,0.7)',
            background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
          }}>{t.app.logout}</button>
          <button onClick={onReset} aria-label="Reset" style={{
            fontSize: 12, color: 'rgba(255,45,120,0.4)',
            background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
          }}>↩</button>
        </div>
      </div>
    </aside>
  );
}
