import { Container, Empty, Fine, PageIntro, Section, SectionHeader } from "@/components/blocks";
import { CurrencyToggle, Price } from "@/components/currency";
import { CompareTable, PlanCard } from "@/components/plans";
import { Shell } from "@/components/shell";
import { localizedValue } from "@/lib/format";
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
    const { t, catalogue, company } = await screenContext(locale);
    const plans = catalogue.products.hosting;
    const xxl = plans.find((p) => p.options.some((o) => o.key === "max_addon_domains"));
    const addonOption = xxl?.options.find((o) => o.key === "max_addon_domains");
    const addon = addonOption?.values.find((v) => !v.isDefault && (v.prices.EGP?.gross ?? 0) > 0);
    // The same list the home page shows, in the page's language (the catalogue only carries the English sentence).
    const runsOn = plans.length ? t.home.stack.join(" · ") : null;
    // The price sits mid-sentence and is a client component (currency toggle), so the copy is split around it.
    const [addonBefore, addonAfter] = t.hosting.addonBody.split("{price}");
    return (
      <Shell locale={locale} page="hosting" storeUrl={catalogue.store.url} legalName={company.legalName} address={company.address} supportEmail={company.supportEmail} assistantEnabled={catalogue.assistant.enabled} turnstileSiteKey={catalogue.assistant.turnstileSiteKey}>
        <PageIntro kicker={t.hosting.title} title={t.hosting.h2} lede={t.hosting.lede} />
        <Section>
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-muted">{vatLine(t, catalogue)}</p>
            <CurrencyToggle label={t.common.currency} hint={t.common.currencyHint} />
          </div>
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
          {runsOn ? (
            <p className="mt-8 text-sm text-muted">
              <span className="font-semibold text-ink">{t.hosting.runsOn}:</span> {runsOn}
            </p>
          ) : null}
        </Section>
        {plans.length > 1 ? (
          <Section tone="alt">
            <SectionHeader title={t.hosting.compareTitle} />
            <CompareTable products={plans} locale={locale} caption={t.hosting.compareCaption} exclude={["Runs on"]} perYear={t.hosting.perYear} cta={t.common.choose} />
            <Fine>{t.hosting.fine}</Fine>
          </Section>
        ) : null}
        {xxl && addon && addonOption ? (
          <Section>
            <Container className="max-w-3xl px-0">
              <h2 className="text-2xl font-extrabold text-ink">{t.hosting.addonTitle}</h2>
              <p className="mt-3 text-muted">
                {addonBefore}
                <Price prices={addon.prices} locale={locale} fallback={t.common.notAvailable} className="font-bold text-ink" />
                {addonAfter}
              </p>
              <p className="mt-2 text-sm text-muted">
                {localizedValue(addonOption.name, locale, t)}: {addonOption.values.map((v) => localizedValue(v.label, locale, t)).join(", ")}
              </p>
            </Container>
          </Section>
        ) : null}
      </Shell>
    );
  },
};
