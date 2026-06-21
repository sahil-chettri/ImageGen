import { useEffect, useRef } from "react";

/* ─────────────────────────────────────────────
   Mosaic strip items
   Replace emoji + gradient with real <img> srcs later
───────────────────────────────────────────── */
const MOSAIC = [
  { type: "tall",  bg: "linear-gradient(135deg,#c9a87c,#e8c99a)", emoji: "🌅", label: "Landscape"  },
  { type: "short", bg: "linear-gradient(135deg,#8fb8a4,#b8d4c4)", emoji: "🌿", label: "Nature"     },
  { type: "wide",  bg: "linear-gradient(135deg,#d4896a,#f0b99a)", emoji: "🍊", label: "Food"       },
  { type: "tall",  bg: "linear-gradient(135deg,#6a8fb8,#9ab8d4)", emoji: "🌊", label: "Ocean"      },
  { type: "short", bg: "linear-gradient(135deg,#b8a06a,#d4c09a)", emoji: "🌸", label: "Floral"     },
  { type: "wide",  bg: "linear-gradient(135deg,#9a6ab8,#c4a0d4)", emoji: "🌌", label: "Space"      },
  { type: "tall",  bg: "linear-gradient(135deg,#b86a6a,#d4a0a0)", emoji: "🦊", label: "Wildlife"   },
  { type: "short", bg: "linear-gradient(135deg,#6ab8b0,#9ad4cc)", emoji: "🏙️", label: "Cityscape"  },
];

const FEATURES = [
  { icon: "✍️", bg: "orange", title: "Text to Image",  desc: "Describe anything in words and watch it come to life. Cinematic, anime, oil paint and more styles." },
  { icon: "🖼️", bg: "green",  title: "Image to Image", desc: "Upload a reference and transform it with any style or prompt. Preserve structure, change the aesthetic." },
  { icon: "🖌️", bg: "blue",   title: "Inpainting",     desc: "Paint over any part of an image and let AI fill in the blank. Remove objects or add new elements." },
  { icon: "⚡",  bg: "amber",  title: "Enhancement",    desc: "Upscale and restore images to stunning quality. Fix blurry photos, improve detail and resolution." },
];

const PLANS = [
  {
    name: "Starter", price: "4.99", desc: "100 credits · one-time", featured: false, cta: "Get Starter",
    features: ["100 image generations", "All 4 AI modes", "Gallery storage", "HD downloads"],
  },
  {
    name: "Pro", price: "14.99", desc: "500 credits · one-time", featured: true, cta: "Get Pro",
    features: ["500 image generations", "All 4 AI modes", "RAG Prompt Optimizer", "Priority generation"],
  },
  {
    name: "Unlimited", price: "39.99", desc: "2000 credits · one-time", featured: false, cta: "Get Unlimited",
    features: ["2000 image generations", "All 4 AI modes", "RAG + Docs assistant", "Commercial usage"],
  },
];

const AVATARS = [
  { bg: "#fde8df", l: "A" }, { bg: "#ddf0e5", l: "B" },
  { bg: "#ddedf8", l: "C" }, { bg: "#fef3d0", l: "D" },
  { bg: "#ede7d9", l: "+" },
];

