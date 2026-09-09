import type { DomainSearchLabels } from "@/components/domain-search";
import { loadCatalogue, type Catalogue } from "@/lib/catalogue";
import { ASSISTANT_PREVIEW } from "@/lib/site";
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

/** The store's public API, next to its catalogue endpoint. */
export function storeApi(catalogue: Catalogue): { domainSearch: string; domainIdeas: string; assistant: string } {
  const base = `${catalogue.store.url.replace(/\/+$/, "")}/api/public`;
  return { domainSearch: `${base}/domains/search`, domainIdeas: `${base}/domains/ideas`, assistant: `${base}/assistant` };
}

/** Chat and name ideas: on when the store has its key, or forced on for a design review. */
export function assistantOn(catalogue: Catalogue): boolean {
  return catalogue.assistant.enabled || ASSISTANT_PREVIEW;
}

export function domainSearchLabels(t: Messages): DomainSearchLabels {
  const d = t.domains;
  return {
    label: d.searchLabel,
    placeholder: d.searchPlaceholder,
    button: d.searchButton,
    hint: d.searchHint,
    available: d.available,
    taken: d.taken,
    unknown: d.unknown,
    premium: d.premium,
    notOffered: d.notOffered,
    register: d.registerCta,
    askUs: d.askUs,
    checking: d.checking,
    error: d.error,
    rateLimited: d.rateLimited,
    otherExtensions: d.otherExtensions,
    moreExtensions: d.moreExtensions,
    perYear: t.common.perYear,
    ideasTitle: d.ideasTitle,
    ideasHint: d.ideasHint,
    ideasPlaceholder: d.ideasPlaceholder,
    ideasButton: d.ideasButton,
    ideasWorking: d.ideasWorking,
    ideasEmpty: d.ideasEmpty,
    ideasUnavailable: d.ideasUnavailable,
  };
}

export function loc(value: { en: string; ar: string } | null | undefined, locale: Locale): string {
  if (!value) return "";
  return value[catalogueLocale(locale)] || value.en;
}
