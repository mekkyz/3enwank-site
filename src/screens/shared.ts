import { loadCatalogue, type Catalogue } from "@/lib/catalogue";
import { catalogueLocale, type Locale } from "@/lib/i18n";
import { fill, messagesFor, type Messages } from "@/messages";

/** Plans the pages single out, by catalogue slug; a slug that is not in the catalogue simply highlights nothing. */
export const HIGHLIGHT: Record<"hosting" | "build" | "care", string> = { hosting: "hosting-m", build: "business-website", care: "care-standard" };

export async function screenContext(locale: Locale): Promise<{ t: Messages; catalogue: Catalogue; company: { legalName: string; address: string; supportEmail: string } }> {
  const { catalogue } = await loadCatalogue();
  const company = {
    legalName: loc(catalogue.company.legalName, locale),
    address: loc(catalogue.company.address, locale),
    supportEmail: catalogue.company.supportEmail,
  };
  return { t: messagesFor(locale), catalogue, company };
}

/** The one VAT sentence, shown once near every price list. */
export function vatLine(t: Messages, catalogue: Catalogue): string {
  return fill(t.common.vatIncluded, { rate: catalogue.vat.rateBp / 100 });
}

export function loc(value: { en: string; ar: string } | null | undefined, locale: Locale): string {
  if (!value) return "";
  return value[catalogueLocale(locale)] || value.en;
}
