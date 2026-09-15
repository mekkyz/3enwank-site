import { describe, expect, it } from "vitest";
import { HANDOFF_QUESTION_MAX, HANDOFF_SUBJECT_MAX, buildHandoff, plainLine, ticketHref } from "./handoff";
import { cheapestPrices } from "./format";
import { locales } from "./i18n";
import { messagesFor } from "@/messages";

const en = messagesFor("en").assistant.handoff;

describe("assistant handoff", () => {
  it("has nothing to hand over before the visitor asks", () => {
    expect(buildHandoff([], en)).toBeNull();
    expect(buildHandoff([{ role: "assistant", content: "Hello" }], en)).toBeNull();
  });

  it("writes the question, the last question and the last answer, without the chat's markup", () => {
    const h = buildHandoff(
      [
        { role: "user", content: "Can you move my **WordPress** site?" },
        { role: "assistant", content: "- Yes, free.\n- See [plans](https://x)" },
        { role: "user", content: "How long does it take?" },
        { role: "assistant", content: "Usually a day." },
      ],
      en,
    )!;
    expect(h.question).toBe("Can you move my WordPress site?");
    expect(h.summary).toBe(`${en.alsoAsked}: How long does it take?\n${en.assistantSaid}: Usually a day.`);
    expect(h.whatsappText.startsWith(en.waIntro)).toBe(true);
    expect(h.whatsappText).toContain(`${en.question}: Can you move my WordPress site?`);
    expect(h.ticket.subject).toBe("Can you move my WordPress site?");
    expect(h.ticket.message).toContain(`${en.fromChat}:`);
  });

  it("keeps the subject and question inside their limits", () => {
    const long = "a ".repeat(900);
    const h = buildHandoff([{ role: "user", content: long }], en)!;
    expect(Array.from(h.question).length).toBeLessThanOrEqual(HANDOFF_QUESTION_MAX + 3);
    expect(Array.from(h.ticket.subject).length).toBeLessThanOrEqual(HANDOFF_SUBJECT_MAX + 3);
    expect(plainLine("<b>x</b>", 10)).toBe("b x /b");
    expect(plainLine("Yes.\n- We copy the site\n- It stays online", 200)).toBe("Yes. We copy the site; It stays online");
  });

  it("links the store's new ticket page under its basePath", () => {
    expect(ticketHref("https://3enwank.com/account/", { subject: "A b", message: "c\nd" })).toBe("https://3enwank.com/account/tickets/new?subject=A+b&message=c%0Ad");
  });

  it("has every label in both languages", () => {
    for (const locale of locales) {
      const h = messagesFor(locale).assistant.handoff;
      for (const v of Object.values(h)) expect(v.trim(), locale).toBeTruthy();
    }
  });
});

describe("cheapestPrices", () => {
  it("takes the lowest price per currency and leaves out a currency nobody has", () => {
    const low = { gross: 100, formatted: "EGP 1" };
    const high = { gross: 900, formatted: "EGP 9" };
    const usd = { gross: 50, formatted: "USD 0.50" };
    expect(cheapestPrices([{ EGP: high }, { EGP: low, USD: usd }])).toEqual({ EGP: low, USD: usd });
    expect(cheapestPrices([{ EGP: high }])).toEqual({ EGP: high });
    expect(cheapestPrices([])).toEqual({});
  });
});
