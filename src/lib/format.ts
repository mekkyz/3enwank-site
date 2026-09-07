import type { Currency, Money, Product } from "./catalogue";
import type { Locale } from "./i18n";
import type { Messages } from "@/messages";

/**
 * Prices arrive as minor units; the site shows whole major units ("EGP 1,999") because every
 * catalogue price is a round amount, and falls back to two decimals when one is not. Arabic pages
 * keep Latin digits, as the invoices do, so amounts read the same everywhere.
 */
export function formatPrice(money: Money, currency: Currency, locale: Locale): string {
  const major = money.gross / 100;
  const whole = Number.isInteger(major);
  const formatter = new Intl.NumberFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-EG", {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  });
  const number = formatter.format(major).replace(/[‏‎]/g, "");
  return locale === "ar" ? `${number} ${currency}` : `${currency} ${number}`;
}

export type FeatureLine = { label: string; value: string } | { text: string };

/** "Storage: 1 GB NVMe" → label/value; anything without a short label stays free text. */
export function parseFeature(line: string): FeatureLine {
  const m = /^([^:]{1,40}):\s+(.+)$/.exec(line.trim());
  return m ? { label: m[1]!.trim(), value: m[2]!.trim() } : { text: line.trim() };
}

/**
 * Feature lines for a locale. The catalogue's Arabic copy was seeded with the English text; until an
 * admin translates it, known labels and values are translated here so the Arabic page reads as Arabic.
 * A line the admin did translate is used as it is.
 */
export function localizedFeatures(product: Product, locale: Locale, messages: Messages): FeatureLine[] {
  const source = product.features[locale].length ? product.features[locale] : product.features.en;
  return source.map((line, i) => {
    const parsed = parseFeature(line);
    const untranslated = locale !== "en" && line === product.features.en[i];
    if (!untranslated) return parsed;
    if ("text" in parsed) return { text: messages.features.texts[parsed.text] ?? parsed.text };
    return { label: messages.features.labels[parsed.label] ?? parsed.label, value: messages.features.values[parsed.value] ?? parsed.value };
  });
}

/** The summary for a locale, with the same untranslated-copy fallback as the feature lines. */
export function localizedSummary(product: Product, locale: Locale, messages: Messages): string {
  const summary = product.summary;
  if (!summary) return "";
  const text = summary[locale] || summary.en;
  if (locale === "en" || summary[locale] !== summary.en) return text;
  return messages.features.summaries[summary.en] ?? text;
}

/** Delivery time and the rest of a summary, in either language ("Delivery: 3 weeks." / "التسليم: 3 أسابيع."). */
const DELIVERY_RE = /\s*(?:Delivery|التسليم):\s*([^.]+)\.?/i;

/** Lines shown on a plan card: the spec-style ones, without the marketing sentences. */
export function cardFeatures(lines: FeatureLine[], max = 6): FeatureLine[] {
  return lines.filter((l) => "label" in l && l.value.length <= 40).slice(0, max);
}

/** Free-text lines that are not prices or billing notes (those are shown from the catalogue's price fields). */
export function noteFeatures(lines: FeatureLine[]): string[] {
  return lines.flatMap((l) => ("text" in l && !/\b(EGP|USD|VAT)\b/.test(l.text) ? [l.text] : []));
}

export type CompareRow = { label: string; values: string[] };

/** Rows for a comparison table: every label that appears on all products, in first-seen order. */
export function compareRows(products: Product[], locale: Locale, messages: Messages, exclude: string[] = []): CompareRow[] {
  const perProduct = products.map((p) => {
    const map = new Map<string, string>();
    for (const line of localizedFeatures(p, locale, messages)) if ("label" in line) map.set(line.label, line.value);
    return map;
  });
  const order: string[] = [];
  for (const map of perProduct) for (const label of map.keys()) if (!order.includes(label)) order.push(label);
  const excluded = new Set(exclude.map((e) => messages.features.labels[e] ?? e).concat(exclude));
  return order
    .filter((label) => !excluded.has(label) && perProduct.every((m) => m.has(label)))
    .map((label) => ({ label, values: perProduct.map((m) => m.get(label) ?? "") }));
}

/** The delivery time a build package announces in its summary, if any. */
export function deliveryFrom(summary: string | null | undefined): string | null {
  if (!summary) return null;
  const m = DELIVERY_RE.exec(summary);
  return m ? m[1]!.trim() : null;
}

/** The summary without the delivery sentence. */
export function summaryWithoutDelivery(summary: string | null | undefined): string {
  return (summary ?? "").replace(DELIVERY_RE, "").trim();
}
