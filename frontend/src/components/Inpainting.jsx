import { useState, useRef, useCallback, useEffect } from "react";

const SparkleIcon = ({ size = 18, color = "white" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 2L13.09 8.26L19 6L14.74 10.26L21 12L14.74 13.74L19 18L13.09 15.74L12 22L10.91 15.74L5 18L9.26 13.74L3 12L9.26 10.26L5 6L10.91 8.26L12 2Z" />
  </svg>
);

const BRUSH_SIZES = [8, 16, 28, 44];

export default function Inpainting({ onBack }) {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedUrl, setUploadedUrl]   = useState(null);
  const [prompt, setPrompt]             = useState("");
  const [brushSize, setBrushSize]       = useState(28);
  const [isErasing, setIsErasing]       = useState(false);
  const [loading, setLoading]           = useState(false);
  const [resultImage, setResultImage]   = useState(null);
  const [error, setError]               = useState("");
  const [dragOver, setDragOver]         = useState(false);
  const [hasMask, setHasMask]           = useState(false);
  const [imgLoaded, setImgLoaded]       = useState(false);

  const fileInputRef  = useRef(null);
  const canvasRef     = useRef(null);
  const imgRef        = useRef(null);
  const isDrawing     = useRef(false);
  const lastPos       = useRef(null);

  // Resize canvas to match displayed image
  const syncCanvas = useCallback(() => {
    const img    = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;
    canvas.width  = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.style.width  = img.offsetWidth  + "px";
    canvas.style.height = img.offsetHeight + "px";
  }, []);

  useEffect(() => {
    if (!uploadedUrl) return;
    const img = imgRef.current;
    if (!img) return;
    const onLoad = () => { setImgLoaded(true); syncCanvas(); };
    img.addEventListener("load", onLoad);
    return () => img.removeEventListener("load", onLoad);
  }, [uploadedUrl, syncCanvas]);

  // Convert mouse/touch pos to canvas coords
  const getPos = (e, canvas) => {
    const rect  = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top)  * scaleY,
    };
  };

  const draw = (e) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    const pos    = getPos(e, canvas);

    ctx.globalCompositeOperation = isErasing ? "destination-out" : "source-over";
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.lineWidth   = brushSize * (canvas.width / canvas.offsetWidth);
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";

    if (lastPos.current) {
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, ctx.lineWidth / 2, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.fill();
    }
    lastPos.current = pos;
    setHasMask(true);
  };

  const startDraw = (e) => {
    e.preventDefault();
    isDrawing.current = true;
    lastPos.current   = null;
    draw(e);
  };

  const stopDraw = () => {
    isDrawing.current = false;
    lastPos.current   = null;
  };

  const clearMask = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    setHasMask(false);
  };

  // Get black-background mask PNG as base64
  const getMaskBase64 = () => {
    const canvas = canvasRef.current;
    const offscreen = document.createElement("canvas");
    offscreen.width  = canvas.width;
    offscreen.height = canvas.height;
    const ctx = offscreen.getContext("2d");
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, offscreen.width, offscreen.height);
    ctx.drawImage(canvas, 0, 0);
    return offscreen.toDataURL("image/png").split(",")[1];
  };

  // Get original image as base64
  const getImageBase64 = () =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result.split(",")[1]);
      reader.readAsDataURL(uploadedFile);
    });

  const generate = async () => {
    if (!uploadedFile)     { setError("Please upload an image."); return; }
    if (!hasMask)          { setError("Paint the area you want to replace."); return; }
    if (!prompt.trim())    { setError("Describe what to fill in the masked area."); return; }
    setError(""); setLoading(true); setResultImage(null);

    try {
      const imageB64 = await getImageBase64();
      const maskB64  = getMaskBase64();

      const res = await fetch(
        "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-inpainting",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_HF_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: prompt.trim(),
            parameters: {
              image:      imageB64,
              mask_image: maskB64,
            },
          }),
        }
      );

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Inpainting failed. Try again.");
      }
      const blob = await res.blob();
      setResultImage(URL.createObjectURL(blob));
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setUploadedFile(file);
    setUploadedUrl(URL.createObjectURL(file));
    setResultImage(null);
    setHasMask(false);
    setImgLoaded(false);
    clearMask();
  };

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }, []);

  const download = () => {
    if (!resultImage) return;
    const a = document.createElement("a");
    a.href = resultImage; a.download = `inpaint_${Date.now()}.png`; a.click();
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

      <div className="gen-body">
        {/* Left Panel */}
        <div className="gen-panel gen-panel--left">
          <div className="gen-panel-header">
            <div className="gen-panel-icon" style={{ background: "linear-gradient(135deg,#0ecac4,#0891b2)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
            </div>
            <h2 className="gen-panel-title">Inpainting</h2>
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                <span style={{ fontSize: 12, color: "var(--text-secondary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{uploadedFile?.name}</span>
                <button className="gen-upload-remove" onClick={() => { setUploadedUrl(null); setUploadedFile(null); setHasMask(false); setImgLoaded(false); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            )}
          </div>

          {/* Brush controls — only shown when image is uploaded */}
          {uploadedUrl && (
            <>
              <div className="gen-field">
                <label className="gen-label">Brush Size</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {BRUSH_SIZES.map((s) => (
                    <button key={s} onClick={() => setBrushSize(s)}
                      style={{
                        flex: 1, height: 38, borderRadius: 8, border: `1.5px solid ${brushSize === s ? "#0ecac4" : "var(--border)"}`,
                        background: brushSize === s ? "rgba(14,202,196,0.12)" : "var(--bg-input)",
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                      <div style={{ width: s * 0.5, height: s * 0.5, borderRadius: "50%", background: brushSize === s ? "#0ecac4" : "var(--text-muted)", maxWidth: 22, maxHeight: 22 }} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="gen-field" style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setIsErasing(false)}
                  className={`gen-chip ${!isErasing ? "gen-chip--active" : ""}`}
                  style={{ flex: 1, justifyContent: "center" }}>
                  ✏️ Paint Mask
                </button>
                <button onClick={() => setIsErasing(true)}
                  className={`gen-chip ${isErasing ? "gen-chip--active" : ""}`}
                  style={{ flex: 1, justifyContent: "center" }}>
                  🧹 Erase
                </button>
                <button onClick={clearMask}
                  className="gen-chip"
                  style={{ flex: 1, justifyContent: "center" }}>
                  🗑 Clear
                </button>
              </div>
            </>
          )}

          {/* Prompt */}
          <div className="gen-field">
            <label className="gen-label">Fill With <span className="gen-required">*</span></label>
            <textarea className="gen-textarea" rows={3}
              placeholder="Describe what to place in the masked area..."
              value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          </div>

          <button
            className="gen-generate-btn"
            style={{ background: "linear-gradient(135deg,#0ecac4,#0891b2)" }}
            onClick={generate}
            disabled={loading || !uploadedFile}
          >
            {loading ? (
              <><span className="gen-spinner" />Processing…</>
            ) : (
              <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> Run Inpainting</>
            )}
          </button>
        </div>

        {/* Right Panel — Canvas Editor + Result */}
        <div className="gen-panel gen-panel--right">
          <h2 className="gen-preview-title">
            {uploadedUrl && !resultImage ? "Paint Mask on Image" : "Preview"}
          </h2>

          <div className="gen-preview-box" style={{ position: "relative", overflow: "hidden" }}>

            {/* Empty state */}
            {!uploadedUrl && !loading && (
              <div className="gen-preview-empty">
                <div className="gen-preview-empty-icon" style={{ color: "#0ecac4" }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
                  </svg>
                </div>
                <p className="gen-preview-empty-text">Upload an image to start painting</p>
                <p className="gen-preview-empty-sub">Paint over the area you want to replace, then describe the fill</p>
              </div>
            )}

            {/* Canvas editor */}
            {uploadedUrl && !resultImage && (
              <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ position: "relative", maxWidth: "100%", maxHeight: "100%", cursor: isErasing ? "cell" : "crosshair" }}>
                  <img
                    ref={imgRef}
                    src={uploadedUrl}
                    alt="Source"
                    className="gen-preview-img"
                    style={{ display: "block", maxHeight: 380, userSelect: "none", pointerEvents: "none" }}
                    onLoad={syncCanvas}
                  />
                  <canvas
                    ref={canvasRef}
                    style={{
                      position: "absolute", top: 0, left: 0,
                      width: "100%", height: "100%",
                      opacity: 0.55,
                      touchAction: "none",
                    }}
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={stopDraw}
                    onMouseLeave={stopDraw}
                    onTouchStart={startDraw}
                    onTouchMove={draw}
                    onTouchEnd={stopDraw}
                  />
                  {/* Mask hint badge */}
                  {!hasMask && imgLoaded && (
                    <div style={{
                      position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
                      background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
                      borderRadius: 12, padding: "10px 18px", pointerEvents: "none",
                      fontSize: 12, color: "rgba(255,255,255,0.85)", whiteSpace: "nowrap",
                    }}>
                      ✏️ Paint over area to replace
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="gen-preview-loading">
                <div className="gen-preview-spinner" style={{ borderTopColor: "#0ecac4" }} />
                <p className="gen-preview-loading-text">Filling masked area…</p>
                <p className="gen-preview-loading-sub">This may take 15–30 seconds</p>
              </div>
            )}

            {/* Result */}
            {!loading && resultImage && (
              <div className="gen-preview-img-wrap gen-preview-img-wrap--loaded">
                <img src={resultImage} alt="Inpainted" className="gen-preview-img" />
              </div>
            )}
          </div>

          <div className="gen-preview-actions">
            <button className="gen-action-btn" onClick={download} disabled={!resultImage}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              Download
            </button>
            {resultImage && (
              <button className="gen-action-btn" onClick={() => { setResultImage(null); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
                Edit Again
              </button>
            )}
            <button className="gen-action-btn" onClick={generate} disabled={!hasMask || loading}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
              Retry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}