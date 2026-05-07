import { useState } from "react";

const LogoStar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
    <path d="M12 2L13.09 8.26L19 6L14.74 10.26L21 12L14.74 13.74L19 18L13.09 15.74L12 22L10.91 15.74L5 18L9.26 13.74L3 12L9.26 10.26L5 6L10.91 8.26L12 2Z" />
  </svg>
);

const MODES = [
  {
    id: "tti",
    title: "Text to Image",
    desc: "Transform your words into stunning visuals. Just describe what you imagine — the AI does the rest.",
    btn: "Start Creating",
    iconBg: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(109,40,217,0.3))",
    iconBorder: "rgba(139,92,246,0.4)",
    hoverGlow: "rgba(139,92,246,0.08)",
    hoverBorder: "rgba(139,92,246,0.4)",
    accentColor: "#a78bfa",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="#a78bfa">
        <path d="M12 2L13.09 8.26L19 6L14.74 10.26L21 12L14.74 13.74L19 18L13.09 15.74L12 22L10.91 15.74L5 18L9.26 13.74L3 12L9.26 10.26L5 6L10.91 8.26L12 2Z" />
      </svg>
    ),
    tag: "Most Popular",
  },
  {
    id: "i2i",
    title: "Image to Image",
    desc: "Upload any photo and let AI transform its style, mood, or content while preserving structure.",
    btn: "Upload & Transform",
    iconBg: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(29,78,216,0.3))",
    iconBorder: "rgba(59,130,246,0.4)",
    hoverGlow: "rgba(59,130,246,0.08)",
    hoverBorder: "rgba(59,130,246,0.4)",
    accentColor: "#93c5fd",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5" fill="#93c5fd" stroke="none"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    ),
    tag: null,
  },
  {
    id: "inpaint",
    title: "Inpainting",
    desc: "Paint a mask over any part of your image, then describe what should replace it. Surgical AI editing.",
    btn: "Start Painting",
    iconBg: "linear-gradient(135deg, rgba(20,184,166,0.2), rgba(8,145,178,0.3))",
    iconBorder: "rgba(20,184,166,0.4)",
    hoverGlow: "rgba(20,184,166,0.08)",
    hoverBorder: "rgba(20,184,166,0.4)",
    accentColor: "#5eead4",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5eead4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    ),
    tag: null,
  },
  {
    id: "enhance",
    title: "Image Enhancement",
    desc: "Upscale resolution, fix noise, adjust lighting, and apply professional-grade filters in one click.",
    btn: "Enhance Now",
    iconBg: "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(234,88,12,0.3))",
    iconBorder: "rgba(245,158,11,0.4)",
    hoverGlow: "rgba(245,158,11,0.08)",
    hoverBorder: "rgba(245,158,11,0.4)",
    accentColor: "#fcd34d",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fcd34d" strokeWidth="2">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
      </svg>
    ),
    tag: null,
  },
];

export default function ModePicker({ onTextToImage, onImageToImage, onInpainting, onEnhancement, onBack }) {
  const [hovered, setHovered] = useState(null);
  const handlers = { tti: onTextToImage, i2i: onImageToImage, inpaint: onInpainting, enhance: onEnhancement };

  return (
    <div className="lp-root">
      {/* Nav */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <div className="lp-logo" onClick={onBack} style={{ cursor: "pointer" }}>
            <div className="lp-logo-gem"><LogoStar /></div>
            <span className="lp-logo-text">ImageGen</span>
          </div>
          <div className="lp-nav-links">
            {["Features", "Gallery", "Pricing", "Docs"].map(l => (
              <a key={l} className="lp-nav-link">{l}</a>
            ))}
          </div>
          <div className="lp-nav-actions">
            <button className="lp-btn-ghost">Sign In</button>
            <button className="lp-btn-dark">Get Started</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="mp-hero">
        <div className="mp-hero-glow" />
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          padding: "5px 14px", borderRadius: 999,
          background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.3)",
          fontSize: 12, fontWeight: 500, color: "#a78bfa", marginBottom: 24,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 0 3px rgba(34,197,94,.2)" }} />
          AI Studio — Choose your mode
        </div>
        <h1 className="mp-title">
          What will you <span className="lp-h1-gradient">create today?</span>
        </h1>
        <p className="mp-subtitle">
          Four powerful AI tools. One seamless studio.
        </p>
      </div>

      {/* Cards grid */}
      <main className="mp-main">
        <div className="mp-grid">
          {MODES.map((mode) => {
            const isH = hovered === mode.id;
            return (
              <div
                key={mode.id}
                className="mp-card"
                style={{
                  borderColor: isH ? mode.hoverBorder : "rgba(255,255,255,0.08)",
                  background: isH
                    ? `linear-gradient(135deg, ${mode.hoverGlow} 0%, var(--bg-card) 100%)`
                    : "var(--bg-card)",
                  transform: isH ? "translateY(-4px)" : "none",
                  boxShadow: isH
                    ? `0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px ${mode.hoverBorder}`
                    : "0 2px 8px rgba(0,0,0,0.2)",
                }}
                onMouseEnter={() => setHovered(mode.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => handlers[mode.id]?.()}
              >
                {/* Tag badge */}
                {mode.tag && (
                  <div style={{
                    position: "absolute", top: 18, right: 18,
                    padding: "3px 10px", borderRadius: 999,
                    background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.35)",
                    fontSize: 11, fontWeight: 600, color: "#a78bfa",
                  }}>
                    {mode.tag}
                  </div>
                )}

                {/* Icon */}
                <div className="mp-card-icon" style={{
                  background: mode.iconBg,
                  border: `1px solid ${mode.iconBorder}`,
                }}>
                  {mode.icon}
                </div>

                <h2 className="mp-card-title">{mode.title}</h2>
                <p className="mp-card-desc">{mode.desc}</p>

                <div className="mp-card-btn" style={{ color: isH ? mode.accentColor : "rgba(255,255,255,0.3)" }}>
                  {mode.btn}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                    style={{ transform: isH ? "translateX(4px)" : "none", transition: "transform .2s" }}>
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}