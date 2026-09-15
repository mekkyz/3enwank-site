// Render every page in every language at desktop and phone width and check what a reviewer would
// check: no horizontal scroll, nothing wider than the viewport, no wrapped table labels, every
// section visible, LTR isolation only on Latin text. Screenshots go to ./shots.
//   pnpm build && node scripts/visual-check.mjs      (starts `next start` itself on 127.0.0.1:8790)
//   BASE_URL=http://127.0.0.1:3001 node scripts/visual-check.mjs   (checks a running server instead)
//
// Modes, combinable:
//   THEME=dark (default) | light   stores that choice in localStorage before every page loads.
//   THEME=system                   stores nothing and sets the browser colour scheme instead, which is
//                                  what a first-time visitor gets: SCHEME=light (default) or SCHEME=dark.
//   REVEAL=1                       hides navigator.webdriver so REVEAL_SCRIPT (components/root.tsx)
//                                  runs as it does for a person, scrolls each home page to the bottom
//                                  and fails on any [data-reveal-state="pending"] left hidden.
//   BROWSER=chromium (default) | firefox | webkit
import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { chromium, firefox, webkit } from "playwright";

const port = 8790;
const base = (process.env.BASE_URL ?? "").replace(/\/+$/, "");
let child;
if (!base) {
  child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port), "-H", "127.0.0.1"], { stdio: ["ignore", "ignore", "inherit"], env: { ...process.env, NODE_ENV: "production", NEXT_TELEMETRY_DISABLED: "1" } });
  const deadline = Date.now() + 30_000;
  for (;;) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/health/`);
      if (res.ok) break;
    } catch {}
    if (Date.now() > deadline) { child.kill(); throw new Error("next start did not answer within 30 s"); }
    await new Promise((r) => setTimeout(r, 300));
  }
}
const origin = base || `http://127.0.0.1:${port}`;

const locales = ["", "ar"];
const reveal = process.env.REVEAL === "1";
// The reveal pass is about the home page, where the sections, cards, band and FAQ reveal; the other pages keep their normal check.
const pages = reveal ? [""] : ["", "hosting", "websites", "care", "domains", "about", "terms", "privacy", "delivery", "refunds"];
const widths = [{ name: "desktop", width: 1440, height: 900 }, { name: "phone", width: 390, height: 844 }];
const arabic = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;
mkdirSync("shots", { recursive: true });

const engines = { chromium, firefox, webkit };
/*
 * BROWSER is also the conventional "program that opens a URL" variable: a VS Code terminal exports
 * it as a path to its helper script, and xdg setups set it to firefox or a desktop launcher. Only the
 * three engine names select an engine; anything else is someone else's setting and means Chromium.
 */
const browserName = ["chromium", "firefox", "webkit"].includes(process.env.BROWSER ?? "") ? process.env.BROWSER : "chromium";
let browser;
if (browserName === "chromium") {
  // The box's distro Chromium when there is one (the platform's e2e uses the same binary), else Playwright's own.
  const candidates = [process.env.CHROME_PATH, "/usr/lib64/chromium-browser/headless_shell", "/usr/lib64/chromium-browser/chromium-browser", "/usr/bin/chromium-browser"].filter(Boolean);
  const executablePath = candidates.find((c) => existsSync(c));
  browser = await chromium.launch(executablePath ? { executablePath } : {});
} else {
  // Firefox and WebKit come only from Playwright: `pnpm exec playwright install firefox webkit`.
  browser = await engines[browserName].launch();
}

/*
 * THEME=light and THEME=dark store the choice, as the footer switch does. The default used to be
 * called "the dark default", which it has not been since the theme started following the system
 * setting (root.tsx THEME_SCRIPT): dark is now just one stored choice. THEME=system stores nothing,
 * so the no-saved-theme path a first-time visitor gets is rendered too, in the colour scheme the
 * browser context reports.
 */
