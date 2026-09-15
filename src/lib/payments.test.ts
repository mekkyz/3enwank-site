import { describe, expect, it } from "vitest";
import { fallbackCatalogue } from "./catalogue";
import { locales } from "./i18n";
import { homePaymentsCopy, paymentMethods } from "./payments";
import { messagesFor } from "@/messages";

/*
 * The home page names a way to pay only while the store takes it (owner, 2026-09-15, D5). The
 * fallback snapshot carries whatever production published last, so each case sets payments itself.
 */
const withPayments = (payments: { bankTransfer: boolean; instapay: boolean; vodafoneCash: boolean; card: boolean }) => ({ ...fallbackCatalogue(), payments });

const manualOnly = withPayments({ bankTransfer: true, instapay: true, vodafoneCash: false, card: false });
const everything = withPayments({ bankTransfer: true, instapay: true, vodafoneCash: true, card: true });

/** Card, wallet and Vodafone Cash in either language. */
const CARD_OR_WALLET = { en: /\bcard\b|wallet|Vodafone/i, ar: /كارت|محفظة|فودافون/ } as const;

/** Everything the two places print, joined: the facts row that names the methods and the FAQ answer on paying. */
function printed(locale: (typeof locales)[number], catalogue: ReturnType<typeof withPayments>): string {
  const t = messagesFor(locale);
  const pay = homePaymentsCopy(t, catalogue);
  const i = t.home.facts.findIndex((f) => f.body.includes("{methods}"));
  const j = t.home.faq.findIndex((f) => f.a.includes("{methods}"));
  return [pay.facts[i]!.body, pay.faq[j]!.a].join("\n");
}

describe("ways to pay on the home page", () => {
  it("does not name card or a wallet while the catalogue says the store does not take them", () => {
    for (const locale of locales) {
      const text = printed(locale, manualOnly);
      expect(text, locale).not.toMatch(CARD_OR_WALLET[locale]);
      expect(text, locale).toMatch(locale === "en" ? /bank transfer or InstaPay/ : /بتحويل بنكي أو بإنستاباي/);
    }
  });

  it("names card and Vodafone Cash once the catalogue publishes them", () => {
    for (const locale of locales) {
      const t = messagesFor(locale);
      const text = printed(locale, everything);
      expect(text, locale).toContain(t.home.payments.methods.card);
      expect(text, locale).toContain(t.home.payments.methods.vodafoneCash);
      expect(text, locale).toMatch(CARD_OR_WALLET[locale]);
    }
    // The facts row (S4) carries the list the old payments line did.
    expect(homePaymentsCopy(messagesFor("en"), everything).facts.find((f) => f.title === "Pay in EGP or USD")?.body).toBe("Pounds by bank transfer, InstaPay, Vodafone Cash or card. Dollars by bank transfer from abroad.");
    expect(homePaymentsCopy(messagesFor("ar"), everything).facts.find((f) => f.title === "ادفع بالجنيه أو بالدولار")?.body).toBe("بالجنيه بتحويل بنكي أو بإنستاباي أو بفودافون كاش أو بالكارت، وبالدولار بتحويل بنكي من برة مصر.");
  });

  it("leaves no placeholder behind and forces no Arabic left to right", () => {
    for (const locale of locales) {
      for (const catalogue of [manualOnly, everything, withPayments({ bankTransfer: false, instapay: false, vodafoneCash: false, card: false })]) {
        const text = printed(locale, catalogue);
        expect(text, locale).not.toMatch(/[{}]/);
        expect(text, locale).not.toMatch(/[⁦⁩]/);
      }
    }
  });

  it("falls back to bank transfer when every method is switched off", () => {
    expect(paymentMethods({ bankTransfer: false, instapay: false, vodafoneCash: false, card: false })).toEqual(["bankTransfer"]);
    expect(printed("en", withPayments({ bankTransfer: false, instapay: false, vodafoneCash: false, card: false }))).toMatch(/^Pounds by bank transfer\. /);
  });
});
