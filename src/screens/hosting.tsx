import { ArrowLink, Empty, PageIntro, Section, SectionHeader } from "@/components/blocks";
import { CompareTable, PlanCard } from "@/components/plans";
import { Price } from "@/components/currency";
import { Val } from "@/components/bidi";
import { Shell } from "@/components/shell";
import { JsonLd } from "@/components/json-ld";
import { graph, productLd } from "@/lib/structured-data";
import { pageMetadata } from "@/lib/metadata";
import { contactHref, type Locale } from "@/lib/i18n";
import { waHref } from "@/lib/whatsapp";
import { messagesFor } from "@/messages";
import { HIGHLIGHT, loc, screenContext, whatsappNumber } from "./shared";
import { vatLine } from "@/lib/vat";

/**
 * The plans the guide above the cards points at, in the order of hosting.guide.rows (S11): one small
 * site, a business site with mail for its people, a shop or a busy site. Chosen by what the catalogue's
 * own summaries say each is for ("One small website", "Small business website", "Busy website or small
 * store"). A slug the store no longer has drops its row rather than the guide.
 */
const GUIDE = ["hosting-xs", "hosting-s", "hosting-l"] as const;

export const hosting = {
  metadata(locale: Locale) {
    const t = messagesFor(locale);
    return pageMetadata("hosting", locale, t.hosting.title, `${t.hosting.h2} ${t.hosting.lede}`);
  },
  async render(locale: Locale) {
    const { t, catalogue, company, trust } = await screenContext(locale);
    const vat = vatLine(t, catalogue);
    const plans = catalogue.products.hosting;
    const whatsapp = whatsappNumber(catalogue);
    const guide = GUIDE.flatMap((slug, i) => {
      const plan = plans.find((p) => p.slug === slug);
      return plan ? [{ have: t.hosting.guide.rows[i]!, plan }] : [];
    });
    return (
      <Shell locale={locale} page="hosting" storeUrl={catalogue.store.url} legalName={company.legalName} trust={trust} whatsapp={whatsappNumber(catalogue)} assistantEnabled={catalogue.assistant.enabled} turnstileSiteKey={catalogue.assistant.turnstileSiteKey}>
        {/* Each plan on this page as a schema.org Product with its offers, from the same catalogue rows the cards draw. */}
        {plans.length ? <JsonLd data={graph(plans.map((p) => productLd(p, locale, "hosting")))} /> : null}
        {/* No kicker above the heading (S13): the h1 names the page. */}
        <PageIntro title={t.hosting.h2} lede={t.hosting.lede} />
        <Section>
          {/*
           * "If you have this, pick that" (S11): three rows on hairlines above the six cards, each naming
           * a situation, the plan for it (a jump to its card) and its first-year price.
           */}
          {guide.length ? (
            <div className="mb-10 max-w-3xl">
              <h2 className="text-xl font-extrabold text-ink">{t.hosting.guide.title}</h2>
              <ul className="mt-3 border-t border-line">
                {guide.map(({ have, plan }) => (
                  <li key={plan.slug} className="flex flex-wrap items-center justify-between gap-x-6 border-b border-line py-1.5">
                    <span className="py-2 text-base text-ink">{have}</span>
                    <span className="flex flex-wrap items-baseline gap-x-2 text-sm text-muted">
                      <a href={`#${plan.slug}`} className="inline-flex min-h-11 items-center gap-1 font-bold text-brand-strong hover:text-brand">
                        {t.hosting.guide.pick} <Val>{loc(plan.name, locale)}</Val>
                      </a>
                      <Price prices={plan.prices} locale={locale} fallback={t.common.notAvailable} className="font-semibold text-ink" />
                      {t.common.perYear}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {plans.length ? (
            // No pt-3: that room was for the badge notched into a card's top border, which sits inline now (S10).
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((p) => (
                // An id per card for the guide's jumps, landing clear of the 69px sticky bar.
                <li key={p.slug} id={p.slug} className="scroll-mt-24">
                  <PlanCard product={p} locale={locale} highlight={p.slug === HIGHLIGHT.hosting} cycleLabel={t.common.perYear} cta={t.common.order} heading="h2" />
                </li>
              ))}
            </ul>
          ) : (
            <Empty>{t.hosting.empty}</Empty>
          )}
          {/* Under the prices it qualifies, not above them pushing the cards down (site review justDo); drawn only while VAT is charged. */}
          {vat ? <p className="mt-4 text-sm text-muted">{vat}</p> : null}
          {/*
           * The one line that matches the home page's moving section (S6), under the plans a mover is
           * choosing from, with the same action: WhatsApp with the moving line written, or the contact
           * form on "Move my site" when there is no number.
           */}
          <p className="mt-8 flex flex-wrap items-center gap-x-4 border-t border-line pt-5 text-base text-muted">
            {t.hosting.moveLine}
            <ArrowLink href={whatsapp ? waHref(whatsapp, t.home.move.waText) : contactHref(locale, { need: "move" })}>{t.home.move.cta}</ArrowLink>
          </p>
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
