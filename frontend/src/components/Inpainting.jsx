/**
 * Inpainting.jsx  — warm-themed, with back button
 * 
 * This is the original Inpainting.jsx with:
 *  1. Warm beige CSS injected on mount
 *  2. Back button added to the navbar
 *  3. Logo/button colors updated to terracotta
 * 
 * All canvas/drawing logic is UNCHANGED.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import api from "../services/api.js";

/* ─── Warm CSS (injected once) ─────────────────────────────────── */
const WARM_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box}
.gen-root{background:#f5f0e8!important;font-family:'DM Sans',sans-serif!important;color:#2a1f12!important}
.gen-nav{background:#f5f0e8!important;border-bottom:1px solid #e0d8cc!important}
.gen-logo{color:#c0562a!important;font-family:'Playfair Display',serif!important;font-weight:700!important}
.gen-logo-icon{background:linear-gradient(135deg,#c0562a,#e08050)!important}
.gen-nav-link{color:#7a6a55!important}.gen-nav-link:hover{color:#2a1f12!important}
.gen-btn-primary{background:#c0562a!important;border-radius:99px!important;color:#fff!important}
.gen-btn-primary:hover{background:#a8481f!important}
.gen-panel--left{background:#fff!important;border-right:1px solid #e0d8cc!important}
.gen-panel--right{background:#faf8f4!important}
.gen-panel-header{border-bottom:1px solid #ede8df!important}
.gen-panel-title{font-family:'Playfair Display',serif!important;color:#2a1f12!important}
.gen-label{color:#7a6a55!important}.gen-required{color:#c0562a!important}.gen-strength-val{color:#c0562a!important}
.gen-textarea{background:#faf8f4!important;border:1.5px solid #e0d8cc!important;color:#2a1f12!important}
.gen-textarea:focus{border-color:#c0562a!important;outline:none}
.gen-textarea::placeholder{color:#a89880!important}
.gen-dropzone{border:2px dashed #d4c9b8!important;background:#faf8f4!important}
.gen-dropzone:hover,.gen-dropzone--active{border-color:#c0562a!important;background:#fdf5f0!important}
.gen-dropzone-icon{color:#c0562a!important}.gen-dropzone-text{color:#2a1f12!important}.gen-dropzone-sub{color:#a89880!important}
.gen-chip{border:1.5px solid #e0d8cc!important;background:#faf8f4!important;color:#7a6a55!important;border-radius:99px!important}
.gen-chip:hover{border-color:#c0562a!important;color:#c0562a!important;background:#fdf5f0!important}
.gen-chip--active{border-color:#c0562a!important;background:#fdf5f0!important;color:#c0562a!important;font-weight:700!important}
.gen-slider{background:linear-gradient(to right,#c0562a var(--slider-val,50%),#e0d8cc var(--slider-val,50%))!important}
.gen-slider::-webkit-slider-thumb{background:#c0562a!important}
.gen-generate-btn{background:linear-gradient(135deg,#c0562a,#e08050)!important;border-radius:12px!important;box-shadow:0 4px 20px rgba(192,86,42,0.3)!important}
.gen-generate-btn:disabled{background:#e0d8cc!important;color:#a89880!important;box-shadow:none!important}
.gen-error{background:#fdf5f0!important;border:1px solid #f4c4a8!important;color:#c0562a!important;border-radius:10px!important}
.gen-error-close{color:#c0562a!important}
.gen-preview-title{font-family:'Playfair Display',serif!important;color:#2a1f12!important}
.gen-preview-box{border:1.5px solid #e0d8cc!important;background:#fff!important;border-radius:16px!important}
.gen-preview-empty-text{font-family:'Playfair Display',serif!important;color:#2a1f12!important}
.gen-preview-empty-sub{color:#a89880!important}
.gen-preview-spinner{border-color:#e0d8cc;border-top-color:#c0562a!important}
.gen-preview-loading-text{color:#2a1f12!important}.gen-preview-loading-sub{color:#a89880!important}
.gen-action-btn{border:1.5px solid #e0d8cc!important;background:#fff!important;color:#7a6a55!important;border-radius:99px!important}
.gen-action-btn:hover:not(:disabled){border-color:#c0562a!important;color:#c0562a!important;background:#fdf5f0!important}
.gen-action-btn:disabled{opacity:0.4;cursor:not-allowed}
.gen-upload-remove{background:#fdf5f0!important;border:1px solid #f4c4a8!important;color:#c0562a!important}
`;

function useWarmTheme() {
  useEffect(() => {
    const id = "warm-theme-inpainting";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = WARM_CSS;
      document.head.appendChild(el);
    }
  }, []);
}

/* ─── Icons ── */
const SparkleIcon = ({ size = 18, color = "white" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 2L13.09 8.26L19 6L14.74 10.26L21 12L14.74 13.74L19 18L13.09 15.74L12 22L10.91 15.74L5 18L9.26 13.74L3 12L9.26 10.26L5 6L10.91 8.26L12 2Z" />
  </svg>
);

const BackArrow = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="M19 12H5M12 5l-7 7 7 7" />
  </svg>
);

const MAX_W = 560;
const MAX_H = 420;

export default function Inpainting({ onBack }) {
  useWarmTheme();

  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedUrl,  setUploadedUrl]  = useState(null);
  const [brushSize,    setBrushSize]    = useState(28);
  const [tool,         setTool]         = useState("paint");
  const [fillPrompt,   setFillPrompt]   = useState("");
  const [loading,      setLoading]      = useState(false);
  const [resultUrl,    setResultUrl]    = useState(null);
  const [error,        setError]        = useState("");
  const [hasMask,      setHasMask]      = useState(false);
  const [dragOver,     setDragOver]     = useState(false);
  const [imgReady,     setImgReady]     = useState(false);
  const [cursorPos,    setCursorPos]    = useState(null);

  const displayCanvasRef = useRef(null);
  const maskCanvasRef    = useRef(null);
  const fileInputRef     = useRef(null);
  const imgRef           = useRef(null);
  const isDrawing        = useRef(false);
  const lastPos          = useRef(null);
  const toolRef          = useRef(tool);
  const brushRef         = useRef(brushSize);

  useEffect(() => { toolRef.current = tool; },      [tool]);
  useEffect(() => { brushRef.current = brushSize; }, [brushSize]);

  useEffect(() => {
    const handler = () => { isDrawing.current = false; };
    window.addEventListener("mouseup", handler);
    return () => window.removeEventListener("mouseup", handler);
  }, []);

  const checkHasMask = useCallback(() => {
    const mask = maskCanvasRef.current;
    if (!mask || !mask.width) return false;
    const data = mask.getContext("2d").getImageData(0, 0, mask.width, mask.height).data;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 10) return true;
    }
    return false;
  }, []);

  const redraw = useCallback(() => {
    const display = displayCanvasRef.current;
    const mask    = maskCanvasRef.current;
    const img     = imgRef.current;
    if (!display || !mask || !img) return;
    const ctx = display.getContext("2d");
    const w = display.width, h = display.height;
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.drawImage(img, 0, 0, w, h);
    const off = document.createElement("canvas");
    off.width = w; off.height = h;
    const offCtx = off.getContext("2d");
    offCtx.fillStyle = "#c0562a";
    offCtx.fillRect(0, 0, w, h);
    offCtx.globalCompositeOperation = "destination-in";
    offCtx.drawImage(mask, 0, 0);
    ctx.globalAlpha = 0.45;
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(off, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }, []);

  useEffect(() => {
    if (!uploadedUrl) return;
    setImgReady(false); setHasMask(false);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const scale = Math.min(MAX_W / img.width, MAX_H / img.height, 1);
      const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
      const display = displayCanvasRef.current, mask = maskCanvasRef.current;
      if (!display || !mask) return;
      display.width = w; display.height = h;
      mask.width = w; mask.height = h;
      display.getContext("2d").drawImage(img, 0, 0, w, h);
      mask.getContext("2d", { willReadFrequently: true }).clearRect(0, 0, w, h);
      setImgReady(true);
    };
    img.onerror = () => setError("Failed to load image.");
    img.src = uploadedUrl;
  }, [uploadedUrl]);

  const getPos = (e) => {
    const canvas = displayCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (cx - rect.left) * (canvas.width / rect.width),
      y: (cy - rect.top)  * (canvas.height / rect.height),
    };
  };

  const applyBrush = (from, to) => {
    const mask = maskCanvasRef.current;
    if (!mask) return;
    const ctx = mask.getContext("2d", { willReadFrequently: true });
    const size = brushRef.current;
    let mode = toolRef.current;
    if (mode === "erase") {
      const px = ctx.getImageData(Math.floor(from.x), Math.floor(from.y), 1, 1).data;
      if (px[3] <= 10) mode = "paint";
    }
    ctx.save();
    ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.lineWidth = size;
    if (mode === "erase") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)"; ctx.fillStyle = "rgba(0,0,0,1)";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "white"; ctx.fillStyle = "white";
    }
    ctx.beginPath(); ctx.arc(from.x, from.y, size / 2, 0, Math.PI * 2); ctx.fill();
    if (from.x !== to.x || from.y !== to.y) {
      ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke();
    }
    ctx.restore();
    redraw();
  };

  const onMouseDown = (e) => {
    if (!imgReady) return;
    e.preventDefault();
    isDrawing.current = true;
    const pos = getPos(e);
    lastPos.current = pos;
    applyBrush(pos, pos);
    setHasMask(checkHasMask());
  };

  const onMouseMove = (e) => {
    const canvas = displayCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    if (!isDrawing.current || !imgReady) return;
    e.preventDefault();
    const pos = getPos(e);
    applyBrush(lastPos.current || pos, pos);
    lastPos.current = pos;
    setHasMask(checkHasMask());
  };

  const onMouseUp   = () => { isDrawing.current = false; };
  const onMouseLeave = () => { isDrawing.current = false; setCursorPos(null); };

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) { setError("Please upload a valid image file."); return; }
    imgRef.current = null;
    setUploadedFile(file); setUploadedUrl(URL.createObjectURL(file));
    setResultUrl(null); setImgReady(false); setHasMask(false); setError("");
  };

  const onDrop = useCallback((e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }, []);

  const reset = () => {
    imgRef.current = null;
    setUploadedFile(null); setUploadedUrl(null); setResultUrl(null);
    setImgReady(false); setHasMask(false); setError(""); setFillPrompt("");
  };

  const tryAgain = () => {
    setResultUrl(null);
    const mask = maskCanvasRef.current;
    if (mask) mask.getContext("2d").clearRect(0, 0, mask.width, mask.height);
    setHasMask(false); redraw();
  };

  const download = () => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl; a.download = `inpainted_${Date.now()}.png`; a.click();
  };

  const runInpainting = async () => {
    if (tool !== "erase" && !fillPrompt.trim()) { setError("Please describe what to place in the masked area."); return; }
    if (!uploadedFile) { setError("Please upload an image first."); return; }
    if (!hasMask) { setError("Please paint a mask on the image first."); return; }
    setError(""); setLoading(true);
    try {
      const maskCanvas = maskCanvasRef.current;
      const maskBlob = await new Promise(res => maskCanvas.toBlob(res, "image/png"));
      const maskFile = new File([maskBlob], "mask.png", { type: "image/png" });
      const prompt = tool === "erase" ? "natural background, seamless fill" : fillPrompt.trim();
      const data = await api.generate.inpaint({ image: uploadedFile, mask: maskFile, prompt });
      setResultUrl(data.generation?.image_url || data.imageUrl);
    } catch (err) {
      setError(err.message || "Inpainting failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gen-root">
      {/* ── Navbar ── */}
      <nav className="gen-nav" style={{ display: "flex", alignItems: "center", padding: "0 28px", height: 60, flexShrink: 0, gap: 12 }}>
        {/* Back button */}
        <button onClick={onBack} style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "7px 14px", borderRadius: 99, border: "1.5px solid #d4c9b8",
          background: "transparent", color: "#7a6a55", fontSize: 13, fontWeight: 600,
          cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s", flexShrink: 0,
        }}
          onMouseEnter={e => { e.currentTarget.style.background = "#ede8df"; e.currentTarget.style.color = "#2a1f12"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#7a6a55"; }}
        >
          <BackArrow /> Back
        </button>

        <div className="gen-logo" style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div className="gen-logo-icon" style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <SparkleIcon size={14} />
          </div>
          ImageGen
        </div>

        <div className="gen-nav-links" style={{ display: "flex", alignItems: "center", gap: 28, marginLeft: "auto" }}>
          {["Features", "Pricing", "Docs"].map(l => (
            <span key={l} className="gen-nav-link" style={{ fontSize: 13, cursor: "pointer", fontWeight: 500 }}>{l}</span>
          ))}
        </div>
        <button className="gen-btn-primary" style={{ padding: "8px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none" }}>
          Get Started
        </button>
      </nav>

      <div className="gen-body" style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── Left Panel ── */}
        <div className="gen-panel gen-panel--left" style={{ width: 300, flexShrink: 0, overflowY: "auto", padding: "24px 22px", display: "flex", flexDirection: "column", gap: 0, scrollbarWidth: "thin" }}>

          <div className="gen-panel-header" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, paddingBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#3aab8a,#2d9070)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 12px rgba(58,171,138,0.3)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
            </div>
            <h2 className="gen-panel-title" style={{ fontSize: 18, margin: 0 }}>Inpainting</h2>
          </div>

          {error && (
            <div className="gen-error" style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", marginBottom: 14, fontSize: 12.5 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
              <button className="gen-error-close" onClick={() => setError("")} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontSize: 14, padding: 0 }}>✕</button>
            </div>
          )}

          {/* Upload */}
          <div className="gen-field" style={{ marginBottom: 16 }}>
            <label className="gen-label" style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: 8 }}>
              Upload Image <span className="gen-required">*</span>
            </label>
            {!uploadedUrl ? (
              <div className={`gen-dropzone${dragOver ? " gen-dropzone--active" : ""}`}
                onClick={() => fileInputRef.current?.click()}
                onDrop={onDrop}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                style={{ border: "2px dashed #d4c9b8", borderRadius: 12, padding: "24px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer", textAlign: "center" }}
              >
                <div className="gen-dropzone-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                </div>
                <p className="gen-dropzone-text" style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Drag & drop or click to upload</p>
                <p className="gen-dropzone-sub" style={{ margin: 0, fontSize: 12 }}>PNG, JPG up to 10MB</p>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#faf8f4", border: "1px solid #e0d8cc", borderRadius: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c0562a" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                <span style={{ fontSize: 12, color: "#7a6a55", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{uploadedFile?.name}</span>
                <button className="gen-upload-remove" onClick={reset} style={{ background: "#fdf5f0", border: "1px solid #f4c4a8", borderRadius: 7, padding: "5px", color: "#c0562a", cursor: "pointer", display: "flex" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            )}
          </div>

          {/* Brush size */}
          {uploadedUrl && (
            <div className="gen-field" style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <label className="gen-label" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.7px", margin: 0 }}>Brush Size</label>
                <span className="gen-strength-val" style={{ fontSize: 12, fontWeight: 700 }}>{brushSize}px</span>
              </div>
              <input type="range" min={4} max={80} step={2} value={brushSize}
                onChange={e => setBrushSize(Number(e.target.value))}
                className="gen-slider"
                style={{ width: "100%", "--slider-val": `${((brushSize - 4) / 76) * 100}%` }} />
            </div>
          )}

          {/* Tool selector */}
          {uploadedUrl && (
            <div className="gen-field" style={{ marginBottom: 16 }}>
              <label className="gen-label" style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: 8 }}>Brush Tool</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[{ key: "paint", label: "🖌️ Paint Mask" }, { key: "erase", label: "✏️ Erase" }].map(t => (
                  <button key={t.key}
                    onClick={() => { setTool(t.key); toolRef.current = t.key; }}
                    className={`gen-chip${tool === t.key ? " gen-chip--active" : ""}`}
                    style={{ padding: "7px 14px", borderRadius: 99, fontSize: 12.5, fontWeight: tool === t.key ? 700 : 500, cursor: "pointer", border: "1.5px solid", fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s" }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Fill With */}
          {tool !== "erase" && (
            <div className="gen-field" style={{ marginBottom: 16 }}>
              <label className="gen-label" style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: 8 }}>
                Fill With <span className="gen-required">*</span>
              </label>
              <textarea className="gen-textarea" rows={3}
                placeholder={"Describe what to place in the masked area…\ne.g. 'a red sports car', 'blue sky'"}
                value={fillPrompt} onChange={e => setFillPrompt(e.target.value)}
                style={{ width: "100%", padding: "11px 14px", borderRadius: 10, fontSize: 13, lineHeight: 1.6, resize: "vertical", outline: "none" }} />
            </div>
          )}

          {tool === "erase" && uploadedUrl && (
            <div style={{ padding: "10px 14px", background: "#fdf5f0", border: "1px solid #f4c4a8", borderRadius: 8, fontSize: 12, color: "#c0562a", marginBottom: 16 }}>
              ✏️ Paint over the area to remove — the AI will fill it with natural background.
            </div>
          )}

          {/* Run button */}
          <button className="gen-generate-btn"
            style={{
              width: "100%", padding: "13px", borderRadius: 12, border: "none",
              background: tool === "erase"
                ? "linear-gradient(135deg,#dc2626,#b91c1c)"
                : "linear-gradient(135deg,#c0562a,#e08050)",
              color: "#fff", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8,
              fontFamily: "'DM Sans',sans-serif", transition: "all 0.2s",
              boxShadow: "0 4px 20px rgba(192,86,42,0.3)",
            }}
            onClick={runInpainting} disabled={loading}>
            {loading ? (
              <><span style={{ width: 14, height: 14, border: "2.5px solid rgba(255,255,255,0.35)", borderTopColor: "#fff", borderRadius: "50%", animation: "genSpin 0.7s linear infinite", display: "inline-block" }} />{tool === "erase" ? "Removing…" : "Running Inpainting…"}</>
            ) : tool === "erase" ? (
              <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>Remove Area</>
            ) : (
              <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>Run Inpainting</>
            )}
          </button>

          {uploadedUrl && imgReady && !hasMask && !loading && !resultUrl && (
            <p style={{ fontSize: 12, color: "#c0562a", marginTop: 10, textAlign: "center", opacity: 0.75 }}>
              👆 Paint over the area you want to replace on the canvas →
            </p>
          )}
        </div>

        {/* ── Right Panel ── */}
        <div className="gen-panel gen-panel--right" style={{ flex: 1, background: "#faf8f4", display: "flex", flexDirection: "column", padding: "24px 28px", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 className="gen-preview-title" style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
              {resultUrl ? "Inpainting Result" : "Paint Mask on Image"}
            </h2>
            {hasMask && !resultUrl && (
              <span style={{ fontSize: 11, color: "#c0562a", background: "#fdf5f0", border: "1px solid #f4c4a8", borderRadius: 6, padding: "3px 9px", fontWeight: 600 }}>
                Mask painted ✓
              </span>
            )}
          </div>

          <div className="gen-preview-box" style={{ flex: 1, borderRadius: 16, border: "1.5px solid #e0d8cc", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", minHeight: 0, position: "relative" }}>

            {!uploadedUrl && !loading && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, textAlign: "center", padding: 40 }}>
                <div style={{ color: "#c0562a", opacity: 0.5 }}>
                  <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                </div>
                <p style={{ fontSize: 16, fontWeight: 700, color: "#2a1f12", margin: 0, fontFamily: "'Playfair Display',serif" }}>Upload an image to get started</p>
                <p style={{ fontSize: 13, color: "#a89880", margin: 0 }}>Then paint over the area you want to replace</p>
              </div>
            )}

            {loading && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center" }}>
                <div style={{ width: 48, height: 48, border: "3px solid #e0d8cc", borderTopColor: "#c0562a", borderRadius: "50%", animation: "genSpin 0.9s linear infinite" }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: "#2a1f12", margin: 0 }}>Running inpainting…</p>
                <p style={{ fontSize: 12, color: "#a89880", margin: 0 }}>This may take 10–20 seconds</p>
              </div>
            )}

            <canvas ref={maskCanvasRef} style={{ display: "none" }} />

            <div style={{ display: (uploadedUrl && !loading && !resultUrl) ? "inline-block" : "none", position: "relative", borderRadius: 10, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.2)", cursor: "none", userSelect: "none" }}
              onMouseLeave={onMouseLeave}>
              <canvas ref={displayCanvasRef} style={{ display: "block" }}
                onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}
                onTouchStart={onMouseDown} onTouchMove={onMouseMove} onTouchEnd={onMouseUp} />
              {cursorPos && imgReady && (
                <div style={{ position: "absolute", left: cursorPos.x - brushSize / 2, top: cursorPos.y - brushSize / 2, width: brushSize, height: brushSize, border: `2px solid ${tool === "erase" ? "#dc2626" : "#c0562a"}`, borderRadius: "50%", pointerEvents: "none", boxShadow: `0 0 8px ${tool === "erase" ? "rgba(220,38,38,0.4)" : "rgba(192,86,42,0.4)"}` }} />
              )}
              {imgReady && !hasMask && (
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "rgba(42,31,18,0.8)", backdropFilter: "blur(8px)", borderRadius: 10, padding: "8px 16px", fontSize: 13, color: "white", pointerEvents: "none", whiteSpace: "nowrap" }}>
                  🖌️ Paint over area to replace
                </div>
              )}
            </div>

            {!loading && resultUrl && (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img src={resultUrl} alt="Inpainted result" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 10 }} />
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, paddingTop: 14 }}>
            <button className="gen-action-btn" onClick={download} disabled={!resultUrl}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: resultUrl ? "pointer" : "not-allowed", border: "1.5px solid #e0d8cc", background: "#fff", color: "#7a6a55", fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              Download
            </button>
            {resultUrl && (
              <button className="gen-action-btn" onClick={tryAgain}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "1.5px solid #e0d8cc", background: "#fff", color: "#7a6a55", fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15M1 20v-6h6"/></svg>
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes genSpin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}