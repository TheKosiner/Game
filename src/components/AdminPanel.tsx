import { useState } from 'react';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { MONO } from '../utils/styles';

const ADMIN_EMAIL = 'thekosiner@gmail.com';

interface PlayerInfo {
  uid: string;
  username: string;
  level: number;
  gold: number;
  gems: number;
  hp: number;
  maxHp: number;
  dungeonRunsToday: number;
  questsCompletedToday: number;
  activeQuest: boolean;
  restingUntil: number | null;
  voluntaryRestUntil: number | null;
}

async function findPlayer(nameOrUid: string): Promise<PlayerInfo | null> {
  if (!db) return null;
  // Try by UID first
  try {
    const saveSnap = await getDoc(doc(db, 'saves', nameOrUid));
    if (saveSnap.exists()) {
      const d = saveSnap.data();
      const playerSnap = await getDoc(doc(db, 'players', nameOrUid));
      return {
        uid: nameOrUid,
        username: playerSnap.data()?.username ?? '?',
        level: d.hero?.level ?? 0,
        gold: d.hero?.gold ?? 0,
        gems: d.hero?.gems ?? 0,
        hp: d.hero?.hp ?? 0,
        maxHp: d.hero?.maxHp ?? 0,
        dungeonRunsToday: d.hero?.dungeonRunsToday ?? 0,
        questsCompletedToday: d.hero?.questsCompletedToday ?? 0,
        activeQuest: !!d.activeQuest,
        restingUntil: d.hero?.restingUntil ?? null,
        voluntaryRestUntil: d.hero?.voluntaryRestUntil ?? null,
      };
    }
  } catch {}

  // Try by username
  try {
    const q = query(collection(db, 'players'), where('username', '==', nameOrUid));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const playerDoc = snap.docs[0];
      const uid = playerDoc.id;
      const saveSnap = await getDoc(doc(db, 'saves', uid));
      if (saveSnap.exists()) {
        const d = saveSnap.data();
        return {
          uid,
          username: playerDoc.data().username,
          level: d.hero?.level ?? 0,
          gold: d.hero?.gold ?? 0,
          gems: d.hero?.gems ?? 0,
          hp: d.hero?.hp ?? 0,
          maxHp: d.hero?.maxHp ?? 0,
          dungeonRunsToday: d.hero?.dungeonRunsToday ?? 0,
          questsCompletedToday: d.hero?.questsCompletedToday ?? 0,
          activeQuest: !!d.activeQuest,
          restingUntil: d.hero?.restingUntil ?? null,
          voluntaryRestUntil: d.hero?.voluntaryRestUntil ?? null,
        };
      }
    }
  } catch {}

  // Try by heroName
  try {
    const q = query(collection(db, 'players'), where('heroName', '==', nameOrUid));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const playerDoc = snap.docs[0];
      const uid = playerDoc.id;
      const saveSnap = await getDoc(doc(db, 'saves', uid));
      if (saveSnap.exists()) {
        const d = saveSnap.data();
        return {
          uid,
          username: playerDoc.data().username ?? playerDoc.data().heroName,
          level: d.hero?.level ?? 0,
          gold: d.hero?.gold ?? 0,
          gems: d.hero?.gems ?? 0,
          hp: d.hero?.hp ?? 0,
          maxHp: d.hero?.maxHp ?? 0,
          dungeonRunsToday: d.hero?.dungeonRunsToday ?? 0,
          questsCompletedToday: d.hero?.questsCompletedToday ?? 0,
          activeQuest: !!d.activeQuest,
          restingUntil: d.hero?.restingUntil ?? null,
          voluntaryRestUntil: d.hero?.voluntaryRestUntil ?? null,
        };
      }
    }
  } catch {}
  return null;
}

