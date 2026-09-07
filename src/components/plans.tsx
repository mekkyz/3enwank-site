import type { Product } from "@/lib/catalogue";
import { cardFeatures, compareRows, localizedFeatures, localizedSummary, normalPrices, type CompareRow } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { messagesFor } from "@/messages";
import { Val } from "./bidi";
import { ButtonLink, Card, Check } from "./blocks";
import { Price } from "./currency";

/** One plan, from the catalogue. Server component; only the price is client-rendered (currency switch). */
export function PlanCard({ product, locale, highlight = false, cycleLabel, cta, meta, compact = false }: { product: Product; locale: Locale; highlight?: boolean; cycleLabel: string; cta: string; meta?: string; compact?: boolean }) {
  const t = messagesFor(locale);
  const features = cardFeatures(localizedFeatures(product, locale, t), compact ? 4 : 6);
  const summary = localizedSummary(product, locale, t);
  const name = product.name[locale === "en" ? "en" : "ar"] || product.name.en;
  return (
    <Card highlight={highlight} className="flex h-full flex-col" as="article">
      {highlight ? <p className="absolute -top-3.5 start-6 rounded-full bg-brand px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white">{t.common.mostChosen}</p> : null}
      <h3 className="text-2xl font-extrabold text-ink">
        <Val>{name}</Val>
      </h3>
      {summary ? <p className="mt-1 text-sm text-muted">{summary}</p> : null}
      <p className="mt-5 flex flex-wrap items-baseline gap-x-2">
        <Price prices={product.prices} normal={normalPrices(product)} locale={locale} fallback={t.common.notAvailable} className="text-[2rem] font-extrabold leading-none tracking-tight text-ink" />
        <span className="text-sm text-muted">{cycleLabel}</span>
      </p>
      {meta ? <p className="mt-1.5 text-sm text-muted">{meta}</p> : null}
      {features.length ? (
        <ul className="mt-5 space-y-2.5 border-t border-line pt-5 text-[15px]">
          {features.map((f) =>
            "label" in f ? (
              <li key={f.label} className="flex justify-between gap-3">
                <span className="text-muted">{f.label}</span>
                <Val className="font-semibold text-ink">{f.value}</Val>
              </li>
            ) : null,
          )}
        </ul>
      ) : null}
      <div className="mt-auto pt-6">
        <ButtonLink href={product.storeUrl} variant={highlight ? "primary" : "outline"} className="w-full" external>
          {cta}
        </ButtonLink>
      </div>
    </Card>
  );
}

/** Feature-by-feature table with a price row and order links; scrolls inside its own box on small screens. */
export function CompareTable({ products, locale, caption, exclude = [], perYear, cta }: { products: Product[]; locale: Locale; caption: string; exclude?: string[]; perYear: string; cta: string }) {
  const t = messagesFor(locale);
  const rows: CompareRow[] = compareRows(products, locale, t, exclude);
  if (products.length < 2 || rows.length === 0) return null;
  const name = (p: Product) => p.name[locale === "en" ? "en" : "ar"] || p.name.en;
  return (
    <div data-reveal className="overflow-x-auto rounded-xl border border-line bg-panel">
      <table className="w-full min-w-[44rem] text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className="nowrap px-4 py-3 text-start font-semibold text-muted">
              {t.hosting.plan}
            </th>
            {products.map((p) => (
              <th key={p.slug} scope="col" className="nowrap px-4 py-3 text-center text-base font-extrabold text-ink">
                <Val>{name(p)}</Val>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-line last:border-0">
              <th scope="row" className="nowrap px-4 py-2.5 text-start font-medium text-muted">
                {row.label}
              </th>
              {row.values.map((v, i) => (
                <td key={i} className="nowrap px-4 py-2.5 text-center">
                  <Val>{v || t.common.notAvailable}</Val>
                </td>
              ))}
            </tr>
          ))}
          <tr className="border-t-2 border-line bg-surface-alt">
            <th scope="row" className="nowrap px-4 py-3 text-start font-semibold text-muted">
              {perYear}
            </th>
            {products.map((p) => (
              <td key={p.slug} className="nowrap px-4 py-3 text-center">
                <Price prices={p.prices} locale={locale} fallback={t.common.notAvailable} className="font-extrabold text-ink" />
              </td>
            ))}
          </tr>
          <tr>
            <td className="px-4 py-3" />
            {products.map((p) => (
              <td key={p.slug} className="px-3 py-3 text-center">
                <ButtonLink href={p.storeUrl} variant="outline" className="w-full" external>
                  {cta}
                </ButtonLink>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/** Check-listed free-text features of a build package. */
export function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="mt-5 space-y-2.5 border-t border-line pt-5 text-[15px]">
      {items.map((f) => (
        <li key={f} className="flex gap-2.5">
          <Check />
          <span>{f}</span>
        </li>
      ))}
    </ul>
  );
}
