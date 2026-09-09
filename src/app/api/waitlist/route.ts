import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { createHash } from "crypto";

export const dynamic = "force-dynamic";

// Validate email format
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      return NextResponse.json(
        { error: "Server Admin SDK not configured." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const email: unknown = body?.email;

    // 1. Validate — not empty
    if (!email || typeof email !== "string" || email.trim() === "") {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 2. Validate — format
    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json(
        { error: "Invalid email address." },
        { status: 400 }
      );
    }

    // 3. Use hashed email as document ID — deterministic, no PII in doc IDs
    const emailHash = createHash("sha256").update(normalizedEmail).digest("hex");
    const docRef = adminDb.collection("waitlist").doc(emailHash);

    // 4. Check for duplicate
    const existing = await docRef.get();
    if (existing.exists) {
      return NextResponse.json(
        { error: "This email is already on the waitlist." },
        { status: 409 }
      );
    }

    // 5. Write via Admin SDK — Firestore rules block all client access to this collection
    await docRef.set({
      email: normalizedEmail,
      joinedAt: Date.now(),
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/waitlist] Error:", err);
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
