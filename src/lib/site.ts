/**
 * Process configuration, read from the environment when the server starts (ops/env.example). The
 * same values are read during `next build`, which pre-renders every page once.
 */
/** Trailing slashes trimmed; a path segment is kept, because the store lives under one. */
function base(value: string | undefined, fallback: string): string {
  const v = (value ?? "").trim().replace(/\/+$/, "");
  return v || fallback;
}

export const SITE_URL = base(process.env.SITE_URL, "https://3enwank.com");
export const STORE_URL = base(process.env.STORE_URL, "https://3enwank.com/account");
export const CATALOGUE_URL = (process.env.CATALOGUE_URL ?? "").trim() || `${STORE_URL}/api/public/catalogue`;
/** "fallback" skips the network; anything else (default "remote") tries CATALOGUE_URL first. */
export const CATALOGUE_SOURCE = (process.env.CATALOGUE_SOURCE ?? "remote").trim();
/** Optional "user:password" for a staging endpoint behind basic auth. */
export const CATALOGUE_AUTH = (process.env.CATALOGUE_AUTH ?? "").trim();
/** International format without "+", e.g. 201000000000. Empty hides WhatsApp everywhere. */
export const WHATSAPP_NUMBER = (process.env.WHATSAPP_NUMBER ?? "").replace(/[^0-9]/g, "");
/** "1" renders the assistant widget even when the store reports it off, so the design can be reviewed before the key exists. */
export const ASSISTANT_PREVIEW = (process.env.ASSISTANT_PREVIEW ?? "").trim() === "1";
/** Secret the platform's Publish button sends to /api/revalidate; empty disables the endpoint. */
export const SITE_REVALIDATE_SECRET = (process.env.SITE_REVALIDATE_SECRET ?? "").trim();

/**
 * When each page's own content last changed, for the sitemap's <lastmod>.
 *
 * The sitemap used to stamp every URL with the time of the build, so all twenty claimed to have
 * changed on every deploy and a crawler learned to ignore the field. A date written here only moves
 * when someone edits that page's copy: bump the entry in the same change. Prices are not counted,
 * because they move with the catalogue and every page carries one. Every page was reviewed on
 * 2026-09-14, so that is where they all start.
 */
export const LAST_CHANGED = {
  home: "2026-09-14",
  hosting: "2026-09-14",
  websites: "2026-09-14",
  care: "2026-09-14",
  domains: "2026-09-14",
  about: "2026-09-14",
  terms: "2026-09-14",
  privacy: "2026-09-14",
  delivery: "2026-09-14",
  refunds: "2026-09-14",
} as const satisfies Record<import("./i18n").PageKey, string>;

/** Year printed in the footer, as of the last render (pages re-render at least every five minutes). */
export function currentYear(): number {
  return new Date().getUTCFullYear();
}
