import { Empty, PageIntro, Section } from "@/components/blocks";
import { PlanCard } from "@/components/plans";
import { PricedText } from "@/components/currency";
import { cheapestPrices } from "@/lib/format";
import { Shell } from "@/components/shell";
import { JsonLd } from "@/components/json-ld";
import { graph, productLd } from "@/lib/structured-data";
import { pageMetadata } from "@/lib/metadata";
import type { Locale } from "@/lib/i18n";
import { messagesFor } from "@/messages";
import { HIGHLIGHT, screenContext, whatsappNumber } from "./shared";
import { vatLine } from "@/lib/vat";

export const care = {
  metadata(locale: Locale) {
    const t = messagesFor(locale);
    return pageMetadata("care", locale, t.care.title, `${t.care.h2} ${t.care.lede}`);
  },
  async render(locale: Locale) {
    const { t, catalogue, company, trust } = await screenContext(locale);
    const vat = vatLine(t, catalogue);
    const plans = catalogue.products.care;
    return (
      <Shell locale={locale} page="care" storeUrl={catalogue.store.url} legalName={company.legalName} trust={trust} whatsapp={whatsappNumber(catalogue)} assistantEnabled={catalogue.assistant.enabled} turnstileSiteKey={catalogue.assistant.turnstileSiteKey}>
        {/* Each plan on this page as a schema.org Product with its offers, from the same catalogue rows the cards draw. */}
        {plans.length ? <JsonLd data={graph(plans.map((p) => productLd(p, locale, "care")))} /> : null}
        {/* The intro names the offer and its lowest yearly price, following the currency switch (S13). */}
        <PageIntro title={<PricedText template={t.care.h2Price} prices={cheapestPrices(plans.map((p) => p.prices))} locale={locale} fallback={t.care.h2} />} lede={t.care.lede} />
        <Section>
          {plans.length ? (
            // No pt-3: it made room for the notched badge, which sits inline now (S10).
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((p) => (
                <li key={p.slug}>
                  <PlanCard product={p} locale={locale} highlight={p.slug === HIGHLIGHT.care} cycleLabel={t.common.perYear} cta={t.common.choose} heading="h2" />
                </li>
              ))}
            </ul>
          ) : (
            <Empty>{t.care.empty}</Empty>
          )}
          {/* Under the prices, not above them (site review justDo); only while VAT is charged. */}
          {vat ? <p className="mt-4 text-sm text-muted">{vat}</p> : null}
          {/*
           * Three footnotes under the cards, not a section of their own: they qualify the rows
           * directly above them, and a heading would make them look like a second thing to read.
           */}
          <ul className="mt-8 space-y-1.5 text-sm text-muted">
            {t.care.notes.map((n) => (
              <li key={n.title} className="flex gap-2">
                <span aria-hidden="true">*</span>
                <span>
                  <span className="font-semibold text-ink">{n.title}:</span> {n.body}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      </Shell>
    );
  },
};
