// A client save is a full overwrite of the cloud save, so one that lands after a
// Cloud Function credited gems (purchase, daily reward) would silently undo the
// credit. withServerWrite holds syncs back while such a write is in progress and
// first waits for any sync already in flight.
import { describe, it, expect, vi, beforeEach } from 'vitest';

const setDocMock = vi.fn((..._args: unknown[]) => Promise.resolve());

vi.mock('firebase/firestore', () => ({
  doc: (_db: unknown, coll: string) => ({ coll }),
  getDoc: () => Promise.resolve({ exists: () => false, data: () => ({}) }),
  setDoc: (...args: unknown[]) => setDocMock(...args),
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
  documentId: () => ({}),
  Timestamp: class {},
}));

vi.mock('./firebase', () => ({ db: {}, auth: null, functions: null, isFirebaseConfigured: false }));

const { syncToCloud, withServerWrite } = await import('./cloudSync');
const { useGameStore } = await import('../store/gameStore');
const { makeHero } = await import('../tests/fixtures');

const savesWritten = () => setDocMock.mock.calls.filter(c => (c[0] as { coll: string }).coll === 'saves').length;

beforeEach(() => {
  setDocMock.mockClear();
  useGameStore.setState({ hero: makeHero({ name: 'Neo', gems: 10 }), heroReady: true });
});

describe('withServerWrite', () => {
  it('holds client saves while a server write is in progress', async () => {
    let release!: () => void;
    const serverWrite = withServerWrite(() => new Promise<void>(r => { release = r; }));
    await Promise.resolve();
    await syncToCloud('u', 'neo');
    expect(savesWritten()).toBe(0);
    release();
    await serverWrite;
    await syncToCloud('u', 'neo');
    expect(savesWritten()).toBe(1);
  });

  it('waits for a sync already in flight before starting', async () => {
    let finishSave!: () => void;
    setDocMock.mockImplementationOnce(() => new Promise<void>(r => { finishSave = r; }));
    const inFlight = syncToCloud('u', 'neo');
    const order: string[] = [];
    const serverWrite = withServerWrite(async () => { order.push('server write'); });
    await new Promise(r => setTimeout(r, 0));
    expect(order).toEqual([]); // still waiting for the in-flight save
    finishSave();
    await inFlight;
    await serverWrite;
    expect(order).toEqual(['server write']);
  });

  it('never uploads a hero that is not ready', async () => {
    useGameStore.setState({ heroReady: false });
    await syncToCloud('u', 'neo');
    expect(savesWritten()).toBe(0);
  });
});
