import { EnvelopeSimpleIcon, MapPinIcon } from "@phosphor-icons/react/dist/ssr";
import { ArrowLink, Section, SectionHeader } from "./blocks";
import { WaLink } from "./contact-prefill";
import { LeadForm, type LeadFormLabels } from "./lead-form";
import { AccountIcon, WhatsAppIcon } from "./icons";
import type { Messages } from "@/messages";
import { contactHref, dirFor, storeLink, type Locale } from "@/lib/i18n";
import { waHref } from "@/lib/whatsapp";
import { STATUS_URL } from "@/lib/site";

export type ContactDetails = {
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
};

/**
 * "Already a customer? Log in. Site down? WhatsApp us", first on the contact page and first in the
 * home page's contact section (owner, 2026-09-15, S7). It used to be the last item under the email
 * and the address, below the fold on a phone, which is where a person whose site is down should not
 * have to look. A plain row with a hairline box, one glyph on each action so the two read at a glance.
 */
export function ContactStrip({ locale, t, whatsapp, supportEmail, storeUrl }: Pick<ContactDetails, "locale" | "t" | "whatsapp" | "supportEmail" | "storeUrl">) {
  const s = t.contact.strip;
  const link = "inline-flex min-h-11 items-center gap-1.5 font-bold text-brand-strong hover:text-brand";
  return (
    <ul className="flex flex-col gap-x-10 rounded-lg border border-line bg-panel px-5 py-1.5 text-base shadow-[var(--card-shadow)] md:flex-row md:flex-wrap md:items-center">
      <li className="flex flex-wrap items-center gap-x-3">
        <span className="font-bold text-ink">{s.customer}</span>
        {/* Through storeLink: the store keeps its language in a cookie set from ?lang=. */}
        <a href={storeLink(`${storeUrl}/login`, locale)} className={link}>
          <AccountIcon />
          {s.login}
        </a>
      </li>
      <li className="flex flex-wrap items-center gap-x-4">
        <span className="font-bold text-ink">{s.down}</span>
        {whatsapp ? (
          <a href={waHref(whatsapp, t.contact.urgent.waText)} rel="noopener" target="_blank" className={link}>
            <WhatsAppIcon />
            {s.wa}
          </a>
        ) : null}
        {/* The new ticket form itself, not the ticket list: a customer whose site is down has nothing to read there yet. */}
        <a href={storeLink(`${storeUrl}/tickets/new`, locale)} className={link}>
          {s.ticket}
        </a>
        {/* The support address only when there is no WhatsApp: with both, it wrapped the strip to a fourth row on a phone. */}
        {whatsapp ? null : (
          <a href={`mailto:${supportEmail}?subject=${encodeURIComponent(t.contact.urgent.emailSubject)}`} dir="ltr" className={`${link} break-all`}>
            {supportEmail}
          </a>
        )}
      </li>
    </ul>
  );
}

/**
 * The strip, then the ways to reach us on one side and the form on the other. Shared by the contact
 * page, where it opens for a plan (`prefill`) and its headings are h2 under the page's h1, and the
 * home page's closing section, where they are h3 under the section's h2.
 *
 * Plain look (owner, 2026-09-15): no tinted panel behind WhatsApp and no uppercase labels over the
 * channels. WhatsApp is still plainly first, by order, size and the one filled button; the email and
 * the address follow as a hairline list with a glyph each; the form is the one bordered box.
 */
