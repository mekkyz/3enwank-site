/**
 * The one place the theme key is written. It lives in a plain module, not in the "use client"
 * component that uses it: a value imported from a client module into a server component does not
 * survive the boundary, and the before-paint script in root.tsx is built by the server. Importing it
 * from there produced localStorage.getItem(undefined), so every visitor was served dark and nobody's
 * Light choice ever survived a reload.
 */
export const THEME_KEY = "3enwank.theme";

export type Theme = "dark" | "light";
