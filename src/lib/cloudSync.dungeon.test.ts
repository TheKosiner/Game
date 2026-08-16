// Regression tests for the bug where finishing an operation dropped the player
// back on the map with nothing gained.
//
// An operation lives entirely in memory: `currentDungeon`, `currentFloor`,
// `currentEnemy` and the run's pending XP/gold are never written to the save.
// `loadFromCloud` used to blank that state unconditionally, so any cloud reload
// during a run — or while the completion screen was up — wiped the run and
// reverted rewards that had not been pushed yet, while `dungeonRunsToday` had
// already been spent.
//
// The reload fires from the visibility handler on every return to the
// foreground. It used to be gated by a check comparing the device clock against
// a Firestore serverTimestamp, so on a phone whose clock ran a few seconds slow
// the check failed every time and the wipe was reproducible rather than rare.
import { describe, it, expect, vi, beforeEach } from 'vitest';

/** Hero the cloud would hand back — deliberately worse than local state. */
const CLOUD_HERO = { name: 'Hero', level: 3, xp: 7, gold: 11 };

const saveSnap = {
  exists: () => true,
  data: () => ({ hero: CLOUD_HERO, updatedAt: 9_000 }),
};
const playerSnap = { exists: () => false, data: () => ({}) };

const getDocMock = vi.fn(() => Promise.resolve(saveSnap));

vi.mock('firebase/firestore', () => ({
  doc: (_db: unknown, coll: string) => ({ coll }),
  getDoc: (ref: { coll: string }) =>
    ref.coll === 'players' ? Promise.resolve(playerSnap) : getDocMock(),
  setDoc: () => Promise.resolve(),
  deleteDoc: () => Promise.resolve(),
  deleteField: () => ({}),
  serverTimestamp: () => ({}),
  collection: () => ({}),
  getDocs: () => Promise.resolve({ docs: [] }),
  query: () => ({}),
  where: () => ({}),
  orderBy: () => ({}),
  limit: () => ({}),
  updateDoc: () => Promise.resolve(),
  addDoc: () => Promise.resolve({ id: 'x' }),
  onSnapshot: () => () => {},
  runTransaction: () => Promise.resolve(),
  increment: () => ({}),
  arrayUnion: () => ({}),
  arrayRemove: () => ({}),
  writeBatch: () => ({ set: () => {}, update: () => {}, commit: () => Promise.resolve() }),
  Timestamp: class {},
}));

// `db` must be truthy so loadFromCloud gets past its own null check; auth stays
// off so importing the store does not start an auth listener.
vi.mock('./firebase', () => ({
  db: {},
  auth: null,
  functions: null,
  isFirebaseConfigured: false,
}));

vi.mock('../hooks/useT', () => ({
  getT: () => new Proxy({}, {
    get: () => new Proxy(() => '', { get: () => () => '' }),
  }),
}));

import { loadFromCloud } from './cloudSync';
import { useGameStore } from '../store/gameStore';
import { makeHero } from '../tests/fixtures';

const DUNGEON = { id: 'd1', name: 'Sector 7', floors: 10, minLevel: 1, enemies: [] } as never;

beforeEach(() => {
  useGameStore.setState({
    hero: makeHero({ level: 20, xp: 5_000, gold: 9_999 }),
    currentDungeon: null,
    currentEnemy: null,
    currentFloor: 1,
    inCombat: false,
    pendingDungeonXp: 0,
    pendingDungeonGold: 0,
    // Everything saved has been pushed, so only the run guard is in play.
    lastSaved: 1_000,
    lastCloudSyncedAt: 1_000,
  });
});

describe('loadFromCloud vs. an operation in progress', () => {
  it('leaves a mid-run operation alone', async () => {
    useGameStore.setState({
      currentDungeon: DUNGEON,
      currentFloor: 6,
      inCombat: true,
      pendingDungeonXp: 420,
      pendingDungeonGold: 900,
    });

    expect(await loadFromCloud('uid-1')).toBe(false);

    const s = useGameStore.getState();
    expect(s.currentDungeon).toBe(DUNGEON);
    expect(s.currentFloor).toBe(6);
    expect(s.inCombat).toBe(true);
    expect(s.pendingDungeonXp).toBe(420);
    expect(s.hero.level).toBe(20); // cloud hero not applied
  });

  it('leaves the completion screen up after the last floor', async () => {
    // What the store looks like once floor 10 of 10 is cleared: rewards are
    // already banked on the hero, the run stays selected so the completion
    // screen can render, and only "back to city" closes it.
    useGameStore.setState({
      currentDungeon: DUNGEON,
      currentFloor: 11,
      inCombat: false,
      pendingDungeonXp: 1_200,
      pendingDungeonGold: 2_400,
      hero: makeHero({ level: 21, xp: 6_200, gold: 12_399 }),
    });

    expect(await loadFromCloud('uid-1')).toBe(false);

    const s = useGameStore.getState();
    expect(s.currentDungeon).toBe(DUNGEON);  // still on the completion screen
    expect(s.hero.level).toBe(21);           // rewards not reverted
    expect(s.hero.xp).toBe(6_200);
    expect(s.hero.gold).toBe(12_399);
    expect(s.pendingDungeonXp).toBe(1_200);  // totals still shown
  });

  it('still reverts a run when forced, so the anti-cheat path keeps working', async () => {
    useGameStore.setState({ currentDungeon: DUNGEON, currentFloor: 4, inCombat: true });

    expect(await loadFromCloud('uid-1', true)).toBe(true);

    const s = useGameStore.getState();
    expect(s.currentDungeon).toBeNull();
    expect(s.currentFloor).toBe(1);
    expect(s.inCombat).toBe(false);
    expect(s.hero.level).toBe(CLOUD_HERO.level);
  });
});

describe('unsynced local progress', () => {
  it('is not overwritten by a cloud snapshot', async () => {
    // Saved locally, but the push to Firestore has not landed yet.
    useGameStore.setState({ lastSaved: 5_000, lastCloudSyncedAt: 1_000 });

    expect(await loadFromCloud('uid-1')).toBe(false);
    expect(useGameStore.getState().hero.level).toBe(20);
  });

  it('does not block a load once everything is pushed', async () => {
    useGameStore.setState({ lastSaved: 5_000, lastCloudSyncedAt: 5_000 });

    expect(await loadFromCloud('uid-1')).toBe(true);
    expect(useGameStore.getState().hero.level).toBe(CLOUD_HERO.level);
  });

  it('does not depend on the device clock agreeing with the server', async () => {
    // The old guard compared `lastSaved` (device clock) against the Firestore
    // serverTimestamp in `updatedAt`. A device running slow looked stale and got
    // clobbered on every foreground return. Both markers are now device-clock
    // values compared to each other, so clock skew cannot change the outcome:
    // local time here is far behind the cloud's 9000 and still wins.
    useGameStore.setState({ lastSaved: 2, lastCloudSyncedAt: 1 });

    expect(await loadFromCloud('uid-1')).toBe(false);
    expect(useGameStore.getState().hero.level).toBe(20);
  });

  it('leaves both markers on the device clock after a load', async () => {
    useGameStore.setState({ lastSaved: 5_000, lastCloudSyncedAt: 5_000 });
    const before = Date.now();

    await loadFromCloud('uid-1');

    const s = useGameStore.getState();
    expect(s.lastSaved).toBe(s.lastCloudSyncedAt);
    expect(s.lastSaved).toBeGreaterThanOrEqual(before);
    expect(s.lastSaved).not.toBe(9_000); // not the server timestamp
  });
});
