// Security-rules tests for firestore.rules, run against the Firestore emulator.
//
//   npm run test:rules            (starts the emulator via firebase-tools)
//
// or, with an emulator already running:
//
//   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npx vitest run --config vitest.rules.config.ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  initializeTestEnvironment, assertFails, assertSucceeds, type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  doc, setDoc, updateDoc, deleteDoc, getDoc, addDoc, collection, deleteField, increment,
  serverTimestamp, writeBatch, type Firestore,
} from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

const [host, port] = (process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080').split(':');

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-glitchsoul-rules',
    firestore: {
      rules: readFileSync(resolve(__dirname, '../../firestore.rules'), 'utf8'),
      host,
      port: Number(port),
    },
  });
});

afterAll(async () => { await env?.cleanup(); });
beforeEach(async () => { await env.clearFirestore(); });

const as = (uid: string): Firestore => env.authenticatedContext(uid).firestore() as unknown as Firestore;

async function seed(fn: (db: Firestore) => Promise<void>) {
  await env.withSecurityRulesDisabled(async ctx => { await fn(ctx.firestore() as unknown as Firestore); });
}

const DAY = 86_400_000;
const startOfUtcDay = (ms: number) => Math.floor(ms / DAY) * DAY;

// ── Saves ──────────────────────────────────────────────────────────────────

function hero(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Neo', level: 10, xp: 0, hp: 100, maxHp: 100, gold: 1000, gems: 10,
    restingUntil: null, voluntaryRestUntil: null, voluntaryRestHp: null, voluntaryRestStartAt: null,
    beggingUntil: null, beggingReward: null, beggingStartAt: null,
    dungeonRunsToday: 3, questsCompletedToday: 1, kryptaRunsToday: 1, goldEarnedToday: 500,
    lastDailyReset: Date.now() - 3_600_000,
    ...overrides,
  };
}

function save(heroOverrides: Record<string, unknown> = {}, top: Record<string, unknown> = {}) {
  return {
    hero: hero(heroOverrides),
    activeQuest: null, pvpWins: 2, pvpLosses: 1, pvpRating: 1010,
    challengeUnlocked: 1, lastChallengeAt: 0,
    updatedAt: serverTimestamp(),
    ...top,
  };
}

