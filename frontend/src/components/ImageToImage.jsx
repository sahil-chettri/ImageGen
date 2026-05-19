import { useState, useRef, useCallback } from "react";
import PromptOptimizer from "./PromptOptimizer.jsx";
import { tokenStorage } from "../services/api.js";

/* ─── THEME — identical to Landing + TextToImage ─── */
const T = {
  cream:      "#f5f0e8",
  creamDark:  "#ede7d9",
  creamMid:   "#e8e0cf",
  ink:        "#1a1612",
  inkSoft:    "#4a3f35",
  inkMuted:   "#8a7d72",
  accent:     "#e85d3a",
  accentDim:  "rgba(232,93,58,0.09)",
  accentBrd:  "rgba(232,93,58,0.28)",
  accentEnd:  "#f2a65a",
  card:       "rgba(255,253,248,0.95)",
  border:     "rgba(26,22,18,0.10)",
  borderHov:  "rgba(26,22,18,0.18)",
  inputBg:    "rgba(245,240,232,0.55)",
};

/* ─── STYLE TEMPLATES ─── */
const IMG_TEMPLATES = [
  { id:"i1", emoji:"🎭", name:"Anime",     category:"anime",    modifier:"convert to anime art style, vibrant colors, sharp clean lines",           gradient:"135deg,#9333ea,#ec4899", accentL:"#f3e8ff", accentB:"#d8b4fe", accentC:"#9333ea" },
  { id:"i2", emoji:"🎬", name:"Cinematic", category:"cinematic",modifier:"cinematic color grading, dramatic shadows, movie lighting, film grain",    gradient:"135deg,#374151,#6b7280", accentL:"#f3f4f6", accentB:"#d1d5db", accentC:"#374151" },
  { id:"i3", emoji:"🌆", name:"Cyberpunk", category:"cyberpunk",modifier:"neon cyberpunk style, purple and blue glow, city vibes, neon lights",     gradient:"135deg,#0ea5e9,#6366f1", accentL:"#eef2ff", accentB:"#c7d2fe", accentC:"#4f46e5" },
  { id:"i4", emoji:"🧸", name:"Pixar 3D",  category:"pixar",    modifier:"Pixar 3D animation style, round features, expressive eyes, soft shading", gradient:"135deg,#f59e0b,#ef4444", accentL:"#fffbeb", accentB:"#fcd34d", accentC:"#d97706" },
  { id:"i5", emoji:"🖌️", name:"Oil Paint", category:"painting", modifier:"classical oil painting style, rich textures, visible brush strokes",     gradient:"135deg,#92400e,#b45309", accentL:"#fef3c7", accentB:"#fcd34d", accentC:"#b45309" },
  { id:"i6", emoji:"📷", name:"DSLR Pro",  category:"realistic",modifier:"professional DSLR photo quality, sharp details, bokeh background, 8k",    gradient:"135deg,#0369a1,#0ea5e9", accentL:"#e0f2fe", accentB:"#7dd3fc", accentC:"#0369a1" },
  { id:"i7", emoji:"✨", name:"Glow",       category:"glow",     modifier:"magical glowing lighting, sparkles, ethereal light effects, fantasy glow",gradient:"135deg,#fbbf24,#a78bfa", accentL:"#faf5ff", accentB:"#c4b5fd", accentC:"#7c3aed" },
  { id:"i8", emoji:"🚀", name:"Sci-Fi",    category:"scifi",    modifier:"futuristic sci-fi style, neon implants, cybernetic armor, glowing details",gradient:"135deg,#059669,#0ea5e9", accentL:"#ecfdf5", accentB:"#6ee7b7", accentC:"#059669" },
];

const STYLES   = ["Cinematic","Anime","Sketch","Oil Paint","Neon","Watercolor"];
const RATIOS   = [{ label:"1:1", w:1, h:1 }, { label:"16:9", w:16, h:9 }, { label:"9:16", w:9, h:16 }];
const ALL_CATS = ["All","anime","cinematic","cyberpunk","pixar","painting","realistic","glow","scifi"];

const SparkleIcon = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 2L13.09 8.26L19 6L14.74 10.26L21 12L14.74 13.74L19 18L13.09 15.74L12 22L10.91 15.74L5 18L9.26 13.74L3 12L9.26 10.26L5 6L10.91 8.26L12 2Z"/>
  </svg>
);

