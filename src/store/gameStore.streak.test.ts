// Tests for the client-side daily reset + streak logic inside gameStore.
// The store's isSameDay helper uses Europe/Warsaw timezone (Intl.DateTimeFormat),
// while the CF uses UTC — this file tests the *client* path.
//
// jsdom runs with the UTC timezone, so `new Date().getDate()` is UTC date.
// vi.setSystemTime() correctly patches both Date.now() and new Date(),
// which lets isSameDay return predictable results in tests.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useGameStore, scaledQuestDuration } from './gameStore';
import { makeHero } from '../tests/fixtures';

// Minimal translation mock — only the keys that checkDailyReset actually reads.
vi.mock('../hooks/useT', () => ({
  getT: () => ({
    gems: {
      dailyLog:    (n: number) => `+${n} gems`,
      levelUpLog:  (n: number) => `+${n} gems (level)`,
      healLog:     '+gems heal',
    },
    combat: {
      rested:     (n: number) => `rested ${n}`,
      levelUp:    (lvl: number) => `level ${lvl}`,
      statsReset: 'stats reset',
      bossStart:  () => '',
      bossShield: () => '',
      armorBreak: '',
    },
    quest: { complete: () => '' },
    dungeon: { complete: () => '', cleared: () => '' },
  }),
  // useT is the React hook variant — same structure, not called from gameStore
  useT: () => ({
    gems: { dailyLog: (n: number) => `+${n} gems`, levelUpLog: () => '' },
    combat: { rested: (n: number) => `rested ${n}` },
  }),
}));

// ── helpers ───────────────────────────────────────────────────────────────────
const DAY  = 86_400_000;
/** UTC ms for a given date at midnight UTC. */
const day = (year: number, month: number, date: number, h = 0, m = 0) =>
  Date.UTC(year, month - 1, date, h, m);

const JUNE_20 = day(2026, 6, 20, 12, 0); // arbitrary mid-day reference
const JUNE_19 = day(2026, 6, 19, 12, 0); // yesterday

function resetStore(heroPartial: Parameters<typeof makeHero>[0] = {}) {
  useGameStore.setState({ hero: makeHero(heroPartial), combatLog: [] });
}

function getHero() {
  return useGameStore.getState().hero;
}

function callReset() {
  useGameStore.getState().checkDailyReset();
}

