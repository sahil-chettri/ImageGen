import { useState, useRef } from "react";
import api from "../services/api";

export default function Dashboard({ onBack }) {
  const [mode, setMode] = useState("text");
  const [prompt, setPrompt] = useState("");
  const [negPrompt, setNegPrompt] = useState("");
  const [ratio, setRatio] = useState("1:1");
  const [strength, setStrength] = useState(0.7);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [activeNav, setActiveNav] = useState("Generate");
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);   // FIX: store File object
  const [uploadedPreview, setUploadedPreview] = useState(null); // FIX: store preview URL
  const [style, setStyle] = useState("None");
  const [error, setError] = useState(null);
  const [credits, setCredits] = useState(null);
  const fileRef = useRef();

  const styles = ["None", "Cinematic", "Anime", "Oil Paint", "Neon", "Sketch"];
  const ratios = ["1:1", "16:9", "9:16", "4:3", "3:2"];

  // Style name mapping to what the backend expects
  const styleMap = {
    "None":     "Photorealistic",
    "Cinematic":"Photorealistic",
    "Anime":    "Anime",
    "Oil Paint":"Oil Painting",
    "Neon":     "Photorealistic",
    "Sketch":   "Sketch",
  };

  const navItems = [
    { label: "Generate", icon: "M12 2l3 7h7l-6 5 2 7-6-4-6 4 2-7-6-5h7z" },
    { label: "Gallery",  icon: "M3 3h18v18H3zM8 8.5a1.5 1.5 0 103 0 1.5 1.5 0 10-3 0M21 15l-5-5L5 21" },
    { label: "History",  icon: "M12 8v4l3 3M3.05 11a9 9 0 101.41-4.5" },
    { label: "Settings", icon: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" },
  ];

  // FIX: Real API call instead of fake setTimeout
  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setProgress(0);
    setGeneratedImage(null);
    setError(null);

    // Fake progress ticker while waiting for the real API
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 85) { clearInterval(interval); return 85; }
        return p + Math.random() * 8;
      });
    }, 400);

    try {
      let result;
      const mappedStyle = styleMap[style] || "Photorealistic";

      if (mode === "text") {
        // FIX: Call backend text-to-image endpoint
        result = await api.generate.text({
          prompt,
          negativePrompt: negPrompt,
          ratio,
          style: mappedStyle,
        });
      } else {
        // FIX: Call backend image-to-image endpoint with the actual File object
        if (!uploadedFile) {
          setError("Please upload a source image first.");
          clearInterval(interval);
          setGenerating(false);
          return;
        }
        result = await api.generate.image({
          file: uploadedFile,
          prompt,
          negativePrompt: negPrompt,
          ratio,
          style: mappedStyle,
        });
      }

      clearInterval(interval);
      setProgress(100);

      // FIX: Use the real image URL from the backend
      const BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';
      const imageUrl = result.generation.imageUrl.startsWith('http')
        ? result.generation.imageUrl
        : `${BASE}${result.generation.imageUrl}`;

      setGeneratedImage(imageUrl);
      if (result.creditsRemaining !== undefined) setCredits(result.creditsRemaining);

    } catch (err) {
      clearInterval(interval);
      setError(err.message || "Generation failed. Please try again.");
      console.error("Generation error:", err);
    } finally {
      setGenerating(false);
      setTimeout(() => setProgress(0), 600);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setUploadedFile(file);                          // FIX: store File for API call
      setUploadedPreview(URL.createObjectURL(file));  // FIX: separate preview URL
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;
    const a = document.createElement("a");
    a.href = generatedImage;
    a.download = `imagegen-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="dash-root">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo" onClick={onBack}>
          <div className="logo-gem">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" fill="url(#g1)" />
              <defs>
                <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="logo-text">IMAGEGEN</span>
        </div>

        <div className="sidebar-nav">
          {navItems.map((n) => (
            <button
              key={n.label}
              className={`sidebar-item ${activeNav === n.label ? "sidebar-active" : ""}`}
              onClick={() => setActiveNav(n.label)}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d={n.icon} />
              </svg>
              <span>{n.label}</span>
            </button>
          ))}
        </div>

        <div className="sidebar-credits">
          <div className="credits-label">Credits remaining</div>
          <div className="credits-bar-wrap">
            <div className="credits-bar" style={{ width: `${Math.min(100, ((credits ?? 120) / 166) * 100)}%` }} />
          </div>
          <div className="credits-count">
            <span className="credits-num">{credits ?? 120}</span> / 166
          </div>
          <button className="btn-buy-credits">+ Buy Credits</button>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">U</div>
          <div className="user-info">
            <div className="user-name">User</div>
            <div className="user-plan">Pro Plan</div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="dash-main">
        {/* TOP BAR */}
        <div className="dash-topbar">
          <div>
            <h1 className="dash-title">AI Image Studio</h1>
            <p className="dash-subtitle">Create stunning visuals with generative AI</p>
          </div>
          <div className="topbar-modes">
            <button
              className={`mode-tab ${mode === "text" ? "mode-active" : ""}`}
              onClick={() => setMode("text")}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              Text to Image
            </button>
            <button
              className={`mode-tab ${mode === "image" ? "mode-active" : ""}`}
              onClick={() => setMode("image")}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15l-5-5L5 21M3 3h18v18H3zM8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
              </svg>
              Image to Image
            </button>
          </div>
        </div>

        <div className="dash-workspace">
          {/* LEFT: Controls */}
          <div className="controls-panel">
            {mode === "text" ? (
              <>
                <div className="field-group">
                  <label className="field-label">
                    Prompt
                    <span className="field-tag">Required</span>
                  </label>
                  <textarea
                    className="dash-textarea"
                    placeholder="A cinematic wide shot of a neon-lit Tokyo street at night, rain reflecting neon signs, ultra-detailed..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">Negative Prompt</label>
                  <textarea
                    className="dash-textarea dash-textarea-sm"
                    placeholder="blurry, low quality, distorted..."
                    value={negPrompt}
                    onChange={(e) => setNegPrompt(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">Style Preset</label>
                  <div className="style-chips">
                    {styles.map((s) => (
                      <button
                        key={s}
                        className={`style-chip ${style === s ? "chip-active" : ""}`}
                        onClick={() => setStyle(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="field-group">
                  <label className="field-label">Aspect Ratio</label>
                  <div className="ratio-options">
                    {ratios.map((r) => (
                      <button
                        key={r}
                        className={`ratio-btn ${ratio === r ? "ratio-active" : ""}`}
                        onClick={() => setRatio(r)}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="field-group">
                  <label className="field-label">Upload Source Image</label>
                  <div
                    className={`drop-zone ${dragOver ? "drop-active" : ""} ${uploadedPreview ? "drop-filled" : ""}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileRef.current?.click()}
                  >
                    {uploadedPreview ? (
                      <img src={uploadedPreview} alt="upload" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 10 }} />
                    ) : (
                      <div className="drop-inner">
                        <div className="drop-icon">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                          </svg>
                        </div>
                        <p>Drop image here or <span className="drop-link">browse</span></p>
                        <p className="drop-sub">PNG, JPG up to 10MB</p>
                      </div>
                    )}
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setUploadedFile(file);                         // FIX: store File
                          setUploadedPreview(URL.createObjectURL(file)); // FIX: preview URL
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="field-group">
                  <label className="field-label">Transformation Prompt</label>
                  <textarea
                    className="dash-textarea"
                    placeholder="Transform into cyberpunk anime style..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">
                    Strength
                    <span className="field-tag">{Math.round(strength * 100)}%</span>
                  </label>
                  <input
                    type="range" min="0" max="1" step="0.05"
                    value={strength}
                    onChange={(e) => setStrength(parseFloat(e.target.value))}
                    className="dash-range"
                  />
                  <div className="range-labels">
                    <span>Subtle</span><span>Strong</span>
                  </div>
                </div>
              </>
            )}

            <div className="advanced-section">
              <details className="advanced-details">
                <summary className="advanced-summary">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  Advanced Settings
                </summary>
                <div className="advanced-body">
                  <div className="adv-row">
                    <label>Steps</label>
                    <input type="number" defaultValue={25} min={10} max={50} className="adv-input" />
                  </div>
                  <div className="adv-row">
                    <label>CFG Scale</label>
                    <input type="number" defaultValue={7.5} min={1} max={20} step={0.5} className="adv-input" />
                  </div>
                  <div className="adv-row">
                    <label>Seed</label>
                    <input type="number" defaultValue={-1} className="adv-input" />
                  </div>
                </div>
              </details>
            </div>

            {/* FIX: Show error message if generation fails */}
            {error && (
              <div style={{
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#f87171",
                marginBottom: 12
              }}>
                ⚠ {error}
              </div>
            )}

            <button
              className={`btn-generate ${generating ? "btn-generating" : ""}`}
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <>
                  <div className="gen-spinner" />
                  <span>Generating... {Math.round(progress)}%</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polygon points="12,2 15,9 22,9 16,14 18,21 12,17 6,21 8,14 2,9 9,9" fill="currentColor" />
                  </svg>
                  <span>Generate Image</span>
                </>
              )}
              {generating && (
                <div className="btn-progress" style={{ width: `${progress}%` }} />
              )}
            </button>
          </div>

          {/* RIGHT: Output */}
          <div className="output-panel">
            <div className="output-header">
              <span className="output-title">Output</span>
              {generatedImage && (
                <div className="output-actions">
                  {/* FIX: Download button actually works */}
                  <button className="action-btn" onClick={handleDownload}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    </svg>
                    Download
                  </button>
                  <button className="action-btn">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                    Edit
                  </button>
                  <button className="action-btn" onClick={() => { setGeneratedImage(null); setPrompt(""); }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16v16H4zM4 9h16M4 14h16M9 4v16M14 4v16" />
                    </svg>
                    New
                  </button>
                </div>
              )}
            </div>

            <div className={`preview-area ${generating ? "preview-generating" : ""} ${generatedImage ? "preview-filled" : ""}`}>
              {generating ? (
                <div className="gen-loader">
                  <div className="gen-rings">
                    <div className="ring r1" />
                    <div className="ring r2" />
                    <div className="ring r3" />
                  </div>
                  <div className="gen-status">Synthesizing pixels...</div>
                  <div className="gen-progress-wrap">
                    <div className="gen-progress-bar" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="gen-pct">{Math.round(progress)}%</div>
                </div>
              ) : generatedImage ? (
                // FIX: Show the real generated image from the backend
                <div className="generated-result" style={{ width: "100%", height: "100%" }}>
                  <img
                    src={generatedImage}
                    alt="Generated"
                    style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 12 }}
                  />
                </div>
              ) : (
                <div className="preview-empty">
                  <div className="empty-icon">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                      <rect x="3" y="3" width="18" height="18" rx="3" />
                      <path d="M8 9a1 1 0 102 0 1 1 0 10-2 0M21 15l-5-5L5 21" />
                    </svg>
                  </div>
                  <p className="empty-text">Your creation will appear here</p>
                  <p className="empty-sub">Enter a prompt and click Generate</p>
                </div>
              )}
            </div>

            {/* HISTORY */}
            <div className="history-section">
              <div className="history-header">
                <span>Recent</span>
                <span className="history-view-all">View all →</span>
              </div>
              <div className="history-thumbs">
                {[
                  { gradient: "linear-gradient(135deg,#7c3aed,#2563eb)", label: "Cyberpunk city" },
                  { gradient: "linear-gradient(135deg,#db2777,#7c3aed)", label: "Fantasy portrait" },
                  { gradient: "linear-gradient(135deg,#0891b2,#6366f1)", label: "Ocean sunset" },
                  { gradient: "linear-gradient(135deg,#16a34a,#0891b2)", label: "Neon forest" },
                  { gradient: "linear-gradient(135deg,#ea580c,#db2777)", label: "Abstract art" },
                ].map((h, i) => (
                  <div key={i} className="hist-thumb" style={{ background: h.gradient }}>
                    <div className="thumb-overlay"><span>{h.label}</span></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}