// Firebase Admin SDK — SERVER ONLY. Never import this in client components.
//
// We use dynamic import() instead of static top-level imports so that
// firebase-admin is never loaded during Next.js build-time page-data
// collection. Static imports caused:
//   "Error: Failed to load external module firebase-admin-<hash>/auth"
//   "ERR_REQUIRE_ESM: require() of ES Module jose/..."
// because Turbopack bundled the sub-path exports into hashed aliases and
// then tried to load them via CJS require(), which fails for ESM-only deps
// like jose@6. Dynamic import() defers resolution to Node's native ESM
// loader at actual request time.

import type { App } from "firebase-admin/app";
import type { Firestore } from "firebase-admin/firestore";
import type { Auth } from "firebase-admin/auth";

let _app: App | null = null;
let _db: Firestore | null = null;
let _auth: Auth | null = null;

export async function getAdminApp(): Promise<App> {
  if (_app) return _app;

  const { initializeApp, getApps, cert, getApp } = await import(
    "firebase-admin/app"
  );

  if (getApps().length > 0) {
    _app = getApp();
    return _app;
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!serviceAccountJson) {
    _app = initializeApp({
      projectId:
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
        "siempi-assignment-rishabh",
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
      projectId:
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
        "siempi-assignment-rishabh",
    });
    return _app;
  }
}

export async function getAdminFirestore(): Promise<Firestore> {
  if (!_db) {
    const { getFirestore } = await import("firebase-admin/firestore");
    _db = getFirestore(await getAdminApp());
  }
  return _db;
}

export async function getAdminAuthentication(): Promise<Auth> {
  if (!_auth) {
    const { getAuth } = await import("firebase-admin/auth");
    _auth = getAuth(await getAdminApp());
  }
  return _auth;
}
