import { Container, Empty, Fine, PageIntro, Section, SectionHeader } from "@/components/blocks";
import { CurrencyToggle, Price } from "@/components/currency";
import { CompareTable, PlanCard } from "@/components/plans";
import { Shell } from "@/components/shell";
import { pageMetadata } from "@/lib/metadata";
import type { Locale } from "@/lib/i18n";
import { fill, messagesFor } from "@/messages";
import { HIGHLIGHT, loc, screenContext, vatLine } from "./shared";

export const hosting = {
  metadata(locale: Locale) {
    const t = messagesFor(locale);
    return pageMetadata("hosting", locale, t.hosting.title, `${t.hosting.h2} ${t.hosting.lede}`);
  },
  async render(locale: Locale) {
    const { t, catalogue } = await screenContext(locale);
    const plans = catalogue.products.hosting;
    const xxl = plans.find((p) => p.options.some((o) => o.key === "max_addon_domains"));
    const addon = xxl?.options.find((o) => o.key === "max_addon_domains")?.values.find((v) => !v.isDefault && (v.prices.EGP?.gross ?? 0) > 0);
    const runsOn = plans[0] ? plans[0].features.en.find((f) => f.startsWith("Runs on:"))?.replace(/^Runs on:\s*/, "") : null;
    return (
      <Shell locale={locale} page="hosting" storeUrl={catalogue.store.url} legalName={catalogue.company.legalName[locale]}>
        <PageIntro num={t.hosting.num} title={t.hosting.h2} lede={t.hosting.lede} />
        <Section>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <p className="text-sm text-muted">{vatLine(t, catalogue)}</p>
            <CurrencyToggle label={t.common.currency} hint={t.common.currencyHint} />
          </div>
          {plans.length ? (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((p) => (
                <li key={p.slug}>
                  <PlanCard product={p} locale={locale} highlight={p.slug === HIGHLIGHT.hosting} cycleLabel={t.common.perYear} cta={t.common.order} />
                </li>
              ))}
            </ul>
          ) : (
            <Empty>{t.hosting.empty}</Empty>
          )}
          {runsOn ? (
            <p className="mt-6 text-sm text-muted">
              <span className="font-medium text-ink">{t.hosting.runsOn}:</span> <span dir="ltr">{runsOn}</span>
            </p>
          ) : null}
        </Section>
        {plans.length > 1 ? (
          <Section alt>
            <SectionHeader title={t.hosting.compareTitle} />
            <CompareTable products={plans} locale={locale} caption={t.hosting.compareCaption} exclude={["Runs on"]} perYear={t.hosting.perYear} cta={t.common.choose} />
            <Fine>{t.hosting.fine}</Fine>
          </Section>
        ) : null}
        {xxl && addon ? (
          <Section>
            <Container className="max-w-3xl px-0">
              <h2 className="text-xl font-bold text-ink">{t.hosting.addonTitle}</h2>
              <p className="mt-2 text-muted">
                {fill(t.hosting.addonBody, { price: "" })}
                <Price prices={addon.prices} locale={locale} className="font-semibold text-ink" />
              </p>
              <p className="mt-2 text-sm text-muted">
                {loc(xxl.options[0]?.name, locale)}: {xxl.options[0]?.values.map((v) => loc(v.label, locale)).join(" · ")}
              </p>
            </Container>
          </Section>
        ) : null}
      </Shell>
    );
  },
};
