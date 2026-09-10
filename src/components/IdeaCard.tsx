"use client";

import { useState, useEffect } from "react";
import {
  doc,
  deleteDoc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  collection,
  getCountFromServer,
} from "firebase/firestore";
import { getClientDb } from "@/lib/firebase-client";
import { useAuth } from "@/context/AuthContext";
import type { Idea } from "@/types";

interface IdeaCardProps {
  idea: Idea;
}

function formatRelativeTime(ms: number): string {
  const diff = Date.now() - ms;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function IdeaCard({ idea }: IdeaCardProps) {
  const { user } = useAuth();
  const [hasVoted, setHasVoted] = useState<boolean | null>(null);
  const [voting, setVoting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [localVoteCount, setLocalVoteCount] = useState(idea.voteCount);

  // Toast notifications (for vote and feedback)
  const [toastMessage, setToastMessage] = useState<{
    title: string;
    desc: string;
  } | null>(null);

  const isOwner = user?.uid === idea.authorId;

  // Sync vote count and check if current user has voted
  useEffect(() => {
    let isMounted = true;
    const votesSubCol = collection(getClientDb(), "ideas", idea.id, "votes");

    // Fetch accurate aggregate vote count from subcollection
    getCountFromServer(votesSubCol)
      .then((snap) => {
        if (isMounted) {
          const subCount = snap.data().count;
          setLocalVoteCount((prev) => Math.max(prev, subCount, idea.voteCount));
        }
      })
      .catch(() => {
        if (isMounted) setLocalVoteCount(idea.voteCount);
      });

    // Check if current user has already voted on this idea
    if (user) {
      const voteRef = doc(votesSubCol, user.uid);
      getDoc(voteRef)
        .then((snap) => {
          if (isMounted) {
            setHasVoted(snap.exists());
          }
        })
        .catch(() => {
          if (isMounted) setHasVoted(false);
        });
    } else {
      setHasVoted(false);
    }

    return () => {
      isMounted = false;
    };
  }, [idea.id, idea.voteCount, user?.uid]);

  const handleVote = async () => {
    // If user is not logged in, show prompt
    if (!user) {
      setToastMessage({
        title: "Sign in required",
        desc: "Please sign in with Google to upvote ideas.",
      });
      setTimeout(() => setToastMessage(null), 3800);
      return;
    }

    if (voting || hasVoted) return;

    setVoting(true);
    // Optimistically update UI: show as voted, increment count & show popup message
    setHasVoted(true);
    setLocalVoteCount((prev) => prev + 1);
    setToastMessage({
      title: "Upvoted!",
      desc: `Your vote for "${idea.title}" has been counted.`,
    });

    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 3800);

    try {
      // 1. First attempt: Server API Route (Admin SDK)
      try {
        const idToken = await user.getIdToken();
        const res = await fetch(`/api/ideas/${idea.id}/vote`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        if (res.ok) {
          return; // Success via Admin SDK
        }

        const data = await res.json().catch(() => ({}));
        if (res.status === 409 || data.error === "Already voted") {
          return; // Already voted is fine
        }
      } catch {
        // Fall through to direct client write
      }

      // 2. Fallback: Save vote in votes subcollection (Allowed by Firestore rules)
      const voteRef = doc(getClientDb(), "ideas", idea.id, "votes", user.uid);
      const voteSnap = await getDoc(voteRef);
      if (voteSnap.exists()) {
        return;
      }

      await setDoc(voteRef, { votedAt: Date.now() });

      // 3. Attempt incrementing the idea document's voteCount (optional convenience update)
      const ideaRef = doc(getClientDb(), "ideas", idea.id);
      updateDoc(ideaRef, { voteCount: increment(1) }).catch((err) => {
        // Safe to ignore if console rules haven't been republished yet,
        // because the vote document is already safely recorded!
        console.warn("Direct voteCount increment on idea doc skipped:", err);
      });

    } catch (err: unknown) {
      console.error("Vote failed:", err);
      // Rollback on unexpected error
      clearTimeout(timer);
      setToastMessage(null);
      setHasVoted(false);
      setLocalVoteCount((prev) => Math.max(0, prev - 1));
      const msg = err instanceof Error ? err.message : "";
      alert(`Vote could not be recorded: ${msg || "Please try again"}`);
    } finally {
      setVoting(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !isOwner || deleting) return;
    if (!confirm("Delete this idea? This can't be undone.")) return;

    setDeleting(true);
    try {
      await deleteDoc(doc(getClientDb(), "ideas", idea.id));
    } catch (err) {
      console.error("Delete failed:", err);
      setDeleting(false);
    }
  };

  const isVoteDisabled = voting || hasVoted === true;

  return (
    <article className="idea-card" aria-label={`Idea: ${idea.title}`}>
      {/* Vote column */}
      <div className="vote-col">
        <button
          id={`vote-btn-${idea.id}`}
          className={`vote-btn ${hasVoted ? "voted" : ""}`}
          onClick={handleVote}
          disabled={isVoteDisabled}
          title={
            !user
              ? "Sign in to vote"
              : hasVoted
                ? "You have already upvoted this idea"
                : "Upvote this idea"
          }
          aria-label={
            hasVoted
              ? "You have already upvoted this idea"
              : "Upvote this idea"
          }
          aria-pressed={hasVoted === true}
        >
          {voting ? (
            <span
              className="spinner"
              style={{ width: 14, height: 14, borderWidth: 2 }}
            />
          ) : (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill={hasVoted ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="18 15 12 9 6 15" />
            </svg>
          )}
        </button>
        <span
          className="vote-count"
          aria-label={`${localVoteCount} votes`}
          style={{
            color: hasVoted ? "var(--brand-violet-light)" : "var(--text-primary)",
            transition: "color 0.2s ease",
          }}
        >
          {localVoteCount}
        </span>
      </div>

      {/* Content */}
      <div className="idea-content">
        <h3 className="idea-title">{idea.title}</h3>
        {idea.body && <p className="idea-body">{idea.body}</p>}

        <div className="idea-meta">
          <span className="idea-author">by {idea.authorName}</span>
          <span className="idea-time">{formatRelativeTime(idea.createdAt)}</span>

          {idea.status === "planned" && (
            <span className="badge badge-planned">📌 Planned</span>
          )}
          {idea.status === "shipped" && (
            <span className="badge badge-shipped">✓ Shipped</span>
          )}

          {/* Actions for Author (Delete) */}
          {isOwner && (
            <div className="idea-actions">
              {/* Edit button commented out for now as requested
              <button
                id={`edit-btn-${idea.id}`}
                className="btn btn-secondary btn-sm"
                onClick={() => {}}
                aria-label="Edit your idea"
                style={{ padding: "0.25rem 0.65rem", fontSize: "0.78rem" }}
              >
                Edit
              </button>
              */}
              {/* delete button for author   */}
              <button
                id={`delete-btn-${idea.id}`}
                className="btn btn-danger btn-sm"
                onClick={handleDelete}
                disabled={deleting}
                aria-label="Delete your idea"
                style={{ padding: "0.25rem 0.65rem", fontSize: "0.78rem" }}
              >
                {deleting ? (
                  <span
                    className="spinner"
                    style={{ width: 12, height: 12, borderWidth: 2 }}
                  />
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Popup Toast Message */}
      {toastMessage && (
        <div className="vote-toast-popup" role="status" aria-live="polite">
          <div className="vote-toast-icon">✓</div>
          <div className="vote-toast-content">
            <span className="vote-toast-title">{toastMessage.title}</span>
            <span className="vote-toast-desc">{toastMessage.desc}</span>
          </div>
          <button
            className="vote-toast-close"
            onClick={() => setToastMessage(null)}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      )}
    </article>
  );
}
