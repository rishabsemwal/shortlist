"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function SignInPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState("");

  // Redirect already-signed-in users to board
  useEffect(() => {
    if (!loading && user) {
      router.replace("/board");
    }
  }, [user, loading, router]);

  const handleGoogleSignIn = async () => {
    setError("");
    setSigningIn(true);
    try {
      await signInWithGoogle();
      // onAuthStateChanged will trigger and useEffect above will redirect
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Sign-in failed. Please try again.";
      // Suppress "popup closed" errors — user closed the popup intentionally
      if (!message.includes("popup-closed") && !message.includes("cancelled")) {
        setError("Sign-in failed. Please try again.");
      }
    } finally {
      setSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner spinner-lg" />
        <span>Loading…</span>
      </div>
    );
  }

  return (
    <div className="signin-page">
      <div className="signin-card">
        {/* Logo */}
        <div className="signin-logo">
          <div className="signin-logo-icon" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 18 18" fill="none">
              <path
                d="M9 2L11.5 7H16.5L12.5 10.5L14 15.5L9 12.5L4 15.5L5.5 10.5L1.5 7H6.5L9 2Z"
                fill="white"
              />
            </svg>
          </div>
          <span className="signin-logo-name">Shortlist</span>
        </div>

        <h1 className="signin-title">Welcome back</h1>
        <p className="signin-subtitle">
          Sign in to post ideas, vote, and shape the roadmap.
        </p>

        {/* Google Sign-In Button */}
        <button
          id="google-signin-btn"
          className="btn-google"
          onClick={handleGoogleSignIn}
          disabled={signingIn}
          aria-label="Sign in with Google"
        >
          {signingIn ? (
            <span className="spinner" style={{ borderTopColor: "var(--text-secondary)" }} />
          ) : (
            /* Google G icon */
            <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
            </svg>
          )}
          {signingIn ? "Signing in…" : "Continue with Google"}
        </button>

        {/* Error */}
        {error && (
          <div className="alert alert-error" style={{ marginTop: "1rem" }} role="alert">
            {error}
          </div>
        )}

        <div className="signin-divider">
          <span>or</span>
        </div>

        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", textAlign: "center" }}>
          Don&apos;t have an account? Google handles everything — just click above.
        </p>
      </div>
    </div>
  );
}
