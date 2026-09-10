import { Empty, Fine, PageIntro, Section, SectionHeader } from "@/components/blocks";
import { CompareTable, PlanCard } from "@/components/plans";
import { Shell } from "@/components/shell";
import { pageMetadata } from "@/lib/metadata";
import type { Locale } from "@/lib/i18n";
import { messagesFor } from "@/messages";
import { HIGHLIGHT, screenContext, vatLine } from "./shared";

export const hosting = {
  metadata(locale: Locale) {
    const t = messagesFor(locale);
    return pageMetadata("hosting", locale, t.hosting.title, `${t.hosting.h2} ${t.hosting.lede}`);
  },
  async render(locale: Locale) {
    const { t, catalogue, company, trust } = await screenContext(locale);
    const plans = catalogue.products.hosting;
    return (
      <Shell locale={locale} page="hosting" storeUrl={catalogue.store.url} legalName={company.legalName} supportEmail={company.contactEmail} trust={trust} assistantEnabled={catalogue.assistant.enabled} turnstileSiteKey={catalogue.assistant.turnstileSiteKey}>
        <PageIntro kicker={t.hosting.title} title={t.hosting.h2} lede={t.hosting.lede} />
        <Section>
          <p className="mb-8 text-sm text-muted">{vatLine(t, catalogue)}</p>
          {plans.length ? (
            <ul data-reveal-stagger className="grid gap-5 pt-3 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((p) => (
                <li key={p.slug}>
                  <PlanCard product={p} locale={locale} highlight={p.slug === HIGHLIGHT.hosting} cycleLabel={t.common.perYear} cta={t.common.order} />
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
            <Fine>{t.hosting.fine}</Fine>
          </Section>
        ) : null}
      </Shell>
    );
  },
};
