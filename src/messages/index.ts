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
 * and a percent sign written right after the placeholder goes into that run with it: "الإصدار
 * {version}" rendered "10-09-2026" for 2026-09-10, and "{deposit}٪ … و{rest}٪" put the sign on
 * the right of the first number and the left of the second, because the bidi algorithm decides
 * each from the letter before it. `isolate: false` is for text that is not laid out, a <meta>
 * description, where the invisible marks would only be noise.
 */
export function fill(template: string, values: Record<string, string | number>, { isolate = true }: { isolate?: boolean } = {}): string {
  const wrap = isolate && hasArabic(template);
  return template.replace(/\{(\w+)\}([٪%]?)/g, (m, key: string, sign: string) => {
    if (!(key in values)) return m;
    const value = `${String(values[key])}${sign}`;
    return wrap ? ltrRun(value) : value;
  });
}
