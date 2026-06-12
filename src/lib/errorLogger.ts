import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import { useAuthStore } from '../store/authStore';

// In-memory dedup: don't log same message+uid more than once per 60s
const _recentKeys = new Map<string, number>();

function isDupe(key: string): boolean {
  const last = _recentKeys.get(key) ?? 0;
  if (Date.now() - last < 60_000) return true;
  _recentKeys.set(key, Date.now());
  // Prune old entries
  if (_recentKeys.size > 100) {
    const cutoff = Date.now() - 120_000;
    for (const [k, t] of _recentKeys) if (t < cutoff) _recentKeys.delete(k);
  }
  return false;
}

export type ErrorType = 'react' | 'js' | 'promise';

export async function logClientError(
  message: string,
  stack: string,
  type: ErrorType,
): Promise<void> {
  if (!db) return;
  try {
    const user = useAuthStore.getState().user;
    const uid      = user?.uid      ?? 'anonymous';
    const username = user?.username ?? 'anonymous';
    const key = `${uid}::${message.slice(0, 80)}`;
    if (isDupe(key)) return;

    await addDoc(collection(db, 'clientErrors'), {
      uid,
      username,
      message: message.slice(0, 500),
      stack:   stack.slice(0, 2000),
      url:     window.location.pathname,
      ts:      Date.now(),
      ua:      navigator.userAgent.slice(0, 120),
      type,
      build:   __BUILD_ID__,
    });
  } catch {
    // never throw — logging must not crash the app
  }
}
