import { useState, useRef, useCallback, useEffect } from "react";

const SparkleIcon = ({ size = 18, color = "white" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 2L13.09 8.26L19 6L14.74 10.26L21 12L14.74 13.74L19 18L13.09 15.74L12 22L10.91 15.74L5 18L9.26 13.74L3 12L9.26 10.26L5 6L10.91 8.26L12 2Z" />
  </svg>
);

const PRESETS = [
  { name: "Vivid",      brightness: 1.05, contrast: 1.15, saturation: 1.4,  sharpness: 0,   hue: 0 },
  { name: "Cinematic",  brightness: 0.92, contrast: 1.25, saturation: 0.85, sharpness: 0,   hue: 0 },
  { name: "Warm",       brightness: 1.0,  contrast: 1.05, saturation: 1.1,  sharpness: 0,   hue: 15 },
  { name: "Cool",       brightness: 1.0,  contrast: 1.05, saturation: 1.0,  sharpness: 0,   hue: -15 },
  { name: "B&W",        brightness: 1.0,  contrast: 1.2,  saturation: 0,    sharpness: 0,   hue: 0 },
  { name: "Faded",      brightness: 1.08, contrast: 0.85, saturation: 0.7,  sharpness: 0,   hue: 0 },
];

const DEFAULT_ADJUSTMENTS = {
  brightness: 1,
  contrast:   1,
  saturation: 1,
  sharpness:  0,
  hue:        0,
  blur:       0,
};

function SliderRow({ label, value, min, max, step, onChange, unit = "" }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="gen-field" style={{ marginBottom: 0 }}>
      <div className="gen-label-row">
        <label className="gen-label" style={{ marginBottom: 0 }}>{label}</label>
        <span className="gen-strength-val">{typeof value === "number" && value % 1 !== 0 ? value.toFixed(2) : value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="gen-slider"
        style={{ "--slider-val": `${pct}%` }}
      />
    </div>
  );
}

export default function ImageEnhancement({ onBack }) {
  const [uploadedFile, setUploadedFile]   = useState(null);
  const [uploadedUrl, setUploadedUrl]     = useState(null);
  const [adj, setAdj]                     = useState(DEFAULT_ADJUSTMENTS);
  const [activePreset, setActivePreset]   = useState(null);
  const [loading, setLoading]             = useState(false);
  const [aiLoading, setAiLoading]         = useState(false);
  const [resultUrl, setResultUrl]         = useState(null);
  const [error, setError]                 = useState("");
  const [dragOver, setDragOver]           = useState(false);
  const [showOriginal, setShowOriginal]   = useState(false);
  const [aiMode, setAiMode]               = useState("enhance"); // enhance | denoise

  const fileInputRef = useRef(null);
  const canvasRef    = useRef(null);
  const imgRef       = useRef(null);

  const setOne = (key, val) => {
    setAdj((prev) => ({ ...prev, [key]: val }));
    setActivePreset(null);
  };

  const applyPreset = (preset) => {
    setAdj((prev) => ({ ...prev, ...preset }));
    setActivePreset(preset.name);
  };

  const resetAdj = () => {
    setAdj(DEFAULT_ADJUSTMENTS);
    setActivePreset(null);
  };

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setUploadedFile(file);
    setUploadedUrl(URL.createObjectURL(file));
    setResultUrl(null);
    setAdj(DEFAULT_ADJUSTMENTS);
    setActivePreset(null);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }, []);

  // Apply canvas filter adjustments and return blob URL
  const renderWithFilters = useCallback((imgEl, adjustments) => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      canvas.width  = imgEl.naturalWidth;
      canvas.height = imgEl.naturalHeight;
      const ctx = canvas.getContext("2d");

      // CSS filter string
      const f = adjustments;
      ctx.filter = [
        `brightness(${f.brightness})`,
        `contrast(${f.contrast})`,
        `saturate(${f.saturation})`,
        `hue-rotate(${f.hue}deg)`,
        f.blur > 0 ? `blur(${f.blur}px)` : "",
      ].filter(Boolean).join(" ");

      ctx.drawImage(imgEl, 0, 0);
      canvas.toBlob((blob) => resolve(URL.createObjectURL(blob)), "image/png");
    });
  }, []);

  const applyFilters = async () => {
    if (!uploadedUrl) return;
    setLoading(true);
    try {
      const img = imgRef.current || new Image();
      if (!imgRef.current) {
        await new Promise((res) => { img.onload = res; img.src = uploadedUrl; });
      }
      const url = await renderWithFilters(img, adj);
      setResultUrl(url);
    } finally {
      setLoading(false);
    }
  };

  // AI Enhance via HuggingFace (re-generate from description of the image)
  const aiEnhance = async () => {
    if (!uploadedFile) return;
    setAiLoading(true); setError("");
    try {
      // Use img2img with enhancement prompt
      const prompt = aiMode === "enhance"
        ? "highly detailed, 4k, sharp focus, professional photography, enhanced quality"
        : "clean, noise-free, sharp, high quality, denoised";

      const res = await fetch(
        "https://api-inference.huggingface.co/models/timbrooks/instruct-pix2pix",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_HF_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: { image_guidance_scale: 1.5 },
          }),
        }
      );
      if (!res.ok) throw new Error("AI enhancement failed. Try again.");
      const blob = await res.blob();
      setResultUrl(URL.createObjectURL(blob));
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setAiLoading(false);
    }
  };

  const download = () => {
    const src = resultUrl || uploadedUrl;
    if (!src) return;
    const a = document.createElement("a");
    a.href = src; a.download = `enhanced_${Date.now()}.png`; a.click();
  };

  // CSS filter string for live preview
  const liveFilter = [
    `brightness(${adj.brightness})`,
    `contrast(${adj.contrast})`,
    `saturate(${adj.saturation})`,
    `hue-rotate(${adj.hue}deg)`,
    adj.blur > 0 ? `blur(${adj.blur}px)` : "",
  ].filter(Boolean).join(" ");

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

      <div className="gen-body">
        {/* Left Panel */}
        <div className="gen-panel gen-panel--left">
          <div className="gen-panel-header">
            <div className="gen-panel-icon" style={{ background: "linear-gradient(135deg,#f59e0b,#ea580c)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
                <circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
            </div>
            <h2 className="gen-panel-title">Image Enhancement</h2>
          </div>

          {error && (
            <div className="gen-error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
              <button className="gen-error-close" onClick={() => setError("")}>✕</button>
            </div>
          )}

          {/* Upload */}
          <div className="gen-field">
            <label className="gen-label">Upload Image</label>
            {!uploadedUrl ? (
              <div
                className={`gen-dropzone ${dragOver ? "gen-dropzone--over" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="gen-dropzone-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                </div>
                <p className="gen-dropzone-text">Drag & drop or click to upload</p>
                <p className="gen-dropzone-sub">PNG, JPG up to 10MB</p>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }}
                  onChange={(e) => handleFile(e.target.files[0])} />
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                <span style={{ fontSize: 12, color: "var(--text-secondary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{uploadedFile?.name}</span>
                <button className="gen-upload-remove" onClick={() => { setUploadedUrl(null); setUploadedFile(null); setResultUrl(null); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            )}
          </div>

          {uploadedUrl && (
            <>
              {/* Presets */}
              <div className="gen-field">
                <label className="gen-label">Quick Presets</label>
                <div className="gen-chips" style={{ flexWrap: "wrap" }}>
                  {PRESETS.map((p) => (
                    <button key={p.name}
                      className={`gen-chip ${activePreset === p.name ? "gen-chip--active" : ""}`}
                      style={activePreset === p.name ? { borderColor: "#f59e0b", background: "rgba(245,158,11,0.15)", color: "#f59e0b" } : {}}
                      onClick={() => applyPreset(p)}>
                      {p.name}
                    </button>
                  ))}
                  <button className="gen-chip" onClick={resetAdj}>Reset</button>
                </div>
              </div>

              {/* Manual sliders */}
              <div className="gen-field" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <label className="gen-label">Manual Adjustments</label>
                <SliderRow label="Brightness" value={adj.brightness} min={0.4} max={1.8} step={0.01} onChange={(v) => setOne("brightness", v)} />
                <SliderRow label="Contrast"   value={adj.contrast}   min={0.4} max={2.0} step={0.01} onChange={(v) => setOne("contrast", v)} />
                <SliderRow label="Saturation" value={adj.saturation} min={0}   max={2.5} step={0.01} onChange={(v) => setOne("saturation", v)} />
                <SliderRow label="Hue Shift"  value={adj.hue}        min={-180} max={180} step={1} unit="°" onChange={(v) => setOne("hue", v)} />
                <SliderRow label="Blur"       value={adj.blur}       min={0}   max={8}   step={0.1} unit="px" onChange={(v) => setOne("blur", v)} />
              </div>

              {/* Apply Filters Button */}
              <button className="gen-generate-btn"
                style={{ background: "linear-gradient(135deg,#f59e0b,#ea580c)" }}
                onClick={applyFilters} disabled={loading}>
                {loading ? (
                  <><span className="gen-spinner" />Applying…</>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42"/></svg>
                    Apply Enhancements
                  </>
                )}
              </button>

              {/* AI Enhance */}
              <div style={{ marginTop: 4 }}>
                <label className="gen-label" style={{ marginBottom: 8 }}>AI Enhancement</label>
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  {["enhance", "denoise"].map((m) => (
                    <button key={m} onClick={() => setAiMode(m)}
                      className={`gen-chip ${aiMode === m ? "gen-chip--active" : ""}`}
                      style={aiMode === m ? { borderColor: "#f59e0b", background: "rgba(245,158,11,0.15)", color: "#f59e0b" } : {}}
                    >
                      {m === "enhance" ? "✨ AI Enhance" : "🧹 AI Denoise"}
                    </button>
                  ))}
                </div>
                <button className="gen-generate-btn"
                  style={{ background: "rgba(245,158,11,0.12)", border: "1.5px solid #f59e0b", color: "#f59e0b" }}
                  onClick={aiEnhance} disabled={aiLoading}>
                  {aiLoading ? (
                    <><span className="gen-spinner" style={{ borderTopColor: "#f59e0b" }} />Processing with AI…</>
                  ) : (
                    <><SparkleIcon size={15} color="#f59e0b" />{aiMode === "enhance" ? "AI Enhance Quality" : "AI Denoise Image"}</>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Right Panel */}
        <div className="gen-panel gen-panel--right">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 className="gen-preview-title" style={{ margin: 0 }}>
              {resultUrl ? "Enhanced Result" : "Live Preview"}
            </h2>
            {uploadedUrl && (
              <button
                className="gen-action-btn"
                onMouseDown={() => setShowOriginal(true)}
                onMouseUp={() => setShowOriginal(false)}
                onMouseLeave={() => setShowOriginal(false)}
                style={{ fontSize: 11 }}
              >
                👁 Hold to compare
              </button>
            )}
          </div>

          <div className="gen-preview-box">
            {!uploadedUrl && (
              <div className="gen-preview-empty">
                <div className="gen-preview-empty-icon" style={{ color: "#f59e0b" }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                  </svg>
                </div>
                <p className="gen-preview-empty-text">Upload an image to enhance</p>
                <p className="gen-preview-empty-sub">Adjust sliders or apply AI enhancement</p>
              </div>
            )}

            {(loading || aiLoading) && (
              <div className="gen-preview-loading">
                <div className="gen-preview-spinner" style={{ borderTopColor: "#f59e0b" }} />
                <p className="gen-preview-loading-text">{aiLoading ? "AI is enhancing…" : "Applying filters…"}</p>
                <p className="gen-preview-loading-sub">
                  {aiLoading ? "This may take 15–30 seconds" : "Just a moment"}
                </p>
              </div>
            )}

            {/* Live preview with CSS filter */}
            {uploadedUrl && !loading && !aiLoading && !resultUrl && (
              <div className="gen-preview-img-wrap gen-preview-img-wrap--loaded">
                <img
                  ref={imgRef}
                  src={uploadedUrl}
                  alt="Preview"
                  className="gen-preview-img"
                  style={{ filter: liveFilter, transition: "filter 0.15s ease" }}
                />
              </div>
            )}

            {/* Result — with compare toggle */}
            {uploadedUrl && !loading && !aiLoading && resultUrl && (
              <div className="gen-preview-img-wrap gen-preview-img-wrap--loaded" style={{ position: "relative" }}>
                <img
                  src={showOriginal ? uploadedUrl : resultUrl}
                  alt={showOriginal ? "Original" : "Enhanced"}
                  className="gen-preview-img"
                />
                {showOriginal && (
                  <div style={{
                    position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
                    background: "rgba(0,0,0,0.7)", borderRadius: 8, padding: "4px 12px",
                    fontSize: 11, color: "white", pointerEvents: "none",
                  }}>Original</div>
                )}
              </div>
            )}
          </div>

          <div className="gen-preview-actions">
            <button className="gen-action-btn" onClick={download} disabled={!resultUrl && !uploadedUrl}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              Download
            </button>
            {resultUrl && (
              <button className="gen-action-btn" onClick={() => setResultUrl(null)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
                Adjust Again
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}