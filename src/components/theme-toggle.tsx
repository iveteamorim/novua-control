"use client";

import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("novua-theme", theme);
  window.dispatchEvent(new Event("novua-theme-change"));
}

export function ThemeToggle() {
  const activeTheme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );

  function updateTheme(nextTheme: Theme) {
    applyTheme(nextTheme);
  }

  return (
    <div className="fixed right-4 top-4 z-[90] sm:right-6 sm:top-6">
      <div className="inline-flex items-center gap-1 rounded-full border border-black/8 bg-white/90 p-1 shadow-[0_12px_36px_rgba(17,24,39,0.08)] backdrop-blur-sm">
        <button
          type="button"
          onClick={() => updateTheme("light")}
          aria-pressed={activeTheme === "light"}
          className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium uppercase tracking-[0.2em] transition ${
            activeTheme === "light"
              ? "bg-black text-white"
              : "text-[#6f645b] hover:bg-[#f7f7f4]"
          }`}
        >
          <SunIcon />
          Light
        </button>
        <button
          type="button"
          onClick={() => updateTheme("dark")}
          aria-pressed={activeTheme === "dark"}
          className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium uppercase tracking-[0.2em] transition ${
            activeTheme === "dark"
              ? "bg-black text-white"
              : "text-[#6f645b] hover:bg-[#f7f7f4]"
          }`}
        >
          <MoonIcon />
          Dark
        </button>
      </div>
    </div>
  );
}

function subscribeToTheme(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("novua-theme-change", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("novua-theme-change", onStoreChange);
  };
}

function getThemeSnapshot(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function getServerThemeSnapshot(): Theme {
  return "light";
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M7 1.4V3M7 11V12.6M12.6 7H11M3 7H1.4M10.96 3.04L9.83 4.17M4.17 9.83L3.04 10.96M10.96 10.96L9.83 9.83M4.17 4.17L3.04 3.04"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M9.82 1.89C8.99 1.61 8.08 1.58 7.17 1.85C4.49 2.64 2.96 5.47 3.75 8.15C4.54 10.83 7.37 12.36 10.05 11.57C10.96 11.3 11.73 10.79 12.29 10.1C11.54 10.26 10.74 10.24 9.95 10.01C7.27 9.22 5.74 6.39 6.53 3.71C6.76 2.92 7.15 2.23 7.67 1.66C8.39 1.6 9.13 1.68 9.82 1.89Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
