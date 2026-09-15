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

/** Everything the three places print, joined. */
function printed(locale: (typeof locales)[number], catalogue: ReturnType<typeof withPayments>): string {
  const t = messagesFor(locale);
  const pay = homePaymentsCopy(t, catalogue);
  const i = t.home.reasons.findIndex((r) => r.body.includes("{kinds}"));
  const j = t.home.faq.findIndex((f) => f.a.includes("{methods}"));
  return [pay.line, pay.reasons[i]!.body, pay.faq[j]!.a].join("\n");
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
      const pay = homePaymentsCopy(t, everything);
      expect(pay.line, locale).toContain(t.home.payments.methods.card);
      expect(pay.line, locale).toContain(t.home.payments.methods.vodafoneCash);
      expect(printed(locale, everything), locale).toMatch(CARD_OR_WALLET[locale]);
    }
    expect(homePaymentsCopy(messagesFor("en"), everything).line).toBe("Pay by bank transfer, InstaPay, Vodafone Cash or card.");
    expect(homePaymentsCopy(messagesFor("en"), everything).reasons.find((r) => r.title === "Prices in Egyptian pounds")?.body).toBe("Pay in EGP by transfer, wallet or card. Customers outside Egypt pay in dollars.");
    expect(homePaymentsCopy(messagesFor("ar"), everything).line).toBe("ادفع بتحويل بنكي أو بإنستاباي أو بفودافون كاش أو بالكارت.");
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
    expect(homePaymentsCopy(messagesFor("en"), withPayments({ bankTransfer: false, instapay: false, vodafoneCash: false, card: false })).line).toBe("Pay by bank transfer.");
  });
});
