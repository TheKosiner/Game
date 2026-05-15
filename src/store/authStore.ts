import { create } from 'zustand';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { doc, getDoc, runTransaction } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';

export interface AuthUser {
  uid: string;
  email: string;
  username: string;
}

interface AuthState {
  user: AuthUser | null;
  authLoading: boolean;
  error: string | null;
  needsVerification: boolean;
  pendingEmail: string;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  checkVerification: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

// Disposable/temporary email domains blocked to deter throwaway multi-accounts
const BLOCKED_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org',
  'tempmail.com', 'temp-mail.org', 'throwam.com', 'throwaway.email',
  'sharklasers.com', 'spam4.me', 'yopmail.com', 'trashmail.com',
  'maildrop.cc', 'dispostable.com', 'fakeinbox.com', 'mailnull.com',
  'spamgourmet.com', 'spamhereplease.com', 'spamotron.com',
  'trashmail.at', 'trashmail.io', 'trashmail.me',
  'getnada.com', 'inboxbear.com', 'discard.email', 'mailnesia.com',
]);

function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase() ?? '';
  return BLOCKED_DOMAINS.has(domain);
}

async function fetchUsername(uid: string): Promise<string> {
  try {
    if (!db) return 'Gracz';
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? (snap.data().username ?? 'Gracz') : 'Gracz';
  } catch {
    return 'Gracz';
  }
}

function toAuthUser(user: User, username: string): AuthUser {
  return { uid: user.uid, email: user.email ?? '', username };
}

function getErrorMessage(e: unknown): string {
  if (typeof e === 'object' && e !== null && 'code' in e) {
    const code = (e as { code: string }).code;
    const messages: Record<string, string> = {
      'auth/user-not-found': 'Nie znaleziono konta',
      'auth/wrong-password': 'Błędne hasło',
      'auth/email-already-in-use': 'Email już zajęty',
      'auth/weak-password': 'Hasło za słabe (min. 6 znaków)',
      'auth/invalid-email': 'Nieprawidłowy email',
      'auth/invalid-credential': 'Nieprawidłowe dane logowania',
      'auth/too-many-requests': 'Zbyt wiele prób — spróbuj później',
    };
    return messages[code] ?? `Błąd: ${code}`;
  }
  return 'Błąd połączenia';
}

// Holds ref to Firebase User for resend — not stored in Zustand (non-serializable)
let _pendingFirebaseUser: User | null = null;

export const useAuthStore = create<AuthState>((set) => {
  if (isFirebaseConfigured && auth) {
    onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        if (!user.emailVerified) {
          // Signed in but email not verified — stay on verification screen
          // (could happen if user refreshes page after registering)
          _pendingFirebaseUser = user;
          set({ authLoading: false, needsVerification: true, pendingEmail: user.email ?? '' });
          return;
        }
        const username = await fetchUsername(user.uid);
        set({ user: toAuthUser(user, username), authLoading: false, needsVerification: false });
      } else {
        set({ user: null, authLoading: false });
      }
    });
  } else {
    setTimeout(() => set({ authLoading: false }), 0);
  }

  return {
    user: null,
    authLoading: true,
    error: null,
    needsVerification: false,
    pendingEmail: '',

    login: async (email, password) => {
      if (!auth) return;
      set({ error: null });
      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        if (!cred.user.emailVerified) {
          _pendingFirebaseUser = cred.user;
          // Keep user signed in — needed so resendVerification can call sendEmailVerification
          // onAuthStateChanged handles showing the verification screen
          set({ needsVerification: true, pendingEmail: email });
          return;
        }
      } catch (e) {
        set({ error: getErrorMessage(e) });
      }
    },

    register: async (email, password, username) => {
      if (!auth || !db) return;
      set({ error: null });

      if (isDisposableEmail(email)) {
        set({ error: 'Tymczasowe adresy email są niedozwolone' });
        return;
      }

      const normalizedUsername = username.trim().toLowerCase();

      try {
        // Create auth user first — Firestore writes require auth
        const cred = await createUserWithEmailAndPassword(auth, email, password);

        // Atomically claim username + create profile
        // If username is already taken, delete the just-created auth user
        const usernameRef = doc(db, 'usernames', normalizedUsername);
        const firestoreDb = db;
        try {
          await runTransaction(firestoreDb, async (tx) => {
            const snap = await tx.get(usernameRef);
            if (snap.exists()) throw new Error('username-taken');
            tx.set(usernameRef, { uid: cred.user.uid, createdAt: Date.now() });
            tx.set(doc(firestoreDb, 'users', cred.user.uid), {
              username: username.trim(),
              email,
              createdAt: Date.now(),
            });
          });
        } catch (txErr: unknown) {
          // Roll back: delete the auth account so email can be reused
          await cred.user.delete().catch(() => {});
          if (txErr instanceof Error && txErr.message === 'username-taken') {
            set({ error: 'Ten nick jest już zajęty' });
          } else {
            set({ error: getErrorMessage(txErr) });
          }
          return;
        }

        let emailError: string | null = null;
        try {
          await sendEmailVerification(cred.user);
        } catch (e) {
          emailError = getErrorMessage(e);
        }
        _pendingFirebaseUser = cred.user;
        // Keep user signed in — needed so resendVerification can call sendEmailVerification
        // onAuthStateChanged handles showing the verification screen for unverified users
        set({ needsVerification: true, pendingEmail: email, ...(emailError ? { error: emailError } : {}) });
      } catch (e: unknown) {
        set({ error: getErrorMessage(e) });
      }
    },

    resendVerification: async () => {
      if (!auth) return;
      set({ error: null });
      try {
        // Prefer auth.currentUser (still signed in) over stale _pendingFirebaseUser
        const target = auth.currentUser ?? _pendingFirebaseUser;
        if (target) {
          await sendEmailVerification(target);
        }
      } catch (e) {
        set({ error: getErrorMessage(e) });
      }
    },

    checkVerification: async () => {
      if (!auth) return;
      set({ error: null });
      try {
        const currentUser = auth.currentUser ?? _pendingFirebaseUser;
        if (!currentUser) return;
        await currentUser.reload();
        if (currentUser.emailVerified) {
          const username = await fetchUsername(currentUser.uid);
          set({ user: toAuthUser(currentUser, username), needsVerification: false });
        } else {
          set({ error: 'Email nie został jeszcze zweryfikowany — sprawdź skrzynkę i kliknij link' });
        }
      } catch (e) {
        set({ error: getErrorMessage(e) });
      }
    },

    logout: async () => {
      if (!auth) return;
      _pendingFirebaseUser = null;
      set({ needsVerification: false, pendingEmail: '' });
      await signOut(auth);
    },

    clearError: () => set({ error: null }),
  };
});
