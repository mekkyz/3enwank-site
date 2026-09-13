import type { Locale } from "@/lib/i18n";
import { ar } from "./ar";
import { en } from "./en";
import type { Messages } from "./types";

export type { Messages };

const dictionaries: Record<Locale, Messages> = { en, ar };

export function messagesFor(locale: Locale): Messages {
  return dictionaries[locale];
}

/** "{name}" placeholders; unknown names are left as they are so a typo stays visible. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, key: string) => (key in values ? String(values[key]) : m));
}
