import type { Metadata } from "next";
import WaitlistForm from "@/components/WaitlistForm";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Shortlist — Shape the product, together",
  description:
    "Post ideas, vote on what matters most, and watch the roadmap grow. Shortlist keeps your whole team aligned on what to build next.",
};

const features = [
  {
    icon: "💡",
    title: "Capture every idea",
    description:
      "Anyone on your team can post an idea in seconds. No idea gets lost in a Slack thread ever again.",
  },
  {
    icon: "🗳️",
    title: "Vote on what matters",
    description:
      "One vote per person, enforced at the database level. The best ideas rise to the top — naturally.",
  },
  {
    icon: "🗺️",
    title: "Build a living roadmap",
    description:
      "Mark ideas as Planned or Shipped. Your team always knows what's next and what just landed.",
  },
  {
    icon: "🔒",
    title: "Secure by design",
    description:
      "Firestore security rules ensure no one can cheat the vote or tamper with someone else's ideas.",
  },
  {
    icon: "⚡",
    title: "Real-time updates",
    description:
      "See new ideas and vote counts live, the moment they change — no page refresh needed.",
  },
  {
    icon: "📱",
    title: "Works everywhere",
    description:
      "Fully responsive. Whether your team is on a laptop or a phone, the experience is seamless.",
  },
];

export default function LandingPage() {
  return (
    <>
      {/* ── Navbar ── */}
      <header className="navbar">
        <div className="container navbar-inner">
          <Link href="/" className="navbar-logo">
            <div className="navbar-logo-icon">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M9 2L11.5 7H16.5L12.5 10.5L14 15.5L9 12.5L4 15.5L5.5 10.5L1.5 7H6.5L9 2Z"
                  fill="white"
                />
              </svg>
            </div>
            Shortlist
          </Link>
          <nav className="navbar-actions">
            <Link href="/sign-in" className="btn btn-secondary btn-sm">
              Sign in
            </Link>
            <Link href="/sign-in" className="btn btn-primary btn-sm">
              Get started →
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* ── Hero ── */}
        <section className="hero">
          <div className="hero-bg-glow" aria-hidden="true" />
          <div className="container">
            <div className="hero-eyebrow">
              <span>✦</span> Now in early access
            </div>
            <h1 className="hero-title">
              Shape the product,{" "}
              <span className="hero-title-gradient">together.</span>
            </h1>
            <p className="hero-subtitle">
              Shortlist lets your team post ideas, vote on what matters most, and
              watch the roadmap come to life — transparently, in real time.
            </p>

            <WaitlistForm />
          </div>
        </section>

        {/* ── Social Proof ── */}
        <section style={{ paddingBlock: "2rem 0" }}>
          <div className="container" style={{ textAlign: "center" }}>
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "1.5rem",
              }}
            >
              Trusted by teams at
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "2.5rem",
                flexWrap: "wrap",
                opacity: 0.35,
                fontSize: "1rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              {["Acme Corp", "Waverly", "Nimbus", "Stackpath", "Orbit"].map((name) => (
                <span key={name}>{name}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">
                Everything your team needs to{" "}
                <span className="hero-title-gradient">build better.</span>
              </h2>
              <p className="section-subtitle">
                From raw idea to shipped feature — Shortlist covers every step of
                the journey.
              </p>
            </div>

            <div className="features-grid">
              {features.map((f) => (
                <div key={f.title} className="feature-card">
                  <div className="feature-icon" aria-hidden="true">
                    {f.icon}
                  </div>
                  <h3 className="feature-title">{f.title}</h3>
                  <p className="feature-desc">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <div
              className="card-glass"
              style={{
                textAlign: "center",
                padding: "4rem 2rem",
                background:
                  "linear-gradient(135deg, rgba(108,59,238,0.12) 0%, rgba(56,189,248,0.06) 100%)",
                border: "1px solid rgba(108,59,238,0.2)",
              }}
            >
              <h2 className="section-title" style={{ marginBottom: "1rem" }}>
                Ready to get started?
              </h2>
              <p
                className="section-subtitle"
                style={{ marginBottom: "2rem" }}
              >
                Join the waitlist and be the first to try Shortlist when we
                open up access.
              </p>
              <WaitlistForm />
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="container">
          <p>© {new Date().getFullYear()} Shortlist. Built with ♥ and Next.js.</p>
        </div>
      </footer>
    </>
  );
}
