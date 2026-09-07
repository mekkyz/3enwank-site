/**
 * Process configuration, read from the environment when the server starts (ops/env.example). The
 * same values are read during `next build`, which pre-renders every page once.
 */
function origin(value: string | undefined, fallback: string): string {
  const v = (value ?? "").trim().replace(/\/+$/, "");
  return v || fallback;
}

export const SITE_URL = origin(process.env.SITE_URL, "https://3enwank.com");
export const STORE_URL = origin(process.env.STORE_URL, "https://my.3enwank.com");
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

/** Year printed in the footer, as of the last render (pages re-render at least every five minutes). */
export function currentYear(): number {
  return new Date().getUTCFullYear();
}
