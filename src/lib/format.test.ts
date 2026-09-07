import { describe, expect, it } from "vitest";
import { fallbackCatalogue } from "./catalogue";
import { cardFeatures, compareRows, deliveryFrom, formatPrice, localizedFeatures, localizedSummary, noteFeatures, parseFeature, summaryWithoutDelivery } from "./format";
import { messagesFor } from "@/messages";

describe("prices", () => {
  it("shows whole amounts without decimals and keeps Latin digits in Arabic", () => {
    expect(formatPrice({ gross: 199900, formatted: "EGP 1,999.00" }, "EGP", "en")).toBe("EGP 1,999");
    expect(formatPrice({ gross: 199900, formatted: "EGP 1,999.00" }, "EGP", "ar")).toBe("1,999 EGP");
    expect(formatPrice({ gross: 4000, formatted: "USD 40.00" }, "USD", "en")).toBe("USD 40");
    expect(formatPrice({ gross: 1250, formatted: "USD 12.50" }, "USD", "ar")).toBe("12.50 USD");
    expect(formatPrice({ gross: 0, formatted: "EGP 0.00" }, "EGP", "en")).toBe("EGP 0");
  });
});

describe("features", () => {
  it("splits spec lines and keeps sentences as text", () => {
    expect(parseFeature("Storage: 1 GB NVMe")).toEqual({ label: "Storage", value: "1 GB NVMe" });
    expect(parseFeature("Billed once a year. Normal price 2,499 EGP")).toEqual({ text: "Billed once a year. Normal price 2,499 EGP" });
    expect(parseFeature("Runs on: AlmaLinux 10 · cPanel & WHM")).toEqual({ label: "Runs on", value: "AlmaLinux 10 · cPanel & WHM" });
  });

  it("translates untranslated Arabic feature lines and leaves translated ones alone", () => {
    const ar = messagesFor("ar");
    const product = { ...fallbackCatalogue().products.hosting[0]!, features: { en: ["Storage: 1 GB NVMe", "Email accounts: Unlimited", "Custom: thing"], ar: ["Storage: 1 GB NVMe", "حسابات البريد: بلا حدود", "Custom: thing"] } };
    expect(localizedFeatures(product, "ar", ar)).toEqual([
      { label: "المساحة", value: "1 GB NVMe" },
      { label: "حسابات البريد", value: "بلا حدود" },
      { label: "Custom", value: "thing" },
    ]);
    expect(localizedFeatures(product, "en", messagesFor("en"))[0]).toEqual({ label: "Storage", value: "1 GB NVMe" });
  });

  it("translates untranslated summaries and free-text lines, and reads Arabic delivery times", () => {
    const ar = messagesFor("ar");
    const build = fallbackCatalogue().products.build.find((p) => p.slug === "business-website")!;
    expect(localizedSummary(build, "ar", ar)).toBe("حتى خمس صفحات على ووردبريس. التسليم: 3 أسابيع.");
    expect(localizedSummary(build, "en", messagesFor("en"))).toBe("Up to five pages on WordPress. Delivery: 3 weeks.");
    expect(localizedSummary({ ...build, summary: { en: "X", ar: "س" } }, "ar", ar)).toBe("س");
    expect(localizedSummary({ ...build, summary: { en: "Unknown", ar: "Unknown" } }, "ar", ar)).toBe("Unknown");
    expect(localizedFeatures(build, "ar", ar)[0]).toEqual({ text: "حتى خمس صفحات على ووردبريس، مع رخصة قالب مدفوعة" });
    expect(deliveryFrom("حتى خمس صفحات على ووردبريس. التسليم: 3 أسابيع.")).toBe("3 أسابيع");
    expect(summaryWithoutDelivery("حتى خمس صفحات على ووردبريس. التسليم: 3 أسابيع.")).toBe("حتى خمس صفحات على ووردبريس.");
  });

  it("picks card lines and notes", () => {
    const lines = [
      { label: "Storage", value: "1 GB NVMe" },
      { label: "Runs on", value: "AlmaLinux 10 · cPanel & WHM · NVMe SSD · ModSecurity/OWASP firewall · Imunify" },
      { text: "Billed once a year. Normal price 2,499 EGP - you pay 1,999 EGP per year, VAT included" },
      { text: "Hosting and Care plans are separate." },
    ];
    expect(cardFeatures(lines)).toEqual([{ label: "Storage", value: "1 GB NVMe" }]);
    expect(noteFeatures(lines)).toEqual(["Hosting and Care plans are separate."]);
  });

  it("builds comparison rows from labels every plan carries", () => {
    const en = messagesFor("en");
    const rows = compareRows(fallbackCatalogue().products.hosting, "en", en, ["Runs on"]);
    expect(rows.map((r) => r.label)).toEqual(["Storage", "Bandwidth", "Email accounts", "Databases", "Domains", "FTP accounts"]);
    expect(rows[0]!.values).toEqual(["1 GB NVMe", "2 GB NVMe", "5 GB NVMe", "10 GB NVMe", "50 GB NVMe", "150 GB NVMe"]);
    const arRows = compareRows(fallbackCatalogue().products.care, "ar", messagesFor("ar"));
    expect(arRows[0]).toEqual({ label: "التحديثات", values: ["شهرياً", "كل أسبوعين، بعد اختبارها", "أسبوعياً، بعد اختبارها", "أسبوعياً، ومعها إضافات الدفع"] });
  });

  it("extracts the delivery time from a build summary", () => {
    expect(deliveryFrom("Up to five pages on WordPress. Delivery: 3 weeks.")).toBe("3 weeks");
    expect(summaryWithoutDelivery("Up to five pages on WordPress. Delivery: 3 weeks.")).toBe("Up to five pages on WordPress.");
    expect(deliveryFrom("No delivery here")).toBeNull();
    expect(summaryWithoutDelivery(null)).toBe("");
  });
});
