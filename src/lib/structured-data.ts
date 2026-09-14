import type { Catalogue, Product } from "./catalogue";
import { currencies } from "./money";
import { langTag, pathFor, storeLink, type Locale, type PageKey } from "./i18n";
import { SITE_URL } from "./site";

/**
 * schema.org JSON-LD for the pages that sell something, built from the catalogue so it can never
 * quote a price the store does not charge. Pure functions, so the shapes are tested without a render
 * (structured-data.test.ts); components/json-ld.tsx puts the result in the page.
 *
 * What goes where: the home page describes the company (Organization) and the site (WebSite); the
 * hosting, websites and care pages describe each plan on them as a Product with one Offer per
 * currency. Domains get nothing, because a domain has no price until a name is searched.
 */
export type JsonLd = Record<string, unknown>;

type Localized = { en: string; ar: string };
const text = (value: Localized | null | undefined, locale: Locale) => (value ? value[locale] || value.en : "");

/** One stable id per thing, so the Products on three pages can point at the same Organization. */
const orgId = `${SITE_URL}/#organization`;

export function organizationLd(catalogue: Catalogue, locale: Locale): JsonLd {
  const c = catalogue.company;
  return {
    "@type": "Organization",
    "@id": orgId,
    name: c.displayName,
    legalName: text(c.legalName, locale) || undefined,
    url: `${SITE_URL}${pathFor("home", "en")}`,
    // The full-size logo, not the 160px one the footer draws: search engines ask for at least 112px on the short side.
    logo: `${SITE_URL}/logo.png`,
    email: c.contactEmail || c.supportEmail || undefined,
    telephone: c.phone || undefined,
    taxID: c.taxId || undefined,
    address: text(c.address, locale)
      ? { "@type": "PostalAddress", streetAddress: text(c.address, locale), addressCountry: "EG" }
      : undefined,
  };
}

export function websiteLd(catalogue: Catalogue, locale: Locale): JsonLd {
  return {
    "@type": "WebSite",
    "@id": `${SITE_URL}${pathFor("home", locale)}#website`,
    name: catalogue.company.displayName,
    url: `${SITE_URL}${pathFor("home", locale)}`,
    inLanguage: langTag(locale),
    publisher: { "@id": orgId },
  };
}

/** Minor units to the decimal string schema.org asks for: 199900 is "1999.00". */
export function offerPrice(gross: number): string {
  return (gross / 100).toFixed(2);
}

/**
 * One plan as a Product. An Offer per currency the store prices it in, each pointing at the order
 * link in the reader's language. The price is the one the card advertises; a renewal price is not a
 * second offer, because nobody can buy the renewal on its own.
 */
export function productLd(product: Product, locale: Locale, page: PageKey): JsonLd {
  const url = storeLink(product.storeUrl, locale);
  return {
    "@type": "Product",
    "@id": `${SITE_URL}${pathFor(page, locale)}#${product.slug}`,
    name: text(product.name, locale),
    description: text(product.summary, locale) || undefined,
    sku: product.slug,
    brand: { "@id": orgId },
    offers: currencies.flatMap((currency) => {
      const money = product.prices[currency];
      if (!money) return [];
      return [
        {
          "@type": "Offer",
          price: offerPrice(money.gross),
          priceCurrency: currency,
          url,
          availability: "https://schema.org/InStock",
          seller: { "@id": orgId },
        },
      ];
    }),
  };
}

/** A page's JSON-LD as one document: the context once, the things in a @graph. */
export function graph(items: JsonLd[]): JsonLd {
  return { "@context": "https://schema.org", "@graph": items };
}

/**
 * The text that goes inside <script type="application/ld+json">. `<` is escaped so a catalogue
 * string containing "</script>" cannot end the element early (the Next.js JSON-LD guide's advice);
 * JSON.parse reads the escape back as the same character.
 */
export function serializeLd(data: JsonLd): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** The home page's FAQ, so a search result can show the questions under the site's entry. */
export function faqLd(items: ReadonlyArray<{ q: string; a: string }>): JsonLd {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })),
  };
}
