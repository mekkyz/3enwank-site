"use client";

import { useSyncExternalStore } from "react";
import { MoonIcon, SunIcon } from "@phosphor-icons/react/dist/ssr";
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

/**
 * Two buttons in a labelled group, each one an icon plus its own text label ("Dark" / "Light"), so
 * the accessible name comes from that text and `aria-pressed` says which one is on. The sun and moon
 * are therefore decorative and stay `aria-hidden`: naming them too would make a screen reader read
 * each button twice.
 *
 * They were hand-drawn inline SVG on a 24 grid and are Phosphor now, still 14px rendered (the old
 * `h-3.5 w-3.5`) so the pill keeps its height. The import is `@phosphor-icons/react/dist/ssr` and
 * that entry specifically: the package root entry renders through IconBase, which calls `useContext`
 * without a "use client" of its own and throws in a server component, while /dist/ssr renders
 * through SSRBase with no hooks and works on both sides. Weight is bold, matching the 2.2 stroke the
 * rest of the chrome was drawn at — at 14px "regular" disappears next to bold text. Neither takes
 * `mirrored`. The sun is symmetric anyway; the crescent is not, but it is an object, not a direction,
 * and it opens the same way in both scripts here as it did when it was hand-drawn.
 */
export function ThemeSwitch({ label, dark, light }: { label: string; dark: string; light: string }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
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
            <MoonIcon aria-hidden="true" size={14} weight="bold" className="shrink-0" />
          ) : (
            <SunIcon aria-hidden="true" size={14} weight="bold" className="shrink-0" />
          )}
          {t === "dark" ? dark : light}
        </button>
      ))}
    </div>
  );
}
