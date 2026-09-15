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
//   (REVEAL=1 is gone with REVEAL_SCRIPT: nothing on the site hides until scrolled to since 2026-09-15.)
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
const pages = ["", "hosting", "websites", "care", "domains", "about", "contact", "terms", "privacy", "delivery", "refunds"];
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
const prefix = [browserName === "chromium" ? "" : `${browserName}-`, themeMode === "dark" ? "" : themeMode === "system" ? `system-${scheme}-` : "light-"].join("");
const problems = [];
let checked = 0;
for (const w of widths) {
  const ctx = await browser.newContext({ viewport: { width: w.width, height: w.height }, deviceScaleFactor: 1, colorScheme: themeMode === "system" ? scheme : "no-preference" });
  const page = await ctx.newPage();
  if (themeMode !== "system") await page.addInitScript((t) => { try { localStorage.setItem("3enwank.theme", t); } catch {} }, themeMode);
  else await page.addInitScript(() => { try { localStorage.removeItem("3enwank.theme"); } catch {} });
  /*
   * Per language on a phone: whether the assistant was on the page, and whether its button was ever out.
   * The cover check below passed for a whole run while the button was tucked on every page (verify, S8).
   */
  const assistantSeen = new Set();
  const assistantShown = new Set();
  for (const loc of locales) {
    for (const p of pages) {
      const path = `/${[loc, p].filter(Boolean).join("/")}${loc || p ? "/" : ""}`;
      const name = `${prefix}${w.name}-${loc || "en"}-${p || "home"}`;
      await page.goto(`${origin}${path}`, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      // The theme the page actually painted with: a system run that stamps "dark" in a light context is a bug, not a pass.
      const painted = await page.evaluate(() => document.documentElement.dataset.theme);
      if (painted !== expectedTheme) problems.push(`${name}: data-theme=${painted}, expected ${expectedTheme}`);
      // Scroll through once, so anything that renders on the way down (the sticky bar, client islands) has, then back to the top.
      await page.evaluate(async () => {
        const step = window.innerHeight * 0.8;
        // Instant, not smooth: a smooth scroll would still be moving when the next step starts.
        for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
          window.scrollTo({ top: y, behavior: "instant" });
          await new Promise((r) => setTimeout(r, 90));
        }
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" });
        await new Promise((r) => setTimeout(r, 90));
      });
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
           * Decoration that is clipped by its own box cannot push the page sideways (the hero glow that
           * needed this is gone, the rule stays for the next one). Skipped only when it is aria-hidden
           * AND clipped, so real content that spills out of a clipping card is still reported.
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
      /*
       * Nothing floating covers content on a phone (S8, site review justDo): once scrolling has settled,
       * the assistant's corner button is either tucked away or over nothing in its avoid list.
       */
      if (w.name === "phone" && (await page.locator("[data-assistant-launcher]").count())) {
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
        await page.waitForTimeout(750);
        assistantSeen.add(loc);
        const cover = await page.evaluate(() => {
          const b = document.querySelector("[data-assistant-launcher]");
          if (!b || b.hasAttribute("data-tucked")) return null;
          window.__assistantOut = true;
          const dock = b.parentElement;
          const r = dock.getBoundingClientRect();
          for (const [x, y] of [[r.left + r.width / 2, r.top + r.height / 2], [r.left + 4, r.top + 4], [r.right - 4, r.bottom - 4]]) {
            const under = document.elementsFromPoint(x, y).find((el) => !dock.contains(el));
            // The same list as AVOID in assistant.tsx, <html> excluded: it carries data-currency too.
            const hit = under?.closest("table, form, input, select, textarea, [data-currency]:not(html), [data-float-avoid], a[href], button, summary, [role=tab]");
            if (hit) return `<${hit.tagName.toLowerCase()} class="${(hit.getAttribute("class") || "").slice(0, 50)}">`;
          }
          return null;
        });
        if (cover) problems.push(`${name}: the assistant button covers ${cover}`);
        if (await page.evaluate(() => window.__assistantOut === true)) assistantShown.add(loc);
      }
      /*
       * The assistant (S8), once per language and width on the home page: the labelled button opens a full
       * sheet on a phone and a full-height docked panel on a desktop, focus goes inside, Escape closes it
       * and focus comes back to the button.
       */
      if (p === "" && (await page.locator("[data-assistant-launcher]").count())) {
        await page.evaluate(() => document.querySelector("[data-assistant-launcher]").focus());
        await page.keyboard.press("Enter");
        await page.waitForSelector("[data-assistant-sheet]", { timeout: 3000 }).catch(() => {});
        const sheet = await page.evaluate(() => {
          const el = document.querySelector("[data-assistant-sheet]");
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { inside: el.contains(document.activeElement), width: r.width, height: r.height, vw: window.innerWidth, vh: window.innerHeight };
        });
        if (!sheet) problems.push(`${name}: the assistant button did not open the assistant`);
        else {
          if (!sheet.inside) problems.push(`${name}: focus did not move into the assistant`);
          if (sheet.height < sheet.vh - 1) problems.push(`${name}: the assistant is ${Math.round(sheet.height)}px tall, not the full ${sheet.vh}px`);
          if (w.name === "phone" && sheet.width < sheet.vw - 16) problems.push(`${name}: the assistant is not a full sheet on a phone (${Math.round(sheet.width)}px of ${sheet.vw})`);
          await page.screenshot({ path: `shots/${name}-assistant.png` });
          await page.keyboard.press("Escape");
          const after = await page.evaluate(() => ({ open: !!document.querySelector("[data-assistant-sheet]"), back: document.activeElement?.hasAttribute("data-assistant-launcher") ?? false }));
          if (after.open) problems.push(`${name}: Escape did not close the assistant`);
          if (!after.back) problems.push(`${name}: focus did not return to the assistant button`);
        }
      }
      /*
       * The phone Menu sheet (S15), once per language on the home page: it opens as a modal, focus
       * goes inside it, Tab stays inside it, Escape closes it and focus returns to the Menu button.
       */
      if (w.name === "phone" && p === "") {
        const button = page.locator("[data-menu-button]");
        if (!(await button.count())) problems.push(`${name}: no Menu button in the phone header`);
        else {
          await button.click();
          const opened = await page.evaluate(() => {
            const d = document.querySelector("dialog");
            return { open: !!d?.open, inside: !!d?.contains(document.activeElement) };
          });
          if (!opened.open) problems.push(`${name}: Menu button did not open the sheet`);
          if (!opened.inside) problems.push(`${name}: focus did not move into the open Menu sheet`);
          await page.screenshot({ path: `shots/${name}-menu.png` });
          for (let i = 0; i < 20; i++) await page.keyboard.press("Tab");
          if (!(await page.evaluate(() => !!document.querySelector("dialog")?.contains(document.activeElement)))) problems.push(`${name}: Tab left the open Menu sheet`);
          await page.keyboard.press("Escape");
          const closed = await page.evaluate(() => ({ open: !!document.querySelector("dialog")?.open, back: document.activeElement?.hasAttribute("data-menu-button") ?? false }));
          if (closed.open) problems.push(`${name}: Escape did not close the Menu sheet`);
          if (!closed.back) problems.push(`${name}: focus did not return to the Menu button`);
        }
      }
    }
  }
  for (const loc of assistantSeen) if (!assistantShown.has(loc)) problems.push(`${prefix}${w.name}-${loc || "en"}: the assistant button stayed tucked at the top of every page`);
  await ctx.close();
}
await browser.close();
child?.kill();
const unique = [...new Set(problems)];
console.log(`${checked} renders checked (${browserName}, theme ${themeMode === "system" ? `system/${scheme}` : themeMode}); ${unique.length} problem(s)`);
for (const p of unique) console.log(" -", p);
process.exit(unique.length ? 1 : 0);
