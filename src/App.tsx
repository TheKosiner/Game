import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import './App.css';
import logoImg from './assets/logo.png';
import { useGameStore } from './store/gameStore';
import { useAuthStore } from './store/authStore';
import { useT } from './hooks/useT';
import { useLangStore } from './store/langStore';
import { syncToCloud, loadFromCloud, deleteCloudSave } from './lib/cloudSync';
import { isFirebaseConfigured, db } from './lib/firebase';
import { claimGemCredits } from './lib/gemShop';
import { claimDailyRewardServer } from './lib/serverActions';
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
import { PlaySubNav, SocialSubNav, ShopSubNav } from './components/SubNav';
import { PORTRAIT_OVERRIDES } from './data/portraits';

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
    }
    load();
  }, [authLoading, user?.uid]);

  useEffect(() => {
    if (!gameLoaded || !user) return;
    const overrideIdx = PORTRAIT_OVERRIDES[user.username];
    if (overrideIdx !== undefined) {
      useGameStore.setState(s => ({ hero: { ...s.hero, portrait: overrideIdx } }));
    }
  }, [gameLoaded, user?.username]);

  useEffect(() => {
    if (!gameLoaded) return;
    // Guests use local daily reset; logged-in players use server-validated CF below
    if (!user) checkDailyReset();
    tickPassiveRegen();
    const id = setInterval(() => {
      if (!user) checkDailyReset();
      tickPassiveRegen();
      saveGame();
      if (user) syncToCloud(user.uid, user.username).catch(() => {});
    }, 30_000);
    return () => clearInterval(id);
  }, [gameLoaded, user?.uid]);

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
      addCombatLog(t.gems.dailyLog(result.gemsAdded ?? 0), 'system');
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
        addCombatLog(t.gems.claimedLog(gems), 'system');
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

  async function handleReset() {
    if (!confirm(t.app.resetConfirm)) return;
    localStorage.removeItem('glitchsoul_save');
    try { if (user) await deleteCloudSave(user.uid); } catch {}
    initHero('Hero');
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* CYBERPUNK TOP BAR */}
      <header style={{
        background: 'linear-gradient(180deg, #080810 0%, #0a0a18 100%)',
        borderBottom: '1px solid rgba(255,45,120,0.3)',
        flexShrink: 0,
        zIndex: 40,
        padding: '8px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 0 20px rgba(255,45,120,0.1), 0 4px 20px rgba(0,0,0,0.8)',
      }}>
        <img
          src={logoImg}
          alt="Glitch Soul"
          style={{
            height: 52, width: 'auto',
            filter: 'drop-shadow(0 0 8px rgba(140,60,255,0.8)) drop-shadow(0 0 16px rgba(0,200,255,0.3))',
          }}
        />

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{
            fontFamily: "'Share Tech Mono', monospace",
            color: '#ffd700', fontSize: 12,
            background: 'rgba(255,215,0,0.08)',
            border: '1px solid rgba(255,215,0,0.25)',
            padding: '3px 8px',
            textShadow: '0 0 8px rgba(255,215,0,0.5)',
          }}>🪙 {hero.gold}</span>
          <span style={{
            fontFamily: "'Share Tech Mono', monospace",
            color: '#00e5ff', fontSize: 12,
            background: 'rgba(0,229,255,0.08)',
            border: '1px solid rgba(0,229,255,0.25)',
            padding: '3px 8px',
            textShadow: '0 0 8px rgba(0,229,255,0.5)',
          }}>💎 {hero.gems}</span>
          <span style={{
            fontFamily: "'Orbitron', monospace",
            color: '#00f5ff', fontSize: 9,
            fontWeight: 700,
            background: 'rgba(0,245,255,0.08)',
            border: '1px solid rgba(0,245,255,0.25)',
            padding: '3px 7px',
            textShadow: '0 0 8px rgba(0,245,255,0.5)',
          }}>{t.app.level(hero.level)}</span>
          {user && (
            <>
              <span style={{ fontFamily: "'Share Tech Mono', monospace", color: 'var(--text-dim)', fontSize: 10 }}>
                {user.username}
              </span>
              <button onClick={() => setLang('pl')} style={{
                fontFamily: "'Orbitron', monospace",
                color: lang === 'pl' ? '#00f5ff' : 'rgba(0,245,255,0.3)', fontSize: 8,
                background: 'none', border: 'none', cursor: 'pointer',
              }}>PL</button>
              <button onClick={() => setLang('en')} style={{
                fontFamily: "'Orbitron', monospace",
                color: lang === 'en' ? '#00f5ff' : 'rgba(0,245,255,0.3)', fontSize: 8,
                background: 'none', border: 'none', cursor: 'pointer',
              }}>EN</button>
              <button onClick={() => logout()} style={{
                fontFamily: "'Orbitron', monospace",
                color: 'rgba(255,45,120,0.6)', fontSize: 8,
                background: 'none', border: 'none', cursor: 'pointer',
                textShadow: '0 0 6px rgba(255,45,120,0.3)',
              }}>{t.app.logout}</button>
            </>
          )}
          <button onClick={handleReset} style={{
            color: 'rgba(255,45,120,0.4)', fontSize: 14,
            background: 'none', border: 'none', cursor: 'pointer',
          }}>↩</button>
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
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: '#00f5ff' }}>
            {lang === 'en' ? 'Download Android app' : 'Pobierz aplikację Android'}
          </span>
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, color: 'rgba(0,245,255,0.4)' }}>↓ APK</span>
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
    </div>
  );
}
