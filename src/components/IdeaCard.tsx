"use client";

import { useState, useEffect, FormEvent } from "react";
import {
  doc,
  deleteDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
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

  // Author Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(idea.title);
  const [editBody, setEditBody] = useState(idea.body ?? "");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  // Toast notifications (for vote and edit)
  const [toastMessage, setToastMessage] = useState<{
    title: string;
    desc: string;
  } | null>(null);

  const isOwner = user?.uid === idea.authorId;

  // Keep local vote count and title/body in sync with real-time Firestore updates
  useEffect(() => {
    setLocalVoteCount(idea.voteCount);
    if (!isEditing) {
      setEditTitle(idea.title);
      setEditBody(idea.body ?? "");
    }
  }, [idea.voteCount, idea.title, idea.body, isEditing]);

  // Check if current user has already voted on this idea
  useEffect(() => {
    let isMounted = true;
    if (user) {
      const voteRef = doc(getClientDb(), "ideas", idea.id, "votes", user.uid);
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
  }, [idea.id, user?.uid]);

  const handleVote = async () => {
    // If user is not logged in, already voting, or already voted, prevent any action
    if (!user || voting || hasVoted) return;

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
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/ideas/${idea.id}/vote`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // 409 means user had already voted server-side
        if (res.status === 409 || data.error === "Already voted") {
          return;
        }
        // Rollback on unexpected error
        clearTimeout(timer);
        setToastMessage(null);
        setHasVoted(false);
        setLocalVoteCount((prev) => Math.max(0, prev - 1));
        throw new Error(data.error || "Failed to vote");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg !== "Already voted") {
        console.error("Vote failed:", err);
      }
    } finally {
      setVoting(false);
    }
  };

  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !isOwner || !editTitle.trim() || savingEdit) return;

    setSavingEdit(true);
    setEditError("");

    try {
      const ideaRef = doc(getClientDb(), "ideas", idea.id);
      await updateDoc(ideaRef, {
        title: editTitle.trim(),
        body: editBody.trim(),
        updatedAt: serverTimestamp(),
      });

      setIsEditing(false);
      setToastMessage({
        title: "Idea Updated!",
        desc: "Your changes have been saved to the idea board.",
      });

      setTimeout(() => {
        setToastMessage(null);
      }, 3800);
    } catch (err) {
      console.error("Failed to update idea:", err);
      setEditError("Failed to save changes. Please try again.");
    } finally {
      setSavingEdit(false);
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

  const isVoteDisabled = voting || hasVoted === true || !user;

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
        {isEditing ? (
          /* Inline Edit Form for Idea Author */
          <form onSubmit={handleSaveEdit} className="idea-edit-form">
            <div className="form-group" style={{ marginBottom: "0.5rem" }}>
              <label
                className="form-label"
                htmlFor={`edit-title-${idea.id}`}
                style={{ fontSize: "0.75rem" }}
              >
                Title
              </label>
              <input
                id={`edit-title-${idea.id}`}
                type="text"
                className="form-input"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                maxLength={120}
                required
                disabled={savingEdit}
                style={{ padding: "0.45rem 0.75rem", fontSize: "0.9rem" }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: "0.65rem" }}>
              <label
                className="form-label"
                htmlFor={`edit-body-${idea.id}`}
                style={{ fontSize: "0.75rem" }}
              >
                Description
              </label>
              <textarea
                id={`edit-body-${idea.id}`}
                className="form-textarea"
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                maxLength={600}
                rows={3}
                disabled={savingEdit}
                style={{ padding: "0.45rem 0.75rem", fontSize: "0.85rem" }}
              />
            </div>

            {editError && (
              <div
                className="alert alert-error"
                style={{ marginBottom: "0.5rem", padding: "0.4rem 0.75rem", fontSize: "0.8rem" }}
              >
                {editError}
              </div>
            )}

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={savingEdit || !editTitle.trim()}
              >
                {savingEdit ? "Saving…" : "Save Changes"}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setEditTitle(idea.title);
                  setEditBody(idea.body ?? "");
                  setIsEditing(false);
                  setEditError("");
                }}
                disabled={savingEdit}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          /* Standard View */
          <>
            <h3 className="idea-title">{idea.title}</h3>
            {idea.body && <p className="idea-body">{idea.body}</p>}
          </>
        )}

        <div className="idea-meta">
          <span className="idea-author">by {idea.authorName}</span>
          <span className="idea-time">{formatRelativeTime(idea.createdAt)}</span>

          {idea.status === "planned" && (
            <span className="badge badge-planned">📌 Planned</span>
          )}
          {idea.status === "shipped" && (
            <span className="badge badge-shipped">✓ Shipped</span>
          )}

          {/* Actions for Author (Edit & Delete) */}
          {isOwner && (
            <div className="idea-actions">
              {!isEditing && (
                <button
                  id={`edit-btn-${idea.id}`}
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsEditing(true)}
                  disabled={deleting}
                  aria-label="Edit your idea"
                  style={{ padding: "0.25rem 0.65rem", fontSize: "0.78rem" }}
                >
                  Edit
                </button>
              )}
              <button
                id={`delete-btn-${idea.id}`}
                className="btn btn-danger btn-sm"
                onClick={handleDelete}
                disabled={deleting || isEditing}
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
