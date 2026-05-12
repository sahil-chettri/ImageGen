import { useState, useRef, useCallback } from "react";
import api from "../services/api.js";
import PromptOptimizer from "./PromptOptimizer.jsx";

/* ─── ICONS ─── */
const SparkleIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L13.09 8.26L19 6L14.74 10.26L21 12L14.74 13.74L19 18L13.09 15.74L12 22L10.91 15.74L5 18L9.26 13.74L3 12L9.26 10.26L5 6L10.91 8.26L12 2Z" />
  </svg>
);
const HeartIcon = ({ filled }) => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill={filled ? "#ec4899" : "none"} stroke={filled ? "#ec4899" : "#94a3b8"} strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);
const DownloadIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
  </svg>
);
const RefreshIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
  </svg>
);
const UploadIcon = () => (
  <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);
const WandIcon = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8L19 13M17.8 6.2L19 5M12.2 6.2L11 5M12.2 11.8L11 13"/>
    <path d="M3 21l9-9"/><path d="M12.2 6.2a3 3 0 1 1 4.2 4.2"/>
  </svg>
);
const ArrowLeftIcon = () => (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="M19 12H5M12 5l-7 7 7 7"/>
  </svg>
);
const XIcon = () => (
  <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

/* ─── STYLE TEMPLATES ─── */
const IMG_TEMPLATES = [
  { id:"i1", emoji:"🎭", name:"Anime",      category:"anime",     modifier:"convert to anime art style, vibrant colors, sharp clean lines",             gradient:"135deg,#9333ea,#ec4899", accent:"#9333ea", accentLight:"#f3e8ff", accentBorder:"#d8b4fe" },
  { id:"i2", emoji:"🎬", name:"Cinematic",  category:"cinematic", modifier:"cinematic color grading, dramatic shadows, movie lighting, film grain",      gradient:"135deg,#374151,#6b7280", accent:"#374151", accentLight:"#f3f4f6", accentBorder:"#d1d5db" },
  { id:"i3", emoji:"🌆", name:"Cyberpunk",  category:"cyberpunk", modifier:"neon cyberpunk style, purple and blue glow, city vibes, neon lights",       gradient:"135deg,#0ea5e9,#6366f1", accent:"#4f46e5", accentLight:"#eef2ff", accentBorder:"#c7d2fe" },
  { id:"i4", emoji:"🧸", name:"Pixar 3D",   category:"pixar",     modifier:"Pixar 3D animation style, round features, expressive eyes, soft shading",   gradient:"135deg,#f59e0b,#ef4444", accent:"#d97706", accentLight:"#fffbeb", accentBorder:"#fcd34d" },
  { id:"i5", emoji:"🖌️", name:"Oil Paint",  category:"painting",  modifier:"classical oil painting style, rich textures, visible brush strokes",       gradient:"135deg,#92400e,#b45309", accent:"#b45309", accentLight:"#fef3c7", accentBorder:"#fcd34d" },
  { id:"i6", emoji:"📷", name:"DSLR Pro",   category:"realistic", modifier:"professional DSLR photo quality, sharp details, bokeh background, 8k",      gradient:"135deg,#0369a1,#0ea5e9", accent:"#0369a1", accentLight:"#e0f2fe", accentBorder:"#7dd3fc" },
  { id:"i7", emoji:"✨", name:"Glow",        category:"glow",      modifier:"magical glowing lighting, sparkles, ethereal light effects, fantasy glow",  gradient:"135deg,#fbbf24,#a78bfa", accent:"#7c3aed", accentLight:"#faf5ff", accentBorder:"#c4b5fd" },
  { id:"i8", emoji:"🚀", name:"Sci-Fi",      category:"scifi",     modifier:"futuristic cyborg transformation, sci-fi armor, neon implants, cybernetic", gradient:"135deg,#059669,#0ea5e9", accent:"#059669", accentLight:"#ecfdf5", accentBorder:"#6ee7b7" },
];

const STYLE_MAP = { Cinematic:"Cinematic", Anime:"Anime", Sketch:"Sketch", "Oil Paint":"Oil Paint", Neon:"Neon", Watercolor:"Watercolor" };
const STYLES    = Object.keys(STYLE_MAP);
const RATIOS    = [{ label:"1:1", w:1, h:1 }, { label:"16:9", w:16, h:9 }, { label:"9:16", w:9, h:16 }];
const ALL_CATS  = ["All","anime","cinematic","cyberpunk","pixar","painting","realistic","glow","scifi"];

/* ─── TEMPLATE CARD ─── */
function TemplateCard({ tpl, isActive, isFav, onSelect, onToggleFav }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={()=>onSelect(tpl)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        flexShrink:0, width:140, borderRadius:14, cursor:"pointer", overflow:"hidden", position:"relative",
        border:`2px solid ${isActive ? tpl.accentBorder : hov ? "#e2e8f0" : "#f1f5f9"}`,
        background: isActive ? tpl.accentLight : hov ? "#f8fafc" : "#fff",
        transition:"all 0.18s",
        transform: hov ? "translateY(-3px)" : "none",
        boxShadow: isActive
          ? `0 0 0 1px ${tpl.accentBorder}, 0 8px 24px rgba(0,0,0,0.1)`
          : hov ? "0 6px 20px rgba(0,0,0,0.08)" : "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      <div style={{ height:72, background:`linear-gradient(${tpl.gradient})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28 }}>
        {tpl.emoji}
      </div>
      <div style={{ padding:"9px 11px 12px" }}>
        <div style={{ fontSize:13, fontWeight:700, color: isActive ? tpl.accent : "#1e293b", marginBottom:3 }}>{tpl.name}</div>
        <div style={{ fontSize:11, color:"#94a3b8", textTransform:"capitalize" }}>{tpl.category}</div>
      </div>
      <button onClick={e=>{e.stopPropagation();onToggleFav(tpl.id)}}
        style={{ position:"absolute",top:6,right:6,background:"rgba(255,255,255,0.9)",border:"1px solid #e2e8f0",borderRadius:"50%",width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:"0 1px 3px rgba(0,0,0,0.1)" }}>
        <HeartIcon filled={isFav}/>
      </button>
      {isActive && <div style={{ position:"absolute",top:7,left:7,background:tpl.accent,borderRadius:4,width:6,height:6 }}/>}
    </div>
  );
}

/* ─── HELPERS ─── */
function Section({ label, required, optional, children }) {
  return (
    <div style={{ marginBottom:18 }}>
      <div style={{ fontSize:11, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.7px", marginBottom:8, display:"flex", alignItems:"center", gap:5 }}>
        {label}
        {required && <span style={{ color:"#6366f1" }}>*</span>}
        {optional && <span style={{ color:"#94a3b8", fontSize:10, fontWeight:500, textTransform:"none", letterSpacing:0 }}>(optional)</span>}
      </div>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ height:1, background:"#f1f5f9", margin:"8px 0 18px" }}/>;
}

function RatioBox({ w, h, active }) {
  const scale = Math.min(22/w, 16/h);
  const bw = Math.round(w*scale), bh = Math.round(h*scale);
  return <div style={{ width:bw, height:bh, border:`2px solid ${active?"#6366f1":"#cbd5e1"}`, borderRadius:2, background:active?"#eef2ff":"transparent", transition:"all 0.15s" }}/>;
}

function ActionBtn({ icon, label, onClick, disabled, accent, fullWidth }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        display:"flex", alignItems:"center", gap:6, padding:"8px 16px",
        flex: fullWidth ? 1 : "none", justifyContent:"center",
        borderRadius:9, fontSize:12.5, fontWeight:600, cursor:disabled?"not-allowed":"pointer",
        fontFamily:"inherit", transition:"all 0.15s",
        background: disabled ? "#f8fafc" : accent ? (hov?"#eef2ff":"#f0f4ff") : (hov?"#f1f5f9":"#f8fafc"),
        border:`1px solid ${disabled?"#e2e8f0":accent?"#c7d2fe":"#e2e8f0"}`,
        color: disabled ? "#cbd5e1" : accent ? "#4f46e5" : "#64748b",
      }}
    >{icon}{label}</button>
  );
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════ */
export default function ImageToImage({ onBack }) {
  const [prompt,         setPrompt]    = useState("");
  const [negativePrompt, setNegPrompt] = useState("");
  const [style,          setStyle]     = useState("");
  const [ratio,          setRatio]     = useState("1:1");
  const [loading,        setLoading]   = useState(false);
  const [image,          setImage]     = useState(null);
  const [imgLoaded,      setImgLoaded] = useState(false);
  const [error,          setError]     = useState("");
  const [showRag,        setShowRag]   = useState(false);

  const [sourceFile,    setSourceFile] = useState(null);
  const [sourcePreview, setSourcePrev] = useState(null);
  const [dragOver,      setDragOver]   = useState(false);
  const fileRef = useRef(null);

  const [activeTpl, setActiveTpl] = useState(null);
  const [favs,      setFavs]      = useState([]);
  const [recent,    setRecent]    = useState([]);
  const [search,    setSearch]    = useState("");
  const [cat,       setCat]       = useState("All");
  const [showFavs,  setShowFavs]  = useState(false);

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setSourceFile(file); setSourcePrev(URL.createObjectURL(file));
    setImage(null); setImgLoaded(false); setError("");
  }, []);

  const onDrop = (e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); };
  const removeSource = () => { setSourceFile(null); setSourcePrev(null); setImage(null); setImgLoaded(false); };

  const toggleFav = (id) => setFavs(f => f.includes(id) ? f.filter(x=>x!==id) : [...f,id]);
  const applyTemplate = (tpl) => {
    setActiveTpl(tpl.id);
    setRecent(r => [tpl.id, ...r.filter(x=>x!==tpl.id)].slice(0,6));
  };

  const filtered = IMG_TEMPLATES.filter(t => {
    if (cat !== "All" && t.category !== cat) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.category.includes(search.toLowerCase())) return false;
    if (showFavs && !favs.includes(t.id)) return false;
    return true;
  });

  const generate = async () => {
    if (!prompt.trim()) { setError("Please enter a transformation prompt."); return; }
    if (!sourceFile)    { setError("Please upload a source image."); return; }
    setError(""); setLoading(true); setImage(null); setImgLoaded(false);
    try {
      const imgTpl     = IMG_TEMPLATES.find(t => t.id === activeTpl);
      const modifier   = imgTpl ? `, ${imgTpl.modifier}` : "";
      const fullPrompt = prompt.trim() + modifier;
      const resolvedStyle = STYLE_MAP[style] || "Cinematic";
      const data = await api.generate.image({ file:sourceFile, prompt:fullPrompt, negativePrompt, ratio, style:resolvedStyle });
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

  const activeTplData = IMG_TEMPLATES.find(t => t.id === activeTpl);

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", width:"100vw", overflow:"hidden", background:"#f8fafc", fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,sans-serif", color:"#1e293b" }}>

      {/* ── NAVBAR ── */}
      <nav style={{ display:"flex", alignItems:"center", gap:12, padding:"0 28px", height:60, flexShrink:0, borderBottom:"1px solid #e2e8f0", background:"#fff", zIndex:100 }}>
        <button onClick={onBack}
          style={{ display:"flex", alignItems:"center", gap:7, background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:8, padding:"6px 13px", color:"#64748b", fontSize:13, cursor:"pointer", transition:"all 0.15s" }}
          onMouseEnter={e=>{e.currentTarget.style.background="#f1f5f9";e.currentTarget.style.color="#1e293b"}}
          onMouseLeave={e=>{e.currentTarget.style.background="#f8fafc";e.currentTarget.style.color="#64748b"}}
        ><ArrowLeftIcon/> Back</button>

        <div style={{ display:"flex", alignItems:"center", gap:9, marginLeft:4 }}>
          <div style={{ width:32, height:32, borderRadius:10, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff" }}>
            <SparkleIcon size={15}/>
          </div>
          <span style={{ fontWeight:800, fontSize:16, letterSpacing:"-0.4px", color:"#0f172a" }}>ImageGen</span>
          <span style={{ fontSize:11, color:"#6366f1", fontWeight:600, background:"#eef2ff", padding:"2px 8px", borderRadius:6, border:"1px solid #c7d2fe" }}>Image → Image</span>
        </div>

        <div style={{ flex:1 }}/>
        {["Features","Gallery","Pricing","Docs"].map(l=>(
          <span key={l} style={{ padding:"5px 12px", color:"#64748b", fontSize:13, cursor:"pointer", fontWeight:500, transition:"color 0.15s" }}
            onMouseEnter={e=>e.currentTarget.style.color="#1e293b"}
            onMouseLeave={e=>e.currentTarget.style.color="#64748b"}
          >{l}</span>
        ))}
        <button style={{ padding:"8px 18px", borderRadius:9, background:"#0f172a", border:"none", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", letterSpacing:"-0.1px" }}
          onMouseEnter={e=>e.currentTarget.style.background="#1e293b"}
          onMouseLeave={e=>e.currentTarget.style.background="#0f172a"}
        >Get Started</button>
      </nav>

      {/* ── BODY ── */}
      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>

        {/* ── LEFT PANEL ── */}
        <div style={{ flex:"0 0 50%", minWidth:0, borderRight:"1px solid #e2e8f0", overflowY:"auto", overflowX:"hidden", background:"#fff", scrollbarWidth:"thin", scrollbarColor:"#e2e8f0 transparent" }}>
          <div style={{ padding:"24px 28px 32px", display:"flex", flexDirection:"column" }}>

            {/* Panel header */}
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:22 }}>
              <div style={{ width:40, height:40, borderRadius:12, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:"0 4px 12px rgba(99,102,241,0.3)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>
              <div>
                <div style={{ fontWeight:800, fontSize:16, letterSpacing:"-0.4px", color:"#0f172a" }}>Image to Image</div>
                <div style={{ fontSize:12, color:"#94a3b8", marginTop:1 }}>Transform any photo with AI</div>
              </div>
              <button onClick={()=>setShowRag(r=>!r)}
                style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:6, padding:"7px 13px", background: showRag?"linear-gradient(135deg,#6366f1,#8b5cf6)":"#f5f3ff", border:`1px solid ${showRag?"transparent":"#ddd6fe"}`, borderRadius:9, color:showRag?"#fff":"#7c3aed", fontSize:12, fontWeight:600, cursor:"pointer", transition:"all 0.15s" }}>
                <SparkleIcon size={12}/> AI {showRag?"▲":"▼"}
              </button>
            </div>

            {showRag && (
              <div style={{ marginBottom:18, borderRadius:12, overflow:"hidden", border:"1px solid #ddd6fe", boxShadow:"0 2px 8px rgba(99,102,241,0.1)" }}>
                <PromptOptimizer onUsePrompt={p => { setPrompt(p); setShowRag(false); }} />
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, fontSize:12.5, color:"#dc2626", marginBottom:18 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span style={{flex:1}}>{error}</span>
                <button onClick={()=>setError("")} style={{background:"none",border:"none",color:"#dc2626",cursor:"pointer",padding:0,display:"flex"}}><XIcon/></button>
              </div>
            )}

            {/* STYLE TEMPLATES */}
            <Section label="Style Templates">
              <div style={{ display:"flex", gap:6, marginBottom:10 }}>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search styles…"
                  style={{ flex:1, padding:"8px 12px", background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:9, fontSize:12.5, color:"#1e293b", fontFamily:"inherit", outline:"none", transition:"border-color 0.15s" }}
                  onFocus={e=>e.target.style.borderColor="#a5b4fc"}
                  onBlur={e=>e.target.style.borderColor="#e2e8f0"}
                />
                <button onClick={()=>setShowFavs(f=>!f)}
                  style={{ padding:"8px 12px", borderRadius:9, border:`1px solid ${showFavs?"#f9a8d4":"#e2e8f0"}`, background:showFavs?"#fdf2f8":"#f8fafc", color:showFavs?"#db2777":"#94a3b8", fontSize:11.5, cursor:"pointer", display:"flex", alignItems:"center", gap:4, fontWeight:600, transition:"all 0.15s" }}>
                  <HeartIcon filled={showFavs}/> Favs
                </button>
              </div>

              {/* Category pills */}
              <div style={{ display:"flex", gap:5, overflowX:"auto", paddingBottom:8, scrollbarWidth:"none" }}>
                {ALL_CATS.map(c=>(
                  <button key={c} onClick={()=>setCat(c)}
                    style={{ flexShrink:0, padding:"4px 12px", borderRadius:999, border:`1px solid ${cat===c?"#a5b4fc":"#e2e8f0"}`, background:cat===c?"#eef2ff":"#fff", color:cat===c?"#4f46e5":"#64748b", fontSize:11.5, fontWeight:cat===c?700:500, cursor:"pointer", whiteSpace:"nowrap", fontFamily:"inherit", transition:"all 0.15s" }}
                  >{c.charAt(0).toUpperCase()+c.slice(1)}</button>
                ))}
              </div>

              {/* Recently used */}
              {recent.length>0 && !search && cat==="All" && !showFavs && (
                <div style={{ marginTop:8, marginBottom:8 }}>
                  <div style={{ fontSize:10.5, color:"#94a3b8", fontWeight:700, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.6px" }}>Recently Used</div>
                  <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                    {recent.slice(0,4).map(id=>{
                      const t = IMG_TEMPLATES.find(x=>x.id===id);
                      return t ? <button key={id} onClick={()=>applyTemplate(t)}
                        style={{ padding:"3px 10px", borderRadius:999, border:"1px solid #e2e8f0", background:"#f8fafc", fontSize:11.5, color:"#64748b", cursor:"pointer", fontFamily:"inherit" }}
                      >{t.emoji} {t.name}</button> : null;
                    })}
                  </div>
                </div>
              )}

              {/* Template cards */}
              <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:8, scrollbarWidth:"none", marginTop:6 }}>
                {filtered.length===0
                  ? <div style={{ fontSize:12.5, color:"#94a3b8", padding:"16px 0" }}>No styles found.</div>
                  : filtered.map(t=><TemplateCard key={t.id} tpl={t} isActive={activeTpl===t.id} isFav={favs.includes(t.id)} onSelect={applyTemplate} onToggleFav={toggleFav}/>)
                }
              </div>

              {/* Active badge */}
              {activeTplData && (
                <div style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 13px", background:activeTplData.accentLight, border:`1px solid ${activeTplData.accentBorder}`, borderRadius:10, fontSize:12.5, color:activeTplData.accent, fontWeight:600, marginTop:8 }}>
                  <span>{activeTplData.emoji}</span>
                  <span>{activeTplData.name} style will be applied</span>
                  <button onClick={()=>setActiveTpl(null)} style={{ marginLeft:"auto", background:"none", border:"none", color:"#94a3b8", cursor:"pointer", padding:0, display:"flex" }}><XIcon/></button>
                </div>
              )}
            </Section>

            <Divider/>

            {/* SOURCE IMAGE */}
            <Section label="Source Image" required>
              {!sourcePreview ? (
                <div onClick={()=>fileRef.current?.click()} onDrop={onDrop}
                  onDragOver={e=>{e.preventDefault();setDragOver(true)}} onDragLeave={()=>setDragOver(false)}
                  style={{ border:`2px dashed ${dragOver?"#6366f1":"#cbd5e1"}`, borderRadius:12, padding:"28px 20px", display:"flex", flexDirection:"column", alignItems:"center", gap:8, cursor:"pointer", background:dragOver?"#eef2ff":"#f8fafc", transition:"all 0.2s", textAlign:"center" }}
                  onMouseEnter={e=>{if(!dragOver){e.currentTarget.style.borderColor="#a5b4fc";e.currentTarget.style.background="#f5f3ff"}}}
                  onMouseLeave={e=>{if(!dragOver){e.currentTarget.style.borderColor="#cbd5e1";e.currentTarget.style.background="#f8fafc"}}}
                >
                  <div style={{ width:48, height:48, borderRadius:12, background:"#eef2ff", display:"flex", alignItems:"center", justifyContent:"center", color:"#6366f1" }}><UploadIcon/></div>
                  <div style={{ fontSize:13.5, fontWeight:600, color:"#1e293b" }}>Drop image or click to browse</div>
                  <div style={{ fontSize:12, color:"#94a3b8" }}>JPEG · PNG · WEBP — max 5 MB</div>
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])}/>
                </div>
              ) : (
                <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 13px", background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:11 }}>
                  <img src={sourcePreview} alt="src" style={{ width:46, height:46, borderRadius:8, objectFit:"cover", border:"1px solid #e2e8f0", flexShrink:0 }}/>
                  <div style={{ flex:1, overflow:"hidden" }}>
                    <div style={{ fontSize:13, fontWeight:600, color:"#1e293b", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{sourceFile?.name}</div>
                    <div style={{ fontSize:11.5, color:"#94a3b8", marginTop:2 }}>{sourceFile?`${(sourceFile.size/1024).toFixed(0)} KB`:""} · <span style={{color:"#16a34a", fontWeight:600}}>✓ Ready</span></div>
                  </div>
                  <button onClick={removeSource} style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:7, padding:"5px 7px", color:"#ef4444", cursor:"pointer", display:"flex", flexShrink:0, transition:"all 0.15s" }}><XIcon/></button>
                </div>
              )}
            </Section>

            <Divider/>

            {/* PROMPT */}
            <Section label="Transformation Prompt" required>
              <textarea rows={3} value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Describe how to transform the image…"
                style={{ width:"100%", padding:"11px 14px", background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:10, fontSize:13.5, color:"#1e293b", fontFamily:"inherit", outline:"none", resize:"vertical", lineHeight:1.6, boxSizing:"border-box", transition:"border-color 0.15s" }}
                onFocus={e=>e.target.style.borderColor="#a5b4fc"}
                onBlur={e=>e.target.style.borderColor="#e2e8f0"}
              />
              {prompt && (
                <button onClick={()=>setShowRag(true)} style={{ marginTop:7, display:"flex", alignItems:"center", gap:5, padding:"6px 12px", background:"#f5f3ff", border:"1px solid #ddd6fe", borderRadius:8, color:"#7c3aed", fontSize:12, fontWeight:600, cursor:"pointer", transition:"all 0.15s" }}
                  onMouseEnter={e=>e.currentTarget.style.background="#ede9fe"}
                  onMouseLeave={e=>e.currentTarget.style.background="#f5f3ff"}
                >
                  <WandIcon/> Optimize this prompt
                </button>
              )}
            </Section>

            {/* NEGATIVE PROMPT */}
            <Section label="Negative Prompt" optional>
              <textarea rows={2} value={negativePrompt} onChange={e=>setNegPrompt(e.target.value)} placeholder="What to avoid in the result…"
                style={{ width:"100%", padding:"11px 14px", background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:10, fontSize:13.5, color:"#1e293b", fontFamily:"inherit", outline:"none", resize:"vertical", lineHeight:1.6, boxSizing:"border-box", transition:"border-color 0.15s" }}
                onFocus={e=>e.target.style.borderColor="#a5b4fc"}
                onBlur={e=>e.target.style.borderColor="#e2e8f0"}
              />
            </Section>

            <Divider/>

            {/* STYLE PRESET */}
            <Section label="Style Preset">
              <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                {STYLES.map(s=>(
                  <button key={s} onClick={()=>setStyle(style===s?"":s)}
                    style={{ padding:"6px 14px", borderRadius:9, border:`1px solid ${style===s?"#a5b4fc":"#e2e8f0"}`, background:style===s?"#eef2ff":"#fff", color:style===s?"#4f46e5":"#64748b", fontSize:13, fontWeight:style===s?700:500, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s", boxShadow:style===s?"0 0 0 3px rgba(99,102,241,0.1)":"none" }}
                  >{s}</button>
                ))}
              </div>
            </Section>

            {/* ASPECT RATIO */}
            <Section label="Aspect Ratio">
              <div style={{ display:"flex", gap:8 }}>
                {RATIOS.map(r=>(
                  <button key={r.label} onClick={()=>setRatio(r.label)}
                    style={{ flex:1, padding:"10px 0", borderRadius:10, border:`1px solid ${ratio===r.label?"#a5b4fc":"#e2e8f0"}`, background:ratio===r.label?"#eef2ff":"#fff", color:ratio===r.label?"#4f46e5":"#64748b", fontSize:12.5, fontWeight:700, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:6, transition:"all 0.15s", fontFamily:"inherit", boxShadow:ratio===r.label?"0 0 0 3px rgba(99,102,241,0.1)":"0 1px 3px rgba(0,0,0,0.04)" }}
                  >
                    <RatioBox w={r.w} h={r.h} active={ratio===r.label}/>
                    {r.label}
                  </button>
                ))}
              </div>
            </Section>

            <div style={{ marginTop:8 }}/>

            {/* TRANSFORM BUTTON */}
            <button onClick={generate} disabled={loading||!sourceFile}
              style={{ width:"100%", padding:"14px", borderRadius:12, background:loading||!sourceFile?"#e2e8f0":"linear-gradient(135deg,#6366f1,#8b5cf6)", border:"none", color:loading||!sourceFile?"#94a3b8":"#fff", fontSize:14.5, fontWeight:700, cursor:loading||!sourceFile?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, transition:"all 0.2s", letterSpacing:"-0.2px", boxShadow:loading||!sourceFile?"none":"0 4px 20px rgba(99,102,241,0.35)" }}
              onMouseEnter={e=>{ if(!loading&&sourceFile){ e.currentTarget.style.transform="translateY(-1px)"; e.currentTarget.style.boxShadow="0 6px 24px rgba(99,102,241,0.45)" }}}
              onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow=loading||!sourceFile?"none":"0 4px 20px rgba(99,102,241,0.35)" }}
            >
              {loading ? (
                <><span style={{ width:16, height:16, border:"2.5px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin 0.75s linear infinite", display:"inline-block", flexShrink:0 }}/>Transforming…</>
              ) : (
                <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>Transform Image</>
              )}
            </button>
            {!sourceFile && !loading && (
              <div style={{ textAlign:"center", fontSize:12, color:"#94a3b8", marginTop:8 }}>Upload a source image to enable</div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL — PREVIEW ── */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", background:"#f8fafc", overflow:"hidden" }}>

          {/* Preview header */}
          <div style={{ padding:"16px 28px", borderBottom:"1px solid #e2e8f0", display:"flex", alignItems:"center", gap:12, flexShrink:0, background:"#fff" }}>
            <span style={{ fontWeight:700, fontSize:14.5, color:"#0f172a", letterSpacing:"-0.2px" }}>Preview</span>
            {image && <span style={{ fontSize:11.5, color:"#16a34a", background:"#f0fdf4", border:"1px solid #bbf7d0", padding:"2px 9px", borderRadius:6, fontWeight:600 }}>✓ Generated</span>}
            <div style={{ flex:1 }}/>
            {image && (
              <div style={{ display:"flex", gap:8 }}>
                <ActionBtn icon={<DownloadIcon/>} label="Download" onClick={download}/>
                <ActionBtn icon={<RefreshIcon/>} label="Regenerate" onClick={generate} disabled={!image||loading||!sourceFile} accent/>
              </div>
            )}
          </div>

          {/* Preview content */}
          <div style={{ flex:1, overflow:"auto", display:"flex", gap:16, padding:"24px 28px" }}>

            {/* Source thumbnail */}
            {sourcePreview && (
              <div style={{ flexShrink:0, width:260 }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:10 }}>Source</div>
                <div style={{ borderRadius:14, overflow:"hidden", border:"1px solid #e2e8f0", position:"relative", boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
                  <img src={sourcePreview} alt="Source" style={{ width:"100%", objectFit:"cover", display:"block", maxHeight:220 }}/>
                  {activeTplData && (
                    <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"8px 12px", background:"rgba(255,255,255,0.92)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", gap:6, fontSize:12, color:"#1e293b", borderTop:"1px solid #e2e8f0" }}>
                      <span>{activeTplData.emoji}</span>
                      <span style={{ fontWeight:600 }}>{activeTplData.name}</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{marginLeft:"auto"}}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </div>
                  )}
                </div>
                {image && (
                  <div style={{ marginTop:14, display:"flex", flexDirection:"column", gap:7 }}>
                    <ActionBtn icon={<DownloadIcon/>} label="Download" onClick={download} fullWidth/>
                    <ActionBtn icon={<RefreshIcon/>} label="Regenerate" onClick={generate} disabled={!image||loading||!sourceFile} accent fullWidth/>
                  </div>
                )}
              </div>
            )}

            {/* Output image */}
            <div style={{ flex:1, borderRadius:16, border:"1px solid #e2e8f0", background:"#fff", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", minHeight:300, position:"relative", boxShadow:"0 2px 12px rgba(0,0,0,0.05)" }}>
              {loading && (
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:18, textAlign:"center" }}>
                  <div style={{ position:"relative", width:60, height:60 }}>
                    <div style={{ width:60, height:60, border:"3px solid #e0e7ff", borderTopColor:"#6366f1", borderRadius:"50%", animation:"spin 0.9s linear infinite" }}/>
                    <div style={{ position:"absolute", inset:10, border:"3px solid #ede9fe", borderTopColor:"#8b5cf6", borderRadius:"50%", animation:"spin 1.5s linear infinite reverse" }}/>
                  </div>
                  <div>
                    <div style={{ fontSize:15, fontWeight:700, color:"#1e293b", marginBottom:5 }}>Transforming your image…</div>
                    <div style={{ fontSize:12.5, color:"#94a3b8" }}>This may take 10–20 seconds</div>
                  </div>
                </div>
              )}

              {!loading && !image && (
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:14, textAlign:"center", padding:48 }}>
                  <div style={{ width:80, height:80, borderRadius:24, background:"#eef2ff", border:"1px solid #c7d2fe", display:"flex", alignItems:"center", justifyContent:"center", color:"#6366f1" }}>
                    <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize:16, fontWeight:700, color:"#1e293b", marginBottom:6 }}>Transformed image will appear here</div>
                    <div style={{ fontSize:13, color:"#94a3b8" }}>
                      {!sourceFile ? "Upload a source image to get started" : "Select a style and click Transform Image"}
                    </div>
                  </div>
                </div>
              )}

              {!loading && image && (
                <img src={image} alt="Transformed" onLoad={()=>setImgLoaded(true)}
                  style={{ width:"100%", height:"100%", objectFit:"contain", opacity:imgLoaded?1:0, transition:"opacity 0.4s ease" }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}`}</style>
    </div>
  );
}