# 3enwank.com

The marketing site for 3enwank: hosting plans, website packages, care plans, domain prices, contact
and legal pages, in English (`/`) and Arabic (`/ar/`). It is a **fully static** Next.js 16 export:
`pnpm build` writes plain HTML, CSS, JS and fonts to `out/`, and nothing runs at request time. It
lives on Cloudflare Pages, deliberately off the billing box (platform repo: `docs/DECISIONS.md`,
"The public website stays off the billing box"; design: `docs/design/website.md`).

Plans and prices are not typed into this repo. At build time the site reads the platform's public
catalogue endpoint (`GET https://my.3enwank.com/api/public/catalogue`) and every "Order" button
deep-links to the store on `my.3enwank.com`. A price change on the platform reaches the site by
pressing **Publish website** in the platform admin, which triggers a Pages build.

## Local development

Requirements: Node 22 and pnpm 12 (`corepack enable` picks the version from `package.json`).

```bash
pnpm install
cp .env.example .env            # optional; the defaults point at production
pnpm dev                        # http://localhost:3000, Arabic at /ar/
pnpm test                       # vitest: catalogue loading, formatting, paths
pnpm lint && pnpm typecheck
pnpm build && pnpm preview      # static export in ./out served on http://127.0.0.1:8788
```

`pnpm dev` and `pnpm build` both fetch the catalogue. Without network, or to build exactly what is
checked in, set `CATALOGUE_SOURCE=fallback`.

## Configuration (environment, build time only)

| Variable | Default | Meaning |
|---|---|---|
| `CATALOGUE_URL` | `https://my.3enwank.com/api/public/catalogue` | Where the catalogue is fetched from |
| `CATALOGUE_SOURCE` | `remote` | `fallback` skips the network and uses `catalogue.fallback.json` |
| `CATALOGUE_AUTH` | empty | `user:password` sent as basic auth (staging behind nginx auth) |
| `STORE_URL` | `https://my.3enwank.com` | Store origin for Log in links when the catalogue has none |
| `SITE_URL` | `https://3enwank.com` | Canonical origin for sitemap, hreflang, OpenGraph |
| `WHATSAPP_NUMBER` | empty | International format without `+`; empty hides the WhatsApp card |

## The catalogue and the fallback

`src/lib/catalogue.ts` fetches the endpoint with a unique `?build=<timestamp>` (nginx caches
`/api/public/` for five minutes keyed on the request URI, so this makes every build reach the
application and see prices as they are now) and validates its JSON against the contract (zod). When the fetch fails,
times out (15 s), answers a non-200 or does not validate, the build prints
`[catalogue] using catalogue.fallback.json: <reason>` and continues with the checked-in copy, so a
platform outage never blocks a copy change. Refresh the fallback from the platform checkout whenever
prices change:

```bash
cd /home/mekkyz/3enwank-platform
set -a; . ~/.config/enwank/dev.env; set +a
APP_URL=https://my.3enwank.com pnpm exec tsx scripts/export-catalogue.ts > /home/mekkyz/3enwank-site/catalogue.fallback.json
cd /home/mekkyz/3enwank-site && pnpm test && git commit -am "catalogue: refresh fallback"
```

What the site takes from the catalogue: product names, summaries and feature lines (EN/AR), prices
per currency (VAT-inclusive gross, minor units), the XXL add-on domain option, enabled TLDs with
register/renew/transfer prices, the company name, address, support email and phone, store links,
and whether domain sales are open (when they are not, the domains page shows a contact card instead
of the search form and price table). Feature lines whose Arabic text still equals the English one
(the WHMCS import seeded both with English) are translated by a small label map in
`src/messages/ar.ts` until the catalogue is translated in the platform admin.

The EGP/USD switch is client-side only: the HTML carries EGP, the visitor's choice is kept in
`localStorage`, no request is made.

## Layout

