import { doc, setDoc, getDoc, deleteDoc, collection, query, orderBy, limit, getDocs, addDoc, updateDoc, where, deleteField, runTransaction } from 'firebase/firestore';
import { db } from './firebase';
import { useGameStore } from '../store/gameStore';
import { getHeroAttack, getHeroDefense } from '../utils/combat';

export interface LeaderboardEntry {
  uid: string;
  username: string;
  heroName: string;
  level: number;
  xp: number;
  gold: number;
  updatedAt: number;
  skinTone?: number;
  hairColor?: number;
  clothingColor?: number;
  portrait?: number;
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
  useGameStore.getState().saveGame();
  const { hero, activeQuest, pvpWins, pvpLosses } = useGameStore.getState();
  const { pvpLog, lastPvpFight, challengeUnlocked, lastChallengeAt } = useGameStore.getState();
  const { class: _cls, ...heroClean } = hero as any;
  const now = Date.now();

  // Public leaderboard data — no saveData, no email, no private fields
  await setDoc(doc(db, 'players', uid), {
    username,
    heroName: hero.name,
    heroClass: deleteField(),
    level: hero.level,
    xp: hero.xp,
    gold: hero.gold,
    skinTone: hero.skinTone ?? 1,
    hairColor: hero.hairColor ?? 2,
    clothingColor: hero.clothingColor ?? 0,
    portrait: hero.portrait ?? 0,
    attack: getHeroAttack(hero),
    defense: getHeroDefense(hero),
    maxHp: hero.maxHp,
    pvpWins: pvpWins ?? 0,
    pvpLosses: pvpLosses ?? 0,
    updatedAt: now,
  }, { merge: true });

  // Private save data — only owner can read
  await setDoc(doc(db, 'saves', uid), {
    hero: heroClean,
    activeQuest,
    pvpWins: pvpWins ?? 0,
    pvpLosses: pvpLosses ?? 0,
    pvpLog: pvpLog ?? [],
    lastPvpFight: lastPvpFight ?? 0,
    challengeUnlocked: challengeUnlocked ?? 0,
    lastChallengeAt: lastChallengeAt ?? 0,
    updatedAt: now,
  });
}

function migrateHeroFromRaw(raw: any) {
  const { class: _cls, ...heroWithoutClass } = raw;
  const migrateStats = (s: any) => ({
    strength: s.strength ?? 0,
    dexterity: s.dexterity ?? s.agility ?? 0,
    intelligence: s.intelligence ?? 0,
    vitality: s.vitality ?? s.constitution ?? 0,
  });
  const migrateItem = (item: any) => item ? { ...item, stats: migrateStats(item.stats ?? {}) } : item;
  const migrateEquipment = (eq: any) => {
    if (!eq) return {};
    const result: any = {};
    for (const [k, v] of Object.entries(eq)) result[k] = migrateItem(v);
    return result;
  };
  return {
    ...heroWithoutClass,
    stats: migrateStats(raw.stats ?? {}),
    equipment: migrateEquipment(raw.equipment),
    inventory: (raw.inventory ?? []).map(migrateItem),
    clothingColor: raw.clothingColor ?? 0,
    lastRespecAt: raw.lastRespecAt ?? null,
  };
}

