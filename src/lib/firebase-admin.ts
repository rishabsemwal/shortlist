// Firebase Admin SDK — SERVER ONLY. Never import this in client components.
// FIREBASE_SERVICE_ACCOUNT env var must be the full JSON string of the service account key.
import * as admin from "firebase-admin";

function getAdminApp(): admin.app.App {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!serviceAccountJson) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT env var is not set. " +
        "Generate a key from Firebase Console → Project Settings → Service Accounts."
    );
  }

  const serviceAccount = JSON.parse(serviceAccountJson) as admin.ServiceAccount;

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

export const adminApp = getAdminApp();
export const adminDb = admin.firestore(adminApp);
export const adminAuth = admin.auth(adminApp);
