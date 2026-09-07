import { ButtonLink, Card, Chips, PageIntro, Section, SectionHeader } from "@/components/blocks";
import { Shell } from "@/components/shell";
import { pageMetadata } from "@/lib/metadata";
import { pathFor, type Locale } from "@/lib/i18n";
import { fill, messagesFor } from "@/messages";
import { screenContext } from "./shared";

export const about = {
  metadata(locale: Locale) {
    const t = messagesFor(locale);
    return pageMetadata("about", locale, t.about.title, t.about.h2);
  },
  async render(locale: Locale) {
    const { t, catalogue, company } = await screenContext(locale);
    return (
      <Shell locale={locale} page="about" storeUrl={catalogue.store.url} legalName={company.legalName} address={company.address} supportEmail={company.supportEmail}>
        <PageIntro kicker={t.about.title} title={t.about.h2} lede={fill(t.about.lede, { legalName: company.legalName })} />
        <Section>
          <SectionHeader title={t.about.principlesTitle} />
          <ul className="grid gap-5 sm:grid-cols-2">
            {t.about.principles.map((p) => (
              <Card key={p.title} as="li">
                <h3 className="text-xl font-extrabold text-ink">{p.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{p.body}</p>
              </Card>
            ))}
          </ul>
        </Section>
        <div className="border-y border-line">
          <div className="mx-auto max-w-6xl px-5 py-5 sm:px-8">
            <Chips title={t.about.stackTitle} items={t.home.stack} />
          </div>
        </div>
        <Section>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <h2 className="text-lg font-extrabold text-ink">{t.about.companyTitle}</h2>
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
                <h2 className="text-lg font-extrabold text-ink">{t.about.ctaTitle}</h2>
                <p className="mt-2 text-muted">{t.about.ctaBody}</p>
              </div>
              <ButtonLink href={pathFor("contact", locale)} className="self-start">
                {t.nav.contact}
              </ButtonLink>
            </Card>
          </div>
        </Section>
      </Shell>
    );
  },
};