/** true = loaded from cloud, false = local is newer (use loadGame), null = no save exists (new account) */
export async function loadFromCloud(uid: string): Promise<boolean | null> {
  if (!db) return null;

  // Read from private saves collection
  const saveSnap = await getDoc(doc(db, 'saves', uid));

  // Fall back to legacy saveData in players doc if no saves doc yet
  const legacySnap = !saveSnap.exists() ? await getDoc(doc(db, 'players', uid)) : null;
  const raw = saveSnap.exists()
    ? saveSnap.data()
    : legacySnap?.data()?.saveData;

  if (!raw?.hero) return null;

  const cloudTs: number = saveSnap.exists()
    ? (saveSnap.data().updatedAt ?? 0)
    : (legacySnap?.data()?.updatedAt ?? 0);

  // Prefer localStorage only if it belongs to this user and is newer
  try {
    const localRaw = localStorage.getItem('realm_of_valor_save');
    if (localRaw) {
      const localSave = JSON.parse(localRaw);
      if (localSave.uid === uid && (localSave.lastSaved ?? 0) > cloudTs) return false;
    }
  } catch { /* ignore */ }

  const hero = migrateHeroFromRaw(raw.hero);

  // Read pvp stats — prefer saves doc, fall back to players doc for older saves
  const playerSnap = await getDoc(doc(db, 'players', uid));
  const playerData = playerSnap.exists() ? playerSnap.data() : {};

  useGameStore.setState({
    hero,
    activeQuest: raw.activeQuest ?? null,
    currentDungeon: null,
    currentEnemy: null,
    inCombat: false,
    pvpWins:           raw.pvpWins           ?? playerData.pvpWins ?? 0,
    pvpLosses:         raw.pvpLosses         ?? playerData.pvpLosses ?? 0,
    pvpLog:            raw.pvpLog            ?? [],
    lastPvpFight:      raw.lastPvpFight      ?? 0,
    challengeUnlocked: raw.challengeUnlocked ?? 0,
    lastChallengeAt:   raw.lastChallengeAt   ?? 0,
  });
  return true;
}

export async function deleteCloudSave(uid: string): Promise<void> {
  if (!db) return;
  await Promise.all([
    deleteDoc(doc(db, 'players', uid)),
    deleteDoc(doc(db, 'saves', uid)),
  ]);
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
  level: number;
  role: 'leader' | 'member';
  joinedAt: number;
  portrait?: number;
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
  lastSiegeAt: number | null;
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

export interface MailMessage {
  id: string;
  fromUid: string;
  fromUsername: string;
  toUid: string;
  toUsername: string;
  body: string;
  createdAt: number;
  read: boolean;
}

export async function createGuild(
  leaderUid: string,
  leaderUsername: string,
  leaderHeroName: string,
  leaderLevel: number,
  name: string,
  tag: string,
  description: string,
  leaderPortrait?: number,
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
        level: leaderLevel,
        role: 'leader',
        joinedAt: now,
        portrait: leaderPortrait ?? 0,
      },
    },
  });
  await setDoc(doc(db, 'players', leaderUid), {
    guildId: guildRef.id,
    guildTag: tag.toUpperCase().slice(0, 4),
  }, { merge: true });
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
  level: number,
  portrait?: number,
): Promise<void> {
  if (!db) return;
  const now = Date.now();
  const guildSnap = await getDoc(doc(db, 'guilds', guildId));
  if (!guildSnap.exists()) return;
  await updateDoc(doc(db, 'guilds', guildId), {
    [`members.${uid}`]: { username, heroName, level, role: 'member', joinedAt: now, portrait: portrait ?? 0 },
  });
  await setDoc(doc(db, 'players', uid), {
    guildId,
    guildTag: guildSnap.data().tag,
  }, { merge: true });
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
  // Release any territories owned by this guild
  const ownedTerritories = await getDocs(query(collection(db, 'territories'), where('guildId', '==', guildId)));
  for (const d of ownedTerritories.docs) {
    await setDoc(d.ref, {
      guildId: null, guildName: null, guildTag: null,
      capturedAt: null, lastRewardAt: null,
      defenderMemberCount: 0, defenderAvgLevel: 0,
      siegeGuildId: null, siegeGuildTag: null,
      siegeCurrentHp: null, siegeMaxHp: null, siegeLastHitAt: null,
    });
  }
  await deleteDoc(doc(db, 'guilds', guildId));
}

// ── TERRITORIES ───────────────────────────────────────────────────────────────

export interface TerritoryState {
  id: string;
  guildId: string | null;
  guildName: string | null;
  guildTag: string | null;
  capturedAt: number | null;
  lastRewardAt: number | null;
  expiresAt: number | null;
  defenderMemberCount: number;
  defenderAvgLevel: number;
  // Cooperative siege fields
  siegeGuildId: string | null;
  siegeGuildTag: string | null;
  siegeCurrentHp: number | null;
  siegeMaxHp: number | null;
  siegeLastHitAt: number | null;
}

