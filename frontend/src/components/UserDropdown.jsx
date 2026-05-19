/**
 * UserDropdown.jsx
 *
 * Drop-in user avatar + panel for the ImageGen navbar.
 *
 * Props:
 *   user          — { name, email, credits }  (from api.auth.getMe)
 *   onLogout      — called when user confirms logout → navigate back to landing
 *   generationCount — number of images the user has generated (optional, fetched internally if omitted)
 *
 * Usage (in any navbar / App.jsx):
 *   <UserDropdown user={user} onLogout={handleLogout} generationCount={galleryTotal} />
 */

import { useState, useRef, useEffect } from "react";
import api from "../services/api.js";

/* ─── Injected CSS ─────────────────────────────────────────────────────────── */
const CSS = `
/* ── Avatar button ── */
.ud-avatar{
  width:36px; height:36px; border-radius:50%;
  background:linear-gradient(135deg,#d05a28,#e8824a);
  border:2px solid rgba(255,255,255,0.7);
  box-shadow:0 2px 10px rgba(208,90,40,0.35);
  color:#fff; font-size:13.5px; font-weight:700;
  display:flex; align-items:center; justify-content:center;
  cursor:pointer; flex-shrink:0; letter-spacing:0.3px;
  transition:transform 0.15s, box-shadow 0.15s;
  font-family:'Inter',sans-serif;
  position:relative;
}
.ud-avatar:hover{
  transform:scale(1.07);
  box-shadow:0 4px 16px rgba(208,90,40,0.45);
}

/* ── Panel wrapper ── */
.ud-panel-wrap{
  position:relative; display:inline-block;
}

/* ── Dropdown panel ── */
.ud-panel{
  position:absolute; top:calc(100% + 10px); right:0;
  width:268px;
  background:#fff; border:1px solid #e0dbd4;
  border-radius:16px;
  box-shadow:0 8px 40px rgba(26,18,11,0.14), 0 2px 8px rgba(26,18,11,0.06);
  z-index:9999; overflow:hidden;
  animation:udSlideIn 0.18s cubic-bezier(0.22,1,0.36,1);
  font-family:'Inter',sans-serif;
}
@keyframes udSlideIn{
  from{ opacity:0; transform:translateY(-8px) scale(0.97); }
  to  { opacity:1; transform:translateY(0)    scale(1);    }
}

/* ── Header strip ── */
.ud-header{
  background:linear-gradient(135deg,#fef6f1,#fff3ec);
  padding:18px 18px 14px;
  border-bottom:1px solid #f0ebe4;
}
.ud-user-row{
  display:flex; align-items:center; gap:12px;
}
.ud-avatar-lg{
  width:46px; height:46px; border-radius:50%; flex-shrink:0;
  background:linear-gradient(135deg,#d05a28,#e8824a);
  box-shadow:0 3px 12px rgba(208,90,40,0.35);
  color:#fff; font-size:16px; font-weight:700;
  display:flex; align-items:center; justify-content:center;
  letter-spacing:0.3px;
}
.ud-name{
  font-size:14.5px; font-weight:700; color:#1a120b;
  margin:0 0 2px; line-height:1.2;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  max-width:168px;
}
.ud-email{
  font-size:11.5px; color:#8a7866; margin:0; line-height:1.3;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  max-width:168px;
}

/* ── Stats row ── */
.ud-stats{
  display:grid; grid-template-columns:1fr 1fr;
  gap:1px; background:#f0ebe4;
  border-bottom:1px solid #f0ebe4;
}
.ud-stat{
  background:#fff; padding:12px 16px;
  display:flex; flex-direction:column; align-items:center; gap:3px;
}
.ud-stat-val{
  font-size:20px; font-weight:700; color:#1a120b; line-height:1;
}
.ud-stat-val--accent{ color:#d05a28; }
.ud-stat-label{
  font-size:10.5px; font-weight:600; color:#8a7866;
  text-transform:uppercase; letter-spacing:0.6px;
}

/* ── Credits bar ── */
.ud-credits-section{
  padding:12px 16px 10px;
  border-bottom:1px solid #f0ebe4;
}
.ud-credits-row{
  display:flex; justify-content:space-between; align-items:center; margin-bottom:7px;
}
.ud-credits-label{ font-size:11.5px; font-weight:600; color:#8a7866; }
.ud-credits-val{
  font-size:12px; font-weight:700; color:#d05a28;
  background:#fef0e8; border:1px solid #f0c8a8;
  border-radius:6px; padding:2px 8px;
}
.ud-bar-track{
  height:5px; background:#f0ebe4; border-radius:99px; overflow:hidden;
}
.ud-bar-fill{
  height:100%; border-radius:99px;
  background:linear-gradient(90deg,#d05a28,#e8824a);
  transition:width 0.6s cubic-bezier(0.22,1,0.36,1);
}

/* ── Menu items ── */
.ud-menu{ padding:6px; }
.ud-menu-item{
  display:flex; align-items:center; gap:10px;
  width:100%; padding:9px 12px; border-radius:9px;
  border:none; background:transparent; cursor:pointer;
  font-family:'Inter',sans-serif; font-size:13px;
  font-weight:500; color:#3a2e24; text-align:left;
  transition:background 0.12s, color 0.12s;
}
.ud-menu-item:hover{ background:#faf8f5; color:#1a120b; }
.ud-menu-item svg{ flex-shrink:0; color:#8a7866; }
.ud-menu-item:hover svg{ color:#d05a28; }

/* ── Logout button ── */
.ud-logout{
  display:flex; align-items:center; gap:10px;
  width:100%; padding:10px 12px; border-radius:9px;
  border:none; background:transparent; cursor:pointer;
  font-family:'Inter',sans-serif; font-size:13px;
  font-weight:600; color:#c0392b; text-align:left;
  transition:background 0.12s;
  margin-top:2px;
}
.ud-logout:hover{ background:#fff5f5; }
.ud-logout svg{ flex-shrink:0; }

.ud-divider{ height:1px; background:#f0ebe4; margin:4px 0; }

/* ── Loading shimmer ── */
.ud-shimmer{
  display:inline-block; width:40px; height:13px;
  border-radius:4px; background:#f0ebe4;
  animation:udShimmer 1.2s ease-in-out infinite;
}
@keyframes udShimmer{
  0%,100%{ opacity:0.5; } 50%{ opacity:1; }
}

/* ── Overlay (close on outside click) ── */
.ud-overlay{
  position:fixed; inset:0; z-index:9998;
}
`;

