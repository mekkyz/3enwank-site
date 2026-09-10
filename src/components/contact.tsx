import { ButtonLink, Panel, Section, SectionHeader } from "./blocks";
import { LeadForm, type LeadFormLabels } from "./lead-form";
import { OfficeStatus } from "./office-status";
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
  const hours = { open: c.wa.open, closedToday: c.wa.closedToday, closedTomorrow: c.wa.closedTomorrow, closedWeekend: c.wa.closedWeekend };

  return (
    <Section id="contact">
      <SectionHeader kicker={c.title} title={c.h2} lede={c.lede} />

      <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr] lg:items-start">
        {/* The counter: one number, one button, and whether anyone is behind it right now. */}
        <Panel tone="brand" className="order-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-brand">{c.wa.kicker}</p>
            <OfficeStatus t={hours} />
          </div>
          <h3 className="mt-3 text-2xl font-extrabold tracking-tight text-ink">{c.wa.title}</h3>

          {whatsapp ? (
            <>
              <p className="mt-4">
                <a href={`tel:+${whatsapp}`} className="tabular text-3xl font-extrabold text-ink hover:text-brand-strong sm:text-4xl">
                  <bdi dir="ltr">+{phone ?? whatsapp}</bdi>
                </a>
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <ButtonLink href={waHref(whatsapp, c.wa.defaultText)} external size="lg">
                  {c.wa.cta}
                </ButtonLink>
              </div>
              <p className="mt-3 text-sm text-muted">
                {c.wa.call} {c.wa.voice}
              </p>

              <div className="mt-6 border-t border-line pt-5">
                <p className="text-sm font-bold text-ink">{c.wa.openersTitle}</p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {c.wa.openers.map((o) => (
                    <li key={o.chip}>
                      <a
                        href={waHref(whatsapp, o.text)}
                        rel="noopener"
                        target="_blank"
                        className="inline-flex min-h-11 items-center rounded-lg border-[1.5px] border-line-strong px-3.5 text-sm font-bold text-muted transition hover:border-brand hover:text-brand-strong"
                      >
                        {o.chip}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : null}

          <p className="mt-6 text-sm leading-relaxed text-muted">{c.wa.hours}</p>

          {/*
           * Both languages, both shown. The point of "Arabic visible, not a footnote" is that a
           * reader sees their own language on the page before deciding whether to write in it, so
           * each sentence is set in its own script and its own direction.
           */}
          <div className="mt-5 space-y-1.5 border-t border-line pt-5 text-sm text-muted">
            <p>{c.languages.first}</p>
            <p dir={locale === "en" ? "rtl" : "ltr"} lang={locale === "en" ? "ar" : "en"} className={locale === "en" ? "font-arabic" : ""}>
              {c.languages.second}
            </p>
          </div>
        </Panel>

        <div className="order-2 space-y-6">
          {/*
           * The lane for a customer who is already paying and whose site is down. Marked by the
           * warning tone rather than by danger red: it is a signpost for the few people who need it,
           * not an alarm for everyone reading the page.
           */}
          <Panel className="border-warn/40 bg-warn-soft">
            <h3 className="text-base font-extrabold text-ink">{c.urgent.label}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{c.urgent.body}</p>
            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold">
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
            <p className="mt-3 text-xs text-faint">{c.urgent.after}</p>
          </Panel>

          <Panel>
            <h3 className="text-xl font-extrabold tracking-tight text-ink">{c.form.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{c.form.lede}</p>
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
