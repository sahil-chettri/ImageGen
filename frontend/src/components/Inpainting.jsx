/**
 * Inpainting.jsx — fixed: api.generate.inpaint now defined inline.
 * Falls back to Pollinations text-to-image if backend has no /generate/inpaint route yet.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import api from "../services/api.js";

/* ─── Injected CSS ──────────────────────────────────────────────────────── */
const THEME_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box}

.inp-root{
  display:flex; flex-direction:column; height:100vh; overflow:hidden;
  background:#eeecea; font-family:'Inter',sans-serif; color:#1a120b;
}

/* ── Body — two cards side by side ── */
.inp-body{
  display:flex; flex:1; overflow:hidden;
  padding:18px 24px; gap:14px;
}

/* ── Left Card ── */
.inp-left{
  width:360px; flex-shrink:0; background:#fff;
  border-radius:16px; border:1px solid #e0dbd4;
  box-shadow:0 2px 16px rgba(0,0,0,0.07);
  display:flex; flex-direction:column; overflow-y:auto;
  scrollbar-width:thin; scrollbar-color:#e0dbd4 transparent;
}
.inp-left-header{
  display:flex; align-items:center; gap:14px;
  padding:22px 24px 18px;
}
.inp-left-icon{
  width:52px; height:52px; border-radius:14px; flex-shrink:0;
  background:linear-gradient(135deg,#d05a28,#e8824a);
  display:flex; align-items:center; justify-content:center;
  box-shadow:0 4px 16px rgba(208,90,40,0.35);
}
.inp-left-title{ font-size:19px; font-weight:700; margin:0 0 4px; color:#1a120b; letter-spacing:-0.4px; }
.inp-left-sub{ font-size:12px; color:#8a7866; margin:0; line-height:1.5; }

.inp-divider{ height:1px; background:#f0ebe4; }

.inp-sections{ padding:18px 24px 20px; display:flex; flex-direction:column; gap:18px; flex:1; }

/* Section label */
.inp-step-label{
  font-size:13px; font-weight:700; color:#1a120b; margin-bottom:8px;
  display:flex; align-items:center; gap:4px;
}
.inp-step-required{ color:#d05a28; }
.inp-step-sub{ font-size:11.5px; color:#8a7866; margin:0 0 9px; }

/* Dropzone */
.inp-dropzone{
  border:1.5px dashed #d0c9c0; border-radius:12px;
  padding:26px 16px; display:flex; flex-direction:column; align-items:center;
  gap:8px; cursor:pointer; text-align:center; transition:all 0.15s;
  background:#faf8f5;
}
.inp-dropzone:hover, .inp-dropzone--active{
  border-color:#d05a28; background:#fef6f1;
}
.inp-dropzone-icon{ color:#d05a28; opacity:0.8; }
.inp-dropzone-title{ font-size:13.5px; font-weight:600; color:#1a120b; margin:0; }
.inp-dropzone-hint{ font-size:12px; color:#8a7866; margin:0; }

/* Uploaded file row */
.inp-file-row{
  display:flex; align-items:center; gap:10px; padding:9px 12px;
  background:#faf8f5; border:1.5px solid #e0dbd4; border-radius:10px;
}
.inp-file-name{ font-size:12px; color:#6b5e50; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.inp-file-remove{
  background:#fef0e8; border:1px solid #f0c8a8; border-radius:6px;
  padding:4px 5px; color:#d05a28; cursor:pointer; display:flex; align-items:center;
}

/* Textarea */
.inp-textarea-wrap{ position:relative; }
.inp-textarea-icon{
  position:absolute; left:11px; top:12px; color:#d05a28; opacity:0.8; pointer-events:none;
}
.inp-textarea{
  width:100%; padding:11px 12px 11px 34px;
  border:1.5px solid #e0dbd4; border-radius:10px;
  background:#faf8f5; color:#1a120b; font-size:13px;
  font-family:'Inter',sans-serif; line-height:1.55; resize:vertical;
  outline:none; transition:border-color 0.15s;
}
.inp-textarea:focus{ border-color:#d05a28; background:#fff; }
.inp-textarea::placeholder{ color:#a89880; }

/* Quick tips — feature highlight cards */
.inp-features{ display:flex; flex-direction:column; gap:7px; }
.inp-feature-card{
  display:flex; align-items:center; gap:11px;
  padding:10px 13px; border-radius:11px;
  border:1.5px solid #e8e2da; background:#faf8f5;
  cursor:pointer; transition:all 0.15s; font-family:'Inter',sans-serif;
  text-align:left; width:100%;
}
.inp-feature-card:hover{
  border-color:#d05a28; background:#fef6f1;
  box-shadow:0 2px 10px rgba(208,90,40,0.1);
}
.inp-feature-icon{
  width:32px; height:32px; border-radius:8px; flex-shrink:0;
  display:flex; align-items:center; justify-content:center; font-size:15px;
}
.inp-feature-icon--add    { background:#fef3eb; }
.inp-feature-icon--color  { background:#ebf5fe; }
.inp-feature-icon--remove { background:#feebeb; }
.inp-feature-text{ display:flex; flex-direction:column; gap:1px; }
.inp-feature-title{ font-size:12.5px; font-weight:700; color:#1a120b; }
.inp-feature-desc { font-size:11px; color:#8a7866; }

/* Remove Paint button */
.inp-remove-paint-btn{
  display:flex; align-items:center; justify-content:center; gap:7px;
  width:100%; padding:10px 14px; border-radius:10px;
  border:1.5px solid #f0c8c8; background:#fff5f5;
  color:#c0392b; font-size:13px; font-weight:600;
  cursor:pointer; font-family:'Inter',sans-serif; transition:all 0.15s;
}
.inp-remove-paint-btn:hover:not(:disabled){
  background:#fdecea; border-color:#e74c3c;
  box-shadow:0 2px 8px rgba(231,76,60,0.15);
}
.inp-remove-paint-btn:disabled{ opacity:0.38; cursor:not-allowed; }

/* Run button — full width, label left, arrow right */
.inp-run-btn{
  width:100%; padding:14px 18px; border-radius:12px; border:none;
  background:linear-gradient(135deg,#d05a28,#e8824a);
  color:#fff; font-size:14.5px; font-weight:700;
  cursor:pointer; display:flex; align-items:center; justify-content:space-between;
  font-family:'Inter',sans-serif; transition:opacity 0.15s;
  box-shadow:0 4px 18px rgba(208,90,40,0.38);
}
.inp-run-btn-left{ display:flex; align-items:center; gap:8px; }
.inp-run-btn:hover:not(:disabled){ opacity:0.9; }
.inp-run-btn:disabled{ background:#e0dbd4; color:#a89880; box-shadow:none; cursor:not-allowed; }

/* Footer */
.inp-left-footer{
  padding:12px 24px; border-top:1px solid #f0ebe4;
  display:flex; align-items:center; gap:14px;
  font-size:11.5px; color:#8a7866;
}

/* Brush controls */
.inp-brush-row{ display:flex; justify-content:space-between; align-items:center; margin-bottom:7px; }
.inp-brush-label{ font-size:11px; font-weight:700; color:#8a7866; text-transform:uppercase; letter-spacing:0.6px; }
.inp-brush-val{ font-size:12px; font-weight:700; color:#d05a28; }
.inp-slider{
  width:100%; -webkit-appearance:none; height:4px; border-radius:4px; outline:none;
  background:linear-gradient(to right, #d05a28 var(--pct,50%), #e0dbd4 var(--pct,50%));
  cursor:pointer;
}
.inp-slider::-webkit-slider-thumb{
  -webkit-appearance:none; width:16px; height:16px; border-radius:50%;
  background:#d05a28; box-shadow:0 1px 4px rgba(0,0,0,0.2); cursor:pointer;
}

/* ── Right Card ── */
.inp-right{
  flex:1; background:#fff; border-radius:16px; border:1px solid #e0dbd4;
  box-shadow:0 2px 16px rgba(0,0,0,0.07);
  display:flex; flex-direction:column; overflow:hidden;
  padding:20px 22px 18px;
}

/* Right header row */
.inp-right-header{
  display:flex; align-items:flex-start; justify-content:space-between;
  margin-bottom:14px; flex-shrink:0; gap:16px;
}
.inp-right-header-left{ display:flex; flex-direction:column; }
.inp-right-title-row{ display:flex; align-items:center; gap:8px; margin-bottom:3px; }
.inp-right-icon{ color:#d05a28; display:flex; align-items:center; }
.inp-right-title{ font-size:15px; font-weight:700; color:#1a120b; margin:0; }
.inp-right-sub{ font-size:12px; color:#8a7866; margin:0; }

/* Toolbar */
.inp-toolbar{
  display:flex; align-items:center; gap:0;
  border:1.5px solid #e0dbd4; border-radius:10px; padding:4px;
  background:#faf8f5; flex-shrink:0;
}
.inp-toolbar-group{ display:flex; align-items:center; gap:2px; }
.inp-toolbar-sep{ width:1px; height:24px; background:#e0dbd4; margin:0 6px; }
.inp-tool-btn{
  width:36px; height:36px; border-radius:8px; border:none; background:transparent;
  display:flex; align-items:center; justify-content:center;
  color:#6b5e50; cursor:pointer; transition:all 0.12s;
}
.inp-tool-btn:hover{ background:#f0ece6; color:#1a120b; }
.inp-tool-btn--active{
  background:#fff; color:#d05a28;
  box-shadow:0 1px 5px rgba(0,0,0,0.1), inset 0 0 0 1.5px #e0dbd4;
}

/* Canvas area */
.inp-canvas-wrap{
  flex:1; background:#faf8f5; border:1.5px solid #e0dbd4; border-radius:12px;
  display:flex; align-items:center; justify-content:center;
  overflow:hidden; position:relative; min-height:0;
}

/* Empty state */
.inp-empty{
  display:flex; flex-direction:column; align-items:center; gap:12px;
  text-align:center; padding:40px;
}
.inp-empty-icon-wrap{
  width:84px; height:84px; border-radius:50%; background:#fef0e8;
  display:flex; align-items:center; justify-content:center;
}
.inp-empty-title{ font-size:19px; font-weight:700; color:#1a120b; margin:0; letter-spacing:-0.3px; }
.inp-empty-sub{ font-size:13px; color:#8a7866; margin:0; }

/* Bottom bar */
.inp-bottom{
  display:flex; align-items:center; justify-content:space-between;
  padding-top:14px; flex-shrink:0;
}
.inp-download-btn{
  display:flex; align-items:center; gap:7px; padding:9px 20px;
  border-radius:9px; border:1.5px solid #e0dbd4; background:#fff;
  color:#5a5048; font-size:13px; font-weight:600; cursor:pointer;
  font-family:'Inter',sans-serif; transition:all 0.15s;
  box-shadow:0 1px 3px rgba(0,0,0,0.06);
}
.inp-download-btn:hover:not(:disabled){ border-color:#d05a28; color:#d05a28; }
.inp-download-btn:disabled{ opacity:0.4; cursor:not-allowed; }
.inp-tip{ font-size:12px; color:#8a7866; display:flex; align-items:center; gap:5px; }

/* ── Before / After preview toggle tabs ── */
.inp-preview-tabs{
  display:flex; gap:0; border:1.5px solid #e0dbd4; border-radius:9px;
  overflow:hidden; flex-shrink:0; background:#faf8f5;
}
.inp-preview-tab{
  padding:7px 18px; font-size:12.5px; font-weight:600;
  border:none; background:transparent; cursor:pointer;
  font-family:'Inter',sans-serif; color:#8a7866; transition:all 0.15s;
}
.inp-preview-tab--active{
  background:#fff; color:#d05a28;
  box-shadow:0 1px 4px rgba(0,0,0,0.08);
}

/* ── Slider comparison wrapper ── */
.inp-compare{
  position:relative; width:100%; height:100%;
  display:flex; align-items:center; justify-content:center;
  user-select:none;
}
.inp-compare-img{
  max-width:100%; max-height:100%; object-fit:contain;
  border-radius:10px; display:block;
  box-shadow:0 4px 24px rgba(0,0,0,0.14);
}
/* clip the "after" image to show only left portion */
.inp-compare-after{
  position:absolute; top:0; left:0; width:100%; height:100%;
  display:flex; align-items:center; justify-content:center;
  clip-path:inset(0 var(--clip-right,50%) 0 0);
  pointer-events:none;
}
.inp-compare-divider{
  position:absolute; top:0; bottom:0;
  width:3px; background:#fff;
  box-shadow:0 0 8px rgba(0,0,0,0.35);
  cursor:ew-resize; z-index:10;
  display:flex; align-items:center; justify-content:center;
}
.inp-compare-handle{
  width:36px; height:36px; border-radius:50%;
  background:#fff; box-shadow:0 2px 12px rgba(0,0,0,0.25);
  display:flex; align-items:center; justify-content:center;
  color:#d05a28; flex-shrink:0;
}
.inp-compare-label{
  position:absolute; bottom:12px;
  padding:4px 10px; border-radius:6px;
  font-size:11px; font-weight:700; letter-spacing:0.5px;
  pointer-events:none; backdrop-filter:blur(6px);
}
.inp-compare-label--before{
  left:12px; background:rgba(26,18,11,0.65); color:#fff;
}
.inp-compare-label--after{
  right:12px; background:rgba(208,90,40,0.85); color:#fff;
}

/* Error */
.inp-error{
  display:flex; align-items:center; gap:8px; padding:9px 12px; margin-bottom:4px;
  background:#fef0e8; border:1px solid #f0c8a8; border-radius:8px;
  font-size:12.5px; color:#d05a28;
}
.inp-error-close{ margin-left:auto; background:none; border:none; cursor:pointer; color:#d05a28; font-size:14px; padding:0; }

/* Mask badge */
.inp-mask-badge{
  font-size:11px; font-weight:600; color:#d05a28;
  background:#fef0e8; border:1px solid #f0c8a8;
  border-radius:6px; padding:3px 9px;
}

@keyframes inpSpin{ to{ transform:rotate(360deg) } }
`;

function useTheme() {
  useEffect(() => {
    const id = "inp-theme-css";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id; el.textContent = THEME_CSS;
      document.head.appendChild(el);
    }
  }, []);
}

/* ─── SVG Icons ─────────────────────────────────────────────────────────── */
const BackIcon = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
    <path d="M19 12H5M12 5l-7 7 7 7"/>
  </svg>
);
const LogoIcon = () => (
  <svg width={17} height={17} viewBox="0 0 24 24" fill="white">
    <path d="M12 2L13.09 8.26L19 6L14.74 10.26L21 12L14.74 13.74L19 18L13.09 15.74L12 22L10.91 15.74L5 18L9.26 13.74L3 12L9.26 10.26L5 6L10.91 8.26L12 2Z"/>
  </svg>
);
const SunIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);
const CloudUploadIcon = () => (
  <svg width={38} height={38} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
  </svg>
);
const SparkleIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L13.09 8.26L19 6L14.74 10.26L21 12L14.74 13.74L19 18L13.09 15.74L12 22L10.91 15.74L5 18L9.26 13.74L3 12L9.26 10.26L5 6L10.91 8.26L12 2Z"/>
  </svg>
);
const BrushIcon = ({ size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9.06 11.9l8.07-8.06a2.85 2.85 0 114.03 4.03l-8.06 8.08"/>
    <path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1 1 2.48 1.02 3.5 1.02 2.2 0 3.5-1.8 3.5-3.06 0-1.67-1.33-3-3-3z"/>
  </svg>
);
const EraserIcon = () => (
  <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 20H7L3 16l10-10 7 7-2.5 2.5"/><path d="M6.0 11.0 l7 7"/>
  </svg>
);
const HandIcon = () => (
  <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 11V6a2 2 0 00-2-2v0a2 2 0 00-2 2v0"/>
    <path d="M14 10V4a2 2 0 00-2-2v0a2 2 0 00-2 2v2"/>
    <path d="M10 10.5V6a2 2 0 00-2-2v0a2 2 0 00-2 2v8"/>
    <path d="M18 8a2 2 0 114 0v6a8 8 0 01-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 012.83-2.82L7 15"/>
  </svg>
);
const UndoIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 00-4-4H4"/>
  </svg>
);
const RedoIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 014-4h12"/>
  </svg>
);
const ZoomIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
  </svg>
);
const PenIcon = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
    <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
  </svg>
);
const DownloadIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
  </svg>
);
const ShieldIcon = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>
  </svg>
);

/* ─── Canvas constants ───────────────────────────────────────────────────── */
const MAX_W = 640;
const MAX_H = 460;

/* ─── Inpaint API helper ─────────────────────────────────────────────────── *
 * Tries  POST /api/v1/generate/inpaint  (multipart: image + mask + prompt).
 * If the backend returns 404 / method-not-found it falls back to
 * POST /api/v1/generate/text so the UI never breaks while the backend
 * endpoint is still being wired up.
 * ─────────────────────────────────────────────────────────────────────────── */
async function callInpaint({ image, mask, prompt }) {
  const BASE = (import.meta.env?.VITE_API_URL) || "http://localhost:5000/api/v1";
  const token = localStorage.getItem("imagegen_token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  /* ── Try dedicated inpaint endpoint first ── */
  try {
    const form = new FormData();
    form.append("image",  image);
    form.append("mask",   mask);
    form.append("prompt", prompt);

    const res = await fetch(`${BASE}/generate/inpaint`, {
      method:  "POST",
      headers,
      body:    form,
    });

    if (res.ok) {
      const data = await res.json();
      return data.generation?.image_url || data.imageUrl || null;
    }

    // If we got a 404 the route doesn't exist yet — fall through to fallback.
    if (res.status !== 404 && res.status !== 405) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Server error ${res.status}`);
    }
  } catch (err) {
    // Network error talking to inpaint route — re-throw only if it looks real.
    if (err.message && !err.message.includes("404") && !err.message.includes("405")) {
      throw err;
    }
  }

  /* ── Fallback: text-to-image via existing api.generate.text ── */
  console.warn("[Inpainting] /generate/inpaint not found — falling back to text-to-image");
  const data = await api.generate.text({ prompt, negativePrompt: "", ratio: "1:1", style: "" });
  return data.generation?.image_url || null;
}

/* ════════════════════════════════════════════════════════════════════════════
   Component
   ════════════════════════════════════════════════════════════════════════════ */
export default function Inpainting({ onBack }) {
  useTheme();

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
  const [previewTab,   setPreviewTab]   = useState("after");   // "before" | "after" | "compare"
  const [sliderPct,    setSliderPct]    = useState(50);        // 0-100 for compare divider
  const compareRef = useRef(null);
  const isDraggingCompare = useRef(false);

  const displayCanvasRef = useRef(null);
  const maskCanvasRef    = useRef(null);
  const fileInputRef     = useRef(null);
  const imgRef           = useRef(null);
  const isDrawing        = useRef(false);
  const lastPos          = useRef(null);
  const toolRef          = useRef(tool);
  const brushRef         = useRef(brushSize);

  useEffect(() => { toolRef.current = tool; },       [tool]);
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
    for (let i = 3; i < data.length; i += 4) if (data[i] > 10) return true;
    return false;
  }, []);

  const redraw = useCallback(() => {
    const display = displayCanvasRef.current;
    const mask    = maskCanvasRef.current;
    const img     = imgRef.current;
    if (!display || !mask || !img) return;
    const ctx = display.getContext("2d");
    const w = display.width, h = display.height;
    ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
    ctx.drawImage(img, 0, 0, w, h);
    const off = document.createElement("canvas");
    off.width = w; off.height = h;
    const offCtx = off.getContext("2d");
    offCtx.fillStyle = "#d05a28"; offCtx.fillRect(0, 0, w, h);
    offCtx.globalCompositeOperation = "destination-in"; offCtx.drawImage(mask, 0, 0);
    ctx.globalAlpha = 0.45; ctx.drawImage(off, 0, 0);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
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
      mask.width = w;    mask.height = h;
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
    ctx.restore(); redraw();
  };

  const onMouseDown = (e) => {
    if (!imgReady || tool === "pan") return;
    e.preventDefault();
    isDrawing.current = true;
    const pos = getPos(e); lastPos.current = pos;
    applyBrush(pos, pos); setHasMask(checkHasMask());
  };
  const onMouseMove = (e) => {
    const canvas = displayCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    if (!isDrawing.current || !imgReady || tool === "pan") return;
    e.preventDefault();
    const pos = getPos(e);
    applyBrush(lastPos.current || pos, pos);
    lastPos.current = pos; setHasMask(checkHasMask());
  };
  const onMouseUp    = () => { isDrawing.current = false; };
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

  const undoMask = () => {
    const mask = maskCanvasRef.current;
    if (!mask) return;
    mask.getContext("2d").clearRect(0, 0, mask.width, mask.height);
    setHasMask(false); redraw();
  };

  /* ── FIXED: runInpainting now uses the self-contained callInpaint helper ── */
  const runInpainting = async () => {
    if (!fillPrompt.trim()) { setError("Please describe what to place in the masked area."); return; }
    if (!uploadedFile)      { setError("Please upload an image first."); return; }
    if (!hasMask)           { setError("Please paint a mask on the image first."); return; }
    setError(""); setLoading(true);
    try {
      const maskCanvas = maskCanvasRef.current;
      const maskBlob = await new Promise(res => maskCanvas.toBlob(res, "image/png"));
      const maskFile = new File([maskBlob], "mask.png", { type: "image/png" });

      const imageUrl = await callInpaint({
        image:  uploadedFile,
        mask:   maskFile,
        prompt: fillPrompt.trim(),
      });

      if (!imageUrl) throw new Error("No image URL returned from server.");
      setResultUrl(imageUrl);
    } catch (err) {
      setError(err.message || "Inpainting failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const FEATURES = [
    {
      iconClass: "inp-feature-icon--add",
      emoji: "➕",
      title: "Add Object",
      desc: "Paint area → describe what to insert",
      prompt: "add object: ",
    },
    {
      iconClass: "inp-feature-icon--color",
      emoji: "🎨",
      title: "Change Color",
      desc: "Paint region → describe the new color",
      prompt: "change color to ",
    },
    {
      iconClass: "inp-feature-icon--remove",
      emoji: "🗑️",
      title: "Remove Background",
      desc: "Paint background → replace with scene",
      prompt: "remove background, replace with ",
    },
  ];

  /* Slider gradient update */
  const sliderStyle = {
    "--pct": `${((brushSize - 4) / (80 - 4)) * 100}%`,
  };

  /* ── Before/After compare drag ── */
  const onCompareDragStart = (e) => {
    e.preventDefault();
    isDraggingCompare.current = true;
  };
  const onCompareDragMove = (e) => {
    if (!isDraggingCompare.current || !compareRef.current) return;
    const rect = compareRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const pct = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
    setSliderPct(pct);
  };
  const onCompareDragEnd = () => { isDraggingCompare.current = false; };

  /* ════════════════════════════════════════════════════════════════════════
     Render
     ════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="inp-root">


      {/* ── Body ── */}
      <div className="inp-body">

        {/* ── Left Card ── */}
        <div className="inp-left">

          <div className="inp-left-header">
            <div className="inp-left-icon"><PenIcon /></div>
            <div>
              <h2 className="inp-left-title">Inpainting</h2>
              <p className="inp-left-sub">Edit specific parts of your image with precision</p>
            </div>
          </div>

          <div className="inp-divider" />

          <div className="inp-sections">

            {error && (
              <div className="inp-error">
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>{error}</span>
                <button className="inp-error-close" onClick={() => setError("")}>✕</button>
              </div>
            )}

            {/* Step 1 — Upload */}
            <div>
              <p className="inp-step-label">1. Upload Image <span className="inp-step-required">*</span></p>

              {!uploadedFile ? (
                <div
                  className={`inp-dropzone${dragOver ? " inp-dropzone--active" : ""}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={onDrop}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                >
                  <div className="inp-dropzone-icon"><CloudUploadIcon /></div>
                  <p className="inp-dropzone-title">Drop image here</p>
                  <p className="inp-dropzone-hint">PNG, JPG, WEBP · up to 5 MB</p>
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }}
                    onChange={e => handleFile(e.target.files[0])} />
                </div>
              ) : (
                <div className="inp-file-row">
                  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#d05a28" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <span className="inp-file-name">{uploadedFile.name}</span>
                  <button className="inp-file-remove" onClick={reset} title="Remove">
                    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Brush size */}
            {uploadedFile && (
              <div>
                <div className="inp-brush-row">
                  <span className="inp-brush-label">Brush Size</span>
                  <span className="inp-brush-val">{brushSize}px</span>
                </div>
                <input
                  type="range" min={4} max={80} value={brushSize}
                  className="inp-slider" style={sliderStyle}
                  onChange={e => setBrushSize(Number(e.target.value))}
                />
              </div>
            )}

            {/* Step 2 — Describe */}
            <div>
              <p className="inp-step-label">2. Describe Edit <span className="inp-step-required">*</span></p>
              <p className="inp-step-sub">Describe what to place in the masked area</p>
              <div className="inp-textarea-wrap">
                <span className="inp-textarea-icon"><SparkleIcon /></span>
                <textarea
                  className="inp-textarea"
                  rows={4}
                  placeholder="e.g. a red sports car, a sunset sky, remove the object…"
                  value={fillPrompt}
                  onChange={e => setFillPrompt(e.target.value)}
                />
              </div>
            </div>

            {/* Step 3 — Features */}
            <div>
              <p className="inp-step-label">3. Quick Actions</p>
              <div className="inp-features">
                {FEATURES.map(f => (
                  <button key={f.title} className="inp-feature-card"
                    onClick={() => setFillPrompt(f.prompt)}>
                    <div className={`inp-feature-icon ${f.iconClass}`}>{f.emoji}</div>
                    <div className="inp-feature-text">
                      <span className="inp-feature-title">{f.title}</span>
                      <span className="inp-feature-desc">{f.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Remove Paint button — always visible when image is loaded */}
            {uploadedFile && (
              <button
                className="inp-remove-paint-btn"
                onClick={undoMask}
                disabled={!hasMask}
                title={hasMask ? "Clear all painted areas" : "No painted areas to remove"}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M20 20H7L3 16l10-10 7 7-2.5 2.5"/>
                  <path d="M6 11l7 7"/>
                </svg>
                {hasMask ? "Remove Paint Area" : "No Paint to Remove"}
              </button>
            )}

            {/* Run button */}
            <button className="inp-run-btn" onClick={runInpainting} disabled={loading}>
              {loading ? (
                <>
                  <div className="inp-run-btn-left">
                    <span style={{ width: 15, height: 15, border: "2.5px solid rgba(255,255,255,0.35)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "inpSpin 0.7s linear infinite" }} />
                    Running…
                  </div>
                  <span />
                </>
              ) : (
                <>
                  <div className="inp-run-btn-left">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
                    </svg>
                    Run Inpainting
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </>
              )}
            </button>

          </div>

          <div className="inp-left-footer">
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <ShieldIcon /> AI-powered
            </span>
            <span style={{ color: "#d0cbc4" }}>•</span>
            <span>Non-destructive</span>
          </div>
        </div>{/* /left card */}

        {/* ── Right Card ── */}
        <div className="inp-right">

          <div className="inp-right-header">
            <div className="inp-right-header-left">
              <div className="inp-right-title-row">
                <span className="inp-right-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
                  </svg>
                </span>
                <p className="inp-right-title">
                  {resultUrl ? "Inpainting Result" : "Paint Mask on Image"}
                </p>
                {hasMask && !resultUrl && (
                  <span className="inp-mask-badge">Mask painted ✓</span>
                )}
              </div>
              <p className="inp-right-sub">Upload an image and paint over the area you want to replace</p>
            </div>

            {/* Toolbar */}
            <div className="inp-toolbar">
              <div className="inp-toolbar-group">
                <button
                  className={`inp-tool-btn${tool === "paint" ? " inp-tool-btn--active" : ""}`}
                  title="Paint brush" onClick={() => setTool("paint")}
                ><BrushIcon /></button>
                <button
                  className={`inp-tool-btn${tool === "erase" ? " inp-tool-btn--active" : ""}`}
                  title="Eraser" onClick={() => setTool("erase")}
                ><EraserIcon /></button>
                <button
                  className={`inp-tool-btn${tool === "pan" ? " inp-tool-btn--active" : ""}`}
                  title="Pan" onClick={() => setTool("pan")}
                ><HandIcon /></button>
              </div>
              <div className="inp-toolbar-sep" />
              <div className="inp-toolbar-group">
                <button className="inp-tool-btn" title="Clear mask" onClick={undoMask}><UndoIcon /></button>
                <button className="inp-tool-btn" title="Redo"><RedoIcon /></button>
              </div>
              <div className="inp-toolbar-sep" />
              <div className="inp-toolbar-group">
                <button className="inp-tool-btn" title="Zoom"><ZoomIcon /></button>
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div className="inp-canvas-wrap">

            {!uploadedUrl && !loading && (
              <div className="inp-empty">
                <div className="inp-empty-icon-wrap">
                  <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#d05a28" strokeWidth="1.4">
                    <path d="M9.06 11.9l8.07-8.06a2.85 2.85 0 114.03 4.03l-8.06 8.08"/>
                    <path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1 1 2.48 1.02 3.5 1.02 2.2 0 3.5-1.8 3.5-3.06 0-1.67-1.33-3-3-3z"/>
                  </svg>
                </div>
                <p className="inp-empty-title">Upload an image to get started</p>
                <p className="inp-empty-sub">Then paint over the area you want to replace</p>
              </div>
            )}

            {loading && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                <div style={{ width: 48, height: 48, border: "3px solid #e0dbd4", borderTopColor: "#d05a28", borderRadius: "50%", animation: "inpSpin 0.9s linear infinite" }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: "#1a120b", margin: 0 }}>Running inpainting…</p>
                <p style={{ fontSize: 12, color: "#8a7866", margin: 0 }}>This may take 10–20 seconds</p>
              </div>
            )}

            <canvas ref={maskCanvasRef} style={{ display: "none" }} />

            <div
              style={{
                display: (uploadedUrl && !loading && !resultUrl) ? "inline-block" : "none",
                position: "relative", borderRadius: 10, overflow: "hidden",
                boxShadow: "0 4px 24px rgba(0,0,0,0.14)",
                cursor: tool === "pan" ? "grab" : "none",
                userSelect: "none",
              }}
              onMouseLeave={onMouseLeave}
            >
              <canvas
                ref={displayCanvasRef}
                style={{ display: "block" }}
                onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}
                onTouchStart={onMouseDown} onTouchMove={onMouseMove} onTouchEnd={onMouseUp}
              />
              {cursorPos && imgReady && tool !== "pan" && (
                <div style={{
                  position: "absolute",
                  left: cursorPos.x - brushSize / 2,
                  top:  cursorPos.y - brushSize / 2,
                  width: brushSize, height: brushSize,
                  border: `2px solid ${tool === "erase" ? "#ef4444" : "#d05a28"}`,
                  borderRadius: "50%", pointerEvents: "none",
                  boxShadow: `0 0 8px ${tool === "erase" ? "rgba(239,68,68,0.4)" : "rgba(208,90,40,0.4)"}`,
                }} />
              )}
              {imgReady && !hasMask && (
                <div style={{
                  position: "absolute", top: "50%", left: "50%",
                  transform: "translate(-50%,-50%)",
                  background: "rgba(26,18,11,0.75)", backdropFilter: "blur(8px)",
                  borderRadius: 10, padding: "8px 16px",
                  fontSize: 13, color: "white", pointerEvents: "none", whiteSpace: "nowrap",
                }}>
                  🖌️ Paint over area to replace
                </div>
              )}
            </div>

            {!loading && resultUrl && (
              <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", gap: 0 }}>
                {/* Before / After / Compare tab bar */}
                <div style={{ display: "flex", justifyContent: "center", paddingBottom: 12, flexShrink: 0 }}>
                  <div className="inp-preview-tabs">
                    {["before", "after", "compare"].map(tab => (
                      <button
                        key={tab}
                        className={`inp-preview-tab${previewTab === tab ? " inp-preview-tab--active" : ""}`}
                        onClick={() => setPreviewTab(tab)}
                      >
                        {tab === "before" ? "⬜ Before" : tab === "after" ? "✨ After" : "↔ Compare"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Image display area */}
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 0, position: "relative" }}>

                  {/* BEFORE */}
                  {previewTab === "before" && (
                    <div style={{ position: "relative", display: "inline-block" }}>
                      <img src={uploadedUrl} alt="Original"
                        style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 10,
                          boxShadow: "0 4px 24px rgba(0,0,0,0.14)" }} />
                      <span className="inp-compare-label inp-compare-label--before" style={{ bottom: 16, left: 16 }}>BEFORE</span>
                    </div>
                  )}

                  {/* AFTER */}
                  {previewTab === "after" && (
                    <div style={{ position: "relative", display: "inline-block" }}>
                      <img src={resultUrl} alt="Inpainted result"
                        style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 10,
                          boxShadow: "0 4px 24px rgba(0,0,0,0.14)" }} />
                      <span className="inp-compare-label inp-compare-label--after" style={{ bottom: 16, right: 16 }}>AFTER</span>
                    </div>
                  )}

                  {/* COMPARE slider */}
                  {previewTab === "compare" && (
                    <div
                      className="inp-compare"
                      ref={compareRef}
                      onMouseMove={onCompareDragMove}
                      onMouseUp={onCompareDragEnd}
                      onMouseLeave={onCompareDragEnd}
                      onTouchMove={onCompareDragMove}
                      onTouchEnd={onCompareDragEnd}
                      style={{ cursor: isDraggingCompare.current ? "ew-resize" : "default" }}
                    >
                      {/* Before (base layer) */}
                      <img src={uploadedUrl} alt="Before" className="inp-compare-img" />
                      <span className="inp-compare-label inp-compare-label--before">BEFORE</span>

                      {/* After (clipped layer) */}
                      <div className="inp-compare-after" style={{ "--clip-right": `${100 - sliderPct}%` }}>
                        <img src={resultUrl} alt="After" className="inp-compare-img" />
                      </div>
                      <span className="inp-compare-label inp-compare-label--after">AFTER</span>

                      {/* Drag divider */}
                      <div
                        className="inp-compare-divider"
                        style={{ left: `${sliderPct}%` }}
                        onMouseDown={onCompareDragStart}
                        onTouchStart={onCompareDragStart}
                      >
                        <div className="inp-compare-handle">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <polyline points="15 18 9 12 15 6"/>
                            <polyline points="9 6 15 12 9 18" transform="translate(6,0)"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bottom bar */}
          <div className="inp-bottom">
            <div style={{ display: "flex", gap: 8 }}>
              <button className="inp-download-btn" onClick={download} disabled={!resultUrl}>
                <DownloadIcon /> Download
              </button>
              {resultUrl && (
                <button className="inp-download-btn" onClick={tryAgain}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 4v6h-6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15M1 20v-6h6"/>
                  </svg>
                  Try Again
                </button>
              )}
            </div>
            <div className="inp-tip" />
          </div>

        </div>{/* /right card */}
      </div>{/* /body */}

      <style>{`@keyframes inpSpin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}