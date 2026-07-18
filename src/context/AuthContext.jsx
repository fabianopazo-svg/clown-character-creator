import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from '../firebase';

const AuthContext = createContext(null);

// The owner's Firebase UID, once the admin account exists — set via
// VITE_OWNER_UID in .env. Until that's set, isOwner is always false, which
// fails safe (no accidental edit access) rather than failing open.
const OWNER_UID = import.meta.env.VITE_OWNER_UID || null;

export function AuthProvider({ children }) {
  const [uid, setUid] = useState(null);
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);
  const [ownerSignInError, setOwnerSignInError] = useState(null);
  const [ownerSigningIn, setOwnerSigningIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        setUid(user.uid);
        setReady(true);
      } else {
        // No user at all (including right after signing out of the owner
        // account) — fall back to anonymous. This is what makes
        // signOutOwner() below "just work": it doesn't need its own
        // re-sign-in logic, this listener already does it.
        signInAnonymously(auth).catch(err => {
          setError(err.message);
          setReady(true);
        });
      }
    });
    return unsubscribe;
  }, []);

  // A real, separate identity from the anonymous player/MC system —
  // specifically for accessing the rulebook editor. Signing in here
  // REPLACES the current anonymous session (Firebase Auth only holds one
  // active user at a time), so this is meant to be used from the home
  // screen, not from inside an active room.
  const signInOwner = async (email, password) => {
    setOwnerSigningIn(true);
    setOwnerSignInError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setOwnerSignInError(err.message);
    } finally {
      setOwnerSigningIn(false);
    }
  };

  const signOutOwner = async () => {
    await signOut(auth);
    // onAuthStateChanged above automatically signs back in anonymously.
  };

  const isOwner = !!OWNER_UID && uid === OWNER_UID;

  return (
    <AuthContext.Provider value={{
      uid, error, ready, isOwner,
      signInOwner, signOutOwner, ownerSignInError, ownerSigningIn,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