// ── checkDailyReset ───────────────────────────────────────────────────────────
describe('checkDailyReset', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach (() => vi.useRealTimers());

  // ── guard: same day ────────────────────────────────────────────────────────
  it('does nothing when lastDailyReset is in the same UTC day as now', () => {
    vi.setSystemTime(JUNE_20);
    resetStore({ lastDailyReset: day(2026, 6, 20, 8), gems: 10, streakDays: 3,
                 dungeonRunsToday: 2, questsCompletedToday: 1 });
    callReset();
    const h = getHero();
    expect(h.gems).toBe(10);
    expect(h.streakDays).toBe(3);
    expect(h.dungeonRunsToday).toBe(2);
  });

  // ── guard: future clock ────────────────────────────────────────────────────
  it('fixes a future lastDailyReset without granting rewards', () => {
    vi.setSystemTime(JUNE_20);
    resetStore({ lastDailyReset: JUNE_20 + DAY, gems: 50 });
    callReset();
    expect(getHero().gems).toBe(50);                  // no bonus
    expect(getHero().lastDailyReset).toBe(JUNE_20);   // fixed to now
  });

  // ── new day: first ever claim ──────────────────────────────────────────────
  it('awards 5 gems and starts streak=1 on first ever claim (lastDailyReset=0)', () => {
    vi.setSystemTime(JUNE_20);
    resetStore({ lastDailyReset: 0, gems: 0 });
    callReset();
    const h = getHero();
    expect(h.gems).toBe(5);
    expect(h.streakDays).toBe(1);
  });

  // ── new day: streak continuation ───────────────────────────────────────────
  it('increments streak when last reset was yesterday UTC', () => {
    vi.setSystemTime(JUNE_20);
    resetStore({ lastDailyReset: JUNE_19, streakDays: 4, gems: 0 });
    callReset();
    expect(getHero().streakDays).toBe(5);
    expect(getHero().gems).toBe(5);
  });

  // ── new day: streak break ──────────────────────────────────────────────────
  it('resets streak to 1 when last reset was 2+ days ago', () => {
    vi.setSystemTime(JUNE_20);
    const twoDaysAgo = day(2026, 6, 18, 12);
    resetStore({ lastDailyReset: twoDaysAgo, streakDays: 10, gems: 0 });
    callReset();
    expect(getHero().streakDays).toBe(1);
  });

  // ── counter resets ─────────────────────────────────────────────────────────
  it('zeroes all daily counters on a new day', () => {
    vi.setSystemTime(JUNE_20);
    resetStore({
      lastDailyReset: JUNE_19,
      dungeonRunsToday: 10, questsCompletedToday: 5,
      goldEarnedToday: 9999, kryptaRunsToday: 5,
    });
    callReset();
    const h = getHero();
    expect(h.dungeonRunsToday).toBe(0);
    expect(h.questsCompletedToday).toBe(0);
    expect(h.goldEarnedToday).toBe(0);
    expect(h.kryptaRunsToday).toBe(0);
  });

  // ── lastDailyReset update ──────────────────────────────────────────────────
  it('updates lastDailyReset to now', () => {
    vi.setSystemTime(JUNE_20);
    resetStore({ lastDailyReset: JUNE_19 });
    callReset();
    expect(getHero().lastDailyReset).toBe(JUNE_20);
  });

  // ── idempotency ────────────────────────────────────────────────────────────
  it('is idempotent — calling twice on the same day yields the same result', () => {
    vi.setSystemTime(JUNE_20);
    resetStore({ lastDailyReset: JUNE_19, gems: 0, streakDays: 1 });
    callReset();
    const after1 = { gems: getHero().gems, streak: getHero().streakDays };
    callReset();
    expect(getHero().gems).toBe(after1.gems);
    expect(getHero().streakDays).toBe(after1.streak);
  });

  // ── combat log ────────────────────────────────────────────────────────────
  it('pushes a combat log entry on a successful reset', () => {
    vi.setSystemTime(JUNE_20);
    resetStore({ lastDailyReset: JUNE_19 });
    callReset();
    const log = useGameStore.getState().combatLog;
    expect(log.some(e => e.message.includes('gems'))).toBe(true);
  });

  // ── voluntary rest recovery ────────────────────────────────────────────────
  it('heals from voluntary rest when the timer has expired', () => {
    vi.setSystemTime(JUNE_20);
    const restExpiredAt = JUNE_20 - 1000;
    resetStore({
      lastDailyReset: JUNE_19,
      hp: 100,
      maxHp: 200,
      voluntaryRestUntil: restExpiredAt,
      voluntaryRestHp: 80,
    });
    callReset();
    expect(getHero().hp).toBe(180);            // 100 + 80 (heal), capped at maxHp
    expect(getHero().voluntaryRestUntil).toBeNull();
  });

  it('does not heal when voluntary rest timer has not expired yet', () => {
    vi.setSystemTime(JUNE_20);
    const restEndsAt = JUNE_20 + DAY;
    resetStore({
      lastDailyReset: JUNE_19,
      hp: 100,
      maxHp: 200,
      voluntaryRestUntil: restEndsAt,
      voluntaryRestHp: 80,
    });
    callReset();
    expect(getHero().hp).toBe(100);
    expect(getHero().voluntaryRestUntil).toBe(restEndsAt);
  });

  it('caps voluntary rest heal at maxHp', () => {
    vi.setSystemTime(JUNE_20);
    resetStore({
      lastDailyReset: JUNE_19,
      hp: 190,
      maxHp: 200,
      voluntaryRestUntil: JUNE_20 - 1,
      voluntaryRestHp: 50,
    });
    callReset();
    expect(getHero().hp).toBe(200); // 190 + 50 would be 240, capped at 200
  });

  // ── Warsaw midnight edge-case (client vs server diverge) ──────────────────
  it('triggers on Warsaw midnight even when it is still the same UTC day', () => {
    // Warsaw summer (CEST) = UTC+2.
    // June 21 00:30 Warsaw = June 20 22:30 UTC — still June 20 in UTC.
    // But isSameDay uses Warsaw timezone, so it correctly sees June 21 Warsaw
    // vs June 20 Warsaw (the stored reset) and fires the reset.
    const lastResetWarsaw = day(2026, 6, 20, 20, 0); // 22:00 Warsaw June 20 = 20:00 UTC
    const nowWarsaw       = day(2026, 6, 20, 22, 30); // 00:30 Warsaw June 21 = 22:30 UTC

    vi.setSystemTime(nowWarsaw);
    resetStore({ lastDailyReset: lastResetWarsaw, gems: 0 });
    callReset();

    // Warsaw date of lastReset = June 20; Warsaw date of now = June 21 → new day
    // The claim should have fired.
    expect(getHero().gems).toBe(5);
  });
});

// ── scaledQuestDuration ───────────────────────────────────────────────────────
describe('scaledQuestDuration', () => {
  const MAX_MS = 20 * 60 * 1000; // 20 minutes

  it('returns the base duration unchanged at level 1', () => {
    expect(scaledQuestDuration(60_000, 1)).toBe(60_000);
  });

  it('scales linearly with level (5% per level above 1)', () => {
    // level 2 → 1 + (2-1)*0.05 = 1.05
    expect(scaledQuestDuration(60_000, 2)).toBe(Math.floor(60_000 * 1.05));
    // level 11 → 1 + 10*0.05 = 1.5
    expect(scaledQuestDuration(60_000, 11)).toBe(Math.floor(60_000 * 1.5));
  });

  it('clamps the result to 20 minutes', () => {
    expect(scaledQuestDuration(MAX_MS, 1)).toBe(MAX_MS);
    // Very high level: should still be capped at 20 min
    expect(scaledQuestDuration(MAX_MS * 2, 100)).toBe(MAX_MS);
    expect(scaledQuestDuration(60_000, 1000)).toBe(MAX_MS);
  });

  it('is monotonically non-decreasing with level (until cap)', () => {
    const base = 30_000;
    let prev = scaledQuestDuration(base, 1);
    for (let lvl = 2; lvl <= 30; lvl++) {
      const curr = scaledQuestDuration(base, lvl);
      expect(curr).toBeGreaterThanOrEqual(prev);
      prev = curr;
    }
  });
});
