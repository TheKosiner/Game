import { doc, setDoc, getDoc, deleteDoc, collection, query, orderBy, limit, getDocs, addDoc, updateDoc, where, deleteField, runTransaction, writeBatch, documentId, increment } from 'firebase/firestore';
import { db } from './firebase';
import { useGameStore } from '../store/gameStore';
import { getHeroAttack, getHeroDefense } from '../utils/combat';
import { GUILD_OP_LOCATIONS, getFloorEnemy, pickLocationForLevel } from '../data/guildOperations';

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
  equipment?: Record<string, {
    id: string; name: string; slot: string; rarity: string; level: number; enhanceLevel?: number;
    stats?: Record<string, number>; attackBonus?: number; defenseBonus?: number;
  }>;
}

// Throttle guild member stat updates to at most once per 60 s per uid
const _lastGuildSync = new Map<string, number>();

export async function syncToCloud(uid: string, username: string): Promise<void> {
  if (!db) return;
  const savedAt = Date.now();
  useGameStore.getState().saveGame();
  const { hero, activeQuest, pvpWins, pvpLosses, pvpRating } = useGameStore.getState();
  const { pvpLog, lastPvpFight, challengeUnlocked, lastChallengeAt } = useGameStore.getState();
  const { shopSeed, lastShopRefresh, shopPurchased, lastPassiveRegenAt } = useGameStore.getState();
  const { class: _cls, ...heroClean } = hero as any;

  const playerRef = doc(db, 'players', uid);

  // Batch A (parallel): write private save + read player doc for guildId
  // Private save FIRST — Firestore rules validate time-based fields here.
  // If the write is rejected (clock manipulation detected), reload authoritative state.
  let playerSnap: import('firebase/firestore').DocumentSnapshot;
  try {
    const results = await Promise.all([
      setDoc(doc(db, 'saves', uid), {
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
      }),
      getDoc(playerRef),
    ] as const);
    playerSnap = results[1];
  } catch (err: any) {
    if (err?.code === 'permission-denied') {
      // Server rejected the save — clock was advanced or another rule violation.
      // Pull authoritative state from cloud to revert the local cheat.
      try { await loadFromCloud(uid, true); } catch {}
    }
    return;
  }

  const existingGuildId = playerSnap.exists() ? (playerSnap.data().guildId as string | undefined) : undefined;

  // Batch B (parallel): update leaderboard entry + guild member stats
  const now = Date.now();
  const lastGuildSync = _lastGuildSync.get(uid) ?? 0;
  const shouldSyncGuild = existingGuildId && (now - lastGuildSync >= 60_000);

  const batchB: Promise<unknown>[] = [
    setDoc(playerRef, {
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
      equipment: Object.fromEntries(
        Object.entries(hero.equipment).map(([slot, item]) => [
          slot,
          item ? {
            id: item.id, name: item.name, slot: item.slot, rarity: item.rarity, level: item.level,
            enhanceLevel: item.enhanceLevel ?? 0,
            stats: Object.fromEntries(Object.entries(item.stats ?? {}).filter(([, v]) => (v as number) > 0)),
            attackBonus: item.attackBonus ?? 0,
            defenseBonus: item.defenseBonus ?? 0,
          } : null,
        ]).filter(([, v]) => v !== null)
      ),
      updatedAt: savedAt,
    }, { merge: true }),
  ];

  // Keep guild member data in sync with current hero stats (throttled)
  if (shouldSyncGuild) {
    _lastGuildSync.set(uid, now);
    batchB.push(
      updateDoc(doc(db, 'guilds', existingGuildId!), {
        [`members.${uid}.level`]: hero.level,
        [`members.${uid}.heroName`]: hero.name,
        [`members.${uid}.portrait`]: hero.portrait ?? 0,
      }).catch(() => { /* non-critical, guild may no longer exist */ })
    );
  }

  await Promise.all(batchB);
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
    completedDungeons: raw.completedDungeons ?? [],
    lastCasinoSpinAt: raw.lastCasinoSpinAt ?? 0,
    goldEarnedToday: raw.goldEarnedToday ?? 0,
    dungeonRunsToday: raw.dungeonRunsToday ?? 0,
    questsCompletedToday: raw.questsCompletedToday ?? 0,
    kryptaRunsToday: raw.kryptaRunsToday ?? 0,
  };
}

/** true = loaded from cloud, false = local is newer (use loadGame), null = no save exists (new account).
 *  Pass force=true to bypass local timestamp check (used when Firestore rejected a cheated save). */