describe('saves', () => {
  it('a fresh hero without streakDays can keep saving (first-day regression)', async () => {
    const reset = Date.now();
    const fresh = { ...save({ level: 1, gold: 100, gems: 0, goldEarnedToday: 0, lastDailyReset: reset }) };
    const db = as('newbie');
    await assertSucceeds(setDoc(doc(db, 'saves', 'newbie'), fresh));
    await assertSucceeds(setDoc(doc(db, 'saves', 'newbie'),
      save({ level: 2, gold: 150, gems: 3, goldEarnedToday: 50, lastDailyReset: reset })));
  });

  it('very old saves missing optional fields can still be updated', async () => {
    const reset = Date.now() - 1000;
    await seed(db => setDoc(doc(db, 'saves', 'old'), {
      hero: { name: 'Old', level: 5, gold: 10, gems: 0, lastDailyReset: reset },
      pvpWins: 0, pvpLosses: 0, pvpRating: 1000, challengeUnlocked: 0,
    }));
    await assertSucceeds(setDoc(doc(as('old'), 'saves', 'old'),
      save({ level: 5, gold: 10, gems: 0, goldEarnedToday: 0, lastDailyReset: reset, dungeonRunsToday: 0, questsCompletedToday: 0, kryptaRunsToday: 0 },
        { pvpWins: 0, pvpLosses: 0, pvpRating: 1000, challengeUnlocked: 0 })));
  });

  it('accepts a client daily reset once the UTC day has rolled over (<23h later)', async () => {
    const now = Date.now();
    const yesterdayLate = startOfUtcDay(now) - 3_600_000; // 23:00 UTC yesterday
    await seed(db => setDoc(doc(db, 'saves', 'u'), save({ lastDailyReset: yesterdayLate, streakDays: 4 })));
    await assertSucceeds(setDoc(doc(as('u'), 'saves', 'u'), save({
      lastDailyReset: Date.now(), streakDays: 5, gems: 15,
      dungeonRunsToday: 0, questsCompletedToday: 0, kryptaRunsToday: 0, goldEarnedToday: 0,
    })));
  });

  it('rejects a second client daily reset within the same UTC day', async () => {
    const now = Date.now();
    const earlierToday = Math.max(startOfUtcDay(now), now - 3_600_000);
    await seed(db => setDoc(doc(db, 'saves', 'u'), save({ lastDailyReset: earlierToday, streakDays: 4 })));
    await assertFails(setDoc(doc(as('u'), 'saves', 'u'), save({
      lastDailyReset: Date.now(), streakDays: 5,
      dungeonRunsToday: 0, questsCompletedToday: 0, kryptaRunsToday: 0, goldEarnedToday: 0,
    })));
  });

  it('allows the gems of 10 level-ups in one save, but not a large jump', async () => {
    const reset = Date.now() - 1000;
    await seed(db => setDoc(doc(db, 'saves', 'u'), save({ lastDailyReset: reset, gems: 10 })));
    await assertSucceeds(setDoc(doc(as('u'), 'saves', 'u'), save({ lastDailyReset: reset, gems: 40, level: 20 })));
    await assertFails(setDoc(doc(as('u'), 'saves', 'u'), save({ lastDailyReset: reset, gems: 500, level: 20 })));
  });

  it('still blocks inflating gold past what was earned', async () => {
    const reset = Date.now() - 1000;
    await seed(db => setDoc(doc(db, 'saves', 'u'), save({ lastDailyReset: reset })));
    await assertFails(setDoc(doc(as('u'), 'saves', 'u'), save({ lastDailyReset: reset, gold: 999_999 })));
    await assertSucceeds(setDoc(doc(as('u'), 'saves', 'u'), save({ lastDailyReset: reset, gold: 1500, goldEarnedToday: 1000 })));
  });

  it('an overnight begging reward is accepted when counted as earned today', async () => {
    const now = Date.now();
    const reset = now - 3_600_000; // the server reset ran an hour ago, in an earlier write
    const begging = { beggingStartAt: now - 8 * 3_600_000, beggingUntil: now - 60_000, beggingReward: 500 };
    await seed(db => setDoc(doc(db, 'saves', 'u'), save({ lastDailyReset: reset, gold: 1000, goldEarnedToday: 0, ...begging })));
    const collected = { lastDailyReset: reset, beggingStartAt: null, beggingUntil: null, beggingReward: null };
    // The old client added the gold without counting it — rejected, so the reward was lost.
    await assertFails(setDoc(doc(as('u'), 'saves', 'u'), save({ ...collected, gold: 1500, goldEarnedToday: 0 })));
    await assertSucceeds(setDoc(doc(as('u'), 'saves', 'u'), save({ ...collected, gold: 1500, goldEarnedToday: 500 })));
  });

  it('a running quest can be abandoned, but not collected early', async () => {
    const now = Date.now();
    const reset = now - 1000;
    const quest = { quest: { id: 'q1', xpReward: 100, goldReward: 50 }, startedAt: now - 60_000, endsAt: now + 600_000 };
    await seed(db => setDoc(doc(db, 'saves', 'u'), save({ lastDailyReset: reset }, { activeQuest: quest })));
    const db = as('u');
    // Collecting early: reward and quest count in the same write — rejected.
    await assertFails(setDoc(doc(db, 'saves', 'u'), save({ lastDailyReset: reset, xp: 100, gold: 1050, goldEarnedToday: 550, questsCompletedToday: 2 }, { activeQuest: null })));
    // Abandoning: cleared with nothing gained — accepted.
    await assertSucceeds(setDoc(doc(db, 'saves', 'u'), save({ lastDailyReset: reset }, { activeQuest: null })));
  });

  it('only the owner can write their save', async () => {
    await assertFails(setDoc(doc(as('mallory'), 'saves', 'victim'), save()));
  });
});

// ── Guilds ─────────────────────────────────────────────────────────────────

const member = (role: string, extra: Record<string, unknown> = {}) =>
  ({ username: role, heroName: role.toUpperCase(), level: 5, role, joinedAt: 1, portrait: 0, ...extra });

