/**
 * Writes every icon this site serves, from one source mark.
 *   node scripts/make-icons.mjs            (reads assets/mark-192.png)
 *   MARK_SRC=path/to/mark.png node scripts/make-icons.mjs
 *
 * The mark used to be served with a transparent ground, so a dark tab bar showed a 3 floating on
 * nothing. Every cut now sits on a white tile, and every cut is taken from the source, never from a
 * larger cut.
 */
import { createRequire } from "node:module";
import { dirname } from "node:path";

// sharp is not a dependency of this site; it is one of Next's, and under pnpm that means it is real
// on disk but not resolvable by name from here. Resolve it from where it actually lives.
const require_ = createRequire(import.meta.url);
let sharp;
try {
  sharp = require_(require_.resolve("sharp", { paths: [dirname(require_.resolve("next/package.json"))] }));
} catch {
  console.error("sharp not found. It ships with next; run pnpm install, or pnpm add -D sharp.");
  process.exit(1);
}

// The mark on a transparent ground, at 192px or better. Not one of the files this writes: those
// are tiles, and re-reading one would trim nothing and bake the tile into the next tile.
const SRC = process.env.MARK_SRC ?? "assets/mark-192.png";

// Trim the transparent margin first: the mark has to be measured, not guessed at.
const trimmed = await sharp(SRC).trim({ threshold: 1 }).png().toBuffer();
const meta = await sharp(trimmed).metadata();
console.log("mark after trim:", meta.width, "x", meta.height);

function tile(size, radiusPct) {
  const r = Math.round((size * radiusPct) / 100);
  return Buffer.from(
    `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">` +
      `<rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="#ffffff"/></svg>`,
  );
}

async function build(out, size, radiusPct, insetPct) {
  const box = Math.round(size * (1 - insetPct / 50)); // inset on each side
  const mark = await sharp(trimmed).resize({ width: box, height: box, fit: "inside" }).toBuffer();
  const m = await sharp(mark).metadata();
  await sharp(tile(size, radiusPct))
    .composite([{ input: mark, left: Math.round((size - m.width) / 2), top: Math.round((size - m.height) / 2) }])
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log(out, `${size}px  mark ${m.width}x${m.height}  radius ${radiusPct}%  inset ${insetPct}%`);
}

// The tab icon is a rounded tile; the Apple one is square because iOS masks it itself.
// Each size is cut from the 192px original, never from a smaller cut: the 16px tab icon is the
// one that has to survive, and halving the 32px file again is a second loss for no reason.
await build("public/favicon-16.png", 16, 22, 6);
await build("public/favicon-32.png", 32, 22, 5);
await build("public/icon-192.png", 192, 22, 8);
await build("public/apple-icon-180.png", 180, 0, 8);
