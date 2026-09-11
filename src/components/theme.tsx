"use client";

import { useSyncExternalStore } from "react";
import { THEME_KEY, type Theme } from "@/lib/theme";

/**
 * Dark is the default. The choice is kept in localStorage and applied by the inline script in
 * <head> (see root.tsx) before the first paint, so there is no flash on the next page.
 */
export { THEME_KEY };

const listeners = new Set<() => void>();
/** The choice made on this page, so the switch reflects it even when storage is blocked. */
let current: Theme | null = null;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
function getSnapshot(): Theme {
  if (current) return current;
  try {
    return window.localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}
function getServerSnapshot(): Theme {
  return "dark";
}
function apply(theme: Theme) {
  current = theme;
  const root = document.documentElement;
  root.classList.add("theme-switching");
  root.setAttribute("data-theme", theme);
  window.setTimeout(() => root.classList.remove("theme-switching"), 450);
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Storage blocked: the choice lasts for this page.
  }
  for (const l of listeners) l();
}

export function ThemeSwitch({ label, dark, light }: { label: string; dark: string; light: string }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // Set once this island is running on the client, so the recorder can tell a hydrated page from
  // one that only looks like it. Nothing else writes this attribute.
  if (typeof document !== "undefined") document.documentElement.setAttribute("data-hydrated", "1");
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex rounded-full border border-line bg-panel p-0.5 text-xs font-bold"
    >
      {(["dark", "light"] as const).map((t) => (
        <button
          key={t}
          type="button"
          aria-pressed={theme === t}
          onClick={() => apply(t)}
          className={`inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 transition ${theme === t ? "bg-brand-soft text-brand-strong" : "text-muted hover:text-ink"}`}
        >
          {t === "dark" ? (
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
            </svg>
          ) : (
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          )}
          {t === "dark" ? dark : light}
        </button>
      ))}
    </div>
  );
}
