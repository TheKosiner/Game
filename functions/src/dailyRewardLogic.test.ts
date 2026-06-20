import { describe, it, expect } from 'vitest';
import {
  isSameDaySrv,
  isYesterdaySrv,
  calcStreakResult,
  dailyClaimBlockReason,
  DAILY_GEMS,
  STREAK_BONUS,
} from './dailyRewardLogic';

// ── Helpers ───────────────────────────────────────────────────────────────────
/** Builds a UTC millisecond timestamp for a given date/time. */
const utc = (year: number, month: number, day: number, h = 0, m = 0, s = 0) =>
  Date.UTC(year, month - 1, day, h, m, s);

const DAY = 86_400_000;

// ── isSameDaySrv ──────────────────────────────────────────────────────────────
describe('isSameDaySrv', () => {
  it('returns true for two timestamps on the same UTC calendar date', () => {
    const a = utc(2026, 6, 20, 8, 0);
    const b = utc(2026, 6, 20, 23, 59);
    expect(isSameDaySrv(a, b)).toBe(true);
  });

  it('returns false when dates differ by exactly one UTC day', () => {
    const a = utc(2026, 6, 20, 23, 59);
    const b = utc(2026, 6, 21, 0, 0);
    expect(isSameDaySrv(a, b)).toBe(false);
  });

  it('returns false across month boundary', () => {
    expect(isSameDaySrv(utc(2026, 6, 30, 12), utc(2026, 7, 1, 0))).toBe(false);
  });

  it('returns false across year boundary', () => {
    expect(isSameDaySrv(utc(2025, 12, 31, 23), utc(2026, 1, 1, 0))).toBe(false);
  });

  it('handles midnight UTC edge — 23:59 vs 00:00 next day', () => {
    const justBefore = utc(2026, 6, 20, 23, 59, 59);
    const justAfter  = utc(2026, 6, 21, 0, 0, 0);
    expect(isSameDaySrv(justBefore, justAfter)).toBe(false);
  });

  it('is symmetric', () => {
    const a = utc(2026, 6, 20, 8);
    const b = utc(2026, 6, 20, 18);
    expect(isSameDaySrv(a, b)).toBe(isSameDaySrv(b, a));
  });

  it('the Warsaw midnight offset does NOT affect the UTC result', () => {
    // Warsaw summer (CEST) midnight = 22:00 UTC previous day.
    // Both timestamps fall on the same UTC date even though Warsaw sees a new day.
    const lastReset = utc(2026, 6, 21, 20, 0);  // 22:00 Warsaw June 21
    const now       = utc(2026, 6, 21, 22, 30); // 00:30 Warsaw June 22 — still June 21 UTC!
    expect(isSameDaySrv(lastReset, now)).toBe(true);
  });
});

// ── isYesterdaySrv ────────────────────────────────────────────────────────────
describe('isYesterdaySrv', () => {
  it('returns true when ts is exactly one UTC day before now', () => {
    const yesterday = utc(2026, 6, 19, 15);
    const today     = utc(2026, 6, 20, 10);
    expect(isYesterdaySrv(yesterday, today)).toBe(true);
  });

  it('returns true even when ts and now are at different hours within their days', () => {
    expect(isYesterdaySrv(utc(2026, 6, 19, 23, 59), utc(2026, 6, 20, 0, 1))).toBe(true);
    expect(isYesterdaySrv(utc(2026, 6, 19, 0, 0), utc(2026, 6, 20, 23, 59))).toBe(true);
  });

  it('returns false for today (same UTC day)', () => {
    const now = utc(2026, 6, 20, 10);
    expect(isYesterdaySrv(now, now)).toBe(false);
    expect(isYesterdaySrv(utc(2026, 6, 20, 1), utc(2026, 6, 20, 23))).toBe(false);
  });

  it('returns false when ts is two days ago', () => {
    expect(isYesterdaySrv(utc(2026, 6, 18), utc(2026, 6, 20))).toBe(false);
  });

  it('returns false when ts is in the future (tomorrow)', () => {
    expect(isYesterdaySrv(utc(2026, 6, 21), utc(2026, 6, 20))).toBe(false);
  });

  it('handles month boundary correctly', () => {
    expect(isYesterdaySrv(utc(2026, 5, 31), utc(2026, 6, 1))).toBe(true);
    expect(isYesterdaySrv(utc(2025, 12, 31), utc(2026, 1, 1))).toBe(true);
  });
});

