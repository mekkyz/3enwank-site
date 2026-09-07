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
      return pageMetadata(page, locale, t[page].title, t[page].intro.replace(/\{legalName\}/g, "3enwank").replace(/\{version\}/g, TERMS_VERSION).slice(0, 160));
    },
    async render(locale: Locale) {
      const { t, catalogue } = await screenContext(locale);
      const legalName = catalogue.company.legalName[locale] || catalogue.company.legalName.en;
      const copy = t[page];
      return (
        <Shell locale={locale} page={page} storeUrl={catalogue.store.url} legalName={legalName}>
          <PageIntro title={copy.title} lede={fill(copy.intro, { legalName, version: TERMS_VERSION })} />
          <Container className="max-w-3xl py-12">
            <div className="space-y-8">
              {copy.sections.map((s) => (
                <section key={s.title}>
                  <h2 className="text-lg font-semibold text-ink">{s.title}</h2>
                  {s.body.map((p) => (
                    <p key={p} className="mt-2 leading-relaxed text-ink/90">
                      {p}
                    </p>
                  ))}
                </section>
              ))}
              <p className="text-sm text-muted">
                <a href={`mailto:${catalogue.company.supportEmail}`} className="text-brand hover:underline" dir="ltr">
                  {catalogue.company.supportEmail}
                </a>{" "}
                · {catalogue.company.address[locale] || catalogue.company.address.en}
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
