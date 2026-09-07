import { describe, expect, it } from "vitest";
import { fill, messagesFor } from "./index";

const locales = ["en", "ar"] as const;

/** Placeholders the screens fill at render time; a dictionary missing one shows a hole or a stray value. */
describe("message placeholders", () => {
  it("carries exactly one {price} in hosting.addonBody, so the live price can be rendered in place", () => {
    for (const locale of locales) {
      const body = messagesFor(locale).hosting.addonBody;
      expect(body.match(/\{price\}/g), locale).toHaveLength(1);
      const [before, after] = body.split("{price}");
      expect(before!.trim().length, locale).toBeGreaterThan(0);
      expect(after!.trim().length, locale).toBeGreaterThan(0);
    }
  });

  it("carries {deposit} and {rest} once each in websites.deposit and no hard-coded split", () => {
    for (const locale of locales) {
      const t = messagesFor(locale);
      expect(t.websites.deposit.match(/\{deposit\}/g), locale).toHaveLength(1);
      expect(t.websites.deposit.match(/\{rest\}/g), locale).toHaveLength(1);
      expect(t.websites.deposit, locale).not.toMatch(/\d+%/);
      expect(t.websites.lede, locale).not.toMatch(/50|Half|نصف/);
      expect(fill(t.websites.deposit, { deposit: 30, rest: 70 })).toContain("30%");
      expect(fill(t.websites.deposit, { deposit: 30, rest: 70 })).toContain("70%");
    }
  });

  it("uses {legalName} and {rate} where the screens fill them", () => {
    for (const locale of locales) {
      const t = messagesFor(locale);
      expect(t.about.lede).toContain("{legalName}");
      expect(t.common.vatIncluded).toContain("{rate}");
    }
  });
});
