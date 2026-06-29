import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import './App.css';
import { useGameStore, MAX_INVENTORY } from './store/gameStore';
import { useAuthStore } from './store/authStore';
import { useT } from './hooks/useT';
import { useLangStore, getLang } from './store/langStore';
import { syncToCloud, loadFromCloud } from './lib/cloudSync';
import { isFirebaseConfigured, db } from './lib/firebase';
import { claimGemCredits } from './lib/gemShop';
import { claimDailyRewardServer } from './lib/serverActions';
import { requestNotificationPermission, rescheduleActiveNotifications } from './lib/notifications';
import { onSnapshot, collection, query, orderBy, limit, doc } from 'firebase/firestore';
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
import SmithPanel from './components/SmithPanel';
import GemsPanel from './components/GemsPanel';
import ChatPanel from './components/ChatPanel';
import BottomNav, { type MainTab, type PlaySub, type SocialSub, type GuildTabSub, type ShopSub } from './components/BottomNav';
import MysteryBoxModal from './components/MysteryBoxModal';
import { PlaySubNav, SocialSubNav, ShopSubNav, GuildTabSubNav } from './components/SubNav';
import DesktopSidebar from './components/DesktopSidebar';
import { PORTRAIT_OVERRIDES, PORTRAIT_LIST } from './data/portraits';
import { createMysteryBox } from './data/mysteryBoxes';
import ForceUpdateModal from './components/ForceUpdateModal';
import { checkForForcedUpdate, type UpdateInfo } from './lib/appUpdate';
import AdminPanel from './components/AdminPanel';
import ErrorLogPanel from './components/ErrorLogPanel';
import LevelUpModal from './components/LevelUpModal';
import CasinoPanel from './components/CasinoPanel';
import KryptaPanel from './components/KryptaPanel';
import EnchanterPanel from './components/EnchanterPanel';
import StreakModal from './components/StreakModal';
import type { DailyRewardResult } from './lib/serverActions';
import LobbyPanel from './components/LobbyPanel';
import CyberpunkBg from './components/CyberpunkBg';
import LoadingScreen, { LOADING_MIN_MS } from './components/LoadingScreen';
import AnimatedPanel from './components/AnimatedPanel';
import GameIcon from './components/GameIcon';

