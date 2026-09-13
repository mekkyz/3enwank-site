import type { Currency, Money, Product } from "./catalogue";
import { catalogueLocale, dirFor, type Locale } from "./i18n";
import type { Messages } from "@/messages";

/**
 * Prices arrive as minor units; the site shows whole major units ("EGP 1,999") because every
 * catalogue price is a round amount, and falls back to two decimals when one is not. Arabic pages
 * keep Latin digits, as the invoices do, so amounts read the same everywhere.
 */
export function formatPrice(money: Money, currency: Currency, locale: Locale): string {
  const major = money.gross / 100;
  const whole = Number.isInteger(major);
  const formatter = new Intl.NumberFormat(dirFor(locale) === "rtl" ? "ar-EG-u-nu-latn" : "en-EG", {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  });
  const number = formatter.format(major).replace(/[‏‎]/g, "");
  return dirFor(locale) === "rtl" ? `${number} ${currency}` : `${currency} ${number}`;
}

export type FeatureLine = { label: string; value: string } | { text: string };

/**
 * "Storage: 1 GB NVMe" → label/value; anything without a short label stays free text. A long value
 * that ends in an explanation in brackets ("2 a year (a content change is one clear edit …)") keeps
 * the value only: the explanation belongs to the page's fine print, not to a table cell.
 */
export function parseFeature(line: string): FeatureLine {
  const m = /^([^:]{1,40}):\s+(.+)$/.exec(line.trim());
  if (!m) return { text: line.trim() };
  let value = m[2]!.trim();
  const bracket = /^(.{1,40}?)\s*\((.{20,})\)$/.exec(value);
  if (bracket) value = bracket[1]!.trim();
  return { label: m[1]!.trim(), value };
}

/** Arabic pages label bandwidth as "per month" already, so the value drops its own "/ month". */
function localizeValue(value: string, key: "en" | "ar", messages: Messages): string {
  const mapped = messages.features.values[value];
  if (mapped) return mapped;
  if (key === "ar") {
    const monthly = /^(.+?)\s*\/\s*month$/i.exec(value);
    if (monthly) return monthly[1]!.trim();
  }
  return value;
}

/**
 * Feature lines for a locale. The catalogue's Arabic copy was seeded with the English text; until an
 * admin translates it, known labels and values are translated here so the Arabic page reads as Arabic.
 * A line the admin did translate is used as it is.
 */
export function localizedFeatures(product: Product, locale: Locale, messages: Messages): FeatureLine[] {
  const key = catalogueLocale(locale);
  const source = product.features[key].length ? product.features[key] : product.features.en;
  return source.map((line, i) => {
    const parsed = parseFeature(line);
    const untranslated = key !== "en" && line === product.features.en[i];
    if (!untranslated) return parsed;
    if ("text" in parsed) return { text: messages.features.texts[parsed.text] ?? parsed.text };
    return { label: messages.features.labels[parsed.label] ?? parsed.label, value: localizeValue(parsed.value, key, messages) };
  });
}

/** One catalogue string (an option name, a value label) for a locale, with the same untranslated-copy fallback. */
export function localizedValue(value: { en: string; ar: string } | null | undefined, locale: Locale, messages: Messages): string {
  if (!value) return "";
  const key = catalogueLocale(locale);
  const text = value[key] || value.en;
  if (key === "en" || value[key] !== value.en) return text;
  return messages.features.values[value.en] ?? text;
}

/** Default deposit share when a build product carries none (the platform's own default, 50%). */
const DEFAULT_DEPOSIT_BP = 5000;

/** The up-front and on-approval percentages of a build package, from the catalogue's `depositBp`. */
export function depositSplit(product: Pick<Product, "depositBp">): { deposit: number; rest: number } {
  const bp = product.depositBp ?? DEFAULT_DEPOSIT_BP;
  const deposit = Math.round(bp) / 100;
  return { deposit, rest: Math.round(10000 - bp) / 100 };
}

/** The summary for a locale, with the same untranslated-copy fallback as the feature lines. */
export function localizedSummary(product: Product, locale: Locale, messages: Messages): string {
  const summary = product.summary;
  if (!summary) return "";
  const key = catalogueLocale(locale);
  const text = summary[key] || summary.en;
  if (key === "en" || summary[key] !== summary.en) return text;
  return messages.features.summaries[summary.en] ?? text;
}

/** Delivery time and the rest of a summary, in either language ("Delivery: 3 weeks." / "التسليم: 3 أسابيع."). */
const DELIVERY_RE = /\s*(?:Delivery|التسليم):\s*([^.]+)\.?/i;

/** Lines shown on a plan card: the spec-style ones, without the marketing sentences. */
export function cardFeatures(lines: FeatureLine[], max = 6): FeatureLine[] {
  // The length cap is here to keep a sentence out of a row meant for a word or two, not to hide a
  // feature. It was 40, which silently dropped "Weekly, tested on a copy, checkout included" — the
  // one row that explains why the top care plan costs what it does — off its own card. A value that
  // runs long now wraps onto a second line, which is the correct thing for a card to do with it.
  return lines.filter((l) => "label" in l && l.value.length <= 60).slice(0, max);
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

/**
 * What a plan renews at, when the advertised price only covers the first year.
 *
 * It comes from the store's own price list. It used to be recovered here with a regular expression
 * over an English feature line ("Normal price 2,499 EGP - you pay 1,999 EGP"), which was a
 * reasonable way to draw a number on a page and became unacceptable the moment the same figure
 * started deciding what a customer is charged a year later. The regex survives only as a fallback
 * for a store that has not published the field yet.
 */
export function normalPrices(product: Pick<Product, "features" | "renewalPrices">): Partial<Record<Currency, Money>> {
  const published = product.renewalPrices ?? {};
  if (Object.keys(published).length > 0) return published;
  const out: Partial<Record<Currency, Money>> = {};
  for (const line of product.features.en) {
    for (const m of line.matchAll(/Normal price ([\d,]+(?:\.\d{1,2})?) (EGP|USD)/g)) {
      const gross = Math.round(Number(m[1]!.replace(/,/g, "")) * 100);
      if (Number.isFinite(gross)) out[m[2] as Currency] = { gross, formatted: `${m[2]} ${m[1]}` };
    }
  }
  return out;
}
