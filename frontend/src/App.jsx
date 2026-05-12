import { useState, useEffect, useRef } from "react";
import Landing from "./components/Landing";
import LoginModal from "./components/LoginModal";
import ModePicker from "./components/ModePicker";
import TextToImage from "./components/TextToImage";
import ImageToImage from "./components/ImageToImage";
import Inpainting from "./components/Inpainting";
import ImageEnhancement from "./components/ImageEnhancement";
import api, { tokenStorage } from "./services/api.js";

// ── Snowfall Canvas (zero dependencies) ───────────────────────────────────
function SnowCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const flakes = Array.from({ length: 120 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 3 + 1,
      speed: Math.random() * 1 + 0.4,
      wind: Math.random() * 0.6 - 0.3,
      opacity: Math.random() * 0.6 + 0.3,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      flakes.forEach((f) => {
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${f.opacity})`;
        ctx.fill();

        f.y += f.speed;
        f.x += f.wind;

        if (f.y > canvas.height) { f.y = -f.r; f.x = Math.random() * canvas.width; }
        if (f.x > canvas.width) f.x = 0;
        if (f.x < 0) f.x = canvas.width;
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}

// ── App ───────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("landing");
  const [animOut, setAnimOut] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (tokenStorage.get()) {
      api.auth
        .getMe()
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
      {/* Snow — pure canvas, no npm package needed */}
      <SnowCanvas />

      {showLogin && (
        <LoginModal
          onSuccess={handleLoginSuccess}
          onClose={() => setShowLogin(false)}
        />
      )}

      {page === "landing" && <Landing onEnter={handleAuthRequired} />}

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