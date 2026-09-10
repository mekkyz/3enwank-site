import { ButtonLink, Section, SectionHeader } from "./blocks";
import { LeadForm, type LeadFormLabels } from "./lead-form";
import { WhatsAppIcon } from "./icons";
import type { Messages } from "@/messages";
import type { Locale } from "@/lib/i18n";

/** wa.me takes a bare international number and a pre-written first message. */
function waHref(number: string, text: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

/**
 * Two doors, and one of them is obviously faster.
 *
 * The page should not ask a visitor to weigh options; it should show one route that is plainly the
 * quickest and one for people who would rather write. So the WhatsApp side sits on its own tinted
 * ground with the number set large and a single filled button on it, and the form side is a quiet
 * panel whose heading names it as the alternative. Size, colour and wording all say the same thing,
 * which is what makes it a choice rather than a menu.
 *
 * Under the WhatsApp side is the one route that must not be buried: a customer whose site is down
 * should not be filling in a sales form and waiting for working hours.
 *
 * Almost nothing here is a bordered box. Every outline is a line the eye has to resolve before it
 * can read what is inside, and there were six of them on one screen. Ground colour separates the
 * blocks instead, and a single hairline does the rest.
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
  const eyebrow = "text-xs font-extrabold uppercase tracking-[0.14em] text-faint";

  return (
    <Section id="contact">
      <SectionHeader kicker={c.title} title={c.h2} />

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <div className="space-y-6">
          {/* Filled, not outlined: the tinted ground is what marks this as the first choice. */}
          <div className="rounded-2xl bg-brand-soft p-7 sm:p-8">
            <h3 className="text-2xl font-extrabold tracking-tight text-ink">{c.wa.title}</h3>

            {whatsapp ? (
              <>
                <p className="mt-5">
                  {/* `phone` is written for people and already carries its plus; `whatsapp` is bare digits. */}
                  <a
                    href={`tel:+${whatsapp}`}
                    className="tabular text-[2rem] font-extrabold leading-none text-ink transition hover:text-brand-strong sm:text-[2.5rem]"
                  >
                    <bdi dir="ltr">{phone?.trim() || `+${whatsapp}`}</bdi>
                  </a>
                </p>
                <div className="mt-6">
                  <ButtonLink href={waHref(whatsapp, c.wa.defaultText)} external size="lg" className="w-full sm:w-auto">
                    <WhatsAppIcon className="h-5 w-5 shrink-0" />
                    {c.wa.cta}
                  </ButtonLink>
                </div>
              </>
            ) : null}

            <p className="mt-6 text-sm text-muted">{c.wa.hours}</p>

            {/*
             * Both languages shown: a reader should see their own on the page before deciding which
             * to write in. `dir` on the paragraph would right-align the Arabic against the far side,
             * where it reads as a stray caption rather than as the second half of a pair, so <bdi>
             * isolates the run instead and both lines start at the same edge.
             */}
            <div className="mt-6 space-y-1 text-sm text-muted">
              <p>
                <bdi dir="ltr">{c.languages.first}</bdi>
              </p>
              <p className={locale === "en" ? "font-arabic" : ""}>
                <bdi dir={locale === "en" ? "rtl" : "ltr"} lang={locale === "en" ? "ar" : "en"}>
                  {c.languages.second}
                </bdi>
              </p>
            </div>
          </div>

          {/* A bar down the leading edge and nothing else: a signpost, not a fourth box. */}
          <div className="border-s-2 border-warn ps-5">
            <h3 className="text-sm font-extrabold text-warn">{c.urgent.label}</h3>
            <p className="mt-1.5 text-sm text-muted">{c.urgent.body}</p>
            <ul className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-sm font-bold">
              {whatsapp ? (
                <li>
                  <a
                    href={waHref(whatsapp, c.urgent.waText)}
                    rel="noopener"
                    target="_blank"
                    className="text-brand-strong hover:text-brand"
                  >
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
                <a
                  href={`mailto:${supportEmail}?subject=${encodeURIComponent(c.urgent.emailSubject)}`}
                  className="text-brand-strong hover:text-brand"
                  dir="ltr"
                >
                  {c.urgent.email.replace("{email}", supportEmail)}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* The alternative: one hairline, so it sits back from the filled panel beside it. */}
        <div className="rounded-2xl border border-line bg-panel p-7 sm:p-8">
          <h3 className="text-xl font-extrabold tracking-tight text-ink">{c.form.title}</h3>
          <div className="mt-6">
            <LeadForm
              endpoint={leadUrl}
              labels={labels}
              locale={locale}
              turnstileSiteKey={turnstileSiteKey}
              waHref={whatsapp ? waHref(whatsapp, c.wa.defaultText) : "#"}
            />
          </div>
        </div>
      </div>

      {/*
       * The quieter ways: three columns under one rule rather than three more cards. They were the
       * same weight as the two things above them, which is not what they are.
       */}
      <div className="mt-12 grid gap-8 border-t border-line pt-8 sm:grid-cols-3">
        <div>
          <h3 className={eyebrow}>{c.email}</h3>
          <a
            href={`mailto:${contactEmail}`}
            className="mt-2 block break-all font-bold text-brand-strong hover:underline"
            dir="ltr"
          >
            {contactEmail}
          </a>
          <p className="mt-1 text-sm text-muted">{c.emailBody}</p>
        </div>
        <div>
          <h3 className={eyebrow}>{c.address}</h3>
          <p className="mt-2 font-bold text-ink">{legalName}</p>
          <address className="mt-1 not-italic text-sm text-muted">{address}</address>
          <p className="mt-1 text-sm text-muted">{c.addressBody}</p>
        </div>
        <div>
          <h3 className={eyebrow}>{c.existing}</h3>
          <p className="mt-2 text-sm text-muted">{c.existingBody}</p>
          <a
            href={`${storeUrl}/login`}
            rel="noopener"
            className="mt-2 inline-block text-sm font-bold text-brand-strong hover:text-brand"
          >
            {c.existingCta}
          </a>
        </div>
      </div>
    </Section>
  );
}
