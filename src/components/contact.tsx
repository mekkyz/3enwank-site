import { ButtonLink, Panel, Section, SectionHeader } from "./blocks";
import { LeadForm, type LeadFormLabels } from "./lead-form";
import type { Messages } from "@/messages";
import type { Locale } from "@/lib/i18n";

/** wa.me takes a bare international number and a pre-written first message. */
function waHref(number: string, text: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

/**
 * How to reach a person, in the order people actually reach for.
 *
 * WhatsApp first and drawn largest, because that is what an Egyptian small business opens; the form
 * is the alternative for someone who would rather write it down, not the main event. Between them
 * sits the one thing that must not be buried: a customer whose site is down should not be filling in
 * a sales form and waiting for working hours.
 *
 * The openers are the part that does the owner's stated job. Each writes the first message for the
 * visitor, so what arrives on WhatsApp already says which of the three things this is, which is what
 * "qualify before replying" means on a channel where nobody fills in fields.
 */
export function ContactSection({
  locale,
  t,
  whatsapp,
  phone,
  contactEmail,
  supportEmail,
  legalName,
  address,
  storeUrl,
  leadUrl,
  turnstileSiteKey,
}: {
  locale: Locale;
  t: Messages;
  whatsapp: string | null;
  phone: string | null;
  contactEmail: string;
  supportEmail: string;
  legalName: string;
  address: string;
  storeUrl: string;
  leadUrl: string;
  turnstileSiteKey: string | null;
}) {
  const c = t.contact;
  const labels: LeadFormLabels = c.form;

  return (
    <Section id="contact">
      <SectionHeader kicker={c.title} title={c.h2} />

      {/*
       * Full width and directly under the heading, because the person who needs it is the person
       * least able to hunt for it. It was in the right-hand column, which put it beside the WhatsApp
       * panel and left a column of empty space under that panel on a wide screen.
       */}
      <Panel tone="warn" className="mb-6">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
          <h3 className="text-base font-extrabold text-warn">{c.urgent.label}</h3>
          <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm font-bold">
            {whatsapp ? (
              <li>
                <a href={waHref(whatsapp, c.urgent.waText)} rel="noopener" target="_blank" className="text-brand-strong hover:text-brand">
                  {c.urgent.wa}
                </a>
              </li>
            ) : null}
            <li>
              <a href={`${storeUrl}/tickets`} rel="noopener" className="text-brand-strong hover:text-brand">
                {c.urgent.ticket}
              </a>
            </li>
            <li>
              <a href={`mailto:${supportEmail}?subject=${encodeURIComponent(c.urgent.emailSubject)}`} className="text-brand-strong hover:text-brand" dir="ltr">
                {c.urgent.email.replace("{email}", supportEmail)}
              </a>
            </li>
          </ul>
        </div>
        <p className="mt-2 text-sm text-muted">{c.urgent.body}</p>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr]">
        {/* The counter: one number, one button, and whether anyone is behind it right now. */}
        <Panel tone="brand" className="order-1 h-full">
          <h3 className="text-2xl font-extrabold tracking-tight text-ink">{c.wa.title}</h3>

          {whatsapp ? (
            <>
              <p className="mt-4">
                {/* `phone` is written for people and already carries its plus; `whatsapp` is bare digits. */}
                <a href={`tel:+${whatsapp}`} className="tabular text-3xl font-extrabold text-ink hover:text-brand-strong sm:text-4xl">
                  <bdi dir="ltr">{phone?.trim() || `+${whatsapp}`}</bdi>
                </a>
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <ButtonLink href={waHref(whatsapp, c.wa.defaultText)} external size="lg">
                  {c.wa.cta}
                </ButtonLink>
              </div>
            </>
          ) : null}

          <p className="mt-4 text-sm text-muted">{c.wa.hours}</p>

          {/*
           * Both languages, both shown. The point of "Arabic visible, not a footnote" is that a
           * reader sees their own language on the page before deciding whether to write in it, so
           * each sentence is set in its own script and its own direction.
           */}
          {/*
           * Both sentences start at the same edge. `dir` on the paragraph would right-align the
           * Arabic against the far side of the panel, which reads as a stray caption rather than as
           * the second half of a pair; <bdi> isolates the run so it renders correctly while the
           * paragraph keeps the page's own alignment.
           */}
          <div className="mt-5 space-y-1.5 border-t border-line pt-5 text-sm text-muted">
            <p>
              <bdi dir="ltr">{c.languages.first}</bdi>
            </p>
            <p className={locale === "en" ? "font-arabic" : ""}>
              <bdi dir={locale === "en" ? "rtl" : "ltr"} lang={locale === "en" ? "ar" : "en"}>
                {c.languages.second}
              </bdi>
            </p>
          </div>
        </Panel>

        <div className="order-2">
          <Panel className="h-full">
            <h3 className="text-xl font-extrabold tracking-tight text-ink">{c.form.title}</h3>
            <div className="mt-5">
              <LeadForm endpoint={leadUrl} labels={labels} locale={locale} turnstileSiteKey={turnstileSiteKey} waHref={whatsapp ? waHref(whatsapp, c.wa.defaultText) : "#"} />
            </div>
          </Panel>
        </div>
      </div>

      {/* The quieter ways, under both columns: an address to write to, and a door to knock on. */}
      <div className="mt-6 grid gap-6 sm:grid-cols-3">
        <Panel>
          <h3 className="text-xs font-extrabold uppercase tracking-[0.14em] text-brand">{c.email}</h3>
          <a href={`mailto:${contactEmail}`} className="mt-3 block break-all text-lg font-extrabold text-brand-strong hover:underline" dir="ltr">
            {contactEmail}
          </a>
          <p className="mt-2 text-sm text-muted">{c.emailBody}</p>
        </Panel>
        <Panel>
          <h3 className="text-xs font-extrabold uppercase tracking-[0.14em] text-brand">{c.address}</h3>
          <p className="mt-3 font-semibold text-ink">{legalName}</p>
          <address className="mt-1 not-italic text-sm text-ink">{address}</address>
          <p className="mt-2 text-sm text-muted">{c.addressBody}</p>
        </Panel>
        <Panel>
          <h3 className="text-xs font-extrabold uppercase tracking-[0.14em] text-brand">{c.existing}</h3>
          <p className="mt-3 text-sm text-muted">{c.existingBody}</p>
          <p className="mt-3">
            <a href={`${storeUrl}/login`} rel="noopener" className="text-sm font-bold text-brand-strong hover:text-brand">
              {c.existingCta}
            </a>
          </p>
        </Panel>
      </div>
    </Section>
  );
}
