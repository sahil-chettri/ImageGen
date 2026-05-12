import { useState, useEffect } from "react";

/* ─── Gallery thumbnails (same emoji-art cards as the landing strip) ─── */
const GALLERY_ITEMS = [
  { bg: "#c8b89a", emoji: "🌸", label: "Bloom" },
  { bg: "#7b6fa0", emoji: "🌌", label: "Galaxy" },
  { bg: "#b56060", emoji: "🦊", label: "Fox" },
  { bg: "#5fa8a0", emoji: "🏙️", label: "City" },
  { bg: "#c8a87a", emoji: "🌅", label: "Sunset" },
  { bg: "#6aaa88", emoji: "🌿", label: "Leaf" },
  { bg: "#d4907a", emoji: "🍊", label: "Citrus" },
  { bg: "#7090b8", emoji: "🐬", label: "Ocean" },
  { bg: "#c8b89a", emoji: "🌸", label: "Bloom" },
  { bg: "#5fa8a0", emoji: "🏔️", label: "Mountain" },
];

/* ─── Mode card data ─── */
const MODES = [
  {
    id: "text-to-image",
    icon: "✦",
    iconBg: "#7c5cbf",
    title: "Text to Image",
    subtitle: "Transform your words into stunning visuals",
    desc: "Just describe what you imagine — the AI does the rest.",
    cta: "Start Creating",
    badge: "Most Popular",
    badgeColor: "#7c5cbf",
  },
  {
    id: "image-to-image",
    icon: "⇄",
    iconBg: "#3a8fbf",
    title: "Image to Image",
    subtitle: "Upload any photo and transform it with AI",
    desc: "Change style, mood, or content while preserving structure.",
    cta: "Upload & Transform",
  },
  {
    id: "inpainting",
    icon: "✏",
    iconBg: "#3aab8a",
    title: "Inpainting",
    subtitle: "Paint a mask, then describe the replacement",
    desc: "Surgical AI editing — change just the part you select.",
    cta: "Start Painting",
  },
  {
    id: "enhancement",
    icon: "◈",
    iconBg: "#d07a2a",
    title: "Image Enhancement",
    subtitle: "Upscale, denoise, and apply pro-grade filters",
    desc: "One-click enhancement with live preview and sliders.",
    cta: "Enhance Now",
  },
];

