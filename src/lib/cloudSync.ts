import { doc, setDoc, getDoc, deleteDoc, collection, query, orderBy, limit, getDocs, addDoc, updateDoc, where, deleteField, runTransaction, writeBatch, documentId } from 'firebase/firestore';
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
  pvpRating?: number;
  guildId?: string;
  guildTag?: string;
}

export async function syncToCloud(uid: string, username: string): Promise<void> {
  if (!db) return;
  const savedAt = Date.now();
  useGameStore.getState().saveGame();
  const { hero, activeQuest, pvpWins, pvpLosses, pvpRating } = useGameStore.getState();
  const { pvpLog, lastPvpFight, challengeUnlocked, lastChallengeAt } = useGameStore.getState();
  const { shopSeed, lastShopRefresh, shopPurchased, lastPassiveRegenAt } = useGameStore.getState();
  const { class: _cls, ...heroClean } = hero as any;

  // Private save data FIRST — Firestore rules validate time-based fields here.
  // If the write is rejected (clock manipulation detected), reload authoritative state.
  try {
    await setDoc(doc(db, 'saves', uid), {
      hero: heroClean,
      activeQuest,
      pvpWins: pvpWins ?? 0,
      pvpLosses: pvpLosses ?? 0,
      pvpRating: pvpRating ?? 1000,
      pvpLog: pvpLog ?? [],
      lastPvpFight: lastPvpFight ?? 0,
      challengeUnlocked: challengeUnlocked ?? 0,
      lastChallengeAt: lastChallengeAt ?? 0,
      shopSeed: shopSeed ?? 0,
      lastShopRefresh: lastShopRefresh ?? 0,
      shopPurchased: shopPurchased ?? [],
      lastPassiveRegenAt: lastPassiveRegenAt ?? Date.now(),
      updatedAt: savedAt,
    });
  } catch (err: any) {
    if (err?.code === 'permission-denied') {
      // Server rejected the save — clock was advanced or another rule violation.
      // Pull authoritative state from cloud to revert the local cheat.
      try { await loadFromCloud(uid, true); } catch {}
    }
    return;
  }

  // Leaderboard update — only reached when save was accepted
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
    pvpRating: pvpRating ?? 1000,
    updatedAt: savedAt,
  }, { merge: true });
}

