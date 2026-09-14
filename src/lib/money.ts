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

/** A price as the catalogue carries it: minor units plus the store's own rendering of them. */
export type Money = { gross: number; formatted: string };
