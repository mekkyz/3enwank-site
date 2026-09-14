import { describe, expect, it } from "vitest";
import { fallbackCatalogue } from "./catalogue";
import { locales } from "./i18n";
import { graph, offerPrice, organizationLd, productLd, serializeLd, websiteLd } from "./structured-data";

describe("structured data", () => {
  const catalogue = fallbackCatalogue();

  it("describes the company and the site on the home page", () => {
    for (const locale of locales) {
      const doc = JSON.parse(serializeLd(graph([organizationLd(catalogue, locale), websiteLd(catalogue, locale)])));
      expect(doc["@context"]).toBe("https://schema.org");
      const [org, site] = doc["@graph"];
      expect(org["@type"]).toBe("Organization");
      expect(org.name).toBe(catalogue.company.displayName);
      expect(org.url).toMatch(/^https?:\/\//);
      expect(site["@type"]).toBe("WebSite");
      expect(site.publisher["@id"]).toBe(org["@id"]);
    }
  });

  it("gives every plan a Product with an Offer per currency at the catalogue's price", () => {
    for (const locale of locales) {
      for (const [kind, page] of [
        ["hosting", "hosting"],
        ["build", "websites"],
        ["care", "care"],
      ] as const) {
        for (const p of catalogue.products[kind]) {
          const ld = JSON.parse(serializeLd(productLd(p, locale, page)));
          expect(ld["@type"]).toBe("Product");
          expect(ld.name).toBeTruthy();
          const offers = ld.offers as Array<{ price: string; priceCurrency: string; url: string }>;
          expect(offers.length).toBe(Object.keys(p.prices).length);
          for (const o of offers) {
            expect(o.price).toBe(offerPrice(p.prices[o.priceCurrency as "EGP" | "USD"]!.gross));
            expect(o.price).toMatch(/^\d+\.\d{2}$/);
            expect(o.url).toContain(`lang=${locale}`);
          }
        }
      }
    }
  });

  it("cannot be closed early by a catalogue string", () => {
    const text = serializeLd({ name: "</script><script>alert(1)</script>" });
    expect(text).not.toContain("</script>");
    expect(JSON.parse(text).name).toBe("</script><script>alert(1)</script>");
  });
});
