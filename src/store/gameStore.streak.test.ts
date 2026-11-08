// Tests for the client-side daily reset + streak logic inside gameStore.
// The client fallback follows the same UTC calendar as the claimDailyReward
// Cloud Function and the Firestore rules — this file tests the *client* path.
//
// jsdom runs with the UTC timezone, so `new Date().getDate()` is UTC date.
// vi.setSystemTime() correctly patches both Date.now() and new Date(),
// which lets isSameDay return predictable results in tests.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useGameStore, scaledQuestDuration } from './gameStore';
import { useAuthStore } from './authStore';
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
      beggingDone: (n: number) => `begging +${n}`,
      goldCapReached: 'gold cap',
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

  // ── Day boundary: UTC, like the server ────────────────────────────────────
  // The client used to reset at Warsaw midnight. The server and the save rules
  // use the UTC day, so that local reset was rejected on sync and every rejection
  // rolled the player back to their last cloud save.
  it('does not reset at Warsaw midnight while it is still the same UTC day', () => {
    const lastReset = day(2026, 6, 20, 8, 0);   // 10:00 Warsaw June 20
    const now       = day(2026, 6, 20, 22, 30); // 00:30 Warsaw June 21 = 22:30 UTC June 20

    vi.setSystemTime(now);
    resetStore({ lastDailyReset: lastReset, gems: 0, dungeonRunsToday: 7 });
    callReset();

    expect(getHero().gems).toBe(0);
    expect(getHero().dungeonRunsToday).toBe(7);
    expect(getHero().lastDailyReset).toBe(lastReset);
  });

  it('resets once the UTC day rolls over', () => {
    const lastReset = day(2026, 6, 20, 22, 30);
    const now       = day(2026, 6, 21, 0, 5);  // 5 minutes past UTC midnight

    vi.setSystemTime(now);
    resetStore({ lastDailyReset: lastReset, gems: 0, streakDays: 3 });
    callReset();

    expect(getHero().gems).toBe(5);
    expect(getHero().streakDays).toBe(4);
    expect(getHero().lastDailyReset).toBe(now);
  });
});

// ── applyServerDailyReset ─────────────────────────────────────────────────────
describe('applyServerDailyReset', () => {
  afterEach(() => { vi.useRealTimers(); });

  it('mirrors the server reset and adds the credited gems on top (delta)', () => {
    resetStore({ gems: 12, dungeonRunsToday: 9, kryptaRunsToday: 4, questsCompletedToday: 5, goldEarnedToday: 999, streakDays: 2 });
    useGameStore.getState().applyServerDailyReset({ lastDailyReset: 1234, streakDays: 3, gemsAdded: 7, gems: 999 }, 'delta');
    const h = getHero();
    expect(h.gems).toBe(19);
    expect([h.dungeonRunsToday, h.kryptaRunsToday, h.questsCompletedToday, h.goldEarnedToday]).toEqual([0, 0, 0, 0]);
    expect(h.lastDailyReset).toBe(1234);
    expect(h.streakDays).toBe(3);
  });

  it('takes the server balance as is after a cloud reload (absolute)', () => {
    resetStore({ gems: 12 });
    useGameStore.getState().applyServerDailyReset({ lastDailyReset: 1, streakDays: 1, gemsAdded: 7, gems: 19 }, 'absolute');
    expect(getHero().gems).toBe(19);
  });
});

// ── addGold daily cap ─────────────────────────────────────────────────────────
describe('addGold', () => {
  beforeEach(() => { useGameStore.setState({ guildGoldBonus: 0 }); });

  it('credits normally under the cap', () => {
    resetStore({ gold: 100, goldEarnedToday: 0 });
    useGameStore.getState().addGold(50);
    expect(getHero().gold).toBe(150);
    expect(getHero().goldEarnedToday).toBe(50);
  });

  it('stops crediting gold at the daily cap instead of letting gold outrun it', () => {
    // Past the cap the save rules reject any gold gain; crediting it anyway made
    // the next save fail and the client roll the session back.
    resetStore({ gold: 1000, goldEarnedToday: 250_000_000 - 30 });
    useGameStore.getState().addGold(100);
    expect(getHero().gold).toBe(1030);
    expect(getHero().goldEarnedToday).toBe(250_000_000);
    useGameStore.getState().addGold(100);
    expect(getHero().gold).toBe(1030);
  });

  it('never goes past the 1e9 gold ceiling', () => {
    resetStore({ gold: 1_000_000_000 - 10, goldEarnedToday: 0 });
    useGameStore.getState().addGold(500);
    expect(getHero().gold).toBe(1_000_000_000);
    expect(getHero().goldEarnedToday).toBe(10);
  });
});

