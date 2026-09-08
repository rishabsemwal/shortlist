"use client";

import { useState, useEffect } from "react";
import {
  doc,
  deleteDoc,
  getDoc,
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

  const isOwner = user?.uid === idea.authorId;

  // Check vote status from Firestore on first interaction / mount
  const checkVoteStatus = async (): Promise<boolean> => {
    if (!user) return false;
    if (hasVoted !== null) return hasVoted;
    const voteRef = doc(getClientDb(), "ideas", idea.id, "votes", user.uid);
    const snap = await getDoc(voteRef);
    const voted = snap.exists();
    setHasVoted(voted);
    return voted;
  };

  // Pre-load vote status on mount (non-blocking)
  useEffect(() => {
    if (user) {
      checkVoteStatus().catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idea.id, user?.uid]);

  const handleVote = async () => {
    if (!user || voting) return;

    const alreadyVoted = await checkVoteStatus();
    if (alreadyVoted) return; // UI guard (rules enforce this server-side too)

    setVoting(true);
    try {
      // Secure server-side atomic vote via Admin SDK Route Handler
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/ideas/${idea.id}/vote`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 409 || data.error === "Already voted") {
          setHasVoted(true);
          return;
        }
        throw new Error(data.error || "Failed to vote");
      }

      setHasVoted(true);
      setLocalVoteCount((c) => c + 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg !== "Already voted") {
        console.error("Vote failed:", err);
      }
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
    // Don't reset deleting — card will unmount when Firestore listener fires
  };

  return (
    <article className="idea-card" aria-label={`Idea: ${idea.title}`}>
      {/* Vote column */}
      <div className="vote-col">
        <button
          id={`vote-btn-${idea.id}`}
          className={`vote-btn ${hasVoted ? "voted" : ""}`}
          onClick={handleVote}
          disabled={voting || hasVoted === true || !user}
          title={hasVoted ? "Already voted" : "Upvote this idea"}
          aria-label={hasVoted ? "You voted for this idea" : "Upvote this idea"}
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
        <span className="vote-count" aria-label={`${localVoteCount} votes`}>
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

          {/* Delete — only for owner */}
          {isOwner && (
            <div className="idea-actions">
              <button
                id={`delete-btn-${idea.id}`}
                className="btn btn-danger btn-sm"
                onClick={handleDelete}
                disabled={deleting}
                aria-label="Delete your idea"
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
    </article>
  );
}
