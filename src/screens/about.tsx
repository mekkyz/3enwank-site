import { ButtonLink, Card, PageIntro, Section, SectionHeader } from "@/components/blocks";
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
    const { t, catalogue } = await screenContext(locale);
    const legalName = catalogue.company.legalName[locale] || catalogue.company.legalName.en;
    return (
      <Shell locale={locale} page="about" storeUrl={catalogue.store.url} legalName={legalName}>
        <PageIntro num={t.about.num} title={t.about.h2} lede={fill(t.about.lede, { legalName })} />
        <Section>
          <SectionHeader title={t.about.principlesTitle} />
          <ul className="grid gap-5 sm:grid-cols-2">
            {t.about.principles.map((p) => (
              <li key={p.title}>
                <Card className="h-full">
                  <h3 className="text-lg font-semibold text-ink">{p.title}</h3>
                  <p className="mt-2 text-sm text-muted">{p.body}</p>
                </Card>
              </li>
            ))}
          </ul>
        </Section>
        <Section alt>
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h2 className="text-xl font-bold text-ink">{t.about.stackTitle}</h2>
              <dl className="mt-4 divide-y divide-line rounded-xl border border-line bg-surface px-5 text-sm">
                {t.home.spec.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 py-2.5">
                    <dt className="text-muted">{k}</dt>
                    <dd className="font-medium text-ink" dir="auto">
                      {v}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            <div>
              <h2 className="text-xl font-bold text-ink">{t.about.companyTitle}</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-muted">{t.about.companyTitle}</dt>
                  <dd className="font-medium text-ink">{legalName}</dd>
                </div>
                <div>
                  <dt className="text-muted">{t.about.address}</dt>
                  <dd className="font-medium text-ink">{catalogue.company.address[locale] || catalogue.company.address.en}</dd>
                </div>
                <div>
                  <dt className="text-muted">{t.about.email}</dt>
                  <dd>
                    <a href={`mailto:${catalogue.company.supportEmail}`} className="font-medium text-brand hover:underline" dir="ltr">
                      {catalogue.company.supportEmail}
                    </a>
                  </dd>
                </div>
              </dl>
              <Card className="mt-6">
                <h3 className="font-semibold text-ink">{t.about.ctaTitle}</h3>
                <p className="mt-1 text-sm text-muted">{t.about.ctaBody}</p>
                <div className="mt-4">
                  <ButtonLink href={pathFor("contact", locale)}>{t.common.getInTouch}</ButtonLink>
                </div>
              </Card>
            </div>
          </div>
        </Section>
      </Shell>
    );
  },
};