async function seedGuild(extra: Record<string, unknown> = {}) {
  await seed(async db => {
    await setDoc(doc(db, 'guilds', 'g1'), {
      name: 'Glitch', tag: 'GL', description: '', leaderUid: 'leader', createdAt: 1,
      guildXp: 0, treasury: 10_000, expUpgrade: 1, goldUpgrade: 0, contributions: { member: 100 },
      members: { leader: member('leader'), officer: member('officer'), member: member('member') },
      ...extra,
    });
  });
}

describe('guild membership', () => {
  beforeEach(() => seedGuild());

  it('an outsider cannot overwrite the members map', async () => {
    await assertFails(updateDoc(doc(as('evil'), 'guilds', 'g1'), { members: { evil: member('member') } }));
  });

  it('an outsider cannot join without an invite', async () => {
    await assertFails(updateDoc(doc(as('newbie'), 'guilds', 'g1'), { 'members.newbie': member('member') }));
  });

  it('an invited player can join as a plain member, and only as that', async () => {
    await seed(db => setDoc(doc(db, 'guildInvites', 'g1_newbie'), { guildId: 'g1', fromUid: 'leader', toUid: 'newbie' }));
    const db = as('newbie');
    await assertFails(updateDoc(doc(db, 'guilds', 'g1'), { 'members.newbie': member('officer') }));
    await assertSucceeds(updateDoc(doc(db, 'guilds', 'g1'), { 'members.newbie': member('member') }));
  });

  it('a regular member can leave', async () => {
    await assertSucceeds(updateDoc(doc(as('member'), 'guilds', 'g1'), { 'members.member': deleteField() }));
  });

  it('a regular member can refresh their own level, but not their role', async () => {
    const db = as('member');
    await assertSucceeds(updateDoc(doc(db, 'guilds', 'g1'), { 'members.member.level': 9, 'members.member.heroName': 'M2' }));
    await assertFails(updateDoc(doc(db, 'guilds', 'g1'), { 'members.member.role': 'officer' }));
  });

  it('a regular member cannot kick someone else', async () => {
    await assertFails(updateDoc(doc(as('member'), 'guilds', 'g1'), { 'members.officer': deleteField() }));
  });

  it('an officer can kick a member but not the leader, and cannot take leadership', async () => {
    const db = as('officer');
    await assertFails(updateDoc(doc(db, 'guilds', 'g1'), { 'members.leader': deleteField() }));
    await assertFails(updateDoc(doc(db, 'guilds', 'g1'), { leaderUid: 'officer' }));
    await assertSucceeds(updateDoc(doc(db, 'guilds', 'g1'), { 'members.member': deleteField() }));
  });

  it('the leader can transfer leadership only to a member', async () => {
    const db = as('leader');
    await assertFails(updateDoc(doc(db, 'guilds', 'g1'), { leaderUid: 'stranger' }));
    await assertSucceeds(updateDoc(doc(db, 'guilds', 'g1'), {
      leaderUid: 'officer', 'members.officer.role': 'leader', 'members.leader.role': 'member',
    }));
  });

  it('the leader can disband (delete) the guild; others cannot', async () => {
    await assertFails(deleteDoc(doc(as('officer'), 'guilds', 'g1')));
    await assertSucceeds(deleteDoc(doc(as('leader'), 'guilds', 'g1')));
  });

  it('a new guild must start empty with the creator as its only member', async () => {
    const base = {
      name: 'New', tag: 'NW', description: '', leaderUid: 'founder', createdAt: 1,
      guildXp: 0, treasury: 0, expUpgrade: 0, goldUpgrade: 0,
      members: { founder: member('leader') },
    };
    const db = as('founder');
    await assertFails(setDoc(doc(db, 'guilds', 'g2'), { ...base, treasury: 1_000_000 }));
    await assertFails(setDoc(doc(db, 'guilds', 'g3'), { ...base, expUpgrade: 50 }));
    await assertFails(setDoc(doc(db, 'guilds', 'g4'), { ...base, members: { founder: member('leader'), alt: member('officer') } }));
    await assertSucceeds(setDoc(doc(db, 'guilds', 'g5'), base));
  });
});

