"use client";
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";
type Ctx = { theme: Theme; setTheme: (t: Theme) => void; resolved: "light" | "dark" };

const ThemeCtx = createContext<Ctx>({ theme: "system", setTheme: () => {}, resolved: "light" });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem("ampera-theme")) as Theme | null;
    if (stored) setThemeState(stored);
  }, []);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const wantDark = theme === "dark" || (theme === "system" && mql.matches);
      document.documentElement.classList.toggle("dark", wantDark);
      setResolved(wantDark ? "dark" : "light");
    };
    apply();
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, [theme]);

  function setTheme(t: Theme) {
    setThemeState(t);
    try { localStorage.setItem("ampera-theme", t); } catch {}
    fetch("/api/users/preferences", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ theme: t }) }).catch(() => {});
  }

  return <ThemeCtx.Provider value={{ theme, setTheme, resolved }}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);