const EMPTY_TERRITORY = {
  guildId: null, guildName: null, guildTag: null,
  capturedAt: null, lastRewardAt: null, expiresAt: null,
  defenderMemberCount: 0, defenderAvgLevel: 0,
  siegeGuildId: null, siegeGuildTag: null,
  siegeCurrentHp: null, siegeMaxHp: null, siegeLastHitAt: null,
};

const SIEGE_TIMEOUT = 2 * 60 * 60 * 1000; // 2h stale siege can be overwritten
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export async function getTerritories(): Promise<Record<string, TerritoryState>> {
  if (!db) return {};
  const snap = await getDocs(collection(db, 'territories'));
  const result: Record<string, TerritoryState> = {};

  // Collect unique guild IDs referenced by territories
  const guildIds = new Set<string>();
  snap.docs.forEach(d => {
    const data = d.data() as TerritoryState;
    if (data.guildId) guildIds.add(data.guildId);
    if (data.siegeGuildId) guildIds.add(data.siegeGuildId);
  });

  // Check which guilds still exist
  const existingGuilds = new Set<string>();
  await Promise.all([...guildIds].map(async id => {
    const g = await getDoc(doc(db!, 'guilds', id));
    if (g.exists()) existingGuilds.add(id);
  }));

  // Build result, auto-cleaning orphaned ownership/siege data and expired territories
  const now = Date.now();
  const expiryWrites: Promise<void>[] = [];

  await Promise.all(snap.docs.map(async d => {
    const data = { id: d.id, ...d.data() } as TerritoryState;
    let dirty = false;

    // Lazy expiry: reset territory to neutral if expiresAt has passed
    if (data.guildId && data.expiresAt !== null && data.expiresAt < now) {
      Object.assign(data, EMPTY_TERRITORY, { id: d.id });
      expiryWrites.push(setDoc(d.ref, { ...EMPTY_TERRITORY }));
      result[d.id] = data;
      return;
    }

    if (data.guildId && !existingGuilds.has(data.guildId)) {
      Object.assign(data, EMPTY_TERRITORY, { id: d.id });
      dirty = true;
    } else if (data.siegeGuildId && !existingGuilds.has(data.siegeGuildId)) {
      data.siegeGuildId = null;
      data.siegeGuildTag = null;
      data.siegeCurrentHp = null;
      data.siegeMaxHp = null;
      data.siegeLastHitAt = null;
      dirty = true;
    }

    if (dirty) await setDoc(d.ref, data);
    result[d.id] = data;
  }));

  Promise.all(expiryWrites).catch(() => {});

  return result;
}

/** Start or rejoin a siege. Returns current siege HP, or null if blocked by another guild. */
export async function initOrJoinSiege(
  territoryId: string,
  attackingGuildId: string,
  attackingGuildTag: string,
  siegeMaxHp: number,
): Promise<{ currentHp: number } | { blocked: true; byTag: string }> {
  if (!db) return { currentHp: siegeMaxHp };
  const ref = doc(db, 'territories', territoryId);
  return runTransaction(db, async tx => {
    const snap = await tx.get(ref);
    const data = snap.exists() ? snap.data() as TerritoryState : {} as TerritoryState;
    const now = Date.now();
    // Active siege by same guild — rejoin
    if (data.siegeGuildId === attackingGuildId && (data.siegeCurrentHp ?? 0) > 0) {
      return { currentHp: data.siegeCurrentHp! };
    }
    // Active siege by different guild that hasn't gone stale — blocked
    if (
      data.siegeGuildId && data.siegeGuildId !== attackingGuildId &&
      (data.siegeCurrentHp ?? 0) > 0 &&
      data.siegeLastHitAt !== null &&
      now - data.siegeLastHitAt < SIEGE_TIMEOUT
    ) {
      return { blocked: true as const, byTag: data.siegeGuildTag ?? '?' };
    }
    // Start fresh siege
    tx.set(ref, {
      ...(snap.exists() ? data : {}),
      siegeGuildId: attackingGuildId,
      siegeGuildTag: attackingGuildTag,
      siegeCurrentHp: siegeMaxHp,
      siegeMaxHp,
      siegeLastHitAt: now,
    }, { merge: true });
    return { currentHp: siegeMaxHp };
  });
}

