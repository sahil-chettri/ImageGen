import { useState } from "react";

const LogoStar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
    <path d="M12 2L13.09 8.26L19 6L14.74 10.26L21 12L14.74 13.74L19 18L13.09 15.74L12 22L10.91 15.74L5 18L9.26 13.74L3 12L9.26 10.26L5 6L10.91 8.26L12 2Z" />
  </svg>
);

const ArrowRight = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2">
        <path d="M12 2L13.09 8.26L19 6L14.74 10.26L21 12L14.74 13.74L19 18L13.09 15.74L12 22L10.91 15.74L5 18L9.26 13.74L3 12L9.26 10.26L5 6L10.91 8.26L12 2Z" />
      </svg>
    ),
    iconBg: "linear-gradient(135deg,#f3e8ff,#ede9fe)",
    title: "Text to Image",
    desc: "Type a description, get a stunning image in seconds.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M21 15l-5-5L5 21"/>
        <circle cx="8.5" cy="8.5" r="1.5" fill="#3b82f6" stroke="none"/>
      </svg>
    ),
    iconBg: "linear-gradient(135deg,#dbeafe,#e0f2fe)",
    title: "Image to Image",
    desc: "Transform any photo into a new style with AI.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round">
        <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    ),
    iconBg: "linear-gradient(135deg,#ccfbf1,#cffafe)",
    title: "Inpainting",
    desc: "Paint and replace any area in your image with AI.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
      </svg>
    ),
    iconBg: "linear-gradient(135deg,#fef3c7,#ffedd5)",
    title: "Enhancement",
    desc: "Upscale, fix, and improve image quality instantly.",
  },
];

const STATS = [
  { num: "2M+",   label: "Images generated" },
  { num: "50K+",  label: "Active creators" },
  { num: "99.9%", label: "Uptime" },
  { num: "4.9★",  label: "User rating" },
];

const PLANS = [
  {
    name: "Free", price: "$0", per: "/mo", desc: "Perfect for getting started", pro: false,
    features: ["20 generations / month", "Standard quality", "Text to Image only", "Community support"],
    btn: "Get Started Free",
  },
  {
    name: "Pro", price: "$12", per: "/mo", desc: "For creators who need more", pro: true,
    features: ["500 generations / month", "HD quality output", "All generation modes", "All style presets", "Priority queue", "Email support"],
    btn: "Start Pro Plan",
  },
  {
    name: "Enterprise", price: "$49", per: "/mo", desc: "For teams and businesses", pro: false,
    features: ["Unlimited generations", "Ultra HD quality", "All features included", "API access", "Custom style training", "Dedicated support"],
    btn: "Contact Sales",
  },
];

export default function Landing({ onEnter }) {
  const [leaving, setLeaving] = useState(false);

  const go = () => {
    setLeaving(true);
    setTimeout(() => onEnter(), 380);
  };

  return (
    <div className={`lp-root ${leaving ? "lp-leaving" : ""}`}>

      {/* ── Navbar ── */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <div className="lp-logo">
            <div className="lp-logo-gem"><LogoStar /></div>
            <span className="lp-logo-text">ImageGen</span>
          </div>
          <div className="lp-nav-links">
            {["Features", "Gallery", "Pricing", "Docs"].map(l => (
              <a key={l} className="lp-nav-link">{l}</a>
            ))}
          </div>
          <div className="lp-nav-actions">
            <button className="lp-btn-ghost" onClick={go}>Sign In</button>
            <button className="lp-btn-dark"  onClick={go}>Get Started</button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="lp-hero">
        <div className="lp-hero-glow" />
        <div className="lp-hero-glow2" />

        {/* Badge */}
        <div className="lp-badge">
          <span className="lp-badge-dot" />
          Powered by Stable Diffusion XL
        </div>

        <h1 className="lp-h1">
          Create Images From
          <br />
          <span className="lp-h1-gradient">Pure Imagination</span>
        </h1>

        <p className="lp-hero-sub">
          Generate, transform, and enhance images using AI in seconds.
          <br />
          No experience needed.
        </p>

        <div className="lp-hero-btns">
          <button className="lp-btn-primary-lg" onClick={go}>
            Get Started Free
            <ArrowRight size={16} />
          </button>
          <button className="lp-btn-text-lg">
            View Gallery →
          </button>
        </div>

        {/* Preview card */}
        <div className="lp-preview-card">
          <div className="lp-preview-inner">
            <div className="lp-preview-shimmer" />
            <div className="lp-preview-orb lp-preview-orb--purple" />
            <div className="lp-preview-orb lp-preview-orb--blue" />
            <div className="lp-preview-label">
              <span className="lp-preview-dot" />
              AI-powered image generation
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <div className="lp-stats">
        {STATS.map(s => (
          <div key={s.label} className="lp-stat">
            <div className="lp-stat-num">{s.num}</div>
            <div className="lp-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Features ── */}
      <section className="lp-features">
        <p className="lp-section-eyebrow">Capabilities</p>
        <h2 className="lp-section-title">Everything you need to create</h2>
        <div className="lp-feat-grid">
          {FEATURES.map(f => (
            <div key={f.title} className="lp-feat-card">
              <div className="lp-feat-icon" style={{ background: f.iconBg }}>{f.icon}</div>
              <h3 className="lp-feat-title">{f.title}</h3>
              <p className="lp-feat-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="lp-pricing">
        <div className="lp-pricing-glow" />
        <p className="lp-section-eyebrow lp-section-eyebrow--purple">Pricing</p>
        <h2 className="lp-section-title">Simple, honest pricing</h2>
        <p className="lp-pricing-sub">No hidden fees. Cancel anytime.</p>
        <div className="lp-plans">
          {PLANS.map(plan => (
            <div key={plan.name} className={`lp-plan ${plan.pro ? "lp-plan--pro" : ""}`}>
              {plan.pro && <div className="lp-plan-badge">Most Popular</div>}
              <p className="lp-plan-name">{plan.name}</p>
              <div className="lp-plan-price-row">
                <span className="lp-plan-amount">{plan.price}</span>
                <span className="lp-plan-per">{plan.per}</span>
              </div>
              <p className="lp-plan-desc">{plan.desc}</p>
              <hr className="lp-plan-divider" />
              <ul className="lp-plan-features">
                {plan.features.map(feat => (
                  <li key={feat}>
                    <span className={`lp-check ${plan.pro ? "lp-check--pro" : ""}`}>
                      <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                        <path d="M1 3.5L3.5 6L8 1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                    {feat}
                  </li>
                ))}
              </ul>
              <button
                className={`lp-plan-btn ${plan.pro ? "lp-plan-btn--dark" : "lp-plan-btn--ghost"}`}
                onClick={go}
              >
                {plan.btn}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <div className="lp-logo">
          <div className="lp-logo-gem" style={{ width: 26, height: 26, borderRadius: 7 }}>
            <LogoStar />
          </div>
          <span className="lp-logo-text" style={{ fontSize: 15 }}>ImageGen</span>
        </div>
        <span className="lp-footer-copy">© 2025 ImageGen. All rights reserved.</span>
        <div className="lp-footer-links">
          {["Privacy", "Terms", "Docs"].map(l => (
            <a key={l} className="lp-footer-link">{l}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}