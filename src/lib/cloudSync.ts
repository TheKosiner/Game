import { doc, setDoc, getDoc, deleteDoc, collection, query, orderBy, limit, getDocs, addDoc, updateDoc, where, deleteField } from 'firebase/firestore';
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
  guildId?: string;
  guildTag?: string;
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
  }, { merge: true });
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

export interface PvpFightRecord {
  attackerUid: string;
  attackerUsername: string;
  attackerHeroName: string;
  attackerLevel: number;
  defenderUid: string;
  defenderUsername: string;
  defenderHeroName: string;
  defenderLevel: number;
  attackerWon: boolean;
  timestamp: number;
}

export async function addPvpFight(fight: PvpFightRecord): Promise<void> {
  if (!db) return;
  await addDoc(collection(db, 'pvpHistory'), fight);
}

export async function getPvpHistory(): Promise<PvpFightRecord[]> {
  if (!db) return [];
  const q = query(
    collection(db, 'pvpHistory'),
    orderBy('timestamp', 'desc'),
    limit(30)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as PvpFightRecord);
}

// ── GUILDS ────────────────────────────────────────────────────────────────

export interface GuildMemberData {
  username: string;
  heroName: string;
  heroClass: string;
  level: number;
  role: 'leader' | 'member';
  joinedAt: number;
}

export interface Guild {
  id: string;
  name: string;
  tag: string;
  description: string;
  leaderUid: string;
  members: Record<string, GuildMemberData>;
  createdAt: number;
  guildXp: number;
}

export interface GuildInvite {
  id: string;
  guildId: string;
  guildName: string;
  guildTag: string;
  fromUid: string;
  fromUsername: string;
  toUid: string;
  toUsername: string;
  createdAt: number;
}

export async function createGuild(
  leaderUid: string,
  leaderUsername: string,
  leaderHeroName: string,
  leaderHeroClass: string,
  leaderLevel: number,
  name: string,
  tag: string,
  description: string,
): Promise<string> {
  if (!db) throw new Error('No DB');
  const now = Date.now();
  const guildRef = await addDoc(collection(db, 'guilds'), {
    name,
    tag: tag.toUpperCase().slice(0, 4),
    description,
    leaderUid,
    createdAt: now,
    guildXp: 0,
    members: {
      [leaderUid]: {
        username: leaderUsername,
        heroName: leaderHeroName,
        heroClass: leaderHeroClass,
        level: leaderLevel,
        role: 'leader',
        joinedAt: now,
      },
    },
  });
  await updateDoc(doc(db, 'players', leaderUid), {
    guildId: guildRef.id,
    guildTag: tag.toUpperCase().slice(0, 4),
  });
  return guildRef.id;
}

export async function getGuild(guildId: string): Promise<Guild | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'guilds', guildId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Guild;
}

export async function getMyGuildId(uid: string): Promise<string | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'players', uid));
  if (!snap.exists()) return null;
  return (snap.data().guildId as string) ?? null;
}

export async function inviteToGuild(
  guildId: string,
  guildName: string,
  guildTag: string,
  fromUid: string,
  fromUsername: string,
  toUid: string,
  toUsername: string,
): Promise<void> {
  if (!db) return;
  // Avoid duplicate invites
  const existing = await getDocs(query(
    collection(db, 'guildInvites'),
    where('guildId', '==', guildId),
    where('toUid', '==', toUid),
  ));
  if (!existing.empty) return;
  await addDoc(collection(db, 'guildInvites'), {
    guildId, guildName, guildTag,
    fromUid, fromUsername,
    toUid, toUsername,
    createdAt: Date.now(),
  });
}

export async function getMyInvites(uid: string): Promise<GuildInvite[]> {
  if (!db) return [];
  const snap = await getDocs(query(
    collection(db, 'guildInvites'),
    where('toUid', '==', uid),
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as GuildInvite));
}

export async function acceptInvite(
  _inviteId: string,
  guildId: string,
  uid: string,
  username: string,
  heroName: string,
  heroClass: string,
  level: number,
): Promise<void> {
  if (!db) return;
  const now = Date.now();
  const guildSnap = await getDoc(doc(db, 'guilds', guildId));
  if (!guildSnap.exists()) return;
  await updateDoc(doc(db, 'guilds', guildId), {
    [`members.${uid}`]: { username, heroName, heroClass, level, role: 'member', joinedAt: now },
  });
  await updateDoc(doc(db, 'players', uid), {
    guildId,
    guildTag: guildSnap.data().tag,
  });
  // Remove all invites for this user
  const allInvites = await getDocs(query(collection(db, 'guildInvites'), where('toUid', '==', uid)));
  for (const d of allInvites.docs) await deleteDoc(d.ref);
}

export async function declineInvite(inviteId: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, 'guildInvites', inviteId));
}

export async function leaveGuild(guildId: string, uid: string): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'guilds', guildId), { [`members.${uid}`]: deleteField() });
  await updateDoc(doc(db, 'players', uid), { guildId: deleteField(), guildTag: deleteField() });
}

export async function transferLeadership(guildId: string, currentLeaderUid: string, newLeaderUid: string): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'guilds', guildId), {
    leaderUid: newLeaderUid,
    [`members.${newLeaderUid}.role`]: 'leader',
    [`members.${currentLeaderUid}.role`]: 'member',
  });
}

export async function disbandGuild(guildId: string, leaderUid: string): Promise<void> {
  if (!db) return;
  const guild = await getGuild(guildId);
  if (!guild || guild.leaderUid !== leaderUid) return;
  for (const uid of Object.keys(guild.members)) {
    await updateDoc(doc(db, 'players', uid), { guildId: deleteField(), guildTag: deleteField() });
  }
  // Remove pending invites
  const invites = await getDocs(query(collection(db, 'guildInvites'), where('guildId', '==', guildId)));
  for (const d of invites.docs) await deleteDoc(d.ref);
  await deleteDoc(doc(db, 'guilds', guildId));
}
