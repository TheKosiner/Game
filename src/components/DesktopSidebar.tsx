import { useState } from 'react';
import logoImg from '../assets/logo.webp';
import { useGameStore } from '../store/gameStore';
import { useT } from '../hooks/useT';
import { useLangStore } from '../store/langStore';
import { TabIcon, type MainTab, type PlaySub, type SocialSub, type ShopSub } from './BottomNav';
import GameIcon, { type GameIconName } from './GameIcon';
import AnimatedNumber from './AnimatedNumber';

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
}

function NavItem({
  label, icon, active, onClick, badge,
}: {
  label: string; icon: GameIconName; active: boolean;
  onClick: () => void; badge?: number | boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', padding: '7px 16px 7px 36px',
        display: 'flex', alignItems: 'center', gap: 8,
        background: active
          ? 'linear-gradient(90deg, rgba(255,45,120,0.14) 0%, rgba(255,45,120,0.04) 100%)'
          : 'transparent',
        border: 'none',
        borderLeft: `2px solid ${active ? '#ff2d78' : 'transparent'}`,
        cursor: 'pointer',
        transition: 'all 0.15s',
        textAlign: 'left',
        position: 'relative',
      }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,45,120,0.05)'; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
    >
      {/* active accent dot */}
      {active && (
        <span style={{
          position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)',
          width: 4, height: 4, borderRadius: '50%',
          background: '#ff2d78',
          boxShadow: '0 0 6px #ff2d78',
        }} />
      )}
      {icon && <span style={{ width: 16, textAlign: 'center', flexShrink: 0, opacity: active ? 1 : 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><GameIcon name={icon} size={12} /></span>}
      <span style={{
        ...MONO, fontSize: 10,
        color: active ? '#ffffff' : 'rgba(255,255,255,0.45)',
        textShadow: active ? '0 0 10px rgba(255,45,120,0.5)' : 'none',
        letterSpacing: '0.06em',
        transition: 'color 0.15s',
      }}>{label}</span>
      {badge !== undefined && badge !== false && badge !== 0 && (
        <span style={{
          ...ORB, fontSize: 8,
          background: 'linear-gradient(135deg, #ff2d78, #cc1f5e)',
          color: '#fff',
          borderRadius: 999, padding: '1px 5px',
          marginLeft: 'auto',
          minWidth: 16, textAlign: 'center',
          boxShadow: '0 0 6px rgba(255,45,120,0.5)',
        }}>
          {typeof badge === 'number' ? badge : '●'}
        </span>
      )}
    </button>
  );
}

function SectionNavItem({
  label, tabId, active, open, onToggle,
}: {
  label: string; tabId: MainTab; active: boolean; open: boolean; onToggle: () => void;
}) {
  const color = active ? '#ff2d78' : 'rgba(255,255,255,0.5)';
  return (
    <button
      onClick={onToggle}
      style={{
        width: '100%', padding: '9px 14px',
        display: 'flex', alignItems: 'center', gap: 10,
        background: active
          ? 'linear-gradient(90deg, rgba(255,45,120,0.12) 0%, rgba(255,45,120,0.03) 100%)'
          : 'transparent',
        border: 'none',
        borderLeft: `3px solid ${active ? '#ff2d78' : 'transparent'}`,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.15s',
        position: 'relative',
      }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,45,120,0.04)'; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
    >
      {active && (
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
          background: 'linear-gradient(180deg, transparent, #ff2d78, transparent)',
          filter: 'blur(2px)',
        }} />
      )}
      <span style={{
        flexShrink: 0,
        filter: active ? 'drop-shadow(0 0 6px #ff2d78)' : 'none',
        display: 'flex', alignItems: 'center',
        transition: 'filter 0.15s',
      }}>
        <TabIcon id={tabId} color={color} />
      </span>
      <span style={{
        ...ORB, fontSize: 10, flex: 1,
        color: active ? '#fff' : 'rgba(255,255,255,0.5)',
        textShadow: active ? '0 0 10px rgba(255,45,120,0.7)' : 'none',
        letterSpacing: '0.1em',
        transition: 'color 0.15s',
      }}>{label}</span>
      <span style={{
        fontSize: 9, color: 'rgba(255,255,255,0.25)',
        transition: 'transform 0.2s',
        display: 'inline-block',
        transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
      }}>▾</span>
    </button>
  );
}

