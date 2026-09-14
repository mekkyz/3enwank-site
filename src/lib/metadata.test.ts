import { describe, expect, it } from "vitest";
import { locales } from "./i18n";
import { DESCRIPTION_MAX, clipDescription, pageMetadata } from "./metadata";
import { messagesFor } from "@/messages";

describe("clipDescription", () => {
  it("leaves a short description alone and cuts a long one between words", () => {
    expect(clipDescription("Hosting in Germany.")).toBe("Hosting in Germany.");
    const long =
      "These terms apply to every hosting plan, website build, care plan and domain name bought from us. By placing an order in the customer area you accept them.";
    const clipped = clipDescription(long, 100);
    expect(clipped.length).toBeLessThanOrEqual(100);
    expect(clipped.endsWith("…")).toBe(true);
    // The word before the ellipsis is a whole word of the original.
    const words = long.split(" ");
    const last = clipped.slice(0, -1).split(" ").pop()!;
    expect(words.some((w) => w.replace(/[,.]$/, "") === last)).toBe(true);
    expect(clipped).not.toMatch(/[,.]…$/);
  });

  it("clips Arabic between words too, and drops an Arabic comma before the cut", () => {
    const ar = "تسري هذه الشروط على كل خطة استضافة، وتصميم موقع، وخطة صيانة، واسم نطاق يُشترى منا";
    const clipped = clipDescription(ar, 40);
    expect(clipped.length).toBeLessThanOrEqual(40);
    expect(clipped).not.toMatch(/،…$/);
    expect(ar.startsWith(clipped.slice(0, -1))).toBe(true);
  });
});

describe("page titles", () => {
  it("gives the home page its short title, not the h1, under sixty characters", () => {
    for (const locale of locales) {
      const t = messagesFor(locale);
      const title = String(pageMetadata("home", locale, t.home.metaTitle, t.meta.description).title);
      expect(title, locale).not.toContain(t.home.h1);
      expect(title.length, `${locale}: ${title}`).toBeLessThan(60);
    }
  });

  it("does not repeat the brand on a title that already names it", () => {
    for (const locale of locales) {
      const t = messagesFor(locale);
      const title = String(pageMetadata("about", locale, t.about.title, t.about.h2).title);
      expect(title.split(t.meta.siteName).length - 1, `${locale}: ${title}`).toBe(1);
    }
  });

  it("never publishes a description longer than a search result shows", () => {
    for (const locale of locales) {
      const t = messagesFor(locale);
      const description = String(
        pageMetadata("hosting", locale, t.hosting.title, `${t.hosting.h2} ${t.hosting.lede} ${t.hosting.lede}`)
          .description,
      );
      expect(description.length, locale).toBeLessThanOrEqual(DESCRIPTION_MAX);
    }
  });
});
