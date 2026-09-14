import { describe, expect, it } from "vitest";
import { fallbackCatalogue } from "./catalogue";
import { heroFacts, vatLine, vatShown } from "./vat";
import { locales } from "./i18n";
import { messagesFor } from "@/messages";

/*
 * The catalogue.fallback.json snapshot is refreshed from production and carries whatever rate the
 * platform published last, so neither state is assumed from it: each fixture sets the rate itself.
 */
const at = (rateBp: number) => ({ ...fallbackCatalogue(), vat: { rateBp, pricesIncludeVat: true } });

/** "VAT" in English, the Arabic root of "tax" (ضريبة, الضريبة, ضريبي) in Arabic. */
const VAT = /VAT|ضريب/;

describe("VAT copy follows the catalogue", () => {
  it("prints nothing about VAT while the business is not VAT-registered (rateBp 0)", () => {
    const catalogue = at(0);
    expect(vatShown(catalogue)).toBe(false);
    for (const locale of locales) {
      const t = messagesFor(locale);
      expect(vatLine(t, catalogue), locale).toBeNull();
      const facts = heroFacts(t, catalogue);
      expect(facts, locale).toHaveLength(3);
      expect(facts.join(" "), locale).not.toMatch(VAT);
    }
  });

  it("states the catalogue's rate once, and once only, when it is registered (rateBp 1400)", () => {
    const catalogue = at(1400);
    expect(vatShown(catalogue)).toBe(true);
    for (const locale of locales) {
      const t = messagesFor(locale);
      const line = vatLine(t, catalogue);
      expect(line, locale).toContain("14");
      expect(line?.match(VAT), locale).toHaveLength(1);
      const facts = heroFacts(t, catalogue);
      expect(facts, locale).toHaveLength(3);
      expect(facts.filter((f) => VAT.test(f)), locale).toHaveLength(1);
    }
  });

  it("takes the rate from the catalogue, not from a constant", () => {
    const t = messagesFor("en");
    expect(vatLine(t, at(500))).toContain("5%");
    expect(vatLine(t, at(1400))).toContain("14%");
  });
});
