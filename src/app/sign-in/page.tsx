"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

type AuthMode = "signin" | "signup";

export default function SignInPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState<{
    type: "info" | "success";
    text: string;
  } | null>(null);

  // Redirect already-signed-in users to board (unless currently showing feedback message)
  useEffect(() => {
    if (!loading && user && !processing && !statusMessage) {
      router.replace("/board");
    }
  }, [user, loading, processing, statusMessage, router]);

  const handleGoogleAuth = async () => {
    setError("");
    setStatusMessage(null);
    setProcessing(true);

    try {
      const { isNewUser } = await signInWithGoogle();

      if (mode === "signin") {
        // User clicked "Sign In"
        if (isNewUser) {
          // They don't have an existing account yet!
          setStatusMessage({
            type: "info",
            text: "No existing account found with this email. We've automatically created your account via Google Sign Up! Redirecting to board…",
          });
        } else {
          setStatusMessage({
            type: "success",
            text: "Welcome back! Signing you in…",
          });
        }
      } else {
        // User clicked "Sign Up"
        if (isNewUser) {
          setStatusMessage({
            type: "success",
            text: "Account created successfully! Welcome to Shortlist. Redirecting…",
          });
        } else {
          setStatusMessage({
            type: "info",
            text: "You already have an active account with this email! Signing you in directly…",
          });
        }
      }

      // Allow user to read the message briefly, then redirect to board
      setTimeout(() => {
        router.replace("/board");
      }, 1800);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("popup-closed") || message.includes("cancelled")) {
        // User closed popup
        setProcessing(false);
        return;
      }
      if (message.includes("unauthorized-domain")) {
        setError(
          "Domain not authorized. Please add shortlist-rishabh.vercel.app (or your current domain) to Firebase Console → Authentication → Settings → Authorized Domains."
        );
      } else {
        setError(message || "Authentication failed. Please try again.");
      }
      setProcessing(false);
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

  const isSignIn = mode === "signin";

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

        {/* Tab Switcher: Sign In vs Sign Up */}
        <div className="auth-tabs" role="tablist" aria-label="Authentication Options">
          <button
            type="button"
            role="tab"
            aria-selected={isSignIn}
            className={`auth-tab ${isSignIn ? "active" : ""}`}
            onClick={() => {
              setMode("signin");
              setError("");
              setStatusMessage(null);
            }}
          >
            <span>🔑</span> Sign In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!isSignIn}
            className={`auth-tab ${!isSignIn ? "active" : ""}`}
            onClick={() => {
              setMode("signup");
              setError("");
              setStatusMessage(null);
            }}
          >
            <span>✨</span> Sign Up
          </button>
        </div>

        {/* Dynamic Header & Badge */}
        <div style={{ textAlign: "center", marginBottom: "1.2rem" }}>
          <div className="auth-badge">
            {isSignIn ? "Existing Users" : "New Accounts"}
          </div>
          <h1 className="signin-title">
            {isSignIn ? "Welcome back" : "Create your account"}
          </h1>
          <p className="signin-subtitle">
            {isSignIn
              ? "Sign in to post ideas, vote, and follow product updates."
              : "Sign up to start proposing features and shaping the roadmap. (1 account per email address)."}
          </p>
        </div>

        {/* Google Auth Button */}
        <button
          id="google-auth-btn"
          className="btn-google"
          onClick={handleGoogleAuth}
          disabled={processing}
          aria-label={isSignIn ? "Sign in with Google" : "Sign up with Google"}
        >
          {processing ? (
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
          {processing
            ? isSignIn
              ? "Signing in…"
              : "Setting up account…"
            : isSignIn
            ? "Sign in with Google"
            : "Sign up with Google"}
        </button>

        {/* Status Message (e.g., existing vs new user notification) */}
        {statusMessage && (
          <div
            className={`alert ${statusMessage.type === "success" ? "alert-success" : "alert-info"}`}
            style={{ marginTop: "1rem" }}
            role="status"
          >
            {statusMessage.text}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="alert alert-error" style={{ marginTop: "1rem" }} role="alert">
            {error}
          </div>
        )}

        <div className="signin-divider">
          <span>or</span>
        </div>

        {/* Bottom Mode Switcher */}
        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", textAlign: "center" }}>
          {isSignIn ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--brand-violet-light)",
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: 0,
                  textDecoration: "underline",
                }}
                onClick={() => {
                  setMode("signup");
                  setError("");
                  setStatusMessage(null);
                }}
              >
                Sign up here
              </button>
            </>
          ) : (
            <>
              Already registered?{" "}
              <button
                type="button"
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--brand-violet-light)",
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: 0,
                  textDecoration: "underline",
                }}
                onClick={() => {
                  setMode("signin");
                  setError("");
                  setStatusMessage(null);
                }}
              >
                Sign in to your account
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
