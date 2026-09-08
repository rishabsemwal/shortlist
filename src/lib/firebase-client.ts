// Firebase Client SDK — safe to expose to the browser (NEXT_PUBLIC_ vars only)
// This file is ONLY imported in "use client" components.
// The lazy init pattern here prevents build-time crashes when env vars are absent.
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Lazy singleton getter — called inside hooks/effects, never at module scope
// so Next.js static analysis doesn't trigger Firebase at build time.
let _app: FirebaseApp | null = null;

function getApp_(): FirebaseApp {
  if (!_app) {
    _app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  }
  return _app;
}

export function getClientAuth(): Auth {
  return getAuth(getApp_());
}

export function getClientDb(): Firestore {
  return getFirestore(getApp_());
}
