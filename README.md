# 3enwank.com

The marketing site for 3enwank: hosting plans, website packages, care plans, domain prices, contact
and legal pages, in English (`/`), formal Arabic (`/ar/`) and Egyptian Arabic (`/ar-eg/`). A Next.js 16
app that runs as its own service on the platform box (`enwank-site.service`, port 3001, behind nginx),
next to the store but in a separate process and user, with no database (platform repo: `docs/DECISIONS.md`,
"The public website runs on the box"; design: `docs/design/website.md`).

Plans and prices are not typed into this repo. The site reads the platform's public catalogue
(`GET /api/public/catalogue`, over loopback on the box), renders every page once at build time and
re-renders it in the background at most every five minutes, so a price change reaches the site on its
own. **Publish website** in the platform admin refreshes every page at once (`POST /api/revalidate/`).
Every "Order" button deep-links to the store, and the domain search, chat and name ideas call the
store's public API from the browser.

## Local development

Requirements: Node 22 and pnpm 12 (`corepack enable` picks the version from `package.json`).

```bash
pnpm install
cp .env.example .env            # optional; the defaults point at production
pnpm dev                        # http://localhost:3000, Arabic at /ar/, Egyptian at /ar-eg/
pnpm test                       # vitest: catalogue loading, formatting, paths
pnpm lint && pnpm typecheck
pnpm build && pnpm start        # production server on http://127.0.0.1:3001
pnpm check                      # build first; starts the server itself and renders every page in every language at 1440 and 390 px
```

`pnpm dev` and `pnpm build` both fetch the catalogue. Without network, or to build exactly what is
checked in, set `CATALOGUE_SOURCE=fallback`.

Development happens on a machine of its own and releases are cut from the billing box's checkout;
how the two are wired together is `docs/DEVELOPMENT.md` in the `3enwank-platform` repository.

## Configuration (environment)

On the box the values live in `/etc/enwank-site/env` (`ops/env.example`); they are read when the
server starts and during `next build`.

