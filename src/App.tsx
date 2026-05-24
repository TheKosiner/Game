import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import './App.css';
import logoImg from './assets/logo.png';
import { useGameStore } from './store/gameStore';
import { useAuthStore } from './store/authStore';
import { useT } from './hooks/useT';
import { useLangStore, getLang } from './store/langStore';
import { syncToCloud, loadFromCloud } from './lib/cloudSync';
import { isFirebaseConfigured, db } from './lib/firebase';
import { claimGemCredits } from './lib/gemShop';
import { claimDailyRewardServer } from './lib/serverActions';
import { requestNotificationPermission, rescheduleActiveNotifications } from './lib/notifications';
import { onSnapshot, collection, query, orderBy, limit } from 'firebase/firestore';
import AuthScreen from './components/AuthScreen';
import CharacterCreation from './components/CharacterCreation';
import HeroCard from './components/HeroCard';
import InventoryPanel from './components/InventoryPanel';
import DungeonPanel from './components/DungeonPanel';
import QuestPanel from './components/QuestPanel';
import ShopPanel from './components/ShopPanel';
import LeaderboardPanel from './components/LeaderboardPanel';
import PvpPanel from './components/PvpPanel';
import GuildPanel from './components/GuildPanel';
import MailPanel from './components/MailPanel';
import ChallengePanel from './components/ChallengePanel';
import GemsPanel from './components/GemsPanel';
import ChatPanel from './components/ChatPanel';
import BottomNav, { type MainTab, type PlaySub, type SocialSub, type ShopSub } from './components/BottomNav';
import MysteryBoxModal from './components/MysteryBoxModal';
import { PlaySubNav, SocialSubNav, ShopSubNav } from './components/SubNav';
import DesktopSidebar from './components/DesktopSidebar';
import { PORTRAIT_OVERRIDES, PORTRAIT_LIST } from './data/portraits';

