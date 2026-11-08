import { describe, it, expect, vi, beforeEach } from 'vitest';

const updates: unknown[][] = [];
const added: unknown[][] = [];
vi.mock('firebase/firestore', () => ({
  doc: (_db: unknown, ...path: string[]) => ({ path: path.join('/') }),
  collection: (_db: unknown, name: string) => ({ name }),
  getDoc: async () => ({ exists: () => true, data: () => ({ username: 'Neo', blocked: { troll: 'Troll' } }) }),
  updateDoc: async (...args: unknown[]) => { updates.push(args); },
  addDoc: async (...args: unknown[]) => { added.push(args); return { id: 'r1' }; },
  deleteField: () => '__delete__',
}));
vi.mock('./firebase', () => ({ db: {}, auth: null, functions: null, isFirebaseConfigured: false }));

const { blockPlayer, unblockPlayer, loadBlockedPlayers, reportContent, useModerationStore, withoutBlocked } = await import('./moderation');

beforeEach(() => {
  updates.length = 0;
  added.length = 0;
  useModerationStore.setState({ blocked: {} });
});

describe('block list', () => {
  it('loads from the private profile', async () => {
    await loadBlockedPlayers('me');
    expect(useModerationStore.getState().blocked).toEqual({ troll: 'Troll' });
  });

  it('clears when signed out', async () => {
    useModerationStore.setState({ blocked: { troll: 'Troll' } });
    await loadBlockedPlayers(null);
    expect(useModerationStore.getState().blocked).toEqual({});
  });

  it('blocks and unblocks through the profile', async () => {
    await blockPlayer('me', { uid: 'troll', username: 'Troll' });
    expect(updates[0][1]).toEqual({ 'blocked.troll': 'Troll' });
    expect(useModerationStore.getState().blocked).toEqual({ troll: 'Troll' });
    await unblockPlayer('me', 'troll');
    expect(updates[1][1]).toEqual({ 'blocked.troll': '__delete__' });
    expect(useModerationStore.getState().blocked).toEqual({});
  });

  it('never blocks yourself', async () => {
    await blockPlayer('me', { uid: 'me', username: 'Me' });
    expect(updates).toHaveLength(0);
  });

  it('hides messages from blocked players only', () => {
    const msgs = [{ uid: 'a', text: '1' }, { uid: 'troll', text: '2' }, { uid: 'b', text: '3' }];
    expect(withoutBlocked(msgs, m => m.uid, { troll: 'Troll' }).map(m => m.text)).toEqual(['1', '3']);
  });
});

describe('reportContent', () => {
  it('files an open report with the message snapshot (trimmed to 500 chars)', async () => {
    await reportContent({
      reporter: { uid: 'me', username: 'Neo' }, target: { uid: 'troll', username: 'Troll' },
      kind: 'globalChat', reason: 'abuse', text: 'x'.repeat(600), messageId: 'm1',
    });
    const data = added[0][1] as Record<string, unknown>;
    expect(data).toMatchObject({ reporterUid: 'me', targetUid: 'troll', kind: 'globalChat', reason: 'abuse', messageId: 'm1', status: 'open' });
    expect((data.text as string).length).toBe(500);
  });
});
