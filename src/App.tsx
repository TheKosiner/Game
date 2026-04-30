import { useEffect, useState } from 'react';
import './App.css';
import { useGameStore } from './store/gameStore';
import CharacterCreation from './components/CharacterCreation';
import HeroCard from './components/HeroCard';
import EquipmentPanel from './components/EquipmentPanel';
import InventoryPanel from './components/InventoryPanel';
import DungeonPanel from './components/DungeonPanel';
import QuestPanel from './components/QuestPanel';
import ShopPanel from './components/ShopPanel';
import BottomNav from './components/BottomNav';

type Tab = 'hero' | 'dungeon' | 'quests' | 'shop';

export default function App() {
  const hero = useGameStore(s => s.hero);
  const loadGame = useGameStore(s => s.loadGame);
  const saveGame = useGameStore(s => s.saveGame);
  const initHero = useGameStore(s => s.initHero);
  const [tab, setTab] = useState<Tab>('hero');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadGame();
    setLoaded(true);
  }, []);

  useEffect(() => {
    const id = setInterval(() => saveGame(), 30_000);
    return () => clearInterval(id);
  }, []);

  if (!loaded) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#d97706', fontSize: '1.25rem' }}>⏳ Ładowanie...</p>
      </div>
    );
  }

  const hasSave = (() => {
    try { return !!localStorage.getItem('realm_of_valor_save'); } catch { return false; }
  })();
  const isNewGame = hero.name === 'Hero' && !hasSave;

  if (isNewGame) {
    return <CharacterCreation />;
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100dvh', paddingBottom: 80 }}>
      <header style={{ background: '#0f0e17', borderBottom: '1px solid #334155', position: 'sticky', top: 0, zIndex: 40, padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ color: '#d97706', fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>🏰 Realm of Valor</h1>
        <div style={{ display: 'flex', gap: 12, fontSize: '0.875rem', alignItems: 'center' }}>
          <span style={{ color: '#d97706' }}>🪙 {hero.gold}</span>
          <span style={{ color: '#94a3b8' }}>Poz. {hero.level}</span>
          <button onClick={() => { if (confirm('Zresetować grę?')) { localStorage.removeItem('realm_of_valor_save'); initHero('Hero', 'warrior'); } }} style={{ color: '#64748b', fontSize: '0.7rem', background: 'none', border: 'none', cursor: 'pointer' }}>↩</button>
        </div>
      </header>

      <main style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {tab === 'hero' && (
          <>
            <HeroCard />
            <EquipmentPanel />
            <InventoryPanel />
          </>
        )}
        {tab === 'dungeon' && <DungeonPanel />}
        {tab === 'quests' && <QuestPanel />}
        {tab === 'shop' && <ShopPanel />}
      </main>

      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
