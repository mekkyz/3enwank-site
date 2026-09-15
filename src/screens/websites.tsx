import { ButtonLink, Card, Empty, MostChosen, PageIntro, Section, SectionHeader, Steps } from "@/components/blocks";
import { Val } from "@/components/bidi";
import { Price, PricedText, RenewalNote } from "@/components/currency";
import { WhatsAppIcon } from "@/components/icons";
import { FeatureList } from "@/components/plans";
import { Shell } from "@/components/shell";
import { JsonLd } from "@/components/json-ld";
import { graph, productLd } from "@/lib/structured-data";
import { cheapestPrices, localizedFeatures, localizedSummary, summaryWithoutDelivery } from "@/lib/format";
import { pageMetadata } from "@/lib/metadata";
import { contactHref, storeLink, type Locale } from "@/lib/i18n";
import { messagesFor } from "@/messages";
import { HIGHLIGHT, buildTerms, loc, screenContext, talkFirstHref, whatsappNumber } from "./shared";
import { vatLine } from "@/lib/vat";

export const websites = {
  metadata(locale: Locale) {
    const t = messagesFor(locale);
    return pageMetadata("websites", locale, t.websites.title, `${t.websites.h2} ${t.websites.lede}`);
  },
  async render(locale: Locale) {
    const { t, catalogue, company, trust } = await screenContext(locale);
    const vat = vatLine(t, catalogue);
    const packages = catalogue.products.build;
    const whatsapp = whatsappNumber(catalogue);
    // The cheapest hosting in each currency: every package says what it needs beside it (S12).
    const hostingFrom = cheapestPrices(catalogue.products.hosting.map((p) => p.prices));
    return (
      <Shell locale={locale} page="websites" storeUrl={catalogue.store.url} legalName={company.legalName} trust={trust} whatsapp={whatsapp} assistantEnabled={catalogue.assistant.enabled} turnstileSiteKey={catalogue.assistant.turnstileSiteKey}>
        {/* Each plan on this page as a schema.org Product with its offers, from the same catalogue rows the cards draw. */}
        {packages.length ? <JsonLd data={graph(packages.map((p) => productLd(p, locale, "websites")))} /> : null}
        {/* The intro names the offer and the cheapest package, following the currency switch (S13). */}
        <PageIntro title={<PricedText template={t.websites.h2Price} prices={cheapestPrices(packages.map((p) => p.prices))} locale={locale} fallback={t.websites.h2} />} lede={t.websites.lede} />
        <Section>
          {packages.length ? (
            // No pt-3: it made room for the notched badge, which sits inline now (S10).
            <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {packages.map((p) => {
                const summary = localizedSummary(p, locale, t);
                // Bullets are the free-text lines; price and billing notes are shown from the price fields instead.
                const features = localizedFeatures(p, locale, t).flatMap((f, i) => ("text" in f && !/\b(EGP|USD|VAT)\b|Hosting and Care/.test(p.features.en[i] ?? f.text) ? [f.text] : []));
                const highlight = p.slug === HIGHLIGHT.build;
                return (
                  <li key={p.slug}>
                    <Card highlight={highlight} className="flex h-full flex-col" as="article">
                      {/* The one badge design, inline after the name (S10); the name isolated, as on every other card, because it stays Latin in Arabic. */}
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <h2 className="text-xl font-extrabold text-ink">
                          <Val>{loc(p.name, locale)}</Val>
                        </h2>
                        {highlight ? <MostChosen>{t.common.mostChosen}</MostChosen> : null}
                      </div>
                      {summary ? <p className="mt-1 text-sm text-muted">{summaryWithoutDelivery(summary) || summary}</p> : null}
                      <p className="mt-5 flex flex-wrap items-baseline gap-x-2">
                        <Price prices={p.prices} locale={locale} fallback={t.common.notAvailable} className="text-[2rem] font-extrabold leading-none tracking-tight text-ink" />
                        <span className="text-sm text-muted">{t.common.oneTime}</span>
                      </p>
                      {/* The deposit split and the delivery time, one line each (they wrapped into each other joined by a dot). */}
                      {buildTerms(p, locale, t).map((line, i) => (
                        <p key={line} className={`${i ? "mt-0.5" : "mt-1.5"} text-sm text-muted`}>
                          {line}
                        </p>
                      ))}
                      {/* In place of the "Hosting and Care plans are separate" footnote under the grid (S12). */}
                      <RenewalNote prices={hostingFrom} locale={locale} label={t.websites.needsHosting} className="mt-0.5 text-sm text-muted" />
                      {features.length ? <FeatureList items={features} /> : null}
                      {/* "Talk to us first" beside Order (S12): WhatsApp with the package written, or the contact form on it. */}
                      <div className="mt-auto flex flex-wrap gap-2 pt-6">
                        <ButtonLink href={storeLink(p.storeUrl, locale)} variant={highlight ? "primary" : "outline"} className="flex-auto whitespace-nowrap" external>
                          {t.common.order}
                        </ButtonLink>
                        <ButtonLink href={talkFirstHref(p, locale, t, whatsapp)} variant="secondary" className="flex-auto whitespace-nowrap" external={!!whatsapp}>
                          {whatsapp ? <WhatsAppIcon /> : null}
                          {t.websites.talkFirst}
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
          {/* Under the prices, not above them (site review justDo); only while VAT is charged. */}
          {vat ? <p className="mt-4 text-sm text-muted">{vat}</p> : null}
          {/*
           * What the packages assume, said once under them. The delivery clock moved into step 2 below and
           * the hosting note onto every package, which leaves the one line about waiting on third parties.
           */}
          {packages.length ? (
            <ul className="mt-4 space-y-1.5 text-sm text-muted">
              {t.websites.notes.map((n) => (
                <li key={n} className="flex gap-2">
                  <span aria-hidden="true">*</span>
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </Section>
        {/* How a build works, in four numbered steps (S12), the same list as the home page's moving steps. */}
        <Section tone="alt">
          <SectionHeader title={t.websites.stepsTitle} />
          <Steps steps={t.websites.steps} />
        </Section>
        <Section>
          <Card className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-xl font-extrabold text-ink">{t.websites.customTitle}</h2>
              <p className="mt-2 text-muted">{t.websites.customBody}</p>
              <p className="mt-2 text-sm font-semibold text-ink">{t.websites.customMeta}</p>
            </div>
            <ButtonLink href={contactHref(locale, { need: "website" })}>{t.websites.customCta}</ButtonLink>
          </Card>
        </Section>
      </Shell>
    );
  },
};
