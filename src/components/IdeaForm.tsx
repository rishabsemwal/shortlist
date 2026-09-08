"use client";

import { useState, FormEvent } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getClientDb } from "@/lib/firebase-client";
import { useAuth } from "@/context/AuthContext";

export default function IdeaForm() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      await addDoc(collection(getClientDb(), "ideas"), {
        title: title.trim(),
        body: body.trim(),
        authorId: user.uid,
        authorName: user.displayName ?? user.email ?? "Anonymous",
        createdAt: serverTimestamp(),
        voteCount: 0,
        status: "open",
      });
      setTitle("");
      setBody("");
    } catch (err) {
      console.error("Failed to post idea:", err);
      setError("Failed to post idea. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="idea-form-card">
      <h2 className="idea-form-title">
        <span aria-hidden="true">✦</span> Post an idea
      </h2>

      <form id="idea-form" onSubmit={handleSubmit} noValidate>
        <div className="idea-form-fields">
          <div className="form-group">
            <label className="form-label" htmlFor="idea-title">
              Title
            </label>
            <input
              id="idea-title"
              className="form-input"
              type="text"
              placeholder="A short, clear title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              disabled={submitting}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="idea-body">
              Description
            </label>
            <textarea
              id="idea-body"
              className="form-textarea"
              placeholder="More context, use cases, or examples…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={600}
              disabled={submitting}
              rows={4}
            />
          </div>

          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}

          <button
            id="idea-submit-btn"
            type="submit"
            className="btn btn-primary"
            disabled={submitting || !title.trim()}
          >
            {submitting ? (
              <>
                <span className="spinner" aria-label="Posting" /> Posting…
              </>
            ) : (
              "Post idea →"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