describe('guild economy', () => {
  beforeEach(() => seedGuild());

  it('a deposit must raise the depositor’s own contribution by the same amount', async () => {
    const db = as('member');
    await assertSucceeds(updateDoc(doc(db, 'guilds', 'g1'), { treasury: increment(500), 'contributions.member': increment(500) }));
    await assertFails(updateDoc(doc(db, 'guilds', 'g1'), { treasury: increment(500), 'contributions.member': increment(5000) }));
    await assertFails(updateDoc(doc(db, 'guilds', 'g1'), { treasury: increment(500), 'contributions.officer': increment(500) }));
  });

  it('the leader cannot mint treasury gold', async () => {
    await assertFails(updateDoc(doc(as('leader'), 'guilds', 'g1'), { treasury: 99_999_999 }));
  });

  it('upgrades go up one level at a time and must be paid for', async () => {
    const db = as('officer');
    // expUpgrade 1 → 2 costs 2000 × 2^1 = 4000
    await assertFails(updateDoc(doc(db, 'guilds', 'g1'), { expUpgrade: 2 }));
    await assertFails(updateDoc(doc(db, 'guilds', 'g1'), { expUpgrade: 3, treasury: increment(-4000) }));
    await assertSucceeds(updateDoc(doc(db, 'guilds', 'g1'), { expUpgrade: increment(1), treasury: increment(-4000) }));
  });

  it('a pending operation reward cannot be re-claimed by clearing claimedBy', async () => {
    await seedGuild({
      guildOperation: {
        status: 'completed', enemyHp: 0,
        pendingReward: { xp: 100, gold: 100, rarity: 'rare', completedAt: 1, claimedBy: { member: true } },
      },
    });
    const db = as('member');
    await assertFails(updateDoc(doc(db, 'guilds', 'g1'), { 'guildOperation.pendingReward.claimedBy': {} }));
    await assertFails(updateDoc(doc(db, 'guilds', 'g1'), { 'guildOperation.pendingReward.gold': 1_000_000 }));
    await assertSucceeds(updateDoc(doc(as('officer'), 'guilds', 'g1'), { 'guildOperation.pendingReward.claimedBy.officer': true }));
  });
});

describe('guild invites', () => {
  beforeEach(() => seedGuild());
  const invite = (fromUid: string, toUid = 'newbie') =>
    ({ guildId: 'g1', guildName: 'Glitch', guildTag: 'GL', fromUid, fromUsername: fromUid, toUid, toUsername: toUid, createdAt: 1 });

  it('leaders and officers can invite under the fixed id', async () => {
    await assertSucceeds(setDoc(doc(as('leader'), 'guildInvites', 'g1_newbie'), invite('leader')));
    await assertSucceeds(setDoc(doc(as('officer'), 'guildInvites', 'g1_other'), invite('officer', 'other')));
  });

  it('regular members and outsiders cannot invite', async () => {
    await assertFails(setDoc(doc(as('member'), 'guildInvites', 'g1_newbie'), invite('member')));
    await assertFails(setDoc(doc(as('newbie'), 'guildInvites', 'g1_newbie'), invite('newbie')));
  });

  it('an invite under a random id is rejected', async () => {
    await assertFails(setDoc(doc(as('leader'), 'guildInvites', 'random123'), invite('leader')));
  });

  it('a missing invite can be looked up; someone else’s invite cannot be read', async () => {
    await assertSucceeds(getDoc(doc(as('leader'), 'guildInvites', 'g1_nobody')));
    await seed(db => setDoc(doc(db, 'guildInvites', 'g1_newbie'), invite('officer')));
    await assertFails(getDoc(doc(as('member'), 'guildInvites', 'g1_newbie')));
    await assertSucceeds(getDoc(doc(as('newbie'), 'guildInvites', 'g1_newbie')));
  });
});

// ── Chat, mail, casino ─────────────────────────────────────────────────────

