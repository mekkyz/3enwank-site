import type { Product } from "@/lib/catalogue";
import { cardFeatures, compareRows, localizedFeatures, localizedSummary, normalPrices, type CompareRow } from "@/lib/format";
import { storeLink, type Locale } from "@/lib/i18n";
import { messagesFor } from "@/messages";
import { Val } from "./bidi";
import { ButtonLink, Card, Check } from "./blocks";
import { Price, RenewalNote } from "./currency";

/**
 * One plan, from the catalogue. Server component; only the price is client-rendered (currency switch).
 *
 * `heading` is the level the card's name takes. On the hosting and care pages the cards come
 * straight after the page's h1, so they are h2; anywhere they sit under a section heading they
 * are h3. The level was fixed at h3, which skipped h2 on both pages for a screen reader's outline.
 */
export function PlanCard({ product, locale, highlight = false, cycleLabel, cta, meta, compact = false, heading: Heading = "h3" }: { product: Product; locale: Locale; highlight?: boolean; cycleLabel: string; cta: string; meta?: string; compact?: boolean; heading?: "h2" | "h3" }) {
  const t = messagesFor(locale);
  const features = cardFeatures(localizedFeatures(product, locale, t), compact ? 4 : 6);
  const summary = localizedSummary(product, locale, t);
  const name = product.name[locale === "en" ? "en" : "ar"] || product.name.en;
  return (
    <Card highlight={highlight} className="flex h-full flex-col" as="article">
      {/* Brand-strong on brand-soft, as the home page's pill: white on the dark theme's brand purple was 3.37:1 at 11px. */}
      {highlight ? <p className="absolute -top-3.5 start-6 rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-brand-strong">{t.common.mostChosen}</p> : null}
      <Heading className="text-2xl font-extrabold text-ink">
        <Val>{name}</Val>
      </Heading>
      {summary ? <p className="mt-1 text-sm text-muted">{summary}</p> : null}
      {/*
       * One line, at the longest price this catalogue can produce. EGP 19,999 beside a struck-out
       * EGP 29,999 and "per year" came to more than the card is wide, so the cycle label wrapped on
       * XXL alone and that card's price sat a line lower than every other card's. The struck figure
       * is a step smaller — it is repeated in full on the line below — and the price itself is two
       * pixels down from 2rem, which is enough for the longest row with room to spare.
       */}
      <p className="mt-5 flex flex-wrap items-baseline gap-x-1.5">
        <Price prices={product.prices} normal={normalPrices(product)} locale={locale} fallback={t.common.notAvailable} className="text-[1.875rem] font-extrabold leading-none tracking-tight text-ink" />
        <span className="text-sm text-muted">{cycleLabel}</span>
      </p>
      {/*
       * The advertised price buys the first year; the struck-out figure beside it is what the plan
       * costs from the second onwards. Saying so on the card is the only place a customer can read
       * it before they decide, and it is what the store now actually charges at renewal.
       */}
      <RenewalNote prices={normalPrices(product)} locale={locale} label={t.common.renewsAt} className="mt-1.5 text-sm font-semibold text-muted" />
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
        <ButtonLink href={storeLink(product.storeUrl, locale)} variant={highlight ? "primary" : "outline"} className="w-full" external>
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
  const anyRenewal = products.some((p) => Object.keys(normalPrices(p)).length > 0);
  return (
    <div>
      {/*
       * The table is 44rem wide and scrolls inside its box on anything narrower, which on a phone
       * cut it mid-column with nothing to say the rest was there: a second plan half visible reads
       * as a layout fault, not as a table to swipe. One line above it says so, and only where it
       * applies: the box holds the whole table from 784px, which is the 44rem (704px) plus the
       * container's 64px of padding and the 15px a classic scrollbar keeps (scrollbar-gutter:
       * stable on <html>), so the line is gone at the first width where there is nothing to swipe.
       */}
      <p className="mb-2 text-xs text-muted min-[784px]:hidden">{t.hosting.scrollHint}</p>
      <div className="overflow-x-auto rounded-xl border border-line bg-panel">
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
          {/*
           * Two rows, not one. The first-year price and the renewal price are the two figures a
           * visitor needs, and putting the "Renews at" note under the price wrapped a cell the
           * render check requires to stay on one line. As separate rows each cell is one figure,
           * and the first row is only called "First year" when something actually renews at a
           * different price; on a catalogue without renewal prices it stays "Per year".
           */}
          <tr className="border-t-2 border-line bg-surface-alt">
            <th scope="row" className="nowrap px-4 py-3 text-start font-semibold text-muted">
              {anyRenewal ? t.hosting.firstYear : perYear}
            </th>
            {products.map((p) => (
              <td key={p.slug} className="nowrap px-4 py-3 text-center">
                <Price prices={p.prices} locale={locale} fallback={t.common.notAvailable} className="justify-center font-extrabold text-ink" />
              </td>
            ))}
          </tr>
          {anyRenewal ? (
            <tr className="border-b border-line bg-surface-alt">
              <th scope="row" className="nowrap px-4 py-2.5 text-start font-medium text-muted">
                {t.hosting.renewsAt}
              </th>
              {products.map((p) => (
                <td key={p.slug} className="nowrap px-4 py-2.5 text-center">
                  <Price prices={normalPrices(p)} locale={locale} fallback={t.common.notAvailable} className="justify-center font-semibold text-ink" />
                </td>
              ))}
            </tr>
          ) : null}
          <tr>
            <td className="px-4 py-3" />
            {products.map((p) => (
              <td key={p.slug} className="px-3 py-3 text-center">
                <ButtonLink href={storeLink(p.storeUrl, locale)} variant="outline" className="w-full" external>
                  {cta}
                </ButtonLink>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      </div>
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