```
src/app/(en)/…            English routes at the root, one thin page.tsx per screen
src/app/[locale]/…        prefixed locales (generateStaticParams → ar), same screens
src/app/global-not-found  out/404.html, bilingual
src/app/sitemap.ts        sitemap.xml with hreflang alternates; robots.ts
src/screens/*             one module per page: metadata(locale) + render(locale)
src/components/*          shell (header, nav, footer), plan cards, tables, currency switch
src/messages/{en,ar}.ts   all copy, one typed shape (types.ts)
src/lib/catalogue.ts      fetch + validate + fallback;  format.ts prices and feature lines;  i18n.ts paths
catalogue.fallback.json   full export of the endpoint (scripts/export-catalogue.ts), used when it is unreachable
public/_headers           Cloudflare Pages security and cache headers;  public/og.png share image
```

Design: Tailwind 4 with the platform's colour tokens (`src/app/globals.css`), Inter and Noto Naskh
Arabic bundled from `@fontsource-variable` (no font CDN), inline SVG logo, no UI kit, no analytics,
no third-party requests. Arabic pages render with `dir="rtl"` and logical CSS properties.

## Cloudflare Pages

Create a Pages project connected to this repository (any git host Cloudflare supports; the site
has no `.github` workflow on purpose).

| Setting | Value |
|---|---|
| Production branch | `main` |
| Build command | `pnpm build` |
| Build output directory | `out` |
| Root directory | `/` |
| Environment variables | `NODE_VERSION=22`, `PNPM_VERSION=12.3.4`, `CATALOGUE_URL`, `STORE_URL`, `SITE_URL`, optionally `WHATSAPP_NUMBER` |

Every push to `main` builds and deploys. Preview deployments for other branches are fine: they build
from the same catalogue endpoint.

### Deploy hook (publish from the platform admin)

Pages project → Settings → Builds & deployments → **Deploy hooks** → add one for `main`. Paste the
hook URL into the platform at **Admin → Website** (it is stored masked). "Publish website" POSTs to
the hook with a 10 s timeout, records the outcome in the audit log, and Pages rebuilds from the
current catalogue, usually live within a minute or two. Anyone holding the hook URL can trigger
builds, so treat it like a password; rotate it in Cloudflare if it leaks.

### DNS (HANDOFF H11)

`3enwank.com` is currently served from srv1 (PowerDNS, one static page). Two options:

1. **Move the zone to Cloudflare DNS** (recommended by Cloudflare for Pages): add the zone, copy
   every existing record, keep `my.3enwank.com` as a plain **DNS-only (grey cloud) A record** to the
   billing box so the platform keeps its own TLS and sees real client IPs, then change the
   nameservers at the registrar. Add `3enwank.com` and `www.3enwank.com` as custom domains of the
   Pages project (Cloudflare creates the records). Mail records (MX, SPF, DKIM, DMARC for
   `@3enwank.com`) must be copied exactly.
2. **Keep PowerDNS on srv1**: add the custom domains to the Pages project, then point the apex with
   an `ALIAS` record (PowerDNS supports it with `expand-alias=yes`) and `www` with a `CNAME` to
   `<project>.pages.dev`. Cloudflare validates the domain by hostname; the apex needs the ALIAS
   because a CNAME is not allowed there.

Until the new site is live, the old HTML on srv1 stays as the emergency page.

## Adding a page or a locale

A page: add a key to `PageKey` in `src/lib/i18n.ts` (with its slug), a screen in `src/screens/`,
register it in `src/screens/index.ts`, add its copy to both message files, and create the two thin
route files (`src/app/(en)/<slug>/page.tsx` and `src/app/[locale]/<slug>/page.tsx`, copy an existing
one). The sitemap and the navigation pick it up from `pageKeys`.

A locale: add it to `locales` in `src/lib/i18n.ts` and a dictionary in `src/messages/`; the
`[locale]` tree builds it.

## Legal copy

`terms` and `privacy` describe how the platform actually bills, suspends, backs up and reports to the
tax authority, in both languages. They are a starting point for HANDOFF H2 (the operator's own terms,
refund and privacy policies) and should be reviewed before go-live; the version string is
`TERMS_VERSION` in `src/screens/legal.tsx` and matches `settings.legal.termsVersion` on the platform.