function injectCSS() {
  const id = "ud-styles";
  if (!document.getElementById(id)) {
    const el = document.createElement("style");
    el.id = id; el.textContent = CSS;
    document.head.appendChild(el);
  }
}

/* ── Helpers ── */
function initials(name = "") {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function clamp(val, min, max) { return Math.min(max, Math.max(min, val)); }

/* ── Icons ── */
const IconGallery = () => (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
);
const IconCredit = () => (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="1" y="4" width="22" height="16" rx="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);
const IconLogout = () => (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IconSettings = () => (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
  </svg>
);

/* ════════════════════════════════════════════════════════════════════════════
   UserDropdown Component
   ════════════════════════════════════════════════════════════════════════════ */
export default function UserDropdown({ user, onLogout, generationCount }) {
  injectCSS();

  const [open, setOpen]               = useState(false);
  const [genCount, setGenCount]       = useState(generationCount ?? null);
  const [liveCredits, setLiveCredits] = useState(user?.credits ?? null);
  const [loading, setLoading]         = useState(false);
  const panelRef = useRef(null);

  /* Fetch fresh credits + gallery count whenever panel opens */
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);

    Promise.all([
      api.credits.get().catch(() => null),
      api.gallery.list({ page: 1, limit: 1 }).catch(() => null),
    ]).then(([creditsRes, galleryRes]) => {
      if (cancelled) return;
      if (creditsRes?.credits != null) setLiveCredits(creditsRes.credits);
      if (galleryRes?.pagination?.total != null) setGenCount(galleryRes.pagination.total);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [open]);

  const toggle = () => setOpen(o => !o);
  const close  = () => setOpen(false);

  const handleLogout = () => {
    close();
    localStorage.removeItem("imagegen_token");
    onLogout?.();
  };

  const credits    = liveCredits ?? user?.credits ?? 0;
  const maxCredits = 10; // default plan cap; adjust if you have plan info
  const barPct     = clamp((credits / Math.max(maxCredits, credits || 1)) * 100, 0, 100);
  const userInitials = initials(user?.name || user?.email || "U");

  return (
    <div className="ud-panel-wrap">
      {/* Avatar trigger */}
      <div className="ud-avatar" onClick={toggle} title="Your account" role="button" aria-label="Open user menu">
        {userInitials}
      </div>

      {/* Click-outside overlay */}
      {open && <div className="ud-overlay" onClick={close} />}

      {/* Dropdown panel */}
      {open && (
        <div className="ud-panel" ref={panelRef}>

          {/* ── Header ── */}
          <div className="ud-header">
            <div className="ud-user-row">
              <div className="ud-avatar-lg">{userInitials}</div>
              <div style={{ minWidth: 0 }}>
                <p className="ud-name">{user?.name || "User"}</p>
                <p className="ud-email">{user?.email || ""}</p>
              </div>
            </div>
          </div>

          {/* ── Stats: Credits + Images ── */}
          <div className="ud-stats">
            <div className="ud-stat">
              <span className={`ud-stat-val${credits > 0 ? " ud-stat-val--accent" : ""}`}>
                {loading ? <span className="ud-shimmer" /> : credits}
              </span>
              <span className="ud-stat-label">Credits</span>
            </div>
            <div className="ud-stat">
              <span className="ud-stat-val">
                {loading || genCount == null ? <span className="ud-shimmer" /> : genCount}
              </span>
              <span className="ud-stat-label">Images Made</span>
            </div>
          </div>

          {/* ── Credits bar ── */}
          <div className="ud-credits-section">
            <div className="ud-credits-row">
              <span className="ud-credits-label">Credit balance</span>
              <span className="ud-credits-val">
                {loading ? "…" : `${credits} left`}
              </span>
            </div>
            <div className="ud-bar-track">
              <div className="ud-bar-fill" style={{ width: `${barPct}%` }} />
            </div>
          </div>

          {/* ── Menu ── */}
          <div className="ud-menu">
            <button className="ud-menu-item" onClick={close}>
              <IconGallery /> My Gallery
            </button>
            <button className="ud-menu-item" onClick={close}>
              <IconCredit /> Buy Credits
            </button>
            <button className="ud-menu-item" onClick={close}>
              <IconSettings /> Settings
            </button>

            <div className="ud-divider" />

            <button className="ud-logout" onClick={handleLogout}>
              <IconLogout /> Log out
            </button>
          </div>

        </div>
      )}
    </div>
  );
}