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
    const { t, catalogue } = await screenContext(locale);
    const whatsapp = WHATSAPP_NUMBER || (catalogue.company.phone ?? "").replace(/[^0-9]/g, "");
    const phone = catalogue.company.phone;
    const address = catalogue.company.address[locale] || catalogue.company.address.en;
    return (
      <Shell locale={locale} page="contact" storeUrl={catalogue.store.url} legalName={catalogue.company.legalName[locale]}>
        <PageIntro num={t.contact.num} title={t.contact.h2} lede={t.contact.lede} />
        <Section>
          <ul className="grid gap-5 md:grid-cols-3">
            <li>
              <Card className="h-full">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">{t.contact.email}</h2>
                <a href={`mailto:${catalogue.company.supportEmail}`} className="mt-2 block break-all text-xl font-bold text-brand hover:underline" dir="ltr">
                  {catalogue.company.supportEmail}
                </a>
                <p className="mt-2 text-sm text-muted">{t.contact.emailBody}</p>
              </Card>
            </li>
            {whatsapp ? (
              <li>
                <Card className="h-full">
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">{t.contact.whatsapp}</h2>
                  <p className="mt-2 text-xl font-bold text-ink tabular" dir="ltr">
                    +{whatsapp}
                  </p>
                  <p className="mt-2 text-sm text-muted">{t.contact.whatsappBody}</p>
                  <div className="mt-4">
                    <ButtonLink href={`https://wa.me/${whatsapp}`} variant="secondary" external>
                      {t.contact.whatsappCta}
                    </ButtonLink>
                  </div>
                </Card>
              </li>
            ) : phone ? (
              <li>
                <Card className="h-full">
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">{t.contact.phone}</h2>
                  <a href={`tel:${phone.replace(/\s+/g, "")}`} className="mt-2 block text-xl font-bold text-ink tabular" dir="ltr">
                    {phone}
                  </a>
                </Card>
              </li>
            ) : null}
            <li>
              <Card className="h-full">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">{t.contact.address}</h2>
                <p className="mt-2 font-medium text-ink">{catalogue.company.legalName[locale] || catalogue.company.legalName.en}</p>
                <address className="mt-1 not-italic text-ink">{address}</address>
                <p className="mt-2 text-sm text-muted">{t.contact.addressBody}</p>
              </Card>
            </li>
          </ul>
          <p className="mt-6 text-sm text-muted">{t.contact.micro}</p>
        </Section>
        <Section alt>
          <Card className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-xl font-bold text-ink">{t.contact.existing}</h2>
              <p className="mt-1 text-muted">{t.contact.existingBody}</p>
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
