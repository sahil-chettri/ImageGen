import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const STYLES        = ["Cinematic", "Anime", "Oil Paint", "Sketch", "Neon"];
const ASPECT_RATIOS = ["1:1", "16:9", "9:16", "4:3"];

const Icon = ({ d, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const LogoIcon = () => (
  <div className="dash-logo-icon">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
      <polygon points="12,2 15,9 22,9 16,14 18,21 12,17 6,21 8,14 2,9 9,9" />
    </svg>
  </div>
);

const NAV_ITEMS = [
  { label: "Generate", d: "M12 2l3 7h7l-6 5 2 7-6-4-6 4 2-7-6-5h7z" },
  { label: "Gallery",  d: "M3 3h18v18H3zM8.5 8.5m-1.5 0a1.5 1.5 0 103 0 1.5 1.5 0 10-3 0M21 15l-5-5L5 21" },
  { label: "History",  d: "M12 8v4l3 3M3.05 11a9 9 0 100 2" },
  { label: "Settings", d: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" },
];

export default function Dashboard({ onBack }) {
  const [active, setActive]                 = useState("Generate");
  const [mode, setMode]                     = useState("Text to Image");
  const [prompt, setPrompt]                 = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [style, setStyle]                   = useState("");
  const [aspectRatio, setAspectRatio]       = useState("1:1");
  const [steps, setSteps]                   = useState(30);
  const [guidanceScale, setGuidanceScale]   = useState(7.5);
  const [seed, setSeed]                     = useState(-1);
  const [showAdvanced, setShowAdvanced]     = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState("");

  const handleGenerate = async () => {
    if (!prompt.trim()) { setError("Please enter a prompt."); return; }
    setError(""); setLoading(true); setGeneratedImage(null);
    try {
      const res = await fetch(`${API_BASE}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), negativePrompt: negativePrompt.trim(), style, aspectRatio, steps, guidanceScale, seed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setGeneratedImage(data.base64 || `${API_BASE}${data.imageUrl}`);
    } catch (err) {
      setError(err.message || "Failed to generate image.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const a = document.createElement("a");
    a.href = generatedImage; a.download = `imagegen_${Date.now()}.png`; a.click();
  };

  const handleRegenerate = () => {
    setSeed(Math.floor(Math.random() * 999999));
    setTimeout(handleGenerate, 50);
  };

  return (
    <div className="dash-root">

      {/* ── Sidebar ── */}
      <aside className="dash-sidebar">
        <div className="dash-logo" onClick={onBack}>
          <LogoIcon />
          <span>ImageGen</span>
        </div>

        <nav className="dash-nav">
          {NAV_ITEMS.map(({ label, d }) => (
            <button key={label}
              className={`dash-nav-item${active === label ? " active" : ""}`}
              onClick={() => setActive(label)}>
              <Icon d={d} size={14} />
              {label}
            </button>
          ))}
        </nav>

        <div className="dash-profile">
          <div className="dash-profile-avatar">U</div>
          <span>Profile</span>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="dash-main">

        {/* Header */}
        <header className="dash-header">
          <h1 className="dash-header-title">AI Image Studio</h1>
          <div className="dash-mode-tabs">
            {["Text to Image", "Image to Image"].map((m) => (
              <button key={m}
                className={`dash-mode-tab${mode === m ? " active" : ""}`}
                onClick={() => setMode(m)}>
                {m}
              </button>
            ))}
          </div>
        </header>

        {/* Content */}
        <div className="dash-content">

          {/* Left */}
          <div className="dash-controls">

            {error && (
              <div className="dash-error">
                <span>⚠</span>
                <span style={{ flex: 1 }}>{error}</span>
                <button onClick={() => setError("")}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#DC2626", fontSize: 16 }}>✕</button>
              </div>
            )}

            {/* Prompt */}
            <div className="dash-card">
              <div className="dash-card-label">Prompt</div>
              <textarea className="dash-textarea" rows={4}
                placeholder="Describe the image you want to create..."
                value={prompt} onChange={(e) => setPrompt(e.target.value)} />
            </div>

            {/* Negative Prompt */}
            <div className="dash-card">
              <div className="dash-card-label">Negative Prompt</div>
              <textarea className="dash-textarea" rows={3}
                placeholder="What to avoid in the image..."
                value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} />
            </div>

            {/* Style */}
            <div className="dash-card">
              <div className="dash-card-label">Style</div>
              <div className="style-chips">
                {STYLES.map((s) => (
                  <button key={s}
                    className={`style-chip${style === s ? " active" : ""}`}
                    onClick={() => setStyle(style === s ? "" : s)}>{s}</button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div className="dash-card">
              <div className="dash-card-label">Aspect Ratio</div>
              <div className="ratio-chips">
                {ASPECT_RATIOS.map((r) => (
                  <button key={r}
                    className={`ratio-chip${aspectRatio === r ? " active" : ""}`}
                    onClick={() => setAspectRatio(r)}>{r}</button>
                ))}
              </div>
            </div>

            {/* Advanced */}
            <div className="dash-advanced">
              <div className="dash-advanced-header" onClick={() => setShowAdvanced(!showAdvanced)}>
                <span>Advanced Settings</span>
                <span style={{ fontSize: 10, transition: "transform 0.2s", display: "inline-block", transform: showAdvanced ? "rotate(180deg)" : "none" }}>▼</span>
              </div>
              {showAdvanced && (
                <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <label style={{ fontSize: 12, color: "var(--gray-600)", fontWeight: 500 }}>Steps</label>
                      <span style={{ fontSize: 12, color: "var(--purple-600)", fontWeight: 600 }}>{steps}</span>
                    </div>
                    <input type="range" min={10} max={50} step={1} value={steps}
                      onChange={(e) => setSteps(Number(e.target.value))}
                      style={{ width: "100%", accentColor: "var(--purple-600)" }} />
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <label style={{ fontSize: 12, color: "var(--gray-600)", fontWeight: 500 }}>Guidance Scale</label>
                      <span style={{ fontSize: 12, color: "var(--purple-600)", fontWeight: 600 }}>{guidanceScale}</span>
                    </div>
                    <input type="range" min={1} max={20} step={0.5} value={guidanceScale}
                      onChange={(e) => setGuidanceScale(Number(e.target.value))}
                      style={{ width: "100%", accentColor: "var(--purple-600)" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "var(--gray-600)", fontWeight: 500, display: "block", marginBottom: 6 }}>
                      Seed <span style={{ color: "var(--gray-400)", fontWeight: 400 }}>(-1 = random)</span>
                    </label>
                    <input type="number" min={-1} max={999999} value={seed}
                      onChange={(e) => setSeed(Number(e.target.value))}
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--gray-200)", borderRadius: "var(--r-sm)", fontFamily: "var(--font)", fontSize: 13, outline: "none" }} />
                  </div>
                </div>
              )}
            </div>

            {/* Generate */}
            <button className="btn-generate" onClick={handleGenerate} disabled={loading}>
              {loading ? (
                <>
                  <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.35)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                  Generating...
                </>
              ) : "✦ Generate Image"}
            </button>
          </div>

          {/* Right Preview */}
          <div className="dash-preview-col">
            <div className="dash-preview-card">

              {loading && (
                <div className="dash-preview-loading">
                  <div style={{ width: 52, height: 52, border: "3px solid var(--purple-200)", borderTopColor: "var(--purple-600)", borderRadius: "50%", animation: "spin 0.9s linear infinite" }} />
                  <p style={{ fontSize: 13, color: "var(--purple-600)", fontWeight: 500 }}>Creating your image…</p>
                </div>
              )}

              {!loading && !generatedImage && (
                <div className="dash-preview-empty">
                  <svg className="dash-preview-placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <p className="dash-preview-empty-text">Your generated image will appear here</p>
                </div>
              )}

              {!loading && generatedImage && (
                <img src={generatedImage} alt="Generated" className="dash-preview-img" />
              )}

              <div className="dash-preview-actions">
                <button className="dash-action-btn" onClick={handleDownload} disabled={!generatedImage}>
                  <Icon d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                  Download
                </button>
                <button className="dash-action-btn" onClick={handleRegenerate} disabled={!generatedImage || loading}>
                  <Icon d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                  Regenerate
                </button>
                <button className="dash-action-btn" disabled={!generatedImage}>
                  <Icon d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
                  Variations
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}