| Variable | Default | Meaning |
|---|---|---|
| `CATALOGUE_URL` | `https://my.3enwank.com/api/public/catalogue` | Where the catalogue is fetched from (on the box: `http://127.0.0.1:3000/api/public/catalogue`) |
| `CATALOGUE_SOURCE` | `remote` | `fallback` skips the network and uses `catalogue.fallback.json` |
| `ASSISTANT_PREVIEW` | empty | `1` renders the chat widget and domain name ideas even while the store reports the assistant off |
| `CATALOGUE_AUTH` | empty | `user:password` sent as basic auth (staging behind nginx auth) |
| `STORE_URL` | `https://my.3enwank.com` | Store origin for Log in links when the catalogue has none |
| `SITE_URL` | `https://3enwank.com` | Canonical origin for sitemap, hreflang, OpenGraph |
| `WHATSAPP_NUMBER` | empty | International format without `+`; empty hides the WhatsApp card |
| `SITE_REVALIDATE_SECRET` | empty | Token for `POST /api/revalidate?token=…`; empty disables the endpoint |

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
src/app/global-not-found  the 404 page, three languages
src/app/sitemap.ts        sitemap.xml with hreflang alternates; robots.ts
src/screens/*             one module per page: metadata(locale) + render(locale)
src/components/*          shell (header, nav, footer), plan cards, tables, currency switch
src/messages/{en,ar}.ts   all copy, one typed shape (types.ts)
src/lib/catalogue.ts      fetch + validate + fallback;  format.ts prices and feature lines;  i18n.ts paths
catalogue.fallback.json   full export of the endpoint (scripts/export-catalogue.ts), used when it is unreachable
public/og.png             share image;  ops/                      systemd unit, nginx vhosts, env example
```

Design: Tailwind 4 with the platform's colour tokens (`src/app/globals.css`), Inter and Noto Naskh
Arabic bundled from `@fontsource-variable` (no font CDN), inline SVG logo, no UI kit, no analytics,
no third-party requests. Arabic pages render with `dir="rtl"` and logical CSS properties.

## Hosting on the box

```bash
sudo scripts/box-setup.sh     # once: user enwank-site, /srv/3enwank-site, /etc/enwank-site/env, systemd unit
sudo scripts/deploy.sh        # every release: git archive → pnpm install → next build → switch → restart → health check (rollback on failure)
```

`ops/systemd/enwank-site.service` runs `next start -p 3001 -H 127.0.0.1` as `enwank-site` with the
same hardening as the platform's unit; it can write only its own page cache under `/srv/3enwank-site`.
nginx fronts it: `ops/nginx/enwank-site.conf` is the production vhost for `3enwank.com`, live since
2026-09-08. `ops/nginx/enwank-site-preview.conf` was the password-protected review listener on
`my.3enwank.com:8444`; it is retired and its port is closed, and it is kept only in case a staging
copy is ever wanted again. Security
headers and the content security policy live in those files.

### Publish from the platform admin

The hook URL to paste at **Admin → Website** is `https://<site>/api/revalidate/?token=<SITE_REVALIDATE_SECRET>`
(the token is in `/etc/enwank-site/env`). Publish posts to it and every page re-renders from the
current catalogue within seconds; without it, pages refresh on their own within five minutes. The
token is a password: rotate it in the env file and the admin settings together.

### Going live (HANDOFF H11)

The old site on srv1 sends `Strict-Transport-Security: max-age=31536000`, so every browser that has
visited `https://3enwank.com` in the past year refuses plain HTTP and refuses to click past a
certificate error. The certificate therefore has to exist on this box **before** the name moves.
srv1 already serves `/.well-known/acme-challenge/` over HTTP without redirecting, so it can proxy
that one path here while it still owns the name.

1. **Lower the TTL** on the apex `A` record (and leave `www` as a CNAME to the apex) to 300 on srv1,
   bump the SOA serial, and wait for the old 14400 s TTL to age out of resolver caches.
2. **Pin `mail.3enwank.com`**: it is a CNAME to the apex, so it would follow the move. Give it its
   own `A` record to srv1 first. `www` is meant to follow and stays a CNAME.
3. **Prepare this box**: `install -d -m 0755 /var/www/letsencrypt`, install
   `ops/nginx/enwank-site-acme.conf`, `nginx -t`, reload. It only answers to `Host: 3enwank.com`,
   which still reaches srv1, so it changes nothing yet.
4. **srv1 proxies the challenge**: `/.well-known/acme-challenge/` on the apex and www vhosts to
   `http://159.195.68.162/`, ahead of its own webroot alias and without redirecting to HTTPS.
5. **Issue the certificate** here:
   `certbot certonly --webroot -w /var/www/letsencrypt -d 3enwank.com -d www.3enwank.com`.
6. **Install the real vhost**: remove `enwank-site-acme.conf`, install `ops/nginx/enwank-site.conf`,
   `nginx -t`, reload. Set `SITE_URL=https://3enwank.com` and `STORE_URL=https://my.3enwank.com` in
   `/etc/enwank-site/env` and restart `enwank-site`.
7. **Move the name**: srv1 changes the apex `A` to `159.195.68.162` and bumps the serial. Check the
   secondaries (`ns1.first-ns.de`, `robotns2.second-ns.de`, `robotns3.second-ns.com`) have it.
8. **Afterwards**: paste the production hook URL into the platform admin, raise the TTL back to
   14400 once the move is settled, and retire the review listener on `:8444`. Leave the old site on
   srv1 in place for a day as the rollback target: putting the apex `A` back is a 300 s change.

Do not touch `MX`, `SPF`, `DKIM`, `_dmarc`, the `ns1`/`ns2` records or `my.3enwank.com`, and do not
add an `AAAA` record: this box has no IPv6 address.

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

## Languages and copy

Each language is its own dictionary in `src/messages/` with the same shape (`types.ts`): `en.ts`,
`ar.ts` (formal Arabic, written as its own text) and `ar-eg.ts` (Egyptian Arabic throughout: إيميل,
دومين, باقة, مفتوح, اطلبها). Adding a language is one entry in `LOCALES` (`src/lib/i18n.ts`) plus a
dictionary. `messages.test.ts` enforces the writing rules: no em dashes, no exclamation marks, none
of the words that read as generated copy, a non-breaking space after a sentence-initial و in the
Egyptian text, and formal Arabic that is not a copy of the Egyptian or the English.

`dir` and `lang` on `<html>` switch with the language. Latin-only values ("1 GB", prices, ".com")
are isolated left-to-right with `<bdi dir="ltr">` (`src/components/bidi.tsx`); text that contains
Arabic is never forced LTR. Table labels never wrap (`.nowrap`); the table scrolls inside its box.

## Theme

Dark is the default; the footer switch stores "light" in `localStorage` (`3enwank.theme`) and an
inline script in `<head>` applies the stored theme before the first paint. Every colour is a token
in `src/app/globals.css` with a value per theme; components never hard-code a colour except the two
brand hues in gradients.

## Render check before a review

`pnpm check` (`scripts/visual-check.mjs`) serves `./out`, opens every page in every language at
desktop and phone width, and fails on horizontal scroll, elements wider than the page, a header row
wider than its own padding, wrapped table labels, empty sections, or Arabic text inside an LTR
isolate. Screenshots land in `./shots/`. `THEME=light pnpm check` repeats it for the light theme. Run
both after every build that goes to a reviewer.

Two things about the widths it measures, both learned the hard way on 2026-09-12:

- **The page is narrower than the viewport.** `html` sets `scrollbar-gutter: stable`, so at a 390px
  phone width `html` and `body` are 375px while `documentElement.clientWidth` still says 390. The
  check bounds by the narrower of the two. Bounding by the viewport hid a header row that overflowed
  by 31px in English, which spilled into the reserved gutter, raised no scrollbar, and passed.
- **Fitting the page is not fitting the layout.** The header row is additionally measured against the
  bar's own padding box, because a row that has eaten its padding is broken even while it clears the
  page edge.

It uses the first Chromium it finds in `CHROME_PATH` or the distro locations, and otherwise the one
Playwright downloaded (`pnpm exec playwright install chromium`), which is what a machine without a
distro Chromium ends up using.