export default function AdminPanel({ userEmail }: { userEmail: string }) {
  if (userEmail !== ADMIN_EMAIL) return null;

  const [search, setSearch] = useState('');
  const [player, setPlayer] = useState<PlayerInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [goldAmount, setGoldAmount] = useState('');
  const [gemsAmount, setGemsAmount] = useState('');
  const [levelAmount, setLevelAmount] = useState('');

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const handleSearch = async () => {
    if (!search.trim()) return;
    setLoading(true);
    setPlayer(null);
    const p = await findPlayer(search.trim());
    setPlayer(p);
    setLoading(false);
    if (!p) flash('Nie znaleziono gracza');
  };

  const patch = async (data: Record<string, unknown>) => {
    if (!player || !db) return;
    await updateDoc(doc(db, 'saves', player.uid), { ...data, updatedAt: 9999999999999 });
    // Refresh
    const p = await findPlayer(player.uid);
    setPlayer(p);
  };

  const giveGold = async () => {
    const n = parseInt(goldAmount);
    if (!n || !player) return;
    await patch({ 'hero.gold': player.gold + n });
    flash(`+${n} złota dla ${player.username}`);
    setGoldAmount('');
  };

  const giveGems = async () => {
    const n = parseInt(gemsAmount);
    if (!n || !player) return;
    await patch({ 'hero.gems': player.gems + n });
    flash(`+${n} gemów dla ${player.username}`);
    setGemsAmount('');
  };

  const setLevel = async () => {
    const lvl = parseInt(levelAmount);
    if (!lvl || lvl < 1 || lvl > 100 || !player) return;
    const xpToNext = Math.floor(100 * Math.pow(lvl, 2.3));
    await patch({ 'hero.level': lvl, 'hero.xp': 0, 'hero.xpToNext': xpToNext });
    flash(`Level ${player.username} → ${lvl}`);
    setLevelAmount('');
  };

  const resetDungeons = async () => {
    if (!player) return;
    await patch({ 'hero.dungeonRunsToday': 0 });
    flash(`Zresetowano limity lochów dla ${player.username}`);
  };

  const resetQuests = async () => {
    if (!player) return;
    await patch({ 'hero.questsCompletedToday': 0 });
    flash(`Zresetowano limity misji dla ${player.username}`);
  };

  const clearQuest = async () => {
    if (!player) return;
    await updateDoc(doc(db!, 'saves', player.uid), { activeQuest: null, updatedAt: 9999999999999 });
    const p = await findPlayer(player.uid);
    setPlayer(p);
    flash(`Wyczyszczono aktywną misję dla ${player.username}`);
  };

  const healFull = async () => {
    if (!player) return;
    await patch({ 'hero.hp': player.maxHp });
    flash(`HP ${player.username} → ${player.maxHp}/${player.maxHp}`);
  };

  const s: React.CSSProperties = {
    background: '#0a0a12', border: '2px solid #ff4466',
    borderRadius: 4, padding: 12,
    boxShadow: '0 0 20px rgba(255,68,102,0.3)',
  };

  return (
    <div style={s}>
      <p style={{ ...MONO, fontSize: 11, color: '#ff4466', marginBottom: 8, letterSpacing: '0.1em' }}>⚙ ADMIN PANEL</p>

      {/* Search */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="nazwa lub UID"
          style={{ ...MONO, flex: 1, fontSize: 10, background: '#111', border: '1px solid #333', color: '#eee', padding: '4px 6px', borderRadius: 3 }}
        />
        <button onClick={handleSearch} style={{ ...MONO, fontSize: 10, background: '#222', border: '1px solid #555', color: '#eee', padding: '4px 8px', borderRadius: 3, cursor: 'pointer' }}>
          {loading ? '...' : 'Szukaj'}
        </button>
      </div>

      {/* Player info */}
      {player && (
        <>
          <div style={{ background: '#111', border: '1px solid #222', borderRadius: 3, padding: 8, marginBottom: 8 }}>
            <p style={{ ...MONO, fontSize: 10, color: '#ffc83a', marginBottom: 2 }}>{player.username}</p>
            <p style={{ ...MONO, fontSize: 9, color: '#aaa' }}>UID: {player.uid.slice(0, 12)}...</p>
            <p style={{ ...MONO, fontSize: 10, color: '#eee', marginTop: 4 }}>
              LVL {player.level} | HP {player.hp}/{player.maxHp}
            </p>
            <p style={{ ...MONO, fontSize: 10, color: '#ffd700' }}>Złoto: {player.gold} | Gemy: {player.gems}</p>
            <p style={{ ...MONO, fontSize: 9, color: '#aaa' }}>
              Lochy: {player.dungeonRunsToday}/10 | Misje: {player.questsCompletedToday}/5
            </p>
            <p style={{ ...MONO, fontSize: 9, color: player.activeQuest ? '#ff8844' : '#666' }}>
              Misja: {player.activeQuest ? '⚠ aktywna' : 'brak'}
            </p>
            <p style={{ ...MONO, fontSize: 9, color: (player.restingUntil || player.voluntaryRestUntil) ? '#ff8844' : '#666' }}>
              Odpoczynek: {(player.restingUntil || player.voluntaryRestUntil) ? '⚠ aktywny' : 'brak'}
            </p>
          </div>

          {/* Give gold */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
            <input value={goldAmount} onChange={e => setGoldAmount(e.target.value)} placeholder="złoto"
              style={{ ...MONO, flex: 1, fontSize: 10, background: '#111', border: '1px solid #333', color: '#eee', padding: '4px 6px', borderRadius: 3 }} />
            <button onClick={giveGold} style={{ ...MONO, fontSize: 10, background: '#2a1a00', border: '1px solid #ffd700', color: '#ffd700', padding: '4px 8px', borderRadius: 3, cursor: 'pointer' }}>
              +Złoto
            </button>
          </div>

          {/* Give gems */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
            <input value={gemsAmount} onChange={e => setGemsAmount(e.target.value)} placeholder="gemy"
              style={{ ...MONO, flex: 1, fontSize: 10, background: '#111', border: '1px solid #333', color: '#eee', padding: '4px 6px', borderRadius: 3 }} />
            <button onClick={giveGems} style={{ ...MONO, fontSize: 10, background: '#0a1a2a', border: '1px solid #44aaff', color: '#44aaff', padding: '4px 8px', borderRadius: 3, cursor: 'pointer' }}>
              +Gemy
            </button>
          </div>

          {/* Set level */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
            <input value={levelAmount} onChange={e => setLevelAmount(e.target.value)} placeholder="level"
              style={{ ...MONO, flex: 1, fontSize: 10, background: '#111', border: '1px solid #333', color: '#eee', padding: '4px 6px', borderRadius: 3 }} />
            <button onClick={setLevel} style={{ ...MONO, fontSize: 10, background: '#1a002a', border: '1px solid #cc66ff', color: '#cc66ff', padding: '4px 8px', borderRadius: 3, cursor: 'pointer' }}>
              Set LVL
            </button>
          </div>

          {/* Reset buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            <button onClick={resetDungeons} style={{ ...MONO, fontSize: 9, background: '#111', border: '1px solid #446644', color: '#88cc88', padding: '4px 8px', borderRadius: 3, cursor: 'pointer' }}>
              Reset lochów
            </button>
            <button onClick={resetQuests} style={{ ...MONO, fontSize: 9, background: '#111', border: '1px solid #446644', color: '#88cc88', padding: '4px 8px', borderRadius: 3, cursor: 'pointer' }}>
              Reset misji
            </button>
            <button onClick={clearQuest} style={{ ...MONO, fontSize: 9, background: '#111', border: '1px solid #664444', color: '#cc8888', padding: '4px 8px', borderRadius: 3, cursor: 'pointer' }}>
              Wyczyść misję
            </button>
            <button onClick={healFull} style={{ ...MONO, fontSize: 9, background: '#111', border: '1px solid #446644', color: '#88cc88', padding: '4px 8px', borderRadius: 3, cursor: 'pointer' }}>
              Heal do pełna
            </button>
          </div>
        </>
      )}

      {/* Flash message */}
      {msg && <p style={{ ...MONO, fontSize: 10, color: '#44ff88', marginTop: 8 }}>{msg}</p>}
    </div>
  );
}
