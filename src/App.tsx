import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import './App.css';
import { useGameStore, MAX_INVENTORY, isSameUtcDay } from './store/gameStore';
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
import AnimatedNumber from './components/AnimatedNumber';
import { checkForForcedUpdate, type UpdateInfo } from './lib/appUpdate';
import AdminPanel from './components/AdminPanel';
import ErrorLogPanel from './components/ErrorLogPanel';
import LevelUpModal from './components/LevelUpModal';
import CasinoPanel from './components/CasinoPanel';
import KryptaPanel from './components/KryptaPanel';
import EnchanterPanel from './components/EnchanterPanel';
// Loaded on demand: it pulls in three.js, which is only needed when the modal shows.
const StreakModal = lazy(() => import('./components/StreakModal'));
import type { DailyRewardResult } from './lib/serverActions';
import LobbyPanel from './components/LobbyPanel';
import CyberpunkBg from './components/CyberpunkBg';
import LoadingScreen, { LOADING_MIN_MS } from './components/LoadingScreen';
import AnimatedPanel from './components/AnimatedPanel';
import GameIcon from './components/GameIcon';
import TutorialOverlay, { getTutorialCfg, type TutorialNav } from './components/TutorialOverlay';
import LandingPage from './components/LandingPage';
import { PUBLIC_ROUTES, routeFor } from './lib/publicRoutes';
import LangPicker from './components/LangPicker';
import type { Lang } from './i18n';

// '/pobierz/' and '/pobierz' are the same public route.
function normalizePath(p: string): string {
  return p.length > 1 ? p.replace(/\/+$/, '') : p;
}

