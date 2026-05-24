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
import Gallery           from "./components/Gallery.jsx";
import Pricing           from "./components/Pricing.jsx";
import Docs              from "./components/Docs.jsx";

// Navbar
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

  /* Auth handlers */
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setShowLogin(false);
    navigate("mode-picker");
  };

  const handleLogout = () => {
    localStorage.removeItem("imagegen_token");
    setUser(null);
    navigate("landing");
  };

  /* Nav link handler — works for both authenticated and landing nav */
  const handleNavLink = (link) => {
    switch (link.toLowerCase()) {
      case "modes":   navigate("mode-picker"); break;
      case "gallery": navigate("gallery");     break;
      case "pricing": navigate("pricing");     break;
      case "docs":    navigate("docs");        break;
      default: break;
    }
  };

  /* Pages where back button shows */
  const isSubPage = !["landing", "mode-picker", "gallery", "pricing", "docs"].includes(page);

  const authenticated = !!user;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>

      {/* Navbar */}
      {authenticated ? (
        <DashboardNavbar
          user={user}
          onLogout={handleLogout}
          currentPage={page}
          onNavigate={navigate}
          onNavLink={handleNavLink}
          onBack={isSubPage ? () => navigate("mode-picker") : undefined}
        />
      ) : (
        <LandingNavbar
          onGetStarted={() => setShowLogin(true)}
          onNavLink={handleNavLink}
        />
      )}

      {/* Page content (animated) */}
      <div style={{
        flex: 1, overflow: "hidden",
        opacity: animOut ? 0 : 1,
        transform: animOut ? "translateY(6px)" : "none",
        transition: "opacity 0.2s, transform 0.2s",
      }}>
        {page === "landing"      && <Landing onGetStarted={() => setShowLogin(true)} />}

        {page === "mode-picker"  && (
          <ModePicker
            onTextToImage  ={() => navigate("text-to-image")}
            onImageToImage ={() => navigate("image-to-image")}
            onInpainting   ={() => navigate("inpainting")}
            onEnhancement  ={() => navigate("enhancement")}
          />
        )}

        {page === "text-to-image"  && <TextToImage      onBack={() => navigate("mode-picker")} user={user} />}
        {page === "image-to-image" && <ImageToImage     onBack={() => navigate("mode-picker")} user={user} />}
        {page === "inpainting"     && <Inpainting       onBack={() => navigate("mode-picker")} user={user} />}
        {page === "enhancement"    && <ImageEnhancement onBack={() => navigate("mode-picker")} user={user} />}

        {page === "gallery"  && <Gallery  user={user} onNavigate={navigate} />}
        {page === "pricing"  && <Pricing  onNavigate={navigate} />}
        {page === "docs"     && <Docs     onNavigate={navigate} />}
      </div>

      {/* Auth modal */}
      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
}