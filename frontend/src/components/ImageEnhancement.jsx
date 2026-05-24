import { useState, useRef, useCallback } from "react";

const VITE_API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
const BACKEND_URL  = import.meta.env.VITE_API_URL?.replace("/api/v1", "") || "http://localhost:5000";

const T = {
  bg:        "#f5f0e8",
  card:      "#fff",
  border:    "#e8e0d0",
  accent:    "#d07a2a",
  accentDim: "rgba(208,122,42,0.10)",
  accentBrd: "rgba(208,122,42,0.30)",
  text:      "#2a1f12",
  muted:     "#7a6a55",
  faint:     "#a89880",
  inputBg:   "#faf8f4",
  success:   "#16a34a",
  successBg: "#f0fdf4",
  successBd: "#bbf7d0",
  errorBg:   "#fff5f5",
  errorBd:   "#fecaca",
  errorText: "#dc2626",
  ultraBg:   "#fdf4ff",
  ultraBd:   "#e9d5ff",
  ultraText: "#7e22ce",
  ultraAccent:"#9333ea",
};

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=DM+Sans:wght@400;500;600;700&display=swap');`;

const SCALE_OPTIONS = [
  { value: 2, label: "2×", sublabel: "HD",   desc: "1080p quality",      badge: null      },
  { value: 4, label: "4×", sublabel: "2K",   desc: "2048px output",      badge: null      },
  { value: 8, label: "8×", sublabel: "8K",   desc: "Ultra HD · 2 passes", badge: "ULTRA"  },
];

function getToken() {
  return localStorage.getItem("imagegen_token") || "";
}

function SparkleIcon({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2L13.09 8.26L19 6L14.74 10.26L21 12L14.74 13.74L19 18L13.09 15.74L12 22L10.91 15.74L5 18L9.26 13.74L3 12L9.26 10.26L5 6L10.91 8.26L12 2Z" />
    </svg>
  );
}

function Spinner({ size = 18, color = "#fff" }) {
  return (
    <span style={{
      width: size, height: size,
      border: `2.5px solid rgba(255,255,255,0.25)`,
      borderTopColor: color,
      borderRadius: "50%",
      display: "inline-block",
      animation: "ie-spin 0.75s linear infinite",
    }} />
  );
}

function ProviderBadge({ provider }) {
  const map = {
    "stability-enhance-creative": { label: "Stability AI Creative",     color: "#7c3aed", bg: "#f5f3ff" },
    "stability-enhance-8k":       { label: "Stability AI 8K (2-pass)",  color: "#be185d", bg: "#fdf2f8" },
    "replicate-esrgan":           { label: "Replicate Real-ESRGAN",     color: "#0369a1", bg: "#f0f9ff" },
    "replicate-esrgan-8k":        { label: "Replicate ESRGAN 8K",       color: "#0369a1", bg: "#f0f9ff" },
    "mock-enhance":               { label: "Mock Mode",                 color: "#6b7280", bg: "#f9fafb" },
    "mock-enhance-8k":            { label: "Mock Mode 8K",              color: "#6b7280", bg: "#f9fafb" },
  };
  const info = map[provider] || { label: provider, color: T.muted, bg: T.accentDim };
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color: info.color, background: info.bg, padding: "2px 9px", borderRadius: 6, border: `1px solid ${info.color}30` }}>
      ⚡ {info.label}
    </span>
  );
}