export async function loadFromCloud(uid: string, force = false): Promise<boolean | null> {
  if (!db) return null;

  // Parallel reads — saves and players docs are independent
  const [saveSnap, playerSnap] = await Promise.all([
    getDoc(doc(db, 'saves', uid)),
    getDoc(doc(db, 'players', uid)),
  ]);

  // Fall back to legacy saveData in players doc if no saves doc yet
  const raw = saveSnap.exists()
    ? saveSnap.data()
    : playerSnap.exists() ? playerSnap.data().saveData : null;

  if (!raw?.hero) return null;

  const cloudTs: number = saveSnap.exists()
    ? (saveSnap.data().updatedAt ?? 0)
    : (playerSnap.data()?.updatedAt ?? 0);

  // Admin override: if updatedAt is far in the future (e.g. 9999999999999),
  // always load from cloud regardless of local state.
  const adminOverride = typeof cloudTs === 'number' && cloudTs > Date.now() + 3_600_000;

  // Prefer local state when it's newer than the cloud snapshot.
  // Skip this check when force=true (called after a rejected save to revert a cheat).
  // Use a 5s buffer to account for clock drift (intentionally small to favour cross-device sync).
  if (!force && !adminOverride) {
    try {
      // First check in-memory store (always up-to-date, even if localStorage fails)
      const inMemoryLastSaved = (await import('../store/gameStore')).useGameStore.getState().lastSaved ?? 0;
      if (inMemoryLastSaved + 5_000 > cloudTs) return false;
    } catch { /* fall through to localStorage check */ }

    try {
      const localRaw = localStorage.getItem('glitchsoul_save');
      if (localRaw) {
        const localSave = JSON.parse(localRaw);
        if (localSave.uid === uid && (localSave.lastSaved ?? 0) + 5_000 > cloudTs) return false;
      }
    } catch { /* ignore */ }
  }

  const hero = migrateHeroFromRaw(raw.hero);

  // Use already-fetched playerSnap for pvp stats — prefer saves doc, fall back to players doc for older saves
  const playerData = playerSnap.exists() ? playerSnap.data() : {};

  useGameStore.setState({
    hero,
    activeQuest: raw.activeQuest ?? null,
    currentDungeon: null,
    currentEnemy: null,
    inCombat: false,
    pvpWins:   Math.max(raw.pvpWins   ?? 0, playerData.pvpWins   ?? 0),
    pvpLosses: Math.max(raw.pvpLosses ?? 0, playerData.pvpLosses ?? 0),
    pvpRating: Math.max(raw.pvpRating ?? 1000, playerData.pvpRating ?? 1000),
    pvpLog:            raw.pvpLog            ?? [],
    lastPvpFight:      raw.lastPvpFight      ?? 0,
    challengeUnlocked: raw.challengeUnlocked ?? 0,
    lastChallengeAt:   raw.lastChallengeAt   ?? 0,
    shopSeed:            raw.shopSeed            ?? Date.now(),
    lastShopRefresh:     raw.lastShopRefresh     ?? 0,
    shopPurchased:       raw.shopPurchased       ?? [],
    lastPassiveRegenAt:  raw.lastPassiveRegenAt  ?? Date.now(),
    // Stamp local lastSaved with the cloud timestamp so subsequent loadFromCloud
    // calls on the same device don't see stale local data as "newer".
    lastSaved: cloudTs,
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

export interface GuildLeaderboardEntry {
  id: string;
  name: string;
  tag: string;
  memberCount: number;
  averageLevel: number;
  guildXp: number;
  treasury: number;
  leaderUsername: string;
}

export async function getGuildLeaderboard(): Promise<GuildLeaderboardEntry[]> {
  if (!db) return [];
  const snap = await getDocs(collection(db, 'guilds'));
  const entries: GuildLeaderboardEntry[] = snap.docs.map(d => {
    const data = d.data() as Guild;
    const memberValues = Object.values(data.members ?? {});
    const memberCount = memberValues.length;
    const averageLevel = memberCount > 0
      ? Math.round(memberValues.reduce((sum, m) => sum + (m.level ?? 1), 0) / memberCount)
      : 1;
    const leaderEntry = Object.values(data.members ?? {}).find(m => m.role === 'leader');
    return {
      id: d.id,
      name: data.name,
      tag: data.tag,
      memberCount,
      averageLevel,
      guildXp: data.guildXp ?? 0,
      treasury: data.treasury ?? 0,
      leaderUsername: leaderEntry?.username ?? '',
    };
  });
  return entries
    .sort((a, b) => b.memberCount - a.memberCount || b.averageLevel - a.averageLevel)
    .slice(0, 30);
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

// ── GUILDS ───────────────────────────────────────────────────────

export interface GuildOpParticipant {
  username: string;
  heroName: string;
  damage: number;
  attackedAt: number;
  maxHp: number; // stored for ranking display only — not a hard cap
  knockedOut?: boolean; // set permanently when raid HP reaches 0; blocks further attacks
}

export interface GuildOperationState {
  locationId: string;
  floor: number;
  maxFloors: number;
  enemyHp: number;
  enemyMaxHp: number;
  enemyName: string;
  enemyEmoji: string;
  enemyInFloor: number;
  enemiesOnFloor: number;
  startedBy: string;
  startedAt: number;
  deadline: number;
  memberCount: number;
  heroLevel: number;
  participants: Record<string, GuildOpParticipant>;
  cooldownUntil: number;
  status: 'active' | 'failed' | 'completed';
  pendingReward: null | {
    xp: number;
    gold: number;
    rarity: string;
    completedAt: number;
    claimedBy: Record<string, true>;
  };
}

export interface GuildMemberData {
  username: string;
  heroName: string;
  level: number;
  role: 'leader' | 'officer' | 'member';
  joinedAt: number;
  portrait?: number;
}

function isLeaderOrOfficer(guild: { leaderUid: string; members: Record<string, GuildMemberData> }, uid: string): boolean {
  return guild.leaderUid === uid || guild.members[uid]?.role === 'officer';
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
  treasury: number;
  expUpgrade: number;
  goldUpgrade: number;
  contributions: Record<string, number>;
  guildOperation?: GuildOperationState | null;
}

export function guildUpgradeCost(currentLevel: number): number {
  return 2000 * Math.pow(2, currentLevel);
}

export async function depositToTreasury(guildId: string, uid: string, amount: number): Promise<void> {
  if (!db) throw new Error('No DB');
  if (amount <= 0) throw new Error('Amount must be positive');
  await updateDoc(doc(db, 'guilds', guildId), {
    treasury: increment(amount),
    [`contributions.${uid}`]: increment(amount),
  });
}

export async function setMemberRole(
  guildId: string,
  callerUid: string,
  targetUid: string,
  role: 'officer' | 'member',
): Promise<void> {
  if (!db) throw new Error('No DB');
  const snap = await getDoc(doc(db, 'guilds', guildId));
  if (!snap.exists() || snap.data().leaderUid !== callerUid) throw new Error('Not leader');
  await updateDoc(doc(db, 'guilds', guildId), { [`members.${targetUid}.role`]: role });
}

export async function upgradeGuildStat(guildId: string, callerUid: string, type: 'exp' | 'gold'): Promise<void> {
  if (!db) throw new Error('No DB');
  const guild = await getGuild(guildId);
  if (!guild || !isLeaderOrOfficer(guild, callerUid)) throw new Error('Not officer');
  const currentLevel = type === 'exp' ? (guild.expUpgrade ?? 0) : (guild.goldUpgrade ?? 0);
  if (currentLevel >= 50) throw new Error('Max level');
  const cost = guildUpgradeCost(currentLevel);
  if ((guild.treasury ?? 0) < cost) throw new Error('Not enough gold');
  await updateDoc(doc(db, 'guilds', guildId), {
    treasury: increment(-cost),
    [type === 'exp' ? 'expUpgrade' : 'goldUpgrade']: increment(1),
  });
}

export async function updateGuildDescription(guildId: string, callerUid: string, description: string): Promise<void> {
  if (!db) throw new Error('No DB');
  const snap = await getDoc(doc(db, 'guilds', guildId));
  if (!snap.exists()) throw new Error('Guild not found');
  const data = snap.data() as Guild;
  if (!isLeaderOrOfficer(data, callerUid)) throw new Error('Not officer');
  await updateDoc(doc(db, 'guilds', guildId), { description });
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
    treasury: 0,
    expUpgrade: 0,
    goldUpgrade: 0,
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
  if (!snap.exists()) {
    // Guild deleted — clean up all orphaned references in the background
    cleanupDeletedGuild(guildId).catch(() => {});
    return null;
  }
  return { id: snap.id, ...snap.data() } as Guild;
}

/** Remove all traces of a guild that no longer exists in Firestore. */
async function cleanupDeletedGuild(guildId: string): Promise<void> {
  if (!db) return;
  const [orphanPlayers, orphanInvites] = await Promise.all([
    getDocs(query(collection(db, 'players'), where('guildId', '==', guildId))),
    getDocs(query(collection(db, 'guildInvites'), where('guildId', '==', guildId))),
  ]);
  await Promise.all([
    ...orphanPlayers.docs.map(d =>
      updateDoc(d.ref, { guildId: deleteField(), guildTag: deleteField() })
    ),
    ...orphanInvites.docs.map(d => deleteDoc(d.ref)),
  ]);
}

export async function getGuildMemberLevels(uids: string[]): Promise<Record<string, { level: number; heroName: string; portrait: number }>> {
  if (!db || uids.length === 0) return {};
  const result: Record<string, { level: number; heroName: string; portrait: number }> = {};
  for (let i = 0; i < uids.length; i += 30) {
    const chunk = uids.slice(i, i + 30);
    const snap = await getDocs(query(collection(db, 'players'), where(documentId(), 'in', chunk)));
    for (const d of snap.docs) {
      const data = d.data();
      result[d.id] = { level: data.level ?? 1, heroName: data.heroName ?? '', portrait: data.portrait ?? 0 };
    }
  }
  return result;
}

export async function getMyGuildId(uid: string): Promise<string | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'players', uid));
  if (!snap.exists()) return null;
  const guildId = (snap.data().guildId as string) ?? null;
  if (!guildId) return null;
  // Verify the guild still exists; if not, clean up immediately
  const guildSnap = await getDoc(doc(db, 'guilds', guildId));
  if (!guildSnap.exists()) {
    await updateDoc(snap.ref, { guildId: deleteField(), guildTag: deleteField() });
    cleanupDeletedGuild(guildId).catch(() => {});
    return null;
  }
  return guildId;
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
    body: `[GUILD INVITE] ${fromUsername} invites you to join guild [${guildTag}] ${guildName}. Open your Mail → accept or decline the invitation.\n[ZAPROSZENIE DO GILDII] ${fromUsername} zaprasza Cię do gildii [${guildTag}] ${guildName}. Otwórz Pocztę → zaakceptuj lub odrzuć zaproszenie.`,
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
  const invites = snap.docs.map(d => ({ id: d.id, ...d.data() } as GuildInvite));
  // Check which inviting guilds still exist and silently delete stale invites
  const guildChecks = await Promise.all(
    [...new Set(invites.map(i => i.guildId))].map(async gId => {
      const g = await getDoc(doc(db!, 'guilds', gId));
      return { gId, exists: g.exists() };
    })
  );
  const deadGuilds = new Set(guildChecks.filter(c => !c.exists).map(c => c.gId));
  if (deadGuilds.size > 0) {
    const stale = snap.docs.filter(d => deadGuilds.has((d.data() as GuildInvite).guildId));
    await Promise.all(stale.map(d => deleteDoc(d.ref)));
    await Promise.all([...deadGuilds].map(gId => cleanupDeletedGuild(gId).catch(() => {})));
  }
  return invites.filter(i => !deadGuilds.has(i.guildId));
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
  // Release territories owned by this guild (also clear any active siege by this guild)
  const ownedTerritories = await getDocs(query(collection(db, 'territories'), where('guildId', '==', guildId)));
  const siegingTerritories = await getDocs(query(collection(db, 'territories'), where('siegeGuildId', '==', guildId)));
  const resetTerritory = {
    guildId: null, guildName: null, guildTag: null,
    capturedAt: null, lastRewardAt: null, expiresAt: null,
    defenderMemberCount: 0, defenderAvgLevel: 0, defenderMembers: [],
    siegeGuildId: null, siegeGuildTag: null,
    siegeCurrentHp: null, siegeMaxHp: null, siegeLastHitAt: null,
    siegeStartedAt: null, siegeAttackers: [],
  };
  for (const d of ownedTerritories.docs) await setDoc(d.ref, resetTerritory);
  for (const d of siegingTerritories.docs) {
    await updateDoc(d.ref, {
      siegeGuildId: null, siegeGuildTag: null,
      siegeCurrentHp: null, siegeMaxHp: null, siegeLastHitAt: null,
      siegeStartedAt: null, siegeAttackers: [],
    });
  }
  await deleteDoc(doc(db, 'guilds', guildId));
}

// ── TERRITORIES ───────────────────────────────────────────────────────

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
const WEEK_MS = 30 * 24 * 60 * 60 * 1000; // 30 days — territory stays until recaptured

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
      // Owner guild deleted — wipe the territory completely
      Object.assign(data, EMPTY_TERRITORY, { id: d.id });
      await setDoc(d.ref, { ...EMPTY_TERRITORY });
    } else if (data.siegeGuildId && !existingGuilds.has(data.siegeGuildId)) {
      // Siege guild deleted — cancel the siege only
      data.siegeGuildId = null;
      data.siegeGuildTag = null;
      data.siegeCurrentHp = null;
      data.siegeMaxHp = null;
      data.siegeLastHitAt = null;
      data.siegeStartedAt = null;
      data.siegeAttackers = [];
      dirty = true;
    }

    if (dirty) await updateDoc(d.ref, {
      siegeGuildId: null, siegeGuildTag: null,
      siegeCurrentHp: null, siegeMaxHp: null, siegeLastHitAt: null,
      siegeStartedAt: null, siegeAttackers: [],
    });
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


