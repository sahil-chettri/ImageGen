import { useState, useEffect } from "react";
import api from "../services/api.js";

export default function LoginModal({ onSuccess, onClose }) {
  const [tab, setTab]         = useState("login");
  const [form, setForm]       = useState({ name: "", email: "", password: "" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setError("");
    if (!form.email || !form.password) return setError("Email and password are required.");
    if (tab === "register" && !form.name) return setError("Name is required.");
    setLoading(true);
    try {
      const data =
        tab === "login"
          ? await api.auth.login(form.email, form.password)
          : await api.auth.register(form.name, form.email, form.password);
      onSuccess(data.user);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');

        .lm-overlay {
          position: fixed;
          inset: 0;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          background: rgba(0,0,0,0.75);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          animation: lm-fade-in 0.25s ease;
        }

        @keyframes lm-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        @keyframes lm-slide-up {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes lm-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        .lm-card {
          position: relative;
          width: 90%;
          max-width: 480px;
          background: #0f0f13;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 28px;
          padding: 48px 44px 40px;
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.04),
            0 40px 80px rgba(0,0,0,0.6),
            0 0 120px rgba(139,92,246,0.08);
          animation: lm-slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          font-family: 'DM Sans', sans-serif;
          overflow: hidden;
        }

        .lm-card::before {
          content: '';
          position: absolute;
          top: -80px;
          right: -60px;
          width: 260px;
          height: 260px;
          background: radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%);
          pointer-events: none;
        }

        .lm-card::after {
          content: '';
          position: absolute;
          bottom: -60px;
          left: -40px;
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%);
          pointer-events: none;
        }

        .lm-close {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.4);
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          z-index: 2;
        }
        .lm-close:hover {
          background: rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.8);
        }

        .lm-header {
          text-align: center;
          margin-bottom: 32px;
          position: relative;
          z-index: 1;
        }

        .lm-logo {
          width: 62px;
          height: 62px;
          border-radius: 18px;
          background: linear-gradient(135deg, #7c3aed, #4f46e5);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          box-shadow: 0 8px 32px rgba(124,58,237,0.4), 0 0 0 1px rgba(255,255,255,0.1);
        }

        .lm-title {
          font-family: 'Syne', sans-serif;
          font-size: 28px;
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 6px;
          letter-spacing: -0.5px;
        }

        .lm-subtitle {
          font-size: 14px;
          color: rgba(255,255,255,0.35);
          margin: 0;
          font-weight: 400;
        }

        .lm-divider {
          width: 40px;
          height: 2px;
          background: linear-gradient(90deg, #7c3aed, #4f46e5);
          border-radius: 2px;
          margin: 14px auto 0;
          opacity: 0.6;
        }

        .lm-tabs {
          display: flex;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          padding: 4px;
          margin-bottom: 28px;
          gap: 4px;
          position: relative;
          z-index: 1;
        }

        .lm-tab {
          flex: 1;
          padding: 10px 0;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          background: transparent;
          color: rgba(255,255,255,0.35);
          cursor: pointer;
          transition: all 0.2s;
          letter-spacing: 0.01em;
        }

        .lm-tab:hover { color: rgba(255,255,255,0.6); }

        .lm-tab-active {
          background: rgba(255,255,255,0.08);
          color: #ffffff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }

        .lm-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
          position: relative;
          z-index: 1;
        }

        .lm-input {
          width: 100%;
          padding: 14px 16px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          font-size: 15px;
          font-family: 'DM Sans', sans-serif;
          color: #fff;
          outline: none;
          transition: all 0.2s;
          box-sizing: border-box;
        }

        .lm-input::placeholder { color: rgba(255,255,255,0.25); }

        .lm-input:focus {
          border-color: rgba(139,92,246,0.6);
          background: rgba(139,92,246,0.07);
          box-shadow: 0 0 0 3px rgba(139,92,246,0.12);
        }

        .lm-error {
          color: #f87171;
          font-size: 13px;
          margin: 0;
          padding: 10px 14px;
          background: rgba(248,113,113,0.08);
          border: 1px solid rgba(248,113,113,0.2);
          border-radius: 10px;
        }

        .lm-btn {
          padding: 15px;
          background: linear-gradient(135deg, #7c3aed, #4f46e5);
          color: #fff;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          letter-spacing: 0.02em;
          margin-top: 4px;
          position: relative;
          overflow: hidden;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 4px 20px rgba(124,58,237,0.35);
        }

        .lm-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%);
          background-size: 200% 100%;
          opacity: 0;
          transition: opacity 0.3s;
        }

        .lm-btn:hover::before {
          opacity: 1;
          animation: lm-shimmer 1.2s infinite;
        }

        .lm-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(124,58,237,0.45);
        }

        .lm-btn:active { transform: translateY(0); }

        .lm-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .lm-switch {
          text-align: center;
          font-size: 13.5px;
          color: rgba(255,255,255,0.3);
          margin: 20px 0 0;
          position: relative;
          z-index: 1;
        }

        .lm-switch-link {
          color: #a78bfa;
          cursor: pointer;
          font-weight: 600;
          transition: color 0.2s;
        }

        .lm-switch-link:hover { color: #c4b5fd; }
      `}</style>

      <div className="lm-overlay" onClick={onClose}>
        <div className="lm-card" onClick={(e) => e.stopPropagation()}>

          <button className="lm-close" onClick={onClose}>✕</button>

          <div className="lm-header">
            <div className="lm-logo">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
                <path d="M12 2L13.09 8.26L19 6L14.74 10.26L21 12L14.74 13.74L19 18L13.09 15.74L12 22L10.91 15.74L5 18L9.26 13.74L3 12L9.26 10.26L5 6L10.91 8.26L12 2Z"/>
              </svg>
            </div>
            <h2 className="lm-title">
              {tab === "login" ? "Welcome back" : "Create account"}
            </h2>
            <p className="lm-subtitle">
              {tab === "login" ? "Sign in to your ImageGen account" : "Start creating AI images today"}
            </p>
            <div className="lm-divider" />
          </div>

          <div className="lm-tabs">
            {["login", "register"].map((t) => (
              <button
                key={t}
                className={`lm-tab ${tab === t ? "lm-tab-active" : ""}`}
                onClick={() => { setTab(t); setError(""); }}
              >
                {t === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <div className="lm-form">
            {tab === "register" && (
              <input
                className="lm-input"
                placeholder="Full name"
                value={form.name}
                onChange={set("name")}
              />
            )}
            <input
              className="lm-input"
              placeholder="Email address"
              type="email"
              value={form.email}
              onChange={set("email")}
            />
            <input
              className="lm-input"
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={set("password")}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />

            {error && <p className="lm-error">{error}</p>}

            <button className="lm-btn" onClick={submit} disabled={loading}>
              {loading ? "Please wait…" : tab === "login" ? "Sign In" : "Create Account"}
            </button>
          </div>

          <p className="lm-switch">
            {tab === "login" ? "Don't have an account? " : "Already have an account? "}
            <span
              className="lm-switch-link"
              onClick={() => { setTab(tab === "login" ? "register" : "login"); setError(""); }}
            >
              {tab === "login" ? "Sign up" : "Sign in"}
            </span>
          </p>

        </div>
      </div>
    </>
  );
}