import { ButtonLink, Card, Fine, PageIntro, Section } from "@/components/blocks";
import { CurrencyToggle } from "@/components/currency";
import { DomainSearch } from "@/components/domain-search";
import { TldTable } from "@/components/domains";
import { Shell } from "@/components/shell";
import { pageMetadata } from "@/lib/metadata";
import { anchorFor, type Locale } from "@/lib/i18n";
import { messagesFor } from "@/messages";
import { assistantOn, domainSearchLabels, screenContext, storeApi, vatLine } from "./shared";

export const domains = {
  metadata(locale: Locale) {
    const t = messagesFor(locale);
    return pageMetadata("domains", locale, t.domains.title, `${t.domains.h2} ${t.domains.lede}`);
  },
  async render(locale: Locale) {
    const { t, catalogue, company } = await screenContext(locale);
    const open = catalogue.domains.enabled && catalogue.tlds.length > 0;
    const api = storeApi(catalogue);
    return (
      <Shell locale={locale} page="domains" storeUrl={catalogue.store.url} legalName={company.legalName} address={company.address} supportEmail={company.supportEmail} assistantEnabled={catalogue.assistant.enabled} turnstileSiteKey={catalogue.assistant.turnstileSiteKey}>
        <PageIntro kicker={t.domains.title} title={t.domains.h2} lede={t.domains.lede}>
          <div className="mt-8 rounded-2xl border border-line bg-panel p-5 sm:p-8">
            <DomainSearch locale={locale} storeSearchUrl={catalogue.store.domainSearchUrl} apiUrl={api.domainSearch} ideasUrl={api.domainIdeas} contactHref={anchorFor("contact", locale)} labels={domainSearchLabels(t)} ideas={assistantOn(catalogue)} turnstileSiteKey={catalogue.assistant.turnstileSiteKey} />
          </div>
        </PageIntro>
        <Section>
          {open ? (
            <>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm text-muted">{vatLine(t, catalogue)}</p>
                <CurrencyToggle label={t.common.currency} hint={t.common.currencyHint} />
              </div>
              <TldTable tlds={catalogue.tlds} locale={locale} />
            </>
          ) : (
            <Card className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
              <p className="text-muted">{t.domains.notYet}</p>
              <ButtonLink href={anchorFor("contact", locale)}>{t.domains.ask}</ButtonLink>
            </Card>
          )}
          <Fine>{t.domains.fine}</Fine>
        </Section>
      </Shell>
    );
  },
};
