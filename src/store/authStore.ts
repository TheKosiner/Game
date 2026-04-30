import { create } from 'zustand';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export interface AuthUser {
  uid: string;
  email: string;
  username: string;
}

interface AuthState {
  user: AuthUser | null;
  authLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

async function fetchUsername(uid: string): Promise<string> {
  try {
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

export const useAuthStore = create<AuthState>((set) => {
  onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const username = await fetchUsername(user.uid);
      set({ user: toAuthUser(user, username), authLoading: false });
    } else {
      set({ user: null, authLoading: false });
    }
  });

  return {
    user: null,
    authLoading: true,
    error: null,

    login: async (email, password) => {
      set({ error: null });
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (e) {
        set({ error: getErrorMessage(e) });
      }
    },

    register: async (email, password, username) => {
      set({ error: null });
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', cred.user.uid), {
          username,
          email,
          createdAt: Date.now(),
        });
      } catch (e) {
        set({ error: getErrorMessage(e) });
      }
    },

    logout: async () => {
      await signOut(auth);
    },

    clearError: () => set({ error: null }),
  };
});
