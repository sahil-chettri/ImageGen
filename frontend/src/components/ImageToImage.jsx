import { useState } from "react";
import api from "../services/api.js";
import PromptOptimizer from "./PromptOptimizer.jsx";

const SparkleIcon = ({ size = 18, color = "white" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 2L13.09 8.26L19 6L14.74 10.26L21 12L14.74 13.74L19 18L13.09 15.74L12 22L10.91 15.74L5 18L9.26 13.74L3 12L9.26 10.26L5 6L10.91 8.26L12 2Z" />
  </svg>
);

const STYLES = ["Cinematic", "Anime", "Sketch", "Oil Paint", "Neon", "Watercolor"];
const RATIOS = [
  { label: "1:1",  icon: "⬛" },
  { label: "16:9", icon: "▬" },
  { label: "9:16", icon: "▮" },
];

export default function TextToImage({ onBack }) {
  const [prompt, setPrompt]                 = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [style, setStyle]                   = useState("");
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
        prompt: prompt.trim(),
        negativePrompt,
        ratio,
        style: style || "Photorealistic",
      });
      // FIX: DB returns snake_case column name image_url, not camelCase imageUrl
      setImage(data.generation.image_url);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!image) return;
    const a = document.createElement("a");
    a.href = image; a.download = `imagegen_${Date.now()}.png`; a.click();
  };

  return (
    <div className="gen-root">
      {/* Navbar */}
      <nav className="gen-nav">
        <div className="gen-logo" onClick={onBack}>
          <div className="gen-logo-icon"><SparkleIcon size={14} /></div>
          ImageGen
        </div>
        <div className="gen-nav-links">
          {["Features", "Pricing", "Docs"].map((l) => (
            <span key={l} className="gen-nav-link">{l}</span>
          ))}
        </div>
        <button className="gen-btn-primary">Get Started</button>
      </nav>

      {/* Body */}
      <div className="gen-body">
        {/* Left Panel */}
        <div className="gen-panel gen-panel--left">
          <div className="gen-panel-header">
            <div className="gen-panel-icon gen-panel-icon--purple">
              <SparkleIcon size={16} />
            </div>
            <h2 className="gen-panel-title">Text to Image</h2>

            {/* RAG Toggle Button */}
            <button
              onClick={() => setShowRag(!showRag)}
              style={{
                marginLeft: "auto",
                padding: "6px 12px",
                background: showRag ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : "rgba(124,58,237,0.15)",
                border: "1px solid rgba(124,58,237,0.4)",
                borderRadius: 8,
                color: showRag ? "#fff" : "#a78bfa",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              ✨ AI Assistant {showRag ? "▲" : "▼"}
            </button>
          </div>

          {/* RAG Panel */}
          {showRag && (
            <div style={{ marginBottom: 20 }}>
              <PromptOptimizer onUsePrompt={(optimized) => {
                setPrompt(optimized);
                setShowRag(false);
              }} />
            </div>
          )}

          {error && (
            <div className="gen-error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
              <button className="gen-error-close" onClick={() => setError("")}>✕</button>
            </div>
          )}

          {/* Prompt */}
          <div className="gen-field">
            <label className="gen-label">
              Prompt <span className="gen-required">*</span>
            </label>
            <textarea
              className="gen-textarea"
              rows={4}
              placeholder="Describe the image you want to create..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            {prompt && (
              <button
                onClick={() => setShowRag(true)}
                style={{
                  marginTop: 6,
                  padding: "4px 10px",
                  background: "rgba(124,58,237,0.1)",
                  border: "1px solid rgba(124,58,237,0.3)",
                  borderRadius: 6,
                  color: "#a78bfa",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                ✨ Optimize this prompt
              </button>
            )}
          </div>

          {/* Negative Prompt */}
          <div className="gen-field">
            <label className="gen-label">
              Negative Prompt <span className="gen-optional">(Optional)</span>
            </label>
            <textarea
              className="gen-textarea"
              rows={3}
              placeholder="What to avoid in the image..."
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
            />
          </div>

          {/* Style */}
          <div className="gen-field">
            <label className="gen-label">Style Preset</label>
            <div className="gen-chips">
              {STYLES.map((s) => (
                <button
                  key={s}
                  className={`gen-chip ${style === s ? "gen-chip--active" : ""}`}
                  onClick={() => setStyle(style === s ? "" : s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio */}
          <div className="gen-field">
            <label className="gen-label">Aspect Ratio</label>
            <div className="gen-ratios">
              {RATIOS.map((r) => (
                <button
                  key={r.label}
                  className={`gen-ratio-btn ${ratio === r.label ? "gen-ratio-btn--active" : ""}`}
                  onClick={() => setRatio(r.label)}
                >
                  <span className="gen-ratio-icon">{r.icon}</span>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generate */}
          <button
            className="gen-generate-btn gen-generate-btn--purple"
            onClick={generate}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="gen-spinner" />
                Generating…
              </>
            ) : (
              <>
                <SparkleIcon size={16} />
                Generate Image
              </>
            )}
          </button>
        </div>

        {/* Right Panel - Preview */}
        <div className="gen-panel gen-panel--right">
          <h2 className="gen-preview-title">Preview</h2>
          <div className="gen-preview-box">
            {loading && (
              <div className="gen-preview-loading">
                <div className="gen-preview-spinner" />
                <p className="gen-preview-loading-text">Creating your image…</p>
                <p className="gen-preview-loading-sub">This may take 10–20 seconds</p>
              </div>
            )}
            {!loading && !image && (
              <div className="gen-preview-empty">
                <div className="gen-preview-empty-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <p className="gen-preview-empty-text">Your image will appear here</p>
                <p className="gen-preview-empty-sub">Enter a prompt and click Generate</p>
              </div>
            )}
            {!loading && image && (
              <div className={`gen-preview-img-wrap ${imgLoaded ? "gen-preview-img-wrap--loaded" : ""}`}>
                <img
                  src={image}
                  alt="Generated"
                  className="gen-preview-img"
                  onLoad={() => setImgLoaded(true)}
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="gen-preview-actions">
            <button className="gen-action-btn" onClick={download} disabled={!image}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
              </svg>
              Download
            </button>
            <button className="gen-action-btn" onClick={generate} disabled={!image || loading}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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