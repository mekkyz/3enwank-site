import { ButtonLink, Card, PageIntro, Section } from "@/components/blocks";
import { Shell } from "@/components/shell";
import { pageMetadata } from "@/lib/metadata";
import type { Locale } from "@/lib/i18n";
import { WHATSAPP_NUMBER } from "@/lib/site";
import { messagesFor } from "@/messages";
import { screenContext } from "./shared";

export const contact = {
  metadata(locale: Locale) {
    const t = messagesFor(locale);
    return pageMetadata("contact", locale, t.contact.title, `${t.contact.h2} ${t.contact.lede}`);
  },
  async render(locale: Locale) {
    const { t, catalogue, company } = await screenContext(locale);
    const whatsapp = WHATSAPP_NUMBER || (catalogue.company.phone ?? "").replace(/[^0-9]/g, "");
    const phone = catalogue.company.phone;
    const label = "text-xs font-extrabold uppercase tracking-[0.14em] text-brand";
    return (
      <Shell locale={locale} page="contact" storeUrl={catalogue.store.url} legalName={company.legalName} address={company.address} supportEmail={company.supportEmail}>
        <PageIntro kicker={t.contact.title} title={t.contact.h2} lede={t.contact.lede} />
        <Section>
          <ul className="grid gap-5 md:grid-cols-3">
            <Card as="li" className="h-full">
              <h2 className={label}>{t.contact.email}</h2>
              <a href={`mailto:${company.supportEmail}`} className="mt-3 block break-all text-xl font-extrabold text-brand-strong hover:underline" dir="ltr">
                {company.supportEmail}
              </a>
              <p className="mt-2 text-sm text-muted">{t.contact.emailBody}</p>
            </Card>
            {whatsapp ? (
              <Card as="li" className="h-full">
                <h2 className={label}>{t.contact.whatsapp}</h2>
                <p className="mt-3 text-xl font-extrabold text-ink">
                  <bdi dir="ltr" className="tabular">
                    +{whatsapp}
                  </bdi>
                </p>
                <p className="mt-2 text-sm text-muted">{t.contact.whatsappBody}</p>
                <div className="mt-4">
                  <ButtonLink href={`https://wa.me/${whatsapp}`} variant="outline" external>
                    {t.contact.whatsappCta}
                  </ButtonLink>
                </div>
              </Card>
            ) : phone ? (
              <Card as="li" className="h-full">
                <h2 className={label}>{t.contact.phone}</h2>
                <a href={`tel:${phone.replace(/\s+/g, "")}`} className="mt-3 block text-xl font-extrabold text-ink">
                  <bdi dir="ltr" className="tabular">
                    {phone}
                  </bdi>
                </a>
              </Card>
            ) : null}
            <Card as="li" className="h-full">
              <h2 className={label}>{t.contact.address}</h2>
              <p className="mt-3 font-semibold text-ink">{company.legalName}</p>
              <address className="mt-1 not-italic text-ink">{company.address}</address>
              <p className="mt-2 text-sm text-muted">{t.contact.addressBody}</p>
            </Card>
          </ul>
          <p className="mt-6 text-sm text-muted">{t.contact.micro}</p>
        </Section>
        <Section tone="alt">
          <Card className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-2xl font-extrabold text-ink">{t.contact.existing}</h2>
              <p className="mt-2 text-muted">{t.contact.existingBody}</p>
            </div>
            <ButtonLink href={catalogue.store.loginUrl} external>
              {t.contact.existingCta}
            </ButtonLink>
          </Card>
        </Section>
      </Shell>
    );
  },
};
