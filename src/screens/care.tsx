import { Empty, PageIntro, Section } from "@/components/blocks";
import { PlanCard } from "@/components/plans";
import { Shell } from "@/components/shell";
import { pageMetadata } from "@/lib/metadata";
import type { Locale } from "@/lib/i18n";
import { messagesFor } from "@/messages";
import { HIGHLIGHT, screenContext } from "./shared";
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
      <Shell locale={locale} page="care" storeUrl={catalogue.store.url} legalName={company.legalName} supportEmail={company.contactEmail} trust={trust} assistantEnabled={catalogue.assistant.enabled} turnstileSiteKey={catalogue.assistant.turnstileSiteKey}>
        <PageIntro kicker={t.care.title} title={t.care.h2} lede={t.care.lede} />
        <Section>
          {vat ? <p className="mb-8 text-sm text-muted">{vat}</p> : null}
          {plans.length ? (
            <ul className="grid gap-5 pt-3 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((p) => (
                <li key={p.slug}>
                  <PlanCard product={p} locale={locale} highlight={p.slug === HIGHLIGHT.care} cycleLabel={t.common.perYear} cta={t.common.choose} heading="h2" />
                </li>
              ))}
            </ul>
          ) : (
            <Empty>{t.care.empty}</Empty>
          )}
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