// ── addXp: never more levels than one cloud save may carry ───────────────────
describe('addXp level banking', () => {
  beforeEach(() => { useGameStore.setState({ guildExpBonus: 0 }); });
  afterEach(() => { useGameStore.setState({ cloudLevel: null }); });

  it('banks XP past +10 levels over the synced level, and releases it after a sync', () => {
    resetStore({ level: 1, xp: 0, xpToNext: 100, gems: 0 });
    useGameStore.setState({ cloudLevel: 1 });
    useGameStore.getState().addXp(1_000_000); // a high-level guild operation reward
    let h = getHero();
    expect(h.level).toBe(11);
    expect(h.bankedXp).toBeGreaterThan(0);
    expect(h.gems).toBe(30); // 10 level-ups × 3 — within the +40 per save the rules allow

    // The next sync confirmed level 11 → the bank is released, another 10 levels at most.
    useGameStore.setState({ cloudLevel: 11 });
    useGameStore.getState().addXp(0);
    h = getHero();
    expect(h.level).toBe(21);

    // Keep syncing until the whole reward has been applied.
    for (let i = 0; i < 10 && (getHero().bankedXp ?? 0) > 0; i++) {
      useGameStore.setState({ cloudLevel: getHero().level });
      useGameStore.getState().addXp(0);
    }
    h = getHero();
    expect(h.bankedXp).toBe(0);
    expect(h.xp).toBeLessThan(h.xpToNext);
  });

  it('applies everything at once before the first sync (the first save is a create)', () => {
    resetStore({ level: 1, xp: 0, xpToNext: 100 });
    useGameStore.setState({ cloudLevel: null });
    useGameStore.getState().addXp(1_000_000);
    expect(getHero().level).toBeGreaterThan(11);
    expect(getHero().bankedXp ?? 0).toBe(0);
  });
});

// ── Collecting rewards that started before the daily reset ───────────────────
describe('overnight rewards', () => {
  beforeEach(() => { useGameStore.setState({ guildGoldBonus: 0, guildExpBonus: 0 }); });

  it('an overnight begging reward counts as earned today, so the save stays valid', () => {
    const now = Date.now();
    resetStore({
      gold: 100, goldEarnedToday: 0, lastDailyReset: now - 3_600_000,
      beggingStartAt: now - 8 * 3_600_000, beggingUntil: now - 1000, beggingReward: 500,
    });
    useGameStore.getState().collectBegging();
    const h = getHero();
    expect(h.gold).toBe(600);
    expect(h.goldEarnedToday).toBe(500); // gold gain matched by earned gain
    expect(h.beggingReward).toBeNull();
  });
});

// ── loadGame (local save) ─────────────────────────────────────────────────────
describe('loadGame', () => {
  const SAVE_KEY = 'glitchsoul_save';
  afterEach(() => {
    localStorage.removeItem(SAVE_KEY);
    useAuthStore.setState({ user: null });
  });

  function writeSave(uid: string | null, heroPartial: Parameters<typeof makeHero>[0]) {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ uid, hero: makeHero(heroPartial), lastSaved: 1 }));
  }

  it('keeps the login streak', () => {
    writeSave(null, { name: 'Neo', streakDays: 7, lastDailyReset: Date.now() });
    useGameStore.getState().loadGame();
    expect(getHero().streakDays).toBe(7);
  });

  it("ignores a local save that belongs to a different account", () => {
    resetStore({ name: 'Mine', gold: 5 });
    writeSave('someone-else', { name: 'Theirs', gold: 999_999 });
    useAuthStore.setState({ user: { uid: 'me', email: 'me@x.y', username: 'me' } });
    useGameStore.getState().loadGame();
    expect(getHero().name).toBe('Mine');
    expect(getHero().gold).toBe(5);
  });

  it("loads the signed-in account's own local save", () => {
    writeSave('me', { name: 'Mine', gold: 42, lastDailyReset: Date.now() });
    useAuthStore.setState({ user: { uid: 'me', email: 'me@x.y', username: 'me' } });
    useGameStore.getState().loadGame();
    expect(getHero().name).toBe('Mine');
    expect(getHero().gold).toBe(42);
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
