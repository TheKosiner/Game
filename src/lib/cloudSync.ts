import { doc, setDoc, getDoc, deleteDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { useGameStore } from '../store/gameStore';
import { getHeroAttack, getHeroDefense } from '../utils/combat';

export interface LeaderboardEntry {
  uid: string;
  username: string;
  heroName: string;
  heroClass: string;
  level: number;
  xp: number;
  gold: number;
  updatedAt: number;
  skinTone?: number;
  hairColor?: number;
  attack?: number;
  defense?: number;
  maxHp?: number;
  pvpWins?: number;
  pvpLosses?: number;
}

export async function syncToCloud(uid: string, username: string): Promise<void> {
  if (!db) return;
  const { hero, activeQuest, pvpWins, pvpLosses } = useGameStore.getState();
  await setDoc(doc(db, 'players', uid), {
    username,
    heroName: hero.name,
    heroClass: hero.class,
    level: hero.level,
    xp: hero.xp,
    gold: hero.gold,
    skinTone: hero.skinTone ?? 1,
    hairColor: hero.hairColor ?? 2,
    attack: getHeroAttack(hero),
    defense: getHeroDefense(hero),
    maxHp: hero.maxHp,
    pvpWins: pvpWins ?? 0,
    pvpLosses: pvpLosses ?? 0,
    updatedAt: Date.now(),
    saveData: { hero, activeQuest },
  });
}

export async function loadFromCloud(uid: string): Promise<boolean> {
  if (!db) return false;
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
  if (!db) return;
  await deleteDoc(doc(db, 'players', uid));
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  if (!db) return [];
  const q = query(
    collection(db, 'players'),
    orderBy('level', 'desc'),
    limit(50)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ uid: d.id, ...d.data() } as LeaderboardEntry));
}

// Territory system types and functions
export interface TerritoryState {
  guildId: string | null;
  guildName: string | null;
  guildTag: string | null;
  defenderMemberCount: number;
  defenderAvgLevel: number;
  lastRewardAt: number | null;
  expiresAt: number | null;
  siegeGuildId: string | null;
  siegeGuildTag: string | null;
  siegeCurrentHp: number | null;
  siegeMaxHp: number | null;
  siegeLastActivity: number | null;
}

export interface Guild {
  id: string;
  name: string;
  tag: string;
  leaderId: string;
  createdAt: number;
  members: Record<string, any>;
  lastSiegeAt?: number;
}

export async function getTerritories(): Promise<Record<string, TerritoryState>> {
  if (!db) return {};
  const snap = await getDocs(collection(db, 'territories'));
  const result: Record<string, TerritoryState> = {};
  snap.docs.forEach(doc => {
    result[doc.id] = doc.data() as TerritoryState;
  });
  return result;
}

export async function captureTerritory(
  territoryId: string,
  guildId: string,
  guildName: string,
  guildTag: string,
  memberCount: number,
  avgLevel: number
): Promise<void> {
  if (!db) return;
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  await setDoc(doc(db, 'territories', territoryId), {
    guildId,
    guildName,
    guildTag,
    defenderMemberCount: memberCount,
    defenderAvgLevel: avgLevel,
    lastRewardAt: null,
    expiresAt: Date.now() + WEEK_MS,
    siegeGuildId: null,
    siegeGuildTag: null,
    siegeCurrentHp: null,
    siegeMaxHp: null,
    siegeLastActivity: null,
  });
}

export async function claimTerritoryReward(
  territoryId: string,
  guildId: string
): Promise<number | null> {
  if (!db) return null;
  const territoryRef = doc(db, 'territories', territoryId);
  const snap = await getDoc(territoryRef);

  if (!snap.exists()) return null;
  const data = snap.data() as TerritoryState;

  if (data.guildId !== guildId) return null;

  const DAY_MS = 24 * 60 * 60 * 1000;
  const now = Date.now();

  if (data.lastRewardAt && now - data.lastRewardAt < DAY_MS) {
    return null;
  }

  await setDoc(territoryRef, { ...data, lastRewardAt: now });
  return now;
}