function migrateHeroFromRaw(raw: any) {
  const { class: _cls, ...heroWithoutClass } = raw;
  const migrateStats = (s: any) => ({
    strength: s.strength ?? 0,
    dexterity: s.dexterity ?? s.agility ?? 0,
    intelligence: s.intelligence ?? 0,
    vitality: s.vitality ?? s.constitution ?? 0,
    magic: s.magic ?? 4,
    magicResistance: s.magicResistance ?? 4,
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

/** true = loaded from cloud, false = local is newer (use loadGame), null = no save exists (new account).
 *  Pass force=true to bypass local timestamp check (used when Firestore rejected a cheated save). */
export async function loadFromCloud(uid: string, force = false): Promise<boolean | null> {
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

  // Prefer localStorage only if it belongs to this user and is newer.
  // Skip this check when force=true (called after a rejected save to revert a cheat).
  try {
    if (!force) {
      const localRaw = localStorage.getItem('glitchsoul_save');
      if (localRaw) {
        const localSave = JSON.parse(localRaw);
        if (localSave.uid === uid && (localSave.lastSaved ?? 0) > cloudTs) return false;
      }
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
    pvpRating:         raw.pvpRating         ?? playerData.pvpRating ?? 1000,
    pvpLog:            raw.pvpLog            ?? [],
    lastPvpFight:      raw.lastPvpFight      ?? 0,
    challengeUnlocked: raw.challengeUnlocked ?? 0,
    lastChallengeAt:   raw.lastChallengeAt   ?? 0,
    shopSeed:            raw.shopSeed            ?? Date.now(),
    lastShopRefresh:     raw.lastShopRefresh     ?? 0,
    shopPurchased:       raw.shopPurchased       ?? [],
    lastPassiveRegenAt:  raw.lastPassiveRegenAt  ?? Date.now(),
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
  lastCaptureAt: number | null;
  lastLostAt: number | null;
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

export async function getGuildSentInvites(guildId: string, fromUid: string): Promise<string[]> {
  if (!db) return [];
  const snap = await getDocs(query(
    collection(db, 'guildInvites'),
    where('guildId', '==', guildId),
    where('fromUid', '==', fromUid),
  ));
  return snap.docs.map(d => d.data().toUid as string);
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
  // Avoid duplicate invites — filter by fromUid so the query is allowed by security rules
  const existing = await getDocs(query(
    collection(db, 'guildInvites'),
    where('guildId', '==', guildId),
    where('fromUid', '==', fromUid),
    where('toUid', '==', toUid),
  ));
  if (!existing.empty) return;
  await addDoc(collection(db, 'guildInvites'), {
    guildId, guildName, guildTag,
    fromUid, fromUsername,
    toUid, toUsername,
    createdAt: Date.now(),
  });
  // Send a mail notification so the recipient sees the unread badge
  await addDoc(collection(db, 'mail'), {
    fromUid,
    fromUsername,
    toUid,
    toUsername,
    body: `[GUILD INVITE] ${fromUsername} invites you to join guild [${guildTag}] ${guildName}. Open your Mail → accept or decline the invitation.`,
    createdAt: Date.now(),
    read: false,
    isGuildInviteNotification: true,
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
      siegeStartedAt: null, siegeAttackers: [],
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
  defenderMembers: Array<{ uid?: string; name: string; username?: string; level: number; portrait?: number; attack?: number; defense?: number; maxHp?: number }>;
  // Cooperative siege fields
  siegeGuildId: string | null;
  siegeGuildTag: string | null;
  siegeCurrentHp: number | null;
  siegeMaxHp: number | null;
  siegeLastHitAt: number | null;
  siegeStartedAt: number | null;
  siegeAttackers: string[]; // UIDs who already attacked in this siege
}

const EMPTY_TERRITORY = {
  guildId: null, guildName: null, guildTag: null,
  capturedAt: null, lastRewardAt: null, expiresAt: null,
  defenderMemberCount: 0, defenderAvgLevel: 0, defenderMembers: [],
  siegeGuildId: null, siegeGuildTag: null,
  siegeCurrentHp: null, siegeMaxHp: null, siegeLastHitAt: null,
  siegeStartedAt: null, siegeAttackers: [],
};

const SIEGE_DURATION = 5 * 60 * 60 * 1000; // 5h — siege window
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

/** Fetch real attack/defense/maxHp for a list of player UIDs from the leaderboard. */
export async function getPlayersStats(
  uids: string[],
): Promise<Record<string, { attack: number; defense: number; maxHp: number; level: number }>> {
  if (!db || uids.length === 0) return {};
  const result: Record<string, { attack: number; defense: number; maxHp: number; level: number }> = {};
  // Firestore 'in' supports up to 30 items per query
  for (let i = 0; i < uids.length; i += 30) {
    const chunk = uids.slice(i, i + 30);
    const snap = await getDocs(query(collection(db, 'players'), where(documentId(), 'in', chunk)));
    snap.forEach(d => {
      const data = d.data();
      result[d.id] = {
        attack:  data.attack  ?? 0,
        defense: data.defense ?? 0,
        maxHp:   data.maxHp   ?? 100,
        level:   data.level   ?? 1,
      };
    });
  }
  return result;
}

/** Start or rejoin a siege. Returns current siege state, or blocked info. */
export async function initOrJoinSiege(
  territoryId: string,
  attackingGuildId: string,
  attackingGuildTag: string,
  siegeMaxHp: number,
): Promise<{ currentHp: number; startedAt: number; attackers: string[] } | { blocked: true; byTag: string; endsAt: number }> {
  if (!db) return { currentHp: siegeMaxHp, startedAt: Date.now(), attackers: [] };
  const ref = doc(db, 'territories', territoryId);
  return runTransaction(db, async tx => {
    const snap = await tx.get(ref);
    const data = snap.exists() ? snap.data() as TerritoryState : {} as TerritoryState;
    const now = Date.now();
    const siegeExpired = data.siegeStartedAt !== null && now - data.siegeStartedAt >= SIEGE_DURATION;

    // Active siege by same guild that hasn't expired — rejoin
    if (data.siegeGuildId === attackingGuildId && (data.siegeCurrentHp ?? 0) > 0 && !siegeExpired) {
      return {
        currentHp: data.siegeCurrentHp!,
        startedAt: data.siegeStartedAt!,
        attackers: data.siegeAttackers ?? [],
      };
    }
    // Active siege by different guild that hasn't expired — blocked
    if (
      data.siegeGuildId && data.siegeGuildId !== attackingGuildId &&
      (data.siegeCurrentHp ?? 0) > 0 &&
      !siegeExpired
    ) {
      return { blocked: true as const, byTag: data.siegeGuildTag ?? '?', endsAt: (data.siegeStartedAt ?? now) + SIEGE_DURATION };
    }
    // Start fresh siege (previous expired or no siege)
    const startedAt = now;
    tx.set(ref, {
      ...(snap.exists() ? data : {}),
      siegeGuildId: attackingGuildId,
      siegeGuildTag: attackingGuildTag,
      siegeCurrentHp: siegeMaxHp,
      siegeMaxHp,
      siegeLastHitAt: now,
      siegeStartedAt: startedAt,
      siegeAttackers: [],
    }, { merge: true });
    return { currentHp: siegeMaxHp, startedAt, attackers: [] };
  });
}

/** Apply damage dealt by one player. Returns remaining siege HP. */
export async function commitSiegeDamage(
  territoryId: string,
  attackingGuildId: string,
  damage: number,
  playerUid: string,
): Promise<number> {
  if (!db || damage <= 0) return 0;
  const ref = doc(db, 'territories', territoryId);
  return runTransaction(db, async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return 0;
    const data = snap.data() as TerritoryState;
    if (data.siegeGuildId !== attackingGuildId) return data.siegeCurrentHp ?? 0;
    const newHp = Math.max(0, (data.siegeCurrentHp ?? 0) - damage);
    const attackers = [...new Set([...(data.siegeAttackers ?? []), playerUid])];
    tx.update(ref, { siegeCurrentHp: newHp, siegeLastHitAt: Date.now(), siegeAttackers: attackers });
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
  defenderMembers: TerritoryState['defenderMembers'] = [],
  prevOwnerGuildId?: string,
): Promise<void> {
  if (!db) return;
  const now = Date.now();

  // Territory write + attacker cooldown in one batch (attacker IS a guild member — rules allow it)
  const batch = writeBatch(db);
  batch.set(doc(db, 'territories', territoryId), {
    guildId, guildName, guildTag,
    capturedAt: now,
    lastRewardAt: null,
    expiresAt: now + WEEK_MS,
    defenderMemberCount: memberCount,
    defenderAvgLevel: avgLevel,
    defenderMembers,
    siegeGuildId: null, siegeGuildTag: null,
    siegeCurrentHp: null, siegeMaxHp: null,
    siegeLastHitAt: null, siegeStartedAt: null, siegeAttackers: [],
  });
  batch.update(doc(db, 'guilds', guildId), { lastCaptureAt: now });
  await batch.commit();

  // Defender cooldown is a separate write — attacker is not a member of the defending guild,
  // so it must be allowed by a dedicated Firestore rule (lastLostAt-only update).
  if (prevOwnerGuildId && prevOwnerGuildId !== guildId) {
    await updateDoc(doc(db, 'guilds', prevOwnerGuildId), { lastLostAt: now }).catch(() => {});
  }
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
    limit(50),
  ));
  const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as MailMessage));
  return msgs.sort((a, b) => b.createdAt - a.createdAt);
}

export async function markMailRead(mailId: string): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'mail', mailId), { read: true });
}

export async function deleteMail(mailId: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, 'mail', mailId));
}
