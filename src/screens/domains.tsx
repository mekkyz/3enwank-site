import { ButtonLink, Card, PageIntro, Section } from "@/components/blocks";
import { DomainSearch } from "@/components/domain-search";
import { TldTable } from "@/components/domains";
import { Shell } from "@/components/shell";
import { pageMetadata } from "@/lib/metadata";
import { anchorFor, pathFor, type Locale } from "@/lib/i18n";
import { messagesFor } from "@/messages";
import { assistantOn, domainSearchLabels, screenContext, searchDomainsOnServer, storeApi, vatLine } from "./shared";

export const domains = {
  metadata(locale: Locale) {
    const t = messagesFor(locale);
    return pageMetadata("domains", locale, t.domains.title, `${t.domains.h2} ${t.domains.lede}`);
  },
  async render(locale: Locale, params: { q?: string; added?: string } = {}) {
    const { t, catalogue, company } = await screenContext(locale);
    // Asked for with ?q=: answer in the HTML, so a visitor without JavaScript gets a result
    // on this page rather than being sent to a second search somewhere else.
    const q = (params.q ?? "").trim().slice(0, 253);
    const initialResults = q ? await searchDomainsOnServer(q, "EGP") : null;
    const open = catalogue.domains.enabled && catalogue.tlds.length > 0;
    const api = storeApi(catalogue);
    return (
      <Shell locale={locale} page="domains" storeUrl={catalogue.store.url} legalName={company.legalName} address={company.address} supportEmail={company.supportEmail} assistantEnabled={catalogue.assistant.enabled} turnstileSiteKey={catalogue.assistant.turnstileSiteKey}>
        <PageIntro kicker={t.domains.title} title={t.domains.h2} lede={t.domains.lede}>
          <div className="mt-8 rounded-2xl border border-line bg-panel p-5 sm:p-8">
            <DomainSearch locale={locale} searchPath={pathFor("domains", locale)} cartUrl={api.cartDomain} apiUrl={api.domainSearch} ideasUrl={api.domainIdeas} contactHref={anchorFor("contact", locale)} labels={domainSearchLabels(t)} ideas={assistantOn(catalogue)} turnstileSiteKey={catalogue.assistant.turnstileSiteKey} initialQuery={q} initialResults={initialResults as never} initialAdded={params.added ? [params.added] : []} />
          </div>
        </PageIntro>
        <Section>
          {open ? (
            <>
              <p className="mb-6 text-sm text-muted">{vatLine(t, catalogue)}</p>
              <TldTable tlds={catalogue.tlds} locale={locale} />
              {catalogue.tldCount > catalogue.tlds.length ? (
                <p className="mt-4 text-sm text-muted">{t.domains.moreTlds.replace("{count}", String(catalogue.tldCount))}</p>
              ) : null}
            </>
          ) : (
            <Card className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
              <p className="text-muted">{t.domains.notYet}</p>
              <ButtonLink href={anchorFor("contact", locale)}>{t.domains.ask}</ButtonLink>
            </Card>
          )}
        </Section>
      </Shell>
    );
  },
};
