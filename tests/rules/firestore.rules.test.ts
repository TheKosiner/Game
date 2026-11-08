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
  serverTimestamp, type Firestore,
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
