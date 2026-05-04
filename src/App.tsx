import { useEffect, useState } from 'react';
import './App.css';
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
import BottomNav, { type Tab } from './components/BottomNav';

export default function App() {
  const hero = useGameStore(s => s.hero);
  const loadGame = useGameStore(s => s.loadGame);
  const saveGame = useGameStore(s => s.saveGame);
  const initHero = useGameStore(s => s.initHero);
  const checkDailyReset = useGameStore(s => s.checkDailyReset);

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
          if (!loaded) loadGame();
        } catch { loadGame(); }
      } else {
        loadGame();
      }
      setGameLoaded(true);
    }
    load();
  }, [authLoading, user?.uid]);

  useEffect(() => {
    if (!gameLoaded) return;
    checkDailyReset();
    const id = setInterval(() => {
      checkDailyReset();
      saveGame();
      if (user) syncToCloud(user.uid, user.username).catch(() => {});
    }, 30_000);
    return () => clearInterval(id);
  }, [gameLoaded, user?.uid]);

  useEffect(() => {
    if (user && gameLoaded && hero.name !== 'Hero')
      syncToCloud(user.uid, user.username).catch(() => {});
  }, [hero.level, hero.name]);

  if (authLoading || !gameLoaded) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--gold-main)', fontFamily: "'Press Start 2P', monospace", fontSize: 7 }}>⏳ Ładowanie...</p>
      </div>
    );
  }

  if (isFirebaseConfigured && !user) return <AuthScreen />;

  const hasSave = (() => { try { return !!localStorage.getItem('realm_of_valor_save'); } catch { return false; } })();
  const isNewGame = hero.name === 'Hero' && !hasSave;
  if (isNewGame) return <CharacterCreation />;

  async function handleReset() {
    if (!confirm('Zresetować postać? Stracisz cały postęp!')) return;
    localStorage.removeItem('realm_of_valor_save');
    try { if (user) await deleteCloudSave(user.uid); } catch {}
    initHero('Hero');
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100dvh', paddingBottom: 80 }}>

      {/* HEADER */}
      <header style={{
        background: 'linear-gradient(180deg, #0e0c09 0%, #0a0907 100%)',
        borderBottom: '2px solid var(--border-main)',
        position: 'sticky', top: 0, zIndex: 40,
        padding: '9px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 20px rgba(0,0,0,0.7)',
        backgroundImage: `
          linear-gradient(var(--gold-darker), var(--gold-darker)),
          linear-gradient(180deg, #0e0c09 0%, #0a0907 100%)
        `,
        backgroundSize: '100% 1px, 100% 100%',
        backgroundPosition: 'bottom, top',
        backgroundRepeat: 'no-repeat',
      }}>
        <h1 style={{
          margin: 0,
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 8,
          color: 'var(--gold-main)',
          textShadow: '0 0 12px var(--gold-glow), 0 1px 0 rgba(0,0,0,0.9)',
          letterSpacing: '0.06em',
        }}>✦ REALM OF VALOR</h1>

        <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
          <span style={{
            fontFamily: "'Press Start 2P', monospace",
            color: 'var(--gold-bright)', fontSize: 7,
            background: 'rgba(60,44,20,0.4)',
            border: '1px solid var(--gold-darker)',
            padding: '2px 7px',
          }}>🪙 {hero.gold}</span>
          <span style={{
            fontFamily: "'Press Start 2P', monospace",
            color: 'var(--text-dim)', fontSize: 6,
            background: 'rgba(20,18,14,0.8)',
            border: '1px solid var(--border-main)',
            padding: '2px 6px',
          }}>POZ.{hero.level}</span>
          {user && <span style={{ fontFamily: "'Press Start 2P', monospace", color: 'var(--text-muted)', fontSize: 5 }}>{user.username}</span>}
          {user && (
            <button onClick={() => logout()} style={{
              fontFamily: "'Press Start 2P', monospace",
              color: 'var(--text-muted)', fontSize: 5,
              background: 'none', border: 'none', cursor: 'pointer',
            }}>WYJDŹ</button>
          )}
          <button onClick={handleReset} style={{ color: 'var(--text-muted)', fontSize: 11, background: 'none', border: 'none', cursor: 'pointer' }}>↩</button>
        </div>
      </header>

      <main style={{ padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {tab === 'hero'    && <><HeroCard /><EquipmentPanel /><InventoryPanel /></>}
        {tab === 'dungeon' && <DungeonPanel />}
        {tab === 'quests'  && <QuestPanel />}
        {tab === 'shop'    && <ShopPanel />}
        {tab === 'pvp'     && <PvpPanel />}
        {tab === 'guild'   && <GuildPanel />}
        {tab === 'ranking' && <LeaderboardPanel />}
      </main>

      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
