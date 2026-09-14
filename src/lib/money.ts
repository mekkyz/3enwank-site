/**
 * The two currencies the site prices in, and the shape of one price.
 *
 * On their own here, with no zod, because the currency switch and the domain search are client
 * islands and they need the list at runtime. When they took it from catalogue.ts they pulled zod and
 * the whole catalogue schema into the browser bundle with it: a 400 KB chunk on every page of a site
 * that validates nothing in the browser. catalogue.ts re-exports these, so the old import paths
 * still work for the server side.
 */
export const currencies = ["EGP", "USD"] as const;
export type Currency = (typeof currencies)[number];

/**
 * Where the visitor's choice is kept, and what a visitor who never chose sees. Here rather than in
 * the "use client" currency island for the same reason THEME_KEY lives in lib/theme.ts: the
 * before-paint script in root.tsx is built by the server, and a constant imported from a client
 * module does not survive that boundary.
 */
export const CURRENCY_KEY = "3enwank.currency";
export const DEFAULT_CURRENCY: Currency = "EGP";

/** A price as the catalogue carries it: minor units plus the store's own rendering of them. */
export type Money = { gross: number; formatted: string };
