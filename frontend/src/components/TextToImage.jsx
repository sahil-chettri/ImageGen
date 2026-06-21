import { useState } from "react";
import api from "../services/api.js";
import PromptOptimizer from "./PromptOptimizer.jsx";

/* ─── THEME — matches Landing.jsx ─── */
const T = {
  cream:      "#f5f0e8",
  creamDark:  "#ede7d9",
  creamMid:   "#e8e0cf",
  ink:        "#1a1612",
  inkSoft:    "#4a3f35",
  inkMuted:   "#8a7d72",
  accent:     "#e85d3a",
  accentDim:  "rgba(232,93,58,0.10)",
  accentBrd:  "rgba(232,93,58,0.30)",
  accentEnd:  "#f2a65a",
  green:      "#3d6b4f",
  card:       "rgba(255,253,248,0.92)",
  border:     "rgba(26,22,18,0.10)",
  borderHov:  "rgba(26,22,18,0.18)",
};

const STYLES = ["Cinematic", "Anime", "Sketch", "Oil Paint", "Neon", "Watercolor", "Realistic", "3D Render"];
const RATIOS = [
  { label: "1:1",  svgPath: "M4 4h16v16H4z",   vb: "0 0 24 24" },
  { label: "16:9", svgPath: "M2 7h20v10H2z",    vb: "0 0 24 24" },
  { label: "9:16", svgPath: "M7 2h10v20H7z",    vb: "0 0 24 24" },
];

