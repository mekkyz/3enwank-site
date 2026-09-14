import { Container, PageIntro } from "@/components/blocks";
import { Shell } from "@/components/shell";
import { pageMetadata } from "@/lib/metadata";
import { pathFor, type Locale } from "@/lib/i18n";
import { fill } from "@/messages";
import { screenContext } from "./shared";

/** The catalogue does not carry a terms version; this matches settings.legal.termsVersion on the platform. */
const TERMS_VERSION = "2026-09-10";

/** The policy pages, which cross-reference each other in prose and link to each other at the foot. */
const LEGAL_PAGES = ["terms", "privacy", "delivery", "refunds"] as const;

function legalScreen(page: (typeof LEGAL_PAGES)[number]) {
  return {
    /*
     * Async, and reading the catalogue, so the description names the same company the page body
     * does. It filled {legalName} with the brand instead, which in the intro's own words made it
     * "3enwank ("3enwank")" in every search result while the page said the registered name. The
     * length is pageMetadata's to cut, between words.
     */
    async metadata(locale: Locale) {
      const { t, company } = await screenContext(locale);
      return pageMetadata(page, locale, t[page].title, fill(t[page].intro, { legalName: company.legalName, version: TERMS_VERSION }, { isolate: false }));
    },
    async render(locale: Locale) {
      const { t, catalogue, company, trust } = await screenContext(locale);
      const copy = t[page];
      return (
        <Shell locale={locale} page={page} storeUrl={catalogue.store.url} legalName={company.legalName} supportEmail={company.contactEmail} trust={trust} assistantEnabled={catalogue.assistant.enabled} turnstileSiteKey={catalogue.assistant.turnstileSiteKey}>
          <PageIntro title={copy.title} lede={fill(copy.intro, { legalName: company.legalName, version: TERMS_VERSION })} />
          <Container className="max-w-3xl py-12">
            <div className="space-y-9">
              {copy.sections.map((s) => (
                <section key={s.title}>
                  <h2 className="text-xl font-extrabold text-ink">{s.title}</h2>
                  {s.body.map((p) => (
                    <p key={p} className="mt-3 leading-relaxed text-ink/90">
                      {p}
                    </p>
                  ))}
                </section>
              ))}
              <nav aria-label={t.footer.legal} className="flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-6 text-sm">
                {LEGAL_PAGES.filter((p) => p !== page).map((p) => (
                  <a key={p} href={pathFor(p, locale)} className="text-brand-strong hover:underline">
                    {t[p].title}
                  </a>
                ))}
              </nav>
              <p className="text-sm text-muted">
                <a href={`mailto:${company.supportEmail}`} className="text-brand-strong hover:underline" dir="ltr">
                  {company.supportEmail}
                </a>
                <span> · </span>
                {company.address}
              </p>
            </div>
          </Container>
        </Shell>
      );
    },
  };
}

export const terms = legalScreen("terms");
export const privacy = legalScreen("privacy");
export const delivery = legalScreen("delivery");
export const refunds = legalScreen("refunds");