/* ═══════════════════════════════════════════════════════════ */
export default function Landing({ onGetStarted }) {
  const featRefs = useRef([]);

  /* scroll-triggered feature cards */
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const idx = featRefs.current.indexOf(e.target);
            setTimeout(() => e.target.classList.add("ig-feat-visible"), idx * 110);
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    featRefs.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500&family=Caveat:wght@600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --cream:      #f5f0e8;
          --cream-dark: #ede7d9;
          --cream-mid:  #e8e0cf;
          --ink:        #1a1612;
          --ink-soft:   #4a3f35;
          --ink-muted:  #8a7d72;
          --accent:     #e85d3a;
          --green:      #3d6b4f;
        }

        html { scroll-behavior: smooth; }
        body { font-family: 'DM Sans', sans-serif; background: var(--cream) !important; color: var(--ink) !important; overflow-x: hidden; }

        /* NAV */
        .ig-nav {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 48px;
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          background: rgba(245,240,232,0.88);
          backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
          border-bottom: 1px solid rgba(26,22,18,0.07);
          animation: ig-slideDown 0.6s ease both;
        }
        @keyframes ig-slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
        .ig-logo { font-family: 'Instrument Serif', serif; font-size: 22px; font-style: italic; color: var(--ink); letter-spacing: -0.5px; }
        .ig-logo span { color: var(--accent); }
        .ig-nav-links { display: flex; gap: 32px; list-style: none; }
        .ig-nav-links a { font-size: 14px; font-weight: 400; color: var(--ink-soft); text-decoration: none; transition: color 0.2s; cursor: pointer; }
        .ig-nav-links a:hover { color: var(--ink); }
        .ig-nav-actions { display: flex; align-items: center; gap: 12px; }
        .ig-btn-ghost { font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; color: var(--ink-soft); background: none; border: none; cursor: pointer; padding: 8px 4px; transition: color 0.2s; }
        .ig-btn-ghost:hover { color: var(--ink); }
        .ig-btn-pill { font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; background: var(--ink); color: var(--cream); border: none; padding: 10px 22px; border-radius: 999px; cursor: pointer; transition: background 0.2s, transform 0.15s; }
        .ig-btn-pill:hover { background: #2d2520; transform: scale(1.02); }

        /* HERO */
        .ig-hero {
          padding: 160px 48px 80px; text-align: center; position: relative;
          min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;
        }
        .ig-hero::before {
          content: ''; position: absolute; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
          pointer-events: none; z-index: 0; opacity: 0.5;
        }
        .ig-hero > * { position: relative; z-index: 1; }

        /* blobs */
        .ig-blob { position: absolute; border-radius: 50%; filter: blur(100px); opacity: 0.07; pointer-events: none; z-index: 0; }
        .ig-blob-1 { width: 400px; height: 400px; background: #e85d3a; top: 10%; left: -8%; animation: ig-blobFloat 12s ease-in-out infinite; }
        .ig-blob-2 { width: 320px; height: 320px; background: #f2a65a; top: 30%; right: -5%; animation: ig-blobFloat 14s ease-in-out infinite 2s; }
        .ig-blob-3 { width: 250px; height: 250px; background: #3d6b4f; bottom: 15%; left: 30%; animation: ig-blobFloat 10s ease-in-out infinite 4s; }
        @keyframes ig-blobFloat {
          0%,100% { transform: translate(0,0) scale(1); }
          33%     { transform: translate(20px,-20px) scale(1.05); }
          66%     { transform: translate(-15px,15px) scale(0.97); }
        }

        /* badge */
        .ig-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: #f0e8c8; border: 1px solid rgba(26,22,18,0.12);
          color: var(--ink); font-size: 13px; font-weight: 500;
          padding: 7px 18px; border-radius: 999px; margin-bottom: 36px;
          animation: ig-fadeUp 0.7s 0.3s ease both;
        }
        .ig-badge-dot { width: 7px; height: 7px; background: var(--accent); border-radius: 50%; animation: ig-pulse 2s infinite; }
        @keyframes ig-pulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: 0.6; } }

        /* headline */
        .ig-headline-wrap { position: relative; display: inline-block; }
        .ig-h1 {
          font-family: 'Instrument Serif', serif;
          font-size: clamp(52px, 8vw, 96px); line-height: 1.02; letter-spacing: -2px;
          color: var(--ink); max-width: 820px; margin-bottom: 24px;
          animation: ig-fadeUp 0.8s 0.4s ease both;
        }
        .ig-h1 em { font-style: italic; color: var(--accent); }

        /* annotations */
        .ig-anno { font-family: 'Caveat', cursive; font-size: 18px; color: var(--ink-soft); position: absolute; pointer-events: none; }
        .ig-anno-1 { top: 30px; right: -130px; transform: rotate(8deg); animation: ig-fadeUp 1s 1.2s ease both; }
        .ig-anno-2 { bottom: 80px; left: -150px; transform: rotate(-6deg); animation: ig-fadeUp 1s 1.4s ease both; }

        /* sub */
        .ig-sub { font-size: 16px; font-weight: 300; color: var(--ink-muted); line-height: 1.7; max-width: 460px; margin: 0 auto 52px; animation: ig-fadeUp 0.8s 0.55s ease both; }

        /* MOSAIC */
        .ig-mosaic { width: calc(100% + 96px); margin-left: -48px; overflow: hidden; display: flex; gap: 10px; margin-bottom: 52px; animation: ig-fadeUp 0.9s 0.65s ease both; position: relative; }
        .ig-mosaic::before, .ig-mosaic::after { content: ''; position: absolute; top: 0; bottom: 0; width: 100px; z-index: 2; pointer-events: none; }
        .ig-mosaic::before { left: 0; background: linear-gradient(to right, var(--cream), transparent); }
        .ig-mosaic::after  { right: 0; background: linear-gradient(to left,  var(--cream), transparent); }
        .ig-mosaic-track { display: flex; gap: 10px; animation: ig-scrollMosaic 28s linear infinite; will-change: transform; }
        .ig-mosaic-track:hover { animation-play-state: paused; }
        @keyframes ig-scrollMosaic { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }

        .ig-mi { flex-shrink: 0; border-radius: 14px; overflow: hidden; position: relative; cursor: pointer; transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .ig-mi:hover { transform: translateY(-6px) scale(1.02); box-shadow: 0 20px 40px rgba(26,22,18,0.18); }
        .ig-mi.tall  { width: 160px; height: 210px; }
        .ig-mi.short { width: 200px; height: 170px; }
        .ig-mi.wide  { width: 240px; height: 170px; }
        .ig-mi-inner { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 44px; }
        .ig-mi-label { position: absolute; bottom: 10px; left: 10px; background: rgba(245,240,232,0.92); color: var(--ink); font-size: 11px; font-weight: 500; padding: 4px 10px; border-radius: 999px; opacity: 0; transition: opacity 0.2s; pointer-events: none; }
        .ig-mi:hover .ig-mi-label { opacity: 1; }

        /* CTA */
        .ig-cta-row { display: flex; align-items: center; gap: 24px; animation: ig-fadeUp 0.8s 0.8s ease both; }
        .ig-btn-cta { font-family: 'DM Sans', sans-serif; font-size: 16px; font-weight: 500; background: var(--accent); color: #fff; border: none; padding: 16px 40px; border-radius: 999px; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; letter-spacing: -0.2px; box-shadow: 0 8px 24px rgba(232,93,58,0.3); }
        .ig-btn-cta:hover { transform: translateY(-2px) scale(1.03); box-shadow: 0 14px 32px rgba(232,93,58,0.4); }
        .ig-cta-note { font-family: 'Caveat', cursive; font-size: 17px; color: var(--ink-muted); display: flex; align-items: center; gap: 6px; }
        .ig-cta-arrow { display: inline-block; font-size: 22px; animation: ig-arrowBounce 1.5s ease-in-out infinite; }
        @keyframes ig-arrowBounce { 0%,100% { transform: rotate(-10deg) translateX(0); } 50% { transform: rotate(5deg) translateX(4px); } }

        /* social proof */
        .ig-proof { display: flex; align-items: center; gap: 16px; margin-top: 40px; animation: ig-fadeUp 0.8s 0.9s ease both; }
        .ig-avatars { display: flex; }
        .ig-avatar { width: 32px; height: 32px; border-radius: 50%; border: 2px solid var(--cream); margin-left: -10px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 500; color: var(--ink-soft); }
        .ig-avatar:first-child { margin-left: 0; }
        .ig-proof-text { font-size: 13px; color: var(--ink-muted); line-height: 1.5; }
        .ig-proof-text strong { color: var(--ink); font-weight: 500; }
        .ig-stars { color: #f59e0b; font-size: 14px; letter-spacing: 1px; }

        /* FEATURES */
        .ig-features { padding: 120px 48px; background: var(--cream-dark); position: relative; }
        .ig-section-label { font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-muted); margin-bottom: 20px; }
        .ig-section-title { font-family: 'Instrument Serif', serif; font-size: clamp(36px, 5vw, 58px); line-height: 1.1; letter-spacing: -1.5px; color: var(--ink); max-width: 560px; margin-bottom: 64px; }
        .ig-section-title em { font-style: italic; color: var(--accent); }
        .ig-features-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .ig-feat-card { background: var(--cream); border: 1px solid rgba(26,22,18,0.08); border-radius: 20px; padding: 28px 24px; opacity: 0; transform: translateY(30px); transition: opacity 0.5s ease, transform 0.5s ease, box-shadow 0.3s ease; }
        .ig-feat-card.ig-feat-visible { opacity: 1; transform: translateY(0); }
        .ig-feat-card:hover { transform: translateY(-6px); box-shadow: 0 16px 40px rgba(26,22,18,0.1); }
        .ig-feat-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; margin-bottom: 20px; }
        .ig-feat-icon.orange { background: #fde8df; }
        .ig-feat-icon.green  { background: #ddf0e5; }
        .ig-feat-icon.blue   { background: #ddedf8; }
        .ig-feat-icon.amber  { background: #fef3d0; }
        .ig-feat-title { font-family: 'Instrument Serif', serif; font-size: 20px; letter-spacing: -0.5px; color: var(--ink); margin-bottom: 10px; }
        .ig-feat-desc { font-size: 14px; color: var(--ink-muted); line-height: 1.65; font-weight: 300; }

        /* PRICING */
        .ig-pricing { padding: 120px 48px; text-align: center; }
        .ig-pricing .ig-section-title { max-width: 480px; margin: 0 auto; }
        .ig-plans-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; max-width: 900px; margin: 64px auto 0; }
        .ig-plan { background: var(--cream-dark); border: 1px solid rgba(26,22,18,0.08); border-radius: 24px; padding: 36px 28px; text-align: left; position: relative; transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .ig-plan:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(26,22,18,0.1); }
        .ig-plan.featured { background: var(--ink); border-color: var(--ink); }
        .ig-plan-badge { display: inline-block; background: var(--accent); color: #fff; font-size: 11px; font-weight: 500; letter-spacing: 0.06em; padding: 4px 12px; border-radius: 999px; margin-bottom: 20px; text-transform: uppercase; }
        .ig-plan-name { font-family: 'Instrument Serif', serif; font-size: 26px; letter-spacing: -0.5px; margin-bottom: 6px; color: var(--ink); }
        .ig-plan.featured .ig-plan-name { color: var(--cream); }
        .ig-plan-price { font-family: 'Instrument Serif', serif; font-size: 44px; letter-spacing: -2px; color: var(--ink); margin-bottom: 4px; display: flex; align-items: flex-start; gap: 2px; }
        .ig-plan.featured .ig-plan-price { color: var(--cream); }
        .ig-plan-price sup { font-size: 22px; margin-top: 10px; }
        .ig-plan-desc { font-size: 13px; color: var(--ink-muted); margin-bottom: 28px; }
        .ig-plan.featured .ig-plan-desc { color: rgba(245,240,232,0.55); }
        .ig-plan-feats { list-style: none; margin-bottom: 28px; }
        .ig-plan-feat { font-size: 14px; color: var(--ink-soft); padding: 10px 0; border-bottom: 1px solid rgba(26,22,18,0.07); display: flex; align-items: center; gap: 10px; }
        .ig-plan-feat::before { content: '✓'; color: var(--green); font-weight: 700; flex-shrink: 0; }
        .ig-plan.featured .ig-plan-feat { color: rgba(245,240,232,0.8); border-color: rgba(255,255,255,0.1); }
        .ig-plan.featured .ig-plan-feat::before { color: #6fd99a; }
        .ig-btn-plan { width: 100%; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; background: var(--accent); color: #fff; border: none; padding: 14px; border-radius: 999px; cursor: pointer; transition: opacity 0.2s, transform 0.15s; }
        .ig-plan.featured .ig-btn-plan { background: var(--cream); color: var(--ink); }
        .ig-btn-plan:hover { opacity: 0.85; transform: scale(1.01); }

        /* FOOTER */
        .ig-footer { border-top: 1px solid rgba(26,22,18,0.08); padding: 40px 48px; display: flex; align-items: center; justify-content: space-between; background: var(--cream-dark); }
        .ig-footer-logo { font-family: 'Instrument Serif', serif; font-size: 18px; font-style: italic; color: var(--ink); }
        .ig-footer-logo span { color: var(--accent); }
        .ig-footer-copy { font-size: 13px; color: var(--ink-muted); }

        @keyframes ig-fadeUp { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }

        /* RESPONSIVE */
        @media (max-width: 900px) {
          .ig-nav { padding: 18px 24px; }
          .ig-nav-links { display: none; }
          .ig-hero { padding: 120px 24px 60px; }
          .ig-mosaic { width: calc(100% + 48px); margin-left: -24px; }
          .ig-features { padding: 80px 24px; }
          .ig-features-grid { grid-template-columns: 1fr 1fr; }
          .ig-pricing { padding: 80px 24px; }
          .ig-plans-grid { grid-template-columns: 1fr; max-width: 400px; }
          .ig-footer { padding: 28px 24px; flex-direction: column; gap: 12px; text-align: center; }
          .ig-anno-1, .ig-anno-2 { display: none; }
        }
        @media (max-width: 600px) {
          .ig-features-grid { grid-template-columns: 1fr; }
          .ig-cta-row { flex-direction: column; gap: 14px; }
        }
      `}</style>

      {/* ── NAV ── */}
      <nav className="ig-nav">
        <div className="ig-logo">Image<span>Gen</span></div>
        <ul className="ig-nav-links">
          {["Modes", "Gallery", "Pricing", "Docs"].map(l => (
            <li key={l}><a>{l}</a></li>
          ))}
        </ul>
        <div className="ig-nav-actions">
          
          <button className="ig-btn-pill" onClick={onGetStarted}>Get Started</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="ig-hero">
        <div className="ig-blob ig-blob-1" />
        <div className="ig-blob ig-blob-2" />
        <div className="ig-blob ig-blob-3" />

        {/* badge */}
        <div className="ig-badge">
          <span className="ig-badge-dot" />
          Join over 50,000 happy creators
        </div>

        {/* headline + handwritten annotations */}
        <div className="ig-headline-wrap">
          <h1 className="ig-h1">
            Generate Images<br />with <em>Stunning AI</em>
          </h1>

          <span className="ig-anno ig-anno-1">
            Elevate<br />your visuals
            <svg width="60" height="50" viewBox="0 0 60 50" fill="none"
              style={{ position: "absolute", bottom: -30, left: 10, overflow: "visible" }}>
              <path d="M10 5 Q40 10 52 40" stroke="#8a7d72" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
              <path d="M48 38 L52 40 L50 34" stroke="#8a7d72" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
            </svg>
          </span>

          <span className="ig-anno ig-anno-2">
            powered by<br />real AI ✦
          </span>
        </div>

        {/* sub */}
        <p className="ig-sub">
          Transform your ideas into breathtaking visuals with our expert AI models.
          Text to image, style transfer, inpainting — ready to propel your creativity forward.
        </p>

        {/* inline hero CTA */}
        <button
          className="ig-btn-cta"
          onClick={onGetStarted}
          style={{ marginBottom: "52px", animation: "ig-fadeUp 0.8s 0.7s ease both" }}
        >
          Get Started
        </button>

        {/* mosaic strip */}
        <div className="ig-mosaic">
          <div className="ig-mosaic-track">
            {MOSAIC.map((m, i) => (
              <div key={i} className={`ig-mi ${m.type}`} style={{ background: m.bg }}>
                <div className="ig-mi-inner">{m.emoji}</div>
                <span className="ig-mi-label">{m.label}</span>
              </div>
            ))}
            {/* duplicate for seamless CSS loop */}
            {MOSAIC.map((m, i) => (
              <div key={`d${i}`} className={`ig-mi ${m.type}`} style={{ background: m.bg }}>
                <div className="ig-mi-inner">{m.emoji}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="ig-cta-row">
          <span className="ig-cta-note">
            <span className="ig-cta-arrow">↗</span> It's free
          </span>
          <button className="ig-btn-cta" onClick={onGetStarted}>Get Started</button>
          <span className="ig-cta-note">No credit card</span>
        </div>

        {/* social proof */}
        <div className="ig-proof">
          <div className="ig-avatars">
            {AVATARS.map((a, i) => (
              <div key={i} className="ig-avatar" style={{ background: a.bg }}>{a.l}</div>
            ))}
          </div>
          <div className="ig-proof-text">
            <div className="ig-stars">★★★★★</div>
            <strong>50,000+</strong> creators already generating
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="ig-features">
        <p className="ig-section-label">What we offer</p>
        <h2 className="ig-section-title">
          Four <em>powerful</em> modes to create anything
        </h2>
        <div className="ig-features-grid">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="ig-feat-card"
              ref={el => (featRefs.current[i] = el)}
            >
              <div className={`ig-feat-icon ${f.bg}`}>{f.icon}</div>
              <h3 className="ig-feat-title">{f.title}</h3>
              <p className="ig-feat-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="ig-pricing">
        <p className="ig-section-label">Simple pricing</p>
        <h2 className="ig-section-title">
          Pay only for what you <em>create</em>
        </h2>
        <div className="ig-plans-grid">
          {PLANS.map(plan => (
            <div key={plan.name} className={`ig-plan ${plan.featured ? "featured" : ""}`}>
              {plan.featured && <div className="ig-plan-badge">Most popular</div>}
              <h3 className="ig-plan-name">{plan.name}</h3>
              <div className="ig-plan-price"><sup>$</sup>{plan.price}</div>
              <p className="ig-plan-desc">{plan.desc}</p>
              <ul className="ig-plan-feats">
                {plan.features.map(f => (
                  <li key={f} className="ig-plan-feat">{f}</li>
                ))}
              </ul>
              <button className="ig-btn-plan" onClick={onGetStarted}>{plan.cta}</button>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="ig-footer">
        <div className="ig-footer-logo">Image<span>Gen</span></div>
        <div className="ig-footer-copy">© 2025 ImageGen. All rights reserved.</div>
      </footer>
    </>
  );
}