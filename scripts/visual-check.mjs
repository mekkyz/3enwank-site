// Render every page in every language at desktop and phone width from ./out and check what a
// reviewer would check: no horizontal scroll, nothing wider than the viewport, no wrapped table
// labels, every section visible, LTR isolation only on Latin text. Screenshots go to ./shots.
//   pnpm build && node scripts/visual-check.mjs        (serves ./out itself on 127.0.0.1:8790)
import { createReadStream, existsSync, mkdirSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { chromium } from "playwright";

const root = join(process.cwd(), "out");
const port = 8790;
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".xml": "application/xml", ".txt": "text/plain", ".woff2": "font/woff2", ".ico": "image/x-icon" };
const server = createServer((req, res) => {
  const url = decodeURIComponent((req.url ?? "/").split("?")[0]);
  let file = normalize(join(root, url));
  if (!file.startsWith(root)) return res.writeHead(403).end();
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  if (!existsSync(file) && existsSync(`${file}.html`)) file = `${file}.html`;
  const status = existsSync(file) ? 200 : 404;
  if (status === 404) file = join(root, "404.html");
  res.writeHead(status, { "content-type": types[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(res);
}).listen(port, "127.0.0.1");

const locales = ["", "ar", "ar-eg"];
const pages = ["", "hosting", "websites", "care", "domains", "about", "contact", "terms", "privacy"];
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
      await page.goto(`http://127.0.0.1:${port}${path}`, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      const name = `${theme === "light" ? "light-" : ""}${w.name}-${loc || "en"}-${p || "home"}`;
      const result = await page.evaluate((arabicSource) => {
        const arabicRe = new RegExp(arabicSource);
        const out = [];
        const doc = document.documentElement;
        const vw = doc.clientWidth;
        if (doc.scrollWidth > vw + 1) out.push(`page scrolls horizontally: scrollWidth ${doc.scrollWidth} > ${vw}`);
        // Anything visible that sticks out of the viewport horizontally (tables scroll inside their box, so their content is exempt).
        for (const el of document.querySelectorAll("body *")) {
          const cs = getComputedStyle(el);
          if (cs.display === "none" || cs.visibility === "hidden" || el.closest("[data-scroll], .overflow-x-auto")) continue;
          const r = el.getBoundingClientRect();
          if (r.width === 0) continue;
          if (r.right > vw + 1 || r.left < -1) out.push(`overflows viewport: <${el.tagName.toLowerCase()} class="${(el.getAttribute("class") || "").slice(0, 60)}"> right=${Math.round(r.right)} left=${Math.round(r.left)} vw=${vw}`);
        }
        // Table label cells must not wrap.
        for (const cell of document.querySelectorAll("th.nowrap, td.nowrap")) {
          const range = document.createRange();
          range.selectNodeContents(cell);
          const tops = new Set([...range.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top / 4)));
          if (tops.size > 1) out.push(`table cell wrapped: "${cell.textContent.trim().slice(0, 40)}"`);
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
server.close();
const unique = [...new Set(problems)];
console.log(`${checked} renders checked; ${unique.length} problem(s)`);
for (const p of unique) console.log(" -", p);
process.exit(unique.length ? 1 : 0);
