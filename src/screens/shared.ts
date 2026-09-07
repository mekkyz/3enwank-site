import { loadCatalogue, type Catalogue } from "@/lib/catalogue";
import type { Locale } from "@/lib/i18n";
import { fill, messagesFor, type Messages } from "@/messages";

/** Plans the pages single out, by catalogue slug; a slug that is not in the catalogue simply highlights nothing. */
export const HIGHLIGHT: Record<"hosting" | "build" | "care", string> = { hosting: "hosting-m", build: "business-website", care: "care-standard" };

export async function screenContext(locale: Locale): Promise<{ t: Messages; catalogue: Catalogue }> {
  const { catalogue } = await loadCatalogue();
  return { t: messagesFor(locale), catalogue };
}

export function vatLine(t: Messages, catalogue: Catalogue): string {
  return catalogue.vat.rateBp > 0 && catalogue.vat.pricesIncludeVat ? fill(t.common.vatIncluded, { rate: catalogue.vat.rateBp / 100 }) : t.common.vatNotApplied;
}

export function loc(value: { en: string; ar: string } | null | undefined, locale: Locale): string {
  if (!value) return "";
  return value[locale] || value.en;
}