export default function App() {
  const t = useT();
  const { lang, setLang } = useLangStore();
  const hero = useGameStore(s => s.hero);
  const loadGame = useGameStore(s => s.loadGame);
  const saveGame = useGameStore(s => s.saveGame);
  const initHero = useGameStore(s => s.initHero);
  const checkDailyReset = useGameStore(s => s.checkDailyReset);
  const tickPassiveRegen = useGameStore(s => s.tickPassiveRegen);
  const addCombatLog = useGameStore(s => s.addCombatLog);
  const challengeResult = useGameStore(s => s.challengeResult);

  const user = useAuthStore(s => s.user);
  const authLoading = useAuthStore(s => s.authLoading);
  const logout = useAuthStore(s => s.logout);

  const activeQuest = useGameStore(s => s.activeQuest);

  const [tab, setTab]             = useState<MainTab>('hero');
  const [playSub, setPlaySub]     = useState<PlaySub>('dungeon');
  const [socialSub, setSocialSub] = useState<SocialSub>('ranking');
  const [shopSub, setShopSub]     = useState<ShopSub>('shop');
  const [guildTab, setGuildTab]   = useState<GuildTabSub>('info');
  const [gameLoaded, setGameLoaded] = useState(false);
  const [minTimeReady, setMinTimeReady] = useState(false);
  const [mailUnread, setMailUnread] = useState(0);
  const [chatHasNew, setChatHasNew] = useState(false);
  const [nowTick, setNowTick] = useState(Date.now());
  const [streakData, setStreakData] = useState<DailyRewardResult | null>(null);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const lastChatViewedAt = useRef(Date.now());
  const loadedUidRef = useRef<string | null>(null);
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; });

  // On native: check once at launch whether a newer APK build exists and, if so,
  // gate the whole app behind a forced-update screen.
  useEffect(() => {
    checkForForcedUpdate().then(info => { if (info) setUpdateInfo(info); }).catch(() => {});
  }, []);

  // Grant the physical milestone chest (epic on day 5, legendary on day 10) into
  // the inventory. The CF only credits gems; the box is owned by the client save,
  // so it must be added here after the post-claim cloud reload. Call only on the
  // device that actually claimed (result.claimed === true).
  const grantStreakMilestoneBox = (milestone: 'epic' | 'legendary') => {
    const freshHero = useGameStore.getState().hero;
    if (freshHero.inventory.length >= MAX_INVENTORY) {
      addCombatLog(tRef.current.gems.streakBoxFull, 'system');
      return;
    }
    const box = createMysteryBox(milestone, freshHero.level);
    useGameStore.getState().addToInventory(box);
    addCombatLog(tRef.current.gems.streakBoxLog(getLang() === 'en' ? box.nameEn ?? box.name : box.name), 'loot');
  };

  const desktopMainRef = useRef<HTMLElement>(null);
  const animKey = `${tab}-${playSub}-${socialSub}-${shopSub}-${guildTab}`;

  // Minimum loading screen duration
  useEffect(() => {
    const id = setTimeout(() => setMinTimeReady(true), LOADING_MIN_MS);
    return () => clearTimeout(id);
  }, []);

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
        // Force-reload from cloud on every fresh session start (uid first seen) and on
        // account switches. The initial store state has lastSaved=Date.now() which always
        // looks "newer" than any cloud timestamp, so without force the in-memory guard
        // would skip the cloud load and fall back to potentially stale localStorage data.
        const force = loadedUidRef.current !== user.uid;
        loadedUidRef.current = user.uid;
        try {
          let loaded = await loadFromCloud(user.uid, force);
          // Retry once — on mobile, first read can fail due to cold-start network
          if (loaded === null) {
            await new Promise(r => setTimeout(r, 2500));
            loaded = await loadFromCloud(user.uid, true);
          }
          if (loaded === null) {
            try { localStorage.removeItem('glitchsoul_save'); } catch {}
            initHero('Hero', 1, 2, true);
          } else if (!loaded) {
            loadGame();
          }
          // When loaded===true (cloud data), do NOT call checkDailyReset() here.
          // claimDailyRewardServer() runs next and reads Firestore to do the reset
          // server-side. Calling checkDailyReset() first updates lastDailyReset=now
          // locally, which syncToCloud then writes to Firestore before CF reads it —
          // CF sees "already claimed today" and returns claimed:false, suppressing modal.
        } catch { loadGame(); }
      } else {
        loadedUidRef.current = null;
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
    const id = setInterval(async () => {
      // Skip when the tab/app is in the background — the pagehide/visibilitychange
      // handlers already flush a sync when the device goes idle, and we must not
      // overwrite a foreground device's cloud save with stale background data.
      if (document.hidden) return;
      const currentUser = useAuthStore.getState().user;
      checkDailyReset();
      tickPassiveRegen();
      saveGame();
      if (currentUser) {
        syncToCloud(currentUser.uid, currentUser.username).catch(() => {});
      }
    }, 10_000);
    return () => clearInterval(id);
  }, [gameLoaded, user?.uid]);

  // Flush save + cloud sync before the page unloads / is hidden by iOS.
  // 'pagehide' is more reliable than 'beforeunload' on iOS Safari.
  useEffect(() => {
    if (!gameLoaded) return;
    const flush = () => {
      useGameStore.getState().saveGame();
      const u = useAuthStore.getState().user;
      if (u) syncToCloud(u.uid, u.username).catch(() => {});
    };
    window.addEventListener('beforeunload', flush);
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('beforeunload', flush);
      window.removeEventListener('pagehide', flush);
    };
  }, [gameLoaded]);

  // Sync to cloud immediately when the player leaves the tab/app so that
  // switching to another device (phone ↔ PC) always picks up the latest state.
  // Also reload from cloud when returning after a long absence (>30s) to pick
  // up changes made on the other device.
  useEffect(() => {
    if (!gameLoaded || !user) return;
    let hiddenAt = 0;
    const handleVisibility = () => {
      const currentUser = useAuthStore.getState().user;
      if (document.hidden) {
        hiddenAt = Date.now();
        if (currentUser) syncToCloud(currentUser.uid, currentUser.username).catch(() => {});
      } else {
        if (currentUser && Date.now() - hiddenAt > 5_000) {
          loadFromCloud(currentUser.uid).then(loaded => {
            if (loaded) useGameStore.getState().checkDailyReset();
          }).catch(() => {});
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [gameLoaded, user?.uid]);

  // Listen for admin overrides on the player's save document.
  // When admin sets updatedAt far in the future, force-reload from cloud
  // so the player sees the admin's changes immediately without refreshing.
  // Also re-run the daily claim when admin resets lastDailyReset to 0 —
  // otherwise the player's local state has a stale reset and CF won't run
  // again until they refresh.
  useEffect(() => {
    if (!gameLoaded || !user || !db) return;
    const ref = doc(db, 'saves', user.uid);
    const unsub = onSnapshot(ref, async (snap) => {
      if (!snap.exists()) return;
      const cloudTs: number = snap.data().updatedAt ?? 0;
      if (cloudTs > Date.now() + 3_600_000) {
        await loadFromCloud(user.uid, true).catch(() => {});
        // If admin wiped lastDailyReset (streak reset), re-run the daily claim
        // so counters reset and streak is recalculated without needing a refresh.
        const heroNow = useGameStore.getState().hero;
        if ((heroNow.lastDailyReset ?? 0) === 0) {
          claimDailyRewardServer().then(async result => {
            if (!result.claimed) { checkDailyReset(); return; }
            try { await loadFromCloud(user.uid, true); } catch {}
            if (result.streakMilestone === 'epic' || result.streakMilestone === 'legendary') {
              grantStreakMilestoneBox(result.streakMilestone);
            }
            saveGame();
            syncToCloud(user.uid, user.username).catch(() => {});
            setStreakData(result);
          }).catch(() => {
            const before = useGameStore.getState().hero;
            checkDailyReset();
            const after = useGameStore.getState().hero;
            if (after.lastDailyReset !== before.lastDailyReset) {
              setStreakData({ claimed: true, streakDays: after.streakDays ?? 1, streakMilestone: null, chestGems: 0, gemsAdded: 5 });
            }
          });
        }
      }
    }, () => {});
    return () => unsub();
  }, [gameLoaded, user?.uid]);

  // Server-validated daily reward — falls back to local if CF unavailable (Spark plan)
  useEffect(() => {
    if (!gameLoaded || !user) return;
    claimDailyRewardServer().then(async result => {
      const todayKey = 'streak_modal_' + new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Warsaw' });
      if (!result.claimed) {
        // Already claimed today (e.g. from another device). Run local reset to
        // catch any counter resets that haven't been applied yet.
        checkDailyReset();
        // Show streak modal once per device per day regardless of which device claimed first.
        if (!localStorage.getItem(todayKey)) {
          localStorage.setItem(todayKey, '1');
          const hero = useGameStore.getState().hero;
          setStreakData({
            claimed: false,
            streakDays: hero.streakDays ?? 1,
            streakMilestone: null,
            chestGems: 0,
            gemsAdded: 0,
          });
        }
        return;
      }
      // Force-reload from cloud so local lastDailyReset matches exactly what CF wrote.
      try { await loadFromCloud(user.uid, true); } catch {}
      addCombatLog(tRef.current.gems.dailyLog(result.gemsAdded ?? 0), 'system');
      // Milestone streak chest: grant an actual mystery box to the inventory
      // (epic on day 5, legendary on day 10). The CF only credits gems.
      if (result.streakMilestone === 'epic' || result.streakMilestone === 'legendary') {
        grantStreakMilestoneBox(result.streakMilestone);
      }
      localStorage.setItem(todayKey, '1');
      saveGame();
      // Persist the freshly granted box (and reset state) back to the cloud so it
      // survives the next loadFromCloud on app start or another device.
      syncToCloud(user.uid, user.username).catch(() => {});
      setStreakData(result);
    }).catch(() => {
      // CF not deployed or network error — fall back to local daily reset.
      const heroBefore = useGameStore.getState().hero;
      checkDailyReset();
      const heroAfter = useGameStore.getState().hero;
      // Show modal if a reset actually happened
      if (heroAfter.lastDailyReset !== heroBefore.lastDailyReset) {
        const todayKey = 'streak_modal_' + new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Warsaw' });
        localStorage.setItem(todayKey, '1');
        setStreakData({
          claimed: true,
          streakDays: heroAfter.streakDays ?? 1,
          streakMilestone: null,
          chestGems: 0,
          gemsAdded: 5,
        });
      }
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
    claimGemCredits().then(({ gems, newGems }) => {
      if (gems > 0) {
        // Server already credited the purchase into the save; adopt its authoritative
        // balance (don't add locally) so the next save's gem delta stays within rules.
        useGameStore.setState(s => ({ hero: { ...s.hero, gems: newGems } }));
        addCombatLog(tRef.current.gems.claimedLog(gems), 'system');
        saveGame();
      }
    }).catch(() => {});
  }, [user?.uid, gameLoaded]);

  // Forced update gate — blocks everything (even loading/auth) when a newer build exists.
  if (updateInfo) return <ForceUpdateModal info={updateInfo} />;

  if (authLoading || !gameLoaded || !minTimeReady) {
    return <LoadingScreen text={t.app.loading} />;
  }

  if (isFirebaseConfigured && !user) return <AuthScreen />;

  const hasSave = (() => { try { return !!localStorage.getItem('glitchsoul_save'); } catch { return false; } })();
  const isNewGame = hero.name === 'Hero' && !hasSave;
  if (isNewGame) return <CharacterCreation />;

  // ── DESKTOP LAYOUT ────────────────────────────────────────────────────────────────────────────
  if (isDesktop && !isNative) {
    const sectionLabel: Record<MainTab, string> = {
      hero:   t.nav.hero,
      play:   t.nav.play,
      guild:  t.nav.guild,
      social: t.nav.social,
      shop:   t.nav.market,
      lobby:  t.nav.lobby,
    };
    return (
      <>
      <CyberpunkBg />
      <div className="desktop-layout" style={{ display: 'flex', background: 'transparent', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        <DesktopSidebar
          tab={tab} playSub={playSub} socialSub={socialSub} shopSub={shopSub}
          questBadge={questBadge} mailUnread={mailUnread} chatHasNew={chatHasNew}
          onTab={switchTab} onPlay={switchPlay} onSocial={switchSocial} onShop={switchShop}
          onLogout={() => logout()}
        />

        {/* Content area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {/* Thin top bar */}
          <header className="glass-header" style={{
            flexShrink: 0,
            borderBottom: '1px solid rgba(255,45,120,0.2)',
            padding: '8px 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: '0 2px 20px rgba(0,0,0,0.6)',
          }}>
            <p style={{
              fontFamily: "'Orbitron', monospace", fontSize: 11, fontWeight: 700,
              color: 'rgba(255,255,255,0.4)', letterSpacing: 3, textTransform: 'uppercase',
              textShadow: '0 0 12px rgba(0,245,255,0.2)',
            }}>
              {sectionLabel[tab]}
            </p>
            <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: 'rgba(0,245,255,0.3)', letterSpacing: 1 }}>
              {hero.name}
            </p>
          </header>

          {/* Scrollable content */}
          <div ref={scrollRef} style={{
            flex: 1,
            overflowY: tab === 'lobby' ? 'hidden' : 'auto',
            overflowX: 'hidden',
          }}>
            {tab === 'play'   && <PlaySubNav active={playSub} onChange={switchPlay} questBadge={questBadge} />}
            {tab === 'social' && <SocialSubNav active={socialSub} onChange={switchSocial} mailBadge={mailUnread} chatBadge={chatHasNew} />}
            {tab === 'shop'   && <ShopSubNav active={shopSub} onChange={switchShop} />}
            {tab === 'guild'  && <GuildTabSubNav active={guildTab} onChange={setGuildTab} />}
            <main ref={desktopMainRef} style={{
              padding: tab === 'lobby' ? 0 : '20px 28px',
              display: tab === 'hero' ? 'grid' : 'flex',
              gridTemplateColumns: tab === 'hero' ? '1fr 1fr' : undefined,
              flexDirection: tab !== 'hero' ? 'column' : undefined,
              gap: tab === 'lobby' ? 0 : 16,
              maxWidth: tab === 'lobby' ? undefined : (tab === 'hero' ? 1400 : 960),
              height: tab === 'lobby' ? '100%' : undefined,
            }}>
              {tab === 'hero'   && <><HeroCard /><InventoryPanel />{user?.email && <><AdminPanel userEmail={user.email} /><ErrorLogPanel userEmail={user.email} /></>}</>}
              {tab === 'play'   && playSub === 'dungeon'   && <DungeonPanel />}
              {tab === 'play'   && playSub === 'challenge' && <ChallengePanel />}
              {tab === 'play'   && playSub === 'quests'    && <QuestPanel />}
              {tab === 'play'   && playSub === 'pvp'       && <PvpPanel />}
              {tab === 'play'   && playSub === 'krypta'    && <KryptaPanel />}
              {tab === 'guild'  && <GuildPanel guildTab={guildTab} onGoToWar={() => setGuildTab('war')} />}
              {tab === 'lobby'  && <LobbyPanel />}
              {tab === 'shop'   && shopSub === 'shop'      && <ShopPanel />}
              {tab === 'shop'   && shopSub === 'gems'      && <GemsPanel />}
              {tab === 'shop'   && shopSub === 'smith'     && <SmithPanel />}
              {tab === 'shop'   && shopSub === 'casino'    && <CasinoPanel />}
              {tab === 'shop'   && shopSub === 'enchanter' && <EnchanterPanel />}
              {tab === 'social' && socialSub === 'ranking' && <LeaderboardPanel />}
              {tab === 'social' && socialSub === 'mail'    && <MailPanel onUnreadChange={setMailUnread} />}
              {tab === 'social' && socialSub === 'chat'    && <ChatPanel />}
            </main>
          </div>
        </div>
      </div>
      <MysteryBoxModal />
      <LevelUpModal />
      {streakData && (
        <StreakModal
          streakDays={streakData.streakDays ?? 1}
          streakMilestone={streakData.streakMilestone ?? null}
          chestGems={streakData.chestGems ?? 0}
          gemsAdded={streakData.gemsAdded ?? 0}
          onClose={() => setStreakData(null)}
        />
      )}
      </>
    );
  }

  // ── MOBILE LAYOUT ───────────────────────────────────────────────────────────────────────────
  return (
    <>
    <CyberpunkBg />
    <div style={{ maxWidth: 480, margin: '0 auto', height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', zIndex: 1 }}>

      {/* CYBERPUNK TOP BAR */}
      <header className="glass-header" style={{
        borderBottom: '1px solid rgba(255,45,120,0.3)',
        flexShrink: 0,
        zIndex: 40,
        // Pad past the status bar on edge-to-edge Android (0 on web / older devices).
        padding: 'calc(4px + env(safe-area-inset-top, 0px)) 8px 4px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 0 20px rgba(255,45,120,0.12), 0 4px 24px rgba(0,0,0,0.7)',
        position: 'relative',
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
          }}><GameIcon name="coin" size={11} />{hero.gold}</span>
          <span style={{
            fontFamily: "'Orbitron', monospace",
            color: '#00e5ff', fontSize: 10, fontWeight: 700,
            background: 'rgba(0,229,255,0.08)',
            border: '1px solid rgba(0,229,255,0.25)',
            padding: '3px 7px', lineHeight: 1,
            textShadow: '0 0 8px rgba(0,229,255,0.5)',
            display: 'inline-flex', alignItems: 'center', gap: 3,
          }}><GameIcon name="gem" size={11} color="#00e5ff" />{hero.gems}</span>
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
          href="https://github.com/thekosiner/game/releases/latest/download/GlitchSoul.apk"
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
          <GameIcon name="user" size={14} color="#00f5ff" />
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: '#00f5ff' }}>
            {lang === 'en' ? 'Download Android app' : 'Pobierz aplikację Android'}
          </span>
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: 'rgba(0,245,255,0.4)' }}>↓ APK</span>
        </a>
      )}

      <div ref={scrollRef} style={{
        flex: 1,
        overflowY: tab === 'lobby' ? 'hidden' : 'auto',
        overflowX: 'hidden',
      }}>
        {tab === 'play' && (
          <PlaySubNav active={playSub} onChange={switchPlay} questBadge={questBadge} />
        )}
        {tab === 'social' && (
          <SocialSubNav active={socialSub} onChange={switchSocial} mailBadge={mailUnread} chatBadge={chatHasNew} />
        )}
        {tab === 'shop' && (
          <ShopSubNav active={shopSub} onChange={switchShop} />
        )}
        {tab === 'guild' && (
          <GuildTabSubNav active={guildTab} onChange={setGuildTab} />
        )}

        <main style={{
          padding: tab === 'lobby' ? 0 : '10px 8px',
          display: 'flex', flexDirection: 'column',
          gap: tab === 'lobby' ? 0 : 8,
          height: tab === 'lobby' ? '100%' : undefined,
        }}>
          <AnimatedPanel
            animKey={animKey}
            style={tab === 'lobby' ? { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 } : undefined}
          >
            {tab === 'hero'   && <><HeroCard /><InventoryPanel />{user?.email && <><AdminPanel userEmail={user.email} /><ErrorLogPanel userEmail={user.email} /></>}</>}
            {tab === 'play'   && playSub === 'dungeon'   && <DungeonPanel />}
            {tab === 'play'   && playSub === 'challenge' && <ChallengePanel />}
            {tab === 'play'   && playSub === 'quests'    && <QuestPanel />}
            {tab === 'play'   && playSub === 'pvp'       && <PvpPanel />}
            {tab === 'play'   && playSub === 'krypta'    && <KryptaPanel />}
            {tab === 'guild'  && <GuildPanel guildTab={guildTab} onGoToWar={() => setGuildTab('war')} />}
            {tab === 'lobby'  && <LobbyPanel />}
            {tab === 'shop'   && shopSub === 'shop'      && <ShopPanel />}
            {tab === 'shop'   && shopSub === 'gems'      && <GemsPanel />}
            {tab === 'shop'   && shopSub === 'smith'     && <SmithPanel />}
            {tab === 'shop'   && shopSub === 'casino'    && <CasinoPanel />}
            {tab === 'shop'   && shopSub === 'enchanter' && <EnchanterPanel />}
            {tab === 'social' && socialSub === 'ranking' && <LeaderboardPanel />}
            {tab === 'social' && socialSub === 'mail'    && <MailPanel onUnreadChange={setMailUnread} />}
            {tab === 'social' && socialSub === 'chat'    && <ChatPanel />}
          </AnimatedPanel>
        </main>
      </div>

      <BottomNav active={tab} onChange={switchTab} badges={{ play: questBadge, social: chatHasNew || mailUnread > 0 }} />
      <MysteryBoxModal />
      <LevelUpModal />
      {streakData && (
        <StreakModal
          streakDays={streakData.streakDays ?? 1}
          streakMilestone={streakData.streakMilestone ?? null}
          chestGems={streakData.chestGems ?? 0}
          gemsAdded={streakData.gemsAdded ?? 0}
          onClose={() => setStreakData(null)}
        />
      )}
    </div>
    </>
  );
}