export default function App() {
  const t = useT();
  const { setLang } = useLangStore();
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
  const [tutorialOpen, setTutorialOpen] = useState(false);
  // Bumped by the "retry" button when the first cloud load failed.
  const [loadAttempt, setLoadAttempt] = useState(0);
  const heroReady = useGameStore(s => s.heroReady);
  const needsCharacterCreation = useGameStore(s => s.needsCharacterCreation);
  // Public marketing routes shown to logged-out visitors: '/' (landing),
  // '/logowanie' (auth) and '/pobierz' (APK download).
  const [publicRoute, setPublicRoute] = useState<string>(() => normalizePath(window.location.pathname));
  const lastChatViewedAt = useRef(Date.now());
  const loadedUidRef = useRef<string | null>(null);
  // One daily claim at a time, and no faster than once a minute if it keeps failing.
  const claimInFlightRef = useRef(false);
  const lastClaimAttemptRef = useRef(0);
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; });

  // On native: detect a newer APK build and gate the whole app behind a
  // forced-update screen. Checked at launch, whenever the app returns to the
  // foreground, and every few minutes while open — so a release shows up without
  // needing to restart the game.
  useEffect(() => {
    let cancelled = false;
    const run = () => {
      checkForForcedUpdate().then(info => { if (info && !cancelled) setUpdateInfo(info); }).catch(() => {});
    };
    run();
    const onVisible = () => { if (document.visibilityState === 'visible') run(); };
    document.addEventListener('visibilitychange', onVisible);
    const id = setInterval(run, 5 * 60 * 1000);
    return () => { cancelled = true; document.removeEventListener('visibilitychange', onVisible); clearInterval(id); };
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
    addCombatLog(tRef.current.gems.streakBoxLog(getLang() !== 'pl' ? box.nameEn ?? box.name : box.name), 'loot');
  };

  // Daily reward: claimed from the claimDailyReward Cloud Function at session start
  // and again whenever the UTC day rolls over mid-session. The local
  // checkDailyReset() only steps in when the function can't be reached.
  async function runDailyClaim(mode: 'startup' | 'rollover'): Promise<void> {
    const u = useAuthStore.getState().user;
    if (!u || claimInFlightRef.current) return;
    claimInFlightRef.current = true;
    lastClaimAttemptRef.current = Date.now();
    // One streak modal per device per (UTC) day, whichever device claimed.
    const todayKey = 'streak_modal_' + new Date().toISOString().slice(0, 10);
    const modalShown = () => { try { return !!localStorage.getItem(todayKey); } catch { return false; } };
    const markModalShown = () => { try { localStorage.setItem(todayKey, '1'); } catch { /* storage unavailable */ } };
    try {
      // Mid-session, push local progress first: the server's reset then lands on
      // top of it, rather than the next sync overwriting the reset with
      // yesterday's counters (which the save rules reject).
      if (mode === 'rollover') await syncToCloud(u.uid, u.username).catch(() => {});

      let result: DailyRewardResult;
      try {
        result = await claimDailyRewardServer();
      } catch {
        // CF not deployed or network error — fall back to local daily reset.
        const before = useGameStore.getState().hero.lastDailyReset;
        checkDailyReset();
        const after = useGameStore.getState().hero;
        if (after.lastDailyReset !== before) {
          markModalShown();
          setStreakData({ claimed: true, streakDays: after.streakDays ?? 1, streakMilestone: null, chestGems: 0, gemsAdded: 5 });
        }
        return;
      }

      if (!result.claimed) {
        // Already claimed today (e.g. from another device): adopt that reset.
        useGameStore.getState().settleVoluntaryRest();
        if (!isSameUtcDay(useGameStore.getState().hero.lastDailyReset)) {
          await loadFromCloud(u.uid, true).catch(() => {});
        }
        // Show streak modal once per device per day regardless of which device claimed first.
        if (mode === 'startup' && !modalShown()) {
          markModalShown();
          const h = useGameStore.getState().hero;
          setStreakData({ claimed: false, streakDays: h.streakDays ?? 1, streakMilestone: null, chestGems: 0, gemsAdded: 0 });
        }
        return;
      }

      if (mode === 'startup') {
        // Force-reload from cloud so local state matches exactly what the CF wrote.
        await loadFromCloud(u.uid, true).catch(() => {});
      }
      // Apply the server's daily reset locally too — if the cloud reload above
      // failed (or mid-session, where we don't reload), stale local counters would
      // otherwise be synced back over the server's reset.
      useGameStore.getState().applyServerDailyReset(result, mode === 'startup' ? 'absolute' : 'delta');
      addCombatLog(tRef.current.gems.dailyLog(result.gemsAdded ?? 0), 'system');
      // Milestone streak chest: grant an actual mystery box to the inventory
      // (epic on day 5, legendary on day 10). The CF only credits gems.
      if (result.streakMilestone === 'epic' || result.streakMilestone === 'legendary') {
        grantStreakMilestoneBox(result.streakMilestone);
      }
      markModalShown();
      saveGame();
      // Persist the freshly granted box (and reset state) back to the cloud so it
      // survives the next loadFromCloud on app start or another device.
      syncToCloud(u.uid, u.username).catch(() => {});
      setStreakData(result);
    } finally {
      claimInFlightRef.current = false;
    }
  }

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

  // Auto-open the tutorial for players who haven't finished/dismissed it,
  // once the game is loaded and the character exists (not mid-creation).
  useEffect(() => {
    if (!gameLoaded || !minTimeReady) return;
    if (!heroReady) return; // still on character creation (or loading)
    const cfg = getTutorialCfg();
    if (!cfg.done && cfg.auto) setTutorialOpen(true);
  }, [gameLoaded, minTimeReady, heroReady]);

  // Once signed in, the game renders at whatever public path was open — put the
  // address bar back to '/' so players don't sit on /logowanie/ while playing.
  useEffect(() => {
    if (user && normalizePath(window.location.pathname) !== '/') {
      window.history.replaceState({}, '', '/');
      setPublicRoute('/');
    }
  }, [user]);

  // On the public marketing pages the URL decides the language (each language has
  // its own indexable URL). This must NOT apply once someone is playing: the game
  // lives at '/' too, and forcing that route's language there would overwrite the
  // player's own choice on every reload.
  useEffect(() => {
    if (authLoading || user || Capacitor.isNativePlatform()) return;
    if (isFirebaseConfigured === false && !new URLSearchParams(window.location.search).has('landing')) return;
    const route = PUBLIC_ROUTES[publicRoute];
    if (route) setLang(route.lang);
  }, [publicRoute, authLoading, user]);

  // Keep the public marketing routes in sync with browser back/forward.
  useEffect(() => {
    const onPop = () => setPublicRoute(normalizePath(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  function goPublic(path: string) {
    // Static pages are emitted as /pobierz/index.html etc., so navigate with a
    // trailing slash and keep the in-app route key without one. The query string
    // is carried over so campaign/UTM params (and the dev ?landing flag) survive.
    const href = (path === '/' ? '/' : path + '/') + window.location.search;
    window.history.pushState({}, '', href);
    setPublicRoute(path);
    window.scrollTo(0, 0);
  }

  // The tutorial drives the app to the screen each step describes
  function tutorialNavigate(n: TutorialNav) {
    setTab(n.tab);
    if (n.playSub)   setPlaySub(n.playSub);
    if (n.socialSub) setSocialSub(n.socialSub);
    if (n.shopSub)   setShopSub(n.shopSub);
    if (n.guildTab)  setGuildTab(n.guildTab);
  }

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

  // Ask for notification permission once the player is actually in the game —
  // not on the public landing page, where an instant permission prompt is both
  // unwelcome and penalised by browsers.
  useEffect(() => {
    if (gameLoaded && user) requestNotificationPermission().catch(() => {});
  }, [gameLoaded, user?.uid]);

  useEffect(() => {
    if (authLoading) return;
    async function load() {
      if (user) {
        // Force-reload from cloud on every fresh session start (uid first seen) and on
        // account switches. localStorage may hold another account's save, or a save this
        // device never managed to push; without force the unsynced-progress guard in
        // loadFromCloud would keep that stale local data instead of the cloud's.
        // Also force while no hero is loaded yet (a retry after a failed first load).
        const force = loadedUidRef.current !== user.uid || !useGameStore.getState().heroReady;
        loadedUidRef.current = user.uid;
        // Until this account's hero is loaded, whatever is in memory (a placeholder,
        // or the previous account's hero) must not be saved or synced.
        if (force) useGameStore.setState({ heroReady: false, needsCharacterCreation: false });
        try {
          let loaded = await loadFromCloud(user.uid, force);
          // Retry once — on mobile, first read can fail due to cold-start network
          if (loaded === null) {
            await new Promise(r => setTimeout(r, 2500));
            loaded = await loadFromCloud(user.uid, true);
          }
          if (loaded === null) {
            // A brand-new account: show character creation.
            try { localStorage.removeItem('glitchsoul_save'); } catch {}
            initHero('Hero', 1, 2, true);
            useGameStore.setState({ needsCharacterCreation: true });
          } else if (!loaded) {
            loadGame();
          }
          // When loaded===true (cloud data), do NOT call checkDailyReset() here.
          // claimDailyRewardServer() runs next and reads Firestore to do the reset
          // server-side. Calling checkDailyReset() first updates lastDailyReset=now
          // locally, which syncToCloud then writes to Firestore before CF reads it —
          // CF sees "already claimed today" and returns claimed:false, suppressing modal.
        } catch {
          // Cloud unreachable: fall back to this account's local save, if any. With
          // none, heroReady stays false and a retry screen is shown — starting a new
          // character here could overwrite the real one once the connection returns.
          loadGame();
        }
      } else {
        loadedUidRef.current = null;
        loadGame();
        // Offline play (no Firebase): no local save means a new character.
        if (!isFirebaseConfigured && !useGameStore.getState().heroReady) {
          useGameStore.setState({ needsCharacterCreation: true });
        }
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
  }, [authLoading, user?.uid, loadAttempt]);

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
      if (currentUser) {
        useGameStore.getState().settleVoluntaryRest();
        // The UTC day rolled over while playing: claim the new day from the server
        // (a local reset would skip the streak bonus and milestone chests).
        if (!isSameUtcDay(useGameStore.getState().hero.lastDailyReset)
            && Date.now() - lastClaimAttemptRef.current > 60_000) {
          runDailyClaim('rollover');
        }
      } else {
        checkDailyReset();
      }
      tickPassiveRegen();
      saveGame();
      // A claim in flight pushes its own sync; one from here would race it.
      if (currentUser && !claimInFlightRef.current) {
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
            // A day rollover is picked up by the 10 s tick, which claims it from the server.
            if (loaded) useGameStore.getState().settleVoluntaryRest();
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
        if ((useGameStore.getState().hero.lastDailyReset ?? 0) === 0) {
          lastClaimAttemptRef.current = 0;
          runDailyClaim('startup');
        }
      }
    }, () => {});
    return () => unsub();
  }, [gameLoaded, user?.uid]);

  // Server-validated daily reward — falls back to local if CF unavailable (Spark plan)
  useEffect(() => {
    if (!gameLoaded || !user) return;
    runDailyClaim('startup');
  }, [gameLoaded, user?.uid]);

  useEffect(() => {
    if (user && gameLoaded && heroReady)
      syncToCloud(user.uid, user.username).catch(() => {});
  }, [hero.level, hero.name, heroReady]);

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

  // ── Logged-out visitors: SEO landing first, auth/download as sub-pages ──
  // Gated on auth only (not the game save), so a visitor arriving from search
  // sees the landing immediately instead of the game's loading screen.
  // `?landing=1` forces the landing in local dev, where Firebase is unconfigured.
  // Inside the installed Android app the marketing landing makes no sense
  // (it advertises installing the app), so native goes straight to sign-in.
  const forceLanding = new URLSearchParams(window.location.search).has('landing');
  if (!authLoading && !isNative && ((isFirebaseConfigured && !user) || forceLanding)) {
    const route = PUBLIC_ROUTES[publicRoute] ?? PUBLIC_ROUTES['/'];
    const go = (p: 'landing' | 'download' | 'auth') => goPublic(routeFor(p, route.lang));
    // Switching language keeps you on the same page, at that language's URL.
    const switchLang = (l: Lang) => {
      if (l !== route.lang) goPublic(routeFor(route.page, l));
    };

    if (route.page === 'auth') {
      return <AuthScreen onBack={() => go('landing')} />;
    }
    return (
      <LandingPage
        page={route.page}
        onPlay={() => go('auth')}
        onDownloadPage={() => go('download')}
        onHome={() => go('landing')}
        onSwitchLang={switchLang}
      />
    );
  }

  // The installed app skips the marketing landing, but a signed-out player still
  // has to sign in: this gate went missing when the landing was added, which left
  // fresh installs (and anyone who logged out) in an offline guest game with no
  // way to reach the sign-in screen.
  if (!authLoading && isFirebaseConfigured && !user) {
    return <AuthScreen />;
  }

  if (authLoading || !gameLoaded || !minTimeReady) {
    return <LoadingScreen text={t.app.loading} />;
  }


  // Decided by an explicit flag. It used to be "placeholder name and no local save",
  // but the start-up save wrote the placeholder to localStorage within moments, so
  // new accounts skipped character creation (and the tutorial) and played as "Hero".
  if (needsCharacterCreation) return <CharacterCreation />;
  if (!heroReady) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, textAlign: 'center', background: 'var(--bg-deep, #05050d)' }}>
        <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 13, color: 'rgba(255,255,255,0.75)', maxWidth: 320, lineHeight: 1.6 }}>{t.app.loadFailed}</p>
        <button
          className="btn btn-primary"
          onClick={() => { setGameLoaded(false); setLoadAttempt(n => n + 1); }}
          style={{ fontSize: 11, padding: '8px 18px' }}
        >{t.app.retry}</button>
      </div>
    );
  }

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
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={() => setTutorialOpen(true)}
                aria-label={t.tutorial.title}
                title={t.tutorial.title}
                style={{
                  fontFamily: "'Orbitron', monospace", fontSize: 11, fontWeight: 900,
                  width: 22, height: 22, lineHeight: 1, cursor: 'pointer',
                  color: 'rgba(0,245,255,0.6)', background: 'rgba(0,245,255,0.06)',
                  border: '1px solid rgba(0,245,255,0.3)',
                }}
              >?</button>
              <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: 'rgba(0,245,255,0.3)', letterSpacing: 1 }}>
                {hero.name}
              </p>
            </div>
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
        <Suspense fallback={null}>
          <StreakModal
            streakDays={streakData.streakDays ?? 1}
            streakMilestone={streakData.streakMilestone ?? null}
            chestGems={streakData.chestGems ?? 0}
            gemsAdded={streakData.gemsAdded ?? 0}
            onClose={() => setStreakData(null)}
          />
        </Suspense>
      )}
      <TutorialOverlay open={tutorialOpen} onClose={() => setTutorialOpen(false)} onNavigate={tutorialNavigate} />
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
          <button
            onClick={() => setTutorialOpen(true)}
            aria-label={t.tutorial.title}
            style={{
              fontFamily: "'Orbitron', monospace", fontSize: 10, fontWeight: 900,
              width: 20, height: 20, lineHeight: 1, cursor: 'pointer', padding: 0,
              color: 'rgba(0,245,255,0.6)', background: 'rgba(0,245,255,0.06)',
              border: '1px solid rgba(0,245,255,0.3)', flexShrink: 0,
            }}
          >?</button>
          <span style={{
            fontFamily: "'Orbitron', monospace",
            color: '#ffd700', fontSize: 10, fontWeight: 700,
            background: 'rgba(255,215,0,0.08)',
            border: '1px solid rgba(255,215,0,0.25)',
            padding: '3px 7px', lineHeight: 1,
            textShadow: '0 0 8px rgba(255,215,0,0.5)',
            display: 'inline-flex', alignItems: 'center', gap: 3,
          }}><GameIcon name="coin" size={11} /><AnimatedNumber value={hero.gold} gainColor="#ffd700" /></span>
          <span style={{
            fontFamily: "'Orbitron', monospace",
            color: '#00e5ff', fontSize: 10, fontWeight: 700,
            background: 'rgba(0,229,255,0.08)',
            border: '1px solid rgba(0,229,255,0.25)',
            padding: '3px 7px', lineHeight: 1,
            textShadow: '0 0 8px rgba(0,229,255,0.5)',
            display: 'inline-flex', alignItems: 'center', gap: 3,
          }}><GameIcon name="gem" size={11} color="#00e5ff" /><AnimatedNumber value={hero.gems} gainColor="#00e5ff" /></span>
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
              <LangPicker compact />
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
            {t.app.downloadAndroid}
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
        <Suspense fallback={null}>
          <StreakModal
            streakDays={streakData.streakDays ?? 1}
            streakMilestone={streakData.streakMilestone ?? null}
            chestGems={streakData.chestGems ?? 0}
            gemsAdded={streakData.gemsAdded ?? 0}
            onClose={() => setStreakData(null)}
          />
        </Suspense>
      )}
      <TutorialOverlay open={tutorialOpen} onClose={() => setTutorialOpen(false)} onNavigate={tutorialNavigate} />
    </div>
    </>
  );
}