const HeartIcon = ({ filled }) => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill={filled ? "#ec4899" : "none"} stroke={filled ? "#ec4899" : T.inkMuted} strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

function TemplateCard({ tpl, isActive, isFav, onSelect, onToggleFav }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={() => onSelect(tpl)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flexShrink: 0, width: 130, borderRadius: 14, cursor: "pointer",
        overflow: "hidden", position: "relative",
        border: `1.5px solid ${isActive ? tpl.accentB : hov ? T.borderHov : T.border}`,
        background: isActive ? tpl.accentL : hov ? T.creamDark : T.cream,
        transition: "all 0.18s",
        transform: hov ? "translateY(-2px)" : "none",
        boxShadow: isActive
          ? `0 0 0 1px ${tpl.accentB}, 0 6px 20px rgba(26,22,18,0.10)`
          : hov ? "0 4px 16px rgba(26,22,18,0.08)" : "0 1px 4px rgba(26,22,18,0.05)",
      }}>
      <div style={{ height: 68, background: `linear-gradient(${tpl.gradient})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
        {tpl.emoji}
      </div>
      <div style={{ padding: "7px 9px 10px" }}>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: isActive ? tpl.accentC : T.ink, marginBottom: 1 }}>{tpl.name}</div>
        <div style={{ fontSize: 10, color: T.inkMuted, textTransform: "capitalize" }}>{tpl.category}</div>
      </div>
      <button onClick={e => { e.stopPropagation(); onToggleFav(tpl.id); }}
        style={{ position: "absolute", top: 4, right: 4, background: "rgba(255,253,248,0.92)", border: `1px solid ${T.border}`, borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 }}>
        <HeartIcon filled={isFav} />
      </button>
    </div>
  );
}

export default function ImageToImage({ onBack }) {
  const [prompt,         setPrompt]    = useState("");
  const [negativePrompt, setNegPrompt] = useState("");
  const [style,          setStyle]     = useState("");
  const [ratio,          setRatio]     = useState("1:1");
  const [loading,        setLoading]   = useState(false);
  const [image,          setImage]     = useState(null);
  const [imgLoaded,      setImgLoaded] = useState(false);
  const [srcAspect,      setSrcAspect]  = useState(null); // natural width/height ratio of source
  const [error,          setError]     = useState("");
  const [showRag,        setShowRag]   = useState(false);
  const [sourceFile,     setSourceFile]= useState(null);
  const [sourcePreview,  setSourcePrev]= useState(null);
  const [dragOver,       setDragOver]  = useState(false);
  const [activeTpl,      setActiveTpl] = useState(null);
  const [favs,           setFavs]      = useState([]);
  const [search,         setSearch]    = useState("");
  const [cat,            setCat]       = useState("All");
  const [showFavs,       setShowFavs]  = useState(false);
  const [showStylePreset, setShowStyleP] = useState(false);
  const fileRef = useRef(null);

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setSourceFile(file); setSourcePrev(url);
    setImage(null); setImgLoaded(false); setError("");
    // Detect natural aspect ratio so the preview card matches the image shape
    const img = new Image();
    img.onload = () => setSrcAspect(img.naturalWidth / img.naturalHeight);
    img.src = url;
  }, []);

  const onDrop = (e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); };
  const removeSource = () => { setSourceFile(null); setSourcePrev(null); setImage(null); setImgLoaded(false); setSrcAspect(null); };
  const toggleFav = (id) => setFavs(f => f.includes(id) ? f.filter(x => x !== id) : [...f, id]);
  const applyTemplate = (tpl) => setActiveTpl(tpl.id);

  const filtered = IMG_TEMPLATES.filter(t => {
    if (cat !== "All" && t.category !== cat) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (showFavs && !favs.includes(t.id)) return false;
    return true;
  });

  /**
   * Reads the JWT from localStorage using the same key as api.js ('imagegen_token').
   */
  const getAuthToken = () => tokenStorage.get();

  const generate = async () => {
    if (!prompt.trim()) { setError("Please enter a transformation prompt."); return; }
    if (!sourceFile)    { setError("Please upload a source image."); return; }
    setError(""); setLoading(true); setImage(null); setImgLoaded(false);
    try {
      const imgTpl   = IMG_TEMPLATES.find(t => t.id === activeTpl);
      const modifier = imgTpl ? `, ${imgTpl.modifier}` : "";

      // Build FormData — the only correct way to upload a File (not JSON)
      const form = new FormData();
      form.append("image",          sourceFile);
      form.append("prompt",         prompt.trim() + modifier);
      form.append("negativePrompt", negativePrompt || "");
      form.append("ratio",          ratio);
      form.append("style",          style || "Cinematic");

      // Attach auth token — backend requires Authorization: Bearer <token>
      const token = getAuthToken();
      const headers = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      // ⚠️ Do NOT set Content-Type — browser sets it automatically with the
      //    correct multipart boundary when the body is FormData

      const res = await fetch("http://localhost:5000/api/v1/generate/image", {
        method: "POST",
        headers,
        credentials: "include", // also sends cookies (session-based auth fallback)
        body: form,
      });

      if (!res.ok) {
        let errMsg = `Server error ${res.status}`;
        try {
          const errData = await res.json();
          errMsg = errData?.message || errData?.error || errMsg;
        } catch { errMsg = await res.text() || errMsg; }
        throw new Error(errMsg);
      }

      const data = await res.json();
      // Support both { image_url } and { generation: { image_url } } shapes
      const url = data?.image_url ?? data?.generation?.image_url ?? data?.url ?? data?.imageUrl;
      if (!url) throw new Error("No image URL returned from server.");
      setImage(url);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally { setLoading(false); }
  };

  const download = () => {
    if (!image) return;
    const a = document.createElement("a"); a.href = image; a.download = `imagegen_${Date.now()}.png`; a.click();
  };

  const activeTplData = IMG_TEMPLATES.find(t => t.id === activeTpl);

  const Label = ({ children, req, opt }) => (
    <div style={{ fontSize: 10.5, fontWeight: 500, color: T.inkMuted, textTransform: "uppercase", letterSpacing: "0.9px", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
      {children}
      {req && <span style={{ color: T.accent, textTransform: "none", letterSpacing: 0 }}>*</span>}
      {opt && <span style={{ color: T.inkMuted, fontSize: 10, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>}
    </div>
  );

  return (
    <div style={{ height: "100vh", width: "100vw", display: "flex", flexDirection: "column", overflow: "hidden", background: T.cream, fontFamily: "'DM Sans', sans-serif", color: T.ink, position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500&family=Caveat:wght@600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* noise overlay */
        .i2i-noise::before {
          content:''; position:fixed; inset:0;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
          pointer-events:none; z-index:0; opacity:0.5;
        }
        .i2i-blob { position:fixed; border-radius:50%; filter:blur(90px); opacity:0.11; pointer-events:none; z-index:0; }
        .i2i-blob-1 { width:320px; height:320px; background:#e85d3a; top:-4%; left:-4%; animation:i2i-blobFloat 14s ease-in-out infinite; }
        .i2i-blob-2 { width:260px; height:260px; background:#f2a65a; bottom:8%; right:-4%; animation:i2i-blobFloat 16s ease-in-out infinite 3s; }
        .i2i-blob-3 { width:200px; height:200px; background:#3d6b4f; top:45%; left:38%; animation:i2i-blobFloat 12s ease-in-out infinite 6s; }
        @keyframes i2i-blobFloat { 0%,100%{transform:translate(0,0) scale(1);} 33%{transform:translate(18px,-18px) scale(1.05);} 66%{transform:translate(-14px,14px) scale(0.97);} }
        @keyframes i2i-spin { to { transform: rotate(360deg); } }
        @keyframes i2i-reveal { from{opacity:0;transform:scale(0.97);} to{opacity:1;transform:scale(1);} }

        /* panels */
        .i2i-panel { background:${T.card}; border:1px solid ${T.border}; border-radius:20px; backdrop-filter:blur(10px); }

        /* inputs */
        .i2i-input {
          width:100%; padding:9px 12px;
          background:${T.inputBg};
          border:1px solid ${T.border}; border-radius:10px;
          font-size:13px; font-family:'DM Sans',sans-serif; color:${T.ink};
          outline:none; transition:border 0.18s, box-shadow 0.18s;
        }
        .i2i-input::placeholder { color:${T.inkMuted}; }
        .i2i-input:focus { border-color:${T.accent}; box-shadow:0 0 0 3px ${T.accentDim}; }
        .i2i-textarea { resize:vertical; line-height:1.6; }

        /* chip */
        .i2i-chip { padding:4px 13px; border-radius:999px; border:1px solid ${T.border}; background:transparent; font-family:'DM Sans',sans-serif; font-size:12px; color:${T.inkSoft}; cursor:pointer; transition:all 0.15s; white-space:nowrap; }
        .i2i-chip:hover { border-color:${T.accentBrd}; color:${T.accent}; }
        .i2i-chip-on { border-color:${T.accent}; background:${T.accentDim}; color:${T.accent}; font-weight:500; }

        /* ratio btn */
        .i2i-ratio { flex:1; padding:8px 0; border-radius:10px; border:1px solid ${T.border}; background:rgba(245,240,232,0.5); color:${T.inkMuted}; font-size:11.5px; font-weight:500; cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:4px; transition:all 0.15s; font-family:'DM Sans',sans-serif; }
        .i2i-ratio:hover { border-color:${T.accentBrd}; color:${T.accent}; }
        .i2i-ratio-on { border-color:${T.accent}; background:${T.accentDim}; color:${T.accent}; }

        /* icon btn */
        .i2i-icon-btn { width:32px; height:32px; border-radius:8px; border:1px solid ${T.border}; background:transparent; display:flex; align-items:center; justify-content:center; color:${T.inkMuted}; cursor:pointer; transition:all 0.15s; padding:0; }
        .i2i-icon-btn:hover { border-color:${T.accentBrd}; color:${T.accent}; background:rgba(232,93,58,0.06); }
        .i2i-icon-btn-on { border-color:${T.accent}; background:${T.accentDim}; color:${T.accent}; }

        /* action btn */
        .i2i-action-btn { display:flex; align-items:center; gap:6px; padding:7px 14px; border-radius:999px; border:1px solid ${T.border}; background:transparent; font-family:'DM Sans',sans-serif; font-size:12.5px; color:${T.inkSoft}; cursor:pointer; transition:all 0.15s; }
        .i2i-action-btn:hover:not(:disabled) { border-color:${T.accentBrd}; color:${T.accent}; }
        .i2i-action-btn:disabled { opacity:0.35; cursor:not-allowed; }

        /* transform btn */
        .i2i-transform-btn { width:100%; padding:13px; border-radius:999px; border:none; font-family:'DM Sans',sans-serif; font-size:14px; font-weight:500; display:flex; align-items:center; justify-content:center; gap:8px; cursor:pointer; transition:all 0.2s; }
        .i2i-transform-btn:not(:disabled) { background:${T.ink}; color:${T.cream}; box-shadow:0 4px 18px rgba(26,22,18,0.18); }
        .i2i-transform-btn:not(:disabled):hover { background:#2d2520; transform:translateY(-1px); box-shadow:0 6px 22px rgba(26,22,18,0.24); }
        .i2i-transform-btn:disabled { background:${T.creamMid}; color:${T.inkMuted}; cursor:not-allowed; }

        /* ai tag */
        .i2i-ai-tag { display:inline-flex; align-items:center; gap:4px; padding:4px 11px; border-radius:999px; border:1px solid ${T.accentBrd}; background:${T.accentDim}; color:${T.accent}; font-size:11.5px; font-weight:500; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.15s; }
        .i2i-ai-tag:hover { background:rgba(232,93,58,0.14); }

        /* scroll hide */
        .i2i-scroll::-webkit-scrollbar { height:0; width:0; }
      `}</style>

      <div className="i2i-noise" />
      <div className="i2i-blob i2i-blob-1" />
      <div className="i2i-blob i2i-blob-2" />
      <div className="i2i-blob i2i-blob-3" />


      {/* ── RAG modal ── */}
      {showRag && (
        <PromptOptimizer
          initialPrompt={prompt}
          onAccept={(p) => { setPrompt(p); setShowRag(false); }}
          onClose={() => setShowRag(false)}
        />
      )}

      {/* ── Body ── */}
      <div style={{ flex:1, display:"flex", gap:18, padding:"18px 40px 18px", overflow:"hidden", position:"relative", zIndex:1, alignItems:"stretch" }}>

        {/* ══ LEFT PANEL ══ */}
        <div className="i2i-panel" style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column", overflowY:"auto" }}>

          {/* Panel header */}
          <div style={{ padding:"18px 22px 14px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:`linear-gradient(135deg,${T.accent},${T.accentEnd})`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M21 15l-5-5L5 21"/><circle cx="8.5" cy="8.5" r="1.5"/></svg>
            </div>
            <div>
              <div style={{ fontFamily:"'Instrument Serif',serif", fontStyle:"italic", fontSize:19, color:T.ink, letterSpacing:"-0.3px", lineHeight:1.1 }}>
                Image to <span style={{ color:T.accent }}>Image</span>
              </div>
              <div style={{ fontSize:11.5, color:T.inkMuted, marginTop:2 }}>Transform any photo with AI</div>
            </div>
            <button className="i2i-ai-tag" onClick={() => setShowRag(!showRag)} style={{ marginLeft:"auto" }}>
              <SparkleIcon size={11} color={T.accent} />
              AI {showRag ? "▲" : "▼"}
            </button>
          </div>

          <div style={{ padding:"16px 22px", display:"flex", flexDirection:"column", gap:16, flex:1 }}>

            {/* Error */}
            {error && (
              <div style={{ background:"rgba(232,93,58,0.07)", border:`1px solid ${T.accentBrd}`, borderRadius:10, padding:"9px 13px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <span style={{ fontSize:12.5, color:T.accent }}>{error}</span>
                <button onClick={() => setError("")} style={{ background:"none", border:"none", cursor:"pointer", color:T.accent, fontSize:14, padding:0, lineHeight:1 }}>✕</button>
              </div>
            )}

            {/* ── STYLE TEMPLATES ── */}
            <div>
              <Label>Style Templates</Label>
              {/* Search + favs */}
              <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                <div style={{ flex:1, position:"relative", display:"flex", alignItems:"center" }}>
                  <svg style={{ position:"absolute", left:10, pointerEvents:"none", color:T.inkMuted }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                  <input className="i2i-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search styles…" style={{ width:"100%", paddingLeft:30 }}
                    onFocus={e => { e.target.style.borderColor=T.accent; e.target.style.boxShadow=`0 0 0 3px ${T.accentDim}`; }}
                    onBlur={e => { e.target.style.borderColor=T.border; e.target.style.boxShadow="none"; }}
                  />
                </div>
                <button onClick={() => setShowFavs(f => !f)} style={{ padding:"7px 14px", borderRadius:10, border:`1px solid ${showFavs?"#f9a8d4":T.border}`, background:showFavs?"#fdf2f8":"transparent", color:showFavs?"#db2777":T.inkMuted, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:5, fontWeight:500, transition:"all .15s", fontFamily:"'DM Sans',sans-serif", whiteSpace:"nowrap" }}>
                  <HeartIcon filled={showFavs} /> Favorites
                </button>
              </div>

              {/* Category pills */}
              <div className="i2i-scroll" style={{ display:"flex", gap:5, overflowX:"auto", paddingBottom:8, marginBottom:8 }}>
                {ALL_CATS.map(c => (
                  <button key={c} className={`i2i-chip ${cat===c?"i2i-chip-on":""}`} onClick={() => setCat(c)}>
                    {c.charAt(0).toUpperCase()+c.slice(1)}
                  </button>
                ))}
              </div>

              {/* Template cards */}
              <div className="i2i-scroll" style={{ display:"flex", gap:7, overflowX:"auto", paddingBottom:6 }}>
                {filtered.length===0
                  ? <div style={{ fontSize:12, color:T.inkMuted, padding:"12px 0" }}>No styles found.</div>
                  : filtered.map(t => <TemplateCard key={t.id} tpl={t} isActive={activeTpl===t.id} isFav={favs.includes(t.id)} onSelect={applyTemplate} onToggleFav={toggleFav} />)
                }
              </div>

              {activeTplData && (
                <div style={{ marginTop:9, display:"flex", alignItems:"center", gap:8, padding:"8px 12px", background:activeTplData.accentL, border:`1px solid ${activeTplData.accentB}`, borderRadius:10, fontSize:12, color:activeTplData.accentC, fontWeight:500 }}>
                  <span>{activeTplData.emoji}</span>
                  <span>{activeTplData.name} style will be applied</span>
                  <button onClick={() => setActiveTpl(null)} style={{ marginLeft:"auto", background:"none", border:"none", color:T.inkMuted, cursor:"pointer", fontSize:15, padding:0, lineHeight:1 }}>✕</button>
                </div>
              )}
            </div>

            {/* divider */}
            <div style={{ height:1, background:T.border }} />

            {/* ── SOURCE IMAGE ── */}
            <div>
              <Label req>Source Image</Label>
              {!sourcePreview ? (
                <div onClick={() => fileRef.current?.click()} onDrop={onDrop}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onMouseEnter={e => { if(!dragOver) { e.currentTarget.style.borderColor=T.accent; e.currentTarget.style.background="rgba(232,93,58,0.06)"; } }}
                  onMouseLeave={e => { if(!dragOver) { e.currentTarget.style.borderColor=T.border; e.currentTarget.style.background=T.inputBg; } }}
                  style={{ border:`1.5px dashed ${dragOver?T.accent:T.border}`, borderRadius:14, padding:"22px 16px", display:"flex", flexDirection:"column", alignItems:"center", gap:8, cursor:"pointer", background:dragOver?"rgba(232,93,58,0.06)":T.inputBg, transition:"all .2s", textAlign:"center" }}
                >
                  <div style={{ width:42, height:42, borderRadius:12, background:T.accentDim, display:"flex", alignItems:"center", justifyContent:"center", color:T.accent }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  </div>
                  <div style={{ fontSize:13, fontWeight:500, color:T.ink }}>Drop image or click to browse</div>
                  <div style={{ fontSize:11.5, color:T.inkMuted }}>JPEG · PNG · WEBP — max 5 MB</div>
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display:"none" }} onChange={e => handleFile(e.target.files[0])} />
                </div>
              ) : (
                <div style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:12 }}>
                  <img src={sourcePreview} alt="src" style={{ width:44, height:44, borderRadius:8, objectFit:"cover", border:`1px solid ${T.border}`, flexShrink:0 }} />
                  <div style={{ flex:1, overflow:"hidden" }}>
                    <div style={{ fontSize:12.5, fontWeight:500, color:T.ink, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{sourceFile?.name}</div>
                    <div style={{ fontSize:11, color:T.inkMuted, marginTop:2 }}>{sourceFile ? `${(sourceFile.size/1024).toFixed(0)} KB` : ""} · <span style={{ color:"#16a34a", fontWeight:500 }}>✓ Ready</span></div>
                  </div>
                  <button onClick={removeSource} style={{ background:"#fff5f5", border:"1px solid #fecaca", borderRadius:7, padding:"5px 7px", color:"#ef4444", cursor:"pointer", display:"flex", transition:"all .15s" }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              )}
            </div>

            {/* divider */}
            <div style={{ height:1, background:T.border }} />

            {/* ── PROMPT ── */}
            <div>
              <Label req>Transformation Prompt</Label>
              <div style={{ position:"relative" }}>
                <textarea className="i2i-input i2i-textarea" rows={3} value={prompt} onChange={e => setPrompt(e.target.value.slice(0,1000))} placeholder="Describe how to transform the image…" style={{ paddingBottom:22 }} />
                <span style={{ position:"absolute", bottom:8, right:10, fontSize:11, color:T.inkMuted, pointerEvents:"none" }}>{prompt.length} / 1000</span>
              </div>
              {prompt && (
                <button className="i2i-ai-tag" onClick={() => setShowRag(true)} style={{ marginTop:6 }}>
                  <SparkleIcon size={10} color={T.accent} /> Optimize prompt
                </button>
              )}
            </div>

            {/* ── NEGATIVE PROMPT ── */}
            <div>
              <Label opt>Negative Prompt</Label>
              <div style={{ position:"relative" }}>
                <textarea className="i2i-input i2i-textarea" rows={2} value={negativePrompt} onChange={e => setNegPrompt(e.target.value.slice(0,1000))} placeholder="What to avoid in the result…" style={{ paddingBottom:22 }} />
                <span style={{ position:"absolute", bottom:8, right:10, fontSize:11, color:T.inkMuted, pointerEvents:"none" }}>{negativePrompt.length} / 1000</span>
              </div>
            </div>

            {/* divider */}
            <div style={{ height:1, background:T.border }} />

            {/* ── STYLE PRESET ── */}
            <div>
              <button onClick={() => setShowStyleP(p => !p)} style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", background:"none", border:"none", cursor:"pointer", padding:0, marginBottom: showStylePreset ? 10 : 0, fontFamily:"'DM Sans',sans-serif" }}>
                <span style={{ fontSize:10.5, fontWeight:500, color:T.inkMuted, textTransform:"uppercase", letterSpacing:"0.9px" }}>Style Preset</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.inkMuted} strokeWidth="2.2" strokeLinecap="round" style={{ transition:"transform 0.2s", transform: showStylePreset ? "rotate(180deg)" : "rotate(0deg)" }}><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              {showStylePreset && (
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {STYLES.map(s => (
                    <button key={s} className={`i2i-chip ${style===s?"i2i-chip-on":""}`} onClick={() => setStyle(style===s?"":s)}>{s}</button>
                  ))}
                </div>
              )}
            </div>

            {/* ── ASPECT RATIO ── */}
            <div>
              <Label>Aspect Ratio</Label>
              <div style={{ display:"flex", gap:7 }}>
                {RATIOS.map(r => (
                  <button key={r.label} className={`i2i-ratio ${ratio===r.label?"i2i-ratio-on":""}`} onClick={() => setRatio(r.label)}>
                    <div style={{ width: Math.round(20*Math.min(20/r.w, 14/r.h)), height: Math.round(14*Math.min(20/r.w, 14/r.h)), border:`2px solid ${ratio===r.label?T.accent:T.inkMuted}`, borderRadius:2, background:ratio===r.label?T.accentDim:"transparent", transition:"all .15s" }} />
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── TRANSFORM BUTTON ── */}
            <button className="i2i-transform-btn" onClick={generate} disabled={loading || !sourceFile}>
              {loading ? (
                <>
                  <span style={{ width:14, height:14, border:"2.5px solid rgba(26,22,18,0.15)", borderTopColor:T.inkMuted, borderRadius:"50%", animation:"i2i-spin 0.75s linear infinite", display:"inline-block" }} />
                  Transforming…
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  Transform Image
                </>
              )}
            </button>
            {!sourceFile && !loading && (
              <p style={{ textAlign:"center", fontSize:11.5, color:T.inkMuted, marginTop:-8 }}>Upload a source image to enable</p>
            )}
          </div>
        </div>

        {/* ══ RIGHT PANEL — PREVIEW ══ */}
        <div className="i2i-panel" style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minHeight:0 }}>

          {/* Preview header */}
          <div style={{ padding:"12px 20px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
            <span style={{ fontFamily:"'Instrument Serif',serif", fontStyle:"italic", fontSize:16, color:T.ink, flex:1 }}>Preview</span>
            {image && <span style={{ fontSize:11, color:"#16a34a", background:"#f0fdf4", border:"1px solid #bbf7d0", padding:"2px 9px", borderRadius:6, fontWeight:500 }}>✓ Generated</span>}
            <div style={{ display:"flex", alignItems:"center", gap:5 }}>
              <button className="i2i-icon-btn i2i-icon-btn-on">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              </button>
              <button className="i2i-icon-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              </button>
              <button className="i2i-icon-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z"/></svg>
              </button>
              <div style={{ width:1, height:18, background:T.border }} />
              <button className="i2i-icon-btn" onClick={image?download:undefined} disabled={!image} style={{ opacity:image?1:0.35 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              </button>
            </div>
          </div>

          {/* ── Preview body: side-by-side BEFORE / AFTER ── */}
          <div style={{ flex:1, display:"flex", minHeight:0, overflow:"hidden", background:"rgba(245,240,232,0.35)", padding:16, gap:12 }}>

            {/* ── BEFORE card ── */}
            <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, minHeight:0 }}>
              {/* Label */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8, flexShrink:0 }}>
                <span style={{ fontSize:10, fontWeight:700, color:T.inkMuted, textTransform:"uppercase", letterSpacing:"1px" }}>Before</span>
                {activeTplData && sourcePreview && (
                  <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:10, color:activeTplData.accentC, background:activeTplData.accentL, border:`1px solid ${activeTplData.accentB}`, borderRadius:6, padding:"2px 8px", fontWeight:500 }}>
                    {activeTplData.emoji} {activeTplData.name}
                  </span>
                )}
              </div>
              {/* Image box */}
              <div style={{
                flex:1, minHeight:0, borderRadius:14, overflow:"hidden",
                border:`1.5px solid ${T.border}`,
                background: sourcePreview ? T.creamDark : "rgba(255,253,248,0.6)",
                display:"flex", alignItems:"center", justifyContent:"center",
                position:"relative",
              }}>
                {sourcePreview ? (
                  <img src={sourcePreview} alt="Source"
                    style={{ width:"100%", height:"100%", objectFit:"contain", display:"block" }} />
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10, padding:24, textAlign:"center" }}>
                    <div style={{ width:54, height:54, borderRadius:16, background:T.accentDim, border:`1px solid ${T.accentBrd}`, display:"flex", alignItems:"center", justifyContent:"center", color:T.accent }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    </div>
                    <p style={{ fontFamily:"'Instrument Serif',serif", fontStyle:"italic", fontSize:14, color:T.inkMuted, margin:0 }}>Upload a source image</p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Divider arrow ── */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, width:32 }}>
              <div style={{ width:32, height:32, borderRadius:"50%", background:T.card, border:`1.5px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 2px 8px rgba(26,22,18,0.08)" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={loading ? T.accent : T.inkMuted} strokeWidth="2.5" strokeLinecap="round" style={{ transition:"stroke 0.3s" }}>
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </div>

            {/* ── AFTER card ── */}
            <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, minHeight:0 }}>
              {/* Label */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8, flexShrink:0 }}>
                <span style={{ fontSize:10, fontWeight:700, color: image ? "#16a34a" : T.inkMuted, textTransform:"uppercase", letterSpacing:"1px" }}>After</span>
                {image && <span style={{ fontSize:10, color:"#16a34a", background:"#f0fdf4", border:"1px solid #bbf7d0", padding:"2px 8px", borderRadius:6, fontWeight:500 }}>✓ Ready</span>}
              </div>
              {/* Image box */}
              <div style={{
                flex:1, minHeight:0, borderRadius:14, overflow:"hidden",
                border:`1.5px ${image ? "solid" : "dashed"} ${image ? T.border : T.border}`,
                background: image ? T.creamDark : "rgba(255,253,248,0.6)",
                display:"flex", alignItems:"center", justifyContent:"center",
                position:"relative", transition:"all 0.3s",
              }}>
                {loading && (
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:14, textAlign:"center", padding:24 }}>
                    <div style={{ position:"relative", width:48, height:48 }}>
                      <div style={{ width:48, height:48, border:`3px solid ${T.accentDim}`, borderTopColor:T.accent, borderRadius:"50%", animation:"i2i-spin 0.9s linear infinite" }} />
                      <div style={{ position:"absolute", inset:9, border:`2px solid rgba(232,93,58,0.08)`, borderTopColor:T.accentEnd, borderRadius:"50%", animation:"i2i-spin 1.6s linear infinite reverse" }} />
                    </div>
                    <div>
                      <p style={{ fontFamily:"'Instrument Serif',serif", fontStyle:"italic", fontSize:15, color:T.ink, margin:"0 0 4px" }}>Transforming…</p>
                      <p style={{ fontSize:11.5, color:T.inkMuted, margin:0 }}>10–20 seconds</p>
                    </div>
                  </div>
                )}
                {!loading && !image && (
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10, padding:24, textAlign:"center" }}>
                    <div style={{ width:54, height:54, borderRadius:16, background:T.accentDim, border:`1px solid ${T.accentBrd}`, display:"flex", alignItems:"center", justifyContent:"center", color:T.accent }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    </div>
                    <p style={{ fontFamily:"'Instrument Serif',serif", fontStyle:"italic", fontSize:14, color:T.inkMuted, margin:0 }}>
                      {!sourceFile ? "Upload an image first" : "Select a style & transform"}
                    </p>
                  </div>
                )}
                {!loading && image && (
                  <img src={image} alt="Transformed" onLoad={() => setImgLoaded(true)}
                    style={{ width:"100%", height:"100%", objectFit:"contain", display:"block", opacity:imgLoaded?1:0, transition:"opacity 0.45s ease", animation:"i2i-reveal 0.5s ease" }} />
                )}
              </div>
            </div>
          </div>

          {/* Bottom actions */}
          <div style={{ padding:"12px 20px", borderTop:`1px solid ${T.border}`, display:"flex", gap:9, flexShrink:0 }}>
            <button className="i2i-action-btn" disabled={!image} onClick={image?download:undefined}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              Download
            </button>
            <button className="i2i-action-btn" disabled={!image||loading} onClick={image&&!loading?generate:undefined}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
              Regenerate
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}