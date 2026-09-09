"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const THEME_KEY = "bengkelku-theme";

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === "light") {
    root.classList.add("light");
    localStorage.setItem(THEME_KEY, "light");
  } else {
    root.classList.remove("light");
    localStorage.setItem(THEME_KEY, "dark");
  }
}

export default function ThemeToggle() {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    setIsLight(document.documentElement.classList.contains("light"));
  }, []);

  const toggle = () => {
    const next = !isLight;
    setIsLight(next);
    applyTheme(next ? "light" : "dark");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isLight ? "Mode gelap" : "Mode terang"}
      className="fixed bottom-5 right-5 z-[100] flex h-12 w-12 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/90 text-zinc-300 shadow-lg shadow-black/40 backdrop-blur transition-all duration-300 hover:scale-105 hover:border-red-600 hover:text-red-500 hover:shadow-red-600/30"
    >
      {isLight ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </button>
  );
}
