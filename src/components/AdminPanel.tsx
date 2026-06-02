import { useState } from 'react';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, deleteField, writeBatch, getDocs as getAllDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { loadFromCloud } from '../lib/cloudSync';
import { useAuthStore } from '../store/authStore';
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
  kryptaRunsToday: number;
  questsCompletedToday: number;
  activeQuest: boolean;
  restingUntil: number | null;
  voluntaryRestUntil: number | null;
  guildId: string | null;
}

async function findPlayer(nameOrUid: string): Promise<PlayerInfo | null> {
  if (!db) return null;
  // Try by UID first
  try {
    const [saveSnap, playerSnap] = await Promise.all([
      getDoc(doc(db, 'saves', nameOrUid)),
      getDoc(doc(db, 'players', nameOrUid)),
    ]);
    if (saveSnap.exists()) {
      const d = saveSnap.data();
      const pd = playerSnap.exists() ? playerSnap.data() : null;
      return {
        uid: nameOrUid,
        username: pd?.username ?? '?',
        level: d.hero?.level ?? 0,
        gold: d.hero?.gold ?? 0,
        gems: d.hero?.gems ?? 0,
        hp: d.hero?.hp ?? 0,
        maxHp: d.hero?.maxHp ?? 0,
        dungeonRunsToday: d.hero?.dungeonRunsToday ?? 0,
        kryptaRunsToday: d.hero?.kryptaRunsToday ?? 0,
        questsCompletedToday: d.hero?.questsCompletedToday ?? 0,
        activeQuest: !!d.activeQuest,
        restingUntil: d.hero?.restingUntil ?? null,
        voluntaryRestUntil: d.hero?.voluntaryRestUntil ?? null,
        guildId: pd?.guildId ?? null,
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
        const pd = playerDoc.data();
        return {
          uid,
          username: pd.username,
          level: d.hero?.level ?? 0,
          gold: d.hero?.gold ?? 0,
          gems: d.hero?.gems ?? 0,
          hp: d.hero?.hp ?? 0,
          maxHp: d.hero?.maxHp ?? 0,
          dungeonRunsToday: d.hero?.dungeonRunsToday ?? 0,
          kryptaRunsToday: d.hero?.kryptaRunsToday ?? 0,
          questsCompletedToday: d.hero?.questsCompletedToday ?? 0,
          activeQuest: !!d.activeQuest,
          restingUntil: d.hero?.restingUntil ?? null,
          voluntaryRestUntil: d.hero?.voluntaryRestUntil ?? null,
          guildId: pd.guildId ?? null,
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
        const pd = playerDoc.data();
        return {
          uid,
          username: pd.username ?? pd.heroName,
          level: d.hero?.level ?? 0,
          gold: d.hero?.gold ?? 0,
          gems: d.hero?.gems ?? 0,
          hp: d.hero?.hp ?? 0,
          maxHp: d.hero?.maxHp ?? 0,
          dungeonRunsToday: d.hero?.dungeonRunsToday ?? 0,
          kryptaRunsToday: d.hero?.kryptaRunsToday ?? 0,
          questsCompletedToday: d.hero?.questsCompletedToday ?? 0,
          activeQuest: !!d.activeQuest,
          restingUntil: d.hero?.restingUntil ?? null,
          voluntaryRestUntil: d.hero?.voluntaryRestUntil ?? null,
          guildId: pd.guildId ?? null,
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
  const [selfInfo, setSelfInfo] = useState<{ cloudLevel: number } | null>(null);

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
    try {
      await updateDoc(doc(db!, 'saves', player.uid), { ...data, updatedAt: 9999999999999 });
    } catch (e: any) {
      flash(`❌ Błąd zapisu: ${e?.code ?? e?.message ?? 'nieznany'}`);
      return;
    }
    setPlayer(prev => {
      if (!prev) return prev;
      const updated = { ...prev };
      for (const [key, val] of Object.entries(data)) {
        if (key === 'hero.gold')   updated.gold   = val as number;
        if (key === 'hero.gems')   updated.gems   = val as number;
        if (key === 'hero.level')  updated.level  = val as number;
        if (key === 'hero.hp')     updated.hp     = val as number;
        if (key === 'hero.dungeonRunsToday')    updated.dungeonRunsToday    = val as number;
        if (key === 'hero.kryptaRunsToday')     updated.kryptaRunsToday     = val as number;
        if (key === 'hero.questsCompletedToday') updated.questsCompletedToday = val as number;
      }
      return updated;
    });
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

  const resetKrypta = async () => {
    if (!player) return;
    await patch({ 'hero.kryptaRunsToday': 0 });
    flash(`Zresetowano limit Krypty dla ${player.username}`);
  };

  const resetQuests = async () => {
    if (!player) return;
    await patch({ 'hero.questsCompletedToday': 0 });
    flash(`Zresetowano limity misji dla ${player.username}`);
  };

  const clearQuest = async () => {
    if (!player) return;
    try {
      await updateDoc(doc(db!, 'saves', player.uid), { activeQuest: null, updatedAt: 9999999999999 });
    } catch (e: any) {
      flash(`❌ Błąd zapisu: ${e?.code ?? e?.message ?? 'nieznany'}`);
      return;
    }
    setPlayer(prev => prev ? { ...prev, activeQuest: false } : prev);
    flash(`Wyczyszczono aktywną misję dla ${player.username}`);
  };

  const healFull = async () => {
    if (!player) return;
    await patch({ 'hero.hp': player.maxHp });
    flash(`HP ${player.username} → ${player.maxHp}/${player.maxHp}`);
  };

  const forceReloadSelf = async () => {
    const uid = useAuthStore.getState().user?.uid;
    if (!uid || !db) return;
    flash('Ładowanie z chmury...');
    try {
      const snap = await getDoc(doc(db, 'saves', uid));
      const cloudLevel = snap.exists() ? (snap.data().hero?.level ?? '?') : '❌ brak';
      setSelfInfo({ cloudLevel: cloudLevel as number });
      const result = await loadFromCloud(uid, true);
      if (result === true) flash(`✅ Załadowano z chmury (level w chmurze: ${cloudLevel})`);
      else if (result === null) flash('❌ Brak zapisu w chmurze!');
      else flash('ℹ️ Lokalny zapis był nowszy (ale force pominął)');
    } catch (e: any) {
      flash(`❌ Błąd: ${e?.message ?? e}`);
    }
  };

  const resetGuildRaid = async () => {
    if (!player?.guildId || !db) return;
    try {
      await updateDoc(doc(db, 'guilds', player.guildId), { guildOperation: deleteField() });
    } catch (e: any) {
      flash(`❌ Błąd: ${e?.code ?? e?.message ?? 'nieznany'}`);
      return;
    }
    flash(`Zresetowano rajd gildyjny (${player.guildId.slice(0, 8)}...)`);
  };

  const resetAllLimits = async () => {
    if (!db) return;
    if (!confirm('Zresetować limity WSZYSTKICH graczy (lochy + krypta + misje)?')) return;
    try {
      flash('⏳ Resetowanie...');
      const snap = await getAllDocs(collection(db, 'saves'));
      const BATCH_SIZE = 400;
      let resetCount = 0;
      for (let i = 0; i < snap.docs.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        snap.docs.slice(i, i + BATCH_SIZE).forEach(d => {
          batch.update(d.ref, {
            'hero.dungeonRunsToday': 0,
            'hero.questsCompletedToday': 0,
            'hero.kryptaRunsToday': 0,
            updatedAt: 9999999999999,
          });
          resetCount++;
        });
        await batch.commit();
      }
      flash(`✅ Zresetowano limity dla ${resetCount} graczy`);
    } catch (e: any) {
      flash(`❌ Błąd: ${e?.message ?? e}`);
    }
  };

  const s: React.CSSProperties = {
    background: '#0a0a12', border: '2px solid #ff4466',
    borderRadius: 4, padding: 12,
    boxShadow: '0 0 20px rgba(255,68,102,0.3)',
  };

  return (
    <div style={s}>
      <p style={{ ...MONO, fontSize: 11, color: '#ff4466', marginBottom: 8, letterSpacing: '0.1em' }}>⚙ ADMIN PANEL</p>

      {/* Self recovery */}
      <div style={{ marginBottom: 10, padding: '6px 8px', background: '#110022', border: '1px solid #6644aa', borderRadius: 3 }}>
        <p style={{ ...MONO, fontSize: 9, color: '#aa88ff', marginBottom: 4 }}>MÓJ ZAPIS</p>
        {selfInfo && (
          <p style={{ ...MONO, fontSize: 9, color: '#eee', marginBottom: 4 }}>
            Level w chmurze: <span style={{ color: '#ffd700' }}>{selfInfo.cloudLevel}</span>
          </p>
        )}
        <button onClick={forceReloadSelf} style={{ ...MONO, fontSize: 9, background: '#220033', border: '1px solid #aa44ff', color: '#cc88ff', padding: '4px 10px', borderRadius: 3, cursor: 'pointer' }}>
          🔄 Force reload z chmury
        </button>
      </div>

      {/* Global reset */}
      <div style={{ marginBottom: 10, padding: '6px 8px', background: '#1a0000', border: '1px solid #ff4444', borderRadius: 3 }}>
        <p style={{ ...MONO, fontSize: 9, color: '#ff8888', marginBottom: 4 }}>AKCJE GLOBALNE</p>
        <button onClick={resetAllLimits} style={{ ...MONO, fontSize: 9, background: '#2a0000', border: '1px solid #ff4444', color: '#ff8888', padding: '4px 10px', borderRadius: 3, cursor: 'pointer' }}>
          🔄 Reset limitów WSZYSTKICH graczy
        </button>
      </div>

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
              Lochy: {player.dungeonRunsToday}/10 | Krypta: {player.kryptaRunsToday}/5 | Misje: {player.questsCompletedToday}/5
            </p>
            <p style={{ ...MONO, fontSize: 9, color: player.activeQuest ? '#ff8844' : '#666' }}>
              Misja: {player.activeQuest ? '⚠ aktywna' : 'brak'}
            </p>
            <p style={{ ...MONO, fontSize: 9, color: (player.restingUntil || player.voluntaryRestUntil) ? '#ff8844' : '#666' }}>
              Odpoczynek: {(player.restingUntil || player.voluntaryRestUntil) ? '⚠ aktywny' : 'brak'}
            </p>
            <p style={{ ...MONO, fontSize: 9, color: player.guildId ? '#88aaff' : '#444' }}>
              Gildia: {player.guildId ? player.guildId.slice(0, 12) + '...' : 'brak'}
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
            <button onClick={resetKrypta} style={{ ...MONO, fontSize: 9, background: '#111', border: '1px solid #6644aa', color: '#cc88ff', padding: '4px 8px', borderRadius: 3, cursor: 'pointer' }}>
              Reset Krypty
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
            <button
              onClick={resetGuildRaid}
              disabled={!player.guildId}
              style={{ ...MONO, fontSize: 9, background: '#111', border: '1px solid #4466aa', color: player.guildId ? '#88aaff' : '#444', padding: '4px 8px', borderRadius: 3, cursor: player.guildId ? 'pointer' : 'not-allowed' }}
            >
              Reset rajdu gildii
            </button>
          </div>
        </>
      )}

      {/* Flash message */}
      {msg && <p style={{ ...MONO, fontSize: 10, color: '#44ff88', marginTop: 8 }}>{msg}</p>}
    </div>
  );
}
