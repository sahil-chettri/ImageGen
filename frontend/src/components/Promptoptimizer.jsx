// src/components/PromptOptimizer.jsx
import { useState, useEffect } from "react";

const API = "/api/v1/rag";
const getToken = () => localStorage.getItem("token") || "";

// Strips llama3's common preamble patterns like:
// "Here is the optimized prompt: ..." or "Optimized prompt: ..."
function cleanOptimized(text) {
  if (!text) return text;
  return text
    .replace(/^here is the optimized prompt[:\s"]+/i, "")
    .replace(/^optimized prompt[:\s"]+/i, "")
    .replace(/^here's the optimized prompt[:\s"]+/i, "")
    .replace(/^sure[,!]?\s*/i, "")
    .replace(/^["]+/, "")
    .replace(/["]+$/, "")
    .trim();
}

export default function PromptOptimizer({ onUsePrompt, onClose }) {
  const [tab, setTab]                   = useState("optimize");
  const [prompt, setPrompt]             = useState("");
  const [question, setQuestion]         = useState("");
  const [result, setResult]             = useState(null);
  const [loading, setLoading]           = useState(false);
  const [suggestions, setSuggestions]   = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [docStatus, setDocStatus]       = useState("");
  const [ollamaOk, setOllamaOk]         = useState(null);

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
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      // Clean the optimized text before storing
      if (data?.optimized) data.optimized = cleanOptimized(data.optimized);
      setResult(data);
    } catch (e) { setResult({ error: e.message }); }
    finally { setLoading(false); }
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
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const askQuestion = async () => {
    if (!question.trim()) return;
    setLoading(true); setResult(null);
    try {
      const res = await fetch(`${API}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ question }),
      });
      setResult(await res.json());
    } catch (e) { setResult({ error: e.message }); }
    finally { setLoading(false); }
  };

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/suggest`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const uploadDoc = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setDocStatus("Uploading…");
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch(`${API}/documents`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: form,
      });
      const data = await res.json();
      setDocStatus(data.success ? `✓ Ingested "${data.filename}" (${data.chunks} chunks)` : `Error: ${data.error}`);
    } catch (e) { setDocStatus("Upload failed: " + e.message); }
  };

  const dotColor = ollamaOk === true ? "#22c55e" : ollamaOk === false ? "#ef4444" : "#f59e0b";
  const dotTitle = ollamaOk === true ? "AI Online" : ollamaOk === false ? "Ollama offline" : "Checking…";

  const tabs = [
    { key: "optimize", icon: "✦", label: "Optimize" },
    { key: "search",   icon: "⌖", label: "Search"   },
    { key: "ask",      icon: "◈", label: "Ask Docs"  },
    { key: "suggest",  icon: "◎", label: "Suggest"   },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=Syne:wght@600;700;800&display=swap');

        .po-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(0,0,0,0.65);
          backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
          animation: po-fade-in 0.2s ease;
        }
        @keyframes po-fade-in { from { opacity:0 } to { opacity:1 } }

        .po-card {
          font-family: 'DM Sans', sans-serif;
          background: #141414;
          border: 1px solid rgba(249,115,22,0.2);
          border-radius: 20px;
          width: 100%;
          max-width: 560px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.04), 0 24px 64px rgba(0,0,0,0.7), 0 0 40px rgba(249,115,22,0.06);
          animation: po-slide-up 0.25s cubic-bezier(0.16,1,0.3,1);
        }
        @keyframes po-slide-up { from { transform:translateY(16px); opacity:0 } to { transform:translateY(0); opacity:1 } }

        .po-card::-webkit-scrollbar { width: 4px; }
        .po-card::-webkit-scrollbar-track { background: transparent; }
        .po-card::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 4px; }

        .po-header {
          display: flex; align-items: center; gap: 10px;
          padding: 20px 20px 0;
          margin-bottom: 16px;
        }
        .po-badge {
          background: linear-gradient(135deg, #f97316, #ea580c);
          color: #fff;
          font-size: 10px; font-weight: 700;
          padding: 3px 8px; border-radius: 20px;
          letter-spacing: .08em; text-transform: uppercase;
          font-family: 'Syne', sans-serif;
        }
        .po-title {
          font-family: 'Syne', sans-serif;
          font-size: 15px; font-weight: 700;
          color: #f0f0f0; margin: 0; flex: 1;
        }
        .po-status {
          display: flex; align-items: center; gap: 6px;
          font-size: 11px; color: #666;
        }
        .po-dot {
          width: 7px; height: 7px; border-radius: 50%;
          box-shadow: 0 0 6px currentColor;
        }
        .po-close {
          width: 32px; height: 32px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          color: #a0a0a0; font-size: 16px;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: all .15s; flex-shrink: 0;
          line-height: 1;
        }
        .po-close:hover { background: rgba(249,115,22,0.12); border-color: rgba(249,115,22,0.3); color: #f97316; }

        .po-tabs {
          display: flex; gap: 0;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          padding: 0 20px;
          margin-bottom: 20px;
        }
        .po-tab {
          display: flex; align-items: center; gap: 6px;
          padding: 10px 14px 10px;
          border: none; border-bottom: 2px solid transparent;
          background: transparent;
          color: #666; font-size: 12px; font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer; transition: all .15s;
          margin-bottom: -1px;
          white-space: nowrap;
        }
        .po-tab:hover { color: #a0a0a0; }
        .po-tab.active { color: #f97316; border-bottom-color: #f97316; }
        .po-tab-icon { font-size: 13px; }

        .po-body { padding: 0 20px 20px; }

        .po-textarea {
          width: 100%; padding: 12px 14px;
          background: #1e1e1e;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          font-size: 14px; font-family: 'DM Sans', sans-serif;
          color: #f0f0f0; outline: none; resize: vertical;
          min-height: 80px; box-sizing: border-box;
          transition: border .2s;
          line-height: 1.5;
        }
        .po-textarea::placeholder { color: #555; }
        .po-textarea:focus { border-color: rgba(249,115,22,0.4); box-shadow: 0 0 0 3px rgba(249,115,22,0.08); }

        .po-btn {
          margin-top: 10px; padding: 11px 20px;
          background: linear-gradient(135deg, #f97316, #ea580c);
          color: #fff; border: none; border-radius: 10px;
          font-size: 13px; font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer; transition: all .15s;
          box-shadow: 0 4px 14px rgba(249,115,22,0.25);
          display: inline-flex; align-items: center; gap: 6px;
        }
        .po-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(249,115,22,0.35); }
        .po-btn:disabled { opacity: .45; cursor: not-allowed; transform: none; box-shadow: none; }

        .po-result {
          margin-top: 16px; padding: 16px;
          background: rgba(249,115,22,0.06);
          border: 1px solid rgba(249,115,22,0.18);
          border-radius: 14px;
        }
        .po-result-label {
          font-size: 10px; font-weight: 700; color: #f97316;
          letter-spacing: .1em; text-transform: uppercase;
          margin-bottom: 8px; font-family: 'Syne', sans-serif;
        }
        .po-result-text {
          font-size: 14px; color: rgba(240,240,240,0.9);
          line-height: 1.65; margin: 0 0 14px;
        }
        .po-use-btn {
          padding: 8px 16px;
          background: rgba(249,115,22,0.15);
          border: 1px solid rgba(249,115,22,0.35);
          border-radius: 8px; color: #f97316;
          font-size: 13px; font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer; transition: all .15s;
        }
        .po-use-btn:hover { background: rgba(249,115,22,0.25); }

        .po-suggestion-list { display: flex; flex-direction: column; gap: 8px; margin-top: 14px; }
        .po-suggestion {
          padding: 12px 14px;
          background: #1e1e1e;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px;
          font-size: 13px; color: #a0a0a0;
          cursor: pointer; transition: all .15s;
          text-align: left; font-family: 'DM Sans', sans-serif;
          line-height: 1.5;
        }
        .po-suggestion:hover { background: rgba(249,115,22,0.08); border-color: rgba(249,115,22,0.25); color: #f0f0f0; }

        .po-image-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; margin-top: 14px; }
        .po-image-card {
          border-radius: 10px; overflow: hidden;
          background: #1e1e1e;
          border: 1px solid rgba(255,255,255,0.07);
          cursor: pointer; transition: border-color .15s;
        }
        .po-image-card:hover { border-color: rgba(249,115,22,0.35); }
        .po-image-card img { width: 100%; aspect-ratio: 1; object-fit: cover; display: block; }
        .po-image-card-label { font-size: 11px; color: #666; padding: 6px 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .po-upload-area {
          margin-top: 4px; padding: 24px 20px;
          border: 1.5px dashed rgba(255,255,255,0.1);
          border-radius: 12px; text-align: center;
          cursor: pointer; transition: all .15s; display: block;
        }
        .po-upload-area:hover { border-color: rgba(249,115,22,0.35); background: rgba(249,115,22,0.04); }
        .po-doc-status { margin-top: 8px; font-size: 13px; color: #f97316; }

        .po-answer { font-size: 14px; color: rgba(240,240,240,0.85); line-height: 1.7; white-space: pre-wrap; margin: 0 0 8px; }
        .po-sources { font-size: 11px; color: #555; margin-top: 6px; }

        .po-empty { font-size: 13px; color: #555; margin-top: 12px; }

        .po-spinner {
          display: inline-block; width: 13px; height: 13px;
          border: 2px solid rgba(255,255,255,0.2);
          border-top-color: #fff; border-radius: 50%;
          animation: po-spin .7s linear infinite;
        }
        @keyframes po-spin { to { transform: rotate(360deg); } }

        .po-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 16px 0; }
      `}</style>

      <div className="po-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
        <div className="po-card">

          {/* Header */}
          <div className="po-header">
            <span className="po-badge">RAG</span>
            <h3 className="po-title">AI Prompt Assistant</h3>
            <div className="po-status">
              <div className="po-dot" style={{ background: dotColor, color: dotColor }} title={dotTitle} />
              <span>{dotTitle}</span>
            </div>
            <button className="po-close" onClick={onClose} title="Close">✕</button>
          </div>

          {/* Tabs */}
          <div className="po-tabs">
            {tabs.map((t) => (
              <button
                key={t.key}
                className={`po-tab ${tab === t.key ? "active" : ""}`}
                onClick={() => { setTab(t.key); setResult(null); setSearchResults([]); setSuggestions([]); }}
              >
                <span className="po-tab-icon">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          <div className="po-body">

            {/* ── OPTIMIZE ── */}
            {tab === "optimize" && (
              <>
                <textarea
                  className="po-textarea"
                  placeholder="Type a basic prompt… e.g. 'a girl sitting in a cafe'"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) optimizePrompt(); }}
                />
                <button className="po-btn" onClick={optimizePrompt} disabled={loading || !prompt.trim()}>
                  {loading ? <><span className="po-spinner" /> Optimizing…</> : <>✦ Optimize Prompt</>}
                </button>
                {result?.optimized && (
                  <div className="po-result">
                    <div className="po-result-label">Optimized Prompt</div>
                    <p className="po-result-text">{result.optimized}</p>
                    <button className="po-use-btn" onClick={() => { onUsePrompt?.(result.optimized); onClose?.(); }}>
                      Use this prompt →
                    </button>
                  </div>
                )}
                {result?.error && <p style={{ color:"#ef4444", marginTop:10, fontSize:13 }}>{result.error}</p>}
              </>
            )}

            {/* ── SEARCH ── */}
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
                  {loading ? <><span className="po-spinner" /> Searching…</> : <>⌖ Search Images</>}
                </button>
                {searchResults.length > 0 && (
                  <div className="po-image-grid">
                    {searchResults.map((img) => (
                      <div key={img.id} className="po-image-card" onClick={() => { onUsePrompt?.(img.prompt_raw); onClose?.(); }}>
                        <img src={img.image_url} alt={img.prompt_raw} />
                        <div className="po-image-card-label" title={img.prompt_raw}>{img.prompt_raw}</div>
                      </div>
                    ))}
                  </div>
                )}
                {searchResults.length === 0 && !loading && prompt && (
                  <p className="po-empty">No results — generate some images first!</p>
                )}
              </>
            )}

            {/* ── ASK DOCS ── */}
            {tab === "ask" && (
              <>
                <label className="po-upload-area">
                  <input type="file" accept=".pdf,.txt" onChange={uploadDoc} style={{ display:"none" }} />
                  <div style={{ fontSize: 26, marginBottom: 8 }}>◈</div>
                  <div style={{ fontSize: 13, color: "#666" }}>Upload a PDF or TXT to ask questions from</div>
                  <div style={{ fontSize: 11, color: "#444", marginTop: 4 }}>Click to browse</div>
                </label>
                {docStatus && <div className="po-doc-status">{docStatus}</div>}
                <div className="po-divider" />
                <textarea
                  className="po-textarea"
                  placeholder="Ask a question about your uploaded documents…"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                />
                <button className="po-btn" onClick={askQuestion} disabled={loading || !question.trim()}>
                  {loading ? <><span className="po-spinner" /> Thinking…</> : <>◈ Ask Question</>}
                </button>
                {result?.answer && (
                  <div className="po-result" style={{ marginTop: 14 }}>
                    <div className="po-result-label">Answer</div>
                    <p className="po-answer">{result.answer}</p>
                    {result.sources?.length > 0 && (
                      <div className="po-sources">Sources: {result.sources.map((s) => s.filename).join(", ")}</div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ── SUGGEST ── */}
            {tab === "suggest" && (
              <>
                <p style={{ fontSize: 13, color: "#666", margin: "0 0 12px" }}>
                  Get AI-generated prompt ideas based on your generation history.
                </p>
                <button className="po-btn" onClick={loadSuggestions} disabled={loading}>
                  {loading ? <><span className="po-spinner" /> Generating…</> : <>◎ Get Suggestions</>}
                </button>
                {suggestions.length > 0 && (
                  <div className="po-suggestion-list">
                    {suggestions.map((s, i) => (
                      <button key={i} className="po-suggestion" onClick={() => { onUsePrompt?.(s); onClose?.(); }}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      </div>
    </>
  );
}