const themeMode = process.env.THEME === "light" || process.env.THEME === "system" ? process.env.THEME : "dark";
const scheme = process.env.SCHEME === "dark" ? "dark" : "light";
const expectedTheme = themeMode === "system" ? scheme : themeMode;
const prefix = [browserName === "chromium" ? "" : `${browserName}-`, themeMode === "dark" ? "" : themeMode === "system" ? `system-${scheme}-` : "light-", reveal ? "reveal-" : ""].join("");
const problems = [];
let checked = 0;
for (const w of widths) {
  const ctx = await browser.newContext({ viewport: { width: w.width, height: w.height }, deviceScaleFactor: 1, colorScheme: themeMode === "system" ? scheme : "no-preference" });
  const page = await ctx.newPage();
  if (themeMode !== "system") await page.addInitScript((t) => { try { localStorage.setItem("3enwank.theme", t); } catch {} }, themeMode);
  else await page.addInitScript(() => { try { localStorage.removeItem("3enwank.theme"); } catch {} });
  // REVEAL_SCRIPT returns early for navigator.webdriver so ordinary runs screenshot the finished page;
  // this pass takes that guard away on purpose, before any script on the page runs.
  if (reveal) await page.addInitScript(() => { Object.defineProperty(Navigator.prototype, "webdriver", { configurable: true, get: () => false }); });
  for (const loc of locales) {
    for (const p of pages) {
      const path = `/${[loc, p].filter(Boolean).join("/")}${loc || p ? "/" : ""}`;
      const name = `${prefix}${w.name}-${loc || "en"}-${p || "home"}`;
      await page.goto(`${origin}${path}`, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      // The theme the page actually painted with: a system run that stamps "dark" in a light context is a bug, not a pass.
      const painted = await page.evaluate(() => document.documentElement.dataset.theme);
      if (painted !== expectedTheme) problems.push(`${name}: data-theme=${painted}, expected ${expectedTheme}`);
      // Scroll through once so sections that reveal on scroll are shown, then back to the top.
      await page.evaluate(async (slow) => {
        const step = window.innerHeight * 0.8;
        // Instant, not smooth: a smooth scroll would still be moving when the next step starts.
        for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
          window.scrollTo({ top: y, behavior: "instant" });
          await new Promise((r) => setTimeout(r, slow ? 250 : 90));
        }
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" });
        await new Promise((r) => setTimeout(r, slow ? 600 : 90));
      }, reveal);
      if (reveal) {
        // Anything still pending after the whole page has passed through the viewport stays invisible for a real visitor too.
        const state = await page.evaluate(() => ({
          ran: document.querySelectorAll("[data-reveal-state]").length,
          pending: [...document.querySelectorAll('[data-reveal-state="pending"]')].map((el) => `<${el.tagName.toLowerCase()} class="${(el.getAttribute("class") || "").slice(0, 50)}">`),
        }));
        // A run where the script never marked anything did not test the pending state at all.
        if (state.ran === 0) problems.push(`${name}: reveal script did not run (no data-reveal-state anywhere)`);
        for (const el of state.pending) problems.push(`${name}: still pending after scrolling to the bottom: ${el}`);
      }
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      /*
       * Every <details> open before measuring. The FAQ answers sit in closed details, where they have
       * no box: the overflow loop below skips zero-width elements, so an answer that ran off the page
       * was never measured, and no screenshot showed one. The bar's menus are details[data-menu] and
       * open over the page on purpose; they are left closed, since an open menu is not the page.
       */
      await page.evaluate(() => { for (const d of document.querySelectorAll("details:not([data-menu])")) d.open = true; });
      // Entrance animations finish before anything is measured or captured.
      await page.evaluate(() => Promise.all(document.getAnimations().filter((a) => !(a.effect && a.effect.getTiming().iterations === Infinity)).map((a) => a.finished.catch(() => {}))));
      const result = await page.evaluate((arabicSource) => {
        const arabicRe = new RegExp(arabicSource);
        const out = [];
        const doc = document.documentElement;
        // Two different widths, and measuring against the wrong one hides real overflow: `html` sets
        // scrollbar-gutter: stable, so html and body are 375px wide inside a 390px phone while
        // doc.clientWidth still reports 390. A header bar 31px too wide for the page spilled into
        // that 15px gutter, cleared 390, raised no scrollbar, and passed this check. Bound by
        // whichever is narrower.
        const vw = Math.min(doc.clientWidth, document.body.clientWidth);
        if (doc.scrollWidth > vw + 1) out.push(`page scrolls horizontally: scrollWidth ${doc.scrollWidth} > ${vw}`);
        // Anything visible that sticks out of the page horizontally (tables scroll inside their box, so their content is exempt).
        for (const el of document.querySelectorAll("body *")) {
          const cs = getComputedStyle(el);
          if (cs.display === "none" || cs.visibility === "hidden" || el.closest("[data-scroll], .overflow-x-auto")) continue;
          /*
           * Decoration that is clipped by its own box cannot push the page sideways: the home hero's
           * glow (aria-hidden, inside .hero-bg with overflow hidden) is wider than the screen on
           * purpose and drifts. Skipped only when BOTH hold, so real content that spills out of a
           * clipping card is still reported.
           */
          if (el.closest('[aria-hidden="true"]')) {
            let clipped = false;
            for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
              const ox = getComputedStyle(a).overflowX;
              if (ox === "hidden" || ox === "clip") { clipped = true; break; }
            }
            if (clipped) continue;
          }
          const r = el.getBoundingClientRect();
          if (r.width === 0) continue;
          if (r.right > vw + 1 || r.left < -1) out.push(`overflows viewport: <${el.tagName.toLowerCase()} class="${(el.getAttribute("class") || "").slice(0, 60)}"> right=${Math.round(r.right)} left=${Math.round(r.left)} vw=${vw}`);
        }
        // The header bar, against its own padding box rather than the page's. This is the row that
        // keeps overflowing: a fixed-width wordmark beside controls whose width follows the
        // language, and the page-level bound above is too loose to see it: with the wordmark one
        // step too tall, English ended 15px into its own 20px of right padding and still cleared the
        // page edge. "Fits" here means inside the padding, so measure that.
        const bar = document.querySelector("header > div");
        if (bar) {
          const bcs = getComputedStyle(bar);
          const bb = bar.getBoundingClientRect();
          const innerStart = bb.left + parseFloat(bcs.paddingLeft);
          const innerEnd = bb.right - parseFloat(bcs.paddingRight);
          for (const child of bar.children) {
            const cr = child.getBoundingClientRect();
            if (cr.width === 0) continue;
            if (cr.left < innerStart - 1 || cr.right > innerEnd + 1)
              out.push(`header bar overflows its padding: <${child.tagName.toLowerCase()}> ${Math.round(cr.left)}..${Math.round(cr.right)} outside ${Math.round(innerStart)}..${Math.round(innerEnd)}`);
          }
        }
        // Table label cells must not wrap.
        for (const cell of document.querySelectorAll("th.nowrap, td.nowrap")) {
          const range = document.createRange();
          range.selectNodeContents(cell);
          // Nested inline boxes report one rect each at the same line; a real wrap moves a rect down by a line.
          const tops = [...range.getClientRects()].filter((r) => r.width > 0).map((r) => r.top);
          if (tops.length && Math.max(...tops) - Math.min(...tops) > 8) out.push(`table cell wrapped: "${cell.textContent.trim().slice(0, 40)}"`);
        }
        // Every section on the page is visible and has height.
        for (const s of document.querySelectorAll("main section, main header")) {
          if (s.getBoundingClientRect().height < 20) out.push(`section without height: ${s.id || s.className.slice(0, 40)}`);
        }
        // LTR isolation only on Latin text; Arabic text must never be forced LTR.
        for (const el of document.querySelectorAll('[dir="ltr"]')) {
          if (el.tagName === "HTML" || el.tagName === "SVG") continue;
          if (arabicRe.test(el.textContent || "")) out.push(`Arabic text forced LTR: "${(el.textContent || "").trim().slice(0, 40)}"`);
        }
        // Lang and dir on the root switch with the language.
        out.push(`meta lang=${doc.lang} dir=${doc.dir}`);
        return out;
      }, arabic.source);
      const meta = result.pop();
      const expectDir = loc ? "rtl" : "ltr";
      if (!meta.includes(`dir=${expectDir}`)) problems.push(`${name}: ${meta}`);
      for (const r of result) problems.push(`${name}: ${r}`);
      await page.screenshot({ path: `shots/${name}.png`, fullPage: true });
      checked++;
    }
  }
  await ctx.close();
}
await browser.close();
child?.kill();
const unique = [...new Set(problems)];
console.log(`${checked} renders checked (${browserName}, theme ${themeMode === "system" ? `system/${scheme}` : themeMode}${reveal ? ", reveal" : ""}); ${unique.length} problem(s)`);
for (const p of unique) console.log(" -", p);
process.exit(unique.length ? 1 : 0);
