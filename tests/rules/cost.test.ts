// Guards the 1000-expression limit Firestore applies to every request: a write
// whose rules evaluate more than that is denied, whatever the rules say.
//
// The emulator enforces the limit but doesn't report the count, so headroom is
// measured: a chain of padding expressions is spliced into validSaveUpdate and a
// binary search finds how much padding the heaviest save writes still tolerate.
// The padding's unit cost is calibrated against a rule that is padding only.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, serverTimestamp, type Firestore } from 'firebase/firestore';
import { afterAll, describe, expect, it } from 'vitest';

const [host, port] = (process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080').split(':');
const RULES = readFileSync(resolve(__dirname, '../../firestore.rules'), 'utf8');
const LIMIT = 1000;
// Required spare capacity: a quarter of the limit, so later rule changes can't
// creep up to it unnoticed.
const MIN_HEADROOM = 250;

const PAD_HELPERS = `
    function pad10() { return 1 == 1 && 1 == 1 && 1 == 1 && 1 == 1 && 1 == 1 && 1 == 1 && 1 == 1 && 1 == 1 && 1 == 1 && 1 == 1; }
`;
const padChain = (n: number) => (n <= 0 ? 'true' : Array.from({ length: n }, () => 'pad10()').join(' && '));

function rulesWithPadding(n: number): string {
  const anchor = 'match /databases/{database}/documents {';
  let r = RULES.replace(anchor, `${anchor}\n${PAD_HELPERS}\n    match /costCalibration/{id} { allow write: if ${padChain(n)}; }\n`);
  // Pad the save validation itself (evaluated once per save write).
  r = r.replace('function validSaveUpdate(old, nw) {\n', `function validSaveUpdate(old, nw) {\n      let costPad = ${padChain(n)};\n`)
       .replace('        nh.level <= oh.level + 10\n', '        costPad && nh.level <= oh.level + 10\n');
  return r;
}

let seq = 0;
const envs: RulesTestEnvironment[] = [];
afterAll(async () => { await Promise.all(envs.map(e => e.cleanup())); });

async function allowedWith(
  n: number,
  seed: (db: Firestore) => Promise<void>,
  write: (db: Firestore) => Promise<unknown>,
): Promise<boolean> {
  const env = await initializeTestEnvironment({
    projectId: `demo-cost-${Date.now()}-${seq++}`,
    firestore: { rules: rulesWithPadding(n), host, port: Number(port) },
  });
  envs.push(env);
  await env.withSecurityRulesDisabled(ctx => seed(ctx.firestore() as unknown as Firestore));
  try {
    await write(env.authenticatedContext('u').firestore() as unknown as Firestore);
    return true;
  } catch {
    return false;
  }
}

/** Largest padding (in pad10 units) the write still passes with. */
async function maxPadding(seed: (db: Firestore) => Promise<void>, write: (db: Firestore) => Promise<unknown>): Promise<number> {
  if (!(await allowedWith(0, seed, write))) throw new Error('write is denied even without padding');
  let lo = 0, hi = 128;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (await allowedWith(mid, seed, write)) lo = mid; else hi = mid - 1;
  }
  return lo;
}

const DAY = 86_400_000;
const hero = (reset: number, o: Record<string, unknown> = {}) => ({
  name: 'Neo', level: 40, xp: 10, hp: 100, maxHp: 100, gold: 10_000, gems: 10,
  restingUntil: null, voluntaryRestUntil: null, voluntaryRestHp: null, voluntaryRestStartAt: null,
  beggingUntil: null, beggingReward: null, beggingStartAt: null,
  dungeonRunsToday: 3, questsCompletedToday: 1, kryptaRunsToday: 1, goldEarnedToday: 500,
  streakDays: 4, lastDailyReset: reset, ...o,
});
const top = { pvpWins: 2, pvpLosses: 1, pvpRating: 1010, challengeUnlocked: 1, lastChallengeAt: 0 };

describe('save rules stay well under the 1000-expression limit', () => {
  let unit = 0; // limit units per pad10()

  it('calibrates the padding', async () => {
    const n = await maxPadding(async () => {}, db => setDoc(doc(db, 'costCalibration', 'x'), { a: 1 }));
    unit = LIMIT / (n + 1);
    expect(n).toBeGreaterThan(10);
  });

  const scenarios: [string, () => { seed: (db: Firestore) => Promise<void>; write: (db: Firestore) => Promise<unknown> }][] = [
    ['a daily-reset save that also collects an overnight scrap run and a quest', () => {
      const t = Date.now();
      const yesterday = Math.floor(t / DAY) * DAY - 3_600_000;
      return {
        seed: db => setDoc(doc(db, 'saves', 'u'), {
          hero: hero(yesterday, { beggingStartAt: t - 9 * 3_600_000, beggingUntil: t - 60_000, beggingReward: 900 }),
          activeQuest: { quest: { goldReward: 50, xpReward: 10 }, startedAt: yesterday + 1000, endsAt: t - 1000 },
          ...top, updatedAt: 1,
        }),
        write: db => setDoc(doc(db, 'saves', 'u'), {
          hero: hero(Date.now(), { streakDays: 5, gems: 15, gold: 10_950, goldEarnedToday: 0, dungeonRunsToday: 0, questsCompletedToday: 0, kryptaRunsToday: 0 }),
          activeQuest: null, ...top, updatedAt: serverTimestamp(),
        }),
      };
    }],
    ['abandoning a quest', () => {
      const t = Date.now();
      const reset = t - 1000;
      return {
        seed: db => setDoc(doc(db, 'saves', 'u'), { hero: hero(reset), activeQuest: { quest: { goldReward: 50 }, startedAt: t - 1000, endsAt: t + 600_000 }, ...top, updatedAt: 1 }),
        write: db => setDoc(doc(db, 'saves', 'u'), { hero: hero(reset), activeQuest: null, ...top, updatedAt: serverTimestamp() }),
      };
    }],
    ['an ordinary periodic sync during a rest and a scrap run', () => {
      const t = Date.now();
      const reset = t - 1000;
      const busy = { voluntaryRestUntil: t + 600_000, voluntaryRestHp: 50, voluntaryRestStartAt: t - 1000, beggingUntil: t + 3_600_000, beggingReward: 100, beggingStartAt: t - 1000 };
      return {
        seed: db => setDoc(doc(db, 'saves', 'u'), { hero: hero(reset, busy), activeQuest: null, ...top, updatedAt: 1 }),
        write: db => setDoc(doc(db, 'saves', 'u'), { hero: hero(reset, { ...busy, xp: 50, gold: 10_100, goldEarnedToday: 600 }), activeQuest: null, ...top, updatedAt: serverTimestamp() }),
      };
    }],
  ];

  for (const [name, make] of scenarios) {
    it(name, async () => {
      const { seed, write } = make();
      const spare = (await maxPadding(seed, write)) * unit;
      process.stdout.write(`SPARE ${name}: ${Math.round(spare)} (unit ${unit.toFixed(2)})\n`);
      expect(spare, `only ~${Math.round(spare)} of ${LIMIT} expressions to spare`).toBeGreaterThan(MIN_HEADROOM);
    });
  }
});