export async function claimTerritoryReward(
  territoryId: string,
  guildId: string,
): Promise<{ gold: number; xp: number } | null> {
  if (!db) return null;
  const ref = doc(db, 'territories', territoryId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as TerritoryState;
  if (data.guildId !== guildId) return null;
  // Per-player cooldown is tracked client-side; server just verifies ownership
  return { gold: 0, xp: 0 };
}

// ── Mail ────────────────────────────────────────────────────────────────────

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

// ── GUILD OPERATIONS ────────────────────────────────────────────────

function nextMidnightUtc(): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
}


export async function startGuildOperation(
  guildId: string,
  uid: string,
  heroLevel: number,
  memberCount: number,
  locationId?: string,
): Promise<boolean> {
  if (!db) return false;
  const _db = db;

  return runTransaction(_db, async (txn) => {
    const ref = doc(_db, 'guilds', guildId);
    const snap = await txn.get(ref);
    if (!snap.exists()) return false;
    const data = snap.data() as Guild;
    if (!isLeaderOrOfficer(data, uid)) return false;

    const now = Date.now();
    const existing = data.guildOperation as GuildOperationState | null | undefined;
    const isActiveAndValid = existing?.status === 'active' && (existing.deadline ?? 0) > now;
    const isInCooldown = existing?.status === 'completed' && (existing.cooldownUntil ?? 0) > now;
    if (isActiveAndValid || isInCooldown) return false;

    const location = locationId
      ? (GUILD_OP_LOCATIONS.find(l => l.id === locationId) ?? pickLocationForLevel(heroLevel))
      : pickLocationForLevel(heroLevel);
    const first = getFloorEnemy(location, 1, memberCount);
    const op: GuildOperationState = {
      locationId: location.id,
      floor: 1,
      maxFloors: location.floors,
      enemyHp: first.hp,
      enemyMaxHp: first.maxHp,
      enemyName: first.name,
      enemyEmoji: first.emoji,
      enemyInFloor: 0,
      enemiesOnFloor: first.count,
      startedBy: uid,
      startedAt: now,
      deadline: nextMidnightUtc(),
      memberCount,
      heroLevel,
      participants: {},
      cooldownUntil: 0,
      status: 'active',
      pendingReward: null,
    };
    txn.update(ref, { guildOperation: op });
    return true;
  });
}

