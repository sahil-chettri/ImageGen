import { useState, useEffect } from "react";

const VITE_API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
const BACKEND_URL  = import.meta.env.VITE_API_URL?.replace("/api/v1","") || "http://localhost:5000";

const T = {
  bg:      "#f5f0e8",
  card:    "#fff",
  border:  "#e8e0d0",
  accent:  "#d07a2a",
  accentD: "rgba(208,122,42,0.10)",
  accentB: "rgba(208,122,42,0.30)",
  text:    "#2a1f12",
  muted:   "#7a6a55",
  faint:   "#a89880",
  input:   "#faf8f4",
};

function getToken() { return localStorage.getItem("imagegen_token") || ""; }

const TYPE_COLORS = {
  "text-to-image":  { bg:"#f0f9ff", color:"#0369a1", border:"#bae6fd" },
  "image-to-image": { bg:"#f5f3ff", color:"#6d28d9", border:"#ddd6fe" },
  "inpainting":     { bg:"#f0fdf4", color:"#15803d", border:"#bbf7d0" },
  "enhancement":    { bg:"#fff7ed", color:"#c2410c", border:"#fed7aa" },
};

function TypeBadge({ type }) {
  const s = TYPE_COLORS[type] || { bg: T.accentD, color: T.accent, border: T.accentB };
  const label = type === "text-to-image"  ? "Text → Image"
              : type === "image-to-image" ? "Image → Image"
              : type === "inpainting"     ? "Inpainting"
              : type === "enhancement"    ? "Enhancement"
              : type;
  return (
    <span style={{ fontSize:10, fontWeight:600, background:s.bg, color:s.color, border:`1px solid ${s.border}`, padding:"2px 8px", borderRadius:99 }}>
      {label}
    </span>
  );
}

