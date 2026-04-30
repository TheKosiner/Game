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
import BottomNav, { type Tab } from './components/BottomNav';

export default function App() {
  const hero = useGameStore(s => s.hero);
  const loadGame = useGameStore(s => s.loadGame);
  const saveGame = useGameStore(s => s.saveGame);
  const initHero = useGameStore(s => s.initHero);

  const user = useAuthStore(s => s.user);
  const authLoading = useAuthStore(s => s.authLoading);
  const logout = useAuthStore(s => s.logout);

  const [tab, setTab] = useState<Tab>('hero');
  const [gameLoaded, setGameLoaded] = useState(false);

  // Load from cloud or localStorage once auth resolves
  useEffect(() => {
    if (authLoading) return;
    async function load() {
      if (user) {
        try {
          const loaded = await loadFromCloud(user.uid);
          if (!loaded) loadGame();
        } catch {
          loadGame();
        }
      } else {
        loadGame();
      }
      setGameLoaded(true);
    }
    load();
  }, [authLoading, user?.uid]);

  // Auto-save + cloud sync every 30s
  useEffect(() => {
    if (!gameLoaded) return;
    const id = setInterval(() => {
      saveGame();
      if (user) syncToCloud(user.uid, user.username).catch(() => {});
    }, 30_000);
    return () => clearInterval(id);
  }, [gameLoaded, user?.uid]);

  // Sync to cloud on level-up or character creation
  useEffect(() => {
    if (user && gameLoaded && hero.name !== 'Hero') {
      syncToCloud(user.uid, user.username).catch(() => {});
    }
  }, [hero.level, hero.name]);

  if (authLoading || !gameLoaded) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#d97706', fontSize: 9 }}>⏳ Ładowanie...</p>
      </div>
    );
  }

  // Show auth screen only when Firebase is configured and user is not logged in
  if (isFirebaseConfigured && !user) return <AuthScreen />;

  const hasSave = (() => {
    try { return !!localStorage.getItem('realm_of_valor_save'); } catch { return false; }
  })();
  const isNewGame = hero.name === 'Hero' && !hasSave;

  if (isNewGame) return <CharacterCreation />;

  async function handleReset() {
    if (!confirm('Zresetować postać? Stracisz cały postęp!')) return;
    localStorage.removeItem('realm_of_valor_save');
    try { if (user) await deleteCloudSave(user.uid); } catch {}
    initHero('Hero', 'warrior');
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100dvh', paddingBottom: 72 }}>
      <header style={{ background: '#0f0e17', borderBottom: '2px solid #334155', position: 'sticky', top: 0, zIndex: 40, padding: '6px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ color: '#d97706', fontSize: 9, margin: 0 }}>🏰 REALM OF VALOR</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ color: '#fbbf24', fontSize: 8 }}>🪙 {hero.gold}</span>
          <span style={{ color: '#94a3b8', fontSize: 7 }}>POZ.{hero.level}</span>
          {user && <span style={{ color: '#475569', fontSize: 6 }}>{user.username}</span>}
          {user && (
            <button onClick={() => logout()} style={{ color: '#475569', fontSize: 6, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Press Start 2P', monospace" }}>
              WYJDŹ
            </button>
          )}
          <button onClick={handleReset} style={{ color: '#475569', fontSize: 6, background: 'none', border: 'none', cursor: 'pointer' }}>↩</button>
        </div>
      </header>

      <main style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {tab === 'hero' && <><HeroCard /><EquipmentPanel /><InventoryPanel /></>}
        {tab === 'dungeon' && <DungeonPanel />}
        {tab === 'quests' && <QuestPanel />}
        {tab === 'shop' && <ShopPanel />}
        {tab === 'ranking' && <LeaderboardPanel />}
      </main>

      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
