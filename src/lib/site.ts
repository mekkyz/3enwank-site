/**
 * Build-time configuration. Everything is read once from the environment while `next build` runs;
 * nothing here exists at request time because the output is static.
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
/** Year printed in the footer; fixed at build time like everything else. */
export const BUILD_YEAR = new Date().getUTCFullYear();