export async function initOrJoinSiege(
  territoryId: string,
  guildId: string,
  guildTag: string,
  maxHp: number
): Promise<{ currentHp: number } | { blocked: true; byTag: string }> {
  if (!db) return { currentHp: maxHp };

  const territoryRef = doc(db, 'territories', territoryId);
  const snap = await getDoc(territoryRef);

  if (!snap.exists()) {
    await setDoc(territoryRef, {
      guildId: null,
      guildName: null,
      guildTag: null,
      defenderMemberCount: 0,
      defenderAvgLevel: 0,
      lastRewardAt: null,
      expiresAt: null,
      siegeGuildId: guildId,
      siegeGuildTag: guildTag,
      siegeCurrentHp: maxHp,
      siegeMaxHp: maxHp,
      siegeLastActivity: Date.now(),
    });
    return { currentHp: maxHp };
  }

  const data = snap.data() as TerritoryState;
  const SIEGE_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours

  if (data.siegeGuildId && data.siegeGuildId !== guildId) {
    if (data.siegeLastActivity && Date.now() - data.siegeLastActivity < SIEGE_TIMEOUT) {
      return { blocked: true, byTag: data.siegeGuildTag || 'Unknown' };
    }
  }

  if (!data.siegeGuildId || data.siegeGuildId !== guildId) {
    await setDoc(territoryRef, {
      ...data,
      siegeGuildId: guildId,
      siegeGuildTag: guildTag,
      siegeCurrentHp: maxHp,
      siegeMaxHp: maxHp,
      siegeLastActivity: Date.now(),
    });
    return { currentHp: maxHp };
  }

  return { currentHp: data.siegeCurrentHp || maxHp };
}

export async function commitSiegeDamage(
  territoryId: string,
  guildId: string,
  damage: number
): Promise<number> {
  if (!db) return 0;

  const territoryRef = doc(db, 'territories', territoryId);
  const snap = await getDoc(territoryRef);

  if (!snap.exists()) return 0;

  const data = snap.data() as TerritoryState;

  if (data.siegeGuildId !== guildId) return data.siegeCurrentHp || 0;

  const newHp = Math.max(0, (data.siegeCurrentHp || 0) - damage);

  await setDoc(territoryRef, {
    ...data,
    siegeCurrentHp: newHp,
    siegeLastActivity: Date.now(),
  });

  return newHp;
}

export async function abandonTerritory(
  territoryId: string,
  guildId: string
): Promise<void> {
  if (!db) return;

  const territoryRef = doc(db, 'territories', territoryId);
  const snap = await getDoc(territoryRef);

  if (!snap.exists()) return;

  const data = snap.data() as TerritoryState;

  if (data.guildId !== guildId) return;

  await setDoc(territoryRef, {
    guildId: null,
    guildName: null,
    guildTag: null,
    defenderMemberCount: 0,
    defenderAvgLevel: 0,
    lastRewardAt: null,
    expiresAt: null,
    siegeGuildId: null,
    siegeGuildTag: null,
    siegeCurrentHp: null,
    siegeMaxHp: null,
    siegeLastActivity: null,
  });

  // Record that guild abandoned - they can't siege for 24h
  const guildRef = doc(db, 'guilds', guildId);
  const guildSnap = await getDoc(guildRef);
  if (guildSnap.exists()) {
    await setDoc(guildRef, {
      ...guildSnap.data(),
      lastSiegeAt: Date.now(),
    });
  }
}

export async function recordGuildSiegeAttempt(guildId: string): Promise<void> {
  if (!db) return;

  const guildRef = doc(db, 'guilds', guildId);
  const snap = await getDoc(guildRef);

  if (snap.exists()) {
    await setDoc(guildRef, {
      ...snap.data(),
      lastSiegeAt: Date.now(),
    });
  }
}
