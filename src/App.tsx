import { useEffect, useState } from 'react';
import './App.css';
import logoImg from './assets/logo.png';
import { useGameStore } from './store/gameStore';
import { useAuthStore } from './store/authStore';
import { syncToCloud, loadFromCloud, deleteCloudSave } from './lib/cloudSync';
import { isFirebaseConfigured } from './lib/firebase';
import AuthScreen from './components/AuthScreen';
import CharacterCreation from './components/CharacterCreation';
import HeroCard from './components/HeroCard';
import EquipmentPanel from './components/EquipmentPanel';
import InventoryPanel from './components/InventoryPanel';
import DungeonPanel from './components/DungeonPanel';
import QuestPanel from './components/QuestPanel';
import ShopPanel from './components/ShopPanel';
import LeaderboardPanel from './components/LeaderboardPanel';
import PvpPanel from './components/PvpPanel';
import GuildPanel from './components/GuildPanel';
import MailPanel from './components/MailPanel';
import ChallengePanel from './components/ChallengePanel';
import BottomNav, { type Tab } from './components/BottomNav';
import { PORTRAIT_OVERRIDES } from './data/portraits';

export default function App() {
  const hero = useGameStore(s => s.hero);
  const loadGame = useGameStore(s => s.loadGame);
  const saveGame = useGameStore(s => s.saveGame);
  const initHero = useGameStore(s => s.initHero);
  const checkDailyReset = useGameStore(s => s.checkDailyReset);
  const tickPassiveRegen = useGameStore(s => s.tickPassiveRegen);
  const challengeResult = useGameStore(s => s.challengeResult);

  const user = useAuthStore(s => s.user);
  const authLoading = useAuthStore(s => s.authLoading);
  const logout = useAuthStore(s => s.logout);

  const [tab, setTab] = useState<Tab>('hero');
  const [gameLoaded, setGameLoaded] = useState(false);

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
    checkDailyReset();
    tickPassiveRegen();
    const id = setInterval(() => {
      checkDailyReset();
      tickPassiveRegen();
      saveGame();
      if (user) syncToCloud(user.uid, user.username).catch(() => {});
    }, 30_000);
    return () => clearInterval(id);
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
        }}>ŁADOWANIE...</p>
        <style>{`@keyframes pulse { 0%,100%{opacity:.7} 50%{opacity:1} }`}</style>
      </div>
    );
  }

  if (isFirebaseConfigured && !user) return <AuthScreen />;

  const hasSave = (() => { try { return !!localStorage.getItem('glitchsoul_save'); } catch { return false; } })();
  const isNewGame = hero.name === 'Hero' && !hasSave;
  if (isNewGame) return <CharacterCreation />;

  async function handleReset() {
    if (!confirm('Zresetować postać? Stracisz cały postęp!')) return;
    localStorage.removeItem('glitchsoul_save');
    try { if (user) await deleteCloudSave(user.uid); } catch {}
    initHero('Hero');
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100dvh', paddingBottom: 80 }}>

      {/* CYBERPUNK TOP BAR */}
      <header style={{
        background: 'linear-gradient(180deg, #080810 0%, #0a0a18 100%)',
        borderBottom: '1px solid rgba(255,45,120,0.3)',
        position: 'sticky', top: 0, zIndex: 40,
        padding: '8px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 0 20px rgba(255,45,120,0.1), 0 4px 20px rgba(0,0,0,0.8)',
      }}>
        <img
          src={logoImg}
          alt="Glitch Soul"
          style={{
            height: 36, width: 'auto',
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
            fontFamily: "'Orbitron', monospace",
            color: '#00f5ff', fontSize: 9,
            fontWeight: 700,
            background: 'rgba(0,245,255,0.08)',
            border: '1px solid rgba(0,245,255,0.25)',
            padding: '3px 7px',
            textShadow: '0 0 8px rgba(0,245,255,0.5)',
          }}>POZ.{hero.level}</span>
          {user && (
            <>
              <span style={{ fontFamily: "'Share Tech Mono', monospace", color: 'var(--text-dim)', fontSize: 10 }}>
                {user.username}
              </span>
              <button onClick={() => logout()} style={{
                fontFamily: "'Orbitron', monospace",
                color: 'rgba(255,45,120,0.6)', fontSize: 8,
                background: 'none', border: 'none', cursor: 'pointer',
                textShadow: '0 0 6px rgba(255,45,120,0.3)',
              }}>WYJDŹ</button>
            </>
          )}
          <button onClick={handleReset} style={{
            color: 'rgba(255,45,120,0.4)', fontSize: 14,
            background: 'none', border: 'none', cursor: 'pointer',
          }}>↩</button>
        </div>
      </header>

      <main style={{ padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {tab === 'hero'    && <><HeroCard /><EquipmentPanel /><InventoryPanel /></>}
        {tab === 'dungeon'    && <DungeonPanel />}
        {tab === 'challenge'  && <ChallengePanel />}
        {tab === 'quests'     && <QuestPanel />}
        {tab === 'shop'    && <ShopPanel />}
        {tab === 'pvp'     && <PvpPanel />}
        {tab === 'guild'   && <GuildPanel />}
        {tab === 'ranking' && <LeaderboardPanel />}
        {tab === 'mail'    && <MailPanel />}
      </main>

      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
