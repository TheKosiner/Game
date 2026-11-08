// Player-to-player safety tools required for an app with user-generated content
// (Google Play UGC policy): report a message or a player to the moderators, and
// block a player so their chat messages and mail are hidden.
//
// Blocks live in the player's own private profile (users/{uid}.blocked: uid →
// name), so they follow the account across devices. Reports go to the `reports`
// collection, which only the admin can read (AdminPanel → Reports).
import { create } from 'zustand';
import { addDoc, collection, deleteField, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export const REPORT_REASONS = ['spam', 'abuse', 'cheating', 'other'] as const;
export type ReportReason = typeof REPORT_REASONS[number];

export type ReportKind = 'globalChat' | 'guildChat' | 'lobbyChat' | 'mail' | 'player';

/** Most players a single account can block (mirrors firestore.rules). */
export const MAX_BLOCKED = 200;

interface ModerationState {
  /** uid → username of everyone this player has blocked. */
  blocked: Record<string, string>;
  setBlocked: (blocked: Record<string, string>) => void;
}

export const useModerationStore = create<ModerationState>(set => ({
  blocked: {},
  setBlocked: blocked => set({ blocked }),
}));

/** Load the signed-in player's block list (an empty list when signed out). */
export async function loadBlockedPlayers(uid: string | null): Promise<void> {
  if (!uid || !db) { useModerationStore.getState().setBlocked({}); return; }
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    const blocked = (snap.exists() ? snap.data().blocked : null) as Record<string, string> | null;
    useModerationStore.getState().setBlocked(blocked && typeof blocked === 'object' ? blocked : {});
  } catch {
    // Offline — keep whatever was loaded before.
  }
}

export async function blockPlayer(myUid: string, target: { uid: string; username: string }): Promise<void> {
  if (!db || target.uid === myUid) return;
  const current = useModerationStore.getState().blocked;
  if (current[target.uid] || Object.keys(current).length >= MAX_BLOCKED) return;
  await updateDoc(doc(db, 'users', myUid), { [`blocked.${target.uid}`]: target.username.slice(0, 40) });
  useModerationStore.getState().setBlocked({ ...current, [target.uid]: target.username });
}

export async function unblockPlayer(myUid: string, targetUid: string): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'users', myUid), { [`blocked.${targetUid}`]: deleteField() });
  const next = { ...useModerationStore.getState().blocked };
  delete next[targetUid];
  useModerationStore.getState().setBlocked(next);
}

export interface ReportInput {
  reporter: { uid: string; username: string };
  target: { uid: string; username: string };
  kind: ReportKind;
  reason: ReportReason;
  /** The reported message, as the reporter saw it. */
  text?: string;
  /** Document id of the reported chat message or mail, so a moderator can remove it. */
  messageId?: string;
  guildId?: string;
}

export async function reportContent(input: ReportInput): Promise<void> {
  if (!db) throw new Error('Firebase not configured');
  await addDoc(collection(db, 'reports'), {
    reporterUid: input.reporter.uid,
    reporterName: input.reporter.username,
    targetUid: input.target.uid,
    targetName: input.target.username,
    kind: input.kind,
    reason: input.reason,
    text: (input.text ?? '').slice(0, 500),
    messageId: input.messageId ?? null,
    guildId: input.guildId ?? null,
    status: 'open',
    createdAt: Date.now(),
  });
}

/** Messages and mail from blocked players are hidden. */
export function withoutBlocked<T>(items: T[], authorOf: (item: T) => string | undefined, blocked: Record<string, string>): T[] {
  return items.filter(item => {
    const author = authorOf(item);
    return !author || !blocked[author];
  });
}
