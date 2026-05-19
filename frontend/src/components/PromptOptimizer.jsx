// src/components/PromptOptimizer.jsx
// BUG FIX: Two conflicting versions of this file existed (Promptoptimizer.jsx
// and PromptOptimizer.jsx). Delete Promptoptimizer.jsx and use only this one.
// Changes:
//   1. getToken() now reads 'imagegen_token' (the correct key used by api.js)
//   2. API base URL now reads from VITE_API_URL env var, not hardcoded localhost
//   3. Added onUsePrompt guard so it doesn't crash when prop is not passed
import { useState, useEffect } from "react";

// BUG FIX: was hardcoded to "http://localhost:5000/api/v1/rag" in one file
// and to the relative "/api/v1/rag" in the other (which requires a Vite proxy).
// Use the env var so it works in every environment.
const API = `${import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"}/rag`;

// BUG FIX: both versions read localStorage.getItem("token") which is wrong —
// the app stores the JWT under "imagegen_token" (see api.js / LoginModal.jsx).
const getToken = () => localStorage.getItem("imagegen_token") || "";

export default function PromptOptimizer({ onUsePrompt }) {
  const [tab,           setTab]           = useState("optimize");
  const [prompt,        setPrompt]        = useState("");
  const [question,      setQuestion]      = useState("");
  const [result,        setResult]        = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [suggestions,   setSuggestions]   = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [docStatus,     setDocStatus]     = useState("");
  const [ollamaOk,      setOllamaOk]      = useState(null);

  useEffect(() => {
    fetch(`${API}/health`)
      .then((r) => r.json())
      .then((d) => setOllamaOk(d.ok))
      .catch(() => setOllamaOk(false));
  }, []);

  const optimizePrompt = async () => {
    if (!prompt.trim()) return;
    setLoading(true); setResult(null);
    try {
      const res = await fetch(`${API}/optimize`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body:    JSON.stringify({ prompt }),
      });
      setResult(await res.json());
    } catch (e) {
      setResult({ error: e.message });
    } finally {
      setLoading(false);
    }
  };

  const searchImages = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/search?q=${encodeURIComponent(prompt)}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setSearchResults(data.images || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const askQuestion = async () => {
    if (!question.trim()) return;
    setLoading(true); setResult(null);
    try {
      const res = await fetch(`${API}/ask`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body:    JSON.stringify({ question }),
      });
      setResult(await res.json());
    } catch (e) {
      setResult({ error: e.message });
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/suggest`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const uploadDoc = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setDocStatus("Uploading…");
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch(`${API}/documents`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body:    form,
      });
      const data = await res.json();
      setDocStatus(
        data.success
          ? `✓ Ingested "${data.filename}" (${data.chunks} chunks)`
          : `Error: ${data.error}`
      );
    } catch (e) {
      setDocStatus("Upload failed: " + e.message);
    }
  };

  // BUG FIX: safe wrapper — onUsePrompt is optional; calling it without
  // a guard crashed TextToImage when the prop was missing.
  const usePrompt = (text) => onUsePrompt?.(text);

  const dotColor =
    ollamaOk === true  ? "#4ade80" :
    ollamaOk === false ? "#f87171" : "#facc15";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Syne:wght@700&display=swap');
        .po-wrap { font-family:'DM Sans',sans-serif; background:#0f0f13; border:1px solid rgba(255,255,255,0.08); border-radius:20px; padding:24px; color:#fff; max-width:700px; margin:0 auto 28px; }
        .po-header { display:flex; align-items:center; gap:10px; margin-bottom:18px; }
        .po-badge { background:linear-gradient(135deg,#7c3aed,#4f46e5); color:#fff; font-size:11px; font-weight:600; padding:3px 8px; border-radius:20px; letter-spacing:.05em; }
        .po-title { font-family:'Syne',sans-serif; font-size:16px; font-weight:700; margin:0; flex:1; }
        .po-dot { width:8px; height:8px; border-radius:50%; }
        .po-tabs { display:flex; gap:4px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:4px; margin-bottom:18px; }
        .po-tab { flex:1; padding:8px 4px; border:none; border-radius:8px; font-size:12px; font-weight:500; font-family:'DM Sans',sans-serif; background:transparent; color:rgba(255,255,255,0.35); cursor:pointer; transition:all .15s; }
        .po-tab:hover { color:rgba(255,255,255,0.7); }
        .po-tab.active { background:rgba(124,58,237,0.25); color:#c4b5fd; }
        .po-textarea { width:100%; padding:12px 14px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); border-radius:12px; font-size:14px; font-family:'DM Sans',sans-serif; color:#fff; outline:none; resize:vertical; min-height:80px; box-sizing:border-box; transition:border .2s; }
        .po-textarea::placeholder { color:rgba(255,255,255,0.25); }
        .po-textarea:focus { border-color:rgba(139,92,246,0.5); box-shadow:0 0 0 3px rgba(139,92,246,0.1); }
        .po-btn { margin-top:10px; padding:10px 20px; background:linear-gradient(135deg,#7c3aed,#4f46e5); color:#fff; border:none; border-radius:10px; font-size:14px; font-weight:600; font-family:'DM Sans',sans-serif; cursor:pointer; transition:transform .15s,box-shadow .15s; box-shadow:0 4px 14px rgba(124,58,237,0.3); }
        .po-btn:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(124,58,237,0.4); }
        .po-btn:disabled { opacity:.5; cursor:not-allowed; transform:none; }
        .po-result { margin-top:16px; padding:14px 16px; background:rgba(139,92,246,0.08); border:1px solid rgba(139,92,246,0.2); border-radius:12px; }
        .po-result-label { font-size:11px; font-weight:600; color:#a78bfa; letter-spacing:.08em; text-transform:uppercase; margin-bottom:6px; }
        .po-result-text { font-size:14px; color:rgba(255,255,255,0.85); line-height:1.6; margin:0 0 12px; }
        .po-use-btn { padding:8px 16px; background:rgba(124,58,237,0.3); border:1px solid rgba(139,92,246,0.4); border-radius:8px; color:#c4b5fd; font-size:13px; font-weight:600; font-family:'DM Sans',sans-serif; cursor:pointer; transition:all .15s; }
        .po-use-btn:hover { background:rgba(124,58,237,0.5); }
        .po-suggestion-list { display:flex; flex-direction:column; gap:8px; margin-top:12px; }
        .po-suggestion { padding:10px 14px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:10px; font-size:13px; color:rgba(255,255,255,0.7); cursor:pointer; transition:all .15s; text-align:left; }
        .po-suggestion:hover { background:rgba(124,58,237,0.15); border-color:rgba(139,92,246,0.3); color:#fff; }
        .po-image-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-top:14px; }
        .po-image-card { border-radius:10px; overflow:hidden; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); cursor:pointer; transition:border-color .15s; }
        .po-image-card:hover { border-color:rgba(139,92,246,0.4); }
        .po-image-card img { width:100%; aspect-ratio:1; object-fit:cover; display:block; }
        .po-image-card-label { font-size:11px; color:rgba(255,255,255,0.4); padding:6px 8px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .po-upload-area { margin-top:10px; padding:20px; border:2px dashed rgba(255,255,255,0.1); border-radius:12px; text-align:center; cursor:pointer; transition:border-color .15s; display:block; }
        .po-upload-area:hover { border-color:rgba(139,92,246,0.4); }
        .po-doc-status { margin-top:8px; font-size:13px; color:#a78bfa; }
        .po-answer { font-size:14px; color:rgba(255,255,255,0.8); line-height:1.7; white-space:pre-wrap; margin:0 0 8px; }
        .po-sources { font-size:11px; color:rgba(255,255,255,0.3); }
        .po-spinner { display:inline-block; width:14px; height:14px; border:2px solid rgba(255,255,255,0.2); border-top-color:#a78bfa; border-radius:50%; animation:po-spin .7s linear infinite; vertical-align:middle; margin-right:6px; }
        @keyframes po-spin { to { transform:rotate(360deg); } }
      `}</style>

      <div className="po-wrap">
        <div className="po-header">
          <span className="po-badge">RAG</span>
          <h3 className="po-title">AI Prompt Assistant</h3>
          <div
            className="po-dot"
            style={{ background: dotColor }}
            title={
              ollamaOk === true  ? "Ollama connected" :
              ollamaOk === false ? "Ollama offline — run: ollama serve" : "Checking…"
            }
          />
        </div>

        <div className="po-tabs">
          {[
            { key: "optimize", label: "✨ Optimize" },
            { key: "search",   label: "🔍 Search"   },
            { key: "ask",      label: "📄 Ask Docs"  },
            { key: "suggest",  label: "💡 Suggest"   },
          ].map((t) => (
            <button
              key={t.key}
              className={`po-tab ${tab === t.key ? "active" : ""}`}
              onClick={() => { setTab(t.key); setResult(null); setSearchResults([]); }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* OPTIMIZE */}
        {tab === "optimize" && (
          <>
            <textarea
              className="po-textarea"
              placeholder="Type your basic prompt… e.g. 'a cat in a forest'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <button className="po-btn" onClick={optimizePrompt} disabled={loading || !prompt.trim()}>
              {loading ? <><span className="po-spinner" />Optimizing…</> : "✨ Optimize Prompt"}
            </button>
            {result?.optimized && (
              <div className="po-result">
                <div className="po-result-label">Optimized Prompt</div>
                <p className="po-result-text">{result.optimized}</p>
                {/* BUG FIX: original used onUsePrompt?. which is fine, but
                    added the usePrompt wrapper for consistency */}
                <button className="po-use-btn" onClick={() => usePrompt(result.optimized)}>
                  Use this prompt →
                </button>
              </div>
            )}
            {result?.error && (
              <p style={{ color: "#f87171", marginTop: 10, fontSize: 13 }}>{result.error}</p>
            )}
          </>
        )}

        {/* SEARCH */}
        {tab === "search" && (
          <>
            <textarea
              className="po-textarea"
              style={{ minHeight: 60 }}
              placeholder="Describe what you're looking for… e.g. 'sunset over mountains'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <button className="po-btn" onClick={searchImages} disabled={loading || !prompt.trim()}>
              {loading ? <><span className="po-spinner" />Searching…</> : "🔍 Search Images"}
            </button>
            {searchResults.length > 0 && (
              <div className="po-image-grid">
                {searchResults.map((img) => (
                  <div key={img.id} className="po-image-card" onClick={() => usePrompt(img.prompt_raw)}>
                    <img src={img.image_url} alt={img.prompt_raw} />
                    <div className="po-image-card-label" title={img.prompt_raw}>
                      {img.prompt_raw}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {searchResults.length === 0 && !loading && prompt && (
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, marginTop: 10 }}>
                No results — generate some images first!
              </p>
            )}
          </>
        )}

        {/* ASK DOCS */}
        {tab === "ask" && (
          <>
            <label className="po-upload-area">
              <input type="file" accept=".pdf,.txt" onChange={uploadDoc} style={{ display: "none" }} />
              <div style={{ fontSize: 28 }}>📂</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>
                Upload a PDF or TXT to ask questions from
              </div>
            </label>
            {docStatus && <div className="po-doc-status">{docStatus}</div>}
            <textarea
              className="po-textarea"
              style={{ marginTop: 14 }}
              placeholder="Ask a question about your uploaded documents…"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <button className="po-btn" onClick={askQuestion} disabled={loading || !question.trim()}>
              {loading ? <><span className="po-spinner" />Thinking…</> : "📄 Ask Question"}
            </button>
            {result?.answer && (
              <div className="po-result" style={{ marginTop: 14 }}>
                <div className="po-result-label">Answer</div>
                <p className="po-answer">{result.answer}</p>
                {result.sources?.length > 0 && (
                  <div className="po-sources">
                    Sources: {result.sources.map((s) => s.filename).join(", ")}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* SUGGEST */}
        {tab === "suggest" && (
          <>
            <button className="po-btn" onClick={loadSuggestions} disabled={loading}>
              {loading ? <><span className="po-spinner" />Generating…</> : "💡 Get Suggestions"}
            </button>
            {suggestions.length > 0 && (
              <div className="po-suggestion-list">
                {suggestions.map((s, i) => (
                  <button key={i} className="po-suggestion" onClick={() => usePrompt(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}