/**
 * Bidirectional text rules for the Arabic pages. A value that is only Latin letters, digits and
 * symbols ("1 GB", "1.2 TB", "EGP 1,999", ".com") is isolated left-to-right so it never flips
 * inside an RTL line. Anything that contains Arabic is left alone: forcing LTR on Arabic breaks it.
 */
const ARABIC = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;

export function hasArabic(text: string): boolean {
  return ARABIC.test(text);
}

/** "ltr" for a Latin-only value, undefined (inherit) when the text carries Arabic. */
export function isolateDir(text: string): "ltr" | undefined {
  return hasArabic(text) ? undefined : "ltr";
}
