import { ButtonLink, Card, Empty, Fine, PageIntro, Section } from "@/components/blocks";
import { CurrencyToggle, Price } from "@/components/currency";
import { FeatureList } from "@/components/plans";
import { Shell } from "@/components/shell";
import { deliveryFrom, depositSplit, localizedFeatures, localizedSummary, summaryWithoutDelivery } from "@/lib/format";
import { pageMetadata } from "@/lib/metadata";
import { anchorFor, storeLink, type Locale } from "@/lib/i18n";
import { fill, messagesFor } from "@/messages";
import { HIGHLIGHT, loc, screenContext, vatLine } from "./shared";

export const websites = {
  metadata(locale: Locale) {
    const t = messagesFor(locale);
    return pageMetadata("websites", locale, t.websites.title, `${t.websites.h2} ${t.websites.lede}`);
  },
  async render(locale: Locale) {
    const { t, catalogue, company } = await screenContext(locale);
    const packages = catalogue.products.build;
    return (
      <Shell locale={locale} page="websites" storeUrl={catalogue.store.url} legalName={company.legalName} address={company.address} supportEmail={company.supportEmail} assistantEnabled={catalogue.assistant.enabled}>
        <PageIntro kicker={t.websites.title} title={t.websites.h2} lede={t.websites.lede} />
        <Section>
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-muted">{vatLine(t, catalogue)}</p>
            <CurrencyToggle label={t.common.currency} hint={t.common.currencyHint} />
          </div>
          {packages.length ? (
            <ol data-reveal-stagger className="grid gap-5 pt-3 sm:grid-cols-2 lg:grid-cols-3">
              {packages.map((p) => {
                const summary = localizedSummary(p, locale, t);
                const delivery = deliveryFrom(summary) ?? deliveryFrom(p.summary?.en);
                // Bullets are the free-text lines; price and billing notes are shown from the price fields instead.
                const features = localizedFeatures(p, locale, t).flatMap((f, i) => ("text" in f && !/\b(EGP|USD|VAT)\b|Hosting and Care/.test(p.features.en[i] ?? f.text) ? [f.text] : []));
                const highlight = p.slug === HIGHLIGHT.build;
                return (
                  <li key={p.slug}>
                    <Card highlight={highlight} className="flex h-full flex-col" as="article">
                      {highlight ? <p className="absolute -top-3.5 start-6 rounded-full bg-brand px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white">{t.common.mostChosen}</p> : null}
                      <h2 className="text-2xl font-extrabold text-ink">{loc(p.name, locale)}</h2>
                      {summary ? <p className="mt-1 text-sm text-muted">{summaryWithoutDelivery(summary) || summary}</p> : null}
                      <p className="mt-5 flex flex-wrap items-baseline gap-x-2">
                        <Price prices={p.prices} locale={locale} fallback={t.common.notAvailable} className="text-[2rem] font-extrabold leading-none tracking-tight text-ink" />
                        <span className="text-sm text-muted">{t.common.oneTime}</span>
                      </p>
                      <p className="mt-1.5 text-sm text-muted">
                        {fill(t.websites.deposit, depositSplit(p))}
                        {delivery ? (
                          <>
                            {" "}
                            · {t.websites.delivery}: {delivery}
                          </>
                        ) : null}
                      </p>
                      {features.length ? <FeatureList items={features} /> : null}
                      <div className="mt-auto pt-6">
                        <ButtonLink href={storeLink(p.storeUrl, locale)} variant={highlight ? "primary" : "outline"} className="w-full" external>
                          {t.common.order}
                        </ButtonLink>
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ol>
          ) : (
            <Empty>{t.websites.empty}</Empty>
          )}
          <Fine>{t.websites.fine}</Fine>
        </Section>
        <Section tone="alt">
          <Card className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-2xl font-extrabold text-ink">{t.websites.customTitle}</h2>
              <p className="mt-2 text-muted">{t.websites.customBody}</p>
              <p className="mt-2 text-sm font-semibold text-ink">{t.websites.customMeta}</p>
            </div>
            <ButtonLink href={anchorFor("contact", locale)}>{t.websites.customCta}</ButtonLink>
          </Card>
        </Section>
      </Shell>
    );
  },
};