/** Apply damage dealt in one player session. Returns remaining siege HP. */
export async function commitSiegeDamage(
  territoryId: string,
  attackingGuildId: string,
  damage: number,
): Promise<number> {
  if (!db || damage <= 0) return 0;
  const ref = doc(db, 'territories', territoryId);
  return runTransaction(db, async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return 0;
    const data = snap.data() as TerritoryState;
    if (data.siegeGuildId !== attackingGuildId) return data.siegeCurrentHp ?? 0;
    const newHp = Math.max(0, (data.siegeCurrentHp ?? 0) - damage);
    tx.update(ref, { siegeCurrentHp: newHp, siegeLastHitAt: Date.now() });
    return newHp;
  });
}

export async function captureTerritory(
  territoryId: string,
  guildId: string,
  guildName: string,
  guildTag: string,
  memberCount: number,
  avgLevel: number,
): Promise<void> {
  if (!db) return;
  await setDoc(doc(db, 'territories', territoryId), {
    guildId,
    guildName,
    guildTag,
    capturedAt: Date.now(),
    lastRewardAt: null,
    expiresAt: Date.now() + WEEK_MS,
    defenderMemberCount: memberCount,
    defenderAvgLevel: avgLevel,
    siegeGuildId: null,
    siegeGuildTag: null,
    siegeCurrentHp: null,
    siegeMaxHp: null,
    siegeLastHitAt: null,
  });
}

export async function abandonTerritory(territoryId: string, guildId: string): Promise<void> {
  if (!db) return;
  await setDoc(doc(db, 'territories', territoryId), {
    guildId: null, guildName: null, guildTag: null,
    capturedAt: null, lastRewardAt: null, expiresAt: null,
    defenderMemberCount: 0, defenderAvgLevel: 0,
    siegeGuildId: null, siegeGuildTag: null,
    siegeCurrentHp: null, siegeMaxHp: null, siegeLastHitAt: null,
  });
  await updateDoc(doc(db, 'guilds', guildId), { lastSiegeAt: Date.now() });
}

export async function recordGuildSiegeAttempt(guildId: string): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'guilds', guildId), { lastSiegeAt: Date.now() });
}

export async function claimTerritoryReward(
  territoryId: string,
  guildId: string,
): Promise<{ gold: number; xp: number } | null> {
  if (!db) return null;
  const ref = doc(db, 'territories', territoryId);
  return runTransaction(db, async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return null;
    const data = snap.data() as TerritoryState;
    if (data.guildId !== guildId) return null;
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    if (data.lastRewardAt !== null && now - data.lastRewardAt < DAY) return null;
    tx.update(ref, { lastRewardAt: now });
    return { gold: 0, xp: 0 };
  });
}

// ── Mail ─────────────────────────────────────────────────────────────────────

export async function sendMail(
  fromUid: string,
  fromUsername: string,
  toUid: string,
  toUsername: string,
  body: string,
): Promise<void> {
  if (!db) return;
  await addDoc(collection(db, 'mail'), {
    fromUid, fromUsername, toUid, toUsername, body,
    createdAt: Date.now(), read: false,
  });
}

export async function getMyMail(uid: string): Promise<MailMessage[]> {
  if (!db) return [];
  const snap = await getDocs(query(
    collection(db, 'mail'),
    where('toUid', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(50),
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as MailMessage));
}

export async function markMailRead(mailId: string): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'mail', mailId), { read: true });
}

export async function deleteMail(mailId: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, 'mail', mailId));
}
