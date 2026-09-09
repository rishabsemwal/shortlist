"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import {
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  getAdditionalUserInfo,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getClientAuth, getClientDb } from "@/lib/firebase-client";

export interface SignInResult {
  user: User;
  isNewUser: boolean;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<SignInResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getClientAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<SignInResult> => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const result = await signInWithPopup(getClientAuth(), provider);

    const additionalInfo = getAdditionalUserInfo(result);
    const isNewUser = additionalInfo?.isNewUser ?? false;

    // Sync profile to Firestore `users/{uid}` so 1 Google email = 1 user account
    if (result.user) {
      try {
        const userRef = doc(getClientDb(), "users", result.user.uid);
        await setDoc(
          userRef,
          {
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            photoURL: result.user.photoURL,
            lastLoginAt: serverTimestamp(),
            ...(isNewUser ? { createdAt: serverTimestamp() } : {}),
          },
          { merge: true }
        );
      } catch (err) {
        console.warn("Could not sync user profile to Firestore:", err);
      }
    }

    return { user: result.user, isNewUser };
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(getClientAuth());
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
