import { Empty, PageIntro, Section, SectionHeader } from "@/components/blocks";
import { PlanCard } from "@/components/plans";
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
    const { t, catalogue, company, trust } = await screenContext(locale);
    const plans = catalogue.products.care;
    return (
      <Shell locale={locale} page="care" storeUrl={catalogue.store.url} legalName={company.legalName} supportEmail={company.contactEmail} trust={trust} assistantEnabled={catalogue.assistant.enabled} turnstileSiteKey={catalogue.assistant.turnstileSiteKey}>
        <PageIntro kicker={t.care.title} title={t.care.h2} lede={t.care.lede} />
        <Section>
          <p className="mb-8 text-sm text-muted">{vatLine(t, catalogue)}</p>
          {plans.length ? (
            <ul data-reveal-stagger className="grid gap-5 pt-3 sm:grid-cols-2 lg:grid-cols-3">
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
        {/*
         * What the rows mean, rather than the same rows again in a table. The cards say how often;
         * a customer deciding between them needs to know what an update is, what counts as a
         * content change, and what happens when something breaks — none of which fits in a cell.
         */}
        <Section tone="alt">
          <SectionHeader title={t.care.explainTitle} />
          <ul className="grid gap-x-12 gap-y-7 sm:grid-cols-2">
            {t.care.explain.map((e) => (
              <li key={e.title} className="border-t border-line pt-4">
                <h3 className="font-extrabold text-ink">{e.title}</h3>
                <p className="mt-1.5 text-pretty text-[15px] leading-relaxed text-muted">{e.body}</p>
              </li>
            ))}
          </ul>
        </Section>
      </Shell>
    );
  },
};
