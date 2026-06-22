import { doc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db } from './firebase';
import { functions } from './firebase';

export interface WarParticipant {
  username: string;
  level: number;
  portrait?: number;
  joinedAt: number;
}

export interface WarResult {
  winner: 'attacker' | 'defender';
  attackerScore: number;
  defenderScore: number;
  log: string[];
}

export interface GuildWar {
  id: string;
  attackerGuildId: string;
  attackerGuildName: string;
  attackerGuildTag: string;
  defenderGuildId: string;
  defenderGuildName: string;
  defenderGuildTag: string;
  declaredBy: string;
  declaredAt: number;
  signupEndsAt: number;
  status: 'signup' | 'battle' | 'finished';
  attackers: Record<string, WarParticipant>;
  defenders: Record<string, WarParticipant>;
  result?: WarResult;
  resolvedAt?: number;
}

export function subscribeToGuildWar(warId: string, cb: (war: GuildWar | null) => void): () => void {
  if (!db) { cb(null); return () => {}; }
  return onSnapshot(doc(db, 'guildWars', warId), snap => {
    cb(snap.exists() ? ({ id: snap.id, ...snap.data() } as GuildWar) : null);
  });
}

export function subscribeToActiveWars(cb: (wars: GuildWar[]) => void): () => void {
  if (!db) { cb([]); return () => {}; }
  const q = query(
    collection(db, 'guildWars'),
    where('status', 'in', ['signup', 'battle']),
  );
  return onSnapshot(q, snap => {
    const wars = snap.docs.map(d => ({ id: d.id, ...d.data() } as GuildWar));
    wars.sort((a, b) => b.declaredAt - a.declaredAt);
    cb(wars);
  });
}

export async function declareWar(defenderGuildId: string): Promise<{ warId: string }> {
  if (!functions) throw new Error('Firebase not configured');
  const fn = httpsCallable<{ defenderGuildId: string }, { warId: string }>(functions, 'declareGuildWar');
  const result = await fn({ defenderGuildId });
  return result.data;
}

export async function joinWar(warId: string): Promise<void> {
  if (!functions) throw new Error('Firebase not configured');
  const fn = httpsCallable<{ warId: string }, void>(functions, 'joinGuildWar');
  await fn({ warId });
}

export async function resolveWar(warId: string): Promise<GuildWar> {
  if (!functions) throw new Error('Firebase not configured');
  const fn = httpsCallable<{ warId: string }, GuildWar>(functions, 'resolveGuildWar');
  const result = await fn({ warId });
  return result.data;
}
