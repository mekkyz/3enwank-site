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

/**
 * A value set as its own left-to-right run inside an Arabic sentence, with the Unicode isolates
 * (U+2066 LRI … U+2069 PDI) rather than a <bdi>, so it works where the text is a plain string: a
 * dictionary sentence filled in by fill(), a client island's label. Without it a version like
 * "2026-09-10" after an Arabic letter lays out as "10-09-2026", and "50٪" puts its sign on
 * whichever side the previous character decides. Arabic text is left alone, as isolateDir does,
 * but the test is for an Arabic letter, not for ARABIC: the percent sign "٪" is Script=Arabic and
 * is exactly the character a run like "50٪" is isolated for.
 */
const ARABIC_LETTER = /(?=\p{L})\p{Script=Arabic}/u;

export function ltrRun(text: string): string {
  return ARABIC_LETTER.test(text) ? text : `\u2066${text}\u2069`;
}
