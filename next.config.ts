import type { NextConfig } from "next";

/**
 * Served by its own Next.js process on the platform box (ops/, scripts/deploy.sh). Every page is
 * rendered at build time and re-rendered in the background at most every five minutes from the
 * store's catalogue (src/lib/catalogue.ts), or at once when the admin presses Publish website
 * (src/app/api/revalidate). Nothing here needs a database.
 */
const nextConfig: NextConfig = {
  // /hosting/ as the canonical form; the store and the old static build used the same URLs.
  trailingSlash: true,
  poweredByHeader: false,
  reactStrictMode: true,
  // No remote images and nothing to resize; the logo files are served as they are.
  images: { unoptimized: true },
  // Two root layouts (English at /, Arabic under /ar) share one 404: src/app/global-not-found.tsx.
  experimental: { globalNotFound: true },
};

export default nextConfig;
