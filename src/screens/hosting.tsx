import { Empty, PageIntro, Section, SectionHeader } from "@/components/blocks";
import { CompareTable, PlanCard } from "@/components/plans";
import { Shell } from "@/components/shell";
import { JsonLd } from "@/components/json-ld";
import { graph, productLd } from "@/lib/structured-data";
import { pageMetadata } from "@/lib/metadata";
import type { Locale } from "@/lib/i18n";
import { messagesFor } from "@/messages";
import { HIGHLIGHT, screenContext } from "./shared";
import { vatLine } from "@/lib/vat";

export const hosting = {
  metadata(locale: Locale) {
    const t = messagesFor(locale);
    return pageMetadata("hosting", locale, t.hosting.title, `${t.hosting.h2} ${t.hosting.lede}`);
  },
  async render(locale: Locale) {
    const { t, catalogue, company, trust } = await screenContext(locale);
    const vat = vatLine(t, catalogue);
    const plans = catalogue.products.hosting;
    return (
      <Shell locale={locale} page="hosting" storeUrl={catalogue.store.url} legalName={company.legalName} supportEmail={company.contactEmail} trust={trust} assistantEnabled={catalogue.assistant.enabled} turnstileSiteKey={catalogue.assistant.turnstileSiteKey}>
        {/* Each plan on this page as a schema.org Product with its offers, from the same catalogue rows the cards draw. */}
        {plans.length ? <JsonLd data={graph(plans.map((p) => productLd(p, locale, "hosting")))} /> : null}
        <PageIntro kicker={t.hosting.title} title={t.hosting.h2} lede={t.hosting.lede} />
        <Section>
          {vat ? <p className="mb-8 text-sm text-muted">{vat}</p> : null}
          {plans.length ? (
            <ul className="grid gap-5 pt-3 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((p) => (
                <li key={p.slug}>
                  <PlanCard product={p} locale={locale} highlight={p.slug === HIGHLIGHT.hosting} cycleLabel={t.common.perYear} cta={t.common.order} heading="h2" />
                </li>
              ))}
            </ul>
          ) : (
            <Empty>{t.hosting.empty}</Empty>
          )}
        </Section>
        {plans.length > 1 ? (
          <Section tone="alt">
            <SectionHeader title={t.hosting.compareTitle} />
            <CompareTable products={plans} locale={locale} caption={t.hosting.compareCaption} exclude={["Runs on"]} perYear={t.hosting.perYear} cta={t.common.choose} />
          </Section>
        ) : null}
      </Shell>
    );
  },
};