export default function App() {
  const t = useT();
  const { lang, setLang } = useLangStore();
  const hero = useGameStore(s => s.hero);
  const loadGame = useGameStore(s => s.loadGame);
  const saveGame = useGameStore(s => s.saveGame);
  const initHero = useGameStore(s => s.initHero);
  const checkDailyReset = useGameStore(s => s.checkDailyReset);
  const tickPassiveRegen = useGameStore(s => s.tickPassiveRegen);
  const addGems = useGameStore(s => s.addGems);
  const addCombatLog = useGameStore(s => s.addCombatLog);
  const challengeResult = useGameStore(s => s.challengeResult);

  const user = useAuthStore(s => s.user);
  const authLoading = useAuthStore(s => s.authLoading);
  const logout = useAuthStore(s => s.logout);

  const activeQuest = useGameStore(s => s.activeQuest);

  const [tab, setTab]         = useState<MainTab>('hero');
  const [playSub, setPlaySub]     = useState<PlaySub>('dungeon');
  const [socialSub, setSocialSub] = useState<SocialSub>('guild');
  const [shopSub, setShopSub]     = useState<ShopSub>('shop');
  const [gameLoaded, setGameLoaded] = useState(false);
  const [mailUnread, setMailUnread] = useState(0);
  const [chatHasNew, setChatHasNew] = useState(false);
  const [nowTick, setNowTick] = useState(Date.now());
  const lastChatViewedAt = useRef(Date.now());
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; });

  // Quest is ready when timer expired and user isn't already on quests sub-tab
  const questReady = activeQuest !== null && nowTick >= activeQuest.endsAt;
  const questBadge = questReady && !(tab === 'play' && playSub === 'quests');

  function switchTab(t: MainTab) { setTab(t); }
  function switchPlay(t: PlaySub) {
    setPlaySub(t);
    if (t === 'quests') { /* badge clears via questBadge derivation */ }
  }
  function switchSocial(t: SocialSub) {
    setSocialSub(t);
    if (t === 'chat') {
      lastChatViewedAt.current = Date.now();
      setChatHasNew(false);
    }
  }
  function switchShop(t: ShopSub) { setShopSub(t); }

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { scrollRef.current?.scrollTo(0, 0); }, [tab]);
  useEffect(() => { scrollRef.current?.scrollTo(0, 0); }, [playSub, socialSub, shopSub]);
  const isNative = Capacitor.isNativePlatform();

  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024);
  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => { requestNotificationPermission(); }, []);

  useEffect(() => {
    if (authLoading) return;
    async function load() {
      if (user) {
        try {
          const loaded = await loadFromCloud(user.uid);
          if (loaded === null) {
            try { localStorage.removeItem('glitchsoul_save'); } catch {}
            initHero('Hero', 1, 2, true);
          } else if (!loaded) {
            loadGame();
          }
        } catch { loadGame(); }
      } else {
        loadGame();
      }
      setGameLoaded(true);
      const s = useGameStore.getState();
      const h = s.hero;
      rescheduleActiveNotifications(
        s.activeQuest,
        h.voluntaryRestUntil,
        h.voluntaryRestHp,
        h.beggingUntil,
        h.beggingReward ?? null,
        getLang(),
      );
    }
    load();
  }, [authLoading, user?.uid]);

  useEffect(() => {
    if (!gameLoaded || !user) return;
    const overrideIdx = PORTRAIT_OVERRIDES[user.username];
    if (overrideIdx !== undefined && PORTRAIT_LIST.some(p => p.index === overrideIdx)) {
      useGameStore.setState(s => ({ hero: { ...s.hero, portrait: overrideIdx } }));
    }
  }, [gameLoaded, user?.username]);

  useEffect(() => {
    if (!gameLoaded) return;
    if (!user) checkDailyReset();
    tickPassiveRegen();
    // Save immediately so initial regen/daily-reset changes aren't lost on quick reload
    saveGame();
    const id = setInterval(() => {
      const currentUser = useAuthStore.getState().user;
      checkDailyReset();
      tickPassiveRegen();
      saveGame();
      if (currentUser) syncToCloud(currentUser.uid, currentUser.username).catch(() => {});
    }, 30_000);
    return () => clearInterval(id);
  }, [gameLoaded, user?.uid]);

  // Flush save to localStorage before the page unloads so the last 30s of
  // progress isn't lost when the user closes/refreshes the app mid-interval.
  useEffect(() => {
    if (!gameLoaded) return;
    const flush = () => useGameStore.getState().saveGame();
    window.addEventListener('beforeunload', flush);
    return () => window.removeEventListener('beforeunload', flush);
  }, [gameLoaded]);

  // Server-validated daily reward — falls back to local if CF unavailable (Spark plan)
  useEffect(() => {
    if (!gameLoaded || !user) return;
    claimDailyRewardServer().then(result => {
      if (!result.claimed) return;
      useGameStore.setState(s => ({
        hero: {
          ...s.hero,
          gems: result.gems ?? s.hero.gems,
          dungeonRunsToday: 0,
          questsCompletedToday: 0,
          lastDailyReset: result.lastDailyReset ?? s.hero.lastDailyReset,
        },
      }));
      addCombatLog(tRef.current.gems.dailyLog(result.gemsAdded ?? 0), 'system');
      saveGame();
    }).catch(() => {
      // CF not deployed (Spark plan) — fall back to local daily reset
      checkDailyReset();
    });
  }, [gameLoaded, user?.uid]);

  useEffect(() => {
    if (user && gameLoaded && hero.name !== 'Hero')
      syncToCloud(user.uid, user.username).catch(() => {});
  }, [hero.level, hero.name]);

  // Sync challenge progress immediately after every boss fight
  useEffect(() => {
    if (user && gameLoaded && challengeResult)
      syncToCloud(user.uid, user.username).catch(() => {});
  }, [challengeResult]);

  // Tick every 5 s for quest-ready detection
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 5000);
    return () => clearInterval(id);
  }, []);

  // Listen for new global chat messages
  useEffect(() => {
    if (!isFirebaseConfigured || !db || !user) return;
    const q = query(collection(db, 'globalChat'), orderBy('createdAt', 'desc'), limit(1));
    const unsub = onSnapshot(q, snap => {
      const latest = snap.docs[0]?.data();
      if (!latest) return;
      if (latest.createdAt > lastChatViewedAt.current) {
        lastChatViewedAt.current = latest.createdAt;
        setChatHasNew(true);
      }
    });
    return unsub;
  }, [user?.uid]);

  // Clear chat badge when user is already on chat tab
  useEffect(() => {
    if (tab === 'social' && socialSub === 'chat') {
      lastChatViewedAt.current = Date.now();
      setChatHasNew(false);
    }
  }, [tab, socialSub]);

  // Claim any pending gem credits from Stripe purchases
  useEffect(() => {
    if (!user || !gameLoaded) return;
    claimGemCredits().then(gems => {
      if (gems > 0) {
        addGems(gems);
        addCombatLog(tRef.current.gems.claimedLog(gems), 'system');
        saveGame();
      }
    }).catch(() => {});
  }, [user?.uid, gameLoaded]);

  if (authLoading || !gameLoaded) {
    return (
      <div style={{
        minHeight: '100dvh',
        background: '#040408',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 24,
      }}>
        <img
          src={logoImg}
          alt="Glitch Soul"
          style={{
            width: 200, height: 'auto',
            filter: 'drop-shadow(0 0 24px rgba(140,60,255,0.7)) drop-shadow(0 0 48px rgba(0,200,255,0.3))',
            animation: 'pulse 2s ease-in-out infinite',
          }}
        />
        <p style={{
          fontFamily: "'Orbitron', monospace",
          fontSize: 10,
          color: '#ff2d78',
          letterSpacing: '0.3em',
          textShadow: '0 0 10px #ff2d78',
          animation: 'pulse 2s ease-in-out infinite',
          margin: 0,
        }}>{t.app.loading}</p>
        <style>{`@keyframes pulse { 0%,100%{opacity:.7} 50%{opacity:1} }`}</style>
      </div>
    );
  }

  if (isFirebaseConfigured && !user) return <AuthScreen />;

  const hasSave = (() => { try { return !!localStorage.getItem('glitchsoul_save'); } catch { return false; } })();
  const isNewGame = hero.name === 'Hero' && !hasSave;
  if (isNewGame) return <CharacterCreation />;

  // ── DESKTOP LAYOUT ────────────────────────────────────────────────────────────
  if (isDesktop && !isNative) {
    const sectionLabel: Record<MainTab, string> = {
      hero: t.nav.hero,
      play: t.nav.play,
      social: t.nav.social,
      shop: t.nav.shop,
    };
    return (
      <>
      <div className="desktop-layout" style={{ display: 'flex', background: '#040408', overflow: 'hidden' }}>
        <DesktopSidebar
          tab={tab} playSub={playSub} socialSub={socialSub} shopSub={shopSub}
          questBadge={questBadge} mailUnread={mailUnread} chatHasNew={chatHasNew}
          onTab={switchTab} onPlay={switchPlay} onSocial={switchSocial} onShop={switchShop}
          onLogout={() => logout()}
        />

        {/* Content area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {/* Thin top bar */}
          <header style={{
            flexShrink: 0,
            background: 'linear-gradient(180deg, #080810 0%, #0a0a18 100%)',
            borderBottom: '1px solid rgba(255,45,120,0.2)',
            padding: '8px 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: '0 2px 20px rgba(0,0,0,0.6)',
          }}>
            <p style={{
              fontFamily: "'Orbitron', monospace", fontSize: 11, fontWeight: 700,
              color: 'rgba(255,255,255,0.35)', letterSpacing: 3, textTransform: 'uppercase',
            }}>
              {sectionLabel[tab]}
            </p>
            <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: 1 }}>
              {hero.name}
            </p>
          </header>

          {/* Scrollable content */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
            <main style={{
              padding: '20px 28px',
              display: tab === 'hero' ? 'grid' : 'flex',
              gridTemplateColumns: tab === 'hero' ? '1fr 1fr' : undefined,
              flexDirection: tab !== 'hero' ? 'column' : undefined,
              gap: 16,
              maxWidth: tab === 'hero' ? 1400 : 960,
            }}>
              {tab === 'hero'   && <><HeroCard /><InventoryPanel /></>}
              {tab === 'play'   && playSub === 'dungeon'   && <DungeonPanel />}
              {tab === 'play'   && playSub === 'challenge' && <ChallengePanel />}
              {tab === 'play'   && playSub === 'quests'    && <QuestPanel />}
              {tab === 'shop'   && shopSub === 'shop'  && <ShopPanel />}
              {tab === 'shop'   && shopSub === 'gems'  && <GemsPanel />}
              {tab === 'social' && socialSub === 'pvp'     && <PvpPanel />}
              {tab === 'social' && socialSub === 'guild'   && <GuildPanel />}
              {tab === 'social' && socialSub === 'ranking' && <LeaderboardPanel />}
              {tab === 'social' && socialSub === 'mail'    && <MailPanel onUnreadChange={setMailUnread} />}
              {tab === 'social' && socialSub === 'chat'    && <ChatPanel />}
            </main>
          </div>
        </div>
      </div>
      <MysteryBoxModal />
      </>
    );
  }

  // ── MOBILE LAYOUT ─────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* CYBERPUNK TOP BAR */}
      <header style={{
        background: 'linear-gradient(180deg, #080810 0%, #0a0a18 100%)',
        borderBottom: '1px solid rgba(255,45,120,0.3)',
        flexShrink: 0,
        zIndex: 40,
        padding: '4px 8px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 0 20px rgba(255,45,120,0.1), 0 4px 20px rgba(0,0,0,0.8)',
      }}>
        <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 15, fontWeight: 900, letterSpacing: 1, flexShrink: 0 }}>
          <span style={{ color: '#00f5ff', textShadow: '0 0 8px #00f5ff, 0 0 20px #00e5ff' }}>Glitch</span>
          <span style={{ color: '#ff2d78', textShadow: '0 0 8px #ff2d78, 0 0 20px #ff2d78' }}>Soul</span>
        </span>

        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          <span style={{
            fontFamily: "'Orbitron', monospace",
            color: '#ffd700', fontSize: 10, fontWeight: 700,
            background: 'rgba(255,215,0,0.08)',
            border: '1px solid rgba(255,215,0,0.25)',
            padding: '3px 7px', lineHeight: 1,
            textShadow: '0 0 8px rgba(255,215,0,0.5)',
            display: 'inline-flex', alignItems: 'center', gap: 3,
          }}><span style={{ fontSize: 11 }}>🪙</span>{hero.gold}</span>
          <span style={{
            fontFamily: "'Orbitron', monospace",
            color: '#00e5ff', fontSize: 10, fontWeight: 700,
            background: 'rgba(0,229,255,0.08)',
            border: '1px solid rgba(0,229,255,0.25)',
            padding: '3px 7px', lineHeight: 1,
            textShadow: '0 0 8px rgba(0,229,255,0.5)',
            display: 'inline-flex', alignItems: 'center', gap: 3,
          }}><span style={{ fontSize: 11 }}>💎</span>{hero.gems}</span>
          <span style={{
            fontFamily: "'Orbitron', monospace",
            color: '#00f5ff', fontSize: 10,
            fontWeight: 700,
            background: 'rgba(0,245,255,0.08)',
            border: '1px solid rgba(0,245,255,0.25)',
            padding: '3px 7px', lineHeight: 1,
            textShadow: '0 0 8px rgba(0,245,255,0.5)',
          }}>{t.app.level(hero.level)}</span>
          {user && (
            <>
              <button
                onClick={() => setLang('pl')}
                aria-label="Język Polski"
                aria-pressed={lang === 'pl'}
                style={{
                  fontFamily: "'Orbitron', monospace",
                  color: lang === 'pl' ? '#00f5ff' : 'rgba(0,245,255,0.3)', fontSize: 10,
                  background: 'none', border: 'none', cursor: 'pointer',
                }}
              >PL</button>
              <button
                onClick={() => setLang('en')}
                aria-label="English language"
                aria-pressed={lang === 'en'}
                style={{
                  fontFamily: "'Orbitron', monospace",
                  color: lang === 'en' ? '#00f5ff' : 'rgba(0,245,255,0.3)', fontSize: 10,
                  background: 'none', border: 'none', cursor: 'pointer',
                }}
              >EN</button>
              <button
                onClick={() => logout()}
                aria-label={t.app.logout}
                style={{
                  fontFamily: "'Orbitron', monospace",
                  color: 'rgba(255,45,120,0.6)', fontSize: 10,
                  background: 'none', border: 'none', cursor: 'pointer',
                  textShadow: '0 0 6px rgba(255,45,120,0.3)',
                }}
              >{t.app.logout}</button>
            </>
          )}
        </div>
      </header>

      {!isNative && (
        <a
          href="https://github.com/TheKosiner/Game/releases/download/android-latest/app-debug.apk"
          target="_blank"
          rel="noreferrer"
          style={{
            flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: 'linear-gradient(90deg, rgba(0,245,255,0.06), rgba(157,78,221,0.06))',
            borderBottom: '1px solid rgba(0,245,255,0.15)',
            padding: '6px 12px',
            textDecoration: 'none',
          }}
        >
          <span style={{ fontSize: 14 }}>📱</span>
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: '#00f5ff' }}>
            {lang === 'en' ? 'Download Android app' : 'Pobierz aplikację Android'}
          </span>
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: 'rgba(0,245,255,0.4)' }}>↓ APK</span>
        </a>
      )}

      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {tab === 'play' && (
          <PlaySubNav active={playSub} onChange={switchPlay} questBadge={questBadge} />
        )}
        {tab === 'social' && (
          <SocialSubNav active={socialSub} onChange={switchSocial} mailBadge={mailUnread} chatBadge={chatHasNew} />
        )}
        {tab === 'shop' && (
          <ShopSubNav active={shopSub} onChange={switchShop} />
        )}

        <main style={{ padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tab === 'hero'   && <><HeroCard /><InventoryPanel /></>}
          {tab === 'play'   && playSub === 'dungeon'   && <DungeonPanel />}
          {tab === 'play'   && playSub === 'challenge' && <ChallengePanel />}
          {tab === 'play'   && playSub === 'quests'    && <QuestPanel />}
          {tab === 'shop'   && shopSub === 'shop'  && <ShopPanel />}
          {tab === 'shop'   && shopSub === 'gems'  && <GemsPanel />}
          {tab === 'social' && socialSub === 'pvp'     && <PvpPanel />}
          {tab === 'social' && socialSub === 'guild'   && <GuildPanel />}
          {tab === 'social' && socialSub === 'ranking' && <LeaderboardPanel />}
          {tab === 'social' && socialSub === 'mail'    && <MailPanel onUnreadChange={setMailUnread} />}
          {tab === 'social' && socialSub === 'chat'    && <ChatPanel />}
        </main>
      </div>

      <BottomNav active={tab} onChange={switchTab} badges={{ play: questBadge, social: chatHasNew || mailUnread > 0 }} />
      <MysteryBoxModal />
    </div>
  );
}
