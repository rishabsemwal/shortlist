"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { getClientDb } from "@/lib/firebase-client";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import IdeaForm from "@/components/IdeaForm";
import IdeaCard from "@/components/IdeaCard";
import type { Idea } from "@/types";

export default function BoardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [ideasLoading, setIdeasLoading] = useState(true);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/sign-in");
    }
  }, [user, loading, router]);

  // Real-time Firestore listener — loads real ideas from Firebase
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(getClientDb(), "ideas"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched: Idea[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const createdAt =
            data.createdAt instanceof Timestamp
              ? data.createdAt.toMillis()
              : Date.now();
          return {
            id: docSnap.id,
            title: data.title ?? "",
            body: data.body ?? "",
            authorId: data.authorId ?? "",
            authorName: data.authorName ?? "Anonymous",
            createdAt,
            voteCount: data.voteCount ?? 0,
            status: data.status ?? "open",
          };
        });
        setIdeas(fetched);
        setIdeasLoading(false);
      },
      (err) => {
        console.error("Firestore listener error:", err);
        setIdeasLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner spinner-lg" />
        <span>Loading…</span>
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <Navbar />

      <main className="board-page">
        {/* Header */}
        <div className="board-header">
          <div className="container board-header-inner">
            <div>
              <h1 className="board-title">Idea Board</h1>
              <p className="board-subtitle">
                Post your ideas, vote on what matters most. Top ideas shape the
                roadmap.
              </p>
            </div>
            <div
              style={{
                background: "var(--brand-gradient-soft)",
                border: "1px solid rgba(108,59,238,0.2)",
                borderRadius: "var(--radius-md)",
                padding: "0.6rem 1.1rem",
                fontSize: "0.85rem",
                color: "var(--brand-violet-light)",
                fontWeight: 600,
              }}
            >
              {ideas.length} idea{ideas.length !== 1 ? "s" : ""} posted
            </div>
          </div>
        </div>

        <div className="container">
          <div className="board-layout">
            {/* Sidebar — idea form */}
            <aside>
              <IdeaForm />
            </aside>

            {/* Main — ideas list */}
            <section aria-label="Ideas">
              {ideasLoading ? (
                <div className="ideas-list">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="idea-card" aria-hidden="true">
                      <div className="vote-col">
                        <div className="skeleton" style={{ width: 40, height: 40 }} />
                        <div className="skeleton" style={{ width: 20, height: 16 }} />
                      </div>
                      <div className="idea-content">
                        <div className="skeleton" style={{ height: 18, width: "60%", marginBottom: "0.5rem" }} />
                        <div className="skeleton" style={{ height: 14, width: "85%", marginBottom: "0.35rem" }} />
                        <div className="skeleton" style={{ height: 14, width: "40%" }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : ideas.length === 0 ? (
                <div className="ideas-empty">
                  <div className="ideas-empty-icon" aria-hidden="true">💡</div>
                  <p style={{ fontSize: "1rem", color: "var(--text-secondary)" }}>
                    No ideas yet — be the first to post one!
                  </p>
                </div>
              ) : (
                <div className="ideas-list">
                  {ideas.map((idea) => (
                    <IdeaCard key={idea.id} idea={idea} />
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
