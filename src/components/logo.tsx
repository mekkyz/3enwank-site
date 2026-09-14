/*
 * Both marks are served at twice the height they are drawn at, not at the size of the brand files.
 *
 * The header wordmark is drawn at most 32px tall and was a 640x108 PNG of 69 KB, preloaded on every
 * page; the footer logo is drawn 80px tall and was 720x226 at 134 KB. wordmark-64.png (379x64) and
 * logo-160.png (510x160) are the same art resized with Lanczos and quantised to a palette: 12 KB and
 * 26 KB, still sharp on a 2x screen. A lossy WebP of each came out larger than the palette PNG, so
 * there is no <picture> fallback to maintain. The originals stay in public/: the JSON-LD
 * Organization logo points at logo.png, and they are the files the next resize starts from.
 *
 * The aspect ratio is the originals' to a tenth of a pixel (379/64 against 640/108), which matters
 * in the header: the wordmark is the item that shrinks to fit the bar (shell.tsx), and it is still
 * 142px wide at 390.
 */

/** The wordmark as it is in the brand files (public/wordmark-64.png, from wordmark.png). */
export function Logo({ className = "" }: { className?: string }) {
  // A static export has no image optimizer; the PNG is already trimmed and downsampled.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/wordmark-64.png" alt="3enwank.com" width={379} height={64} className={`block w-auto ${className || "h-8"}`} decoding="async" />;
}

/**
 * The full logo with the Arabic tagline (public/logo-160.png, from logo.png).
 *
 * The tagline is Arabic on every page, and an alt of "3enwank.com مابيقعش" on an English page was
 * read by an English voice. The alt carries only the Latin domain now, and the tagline follows as its
 * own visually hidden run marked lang="ar", so a screen reader switches voice for exactly that word.
 * It is a <span> beside the image rather than inside the alt because an alt cannot carry a lang of
 * its own.
 */
export function LogoFull({ className = "" }: { className?: string }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-160.png" alt="3enwank.com" width={510} height={160} className={`block w-auto ${className || "h-12"}`} decoding="async" loading="lazy" />
      <span lang="ar" dir="rtl" className="sr-only">
        مابيقعش
      </span>
    </>
  );
}