describe('chat and mail', () => {
  beforeEach(async () => {
    await seedGuild();
    await seed(async db => {
      await setDoc(doc(db, 'users', 'member'), { username: 'Member' });
      await setDoc(doc(db, 'users', 'leader'), { username: 'Boss' });
    });
  });
  const msg = (overrides: Record<string, unknown> = {}) =>
    ({ uid: 'member', username: 'Member', portrait: 0, text: 'hi', createdAt: Date.now(), ...overrides });

  it('global chat accepts a normal message from the sender’s own name', async () => {
    await assertSucceeds(addDoc(collection(as('member'), 'globalChat'), msg()));
  });

  it('global chat rejects impersonation, empty/oversized text and future timestamps', async () => {
    const db = as('member');
    await assertFails(addDoc(collection(db, 'globalChat'), msg({ username: 'Boss' })));
    await assertFails(addDoc(collection(db, 'globalChat'), msg({ uid: 'leader' })));
    await assertFails(addDoc(collection(db, 'globalChat'), msg({ text: '' })));
    await assertFails(addDoc(collection(db, 'globalChat'), msg({ text: 'x'.repeat(201) })));
    await assertFails(addDoc(collection(db, 'globalChat'), msg({ createdAt: Date.now() + 10 * DAY })));
  });

  it('guild chat is for members only', async () => {
    await assertSucceeds(addDoc(collection(as('member'), 'guilds', 'g1', 'messages'), msg()));
    await seed(db => setDoc(doc(db, 'users', 'outsider'), { username: 'Out' }));
    await assertFails(addDoc(collection(as('outsider'), 'guilds', 'g1', 'messages'), msg({ uid: 'outsider', username: 'Out' })));
  });

  it('mail must carry the sender’s own name', async () => {
    const mail = { fromUid: 'member', fromUsername: 'Member', toUid: 'leader', toUsername: 'Boss', body: 'yo', createdAt: 1, read: false };
    await assertSucceeds(addDoc(collection(as('member'), 'mail'), mail));
    await assertFails(addDoc(collection(as('member'), 'mail'), { ...mail, fromUsername: 'Boss' }));
  });

  it('clients cannot post to the casino feed', async () => {
    await assertFails(addDoc(collection(as('member'), 'casinoSpins'),
      { uid: 'member', username: 'Member', result: 7, won: true, net: 10_000_000, stake: 1, ts: Date.now() }));
  });
});

// ── Identity: registered username, public profile ─────────────────────────

describe('users and public profiles', () => {
  it('registration must claim the username in the same transaction', async () => {
    const db = as('newbie');
    await assertFails(setDoc(doc(db, 'users', 'newbie'), { username: 'Newbie', email: 'n@x.y', createdAt: 1 }));
    const batch = writeBatch(db);
    batch.set(doc(db, 'usernames', 'newbie'), { uid: 'newbie', createdAt: 1 });
    batch.set(doc(db, 'users', 'newbie'), { username: 'Newbie', email: 'n@x.y', createdAt: 1 });
    await assertSucceeds(batch.commit());
  });

  it('the registered username cannot be changed afterwards', async () => {
    await seed(db => setDoc(doc(db, 'users', 'u'), { username: 'Real', email: 'r@x.y', createdAt: 1 }));
    const db = as('u');
    await assertFails(updateDoc(doc(db, 'users', 'u'), { username: 'Admin' }));
    await assertSucceeds(updateDoc(doc(db, 'users', 'u'), { email: 'new@x.y' }));
  });

  it('the public profile cannot claim a higher level or rating than the save', async () => {
    await seed(async db => {
      await setDoc(doc(db, 'users', 'u'), { username: 'Real' });
      await setDoc(doc(db, 'saves', 'u'), save({ level: 30 }, { pvpRating: 1100, pvpWins: 5 }));
      await setDoc(doc(db, 'players', 'u'), { username: 'Real', level: 30, pvpRating: 1100, pvpWins: 5 });
    });
    const db = as('u');
    await assertFails(setDoc(doc(db, 'players', 'u'), { level: 45 }, { merge: true }));
    await assertFails(setDoc(doc(db, 'players', 'u'), { pvpRating: 3000 }, { merge: true }));
    await assertSucceeds(setDoc(doc(db, 'players', 'u'), { level: 30, heroName: 'Neo', gold: 5 }, { merge: true }));
  });

  it('the public profile name must be the registered username', async () => {
    await seed(async db => {
      await setDoc(doc(db, 'users', 'u'), { username: 'Real' });
      await setDoc(doc(db, 'saves', 'u'), save({ level: 30 }));
      await setDoc(doc(db, 'players', 'u'), { username: 'Real', level: 30 });
    });
    await assertFails(setDoc(doc(as('u'), 'players', 'u'), { username: 'Admin' }, { merge: true }));
  });

  it('a profile with only guild fields can be created before the first sync', async () => {
    await seed(db => setDoc(doc(db, 'users', 'u'), { username: 'Real' }));
    await assertSucceeds(setDoc(doc(as('u'), 'players', 'u'), { guildId: 'g1', guildTag: 'GL' }, { merge: true }));
  });

  it('lobby presence must use the registered name; moving keeps it cheap', async () => {
    await seed(db => setDoc(doc(db, 'users', 'u'), { username: 'Real' }));
    const db = as('u');
    await assertFails(setDoc(doc(db, 'lobbyPlayers', 'u'), { x: 1, y: 1, portrait: 0, username: 'Admin', updatedAt: 1 }));
    await assertSucceeds(setDoc(doc(db, 'lobbyPlayers', 'u'), { x: 1, y: 1, portrait: 0, username: 'Real', updatedAt: 1 }));
    await assertSucceeds(setDoc(doc(db, 'lobbyPlayers', 'u'), { x: 5, y: 2, updatedAt: 2 }, { merge: true }));
    await assertSucceeds(deleteDoc(doc(db, 'lobbyPlayers', 'u')));
  });
});

