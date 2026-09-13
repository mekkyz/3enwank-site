// Render every page in every language at desktop and phone width and check what a reviewer would
// check: no horizontal scroll, nothing wider than the viewport, no wrapped table labels, every
// section visible, LTR isolation only on Latin text. Screenshots go to ./shots.
//   pnpm build && node scripts/visual-check.mjs      (starts `next start` itself on 127.0.0.1:8790)
//   BASE_URL=http://127.0.0.1:3001 node scripts/visual-check.mjs   (checks a running server instead)
import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { chromium } from "playwright";

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
const pages = ["", "hosting", "websites", "care", "domains", "about", "terms", "privacy", "delivery", "refunds"];
const widths = [{ name: "desktop", width: 1440, height: 900 }, { name: "phone", width: 390, height: 844 }];
const arabic = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;
mkdirSync("shots", { recursive: true });

// No browser download: the box's distro Chromium (the platform's e2e uses the same binary).
const candidates = [process.env.CHROME_PATH, "/usr/lib64/chromium-browser/headless_shell", "/usr/lib64/chromium-browser/chromium-browser", "/usr/bin/chromium-browser"].filter(Boolean);
const executablePath = candidates.find((c) => existsSync(c));
const browser = await chromium.launch(executablePath ? { executablePath } : {});
// THEME=light checks the light theme; the default run checks the dark default.
const theme = process.env.THEME === "light" ? "light" : "dark";
const problems = [];
let checked = 0;
for (const w of widths) {
  const ctx = await browser.newContext({ viewport: { width: w.width, height: w.height }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.addInitScript((t) => { try { localStorage.setItem("3enwank.theme", t); } catch {} }, theme);
  for (const loc of locales) {
    for (const p of pages) {
      const path = `/${[loc, p].filter(Boolean).join("/")}${loc || p ? "/" : ""}`;
      await page.goto(`${origin}${path}`, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      // Scroll through once so sections that reveal on scroll are shown, then back to the top.
      await page.evaluate(async () => {
        const step = window.innerHeight * 0.8;
        // Instant, not smooth: a smooth scroll would still be moving when the next step starts.
        for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
          window.scrollTo({ top: y, behavior: "instant" });
          await new Promise((r) => setTimeout(r, 90));
        }
        window.scrollTo({ top: 0, behavior: "instant" });
      });
      // Entrance animations finish before anything is measured or captured.
      await page.evaluate(() => Promise.all(document.getAnimations().filter((a) => !(a.effect && a.effect.getTiming().iterations === Infinity)).map((a) => a.finished.catch(() => {}))));
      const name = `${theme === "light" ? "light-" : ""}${w.name}-${loc || "en"}-${p || "home"}`;
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
          const r = el.getBoundingClientRect();
          if (r.width === 0) continue;
          if (r.right > vw + 1 || r.left < -1) out.push(`overflows viewport: <${el.tagName.toLowerCase()} class="${(el.getAttribute("class") || "").slice(0, 60)}"> right=${Math.round(r.right)} left=${Math.round(r.left)} vw=${vw}`);
        }
        // The header bar, against its own padding box rather than the page's. This is the row that
        // keeps overflowing — a fixed-width wordmark beside controls whose width follows the
        // language — and the page-level bound above is too loose to see it: with the wordmark one
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
console.log(`${checked} renders checked; ${unique.length} problem(s)`);
for (const p of unique) console.log(" -", p);
process.exit(unique.length ? 1 : 0);