export default function ImageEnhancement({ onBack }) {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedUrl,  setUploadedUrl]  = useState(null);
  const [scale,        setScale]        = useState(4);
  const [loading,      setLoading]      = useState(false);
  const [resultUrl,    setResultUrl]    = useState(null);
  const [provider,     setProvider]     = useState(null);
  const [credits,      setCredits]      = useState(null);
  const [error,        setError]        = useState("");
  const [dragOver,     setDragOver]     = useState(false);
  const [sliderPos,    setSliderPos]    = useState(50);
  const [progress,     setProgress]     = useState("");

  const fileInputRef = useRef(null);
  const compareRef   = useRef(null);
  const isDragging   = useRef(false);

  /* ── File handling ───────────────────────────────────────────────────── */
  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) {
      setError("Please upload a valid image file (JPG, PNG, WEBP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File too large. Maximum size is 10MB.");
      return;
    }
    setUploadedFile(file);
    setUploadedUrl(URL.createObjectURL(file));
    setResultUrl(null);
    setProvider(null);
    setError("");
    setSliderPos(50);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }, []);

  const reset = () => {
    setUploadedFile(null);
    setUploadedUrl(null);
    setResultUrl(null);
    setProvider(null);
    setError("");
    setProgress("");
  };

  /* ── Before/After slider ─────────────────────────────────────────────── */
  const onSliderMouseDown  = (e) => { e.preventDefault(); isDragging.current = true; };
  const onSliderTouchStart = ()  => { isDragging.current = true; };
  const updateSlider = (clientX) => {
    if (!isDragging.current || !compareRef.current) return;
    const rect = compareRef.current.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setSliderPos(pct);
  };
  const onCompareDragEnd = () => { isDragging.current = false; };

  /* ── Real AI Enhancement via backend ────────────────────────────────── */
  const runEnhancement = async () => {
    if (!uploadedFile) return;
    const token = getToken();
    if (!token) {
      setError("You must be logged in to use AI enhancement.");
      return;
    }

    setLoading(true);
    setError("");
    setResultUrl(null);

    const is8k = scale >= 8;
    setProgress(
      is8k
        ? "Uploading image — 8K runs two AI passes (~60–80s)…"
        : `Uploading image to server…`
    );

    try {
      const formData = new FormData();
      formData.append("image",       uploadedFile);
      formData.append("scaleFactor", String(scale));

      setProgress(
        is8k
          ? "Pass 1 of 2: 4× AI upscaling in progress…"
          : `Running AI upscaling at ${scale}× — this takes 10–30s…`
      );

      const res = await fetch(`${VITE_API_URL}/generate/enhance`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}` },
        body:    formData,
      });

      // For 8K, update progress text after a short delay to reflect pass 2
      if (is8k) {
        setTimeout(() => {
          if (loading) setProgress("Pass 2 of 2: Final 2× refinement pass…");
        }, 25000);
      }

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 402) throw new Error("Not enough credits. Please top up your account.");
        if (res.status === 401) throw new Error("Session expired. Please log in again.");
        throw new Error(data.message || `Server error (${res.status})`);
      }

      if (!data.success) throw new Error(data.message || "Enhancement failed.");

      let finalUrl = data.imageUrl;
      if (finalUrl.startsWith("/")) finalUrl = `${BACKEND_URL}${finalUrl}`;

      setResultUrl(finalUrl);
      setProvider(data.provider);
      setCredits(data.creditsRemaining);
      setSliderPos(50);
      setProgress("");
    } catch (err) {
      setError(err.message || "Enhancement failed. Please try again.");
      setProgress("");
    } finally {
      setLoading(false);
    }
  };

  /* ── Download ─────────────────────────────────────────────────────────── */
  const download = async () => {
    const src = resultUrl || uploadedUrl;
    if (!src) return;
    const label = scale >= 8 ? "8K" : scale >= 4 ? "2K" : "HD";
    try {
      const res  = await fetch(src);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `enhanced_${scale}x_${label}_${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      const a    = document.createElement("a");
      a.href     = src;
      a.download = `enhanced_${scale}x_${label}_${Date.now()}.png`;
      a.click();
    }
  };

  /* ── Helpers ──────────────────────────────────────────────────────────── */
  const scaleLabel = scale >= 8 ? "8K Ultra HD" : scale >= 4 ? "2K" : "HD";
  const creditCost = scale >= 8 ? 2 : 1;

  /* ── Styles ──────────────────────────────────────────────────────────── */
  const btnPrimary = (disabled) => ({
    width: "100%", padding: "14px", borderRadius: 14, border: "none",
    background: disabled
      ? T.border
      : scale >= 8
        ? `linear-gradient(135deg, #9333ea 0%, #be185d 100%)`
        : `linear-gradient(135deg, ${T.accent} 0%, #e09050 100%)`,
    color:      disabled ? T.faint : "#fff",
    fontSize:   14, fontWeight: 800, cursor: disabled ? "not-allowed" : "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
    fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.2px",
    boxShadow:  disabled ? "none" : scale >= 8
      ? "0 4px 20px rgba(147,51,234,0.40)"
      : "0 4px 20px rgba(208,122,42,0.40)",
    transition: "all .2s",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100vw", overflow: "hidden", background: T.bg, fontFamily: "'DM Sans', sans-serif", color: T.text }}>
      <style>{`
        ${FONTS}
        @keyframes ie-spin    { to { transform: rotate(360deg); } }
        @keyframes ie-fade    { from { opacity:0; transform:scale(0.97); } to { opacity:1; transform:scale(1); } }
        @keyframes ie-pulse   { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        @keyframes ie-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        * { box-sizing: border-box; }
      `}</style>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ══ LEFT PANEL ══ */}
        <div style={{ width: 390, borderRight: `1px solid ${T.border}`, overflowY: "auto", background: T.card, display: "flex", flexDirection: "column", flexShrink: 0 }}>

          {/* Header */}
          <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${T.accent}, #e09050)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 16px ${T.accentDim}` }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: T.text, fontFamily: "'Playfair Display', serif", letterSpacing: "-0.3px" }}>Image Enhancement</h2>
              <p style={{ margin: 0, fontSize: 12, color: T.muted }}>Real AI upscaling via ESRGAN · up to 8K</p>
            </div>
          </div>

          <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Error */}
            {error && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px", background: T.errorBg, border: `1.5px solid ${T.errorBd}`, borderRadius: 10, fontSize: 13, color: T.errorText }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span style={{ flex: 1, lineHeight: 1.5 }}>{error}</span>
                <button onClick={() => setError("")} style={{ background: "none", border: "none", cursor: "pointer", color: T.errorText, padding: 0, fontSize: 16, lineHeight: 1 }}>✕</button>
              </div>
            )}

            {/* Credits remaining */}
            {credits !== null && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: T.successBg, border: `1.5px solid ${T.successBd}`, borderRadius: 10, fontSize: 13, color: T.success, fontWeight: 600 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Enhancement complete! {credits} credit{credits !== 1 ? "s" : ""} remaining.
              </div>
            )}

            {/* ══ MAIN FEATURE CARD ══ */}
            <div style={{
              background: scale >= 8
                ? "linear-gradient(135deg, #fdf4ff 0%, #f5f3ff 100%)"
                : "linear-gradient(135deg, #fff8f2 0%, #fff3e8 100%)",
              border: `2px solid ${scale >= 8 ? T.ultraBd : T.accentBrd}`,
              borderRadius: 18, padding: "18px 18px 16px", position: "relative", overflow: "hidden",
              transition: "all .3s",
            }}>
              <div style={{ position: "absolute", top: -30, right: -30, width: 110, height: 110, background: scale >= 8 ? "radial-gradient(circle, rgba(147,51,234,0.15), transparent 70%)" : "radial-gradient(circle, rgba(208,122,42,0.15), transparent 70%)", pointerEvents: "none" }} />

              {/* Badges */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: scale >= 8 ? "linear-gradient(135deg, #9333ea, #be185d)" : `linear-gradient(135deg, ${T.accent}, #e09050)`, color: "#fff", fontSize: 10.5, fontWeight: 800, padding: "3px 10px", borderRadius: 99, letterSpacing: "0.5px" }}>
                  <SparkleIcon size={10} color="#fff" /> {scale >= 8 ? "8K ULTRA HD" : "AI UPSCALING"}
                </div>
                <div style={{ fontSize: 10.5, color: scale >= 8 ? T.ultraAccent : T.accent, fontWeight: 600, background: scale >= 8 ? T.ultraBg : "rgba(208,122,42,0.12)", padding: "3px 9px", borderRadius: 99, border: `1px solid ${scale >= 8 ? T.ultraBd : T.accentBrd}` }}>
                  {scale >= 8 ? "2-Pass Pipeline" : "ESRGAN Model"}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 13, background: scale >= 8 ? "linear-gradient(135deg, #9333ea, #be185d)" : `linear-gradient(135deg, ${T.accent}, #e09050)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: scale >= 8 ? "0 4px 16px rgba(147,51,234,0.35)" : "0 4px 16px rgba(208,122,42,0.35)", transition: "all .3s" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: T.text, fontFamily: "'Playfair Display', serif", letterSpacing: "-0.3px", marginBottom: 4 }}>
                    {scale >= 8 ? "Low → True 8K Quality" : "Low → HD Quality"}
                  </div>
                  <div style={{ fontSize: 12.5, color: T.muted, lineHeight: 1.6 }}>
                    {scale >= 8
                      ? "Two chained AI passes: 4× creative upscale then a 2× refinement pass. Reconstructs extreme detail at cinema-grade 8K resolution."
                      : "Real AI super-resolution using ESRGAN on the backend. Recovers fine detail, sharpens edges, reduces compression artifacts — not just a resize."}
                  </div>
                </div>
              </div>

              {/* Scale selector */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8 }}>Upscale Factor</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {SCALE_OPTIONS.map(opt => {
                    const active = scale === opt.value;
                    const is8    = opt.value === 8;
                    return (
                      <button key={opt.value} onClick={() => setScale(opt.value)} style={{
                        flex: 1, padding: "11px 4px", borderRadius: 12,
                        border: `2px solid ${active ? (is8 ? T.ultraAccent : T.accent) : T.border}`,
                        background: active
                          ? is8
                            ? "linear-gradient(135deg, #9333ea, #be185d)"
                            : `linear-gradient(135deg, ${T.accent}, #e09050)`
                          : "transparent",
                        color: active ? "#fff" : is8 ? T.ultraAccent : T.muted,
                        fontSize: 14, fontWeight: 700, cursor: "pointer",
                        fontFamily: "'DM Sans', sans-serif", transition: "all .18s",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                        position: "relative",
                      }}>
                        {opt.badge && (
                          <span style={{ position: "absolute", top: -8, right: -4, fontSize: 8, fontWeight: 800, background: active ? "#fff" : T.ultraAccent, color: active ? T.ultraAccent : "#fff", padding: "1px 5px", borderRadius: 99, letterSpacing: "0.5px" }}>
                            {opt.badge}
                          </span>
                        )}
                        <span>{opt.label}</span>
                        <span style={{ fontSize: 10, fontWeight: 500, opacity: 0.85 }}>{opt.sublabel}</span>
                        <span style={{ fontSize: 9, opacity: 0.75, textAlign: "center", lineHeight: 1.3 }}>{opt.desc}</span>
                      </button>
                    );
                  })}
                </div>

                {/* 8K warning banner */}
                {scale >= 8 && (
                  <div style={{ marginTop: 10, padding: "10px 12px", background: T.ultraBg, border: `1.5px solid ${T.ultraBd}`, borderRadius: 10, fontSize: 12, color: T.ultraText, lineHeight: 1.55 }}>
                    <div style={{ fontWeight: 700, marginBottom: 3 }}>⚠️ 8K Ultra HD — what to expect</div>
                    <div>Runs <strong>2 chained AI passes</strong> on the server (~60–80 s total). Input should be under 1024×1024 for best results. Uses <strong>2 credits</strong>.</div>
                  </div>
                )}
              </div>

              {/* What the AI does */}
              <div style={{ background: scale >= 8 ? "rgba(147,51,234,0.07)" : "rgba(208,122,42,0.07)", borderRadius: 10, padding: "10px 12px", marginBottom: 14, transition: "all .3s" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: scale >= 8 ? T.ultraAccent : T.accent, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {scale >= 8 ? "8K Two-Pass Pipeline" : "What happens on the server"}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {scale >= 8 ? [
                    "🔬 Pass 1: ESRGAN creative 4× — recovers maximum detail",
                    "✨ Pass 2: 2× refinement — sharpens without over-generating",
                    "🎬 Output: cinema-grade ~7680×4320 lossless PNG",
                    "🎨 Reduces all JPEG/GIF/WebP compression artifacts",
                  ].map(item => (
                    <div key={item} style={{ fontSize: 11.5, color: T.muted }}>{item}</div>
                  )) : [
                    "🔬 ESRGAN neural network reconstructs pixel detail",
                    "✨ Recovers fur, texture, fine edges from blur",
                    "🎨 Reduces JPEG/GIF compression artifacts",
                    "📐 Outputs lossless PNG at true HD resolution",
                  ].map(item => (
                    <div key={item} style={{ fontSize: 11.5, color: T.muted }}>{item}</div>
                  ))}
                </div>
              </div>

              {/* Enhance button */}
              <button onClick={runEnhancement} disabled={!uploadedFile || loading} style={btnPrimary(!uploadedFile || loading)}>
                {loading ? (
                  <><Spinner /> {progress || (scale >= 8 ? "Processing 8K (two passes)…" : "Processing…")}</>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                    {uploadedFile
                      ? `Enhance to ${scale}× ${scaleLabel} with AI`
                      : "Upload an image first"}
                  </>
                )}
              </button>

              {/* Loading progress note */}
              {loading && (
                <div style={{ marginTop: 10, fontSize: 11.5, color: scale >= 8 ? T.ultraText : T.muted, textAlign: "center", animation: "ie-pulse 1.5s ease-in-out infinite" }}>
                  {progress}
                </div>
              )}

              {/* Pills */}
              <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
                {[
                  "🤖 Real ESRGAN AI",
                  "☁️ Server-side",
                  "🖼 Lossless PNG",
                  scale >= 8 ? "⚡ 2 credits" : "⚡ 1 credit",
                  ...(scale >= 8 ? ["🎬 ~8K output"] : []),
                ].map(tag => (
                  <span key={tag} style={{ fontSize: 10.5, color: scale >= 8 ? T.ultraText : T.muted, background: scale >= 8 ? T.ultraBg : "rgba(208,122,42,0.07)", border: `1px solid ${scale >= 8 ? T.ultraBd : T.accentBrd}`, padding: "3px 9px", borderRadius: 99, fontWeight: 500 }}>{tag}</span>
                ))}
              </div>
            </div>

            {/* ── UPLOAD ── */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 10 }}>Upload Image</div>
              {!uploadedUrl ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={onDrop}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  style={{ border: `2px dashed ${dragOver ? T.accent : T.border}`, borderRadius: 16, padding: "32px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, cursor: "pointer", background: dragOver ? T.accentDim : T.inputBg, transition: "all .2s", textAlign: "center" }}
                  onMouseEnter={e => { if (!dragOver) { e.currentTarget.style.borderColor = T.accentBrd; e.currentTarget.style.background = T.accentDim; } }}
                  onMouseLeave={e => { if (!dragOver) { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.inputBg; } }}
                >
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: T.accentDim, display: "flex", alignItems: "center", justifyContent: "center", color: T.accent }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>Drag & drop or click to upload</div>
                  <div style={{ fontSize: 12, color: T.faint }}>PNG, JPG, WEBP · max 10MB</div>
                  <div style={{ fontSize: 11.5, color: T.accent, fontWeight: 600, background: T.accentDim, padding: "4px 14px", borderRadius: 99, border: `1px solid ${T.accentBrd}` }}>
                    Low quality images get the best results
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 13px", background: T.inputBg, border: `1.5px solid ${T.border}`, borderRadius: 12 }}>
                  <img src={uploadedUrl} alt="uploaded" style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover", border: `1px solid ${T.border}`, flexShrink: 0 }} />
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{uploadedFile?.name}</div>
                    <div style={{ fontSize: 11.5, color: T.faint, marginTop: 2 }}>
                      <span style={{ color: T.success, fontWeight: 600 }}>✓ Ready to enhance</span>
                      {uploadedFile && <span style={{ marginLeft: 6 }}>· {(uploadedFile.size / 1024).toFixed(0)} KB</span>}
                    </div>
                  </div>
                  <button onClick={reset} style={{ background: T.errorBg, border: `1px solid ${T.errorBd}`, borderRadius: 7, padding: "5px 7px", color: T.errorText, cursor: "pointer", display: "flex" }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              )}
            </div>

            {/* Tips */}
            <div style={{ background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8 }}>Tips for best results</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {[
                  "📷 Works best on photos with faces, animals, or nature",
                  "🖼 Input should be under 1024×1024 for max output quality",
                  "🎯 Blurry / compressed images benefit the most",
                  "⏱ 2× and 4× take 10–30s · 8K takes 60–80s (2 passes)",
                  "💳 8K costs 2 credits · 2× and 4× cost 1 credit each",
                ].map(tip => (
                  <div key={tip} style={{ fontSize: 12, color: T.muted, lineHeight: 1.5 }}>{tip}</div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* ══ RIGHT PANEL — PREVIEW ══ */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Preview header */}
          <div style={{ padding: "16px 28px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 12, flexShrink: 0, background: T.card }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: T.text, fontFamily: "'Playfair Display', serif" }}>
              {resultUrl ? "Enhanced Result" : "Preview"}
            </span>
            {resultUrl && (
              <>
                <span style={{ fontSize: 11.5, color: T.success, background: T.successBg, border: `1px solid ${T.successBd}`, padding: "2px 9px", borderRadius: 6, fontWeight: 600 }}>✓ Enhanced</span>
                {provider && <ProviderBadge provider={provider} />}
                {scale >= 8 && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.ultraText, background: T.ultraBg, border: `1px solid ${T.ultraBd}`, padding: "2px 9px", borderRadius: 6 }}>
                    🎬 8K Ultra HD
                  </span>
                )}
              </>
            )}
            <div style={{ flex: 1 }} />
            {(resultUrl || uploadedUrl) && (
              <button
                onClick={download}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all .15s",
                  background: resultUrl
                    ? scale >= 8
                      ? "linear-gradient(135deg, #9333ea, #be185d)"
                      : `linear-gradient(135deg, ${T.accent}, #e09050)`
                    : T.inputBg,
                  border: `1.5px solid ${resultUrl ? "transparent" : T.border}`,
                  color: resultUrl ? "#fff" : T.muted,
                  boxShadow: resultUrl
                    ? scale >= 8
                      ? "0 3px 14px rgba(147,51,234,0.35)"
                      : "0 3px 14px rgba(208,122,42,0.35)"
                    : "none",
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                {resultUrl ? `Download ${scaleLabel}` : "Download"}
              </button>
            )}
          </div>

          {/* Preview body */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", overflow: "hidden", position: "relative", background: "#f8f5f0" }}>

            {/* Empty state */}
            {!uploadedUrl && !loading && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center", animation: "ie-fade 0.4s ease" }}>
                <div style={{ width: 80, height: 80, borderRadius: 24, background: T.accentDim, border: `1.5px solid ${T.accentBrd}`, display: "flex", alignItems: "center", justifyContent: "center", color: T.accent }}>
                  <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                </div>
                <div>
                  <p style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: T.text, fontFamily: "'Playfair Display', serif" }}>Upload a low-quality image</p>
                  <p style={{ margin: 0, fontSize: 13, color: T.faint, maxWidth: 300, lineHeight: 1.6 }}>The AI will reconstruct detail, sharpen edges, and output a true HD image — up to 8K Ultra HD. Not just a resize.</p>
                </div>
              </div>
            )}

            {/* Loading state */}
            {loading && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, animation: "ie-fade 0.3s ease" }}>
                <div style={{ position: "relative", width: 64, height: 64 }}>
                  <div style={{ width: 64, height: 64, border: `3px solid ${scale >= 8 ? "rgba(147,51,234,0.15)" : T.accentDim}`, borderTopColor: scale >= 8 ? T.ultraAccent : T.accent, borderRadius: "50%", animation: "ie-spin 0.9s linear infinite" }} />
                  <div style={{ position: "absolute", inset: 12, border: `3px solid ${scale >= 8 ? "rgba(190,24,93,0.1)" : "rgba(208,122,42,0.1)"}`, borderTopColor: scale >= 8 ? "#be185d" : "#e09050", borderRadius: "50%", animation: "ie-spin 1.6s linear infinite reverse" }} />
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 700, color: T.text, fontFamily: "'Playfair Display', serif" }}>
                    {scale >= 8 ? "AI is generating 8K output" : "AI is upscaling your image"}
                  </p>
                  <p style={{ margin: "0 0 6px", fontSize: 13, color: T.muted, animation: "ie-pulse 1.5s ease-in-out infinite" }}>
                    {progress || (scale >= 8 ? "Running two-pass ESRGAN pipeline…" : "Processing with ESRGAN neural network…")}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: T.faint }}>
                    {scale >= 8 ? "8K typically takes 60–80 seconds (two passes)" : "This typically takes 10–30 seconds"}
                  </p>
                </div>
                {uploadedUrl && (
                  <img src={uploadedUrl} alt="Processing" style={{ maxWidth: 380, maxHeight: 280, borderRadius: 12, opacity: 0.35, objectFit: "contain", filter: "blur(2px)", border: `1px solid ${T.border}` }} />
                )}
              </div>
            )}

            {/* Uploaded but not yet enhanced — show preview */}
            {uploadedUrl && !loading && !resultUrl && (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, animation: "ie-fade 0.3s ease" }}>
                <img src={uploadedUrl} alt="Preview" style={{ width: "480px", height: "480px", borderRadius: 16, boxShadow: "0 8px 40px rgba(42,31,18,0.12)", objectFit: "contain", background: "#f0ebe3" }} />
                <div style={{ fontSize: 12.5, color: T.faint, background: "rgba(255,255,255,0.8)", padding: "6px 16px", borderRadius: 99, backdropFilter: "blur(8px)" }}>
                  Original · Click "Enhance" to upscale with AI
                </div>
              </div>
            )}

            {/* Before / After comparison slider */}
            {uploadedUrl && !loading && resultUrl && (
              <div
                ref={compareRef}
                onMouseMove={e => updateSlider(e.clientX)}
                onMouseUp={onCompareDragEnd}
                onMouseLeave={onCompareDragEnd}
                onTouchMove={e => updateSlider(e.touches[0].clientX)}
                onTouchEnd={onCompareDragEnd}
                style={{ position: "relative", width: "100%", height: "100%", borderRadius: 16, overflow: "hidden", cursor: "ew-resize", userSelect: "none", boxShadow: "0 8px 40px rgba(42,31,18,0.12)", animation: "ie-fade 0.5s ease" }}
              >
                {/* AFTER — full base */}
                <img src={resultUrl} alt="Enhanced" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", display: "block", background: "#f8f5f0" }} />

                {/* BEFORE — clipped */}
                <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${100 - sliderPos}% 0 0)`, willChange: "clip-path" }}>
                  <img src={uploadedUrl} alt="Original" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", background: "#f8f5f0" }} />
                </div>

                {/* Divider */}
                <div style={{ position: "absolute", top: 0, bottom: 0, left: `${sliderPos}%`, width: 2, background: "rgba(255,255,255,0.95)", transform: "translateX(-50%)", pointerEvents: "none", boxShadow: "0 0 12px rgba(0,0,0,0.3)" }} />

                {/* Handle */}
                <div
                  onMouseDown={onSliderMouseDown}
                  onTouchStart={onSliderTouchStart}
                  style={{ position: "absolute", top: "50%", left: `${sliderPos}%`, transform: "translate(-50%, -50%)", width: 48, height: 48, borderRadius: "50%", background: "#fff", boxShadow: "0 2px 20px rgba(0,0,0,0.30)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "ew-resize", zIndex: 10, border: `2.5px solid ${scale >= 8 ? T.ultraAccent : T.accent}` }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={scale >= 8 ? T.ultraAccent : T.accent} strokeWidth="2.5" strokeLinecap="round">
                    <path d="M8 4L4 8l4 4M16 4l4 4-4 4" />
                  </svg>
                </div>

                {/* Labels */}
                <div style={{ position: "absolute", top: 14, left: 14, background: "rgba(42,31,18,0.75)", borderRadius: 8, padding: "5px 14px", fontSize: 12, fontWeight: 700, color: "#fff", backdropFilter: "blur(6px)", pointerEvents: "none" }}>Before</div>
                <div style={{ position: "absolute", top: 14, right: 14, background: scale >= 8 ? "rgba(147,51,234,0.90)" : "rgba(208,122,42,0.90)", borderRadius: 8, padding: "5px 14px", fontSize: 12, fontWeight: 700, color: "#fff", backdropFilter: "blur(6px)", pointerEvents: "none" }}>
                  ✓ {scale >= 8 ? "8K Ultra HD" : `${scale}× AI Enhanced`}
                </div>

                {/* Drag hint */}
                <div style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", background: "rgba(255,255,255,0.85)", borderRadius: 99, padding: "5px 16px", fontSize: 11.5, color: T.muted, fontWeight: 500, backdropFilter: "blur(8px)", pointerEvents: "none" }}>
                  ← Drag to compare →
                </div>
              </div>
            )}
          </div>

          {/* Bottom bar after enhancement */}
          {resultUrl && (
            <div style={{ padding: "12px 28px 16px", borderTop: `1px solid ${T.border}`, display: "flex", gap: 10, background: T.card, alignItems: "center" }}>
              <button
                onClick={reset}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", background: T.inputBg, border: `1.5px solid ${T.border}`, color: T.muted, transition: "all .15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = T.accentBrd; e.currentTarget.style.color = T.accent; e.currentTarget.style.background = T.accentDim; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; e.currentTarget.style.background = T.inputBg; }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
                Enhance Another
              </button>
              <div style={{ flex: 1 }} />
              {provider && <ProviderBadge provider={provider} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}