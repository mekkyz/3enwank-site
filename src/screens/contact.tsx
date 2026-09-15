import { PageIntro, Section } from "@/components/blocks";
import { ContactBody } from "@/components/contact";
import { Shell } from "@/components/shell";
import { pageMetadata } from "@/lib/metadata";
import type { Locale } from "@/lib/i18n";
import { messagesFor } from "@/messages";
import { screenContext, storeApi, whatsappNumber } from "./shared";

/**
 * /contact/ and /ar/contact/ (owner, 2026-09-15, S7). Contact was a section at the foot of the home
 * page, so the header's Contact took a visitor off whatever page they were on and dropped them seven
 * screens down another one. The page opens with the customer and site-down strip, then the channels
 * and the form; a plan or package page links here with ?need= and ?plan=, which the form and the
 * WhatsApp button read in the browser (components/contact-prefill.tsx).
 */
export const contact = {
  metadata(locale: Locale) {
    const t = messagesFor(locale);
    return pageMetadata("contact", locale, t.contact.pageTitle, t.contact.pageLede);
  },
  async render(locale: Locale) {
    const { t, catalogue, company, trust } = await screenContext(locale);
    const api = storeApi(catalogue);
    return (
      <Shell locale={locale} page="contact" storeUrl={catalogue.store.url} legalName={company.legalName} trust={trust} whatsapp={whatsappNumber(catalogue)} assistantEnabled={catalogue.assistant.enabled} turnstileSiteKey={catalogue.assistant.turnstileSiteKey}>
        <PageIntro title={t.contact.pageTitle} lede={t.contact.pageLede} />
        <Section>
          <ContactBody
            locale={locale}
            t={t}
            whatsapp={whatsappNumber(catalogue)}
            phone={catalogue.company.phone}
            contactEmail={company.contactEmail}
            supportEmail={company.supportEmail}
            legalName={company.legalName}
            address={company.address}
            storeUrl={catalogue.store.url.replace(/\/+$/, "")}
            leadUrl={api.lead}
            turnstileSiteKey={catalogue.assistant.turnstileSiteKey}
            heading="h2"
            prefill
            source="contact-page"
          />
        </Section>
      </Shell>
    );
  },
};