const SparkleIcon = ({ size = 15, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 2L13.09 8.26L19 6L14.74 10.26L21 12L14.74 13.74L19 18L13.09 15.74L12 22L10.91 15.74L5 18L9.26 13.74L3 12L9.26 10.26L5 6L10.91 8.26L12 2Z" />
  </svg>
);

export default function TextToImage({ onBack }) {
  const [prompt, setPrompt]                 = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [style, setStyle]                   = useState("Cinematic");
  const [ratio, setRatio]                   = useState("1:1");
  const [loading, setLoading]               = useState(false);
  const [image, setImage]                   = useState(null);
  const [error, setError]                   = useState("");
  const [imgLoaded, setImgLoaded]           = useState(false);
  const [showRag, setShowRag]               = useState(false);

  const generate = async () => {
    if (!prompt.trim()) { setError("Please enter a prompt."); return; }
    setError(""); setLoading(true); setImage(null); setImgLoaded(false);
    try {
      const data = await api.generate.text({
        prompt: prompt.trim(), negativePrompt, ratio,
        style: style || "Photorealistic",
      });
      setImage(data.generation.image_url);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally { setLoading(false); }
  };

  const download = () => {
    if (!image) return;
    const a = document.createElement("a");
    a.href = image; a.download = `imagegen_${Date.now()}.png`; a.click();
  };

  return (
    <div style={{
      height: "100vh",
      background: T.cream,
      fontFamily: "'DM Sans', sans-serif",
      display: "flex",
      flexDirection: "column",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500&family=Caveat:wght@600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* noise texture */
        .tti-root::before {
          content: ''; position: fixed; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
          pointer-events: none; z-index: 0; opacity: 0.5;
        }

        /* ambient blobs */
        .tti-blob {
          position: fixed; border-radius: 50%;
          filter: blur(90px); opacity: 0.13; pointer-events: none; z-index: 0;
        }
        .tti-blob-1 { width: 350px; height: 350px; background: #e85d3a; top: 5%; left: -5%; animation: tti-blobFloat 14s ease-in-out infinite; }
        .tti-blob-2 { width: 280px; height: 280px; background: #f2a65a; bottom: 10%; right: -5%; animation: tti-blobFloat 16s ease-in-out infinite 3s; }
        .tti-blob-3 { width: 220px; height: 220px; background: #3d6b4f; top: 50%; left: 40%; animation: tti-blobFloat 12s ease-in-out infinite 6s; }

        @keyframes tti-blobFloat {
          0%,100% { transform: translate(0,0) scale(1); }
          33%     { transform: translate(20px,-20px) scale(1.05); }
          66%     { transform: translate(-15px,15px) scale(0.97); }
        }
        @keyframes tti-spin { to { transform: rotate(360deg); } }
        @keyframes tti-fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes tti-imageReveal { from { opacity:0; transform:scale(0.97); } to { opacity:1; transform:scale(1); } }

        /* panels */
        .tti-panel {
          background: ${T.card};
          border: 1px solid ${T.border};
          border-radius: 20px;
          backdrop-filter: blur(10px);
        }

        /* textarea */
        .tti-textarea {
          width: 100%; padding: 12px 14px;
          background: rgba(245,240,232,0.6);
          border: 1px solid ${T.border}; border-radius: 12px;
          font-size: 13.5px; font-family: 'DM Sans', sans-serif;
          color: ${T.ink}; outline: none; resize: vertical;
          transition: border 0.18s, box-shadow 0.18s; line-height: 1.6;
        }
        .tti-textarea::placeholder { color: ${T.inkMuted}; }
        .tti-textarea:focus {
          border-color: ${T.accent};
          box-shadow: 0 0 0 3px ${T.accentDim};
        }

        /* style chips */
        .tti-chip {
          padding: 5px 15px; border-radius: 999px;
          border: 1px solid ${T.border};
          background: transparent;
          font-family: 'DM Sans', sans-serif;
          font-size: 12.5px; font-weight: 400;
          color: ${T.inkSoft}; cursor: pointer; transition: all 0.18s;
          white-space: nowrap;
        }
        .tti-chip:hover { border-color: ${T.accentBrd}; color: ${T.accent}; }
        .tti-chip-active {
          border-color: ${T.accent};
          background: rgba(232,93,58,0.08);
          color: ${T.accent}; font-weight: 500;
        }

        /* ratio buttons */
        .tti-ratio-btn {
          flex: 1; padding: 10px 0; border-radius: 12px;
          border: 1px solid ${T.border};
          background: rgba(245,240,232,0.5);
          color: ${T.inkMuted}; font-size: 12px; font-weight: 500;
          cursor: pointer;
          display: flex; flex-direction: column; align-items: center; gap: 5px;
          transition: all 0.18s; font-family: 'DM Sans', sans-serif;
        }
        .tti-ratio-btn:hover { border-color: ${T.accentBrd}; color: ${T.accent}; }
        .tti-ratio-active {
          border-color: ${T.accent};
          background: rgba(232,93,58,0.08);
          color: ${T.accent};
        }

        /* icon buttons */
        .tti-icon-btn {
          width: 34px; height: 34px; border-radius: 8px;
          border: 1px solid ${T.border};
          background: transparent;
          display: flex; align-items: center; justify-content: center;
          color: ${T.inkMuted}; cursor: pointer; transition: all 0.18s; padding: 0;
        }
        .tti-icon-btn:hover { border-color: ${T.accentBrd}; color: ${T.accent}; background: rgba(232,93,58,0.06); }
        .tti-icon-btn-active { border-color: ${T.accent}; background: rgba(232,93,58,0.08); color: ${T.accent}; }

        /* bottom action buttons */
        .tti-action-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 16px; border-radius: 999px;
          border: 1px solid ${T.border};
          background: transparent;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 400; color: ${T.inkSoft};
          cursor: pointer; transition: all 0.18s;
        }
        .tti-action-btn:hover:not(:disabled) { border-color: ${T.accentBrd}; color: ${T.accent}; }
        .tti-action-btn:disabled { opacity: 0.35; cursor: not-allowed; }

        /* label */
        .tti-label {
          display: block; font-size: 10.5px; font-weight: 500;
          color: ${T.inkMuted}; text-transform: uppercase; letter-spacing: 0.9px;
          margin-bottom: 9px;
        }

        /* char count */
        .tti-charcount { font-size: 11px; color: ${T.inkMuted}; text-align: right; margin-top: 4px; }

        /* generate button */
        .tti-generate-btn {
          width: 100%; padding: 14px;
          border-radius: 999px; border: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 14.5px; font-weight: 500;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          cursor: pointer; transition: all 0.2s;
          letter-spacing: -0.1px;
        }
        .tti-generate-btn:not(:disabled) {
          background: ${T.ink}; color: ${T.cream};
          box-shadow: 0 4px 20px rgba(26,22,18,0.18);
        }
        .tti-generate-btn:not(:disabled):hover {
          background: #2d2520;
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(26,22,18,0.24);
        }
        .tti-generate-btn:disabled {
          background: ${T.creamMid}; color: ${T.inkMuted}; cursor: not-allowed;
        }

        /* panel animation */
        .tti-panel { animation: tti-fadeUp 0.45s ease both; }
        .tti-panel:nth-child(2) { animation-delay: 0.08s; }

        /* optimize tag */
        .tti-optimize-tag {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 3px 10px; border-radius: 999px;
          border: 1px solid ${T.accentBrd};
          background: rgba(232,93,58,0.07);
          color: ${T.accent}; font-size: 11px; font-weight: 500;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: all 0.15s;
        }
        .tti-optimize-tag:hover { background: rgba(232,93,58,0.14); }

        /* ai assistant tag */
        .tti-ai-tag {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 5px 12px; border-radius: 999px;
          border: 1px solid ${T.accentBrd};
          background: rgba(232,93,58,0.07);
          color: ${T.accent}; font-size: 12px; font-weight: 500;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: all 0.15s;
        }
        .tti-ai-tag:hover { background: rgba(232,93,58,0.14); }

        /* divider */
        .tti-divider { width: 1px; height: 20px; background: ${T.border}; }
      `}</style>

      {/* ambient blobs */}
      <div className="tti-root" />
      <div className="tti-blob tti-blob-1" />
      <div className="tti-blob tti-blob-2" />
      <div className="tti-blob tti-blob-3" />


      {/* ── RAG modal ── */}
      {showRag && (
        <PromptOptimizer
          initialPrompt={prompt}
          onUsePrompt={(p) => { setPrompt(p); setShowRag(false); }}
          onClose={() => setShowRag(false)}
        />
      )}

      {/* ── Main layout ── */}
      <div style={{
        position: "relative", zIndex: 1,
        flex: 1, display: "flex", gap: 20,
        padding: "20px 48px 20px",
        width: "100%", overflow: "hidden",
        alignItems: "stretch",
      }}>

        {/* ── Left panel ── */}
        <div className="tti-panel" style={{
          width: 390, flexShrink: 0,
          padding: 26, display: "flex", flexDirection: "column", gap: 20,
          overflowY: "auto",
        }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{
                fontFamily: "'Instrument Serif', serif",
                fontStyle: "italic",
                fontSize: 22, color: T.ink,
                letterSpacing: "-0.3px", lineHeight: 1.1,
              }}>
                Text to <span style={{ color: T.accent }}>Image</span>
              </div>
              <div style={{ fontSize: 12, color: T.inkMuted, marginTop: 3 }}>Describe your vision</div>
            </div>
            <button className="tti-ai-tag" onClick={() => setShowRag(true)}>
              <SparkleIcon size={11} color={T.accent} />
              AI Assistant
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
            </button>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: "rgba(232,93,58,0.08)",
              border: `1px solid ${T.accentBrd}`,
              borderRadius: 12, padding: "10px 14px",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
            }}>
              <span style={{ fontSize: 13, color: T.accent }}>{error}</span>
              <button onClick={() => setError("")} style={{
                background: "none", border: "none",
                cursor: "pointer", color: T.accent, fontSize: 15, lineHeight: 1, padding: 0,
              }}>✕</button>
            </div>
          )}

          {/* Prompt */}
          <div>
            <label className="tti-label">
              Prompt <span style={{ color: T.accent, textTransform: "none", letterSpacing: 0 }}>*</span>
            </label>
            <textarea
              className="tti-textarea"
              rows={4}
              placeholder="Describe the image you want to create…"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              maxLength={1000}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
              {prompt ? (
                <button className="tti-optimize-tag" onClick={() => setShowRag(true)}>
                  <SparkleIcon size={10} color={T.accent} /> Optimize
                </button>
              ) : <span />}
              <span className="tti-charcount">{prompt.length}/1000</span>
            </div>
          </div>

          {/* Negative Prompt */}
          <div>
            <label className="tti-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              Negative Prompt
              <span style={{ fontSize: 11, fontWeight: 400, textTransform: "none", color: T.inkMuted, letterSpacing: 0 }}>(Optional)</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.inkMuted} strokeWidth="1.8" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </label>
            <textarea
              className="tti-textarea"
              rows={3}
              placeholder="What to avoid in the image…"
              value={negativePrompt}
              onChange={e => setNegativePrompt(e.target.value)}
              maxLength={1000}
            />
            <p className="tti-charcount">{negativePrompt.length}/1000</p>
          </div>

          {/* Style Preset */}
          <div>
            <label className="tti-label">Style Preset</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {STYLES.map(s => (
                <button
                  key={s}
                  className={`tti-chip ${style === s ? "tti-chip-active" : ""}`}
                  onClick={() => setStyle(style === s ? "" : s)}
                >{s}</button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio */}
          <div>
            <label className="tti-label">Aspect Ratio</label>
            <div style={{ display: "flex", gap: 8 }}>
              {RATIOS.map(r => (
                <button
                  key={r.label}
                  className={`tti-ratio-btn ${ratio === r.label ? "tti-ratio-active" : ""}`}
                  onClick={() => setRatio(r.label)}
                >
                  <svg width="16" height="16" viewBox={r.vb} fill="currentColor">
                    <path d={r.svgPath} />
                  </svg>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            className="tti-generate-btn"
            onClick={generate}
            disabled={loading}
          >
            {loading ? (
              <>
                <span style={{
                  width: 15, height: 15,
                  border: `2.5px solid rgba(26,22,18,0.2)`,
                  borderTopColor: T.inkMuted,
                  borderRadius: "50%",
                  animation: "tti-spin 0.75s linear infinite",
                  display: "inline-block",
                }} />
                Generating…
              </>
            ) : (
              <><SparkleIcon size={15} color={T.cream} /> Generate Image</>
            )}
          </button>
        </div>

        {/* ── Right panel – Preview ── */}
        <div className="tti-panel" style={{
          flex: 1, display: "flex", flexDirection: "column",
          overflow: "hidden", minHeight: 0,
        }}>

          {/* Preview header */}
          <div style={{
            padding: "16px 22px",
            borderBottom: `1px solid ${T.border}`,
            display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
          }}>
            <span style={{
              fontFamily: "'Instrument Serif', serif",
              fontStyle: "italic",
              fontSize: 17, color: T.ink, flex: 1,
            }}>Preview</span>

            {/* Icon toolbar */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button className="tti-icon-btn tti-icon-btn-active">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
              </button>
              <button className="tti-icon-btn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                </svg>
              </button>
              <button className="tti-icon-btn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z"/>
                </svg>
              </button>
              <div className="tti-divider" />
              <button className="tti-icon-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M3 7v6h6"/><path d="M3 13a9 9 0 1 0 2.56-6.36L3 13"/>
                </svg>
              </button>
              <button className="tti-icon-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M21 7v6h-6"/><path d="M21 13A9 9 0 1 1 18.44 6.64L21 13"/>
                </svg>
              </button>
              <button
                className="tti-icon-btn"
                onClick={image ? download : undefined}
                disabled={!image}
                style={{ opacity: image ? 1 : 0.35 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Preview body */}
          <div style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            padding: 28,
            background: "rgba(245,240,232,0.4)",
            overflow: "hidden",
            minHeight: 0,
          }}>
            {/* dashed frame — only shows border when no image */}
            <div style={{
              width: "100%", height: "100%",
              border: image ? "none" : `1.5px dashed ${T.border}`,
              borderRadius: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: image ? "transparent" : "rgba(255,253,248,0.6)",
              overflow: "hidden",
              position: "relative",
            }}>
              {loading && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
                  <div style={{ position: "relative", width: 52, height: 52 }}>
                    <div style={{
                      width: 52, height: 52,
                      border: `3px solid ${T.accentDim}`,
                      borderTopColor: T.accent,
                      borderRadius: "50%",
                      animation: "tti-spin 0.9s linear infinite",
                    }} />
                    <div style={{
                      position: "absolute", inset: 10,
                      border: `3px solid rgba(232,93,58,0.08)`,
                      borderTopColor: T.accentEnd,
                      borderRadius: "50%",
                      animation: "tti-spin 1.6s linear infinite reverse",
                    }} />
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{
                      margin: "0 0 4px",
                      fontFamily: "'Instrument Serif', serif",
                      fontStyle: "italic",
                      fontSize: 16, color: T.ink,
                    }}>Creating your image…</p>
                    <p style={{ margin: 0, fontSize: 12.5, color: T.inkMuted }}>This may take 10–20 seconds</p>
                  </div>
                </div>
              )}

              {!loading && !image && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center" }}>
                  <div style={{
                    width: 68, height: 68, borderRadius: 18,
                    background: "rgba(232,93,58,0.08)",
                    border: `1px solid ${T.accentBrd}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="1.4" strokeLinecap="round">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  </div>
                  <div>
                    <p style={{
                      margin: "0 0 6px",
                      fontFamily: "'Instrument Serif', serif",
                      fontStyle: "italic",
                      fontSize: 17, color: T.ink,
                    }}>Your image will appear here</p>
                    <p style={{ margin: 0, fontSize: 13, color: T.inkMuted }}>Enter a prompt and click Generate</p>
                  </div>
                </div>
              )}

              {!loading && image && (
                <img
                  src={image}
                  alt="Generated"
                  onLoad={() => setImgLoaded(true)}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    width: "auto",
                    height: "auto",
                    objectFit: "contain",
                    borderRadius: 14,
                    boxShadow: "0 8px 40px rgba(26,22,18,0.18)",
                    animation: "tti-imageReveal 0.5s ease",
                    opacity: imgLoaded ? 1 : 0,
                    transition: "opacity 0.4s ease",
                    display: "block",
                  }}
                />
              )}
            </div>
          </div>

          {/* Bottom actions */}
          <div style={{
            padding: "14px 22px",
            borderTop: `1px solid ${T.border}`,
            display: "flex", gap: 10,
          }}>
            <button
              className="tti-action-btn"
              disabled={!image}
              onClick={image ? download : undefined}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
              </svg>
              Download
            </button>
            <button
              className="tti-action-btn"
              disabled={!image || loading}
              onClick={image && !loading ? generate : undefined}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
              </svg>
              Regenerate
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}