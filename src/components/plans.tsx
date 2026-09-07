import type { Product } from "@/lib/catalogue";
import { cardFeatures, compareRows, localizedFeatures, localizedSummary, type CompareRow } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { messagesFor } from "@/messages";
import { ButtonLink, Card, Check } from "./blocks";
import { Price } from "./currency";

/** One plan, from the catalogue. Server component; only the price is client-rendered (currency switch). */
export function PlanCard({ product, locale, highlight = false, cycleLabel, cta, meta }: { product: Product; locale: Locale; highlight?: boolean; cycleLabel: string; cta: string; meta?: string }) {
  const t = messagesFor(locale);
  const features = cardFeatures(localizedFeatures(product, locale, t));
  const summary = localizedSummary(product, locale, t);
  return (
    <Card highlight={highlight} className="flex flex-col">
      {highlight ? <p className="mb-2 inline-block w-fit rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand-strong">{t.common.mostPopular}</p> : null}
      <h3 className="text-xl font-bold text-ink">{product.name[locale] || product.name.en}</h3>
      {summary ? <p className="mt-1 text-sm text-muted">{summary}</p> : null}
      <p className="mt-4 flex flex-wrap items-baseline gap-x-2">
        <Price prices={product.prices} locale={locale} className="text-3xl font-bold text-ink" />
        <span className="text-sm text-muted">{cycleLabel}</span>
      </p>
      {meta ? <p className="mt-1 text-sm text-muted">{meta}</p> : null}
      {features.length ? (
        <ul className="mt-4 space-y-2 text-sm text-ink">
          {features.map((f) =>
            "label" in f ? (
              <li key={f.label} className="flex gap-2">
                <Check />
                <span>
                  <span className="text-muted">{f.label}:</span>{" "}
                  <span className="tabular" dir="auto">
                    {f.value}
                  </span>
                </span>
              </li>
            ) : null,
          )}
        </ul>
      ) : null}
      <div className="mt-auto pt-6">
        <ButtonLink href={product.storeUrl} variant={highlight ? "primary" : "secondary"} className="w-full" external>
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
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-panel">
      <table className="w-full min-w-[40rem] text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className="px-4 py-3 text-start font-medium text-muted">
              {t.hosting.plan}
            </th>
            {products.map((p) => (
              <th key={p.slug} scope="col" className="px-4 py-3 text-center text-base font-bold text-ink">
                {p.name[locale] || p.name.en}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-line last:border-0">
              <th scope="row" className="px-4 py-2.5 text-start font-medium text-muted">
                {row.label}
              </th>
              {row.values.map((v, i) => (
                <td key={i} className="px-4 py-2.5 text-center tabular" dir="auto">
                  {v}
                </td>
              ))}
            </tr>
          ))}
          <tr className="border-t border-line bg-surface/60">
            <th scope="row" className="px-4 py-3 text-start font-medium text-muted">
              {perYear}
            </th>
            {products.map((p) => (
              <td key={p.slug} className="px-4 py-3 text-center">
                <Price prices={p.prices} locale={locale} className="font-bold text-ink" />
              </td>
            ))}
          </tr>
          <tr>
            <td className="px-4 py-3" />
            {products.map((p) => (
              <td key={p.slug} className="px-4 py-3 text-center">
                <ButtonLink href={p.storeUrl} variant="secondary" className="w-full" external>
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
