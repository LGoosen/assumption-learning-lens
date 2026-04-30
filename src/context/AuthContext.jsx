import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { auth, db, googleProvider, firebaseEnabled } from '../firebase/config.js';
import { DEMO_USERS } from '../data/mockData.js';

const AuthContext = createContext(null);
const DEMO_STORAGE_KEY = 'all_demo_user_v1';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    let unsub;

    if (firebaseEnabled && auth) {
      unsub = onAuthStateChanged(auth, async (fbUser) => {
        if (!fbUser) {
          setUser(null);
          setLoading(false);
          return;
        }
        try {
          const userRef = doc(db, 'users', fbUser.uid);
          const snap = await getDoc(userRef);
          let profile;
          if (snap.exists()) {
            profile = snap.data();
          } else {
            profile = {
              displayName: fbUser.displayName || 'New user',
              email: fbUser.email || '',
              role: 'student',
              grade: '',
              subjects: [],
              createdAt: serverTimestamp(),
            };
            await setDoc(userRef, profile);
          }
          setUser({ uid: fbUser.uid, ...profile });
        } catch (err) {
          console.error('Auth profile load failed', err);
          setAuthError('Could not load your profile. Please try again.');
        } finally {
          setLoading(false);
        }
      });
    } else {
      try {
        const saved = localStorage.getItem(DEMO_STORAGE_KEY);
        if (saved) setUser(JSON.parse(saved));
      } catch (e) {
        // ignore
      }
      setLoading(false);
    }

    return () => {
      if (unsub) unsub();
    };
  }, []);

  const signInWithGoogle = async () => {
    if (!firebaseEnabled) {
      setAuthError(
        'Google sign-in is not configured. Use the Demo role switcher below to explore the app.'
      );
      return;
    }
    try {
      setAuthError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error(err);
      setAuthError(err.message || 'Sign-in failed.');
    }
  };

  const signInAsDemo = (role) => {
    const candidate = DEMO_USERS.find((u) => u.role === role);
    if (!candidate) return;
    setUser(candidate);
    try {
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(candidate));
    } catch (e) {
      // ignore
    }
  };

  const signOut = async () => {
    if (firebaseEnabled && auth?.currentUser) {
      await fbSignOut(auth);
    }
    setUser(null);
    try {
      localStorage.removeItem(DEMO_STORAGE_KEY);
    } catch (e) {
      // ignore
    }
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      authError,
      firebaseEnabled,
      signInWithGoogle,
      signInAsDemo,
      signOut,
    }),
    [user, loading, authError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}