import { doc, setDoc, getDoc, deleteDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { useGameStore } from '../store/gameStore';

export interface LeaderboardEntry {
  uid: string;
  username: string;
  heroName: string;
  heroClass: string;
  level: number;
  xp: number;
  gold: number;
  updatedAt: number;
}

export async function syncToCloud(uid: string, username: string): Promise<void> {
  const { hero, activeQuest } = useGameStore.getState();
  await setDoc(doc(db, 'players', uid), {
    username,
    heroName: hero.name,
    heroClass: hero.class,
    level: hero.level,
    xp: hero.xp,
    gold: hero.gold,
    updatedAt: Date.now(),
    saveData: { hero, activeQuest },
  });
}

export async function loadFromCloud(uid: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'players', uid));
  if (!snap.exists()) return false;
  const data = snap.data();
  if (data.saveData?.hero) {
    useGameStore.setState({
      hero: data.saveData.hero,
      activeQuest: data.saveData.activeQuest ?? null,
      currentDungeon: null,
      currentEnemy: null,
      inCombat: false,
    });
    return true;
  }
  return false;
}

export async function deleteCloudSave(uid: string): Promise<void> {
  await deleteDoc(doc(db, 'players', uid));
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const q = query(
    collection(db, 'players'),
    orderBy('level', 'desc'),
    orderBy('xp', 'desc'),
    limit(50)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ uid: d.id, ...d.data() } as LeaderboardEntry));
}
