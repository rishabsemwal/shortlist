// Firebase Admin SDK — SERVER ONLY. Never import this in client components.
// firebase-admin v12+ uses named exports instead of the namespace pattern.
import { initializeApp, getApps, cert, App, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

function getAdminApp(): App {
  // Reuse existing app on hot-reload
  if (getApps().length > 0) {
    return getApp();
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!serviceAccountJson) {
    // During `next build`, Route Handlers are statically analysed.
    // If env var is absent (local dev / CI without credentials), we initialise
    // a no-credential placeholder so the module loads without crashing.
    // The env var MUST be set at runtime (Vercel / .env.local) for requests to succeed.
    console.warn(
      "[firebase-admin] FIREBASE_SERVICE_ACCOUNT is not set. " +
        "API routes requiring Admin SDK will return 500 at runtime until this is configured."
    );
    // Return a minimal app (will error at runtime on actual Firestore/Auth calls)
    return initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "placeholder" });
  }

  const serviceAccount = JSON.parse(serviceAccountJson);

  return initializeApp({
    credential: cert(serviceAccount),
  });
}

export const adminApp = getAdminApp();
export const adminDb = getFirestore(adminApp);
export const adminAuth = getAuth(adminApp);
