import { useState, useEffect } from "react";
import Landing         from "./components/Landing";
import LoginModal      from "./components/LoginModal";
import ModePicker      from "./components/ModePicker";
import TextToImage     from "./components/TextToImage";
import ImageToImage    from "./components/ImageToImage";
import Inpainting      from "./components/Inpainting";
import ImageEnhancement from "./components/ImageEnhancement";
import api, { tokenStorage } from "./services/api.js";

export default function App() {
  const [page, setPage]       = useState("landing");
  const [animOut, setAnimOut] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser]       = useState(null);

  // On load — if a token exists, fetch user and skip landing
  useEffect(() => {
    if (tokenStorage.get()) {
      api.auth.getMe()
        .then(({ user }) => {
          setUser(user);
          setPage("mode-picker");
        })
        .catch(() => {
          tokenStorage.remove();
        });
    }
  }, []);

  const go = (to) => {
    setAnimOut(true);
    setTimeout(() => {
      setPage(to);
      setAnimOut(false);
    }, 320);
  };

  const handleAuthRequired = () => setShowLogin(true);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setShowLogin(false);
    go("mode-picker");
  };

  const handleLogout = () => {
    api.auth.logout();
    setUser(null);
    go("landing");
  };

  return (
    <div className={animOut ? "page-out" : "page-in"}>

      {/* Auth Modal */}
      {showLogin && (
        <LoginModal
          onSuccess={handleLoginSuccess}
          onClose={() => setShowLogin(false)}
        />
      )}

      {page === "landing" && (
        <Landing onEnter={handleAuthRequired} />
      )}

      {page === "mode-picker" && (
        <ModePicker
          user={user}
          onLogout={handleLogout}
          onTextToImage={() => go("text-to-image")}
          onImageToImage={() => go("image-to-image")}
          onInpainting={() => go("inpainting")}
          onEnhancement={() => go("enhancement")}
          onBack={() => go("landing")}
        />
      )}

      {page === "text-to-image" && (
        <TextToImage onBack={() => go("mode-picker")} />
      )}

      {page === "image-to-image" && (
        <ImageToImage onBack={() => go("mode-picker")} />
      )}

      {page === "inpainting" && (
        <Inpainting onBack={() => go("mode-picker")} />
      )}

      {page === "enhancement" && (
        <ImageEnhancement onBack={() => go("mode-picker")} />
      )}
    </div>
  );
}