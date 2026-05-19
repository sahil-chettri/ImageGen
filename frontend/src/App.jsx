/**
 * App.jsx  — integration snippet
 *
 * Shows the three lines you need to add/change to wire up
 * UserDropdown logout → landing page redirect.
 *
 * ─────────────────────────────────────────────────────────────────
 * WHAT TO CHANGE IN YOUR EXISTING App.jsx:
 * ─────────────────────────────────────────────────────────────────
 *
 * 1. Import DashboardNavbar (or keep using your existing Navbar,
 *    just replace the avatar circle with <UserDropdown>).
 *
 * 2. Add a handleLogout function.
 *
 * 3. Pass it down to DashboardNavbar (or wherever UserDropdown lives).
 * ─────────────────────────────────────────────────────────────────
 */

import { useState, useEffect } from "react";
import api from "./services/api.js";

// Pages
import Landing           from "./components/Landing.jsx";
import LoginModal        from "./components/LoginModal.jsx";
import ModePicker        from "./components/ModePicker.jsx";
import TextToImage       from "./components/TextToImage.jsx";
import ImageToImage      from "./components/ImageToImage.jsx";
import Inpainting        from "./components/Inpainting.jsx";
import ImageEnhancement  from "./components/ImageEnhancement.jsx";

// Updated Navbar with UserDropdown baked in
import { LandingNavbar, DashboardNavbar } from "./components/Navbar.jsx";

export default function App() {
  const [page,      setPage]      = useState("landing");
  const [user,      setUser]      = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [animOut,   setAnimOut]   = useState(false);

  /* Restore session on mount */
  useEffect(() => {
    const token = localStorage.getItem("imagegen_token");
    if (!token) return;
    api.auth.getMe()
      .then(res => { setUser(res.user); navigate("mode-picker"); })
      .catch(() => localStorage.removeItem("imagegen_token"));
  }, []);

  /* Animated page transition */
  const navigate = (target) => {
    setAnimOut(true);
    setTimeout(() => { setPage(target); setAnimOut(false); }, 220);
  };

  /* ── Auth handlers ── */
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setShowLogin(false);
    navigate("mode-picker");
  };

  /**
   * handleLogout — called by UserDropdown's "Log out" button.
   * 1. Removes the JWT from localStorage.
   * 2. Clears user state.
   * 3. Navigates back to the landing page.
   */
  const handleLogout = () => {
    localStorage.removeItem("imagegen_token");
    setUser(null);
    navigate("landing");
  };

  /* ── Render ── */
  const authenticated = !!user;
  const isSubPage     = !["landing", "mode-picker"].includes(page);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>

      {/* ── Navbar ── */}
      {authenticated ? (
        <DashboardNavbar
          user={user}
          onLogout={handleLogout}        /* ← wired here */
          currentPage={page}
          onNavigate={navigate}
          onBack={isSubPage ? () => navigate("mode-picker") : undefined}
        />
      ) : (
        <LandingNavbar onGetStarted={() => setShowLogin(true)} />
      )}

      {/* ── Page content (animated) ── */}
      <div style={{
        flex: 1, overflow: "hidden",
        opacity: animOut ? 0 : 1,
        transform: animOut ? "translateY(6px)" : "none",
        transition: "opacity 0.2s, transform 0.2s",
      }}>
        {page === "landing"      && <Landing      onGetStarted={() => setShowLogin(true)} />}
        {page === "mode-picker"  && <ModePicker   onTextToImage={() => navigate("text-to-image")}
                                                  onImageToImage={() => navigate("image-to-image")}
                                                  onInpainting={() => navigate("inpainting")}
                                                  onEnhancement={() => navigate("enhancement")} />}
        {page === "text-to-image"  && <TextToImage      onBack={() => navigate("mode-picker")} user={user} />}
        {page === "image-to-image" && <ImageToImage     onBack={() => navigate("mode-picker")} user={user} />}
        {page === "inpainting"     && <Inpainting       onBack={() => navigate("mode-picker")} user={user} />}
        {page === "enhancement"    && <ImageEnhancement onBack={() => navigate("mode-picker")} user={user} />}
      </div>

      {/* ── Auth modal ── */}
      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
}