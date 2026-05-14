import { useState, useRef, useCallback } from "react";

/* ─── THEME (matches Landing + ModePicker) ─── */
const T = {
  bg:        "#f5f0e8",
  card:      "#fff",
  border:    "#e8e0d0",
  borderHov: "#d4c9b8",
  accent:    "#d07a2a",            // orange accent for enhancement
  accentDim: "rgba(208,122,42,0.10)",
  accentBrd: "rgba(208,122,42,0.30)",
  text:      "#2a1f12",
  muted:     "#7a6a55",
  faint:     "#a89880",
  inputBg:   "#faf8f4",
};

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=DM+Sans:wght@400;500;600;700&display=swap');`;

const PRESETS = [
  { name: "Vivid",     brightness: 1.05, contrast: 1.15, saturation: 1.4,  sharpness: 0, hue: 0  },
  { name: "Cinematic", brightness: 0.92, contrast: 1.25, saturation: 0.85, sharpness: 0, hue: 0  },
  { name: "Warm",      brightness: 1.0,  contrast: 1.05, saturation: 1.1,  sharpness: 0, hue: 15 },
  { name: "Cool",      brightness: 1.0,  contrast: 1.05, saturation: 1.0,  sharpness: 0, hue:-15 },
  { name: "B&W",       brightness: 1.0,  contrast: 1.2,  saturation: 0,    sharpness: 0, hue: 0  },
  { name: "Faded",     brightness: 1.08, contrast: 0.85, saturation: 0.7,  sharpness: 0, hue: 0  },
];

const DEFAULT_ADJ = { brightness: 1, contrast: 1, saturation: 1, sharpness: 0, hue: 0, blur: 0 };

const SparkleIcon = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 2L13.09 8.26L19 6L14.74 10.26L21 12L14.74 13.74L19 18L13.09 15.74L12 22L10.91 15.74L5 18L9.26 13.74L3 12L9.26 10.26L5 6L10.91 8.26L12 2Z" />
  </svg>
);

function SliderRow({ label, value, min, max, step, onChange, unit = "" }) {
  const pct = ((value - min) / (max - min)) * 100;
  const display = typeof value === "number" && value % 1 !== 0 ? value.toFixed(2) : value;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>{label}</label>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: T.accent }}>{display}{unit}</span>
      </div>
      <div style={{ position: "relative", height: 6, background: T.border, borderRadius: 99 }}>
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${T.accent}, #e09050)`, borderRadius: 99, transition: "width .1s" }} />
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{ position: "absolute", inset: 0, width: "100%", opacity: 0, cursor: "pointer", margin: 0, height: "100%" }}
        />
        <div style={{ position: "absolute", top: "50%", left: `${pct}%`, transform: "translate(-50%,-50%)", width: 14, height: 14, borderRadius: "50%", background: T.card, border: `2px solid ${T.accent}`, boxShadow: `0 2px 6px rgba(208,122,42,0.35)`, pointerEvents: "none", transition: "left .1s" }} />
      </div>
    </div>
  );
}

