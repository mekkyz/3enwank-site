import { ButtonLink, Card, PageIntro, Section, SectionHeader } from "@/components/blocks";
import { Shell } from "@/components/shell";
import { pageMetadata } from "@/lib/metadata";
import { contactHref, type Locale } from "@/lib/i18n";
import { fill, messagesFor } from "@/messages";
import { screenContext, whatsappNumber } from "./shared";

export const about = {
  metadata(locale: Locale) {
    const t = messagesFor(locale);
    return pageMetadata("about", locale, t.about.title, t.about.h2);
  },
  async render(locale: Locale) {
    const { t, catalogue, company, trust } = await screenContext(locale);
    return (
      <Shell locale={locale} page="about" storeUrl={catalogue.store.url} legalName={company.legalName} trust={trust} whatsapp={whatsappNumber(catalogue)} assistantEnabled={catalogue.assistant.enabled} turnstileSiteKey={catalogue.assistant.turnstileSiteKey}>
        {/* No kicker above the heading (S13): the h1 names the page. */}
        <PageIntro title={t.about.h2} lede={fill(t.about.lede, { legalName: company.legalName })} />
        <Section>
          <SectionHeader title={t.about.principlesTitle} />
          <ul className="grid gap-5 sm:grid-cols-2">
            {t.about.principles.map((p) => (
              <Card key={p.title} as="li">
                <h3 className="text-xl font-extrabold text-ink">{p.title}</h3>
                <p className="mt-2 text-base leading-relaxed text-muted">{p.body}</p>
              </Card>
            ))}
          </ul>
        </Section>
        <Section>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <h2 className="text-xl font-extrabold text-ink">{t.about.companyTitle}</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-muted">{t.about.companyTitle}</dt>
                  <dd className="font-semibold text-ink">{company.legalName}</dd>
                </div>
                <div>
                  <dt className="text-muted">{t.about.address}</dt>
                  <dd className="font-semibold text-ink">{company.address}</dd>
                </div>
                <div>
                  <dt className="text-muted">{t.about.email}</dt>
                  <dd className="font-semibold text-ink">
                    <a href={`mailto:${company.supportEmail}`} className="text-brand-strong hover:underline" dir="ltr">
                      {company.supportEmail}
                    </a>
                  </dd>
                </div>
              </dl>
            </Card>
            <Card className="flex flex-col justify-between gap-5">
              <div>
                <h2 className="text-xl font-extrabold text-ink">{t.about.ctaTitle}</h2>
                <p className="mt-2 text-muted">{t.about.ctaBody}</p>
              </div>
              <ButtonLink href={contactHref(locale)} className="self-start">
                {t.nav.contact}
              </ButtonLink>
            </Card>
          </div>
        </Section>
      </Shell>
    );
  },
};
