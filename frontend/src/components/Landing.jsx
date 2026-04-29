import { useState, useEffect } from "react";

export default function Landing({ onEnter }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleMouse = (e) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 30,
        y: (e.clientY / window.innerHeight - 0.5) * 30,
      });
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  const features = [
    { icon: "✦", title: "Text to Image", desc: "Describe anything. Watch it materialize in seconds with photorealistic precision." },
    { icon: "◈", title: "Image to Image", desc: "Transform existing visuals into new styles, moods, and dimensions effortlessly." },
    { icon: "⬡", title: "Batch Generate", desc: "Create entire visual libraries from a single prompt with variation control." },
    { icon: "◎", title: "Smart Edit", desc: "Inpaint, outpaint, and refine with surgical AI precision tools." },
  ];

  const stats = [
    { value: "12M+", label: "Images Created" },
    { value: "340K", label: "Active Creators" },
    { value: "0.8s", label: "Avg. Gen Time" },
    { value: "99.9%", label: "Uptime" },
  ];

  return (
    <div className="landing-root">
      {/* Ambient background orbs */}
      <div className="orb orb-1" style={{ transform: `translate(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px)` }} />
      <div className="orb orb-2" style={{ transform: `translate(${-mousePos.x * 0.3}px, ${-mousePos.y * 0.3}px)` }} />
      <div className="orb orb-3" style={{ transform: `translate(${mousePos.x * 0.2}px, ${mousePos.y * 0.8}px)` }} />
      <div className="grid-overlay" />

      {/* NAVBAR */}
      <nav className={`landing-nav ${mounted ? "nav-in" : ""}`}>
        <div className="nav-logo">
          <div className="logo-gem">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" fill="url(#gemGrad)" />
              <defs>
                <linearGradient id="gemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="logo-text">IMAGEGEN</span>
        </div>

        <div className="nav-links">
          {["Features", "Gallery", "Pricing", "Docs"].map((l) => (
            <a key={l} className="nav-link">{l}</a>
          ))}
        </div>

        <div className="nav-actions">
          <button className="btn-ghost-sm">Sign in</button>
          <button className="btn-primary-sm" onClick={onEnter}>Start free</button>
        </div>
      </nav>

      {/* HERO */}
      <section className={`hero ${mounted ? "hero-in" : ""}`}>
        <div className="hero-badge">
          <span className="badge-dot" />
          <span>Now with Flux Ultra — 4K generation</span>
        </div>

        <h1 className="hero-title">
          <span className="title-line">Turn Words</span>
          <span className="title-line accent-line">Into Worlds</span>
        </h1>

        <p className="hero-sub">
          The most powerful AI image studio. Generate, transform,<br />
          and perfect visuals at the speed of thought.
        </p>

        <div className="hero-cta">
          <button className="btn-hero" onClick={onEnter}>
            <span>Start Creating</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
          <button className="btn-outline-hero">
            <span>View Gallery</span>
          </button>
        </div>

        {/* Floating hero visual */}
        <div
          className="hero-visual"
          style={{ transform: `rotateX(${-mousePos.y * 0.15}deg) rotateY(${mousePos.x * 0.15}deg)` }}
        >
          <div className="hero-card main-card">
            <div className="card-glow" />
            <div className="card-inner">
              <div className="gen-preview">
                <div className="preview-shimmer">
                  <div className="shimmer-block s1" />
                  <div className="shimmer-block s2" />
                  <div className="shimmer-block s3" />
                </div>
                <div className="preview-label">Generating...</div>
                <div className="preview-progress">
                  <div className="progress-fill" />
                </div>
              </div>
            </div>
          </div>
          <div className="hero-card side-card side-left">
            <div className="mini-thumb t1" />
          </div>
          <div className="hero-card side-card side-right">
            <div className="mini-thumb t2" />
          </div>
        </div>

        {/* Stats */}
        <div className={`stats-row ${mounted ? "stats-in" : ""}`}>
          {stats.map((s) => (
            <div key={s.value} className="stat-item">
              <span className="stat-value">{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="features-section">
        <div className="section-label">CAPABILITIES</div>
        <h2 className="section-title">Everything you need to create</h2>
        <div className="features-grid">
          {features.map((f, i) => (
            <div key={f.title} className="feature-card" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-name">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
              <div className="feature-arrow">→</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="cta-banner">
        <div className="banner-glow" />
        <div className="banner-content">
          <h2>Ready to create something extraordinary?</h2>
          <p>Join 340,000 creators already using ImageGen</p>
          <button className="btn-hero" onClick={onEnter}>
            <span>Launch Studio</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="footer-logo">
          <div className="logo-gem">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" fill="url(#gemGrad2)" />
              <defs>
                <linearGradient id="gemGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="logo-text" style={{ fontSize: 12 }}>IMAGEGEN</span>
        </div>
        <span className="footer-copy">© 2025 ImageGen. All rights reserved.</span>
      </footer>
    </div>
  );
}