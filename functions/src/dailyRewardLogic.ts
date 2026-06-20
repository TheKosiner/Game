// Pure business logic for the daily reward Cloud Function.
// No Firebase imports — every export is a plain testable function.

export function isSameDaySrv(ts: number, now: number): boolean {
  const a = new Date(ts);
  const b = new Date(now);
  return a.getUTCFullYear() === b.getUTCFullYear() &&
         a.getUTCMonth()    === b.getUTCMonth()    &&
         a.getUTCDate()     === b.getUTCDate();
}

export function isYesterdaySrv(ts: number, now: number): boolean {
  return isSameDaySrv(ts, now - 86_400_000);
}

export const DAILY_GEMS   = 5;
export const STREAK_BONUS = 2;   // extra gems every day once a streak is going

export interface StreakCalcResult {
  newStreak: number;
  streakMilestone: 'epic' | 'legendary' | null;
  gemsAdded: number;
  newGems: number;
  chestGems: number;
}

/**
 * Pure streak calculation — call only after confirming it's a new UTC day
 * and that lastDailyReset is not in the future.
 */
export function calcStreakResult(
  prevStreak: number,
  currentGems: number,
  lastDailyReset: number,
  now: number,
): StreakCalcResult {
  const newStreak = isYesterdaySrv(lastDailyReset, now) ? prevStreak + 1 : 1;
  const isLegendary = newStreak % 20 === 0;
  const isEpic      = !isLegendary && newStreak % 5 === 0;
  const streakMilestone: 'epic' | 'legendary' | null =
    isLegendary ? 'legendary' : isEpic ? 'epic' : null;
  const chestGems  = isLegendary ? 50 : isEpic ? 20 : 0;
  const gemsAdded  = DAILY_GEMS + (newStreak > 1 ? STREAK_BONUS : 0) + chestGems;
  const newGems    = currentGems + gemsAdded;
  return { newStreak, streakMilestone, gemsAdded, newGems, chestGems };
}

/**
 * Validates whether a daily reward can be claimed.
 * Returns a reason string when blocked, null when the claim is allowed.
 */
export function dailyClaimBlockReason(
  lastDailyReset: number,
  now: number,
): 'no_save' | 'future_clock' | 'already_claimed' | null {
  if (lastDailyReset > now) return 'future_clock';
  if (isSameDaySrv(lastDailyReset, now)) return 'already_claimed';
  return null;
}
