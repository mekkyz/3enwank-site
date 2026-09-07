import type { NextConfig } from "next";

/**
 * Fully static: `next build` writes the whole site to ./out (HTML, CSS, JS, fonts) and nothing runs
 * at request time. Cloudflare Pages serves the folder; any static host would do.
 */
const nextConfig: NextConfig = {
  output: "export",
  // /hosting/ -> out/hosting/index.html, which every static host resolves without rewrite rules.
  trailingSlash: true,
  poweredByHeader: false,
  reactStrictMode: true,
  images: { unoptimized: true },
  // Two root layouts (English at /, Arabic under /ar) share one 404: src/app/global-not-found.tsx.
  experimental: { globalNotFound: true },
};

export default nextConfig;