// ── Moderation: reports, mutes, block list ────────────────────────────────

describe('moderation', () => {
  const report = (o: Record<string, unknown> = {}) => ({
    reporterUid: 'u', reporterName: 'Neo', targetUid: 'troll', targetName: 'Troll',
    kind: 'globalChat', reason: 'abuse', text: 'bad words', messageId: 'm1', guildId: null,
    status: 'open', createdAt: Date.now(), ...o,
  });

  it('a player can report someone else, but not read reports', async () => {
    const db = as('u');
    await assertSucceeds(addDoc(collection(db, 'reports'), report()));
    await assertFails(addDoc(collection(db, 'reports'), report({ targetUid: 'u' })));
    await assertFails(addDoc(collection(db, 'reports'), report({ reporterUid: 'someone' })));
    await assertFails(addDoc(collection(db, 'reports'), report({ reason: 'whatever' })));
    await assertFails(addDoc(collection(db, 'reports'), report({ text: 'x'.repeat(501) })));
    await seed(db2 => setDoc(doc(db2, 'reports', 'r1'), report()));
    await assertFails(getDoc(doc(db, 'reports', 'r1')));
  });

  it('the admin can read reports, mute players and remove chat messages', async () => {
    const admin = env.authenticatedContext('admin', { email: 'thekosiner@gmail.com' }).firestore() as unknown as Firestore;
    await seed(async db => {
      await setDoc(doc(db, 'reports', 'r1'), report());
      await setDoc(doc(db, 'globalChat', 'm1'), { uid: 'troll', username: 'Troll', text: 'bad', createdAt: 1 });
    });
    await assertSucceeds(getDoc(doc(admin, 'reports', 'r1')));
    await assertSucceeds(deleteDoc(doc(admin, 'globalChat', 'm1')));
    await assertSucceeds(setDoc(doc(admin, 'chatBans', 'troll'), { bannedAt: 1 }));
    await assertFails(setDoc(doc(as('troll'), 'chatBans', 'troll'), { bannedAt: 1 }));
    await assertFails(deleteDoc(doc(as('troll'), 'chatBans', 'troll')));
  });

  it('a muted player cannot post to chat or send mail', async () => {
    await seed(async db => {
      await setDoc(doc(db, 'users', 'troll'), { username: 'Troll' });
      await setDoc(doc(db, 'chatBans', 'troll'), { bannedAt: 1 });
    });
    const db = as('troll');
    await assertFails(addDoc(collection(db, 'globalChat'), { uid: 'troll', username: 'Troll', text: 'hi', createdAt: Date.now() }));
    await assertFails(addDoc(collection(db, 'mail'), { fromUid: 'troll', fromUsername: 'Troll', toUid: 'u', toUsername: 'U', body: 'hi', createdAt: 1, read: false }));
  });

  it('the block list lives in the private profile, up to 200 players', async () => {
    await seed(db => setDoc(doc(db, 'users', 'u'), { username: 'Neo' }));
    const db = as('u');
    await assertSucceeds(updateDoc(doc(db, 'users', 'u'), { 'blocked.troll': 'Troll' }));
    const tooMany = Object.fromEntries(Array.from({ length: 201 }, (_, i) => [`p${i}`, 'x']));
    await assertFails(updateDoc(doc(db, 'users', 'u'), { blocked: tooMany }));
    await assertFails(getDoc(doc(as('troll'), 'users', 'u')));
  });
});
