"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icons";

export const THEME_KEY = "its4u-theme";

/** Runs before the page paints, so there is no flash: dark unless the visitor chose light before. */
export const THEME_SCRIPT = `try{var t=localStorage.getItem("${THEME_KEY}");var r=document.getElementById("store-root");if(r&&(t==="light"||t==="dark"))r.setAttribute("data-theme",t)}catch(e){}`;

function root(): HTMLElement | null {
  return typeof document === "undefined" ? null : document.getElementById("store-root");
}

/** Sun / moon button. The choice is remembered on this device. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    setTheme(root()?.getAttribute("data-theme") === "light" ? "light" : "dark");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    root()?.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* private mode: the choice just lasts until the page closes */
    }
    setTheme(next);
  }

  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      aria-label={dark ? "Dark theme is on. Switch to light theme" : "Light theme is on. Switch to dark theme"}
      className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line bg-white text-ink-900 transition hover:border-brand-300 hover:bg-brand-50"
      data-testid="theme-toggle"
    >
      <Icon name={dark ? "sun" : "moon"} className="h-5 w-5" />
    </button>
  );
}
