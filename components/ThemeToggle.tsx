"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  const stored = window.localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    // Lido do DOM/localStorage no mount — não é derivável de props/estado,
    // por isso o setState aqui (e não num cálculo durante o render).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(getInitialTheme());
  }, []);

  useEffect(() => {
    if (!theme) return;
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  if (!theme) {
    return <div className="h-8 w-[84px] rounded-full border border-border bg-surface-2" />;
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
      className="flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs font-semibold text-ink-2 hover:text-ink"
    >
      <span aria-hidden>{isDark ? "🌙" : "☀️"}</span>
      {isDark ? "Escuro" : "Claro"}
    </button>
  );
}
