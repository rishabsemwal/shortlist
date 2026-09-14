import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ideaId: string }> }
) {
  try {
    const { ideaId } = await params;

    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      return NextResponse.json(
        { error: "Admin SDK not configured on server" },
        { status: 503 }
      );
    }

    // 1. Verify Firebase ID token from Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];

    // Lazily resolve Admin SDK instances at request time (not build time).
    // getAdminFirestore() and getAdminAuthentication() use dynamic import()
    // internally so firebase-admin is never loaded during Next.js build-time
    // page data collection, which prevents the ERR_REQUIRE_ESM error from
    // jose (a pure-ESM transitive dependency of firebase-admin/auth).
    const { getAdminFirestore, getAdminAuthentication } = await import(
      "@/lib/firebase-admin"
    );
    const [db, auth] = await Promise.all([
      getAdminFirestore(),
      getAdminAuthentication(),
    ]);

    // Also lazily import FieldValue to avoid bundling firebase-admin/firestore at build time
    const { FieldValue } = await import("firebase-admin/firestore");

    let uid: string;
    try {
      const decoded = await auth.verifyIdToken(idToken);
      uid = decoded.uid;
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (!ideaId) {
      return NextResponse.json({ error: "Missing ideaId" }, { status: 400 });
    }

    // 2. Atomic transaction: check existing vote → write vote doc → increment count
    const ideaRef = db.collection("ideas").doc(ideaId);
    const voteRef = ideaRef.collection("votes").doc(uid);

    await db.runTransaction(async (tx: FirebaseFirestore.Transaction) => {
      const [ideaSnap, voteSnap] = await Promise.all([
        tx.get(ideaRef),
        tx.get(voteRef),
      ]);

      if (!ideaSnap.exists) {
        throw Object.assign(new Error("Idea not found"), { status: 404 });
      }

      if (voteSnap.exists) {
        throw Object.assign(new Error("Already voted"), { status: 409 });
      }

      tx.set(voteRef, { votedAt: Date.now() });
      tx.update(ideaRef, { voteCount: FieldValue.increment(1) });
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    const status = (err as { status?: number }).status;
    const message = err instanceof Error ? err.message : "Server error";

    if (status === 404) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (status === 409) {
      return NextResponse.json({ error: message }, { status: 409 });
    }

    console.error("[POST /api/ideas/[ideaId]/vote] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