export default function ImageEnhancement({ onBack }) {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedUrl,  setUploadedUrl]  = useState(null);
  const [adj,          setAdj]          = useState(DEFAULT_ADJ);
  const [activePreset, setActivePreset] = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [aiLoading,    setAiLoading]    = useState(false);
  const [resultUrl,    setResultUrl]    = useState(null);
  const [error,        setError]        = useState("");
  const [dragOver,     setDragOver]     = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [aiMode,       setAiMode]       = useState("enhance");

  const fileInputRef = useRef(null);
  const imgRef       = useRef(null);

  const setOne = (key, val) => { setAdj(p => ({ ...p, [key]: val })); setActivePreset(null); };
  const applyPreset = (preset) => { setAdj(p => ({ ...p, ...preset })); setActivePreset(preset.name); };
  const resetAdj = () => { setAdj(DEFAULT_ADJ); setActivePreset(null); };

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setUploadedFile(file); setUploadedUrl(URL.createObjectURL(file));
    setResultUrl(null); setAdj(DEFAULT_ADJ); setActivePreset(null);
  };

  const onDrop = useCallback((e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }, []);

  const renderWithFilters = useCallback((imgEl, adjustments) => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      canvas.width = imgEl.naturalWidth; canvas.height = imgEl.naturalHeight;
      const ctx = canvas.getContext("2d");
      const f = adjustments;
      ctx.filter = [`brightness(${f.brightness})`, `contrast(${f.contrast})`, `saturate(${f.saturation})`, `hue-rotate(${f.hue}deg)`, f.blur > 0 ? `blur(${f.blur}px)` : ""].filter(Boolean).join(" ");
      ctx.drawImage(imgEl, 0, 0);
      canvas.toBlob((blob) => resolve(URL.createObjectURL(blob)), "image/png");
    });
  }, []);

  const applyFilters = async () => {
    if (!uploadedUrl) return;
    setLoading(true);
    try {
      const img = imgRef.current || new Image();
      if (!imgRef.current) { await new Promise(res => { img.onload = res; img.src = uploadedUrl; }); }
      setResultUrl(await renderWithFilters(img, adj));
    } finally { setLoading(false); }
  };

  const aiEnhance = async () => {
    if (!uploadedFile) return;
    setAiLoading(true); setError("");
    try {
      const prompt = aiMode === "enhance" ? "highly detailed, 4k, sharp focus, professional photography, enhanced quality" : "clean, noise-free, sharp, high quality, denoised";
      const res = await fetch("https://api-inference.huggingface.co/models/timbrooks/instruct-pix2pix", {
        method: "POST",
        headers: { Authorization: `Bearer ${import.meta.env.VITE_HF_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: prompt, parameters: { image_guidance_scale: 1.5 } }),
      });
      if (!res.ok) throw new Error("AI enhancement failed. Try again.");
      setResultUrl(URL.createObjectURL(await res.blob()));
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally { setAiLoading(false); }
  };

  const download = () => {
    const src = resultUrl || uploadedUrl;
    if (!src) return;
    const a = document.createElement("a"); a.href = src; a.download = `enhanced_${Date.now()}.png`; a.click();
  };

  const liveFilter = [`brightness(${adj.brightness})`, `contrast(${adj.contrast})`, `saturate(${adj.saturation})`, `hue-rotate(${adj.hue}deg)`, adj.blur > 0 ? `blur(${adj.blur}px)` : ""].filter(Boolean).join(" ");

  const BtnStyle = (active, disabled) => ({
    width: "100%", padding: "13px", borderRadius: 14,
    background: disabled ? T.border : active ? `linear-gradient(135deg, ${T.accent}, #e09050)` : T.accentDim,
    border: `1.5px solid ${disabled ? T.border : T.accentBrd}`,
    color: disabled ? T.faint : active ? "#fff" : T.accent,
    fontSize: 13.5, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.2px",
    boxShadow: disabled || !active ? "none" : `0 4px 18px rgba(208,122,42,0.35)`,
    transition: "all .2s",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100vw", overflow: "hidden", background: T.bg, fontFamily: "'DM Sans', sans-serif", color: T.text }}>
      <style>{`
        ${FONTS}
        @keyframes ie-spin { to { transform: rotate(360deg); } }
        @keyframes ie-fade { from { opacity:0; } to { opacity:1; } }
        * { box-sizing: border-box; }
      `}</style>

      {/* ── Navbar ── */}
      <nav style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 32px", height: 60, flexShrink: 0, borderBottom: `1px solid ${T.border}`, background: T.bg, zIndex: 100 }}>
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 99, border: `1.5px solid ${T.border}`, background: "transparent", fontSize: 13, fontWeight: 600, color: T.muted, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all .18s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.accentBrd; e.currentTarget.style.color = T.accent; e.currentTarget.style.background = T.accentDim; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; e.currentTarget.style.background = "transparent"; }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Back
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#c0562a,#e08050)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14 }}>✦</div>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#c0562a", fontFamily: "'Playfair Display', serif" }}>ImageGen</span>
          <span style={{ fontSize: 11, color: T.accent, fontWeight: 600, background: T.accentDim, padding: "2px 8px", borderRadius: 6, border: `1px solid ${T.accentBrd}` }}>Enhancement</span>
        </div>

        <div style={{ flex: 1 }} />
        {["Features", "Gallery", "Pricing", "Docs"].map(l => (
          <span key={l} style={{ padding: "5px 12px", color: T.muted, fontSize: 13, cursor: "pointer", fontWeight: 500, transition: "color .15s" }}
            onMouseEnter={e => e.currentTarget.style.color = T.text}
            onMouseLeave={e => e.currentTarget.style.color = T.muted}
          >{l}</span>
        ))}
        <button style={{ padding: "8px 18px", borderRadius: 99, background: "#c0562a", border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Get Started</button>
      </nav>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ── LEFT PANEL ── */}
        <div style={{ width: 400, borderRight: `1px solid ${T.border}`, overflowY: "auto", background: T.card, display: "flex", flexDirection: "column", flexShrink: 0 }}>

          {/* Header */}
          <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${T.accent}, #e09050)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 16px ${T.accentDim}` }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: T.text, fontFamily: "'Playfair Display', serif", letterSpacing: "-0.3px" }}>Image Enhancement</h2>
              <p style={{ margin: 0, fontSize: 12, color: T.muted }}>Upscale, filter and apply AI effects</p>
            </div>
          </div>

          <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>

            {error && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", background: "#fff5f5", border: "1.5px solid #fecaca", borderRadius: 10, fontSize: 13, color: "#dc2626" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>
                <span style={{ flex: 1 }}>{error}</span>
                <button onClick={() => setError("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", padding: 0, fontSize: 16 }}>✕</button>
              </div>
            )}

            {/* UPLOAD */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 10 }}>Upload Image</div>
              {!uploadedUrl ? (
                <div onClick={() => fileInputRef.current?.click()} onDrop={onDrop}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
                  style={{ border: `2px dashed ${dragOver ? T.accent : T.border}`, borderRadius: 16, padding: "32px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, cursor: "pointer", background: dragOver ? T.accentDim : T.inputBg, transition: "all .2s", textAlign: "center" }}
                  onMouseEnter={e => { if (!dragOver) { e.currentTarget.style.borderColor = T.accentBrd; e.currentTarget.style.background = T.accentDim; } }}
                  onMouseLeave={e => { if (!dragOver) { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.inputBg; } }}
                >
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: T.accentDim, display: "flex", alignItems: "center", justifyContent: "center", color: T.accent }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>Drag & drop or click to upload</div>
                  <div style={{ fontSize: 12, color: T.faint }}>PNG, JPG up to 10MB</div>
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 13px", background: T.inputBg, border: `1.5px solid ${T.border}`, borderRadius: 12 }}>
                  <img src={uploadedUrl} alt="uploaded" style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", border: `1px solid ${T.border}`, flexShrink: 0 }} />
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{uploadedFile?.name}</div>
                    <div style={{ fontSize: 11.5, color: T.faint, marginTop: 2 }}><span style={{ color: "#16a34a", fontWeight: 600 }}>✓ Ready to enhance</span></div>
                  </div>
                  <button onClick={() => { setUploadedUrl(null); setUploadedFile(null); setResultUrl(null); }} style={{ background: "#fff5f5", border: "1px solid #fecaca", borderRadius: 7, padding: "5px 7px", color: "#ef4444", cursor: "pointer", display: "flex" }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              )}
            </div>

            {uploadedUrl && (<>

              {/* PRESETS */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 10 }}>Quick Presets</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {PRESETS.map(p => (
                    <button key={p.name} onClick={() => applyPreset(p)} style={{ padding: "6px 14px", borderRadius: 99, border: `1.5px solid ${activePreset === p.name ? T.accentBrd : T.border}`, background: activePreset === p.name ? T.accentDim : "transparent", color: activePreset === p.name ? T.accent : T.muted, fontSize: 12.5, fontWeight: activePreset === p.name ? 600 : 500, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all .15s" }}>{p.name}</button>
                  ))}
                  <button onClick={resetAdj} style={{ padding: "6px 14px", borderRadius: 99, border: `1.5px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 12.5, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all .15s" }}>Reset</button>
                </div>
              </div>

              {/* SLIDERS */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 14 }}>Manual Adjustments</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <SliderRow label="Brightness" value={adj.brightness} min={0.4} max={1.8} step={0.01} onChange={v => setOne("brightness", v)} />
                  <SliderRow label="Contrast"   value={adj.contrast}   min={0.4} max={2.0} step={0.01} onChange={v => setOne("contrast", v)} />
                  <SliderRow label="Saturation" value={adj.saturation} min={0}   max={2.5} step={0.01} onChange={v => setOne("saturation", v)} />
                  <SliderRow label="Hue Shift"  value={adj.hue}        min={-180} max={180} step={1}   onChange={v => setOne("hue", v)}        unit="°" />
                  <SliderRow label="Blur"        value={adj.blur}       min={0}   max={8}   step={0.1}  onChange={v => setOne("blur", v)}        unit="px" />
                </div>
              </div>

              {/* APPLY FILTERS */}
              <button onClick={applyFilters} disabled={loading} style={BtnStyle(true, loading)}>
                {loading ? (
                  <><span style={{ width: 14, height: 14, border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "ie-spin 0.75s linear infinite", display: "inline-block" }} />Applying…</>
                ) : (
                  <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42"/></svg>Apply Enhancements</>
                )}
              </button>

              {/* AI ENHANCE */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 10 }}>AI Enhancement</div>
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  {["enhance", "denoise"].map(m => (
                    <button key={m} onClick={() => setAiMode(m)} style={{ flex: 1, padding: "8px 12px", borderRadius: 10, border: `1.5px solid ${aiMode === m ? T.accentBrd : T.border}`, background: aiMode === m ? T.accentDim : "transparent", color: aiMode === m ? T.accent : T.muted, fontSize: 12.5, fontWeight: aiMode === m ? 600 : 500, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all .15s" }}>
                      {m === "enhance" ? "✨ AI Enhance" : "🧹 AI Denoise"}
                    </button>
                  ))}
                </div>
                <button onClick={aiEnhance} disabled={aiLoading} style={BtnStyle(false, aiLoading)}>
                  {aiLoading ? (
                    <><span style={{ width: 14, height: 14, border: `2.5px solid ${T.accentDim}`, borderTopColor: T.accent, borderRadius: "50%", animation: "ie-spin 0.75s linear infinite", display: "inline-block" }} />Processing with AI…</>
                  ) : (
                    <><SparkleIcon size={15} color={T.accent} />{aiMode === "enhance" ? "AI Enhance Quality" : "AI Denoise Image"}</>
                  )}
                </button>
              </div>

            </>)}
          </div>
        </div>

        {/* ── RIGHT PANEL — PREVIEW ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Preview header */}
          <div style={{ padding: "16px 28px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 12, flexShrink: 0, background: T.card }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: T.text, fontFamily: "'Playfair Display', serif" }}>
              {resultUrl ? "Enhanced Result" : "Live Preview"}
            </span>
            {resultUrl && <span style={{ fontSize: 11.5, color: "#16a34a", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "2px 9px", borderRadius: 6, fontWeight: 600 }}>✓ Enhanced</span>}
            <div style={{ flex: 1 }} />
            {uploadedUrl && (
              <button
                onMouseDown={() => setShowOriginal(true)}
                onMouseUp={() => setShowOriginal(false)}
                onMouseLeave={() => setShowOriginal(false)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all .15s", background: T.inputBg, border: `1.5px solid ${T.border}`, color: T.muted }}
              >
                👁 Hold to compare
              </button>
            )}
            {(resultUrl || uploadedUrl) && (
              <button onClick={download} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all .15s", background: T.inputBg, border: `1.5px solid ${T.border}`, color: T.muted }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = T.accentBrd; e.currentTarget.style.color = T.accent; e.currentTarget.style.background = T.accentDim; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; e.currentTarget.style.background = T.inputBg; }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                Download
              </button>
            )}
          </div>

          {/* Preview body */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 32, overflow: "hidden", position: "relative" }}>

            {!uploadedUrl && !loading && !aiLoading && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center" }}>
                <div style={{ width: 80, height: 80, borderRadius: 24, background: T.accentDim, border: `1.5px solid ${T.accentBrd}`, display: "flex", alignItems: "center", justifyContent: "center", color: T.accent }}>
                  <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                </div>
                <div>
                  <p style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 700, color: T.text, fontFamily: "'Playfair Display', serif" }}>Upload an image to enhance</p>
                  <p style={{ margin: 0, fontSize: 13, color: T.faint }}>Adjust sliders or apply AI enhancement</p>
                </div>
              </div>
            )}

            {(loading || aiLoading) && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
                <div style={{ position: "relative", width: 56, height: 56 }}>
                  <div style={{ width: 56, height: 56, border: `3px solid ${T.accentDim}`, borderTopColor: T.accent, borderRadius: "50%", animation: "ie-spin 0.9s linear infinite" }} />
                  <div style={{ position: "absolute", inset: 10, border: `3px solid rgba(208,122,42,0.1)`, borderTopColor: "#e09050", borderRadius: "50%", animation: "ie-spin 1.6s linear infinite reverse" }} />
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: T.text, fontFamily: "'Playfair Display', serif" }}>{aiLoading ? "AI is enhancing…" : "Applying filters…"}</p>
                  <p style={{ margin: 0, fontSize: 12.5, color: T.faint }}>{aiLoading ? "This may take 15–30 seconds" : "Just a moment"}</p>
                </div>
              </div>
            )}

            {/* Live filter preview */}
            {uploadedUrl && !loading && !aiLoading && !resultUrl && (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", animation: "ie-fade 0.3s ease" }}>
                <img ref={imgRef} src={uploadedUrl} alt="Preview"
                  style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 16, boxShadow: "0 8px 40px rgba(42,31,18,0.12)", objectFit: "contain", filter: liveFilter, transition: "filter .15s ease" }} />
              </div>
            )}

            {/* Result with compare */}
            {uploadedUrl && !loading && !aiLoading && resultUrl && (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", animation: "ie-fade 0.4s ease" }}>
                <img src={showOriginal ? uploadedUrl : resultUrl} alt={showOriginal ? "Original" : "Enhanced"}
                  style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 16, boxShadow: "0 8px 40px rgba(42,31,18,0.12)", objectFit: "contain" }} />
                {showOriginal && (
                  <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "rgba(42,31,18,0.75)", borderRadius: 8, padding: "5px 14px", fontSize: 12, color: "white", backdropFilter: "blur(4px)" }}>
                    Original
                  </div>
                )}
                {!showOriginal && resultUrl && (
                  <div style={{ position: "absolute", top: 16, right: 16, background: "rgba(208,122,42,0.9)", borderRadius: 8, padding: "4px 12px", fontSize: 11.5, color: "white", fontWeight: 600, backdropFilter: "blur(4px)" }}>
                    ✓ Enhanced
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom adjust again button */}
          {resultUrl && (
            <div style={{ padding: "12px 28px 16px", borderTop: `1px solid ${T.border}`, display: "flex", gap: 10, background: T.card }}>
              <button onClick={() => setResultUrl(null)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", background: T.inputBg, border: `1.5px solid ${T.border}`, color: T.muted, transition: "all .15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = T.accentBrd; e.currentTarget.style.color = T.accent; e.currentTarget.style.background = T.accentDim; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; e.currentTarget.style.background = T.inputBg; }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
                Adjust Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}