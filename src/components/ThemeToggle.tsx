"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const lockRef = useRef(0);
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  function toggle() {
    // iOS Safari can emit both pointer and click in rapid succession; swallow
    // any second fire inside 400ms.
    const now = Date.now();
    if (now - lockRef.current < 400) return;
    lockRef.current = now;

    const root = document.documentElement;
    root.classList.add("theme-switching");
    setTheme(isDark ? "light" : "dark");
    window.setTimeout(() => {
      root.classList.remove("theme-switching");
    }, 300);
  }

  return (
    <button
      type="button"
      suppressHydrationWarning
      aria-label={
        !mounted
          ? "Toggle theme"
          : isDark
            ? "Switch to light mode"
            : "Switch to dark mode"
      }
      onClick={toggle}
      className="grid h-9 w-9 place-items-center rounded-full border border-surface-border bg-surface-raised/80 text-surface-text transition hover:bg-surface-sunken dark:border-night-border dark:bg-night-raised/80 dark:text-night-text dark:hover:bg-night-sunken"
    >
      {mounted ? (
        isDark ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )
      ) : (
        <span className="h-4 w-4" />
      )}
    </button>
  );
}
