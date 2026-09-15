# 3enwank.com

The marketing site for 3enwank: hosting plans, website packages, care plans, domain prices, contact
and legal pages, in English (`/`) and Egyptian Arabic (`/ar/`). A Next.js 16
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
pnpm dev                        # http://localhost:3000, Arabic at /ar/
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
| `WHATSAPP_NUMBER` | empty | International format without `+`; the WhatsApp links (contact, moving, Talk to us first, the assistant's handoff) are built from it in `src/lib/whatsapp.ts`; without a number they fall back to the contact form |
| `STATUS_URL` | empty | The status page. Empty renders no Status link; set, a Status link shows in the footer, the phone menu and on the contact page (read at start, so a restart is enough) |
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
src/app/global-not-found  the 404 page, every language
src/app/sitemap.ts        sitemap.xml with hreflang alternates; robots.ts
src/screens/*             one module per page: metadata(locale) + render(locale); contact.tsx is /contact/
src/components/*          shell (header, nav, footer), plan cards, tables, currency switch
src/components/mobile-menu.tsx  the phone Menu sheet;  assistant.tsx the Ask button and its sheet
src/components/contact-prefill.tsx  reads ?need=, ?plan= and ?note= into the contact form and WhatsApp text
src/lib/handoff.ts        the assistant's WhatsApp, ticket and contact-form links;  whatsapp.ts wa.me links
src/messages/{en,ar}.ts   all copy, one typed shape (types.ts)
src/lib/catalogue.ts      fetch + validate + fallback;  format.ts prices and feature lines;  i18n.ts paths
catalogue.fallback.json   full export of the endpoint (scripts/export-catalogue.ts), used when it is unreachable
public/og.png             share image;  ops/                      systemd unit, nginx vhosts, env example
```

Design: Tailwind 4 with the platform's colour tokens (`src/app/globals.css`), Inter and Noto Naskh
Arabic bundled from `@fontsource-variable` (no font CDN), inline SVG logo, no UI kit, no analytics.
The only third-party request is the spam check (`src/lib/turnstile.ts`), loaded when a visitor sends
the contact form, a chat message or a name-ideas request, never on page load; the privacy policy
says so. Arabic pages render with `dir="rtl"` and logical CSS properties.

## Page structure (owner, 2026-09-15)

The site has a plain engineering look: flat backgrounds, hairlines and tables, type doing the work.
No glows, grids, glass, floating or drifting, and no icons in tinted circles. Buttons and tabs are
pills; cards and fields share one container radius. `docs/TESTING.md` in the platform repository
has a checklist line for each decision below.

**Home page** (`src/screens/home.tsx`, S1). Each thing is said once, in this order: the hero; plans
and prices in one tab strip (Hosting, Websites, Care; a family with nothing to sell has no tab); one
facts list (six rows, a bold fact and a line each, two columns from `sm`, no cards or icons); moving
to us (three numbered steps and "Ask us to move your site"); the domain search; the FAQ in one
column; contact, which opens with the customer and site-down strip. There are no hero tiles and no
"What we do" section, and a phone reads the page in about seven screens. Section headings are
statements, with no small uppercase label above them.

**Hero** (S2). One column: the headline "Everything you need to get online, in one place." large
across the width, the lede under it, the two buttons below. No panel, glow, grid or tiles, and no
`tracking-*` utility: Arabic zeroes letter-spacing, so the heading is set by size and leading only.

**Header** (`src/components/shell.tsx`, S15). From `lg` one row: logo, navigation, currency, cart,
language, log in, Contact. Below `lg` the row holds only the logo, the cart and one **Menu** button,
which opens `MobileMenu`: a modal `<dialog>` docked to the end side (right in English, left in
Arabic) holding the navigation, Contact, the language, the currency, log in and, when `STATUS_URL` is
set, Status. Tab and Shift+Tab stay inside it, Escape closes it and focus returns to Menu. Contact goes
to `/contact/` (S7), never to a section of the home page.

**Assistant** (`src/components/assistant.tsx`, S8). A labelled corner pill, "Ask" / "اسأل" with an
icon, with no rings. Below 768px it tucks away while the reader scrolls down and returns when
scrolling stops or turns up, unless its spot would cover a table, a form or a field, a price, a row
marked `data-float-avoid` (plan specs, feature lists, domain results), or a link, button, tab or FAQ
question. It opens as a full modal sheet on a phone and as a panel docked full height on the end side
from `md`; Escape closes it and focus returns to the button. Once the visitor has asked something it
offers three ways to a person, built on the site by `src/lib/handoff.ts`: **Continue on WhatsApp**
(the question and a short summary prefilled), **Send as a support ticket**
(`{store}/tickets/new?subject=…&message=…`; a signed-out visitor passes through login) and the
contact form with the question as its note. The site builds these links itself rather than calling
the platform: that route refuses while the assistant is off, which is exactly when a person is the
only way forward, and a window opened after an awaited request is a popup Safari blocks. The
assistant's copy never tells visitors to email about their account.

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

`terms`, `privacy`, `delivery` and `refunds` describe how the platform actually bills, suspends,
cancels, backs up, deletes an account and reports to the tax authority, in both languages. The
privacy policy names providers by what they do, not by brand, and lists every cookie by purpose.
They are a starting point for HANDOFF H2 (the operator's own terms, refund and privacy policies)
and should be reviewed before go-live; the version string is
`TERMS_VERSION` in `src/screens/legal.tsx` and matches `settings.legal.termsVersion` on the platform.

## Languages and copy

Each language is its own dictionary in `src/messages/` with the same shape (`types.ts`): `en.ts` and
`ar.ts` (Egyptian Arabic throughout: إيميل, دومين, باقة, مفتوح, اطلبها; the legal pages are
formal, because they are legal text). Adding a language is one entry in `LOCALES` (`src/lib/i18n.ts`)
plus a dictionary. `messages.test.ts` enforces the writing rules: no em dashes, no exclamation marks,
none of the words that read as generated copy, a non-breaking space after a sentence-initial و, and
Arabic that is not a copy of the English.

There was a third locale, `/ar-eg/`, which carried the Egyptian copy while `/ar/` was formal. The
Egyptian copy reads better to everyone who was being served, so it moved to `/ar/` and the Egyptian
locale was removed. The old `/ar-eg/` URLs answer 404 on purpose; nothing redirects them.

`dir` and `lang` on `<html>` switch with the language. Latin-only values ("1 GB", prices, ".com")
are isolated left-to-right with `<bdi dir="ltr">` (`src/components/bidi.tsx`); text that contains
Arabic is never forced LTR. Table labels never wrap (`.nowrap`); the table scrolls inside its box.

## Theme

The theme follows the visitor's system setting until the footer switch is used; the switch stores
"light" or "dark" in `localStorage` (`3enwank.theme`), and an inline script at the top of `<body>`
stamps `data-theme` from the stored choice or `prefers-color-scheme` before the first paint. A
visitor without JavaScript gets the `prefers-color-scheme: light` block in `globals.css`, which
repeats the light tokens: the two blocks must stay identical. Every colour is a token in
`src/app/globals.css` with a value per theme; components never hard-code a colour beyond the white label on the brand
button. There are no gradients, glows or grids any more (owner, 2026-09-15); the light theme separates
its layers with the surface, panel and hairline tokens rather than tinted shadows.

## Motion

Functional only (owner, 2026-09-15, S3): motion stays where it explains something, and
`prefers-reduced-motion` flattens all of it. What is left:

- the tab strip (`TabStrip` in `src/components/tabs.tsx`) slides its pill to the chosen tab; the plans'
  panels share a grid cell so the page never jumps, and the domain search's panels fade in and ease
  between heights;
- FAQ answers slide open and shut (`.faq-item::details-content`, Chromium; other browsers open at once),
  and the caret turns;
- hover changes colour, never position: no card lift, no leaning chevron;
- the theme switch fades colours, and prices fade when the currency changes (`html.currency-switching`);
- the assistant's typing dots and caret while an answer streams.

Gone, with their CSS: the reveal-on-scroll fades and `REVEAL_SCRIPT`, the header's transparent bar
over the hero, the hero glow's breathing and the grid, the tiles' drift, icon spin, card lifts, the
plan card's pulse and the chat bubble's rings. Nothing on the site waits to be scrolled to before it
shows, so in-page links land on finished sections and `pnpm check` screenshots the page as it is.

## Render check before a review

`pnpm check` (`scripts/visual-check.mjs`) starts `next start` on the build, opens every page in every
language at desktop and phone width with every `<details>` (the FAQ) opened, and fails on horizontal
scroll, elements wider than the page, a header row wider than its own padding, wrapped table labels,
empty sections, or Arabic text inside an LTR isolate. On every phone page it also fails when the
assistant's corner button, once scrolling has settled, sits over anything in its avoid list; and on the
home page, once per language and width, when the button does not open the assistant full height (full
width on a phone), move focus into it, close on Escape and return focus to the button. Screenshots land
in `./shots/`. Modes:

- `THEME=dark` (the default run) and `THEME=light` store that choice before each page loads.
- `THEME=system` stores nothing and sets the browser's colour scheme instead (`SCHEME=light` by
  default, `SCHEME=dark` for the other), which is what a first-time visitor gets.
- `BROWSER=firefox` or `BROWSER=webkit` runs any mode in that engine
  (`pnpm exec playwright install firefox webkit` once). WebKit on Linux is not iOS Safari.

Run dark, light and system after every build that goes to a reviewer. (`REVEAL=1` went with the
reveal script on 2026-09-15.)

Two things about the widths it measures, both learned the hard way on 2026-09-12:

- **The page is narrower than the viewport.** `html` sets `scrollbar-gutter: stable`, so at a 390px
  phone width `html` and `body` are 375px while `documentElement.clientWidth` still says 390. The
  check bounds by the narrower of the two. Bounding by the viewport hid a header row that overflowed
  by 31px in English, which spilled into the reserved gutter, raised no scrollbar, and passed.
- **Fitting the page is not fitting the layout.** The header row is additionally measured against the
  bar's own padding box, because a row that has eaten its padding is broken even while it clears the
  page edge.

With the default Chromium it uses the first one it finds in `CHROME_PATH` or the distro locations, and otherwise the one
Playwright downloaded (`pnpm exec playwright install chromium`), which is what a machine without a
distro Chromium ends up using.
