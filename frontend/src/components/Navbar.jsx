import { useState } from "react";
import UserDropdown from "./UserDropdown.jsx";

const NAV_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.nav-root{
  display:grid;
  grid-template-columns: 1fr auto 1fr;
  align-items:center; height:60px; padding:0 28px;
  background:#eeecea; border-bottom:1px solid #e0dbd4;
  flex-shrink:0; position:relative; z-index:100;
  font-family:'Inter',sans-serif;
}
.nav-left  { display:flex; align-items:center; gap:10px; }
.nav-center{ display:flex; align-items:center; gap:32px; justify-content:center; }
.nav-right { display:flex; align-items:center; gap:14px; justify-content:flex-end; }

.nav-logo{
  display:flex; align-items:center; gap:8px;
  font-weight:700; font-size:15px; color:#1a120b;
  cursor:pointer; text-decoration:none;
}
.nav-logo-icon{
  width:32px; height:32px; border-radius:9px;
  background:linear-gradient(135deg,#d05a28,#e8824a);
  display:flex; align-items:center; justify-content:center;
  box-shadow:0 2px 8px rgba(208,90,40,0.3);
}

.nav-link{
  font-size:14px; font-weight:500; color:#5a5048;
  cursor:pointer; transition:color 0.15s;
  background:none; border:none; font-family:'Inter',sans-serif;
  padding:4px 2px; position:relative;
}
.nav-link:hover{ color:#1a120b; }
.nav-link--active{
  color:#d05a28; font-weight:600;
}
.nav-link--active::after{
  content:''; position:absolute; bottom:-4px; left:0; right:0;
  height:2px; background:#d05a28; border-radius:99px;
}

.nav-back-btn{
  display:flex; align-items:center; gap:6px; padding:6px 14px;
  border-radius:99px; border:1.5px solid #d6d0c8; background:#fff;
  color:#5a5048; font-size:13px; font-weight:600; cursor:pointer;
  font-family:'Inter',sans-serif; transition:all 0.15s;
  box-shadow:0 1px 3px rgba(0,0,0,0.07);
}
.nav-back-btn:hover{ background:#f5f3f0; color:#1a120b; }

.nav-cta-btn{
  padding:8px 22px; border-radius:99px; border:none;
  background:linear-gradient(135deg,#d05a28,#e8824a);
  color:#fff; font-size:13.5px; font-weight:600; cursor:pointer;
  font-family:'Inter',sans-serif; transition:opacity 0.15s;
  box-shadow:0 3px 12px rgba(208,90,40,0.35);
}
.nav-cta-btn:hover{ opacity:0.88; }

.nav-theme-icon{
  cursor:pointer; color:#5a5048;
  display:flex; align-items:center; transition:color 0.15s;
}
.nav-theme-icon:hover{ color:#1a120b; }

/* ── Tablet: tighten spacing ── */
@media (max-width: 1023px) {
  .nav-root {
    padding: 0 20px;
    height: 56px;
  }
  .nav-center { gap: 20px; }
  .nav-link   { font-size: 13px; }
  .nav-right  { gap: 10px; }
  .nav-logo   { font-size: 14px; }
  .nav-logo-icon { width: 28px; height: 28px; }
}

/* ── Mobile: hide center links (tab bar takes over) ── */
@media (max-width: 767px) {
  .nav-root {
    grid-template-columns: 1fr 1fr;
    padding: 0 16px;
    height: 52px;
  }
  .nav-center {
    display: none;
  }
  .nav-right {
    gap: 8px;
  }
  .nav-cta-btn {
    padding: 7px 16px;
    font-size: 12.5px;
  }
  .nav-back-btn {
    padding: 5px 10px;
    font-size: 12px;
  }
  .nav-logo {
    font-size: 14px;
  }
  .nav-logo-icon {
    width: 28px;
    height: 28px;
    border-radius: 8px;
  }
}
`;

function injectNavCSS() {
  const id = "nav-styles";
  if (!document.getElementById(id)) {
    const el = document.createElement("style");
    el.id = id; el.textContent = NAV_CSS;
    document.head.appendChild(el);
  }
}

const LogoIcon = () => (
  <svg width={17} height={17} viewBox="0 0 24 24" fill="white">
    <path d="M12 2L13.09 8.26L19 6L14.74 10.26L21 12L14.74 13.74L19 18L13.09 15.74L12 22L10.91 15.74L5 18L9.26 13.74L3 12L9.26 10.26L5 6L10.91 8.26L12 2Z"/>
  </svg>
);
const BackIcon = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
    <path d="M19 12H5M12 5l-7 7 7 7"/>
  </svg>
);
const SunIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

const NAV_LINKS = ["Modes", "Gallery", "Pricing", "Docs"];

/* page name → nav link label mapping */
const PAGE_TO_LINK = {
  "mode-picker":   "Modes",
  "gallery":       "Gallery",
  "pricing":       "Pricing",
  "docs":          "Docs",
  "text-to-image": "Modes",
  "image-to-image":"Modes",
  "inpainting":    "Modes",
  "enhancement":   "Modes",
};

/* ════════════════════════════════════════════════════
   LandingNavbar
   ════════════════════════════════════════════════════ */
export function LandingNavbar({ onGetStarted, onNavLink }) {
  injectNavCSS();
  return (
    <nav className="nav-root">
      <div className="nav-left">
        <div className="nav-logo">
          <div className="nav-logo-icon"><LogoIcon /></div>
          ImageGen
        </div>
      </div>

      <div className="nav-center">
        {NAV_LINKS.map(l => (
          <button
            key={l}
            className="nav-link"
            onClick={() => onNavLink?.(l)}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="nav-right">
        <span className="nav-theme-icon"><SunIcon /></span>
        <button className="nav-cta-btn" onClick={onGetStarted}>Get Started</button>
      </div>
    </nav>
  );
}

/* ════════════════════════════════════════════════════
   DashboardNavbar
   ════════════════════════════════════════════════════ */
export function DashboardNavbar({ user, onLogout, currentPage, onNavigate, onNavLink, onBack }) {
  injectNavCSS();

  const isSubPage  = currentPage && !["mode-picker","gallery","pricing","docs"].includes(currentPage);
  const activeLink = PAGE_TO_LINK[currentPage] || "";

  return (
    <nav className="nav-root">
      <div className="nav-left">
        {isSubPage && onBack && (
          <button className="nav-back-btn" onClick={onBack}>
            <BackIcon /> Back
          </button>
        )}
        <div className="nav-logo" onClick={() => onNavigate?.("mode-picker")}>
          <div className="nav-logo-icon"><LogoIcon /></div>
          ImageGen
        </div>
      </div>

      <div className="nav-center">
        {NAV_LINKS.map(l => (
          <button
            key={l}
            className={`nav-link${activeLink === l ? " nav-link--active" : ""}`}
            onClick={() => onNavLink?.(l)}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="nav-right">
        <span className="nav-theme-icon"><SunIcon /></span>
        <UserDropdown user={user} onLogout={onLogout} />
      </div>
    </nav>
  );
}

export default DashboardNavbar;