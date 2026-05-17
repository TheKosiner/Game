import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getFunctions, type Functions } from 'firebase/functions';

export const isFirebaseConfigured = !!(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID
);

let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _functions: Functions | null = null;

if (isFirebaseConfigured) {
  try {
    const app: FirebaseApp = initializeApp({
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    });
    _auth = getAuth(app);
    _db = getFirestore(app);
    _functions = getFunctions(app, 'us-central1');
  } catch (e) {
    console.warn('Firebase init failed:', e);
  }
}

export const auth = _auth;
export const db = _db;
export const functions = _functions;