export function ContactBody({
  heading = "h3",
  prefill = false,
  formOnPhone = true,
  source,
  ...d
}: ContactDetails & { heading?: "h2" | "h3"; prefill?: boolean; formOnPhone?: boolean; source: string }) {
  const { t, whatsapp, phone } = d;
  const c = t.contact;
  const labels: LeadFormLabels = c.form;
  const H = heading;
  return (
    <div className="space-y-8 sm:space-y-10">
      <ContactStrip {...d} />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-12">
        <div>
          {whatsapp ? (
            <div className="border-b border-line pb-6">
              <H className="flex items-center gap-2 text-xl font-extrabold text-ink">
                <WhatsAppIcon className="shrink-0 text-brand" />
                {c.wa.title}
              </H>
              <p className="mt-4">
                {/* `phone` is written for people and already carries its plus; `whatsapp` is bare digits. */}
                <a href={`tel:+${whatsapp}`} className="tabular text-[2rem] font-extrabold leading-none text-ink hover:text-brand-strong">
                  <bdi dir="ltr">{phone?.trim() || `+${whatsapp}`}</bdi>
                </a>
              </p>
              <div className="mt-5">
                <WaLink
                  number={whatsapp}
                  text={c.wa.defaultText}
                  planText={prefill ? c.wa.planText : undefined}
                  className="btn-primary inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-6 text-base font-bold sm:w-auto"
                >
                  <WhatsAppIcon />
                  {c.wa.cta}
                </WaLink>
              </div>
            </div>
          ) : null}
          <dl className="divide-y divide-line">
            <div className="py-5">
              <dt className="flex items-center gap-2 text-sm font-bold text-ink">
                <EnvelopeSimpleIcon size={18} weight="bold" aria-hidden="true" className="shrink-0 text-muted" />
                {c.email}
              </dt>
              <dd className="mt-1">
                <a href={`mailto:${d.contactEmail}`} className="flex min-h-11 items-center break-all font-bold text-brand-strong hover:underline" dir="ltr">
                  {d.contactEmail}
                </a>
                <p className="text-sm text-muted">{c.emailBody}</p>
              </dd>
            </div>
            <div className="py-5">
              <dt className="flex items-center gap-2 text-sm font-bold text-ink">
                <MapPinIcon size={18} weight="bold" aria-hidden="true" className="shrink-0 text-muted" />
                {c.address}
              </dt>
              <dd className="mt-2">
                <p className="font-bold text-ink">{d.legalName}</p>
                <address className="mt-1 text-sm not-italic text-muted">{d.address}</address>
                <p className="mt-1 text-sm text-muted">{c.addressBody}</p>
              </dd>
            </div>
            {/* The status page, only once it exists (S14): an empty STATUS_URL draws nothing. */}
            {STATUS_URL ? (
              <div className="py-5">
                <dd>
                  <a href={STATUS_URL} className="inline-flex min-h-11 items-center font-bold text-brand-strong hover:underline">
                    {c.status}
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
        {/*
         * On the home page a phone gets the heading and a link to the contact page instead of the form
         * (`formOnPhone={false}`): the form was 665px of a page the owner wants at about seven phone
         * screens (S1, verify), and the contact page opens with the same form. From sm the form is here.
         */}
        {formOnPhone ? null : (
          <div className="border-t border-line pt-6 sm:hidden">
            <H className="text-xl font-extrabold text-ink">{c.form.title}</H>
            <ArrowLink href={contactHref(d.locale)} className="mt-2 text-base">
              {c.formLink}
            </ArrowLink>
          </div>
        )}
        {/* A panel from sm up; on a phone a hairline instead, as the domain search does: a box inside a 350px screen costs the options their second column. */}
        <div className={`border-t border-line pt-6 sm:rounded-lg sm:border sm:bg-panel sm:p-7 sm:shadow-[var(--card-shadow)] ${formOnPhone ? "" : "max-sm:hidden"}`}>
          <H className="text-xl font-extrabold text-ink">{c.form.title}</H>
          <div className="mt-6">
            <LeadForm
              endpoint={d.leadUrl}
              labels={labels}
              locale={d.locale}
              dir={dirFor(d.locale)}
              turnstileSiteKey={d.turnstileSiteKey}
              waHref={whatsapp ? waHref(whatsapp, c.wa.defaultText) : "#"}
              source={source}
              prefill={prefill}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/** The home page's closing section: a statement heading, then the same block as the contact page. */
export function ContactSection(d: ContactDetails) {
  return (
    <Section id="contact">
      <SectionHeader title={d.t.contact.h2} />
      <ContactBody {...d} formOnPhone={false} source="home-contact" />
    </Section>
  );
}
