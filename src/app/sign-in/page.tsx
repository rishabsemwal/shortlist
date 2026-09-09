"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

type AuthMode = "signin" | "signup";

function getFriendlyErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code || "";
  const msg = err instanceof Error ? err.message : "";

  switch (code) {
    case "auth/email-already-in-use":
      return "An account with this email already exists. Please sign in instead.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password must be at least 6 characters long.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password. Please verify your credentials.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please wait a moment and try again.";
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection.";
    case "auth/unauthorized-domain":
      return "Domain not authorized. Please add shortlist-rishabh.vercel.app to Firebase Console → Authentication → Settings → Authorized Domains.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "";
    default:
      if (msg.includes("popup-closed") || msg.includes("cancelled")) return "";
      return msg || "Authentication failed. Please try again.";
  }
}

export default function SignInPage() {
  const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail } =
    useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  const handleEmailAuth = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setStatusMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (mode === "signup" && !displayName.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setProcessing(true);

    try {
      if (mode === "signup") {
        await signUpWithEmail(trimmedEmail, password, displayName);
        setStatusMessage({
          type: "success",
          text: "Account created! Welcome to Shortlist. Redirecting to board…",
        });
      } else {
        await signInWithEmail(trimmedEmail, password);
        setStatusMessage({
          type: "success",
          text: "Welcome back! Redirecting to board…",
        });
      }

      setTimeout(() => {
        router.replace("/board");
      }, 1200);
    } catch (err: unknown) {
      const message = getFriendlyErrorMessage(err);
      if (message) setError(message);
      setProcessing(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError("");
    setStatusMessage(null);
    setProcessing(true);

    try {
      const { isNewUser } = await signInWithGoogle();

      if (mode === "signin") {
        if (isNewUser) {
          setStatusMessage({
            type: "info",
            text: "No existing account found. We've automatically created your account with Google! Redirecting…",
          });
        } else {
          setStatusMessage({
            type: "success",
            text: "Welcome back! Signing you in…",
          });
        }
      } else {
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

      setTimeout(() => {
        router.replace("/board");
      }, 1200);
    } catch (err: unknown) {
      const message = getFriendlyErrorMessage(err);
      if (message) setError(message);
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
        <div
          className="auth-tabs"
          role="tablist"
          aria-label="Authentication Options"
        >
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
          <p className="signin-subtitle" style={{ marginBottom: "1.25rem" }}>
            {isSignIn
              ? "Sign in with your email and password, or continue with Google."
              : "Sign up to start posting ideas, voting, and shaping the roadmap."}
          </p>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleEmailAuth} className="auth-form" noValidate>
          {!isSignIn && (
            <div className="auth-field">
              <label htmlFor="auth-name">Full Name</label>
              <input
                id="auth-name"
                type="text"
                placeholder="Rishabh Semwal"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={processing}
                autoComplete="name"
                required
              />
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="auth-email">Email Address</label>
            <input
              id="auth-email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={processing}
              autoComplete="email"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="auth-password">Password</label>
            <div className="password-input-wrapper">
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                placeholder={isSignIn ? "••••••••" : "At least 6 characters"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={processing}
                autoComplete={isSignIn ? "current-password" : "new-password"}
                minLength={6}
                required
                style={{ paddingRight: "2.75rem" }}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? (
                  /* Eye Off Icon (slashed eye) */
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  /* Eye On Icon */
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            id="email-auth-submit-btn"
            type="submit"
            className="btn-auth-submit"
            disabled={processing}
          >
            {processing ? (
              <span
                className="spinner"
                style={{ width: 16, height: 16, borderWidth: 2 }}
              />
            ) : isSignIn ? (
              "Sign In →"
            ) : (
              "Create Account →"
            )}
          </button>
        </form>

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`alert ${
              statusMessage.type === "success" ? "alert-success" : "alert-info"
            }`}
            style={{ marginTop: "0.85rem" }}
            role="status"
          >
            {statusMessage.text}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            className="alert alert-error"
            style={{ marginTop: "0.85rem" }}
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Divider */}
        <div className="signin-divider">
          <span>or continue with</span>
        </div>

        {/* Google Auth Button (Direct alternative) */}
        <button
          id="google-auth-btn"
          type="button"
          className="btn-google"
          onClick={handleGoogleAuth}
          disabled={processing}
          aria-label={isSignIn ? "Sign in with Google" : "Sign up with Google"}
        >
          {/* Google G icon */}
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
          {isSignIn ? "Sign in with Google" : "Sign up with Google"}
        </button>

        {/* Bottom Mode Switcher */}
        <p
          style={{
            fontSize: "0.84rem",
            color: "var(--text-muted)",
            textAlign: "center",
            marginTop: "1.25rem",
          }}
        >
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