function StatChip({ value, color, icon }: { value: string | number; color: string; icon: GameIconName }) {
  return (
    <span style={{
      ...ORB, fontSize: 9, color,
      background: `${color}10`,
      border: `1px solid ${color}28`,
      padding: '3px 8px',
      display: 'flex', alignItems: 'center', gap: 3,
      boxShadow: `0 0 8px ${color}10`,
      transition: 'box-shadow 0.2s',
    }}>
      <GameIcon name={icon} size={11} color={color} /> {typeof value === 'number' ? <AnimatedNumber value={value} gainColor={color} /> : value}
    </span>
  );
}

export default function DesktopSidebar({
  tab, playSub, socialSub, shopSub,
  questBadge, mailUnread, chatHasNew,
  onTab, onPlay, onSocial, onShop,
  onLogout,
}: Props) {
  const hero = useGameStore(s => s.hero);
  const { lang, setLang } = useLangStore();
  const t = useT();

  const [open, setOpen] = useState<Record<string, boolean>>(() => ({ [tab]: true }));
  function toggle(section: MainTab) {
    setOpen(prev => ({ ...prev, [section]: !prev[section] }));
  }
  function expandAndNav(section: MainTab, navFn: () => void) {
    setOpen(prev => ({ ...prev, [section]: true }));
    navFn();
  }

  return (
    <aside style={{
      width: 220,
      flexShrink: 0,
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      background: 'rgba(4, 4, 12, 0.88)',
      borderRight: '1px solid rgba(255,45,120,0.18)',
      boxShadow: '4px 0 32px rgba(0,0,0,0.5), inset -1px 0 0 rgba(0,245,255,0.04)',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
      overflowX: 'hidden',
    }}>

      {/* ── Logo ── */}
      <div style={{
        padding: '14px 16px 12px',
        borderBottom: '1px solid rgba(255,45,120,0.12)',
        display: 'flex', alignItems: 'center', gap: 10,
        flexShrink: 0,
        background: 'linear-gradient(180deg, rgba(255,45,120,0.05) 0%, transparent 100%)',
        position: 'relative',
      }}>
        {/* Top accent line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(255,45,120,0.6), rgba(0,245,255,0.3), transparent)',
        }} />
        <img src={logoImg} alt="Glitch Soul" style={{
          width: 30, height: 30, objectFit: 'contain',
          filter: 'drop-shadow(0 0 10px rgba(140,60,255,0.8)) drop-shadow(0 0 20px rgba(0,200,255,0.3))',
        }} />
        <span style={{ ...ORB, fontSize: 13, fontWeight: 900, letterSpacing: 1 }}>
          <span style={{ color: '#00f5ff', textShadow: '0 0 10px #00f5ff, 0 0 20px rgba(0,245,255,0.4)' }}>Glitch</span>
          <span style={{ color: '#ff2d78', textShadow: '0 0 10px #ff2d78, 0 0 20px rgba(255,45,120,0.4)' }}>Soul</span>
        </span>
      </div>

      {/* ── Nav ── */}
      <nav style={{ flex: 1, paddingTop: 6, paddingBottom: 4 }}>

        <SectionNavItem tabId="hero" label={t.nav.hero} active={tab === 'hero'} open={false}
          onToggle={() => { onTab('hero'); setOpen(prev => ({ ...prev, hero: false })); }} />

        <SectionNavItem tabId="play" label={t.nav.play} active={tab === 'play'} open={!!open['play']}
          onToggle={() => {
            if (!open['play']) expandAndNav('play', () => { onTab('play'); onPlay('dungeon'); });
            else toggle('play');
          }} />
        {open['play'] && (
          <div style={{ borderLeft: '1px solid rgba(255,45,120,0.12)', marginLeft: 14 }}>
            <NavItem icon="sword" label={t.nav.dungeon} active={tab === 'play' && playSub === 'dungeon'}
              onClick={() => { onTab('play'); onPlay('dungeon'); }} />
            <NavItem icon="monster" label={t.nav.boss} active={tab === 'play' && playSub === 'challenge'}
              onClick={() => { onTab('play'); onPlay('challenge'); }} />
            <NavItem icon="scroll" label={t.nav.quests} active={tab === 'play' && playSub === 'quests'}
              onClick={() => { onTab('play'); onPlay('quests'); }} badge={questBadge} />
            <NavItem icon="sword" label={t.nav.arena} active={tab === 'play' && playSub === 'pvp'}
              onClick={() => { onTab('play'); onPlay('pvp'); }} />
            <NavItem icon="skull" label="Krypta" active={tab === 'play' && playSub === 'krypta'}
              onClick={() => { onTab('play'); onPlay('krypta'); }} />
          </div>
        )}

        <SectionNavItem tabId="lobby" label={t.nav.lobby} active={tab === 'lobby'} open={false}
          onToggle={() => { onTab('lobby'); setOpen(prev => ({ ...prev, lobby: false })); }} />

        <SectionNavItem tabId="guild" label={t.nav.guild} active={tab === 'guild'} open={false}
          onToggle={() => { onTab('guild'); setOpen(prev => ({ ...prev, guild: false })); }} />

        <SectionNavItem tabId="social" label={t.nav.social} active={tab === 'social'} open={!!open['social']}
          onToggle={() => {
            if (!open['social']) expandAndNav('social', () => { onTab('social'); onSocial('ranking'); });
            else toggle('social');
          }} />
        {open['social'] && (
          <div style={{ borderLeft: '1px solid rgba(255,45,120,0.12)', marginLeft: 14 }}>
            <NavItem icon="trophy" label={t.nav.ranking} active={tab === 'social' && socialSub === 'ranking'}
              onClick={() => { onTab('social'); onSocial('ranking'); }} />
            <NavItem icon="chat" label={t.nav.chat} active={tab === 'social' && socialSub === 'chat'}
              onClick={() => { onTab('social'); onSocial('chat'); }} badge={chatHasNew} />
            <NavItem icon="email" label={t.nav.mail} active={tab === 'social' && socialSub === 'mail'}
              onClick={() => { onTab('social'); onSocial('mail'); }} badge={mailUnread || undefined} />
          </div>
        )}

        <SectionNavItem tabId="shop" label={t.nav.market} active={tab === 'shop'} open={!!open['shop']}
          onToggle={() => {
            if (!open['shop']) expandAndNav('shop', () => { onTab('shop'); onShop('shop'); });
            else toggle('shop');
          }} />
        {open['shop'] && (
          <div style={{ borderLeft: '1px solid rgba(255,45,120,0.12)', marginLeft: 14 }}>
            <NavItem icon="cart" label={t.nav.shop} active={tab === 'shop' && shopSub === 'shop'}
              onClick={() => { onTab('shop'); onShop('shop'); }} />
            <NavItem icon="anvil" label={t.nav.smith} active={tab === 'shop' && shopSub === 'smith'}
              onClick={() => { onTab('shop'); onShop('smith'); }} />
            <NavItem icon="slot_machine" label={t.nav.casino} active={tab === 'shop' && shopSub === 'casino'}
              onClick={() => { onTab('shop'); onShop('casino'); }} />
            <NavItem icon="magic_sparkle" label="Zaklinacz" active={tab === 'shop' && shopSub === 'enchanter'}
              onClick={() => { onTab('shop'); onShop('enchanter'); }} />
            <NavItem icon="gem" label={t.nav.gems} active={tab === 'shop' && shopSub === 'gems'}
              onClick={() => { onTab('shop'); onShop('gems'); }} />
          </div>
        )}

      </nav>

      {/* ── Hero stats ── */}
      <div style={{
        borderTop: '1px solid rgba(255,45,120,0.12)',
        padding: '10px 12px',
        display: 'flex', flexDirection: 'column', gap: 8,
        flexShrink: 0,
        background: 'linear-gradient(0deg, rgba(255,45,120,0.04) 0%, transparent 100%)',
      }}>
        <div style={{
          ...MONO, fontSize: 9, color: 'rgba(255,255,255,0.2)',
          letterSpacing: '0.2em', textTransform: 'uppercase',
          marginBottom: 2,
        }}>
          {hero.name}
        </div>

        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <StatChip value={hero.gold} color="#ffd700" icon="coin" />
          <StatChip value={hero.gems} color="#00e5ff" icon="gem" />
          <StatChip value={`LV.${hero.level}`} color="#9d4edd" icon="lightning" />
        </div>

        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {(['pl', 'en'] as const).map(l => (
            <button key={l} onClick={() => setLang(l)} aria-label={l === 'pl' ? 'Język Polski' : 'English'} aria-pressed={lang === l} style={{
              ...ORB, fontSize: 8,
              color: lang === l ? '#00f5ff' : 'rgba(0,245,255,0.25)',
              background: lang === l ? 'rgba(0,245,255,0.08)' : 'transparent',
              border: `1px solid ${lang === l ? 'rgba(0,245,255,0.3)' : 'transparent'}`,
              cursor: 'pointer', padding: '2px 6px',
              transition: 'all 0.15s',
            }}>{l.toUpperCase()}</button>
          ))}
          <span style={{ flex: 1 }} />
          <button onClick={onLogout} style={{
            ...MONO, fontSize: 8, color: 'rgba(255,45,120,0.55)',
            background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#ff2d78')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,45,120,0.55)')}
          >{t.app.logout}</button>
        </div>
      </div>
    </aside>
  );
}
