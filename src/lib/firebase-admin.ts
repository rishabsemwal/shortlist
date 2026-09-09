// Firebase Admin SDK — SERVER ONLY. Never import this in client components.
import { initializeApp, getApps, cert, App, getApp } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";

let _app: App | null = null;
let _db: Firestore | null = null;
let _auth: Auth | null = null;

export function getAdminApp(): App {
  if (_app) return _app;
  if (getApps().length > 0) {
    _app = getApp();
    return _app;
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!serviceAccountJson) {
    _app = initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "siempi-assignment-rishabh",
    });
    return _app;
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    _app = initializeApp({
      credential: cert(serviceAccount),
    });
    return _app;
  } catch (err) {
    console.warn("[firebase-admin] Service account parse failed:", err);
    _app = initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "siempi-assignment-rishabh",
    });
    return _app;
  }
}

export function getAdminFirestore(): Firestore {
  if (!_db) {
    _db = getFirestore(getAdminApp());
  }
  return _db;
}

export function getAdminAuthentication(): Auth {
  if (!_auth) {
    _auth = getAuth(getAdminApp());
  }
  return _auth;
}

// Lazy proxies: Prevents build-time crashes when collecting route configuration
export const adminDb = new Proxy({} as Firestore, {
  get(_, prop) {
    const db = getAdminFirestore();
    const val = (db as any)[prop];
    return typeof val === "function" ? val.bind(db) : val;
  },
});

export const adminAuth = new Proxy({} as Auth, {
  get(_, prop) {
    const auth = getAdminAuthentication();
    const val = (auth as any)[prop];
    return typeof val === "function" ? val.bind(auth) : val;
  },
});
