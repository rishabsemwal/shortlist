import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ideaId: string }> }
) {
  try {
    const { ideaId } = await params;

    // 1. Verify Firebase ID token from Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    let uid: string;
    try {
      const decoded = await adminAuth.verifyIdToken(idToken);
      uid = decoded.uid;
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (!ideaId) {
      return NextResponse.json({ error: "Missing ideaId" }, { status: 400 });
    }

    // 2. Atomic transaction: check existing vote → write vote doc → increment count
    const ideaRef = adminDb.collection("ideas").doc(ideaId);
    const voteRef = ideaRef.collection("votes").doc(uid);

    await adminDb.runTransaction(async (tx: FirebaseFirestore.Transaction) => {
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