/* ─── Marquee strip ─── */
function GalleryStrip() {
  return (
    <div style={{
      width: "100%",
      overflow: "hidden",
      padding: "32px 0 0",
      maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
      WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
    }}>
      <div style={{
        display: "flex",
        gap: 12,
        animation: "marquee 30s linear infinite",
        width: "max-content",
      }}>
        {[...GALLERY_ITEMS, ...GALLERY_ITEMS].map((item, i) => (
          <div key={i} style={{
            width: 160,
            height: 120,
            borderRadius: 16,
            background: item.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 52,
            flexShrink: 0,
            boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
          }}>
            {item.emoji}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Single mode card ─── */
function ModeCard({ mode, onClick }) {
  const [hov, setHov] = useState(false);

  return (
    <div
      onClick={() => onClick(mode.id)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: "relative",
        background: hov ? "#fff" : "#faf8f4",
        border: `1.5px solid ${hov ? "#d4c9b8" : "#ede8df"}`,
        borderRadius: 20,
        padding: "28px 28px 24px",
        cursor: "pointer",
        transition: "all 0.22s cubic-bezier(0.34,1.2,0.64,1)",
        transform: hov ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hov
          ? "0 12px 40px rgba(120,90,50,0.12), 0 2px 8px rgba(0,0,0,0.04)"
          : "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      {/* Badge */}
      {mode.badge && (
        <div style={{
          position: "absolute",
          top: -12,
          left: 24,
          background: mode.badgeColor,
          color: "#fff",
          fontSize: 11,
          fontWeight: 600,
          padding: "3px 12px",
          borderRadius: 99,
          fontFamily: "'DM Sans', sans-serif",
          letterSpacing: "0.3px",
        }}>
          {mode.badge}
        </div>
      )}

      {/* Icon */}
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 14,
        background: mode.iconBg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 22,
        color: "#fff",
        marginBottom: 18,
        boxShadow: `0 4px 16px ${mode.iconBg}55`,
        transition: "transform 0.2s, box-shadow 0.2s",
        transform: hov ? "scale(1.08)" : "scale(1)",
      }}>
        {mode.icon}
      </div>

      {/* Text */}
      <h3 style={{
        margin: "0 0 6px",
        fontSize: 18,
        fontWeight: 700,
        color: "#2a1f12",
        fontFamily: "'Playfair Display', Georgia, serif",
        letterSpacing: "-0.3px",
      }}>
        {mode.title}
      </h3>
      <p style={{
        margin: "0 0 14px",
        fontSize: 13,
        color: "#7a6a55",
        fontFamily: "'DM Sans', sans-serif",
        lineHeight: 1.55,
        fontWeight: 500,
      }}>
        {mode.desc}
      </p>

      {/* CTA link */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        fontSize: 13,
        fontWeight: 600,
        color: mode.iconBg,
        fontFamily: "'DM Sans', sans-serif",
        transition: "gap 0.15s",
      }}>
        {mode.cta}
        <span style={{
          display: "inline-block",
          transform: hov ? "translateX(4px)" : "translateX(0)",
          transition: "transform 0.15s",
        }}>→</span>
      </div>
    </div>
  );
}

/* ─── Main ModePicker ─── */
export default function ModePicker({
  onSelect,
  onTextToImage,
  onImageToImage,
  onInpainting,
  onEnhancement,
  user,
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  const handleSelect = (id) => {
    if (onSelect) { onSelect(id); return; }
    if (id === "text-to-image"  && onTextToImage)  { onTextToImage();  return; }
    if (id === "image-to-image" && onImageToImage) { onImageToImage(); return; }
    if (id === "inpainting"     && onInpainting)   { onInpainting();   return; }
    if (id === "enhancement"    && onEnhancement)  { onEnhancement();  return; }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f5f0e8",
      fontFamily: "'DM Sans', sans-serif",
      display: "flex",
      flexDirection: "column",
    }}>

      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=DM+Sans:wght@400;500;600;700&display=swap');

        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .mp-card-appear {
          opacity: 0;
          animation: fadeUp 0.5s ease forwards;
        }
        .mp-card-appear:nth-child(1) { animation-delay: 0.05s; }
        .mp-card-appear:nth-child(2) { animation-delay: 0.12s; }
        .mp-card-appear:nth-child(3) { animation-delay: 0.19s; }
        .mp-card-appear:nth-child(4) { animation-delay: 0.26s; }

        * { box-sizing: border-box; }
      `}</style>

      {/* ── Navbar ── */}
      <nav style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 40px",
        height: 60,
        background: "#f5f0e8",
        borderBottom: "1px solid #e8e0d0",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "linear-gradient(135deg, #c0562a, #e08050)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            color: "#fff",
            fontWeight: 800,
          }}>
            ✦
          </div>
          <span style={{ fontSize: 17, fontWeight: 700, color: "#c0562a", fontFamily: "'Playfair Display', serif" }}>
            ImageGen
          </span>
        </div>

        {/* Nav links */}
        <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
          {["Modes", "Gallery", "Pricing", "Docs"].map(l => (
            <span key={l} style={{
              fontSize: 13,
              color: "#7a6a55",
              cursor: "pointer",
              fontWeight: 500,
              transition: "color 0.15s",
            }}
              onMouseEnter={e => e.target.style.color = "#2a1f12"}
              onMouseLeave={e => e.target.style.color = "#7a6a55"}
            >{l}</span>
          ))}
        </div>

        {/* Auth */}
        <div style={{ display: "flex", gap: 10 }}>
          {user ? (
            <div style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "#c0562a",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 700,
            }}>
              {(user.name || user.email || "U")[0].toUpperCase()}
            </div>
          ) : (
            <>
              <button style={{
                padding: "7px 18px",
                borderRadius: 99,
                border: "1.5px solid #d4c9b8",
                background: "transparent",
                fontSize: 13,
                fontWeight: 600,
                color: "#5a4a35",
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}>Log in</button>
              <button style={{
                padding: "7px 18px",
                borderRadius: 99,
                border: "none",
                background: "#c0562a",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}>Sign up free</button>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero text ── */}
      <div style={{
        textAlign: "center",
        padding: "52px 24px 0",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(20px)",
        transition: "all 0.5s ease",
      }}>
        {/* Pill badge */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "#fff",
          border: "1px solid #e0d8cc",
          borderRadius: 99,
          padding: "5px 16px",
          fontSize: 12,
          fontWeight: 600,
          color: "#7a6a55",
          marginBottom: 24,
          boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
        }}>
          <span style={{ color: "#c0562a" }}>✦</span>
          AI Studio — Choose your mode
        </div>

        {/* Headline */}
        <h1 style={{
          margin: "0 0 16px",
          fontSize: "clamp(36px, 5vw, 56px)",
          fontWeight: 800,
          lineHeight: 1.15,
          color: "#2a1f12",
          fontFamily: "'Playfair Display', Georgia, serif",
          letterSpacing: "-1px",
        }}>
          What will you{" "}
          <em style={{ color: "#c0562a", fontStyle: "italic" }}>create today?</em>
        </h1>

        <p style={{
          margin: 0,
          fontSize: 16,
          color: "#7a6a55",
          fontWeight: 400,
          fontFamily: "'DM Sans', sans-serif",
          maxWidth: 480,
          marginInline: "auto",
          lineHeight: 1.6,
        }}>
          Four powerful AI tools. One seamless studio.
        </p>
      </div>

      {/* ── Mode cards grid ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: 20,
        maxWidth: 900,
        width: "100%",
        margin: "40px auto 0",
        padding: "0 32px",
      }}>
        {MODES.map((mode) => (
          <div key={mode.id} className="mp-card-appear">
            <ModeCard mode={mode} onClick={handleSelect} />
          </div>
        ))}
      </div>

      {/* ── Gallery strip ── */}
      <GalleryStrip />

      {/* ── Footer hint ── */}
      <div style={{
        textAlign: "center",
        padding: "24px 0 40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        fontSize: 13,
        color: "#a89880",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <span>✦ It's free</span>
        <span style={{ width: 1, height: 14, background: "#d4c9b8" }} />
        <span>No credit card</span>
        <span style={{ width: 1, height: 14, background: "#d4c9b8" }} />
        <span>Start in seconds</span>
      </div>
    </div>
  );
}