export type AttackGuildResult = 'attacked' | 'enemy_killed' | 'advanced' | 'completed' | 'no_op' | 'failed' | 'hp_depleted' | 'knocked_out';

export async function attackGuildEnemy(
  guildId: string,
  uid: string,
  heroDamage: number,
  heroMaxHp: number,
  info: { username: string; heroName: string },
): Promise<{ status: AttackGuildResult; damage: number }> {
  if (!db) return { status: 'no_op', damage: 0 };
  const _db = db;

  // Cap client-supplied damage to a sane maximum to limit cheating impact
  const MAX_HERO_DAMAGE = (heroDamage > 0 ? Math.min(heroDamage, 500_000) : 0);

  const status = await runTransaction(_db, async (txn) => {
    const ref = doc(_db, 'guilds', guildId);
    const snap = await txn.get(ref);
    if (!snap.exists()) return 'no_op';
    const op = snap.data().guildOperation as GuildOperationState | null | undefined;
    if (!op || op.status !== 'active' || op.pendingReward !== null) return 'no_op';
    if (op.enemyHp <= 0) return 'no_op';

    const now = Date.now();
    if ((op.deadline ?? 0) <= now) {
      txn.update(ref, { 'guildOperation.status': 'failed' });
      return 'failed';
    }

    const existing = (op.participants ?? {})[uid] as GuildOpParticipant | undefined;
    // Player was knocked out in this raid — block further attacks server-side.
    if (existing?.knockedOut === true) return 'knocked_out';
    const playerMaxHp = existing?.maxHp ?? Math.max(1, Math.min(heroMaxHp, 500_000));
    const alreadyDealt = existing?.damage ?? 0;

    const cappedDamage = MAX_HERO_DAMAGE;
    const newHp = Math.max(0, op.enemyHp - cappedDamage);
    const updates: Record<string, unknown> = {
      'guildOperation.enemyHp': newHp,
      [`guildOperation.participants.${uid}`]: {
        username: info.username,
        heroName: info.heroName,
        damage: alreadyDealt + cappedDamage,
        attackedAt: now,
        maxHp: playerMaxHp,
      },
    };

    if (newHp <= 0) {
      const loc = GUILD_OP_LOCATIONS.find(l => l.id === op.locationId)!;
      const enemyInFloor  = op.enemyInFloor  ?? 0;
      const enemiesOnFloor = op.enemiesOnFloor ?? 1;

      if (enemyInFloor < enemiesOnFloor - 1) {
        const same = getFloorEnemy(loc, op.floor, op.memberCount);
        updates['guildOperation.enemyInFloor'] = enemyInFloor + 1;
        updates['guildOperation.enemyHp']      = same.hp;
        txn.update(ref, updates);
        return { status: 'enemy_killed' as AttackGuildResult, damage: cappedDamage };
      } else if (op.floor >= op.maxFloors) {
        const lvlMult = 1 + ((op.heroLevel ?? 1) - 1) * 0.04;
        const xp   = Math.floor(loc.baseXpPerFloor   * op.maxFloors * (1 + op.memberCount * 0.12) * lvlMult);
        const gold = Math.floor(loc.baseGoldPerFloor  * op.maxFloors * (1 + op.memberCount * 0.08) * lvlMult);
        updates['guildOperation.pendingReward'] = {
          xp, gold, rarity: loc.finalRarity, completedAt: now, claimedBy: {},
        };
        updates['guildOperation.cooldownUntil'] = now + loc.cooldownMs;
        updates['guildOperation.enemyHp']       = 0;
        updates['guildOperation.status']        = 'completed';
        txn.update(ref, updates);
        return { status: 'completed' as AttackGuildResult, damage: cappedDamage };
      } else {
        const next = getFloorEnemy(loc, op.floor + 1, op.memberCount);
        updates['guildOperation.floor']          = op.floor + 1;
        updates['guildOperation.enemyHp']        = next.hp;
        updates['guildOperation.enemyMaxHp']     = next.maxHp;
        updates['guildOperation.enemyName']      = next.name;
        updates['guildOperation.enemyEmoji']     = next.emoji;
        updates['guildOperation.enemyInFloor']   = 0;
        updates['guildOperation.enemiesOnFloor'] = next.count;
        txn.update(ref, updates);
        return { status: 'advanced' as AttackGuildResult, damage: cappedDamage };
      }
    }
    txn.update(ref, updates);
    return { status: 'attacked' as AttackGuildResult, damage: cappedDamage };
  });

  return status as { status: AttackGuildResult; damage: number };
}

export async function claimGuildOperationReward(
  guildId: string,
  uid: string,
): Promise<{ xp: number; gold: number; rarity: string } | null> {
  if (!db) return null;
  const _db = db;

  return runTransaction(_db, async (txn) => {
    const ref = doc(_db, 'guilds', guildId);
    const snap = await txn.get(ref);
    if (!snap.exists()) return null;
    const op = snap.data().guildOperation as GuildOperationState | null | undefined;
    if (!op?.pendingReward) return null;
    if (op.pendingReward.claimedBy[uid]) return null;
    const { xp, gold, rarity } = op.pendingReward;
    txn.update(ref, {
      [`guildOperation.pendingReward.claimedBy.${uid}`]: true,
    });
    return { xp, gold, rarity };
  });
}

/** Permanently mark a participant as knocked out for the current raid. */
export async function setKnockedOut(guildId: string, uid: string): Promise<void> {
  if (!db) return;
  try {
    await updateDoc(doc(db, 'guilds', guildId), {
      [`guildOperation.participants.${uid}.knockedOut`]: true,
    });
  } catch { /* non-critical — server-side transaction already blocks further attacks */ }
}