// ── calcStreakResult ──────────────────────────────────────────────────────────
describe('calcStreakResult', () => {
  const NOW = utc(2026, 6, 20, 10);

  it('starts a fresh streak (=1) when last reset was never (0)', () => {
    const r = calcStreakResult(0, 100, 0, NOW);
    expect(r.newStreak).toBe(1);
  });

  it('starts a fresh streak (=1) when last reset was more than one day ago', () => {
    const twoDaysAgo = NOW - 2 * DAY;
    const r = calcStreakResult(5, 0, twoDaysAgo, NOW);
    expect(r.newStreak).toBe(1);
  });

  it('increments streak when last reset was exactly yesterday', () => {
    const yesterday = utc(2026, 6, 19, 14);
    const r = calcStreakResult(3, 0, yesterday, NOW);
    expect(r.newStreak).toBe(4);
  });

  it('adds the base 5 gems on day 1', () => {
    const r = calcStreakResult(0, 100, 0, NOW);
    expect(r.gemsAdded).toBe(DAILY_GEMS);
    expect(r.newGems).toBe(100 + DAILY_GEMS);
    expect(r.chestGems).toBe(0);
    expect(r.streakMilestone).toBeNull();
  });

  it('adds streak bonus gems from day 2 onward', () => {
    const yesterday = utc(2026, 6, 19, 10);
    const r = calcStreakResult(1, 0, yesterday, NOW); // day 1→2
    expect(r.gemsAdded).toBe(DAILY_GEMS + STREAK_BONUS);
    expect(r.streakMilestone).toBeNull();
  });

  it('awards "epic" milestone and 20 chest gems on multiples of 5 (not 20)', () => {
    const yesterday = utc(2026, 6, 19, 10);
    // prevStreak = 4 → newStreak = 5
    const r = calcStreakResult(4, 50, yesterday, NOW);
    expect(r.newStreak).toBe(5);
    expect(r.streakMilestone).toBe('epic');
    expect(r.chestGems).toBe(20);
    expect(r.gemsAdded).toBe(DAILY_GEMS + STREAK_BONUS + 20);
  });

  it('awards "legendary" milestone and 50 chest gems on multiples of 20', () => {
    const yesterday = utc(2026, 6, 19, 10);
    const r = calcStreakResult(19, 0, yesterday, NOW);
    expect(r.newStreak).toBe(20);
    expect(r.streakMilestone).toBe('legendary');
    expect(r.chestGems).toBe(50);
    expect(r.gemsAdded).toBe(DAILY_GEMS + STREAK_BONUS + 50);
  });

  it('"legendary" takes priority over "epic" at streak=20 (20 is also divisible by 5)', () => {
    const yesterday = utc(2026, 6, 19, 10);
    const r = calcStreakResult(19, 0, yesterday, NOW);
    expect(r.streakMilestone).toBe('legendary');
  });

  it('no milestone at streak=10 (epic milestone is at multiples of 5, but 10 is not 20)', () => {
    const yesterday = utc(2026, 6, 19, 10);
    const r = calcStreakResult(9, 0, yesterday, NOW);
    expect(r.newStreak).toBe(10);
    expect(r.streakMilestone).toBe('epic'); // 10 is a multiple of 5
  });

  it('epic milestone at 25 (multiple of 5, not 20)', () => {
    const yesterday = utc(2026, 6, 19, 10);
    const r = calcStreakResult(24, 0, yesterday, NOW);
    expect(r.newStreak).toBe(25);
    expect(r.streakMilestone).toBe('epic');
  });

  it('legendary milestone at 40 (multiple of 20)', () => {
    const yesterday = utc(2026, 6, 19, 10);
    const r = calcStreakResult(39, 0, yesterday, NOW);
    expect(r.newStreak).toBe(40);
    expect(r.streakMilestone).toBe('legendary');
  });

  it('correctly accumulates gems into existing balance', () => {
    const yesterday = utc(2026, 6, 19, 10);
    const r = calcStreakResult(2, 999, yesterday, NOW);
    expect(r.newGems).toBe(999 + r.gemsAdded);
  });
});

// ── dailyClaimBlockReason ─────────────────────────────────────────────────────
describe('dailyClaimBlockReason', () => {
  const NOW = utc(2026, 6, 20, 10);

  it('returns null when last reset was yesterday (claim allowed)', () => {
    expect(dailyClaimBlockReason(utc(2026, 6, 19, 14), NOW)).toBeNull();
  });

  it('returns null when lastDailyReset is 0 (never claimed)', () => {
    expect(dailyClaimBlockReason(0, NOW)).toBeNull();
  });

  it('returns "already_claimed" when last reset was today (same UTC day)', () => {
    expect(dailyClaimBlockReason(utc(2026, 6, 20, 6), NOW)).toBe('already_claimed');
  });

  it('returns "future_clock" when lastDailyReset is in the future', () => {
    expect(dailyClaimBlockReason(NOW + 1000, NOW)).toBe('future_clock');
  });

  it('returns null for a 2-day gap (streak breaks but claim is allowed)', () => {
    expect(dailyClaimBlockReason(utc(2026, 6, 18), NOW)).toBeNull();
  });
});

