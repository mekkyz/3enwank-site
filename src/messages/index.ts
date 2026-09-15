import { hasArabic, ltrRun } from "@/lib/bidi";
import type { Locale } from "@/lib/i18n";
import { ar } from "./ar";
import { en } from "./en";
import type { Messages } from "./types";

export type { Messages };

const dictionaries: Record<Locale, Messages> = { en, ar };

export function messagesFor(locale: Locale): Messages {
  return dictionaries[locale];
}

/**
 * "{name}" placeholders; unknown names are left as they are so a typo stays visible.
 *
 * In an Arabic sentence a Latin or numeric value is set as its own left-to-right run (lib/bidi.ts),
 * and a percent sign written right after the placeholder stays with it: "الإصدار
 * {version}" rendered "10-09-2026" for 2026-09-10, and "{deposit}٪ … و{rest}٪" put the sign on
 * the right of the first number and the left of the second, because the bidi algorithm decides
 * each from the letter before it. A percent sign written right after the placeholder is kept with its
 * number in an isolate of its own (see below). `isolate: false` is for text that is not laid out, a <meta>
 * description, where the invisible marks would only be noise.
 */
export function fill(template: string, values: Record<string, string | number>, { isolate = true }: { isolate?: boolean } = {}): string {
  const wrap = isolate && hasArabic(template);
  return template.replace(/\{(\w+)\}([٪%]?)/g, (m, key: string, sign: string) => {
    if (!(key in values)) return m;
    if (!wrap) return `${String(values[key])}${sign}`;
    /*
     * With a sign, the number is its own left-to-right run inside a right-to-left isolate that also holds
     * the sign: "50٪" then reads number first and draws the sign on the left of the number, the same side
     * for every number whatever letter comes before it. Inside the one left-to-right run the sign was drawn
     * on the right, where an Arabic reader meets it before the number, "٪50" (verify, 2026-09-15).
     */
    return sign ? `\u2067${ltrRun(String(values[key]))}${sign}\u2069` : ltrRun(String(values[key]));
  });
}
