import { Container, PageIntro } from "@/components/blocks";
import { Shell } from "@/components/shell";
import { pageMetadata } from "@/lib/metadata";
import type { Locale } from "@/lib/i18n";
import { fill, messagesFor } from "@/messages";
import { screenContext } from "./shared";

/** The catalogue does not carry a terms version; this matches settings.legal.termsVersion on the platform. */
const TERMS_VERSION = "2026-09-06";

function legalScreen(page: "terms" | "privacy") {
  return {
    metadata(locale: Locale) {
      const t = messagesFor(locale);
      return pageMetadata(page, locale, t[page].title, fill(t[page].intro, { legalName: "3enwank", version: TERMS_VERSION }).slice(0, 160));
    },
    async render(locale: Locale) {
      const { t, catalogue, company, trust } = await screenContext(locale);
      const copy = t[page];
      return (
        <Shell locale={locale} page={page} storeUrl={catalogue.store.url} legalName={company.legalName} address={company.address} supportEmail={company.supportEmail} trust={trust} assistantEnabled={catalogue.assistant.enabled} turnstileSiteKey={catalogue.assistant.turnstileSiteKey}>
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
