"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const initials = user?.displayName
    ? user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link href="/" className="navbar-logo">
          <div className="navbar-logo-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M9 2L11.5 7H16.5L12.5 10.5L14 15.5L9 12.5L4 15.5L5.5 10.5L1.5 7H6.5L9 2Z"
                fill="white"
              />
            </svg>
          </div>
          Shortlist
        </Link>

        <div className="navbar-actions">
          {user ? (
            <>
              <div className="navbar-user">
                {user.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.photoURL}
                    alt={user.displayName ?? "User"}
                    className="navbar-avatar"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="navbar-avatar-placeholder" aria-hidden="true">
                    {initials}
                  </div>
                )}
                <span>{user.displayName ?? user.email}</span>
              </div>
              <button
                id="navbar-signout-btn"
                className="btn btn-ghost btn-sm"
                onClick={handleSignOut}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/sign-in" className="btn btn-secondary btn-sm">
                Sign in
              </Link>
              <Link href="/sign-in" className="btn btn-primary btn-sm">
                Get started →
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
