import { Empty, Fine, PageIntro, Section, SectionHeader } from "@/components/blocks";
import { CurrencyToggle } from "@/components/currency";
import { CompareTable, PlanCard } from "@/components/plans";
import { Shell } from "@/components/shell";
import { pageMetadata } from "@/lib/metadata";
import type { Locale } from "@/lib/i18n";
import { messagesFor } from "@/messages";
import { HIGHLIGHT, screenContext, vatLine } from "./shared";

export const care = {
  metadata(locale: Locale) {
    const t = messagesFor(locale);
    return pageMetadata("care", locale, t.care.title, `${t.care.h2} ${t.care.lede}`);
  },
  async render(locale: Locale) {
    const { t, catalogue, company } = await screenContext(locale);
    const plans = catalogue.products.care;
    return (
      <Shell locale={locale} page="care" storeUrl={catalogue.store.url} legalName={company.legalName} address={company.address} supportEmail={company.supportEmail}>
        <PageIntro kicker={t.care.title} title={t.care.h2} lede={t.care.lede} />
        <Section>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <p className="text-sm text-muted">{vatLine(t, catalogue)}</p>
            <CurrencyToggle label={t.common.currency} hint={t.common.currencyHint} />
          </div>
          {plans.length ? (
            <ul className="grid gap-5 pt-3 sm:grid-cols-2 lg:grid-cols-4">
              {plans.map((p) => (
                <li key={p.slug}>
                  <PlanCard product={p} locale={locale} highlight={p.slug === HIGHLIGHT.care} cycleLabel={t.common.perYear} cta={t.common.choose} />
                </li>
              ))}
            </ul>
          ) : (
            <Empty>{t.care.empty}</Empty>
          )}
        </Section>
        {plans.length > 1 ? (
          <Section tone="alt">
            <SectionHeader title={t.care.compareTitle} />
            <CompareTable products={plans} locale={locale} caption={t.care.compareCaption} perYear={t.common.perYear} cta={t.common.choose} />
            <Fine>{t.care.fine}</Fine>
          </Section>
        ) : null}
      </Shell>
    );
  },
};
