import { useState, useEffect } from "react";
import Landing from "./components/Landing";
import Dashboard from "./components/Dashboard";
import api, { tokenStorage } from "./services/api";

export default function App() {
  const [page, setPage] = useState("landing");

  const handleEnter = async () => {
    try {
      await api.auth.login("demo@imagegen.ai", "demo1234");
      setPage("dashboard");
    } catch (err) {
      console.error("Login failed:", err);
      setPage("dashboard");
    }
  };

  return page === "landing"
    ? <Landing onEnter={handleEnter} />
    : <Dashboard onBack={() => setPage("landing")} />;
}
