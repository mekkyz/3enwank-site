import { headers } from "next/headers";
import { CATALOGUE_URL } from "@/lib/site";
import type { DomainSearchLabels } from "@/components/domain-search";
import type { TrustInfo } from "@/components/trust";
import { loadCatalogue, type Catalogue } from "@/lib/catalogue";
import { ASSISTANT_PREVIEW } from "@/lib/site";
import { catalogueLocale, type Locale } from "@/lib/i18n";
import { fill, messagesFor, type Messages } from "@/messages";

/** Plans the pages single out, by catalogue slug; a slug that is not in the catalogue simply highlights nothing. */
export const HIGHLIGHT: Record<"hosting" | "build" | "care", string> = { hosting: "hosting-m", build: "business-website", care: "care-standard" };

export async function screenContext(locale: Locale): Promise<{ t: Messages; catalogue: Catalogue; company: { legalName: string; address: string; contactEmail: string; supportEmail: string }; trust: TrustInfo }> {
  const { catalogue } = await loadCatalogue();
  const company = {
    legalName: loc(catalogue.company.legalName, locale),
    address: loc(catalogue.company.address, locale),
    /*
     * The address a visitor writes to before they are a customer. It is answered in the sales queue,
     * where support@ is where a customer whose site is down goes. Older stores do not publish it and
     * fall back to support@, which is what this said everywhere until now.
     */
    contactEmail: catalogue.company.contactEmail || catalogue.company.supportEmail,
    supportEmail: catalogue.company.supportEmail,
  };
  const trust: TrustInfo = { taxId: catalogue.company.taxId, commercialRegistry: catalogue.company.commercialRegistry, payments: catalogue.payments };
  return { t: messagesFor(locale), catalogue, company, trust };
}

/** The one VAT sentence, shown once near every price list. */
export function vatLine(t: Messages, catalogue: Catalogue): string {
  return fill(t.common.vatIncluded, { rate: catalogue.vat.rateBp / 100 });
}

/** The store's public API, next to its catalogue endpoint. */
export function storeApi(catalogue: Catalogue): { domainSearch: string; domainIdeas: string; assistant: string; cartDomain: string; lead: string } {
  const store = catalogue.store.url.replace(/\/+$/, "");
  const base = `${store}/api/public`;
  return {
    domainSearch: `${base}/domains/search`,
    domainIdeas: `${base}/domains/ideas`,
    assistant: `${base}/assistant`,
    /*
     * Not under /api/public/. nginx hides Set-Cookie on that prefix because everything there is a
     * cacheable read, and this endpoint's whole job is to write the cart cookie. It answered 200
     * with the cookie stripped for a day, so the button said "In your cart" and the cart was empty.
     */
    cartDomain: `${store}/api/cart/domain`,
    /* The contact form. It stays under /api/public/ because it sets no cookie: it opens a
       ticket and answers with a number, which is exactly what that prefix is for. */
    lead: `${base}/leads`,
  };
}

/**
 * The availability answer, fetched on the server so a visitor without JavaScript still gets one.
 *
 * Called over the loopback address the catalogue already uses, with the visitor's own address
 * forwarded: without that every server-rendered search on this site would share one rate-limit
 * bucket. nginx overwrites X-Real-IP on anything arriving from outside, so only this path can set
 * it.
 */
export async function searchDomainsOnServer(query: string, currency: "EGP" | "USD"): Promise<unknown | null> {
  const url = `${CATALOGUE_URL.replace(/\/api\/public\/catalogue.*$/, "")}/api/public/domains/search?q=${encodeURIComponent(query)}&currency=${currency}`;
  const ip = (await headers()).get("x-real-ip") ?? (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  try {
    const res = await fetch(url, { headers: { Accept: "application/json", ...(ip ? { "X-Real-IP": ip } : {}) }, cache: "no-store" });
    return res.ok ? await res.json() : null;
  } catch {
    // The widget re-asks from the browser the moment it hydrates; a failure here is not the end.
    return null;
  }
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
    added: d.addedCta,
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
