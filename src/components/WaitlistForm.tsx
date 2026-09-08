"use client";

import { useState, FormEvent } from "react";

type Status = "idle" | "loading" | "success" | "duplicate" | "invalid" | "error";

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else if (res.status === 409) {
        setStatus("duplicate");
      } else if (res.status === 400) {
        setStatus("invalid");
      } else {
        setStatus("error");
      }

      // Reset status after 5 seconds so user can try again
      if (res.ok) return; // keep success message
      setTimeout(() => setStatus("idle"), 5000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 5000);
    }
  };

  const feedbackContent: Record<Exclude<Status, "idle" | "loading">, { text: string; type: "success" | "error" }> = {
    success: { text: "🎉 You're on the list! We'll be in touch soon.", type: "success" },
    duplicate: { text: "✓ This email is already on the waitlist.", type: "success" },
    invalid: { text: "⚠️ Please enter a valid email address.", type: "error" },
    error: { text: "✗ Something went wrong. Please try again.", type: "error" },
  };

  return (
    <div className="waitlist-form-wrapper">
      <form id="waitlist-form" className="waitlist-form" onSubmit={handleSubmit} noValidate>
        <input
          id="waitlist-email"
          className="waitlist-input"
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "loading" || status === "success"}
          required
          aria-label="Email address"
        />
        <button
          id="waitlist-submit-btn"
          type="submit"
          className="btn btn-primary"
          disabled={status === "loading" || status === "success"}
        >
          {status === "loading" ? (
            <span className="spinner" aria-label="Loading" />
          ) : (
            "Join waitlist"
          )}
        </button>
      </form>

      <div className="waitlist-feedback" aria-live="polite">
        {status !== "idle" && status !== "loading" && (
          <span
            className={
              feedbackContent[status].type === "success"
                ? "form-success"
                : "form-error"
            }
          >
            {feedbackContent[status].text}
          </span>
        )}
      </div>

      <p className="waitlist-count">Join 1,400+ teams already on the list</p>
    </div>
  );
}
