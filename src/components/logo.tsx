/** The wordmark as it is in the brand files (public/wordmark.png, trimmed and downsampled from 3enwank_wordmark.png). */
export function Logo({ className = "" }: { className?: string }) {
  // A static export has no image optimizer; the PNG is already trimmed and downsampled.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/wordmark.png" alt="3enwank.com" width={640} height={108} className={`block w-auto ${className || "h-8"}`} decoding="async" />;
}
