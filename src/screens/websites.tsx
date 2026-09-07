import { ButtonLink, Card, Check, Empty, Fine, PageIntro, Section } from "@/components/blocks";
import { CurrencyToggle, Price } from "@/components/currency";
import { Shell } from "@/components/shell";
import { deliveryFrom, localizedFeatures, localizedSummary, summaryWithoutDelivery } from "@/lib/format";
import { pageMetadata } from "@/lib/metadata";
import { pathFor, type Locale } from "@/lib/i18n";
import { messagesFor } from "@/messages";
import { HIGHLIGHT, loc, screenContext, vatLine } from "./shared";

export const websites = {
  metadata(locale: Locale) {
    const t = messagesFor(locale);
    return pageMetadata("websites", locale, t.websites.title, `${t.websites.h2} ${t.websites.lede}`);
  },
  async render(locale: Locale) {
    const { t, catalogue } = await screenContext(locale);
    const packages = catalogue.products.build;
    return (
      <Shell locale={locale} page="websites" storeUrl={catalogue.store.url} legalName={catalogue.company.legalName[locale]}>
        <PageIntro num={t.websites.num} title={t.websites.h2} lede={t.websites.lede} />
        <Section>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <p className="text-sm text-muted">{vatLine(t, catalogue)}</p>
            <CurrencyToggle label={t.common.currency} hint={t.common.currencyHint} />
          </div>
          {packages.length ? (
            <ol className="space-y-4">
              {packages.map((p) => {
                const summary = localizedSummary(p, locale, t);
                const delivery = deliveryFrom(summary) ?? deliveryFrom(p.summary?.en);
                // Bullets are the free-text lines; price and billing notes are shown from the price fields instead.
                const features = localizedFeatures(p, locale, t).filter((f, i) => "text" in f && !/\b(EGP|USD|VAT)\b|Hosting and Care/.test(p.features.en[i] ?? f.text));
                const highlight = p.slug === HIGHLIGHT.build;
                return (
                  <li key={p.slug}>
                    <Card highlight={highlight} className="grid gap-5 md:grid-cols-[1fr_auto_auto] md:items-start">
                      <div>
                        {highlight ? <p className="mb-2 inline-block rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand-strong">{t.common.mostPopular}</p> : null}
                        <h2 className="text-xl font-bold text-ink">{loc(p.name, locale)}</h2>
                        {summary ? <p className="mt-1 text-muted">{summaryWithoutDelivery(summary) || summary}</p> : null}
                        {features.length ? (
                          <ul className="mt-3 grid gap-1.5 text-sm text-ink sm:grid-cols-2">
                            {features.map((f) => ("text" in f ? (
                              <li key={f.text} className="flex gap-2">
                                <Check />
                                <span>{f.text}</span>
                              </li>
                            ) : null))}
                          </ul>
                        ) : null}
                      </div>
                      <div className="text-sm text-muted md:w-36">
                        {delivery ? (
                          <>
                            <p className="text-xs uppercase tracking-widest">{t.websites.delivery}</p>
                            <p className="mt-1 font-medium text-ink">{delivery}</p>
                          </>
                        ) : null}
                        <p className="mt-3 text-xs">{t.websites.deposit}</p>
                      </div>
                      <div className="flex flex-col items-start gap-3 md:items-end">
                        <Price prices={p.prices} locale={locale} className="text-3xl font-bold text-ink" />
                        <ButtonLink href={p.storeUrl} variant={highlight ? "primary" : "secondary"} external>
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
        <Section alt>
          <Card className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-xl font-bold text-ink">{t.websites.customTitle}</h2>
              <p className="mt-2 text-muted">{t.websites.customBody}</p>
              <p className="mt-2 text-sm font-medium text-ink">{t.websites.customMeta}</p>
            </div>
            <ButtonLink href={pathFor("contact", locale)}>{t.websites.customCta}</ButtonLink>
          </Card>
        </Section>
      </Shell>
    );
  },
};