function ImageCard({ gen, onOpen }) {
  const [hov, setHov] = useState(false);
  let src = gen.image_url || gen.imageUrl || "";
  if (src.startsWith("/")) src = BACKEND_URL + src;

  return (
    <div
      onClick={() => onOpen(gen)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        borderRadius:16, overflow:"hidden", cursor:"pointer",
        border:`1.5px solid ${hov ? T.accent : T.border}`,
        background: T.card,
        boxShadow: hov ? "0 8px 32px rgba(42,31,18,0.14)" : "0 2px 8px rgba(42,31,18,0.06)",
        transform: hov ? "translateY(-3px)" : "none",
        transition:"all .2s",
      }}
    >
      <div style={{ position:"relative", paddingBottom:"75%", background:T.bg, overflow:"hidden" }}>
        {src ? (
          <img src={src} alt={gen.prompt} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
        ) : (
          <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", color:T.faint }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </div>
        )}
        {hov && (
          <div style={{ position:"absolute", inset:0, background:"rgba(42,31,18,0.45)", display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
            <div style={{ background:"rgba(255,255,255,0.95)", borderRadius:10, padding:"6px 14px", fontSize:12, fontWeight:600, color:T.text }}>View</div>
          </div>
        )}
      </div>
      <div style={{ padding:"10px 12px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:5 }}>
          <TypeBadge type={gen.type} />
          <span style={{ fontSize:10, color:T.faint }}>{new Date(gen.created_at).toLocaleDateString()}</span>
        </div>
        <p style={{ margin:0, fontSize:12, color:T.muted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", lineHeight:1.4 }}>
          {gen.prompt || "Enhancement"}
        </p>
      </div>
    </div>
  );
}

function LightboxModal({ gen, onClose }) {
  if (!gen) return null;
  let src = gen.image_url || gen.imageUrl || "";
  if (src.startsWith("/")) src = BACKEND_URL + src;

  const download = async () => {
    try {
      const res  = await fetch(src);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = `imagegen_${gen.id}.png`; a.click();
      URL.revokeObjectURL(url);
    } catch { window.open(src, "_blank"); }
  };

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:24, backdropFilter:"blur(6px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ background:T.card, borderRadius:20, overflow:"hidden", maxWidth:800, width:"100%", maxHeight:"90vh", display:"flex", flexDirection:"column", boxShadow:"0 24px 80px rgba(0,0,0,0.35)" }}>
        {/* Header */}
        <div style={{ padding:"14px 20px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10 }}>
          <TypeBadge type={gen.type} />
          <span style={{ flex:1, fontSize:13, color:T.muted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{gen.prompt || "Enhancement"}</span>
          <button onClick={download} style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 14px", borderRadius:8, border:`1px solid ${T.border}`, background:T.input, color:T.muted, fontSize:12, fontWeight:600, cursor:"pointer" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            Download
          </button>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:8, border:`1px solid ${T.border}`, background:"none", cursor:"pointer", color:T.muted, fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
        </div>
        {/* Image */}
        <div style={{ flex:1, overflow:"auto", display:"flex", alignItems:"center", justifyContent:"center", background:T.bg, minHeight:300 }}>
          {src && <img src={src} alt={gen.prompt} style={{ maxWidth:"100%", maxHeight:"70vh", objectFit:"contain", display:"block" }} />}
        </div>
        {/* Meta */}
        <div style={{ padding:"12px 20px", borderTop:`1px solid ${T.border}`, display:"flex", gap:16, flexWrap:"wrap" }}>
          {gen.style && <span style={{ fontSize:11, color:T.muted }}><b>Style:</b> {gen.style}</span>}
          {gen.ratio && <span style={{ fontSize:11, color:T.muted }}><b>Ratio:</b> {gen.ratio}</span>}
          <span style={{ fontSize:11, color:T.muted }}><b>Created:</b> {new Date(gen.created_at).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

export default function Gallery() {
  const [items,    setItems]   = useState([]);
  const [loading,  setLoading] = useState(true);
  const [error,    setError]   = useState("");
  const [filter,   setFilter]  = useState("all");
  const [search,   setSearch]  = useState("");
  const [selected, setSelected]= useState(null);
  const [page,     setPage]    = useState(1);
  const PER_PAGE = 12;

  useEffect(() => {
    const token = getToken();
    if (!token) { setError("Please log in to view your gallery."); setLoading(false); return; }
    fetch(`${VITE_API_URL}/gallery`, { headers: { Authorization:`Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setItems(d.generations || d.items || []); setLoading(false); })
      .catch(() => { setError("Failed to load gallery."); setLoading(false); });
  }, []);

  const filtered = items.filter(g => {
    if (filter !== "all" && g.type !== filter) return false;
    if (search && !(g.prompt||"").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);

  const FILTERS = [
    { key:"all",            label:"All" },
    { key:"text-to-image",  label:"Text → Image" },
    { key:"image-to-image", label:"Image → Image" },
    { key:"inpainting",     label:"Inpainting" },
    { key:"enhancement",    label:"Enhancement" },
  ];

  return (
    <div style={{ height:"100%", overflowY:"auto", background:T.bg, fontFamily:"'DM Sans',sans-serif", color:T.text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap'); *{box-sizing:border-box}`}</style>

      {/* Header */}
      <div style={{ padding:"32px 40px 24px", borderBottom:`1px solid ${T.border}`, background:T.card }}>
        <h1 style={{ margin:"0 0 4px", fontSize:28, fontWeight:800, fontFamily:"'Playfair Display',serif", color:T.text }}>Your Gallery</h1>
        <p style={{ margin:"0 0 20px", fontSize:14, color:T.muted }}>{items.length} image{items.length!==1?"s":""} generated</p>

        {/* Search + filters */}
        <div style={{ display:"flex", gap:12, flexWrap:"wrap", alignItems:"center" }}>
          <div style={{ position:"relative", flex:1, minWidth:220 }}>
            <svg style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", color:T.faint, pointerEvents:"none" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by prompt…" style={{ width:"100%", padding:"8px 12px 8px 32px", borderRadius:10, border:`1.5px solid ${T.border}`, background:T.input, fontSize:13, color:T.text, outline:"none", fontFamily:"'DM Sans',sans-serif" }} />
          </div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => { setFilter(f.key); setPage(1); }} style={{ padding:"6px 14px", borderRadius:99, border:`1.5px solid ${filter===f.key ? T.accent : T.border}`, background:filter===f.key ? T.accentD : "transparent", color:filter===f.key ? T.accent : T.muted, fontSize:12, fontWeight:filter===f.key?600:400, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all .15s" }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding:"24px 40px 40px" }}>
        {loading && (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:80, gap:14, flexDirection:"column" }}>
            <div style={{ width:40, height:40, border:`3px solid ${T.accentD}`, borderTopColor:T.accent, borderRadius:"50%", animation:"gallery-spin 0.8s linear infinite" }} />
            <style>{`@keyframes gallery-spin{to{transform:rotate(360deg)}}`}</style>
            <p style={{ color:T.muted, fontSize:14 }}>Loading your gallery…</p>
          </div>
        )}

        {!loading && error && (
          <div style={{ textAlign:"center", padding:80 }}>
            <p style={{ color:"#dc2626", fontSize:14 }}>{error}</p>
          </div>
        )}

        {!loading && !error && paged.length === 0 && (
          <div style={{ textAlign:"center", padding:80, display:"flex", flexDirection:"column", alignItems:"center", gap:14 }}>
            <div style={{ width:64, height:64, borderRadius:20, background:T.accentD, border:`1.5px solid ${T.accentB}`, display:"flex", alignItems:"center", justifyContent:"center", color:T.accent }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </div>
            <p style={{ fontSize:16, fontWeight:700, color:T.text, fontFamily:"'Playfair Display',serif" }}>No images yet</p>
            <p style={{ fontSize:13, color:T.faint }}>Generate your first image using any of the AI modes.</p>
          </div>
        )}

        {!loading && !error && paged.length > 0 && (
          <>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:16, marginBottom:24 }}>
              {paged.map(g => <ImageCard key={g.id} gen={g} onOpen={setSelected} />)}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} style={{ padding:"7px 16px", borderRadius:8, border:`1px solid ${T.border}`, background:T.card, color:page===1?T.faint:T.text, cursor:page===1?"not-allowed":"pointer", fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>← Prev</button>
                {Array.from({length:totalPages},(_,i)=>i+1).map(n => (
                  <button key={n} onClick={() => setPage(n)} style={{ width:34, height:34, borderRadius:8, border:`1.5px solid ${page===n?T.accent:T.border}`, background:page===n?T.accentD:"transparent", color:page===n?T.accent:T.muted, cursor:"pointer", fontSize:13, fontWeight:page===n?700:400, fontFamily:"'DM Sans',sans-serif" }}>{n}</button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages} style={{ padding:"7px 16px", borderRadius:8, border:`1px solid ${T.border}`, background:T.card, color:page===totalPages?T.faint:T.text, cursor:page===totalPages?"not-allowed":"pointer", fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Lightbox */}
      <LightboxModal gen={selected} onClose={() => setSelected(null)} />
    </div>
  );
}