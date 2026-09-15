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
/** International format without "+", e.g. 201000000000. Empty falls back to the store's company phone (screens/shared.ts whatsappNumber). */
export const WHATSAPP_NUMBER = (process.env.WHATSAPP_NUMBER ?? "").replace(/[^0-9]/g, "");
/** "1" renders the assistant widget even when the store reports it off, so the design can be reviewed before the key exists. */
export const ASSISTANT_PREVIEW = (process.env.ASSISTANT_PREVIEW ?? "").trim() === "1";
/**
 * The public status page (owner, 2026-09-15, S14). Empty for now: the page is being designed
 * separately, and until it exists the footer, the Menu sheet and the contact page draw no Status
 * link at all rather than one that goes nowhere. Read from the environment so the day it is live
 * needs a restart, not a code change.
 */
// Trailing slashes trimmed: the status page appends "/" and "/ar/" to it (src/lib/status.ts statusHref).
export const STATUS_URL = (process.env.STATUS_URL ?? "").trim().replace(/\/+$/, "");
/**
 * The platform's status feed (platform repo, docs/design/status-page.md section 6.2). Over loopback on
 * the box, like CATALOGUE_URL; defaults to the store's public address. Read per request by the status
 * page (src/lib/status.ts), never at build time, so a restart is enough to change it.
 */
export const STATUS_FEED_URL = (process.env.STATUS_FEED_URL ?? "").trim() || `${STORE_URL}/api/public/status`;
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
  // The 2026-09-15 plain-look pass rewrote the home page, gave hosting its guide and moving line, websites its steps, care, websites and domains new intros, and About one principle.
  home: "2026-09-15",
  hosting: "2026-09-15",
  websites: "2026-09-15",
  care: "2026-09-15",
  domains: "2026-09-15",
  about: "2026-09-15",
  contact: "2026-09-15",
  terms: "2026-09-14",
  privacy: "2026-09-14",
  delivery: "2026-09-14",
  refunds: "2026-09-14",
} as const satisfies Record<import("./i18n").PageKey, string>;

/** Year printed in the footer, as of the last render (pages re-render at least every five minutes). */
export function currentYear(): number {
  return new Date().getUTCFullYear();
}
