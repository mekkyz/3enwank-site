import { ButtonLink, Card, PageIntro, Section } from "@/components/blocks";
import { DomainSearch } from "@/components/domain-search";
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
    const { t, catalogue, company, trust } = await screenContext(locale);
    // Asked for with ?q=: answer in the HTML, so a visitor without JavaScript gets a result
    // on this page rather than being sent to a second search somewhere else.
    const q = (params.q ?? "").trim().slice(0, 253);
    const initialResults = q ? await searchDomainsOnServer(q, "EGP") : null;
    const open = catalogue.domains.enabled && catalogue.tlds.length > 0;
    const api = storeApi(catalogue);
    return (
      <Shell locale={locale} page="domains" storeUrl={catalogue.store.url} legalName={company.legalName} supportEmail={company.contactEmail} trust={trust} assistantEnabled={catalogue.assistant.enabled} turnstileSiteKey={catalogue.assistant.turnstileSiteKey}>
        <PageIntro kicker={t.domains.title} title={t.domains.h2} lede={t.domains.lede} />
        {/*
         * The search has a band of its own, like every other page's content. It used to sit inside
         * the title block, which made this the one page whose heading came with a form attached.
         */}
        <Section>
          <p className="mb-5 text-sm text-muted">{vatLine(t, catalogue)}</p>
          <div className="rounded-2xl border border-line bg-panel p-5 sm:p-8">
            <DomainSearch locale={locale} searchPath={pathFor("domains", locale)} cartUrl={api.cartDomain} apiUrl={api.domainSearch} ideasUrl={api.domainIdeas} contactHref={anchorFor("contact", locale)} labels={domainSearchLabels(t)} ideas={assistantOn(catalogue)} turnstileSiteKey={catalogue.assistant.turnstileSiteKey} initialQuery={q} initialResults={initialResults as never} initialAdded={params.added ? [params.added] : []} />
          </div>
        </Section>
        {/*
         * No price table under the search.
         *
         * Thirty-nine rows of four columns is not how anybody picks an extension — they type the
         * name they want. Every number it held now reaches the reader in the row for the name they
         * actually asked about, including the renewal, which is the one the table existed for.
         */}
        {open ? null : (
          <Section>
            <Card className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
              <p className="text-muted">{t.domains.notYet}</p>
              <ButtonLink href={anchorFor("contact", locale)}>{t.domains.ask}</ButtonLink>
            </Card>
          </Section>
        )}
      </Shell>
    );
  },
};
