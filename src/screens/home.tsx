import { ArrowLink, ButtonLink, Card, Container, Facts, Section, SectionHeader } from "@/components/blocks";
import { CurrencyToggle, Price } from "@/components/currency";
import { DomainSearch } from "@/components/domain-search";
import { HeroIllustration } from "@/components/illustration";
import { PlanCard } from "@/components/plans";
import { ProductCard } from "@/components/products";
import { Shell } from "@/components/shell";
import { localizedSummary, summaryWithoutDelivery } from "@/lib/format";
import { pageMetadata } from "@/lib/metadata";
import { anchorFor, pathFor, type Locale } from "@/lib/i18n";
import { WHATSAPP_NUMBER } from "@/lib/site";
import { messagesFor, type Messages } from "@/messages";
import type { Catalogue, Product } from "@/lib/catalogue";
import { HIGHLIGHT, assistantOn, domainSearchLabels, loc, screenContext, storeApi, vatLine } from "./shared";

/**
 * Home: hero, the four products, what every account includes, three hosting plans, websites and
 * care at a glance, the domain search, the migration offer, about and contact. Everything a visitor
 * needs to decide is on this page; the product pages carry the full tables.
 */
export const home = {
  metadata(locale: Locale) {
    const t = messagesFor(locale);
    return pageMetadata("home", locale, t.home.h1, t.meta.description);
  },
  async render(locale: Locale) {
    const { t, catalogue, company } = await screenContext(locale);
    const hosting = catalogue.products.hosting;
    const featured = ["hosting-xs", HIGHLIGHT.hosting, "hosting-xl"].map((slug) => hosting.find((p) => p.slug === slug)).filter((p): p is NonNullable<typeof p> => Boolean(p));
    const fromPrice = (kind: "hosting" | "build" | "care") => {
      const list = catalogue.products[kind];
      const cheapest = list.reduce<(typeof list)[number] | null>((min, p) => (!min || (p.prices.EGP?.gross ?? Infinity) < (min.prices.EGP?.gross ?? Infinity) ? p : min), null);
      return cheapest?.prices.EGP ? `${t.common.from} ${cheapest.prices.EGP.formatted.replace(/\.00$/, "")}` : undefined;
    };
    const api = storeApi(catalogue);
    // A telephone number is not a WhatsApp number. WHATSAPP_NUMBER is the only thing that puts a
    // "message us on WhatsApp" card on the page; the company's phone number gets a phone card, and
    // both can be shown, because they are two different ways to reach the same people.
    const whatsapp = WHATSAPP_NUMBER;
    const phone = catalogue.company.phone;
    const label = "text-xs font-extrabold uppercase tracking-[0.14em] text-brand";
    return (
      <Shell locale={locale} page="home" storeUrl={catalogue.store.url} legalName={company.legalName} address={company.address} supportEmail={company.supportEmail} assistantEnabled={catalogue.assistant.enabled}>
        <section className="glow relative overflow-hidden border-b border-line">
          <Container className="grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
            <div>
              <h1 className="rise max-w-xl text-4xl font-extrabold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-[3.6rem]">{t.home.h1}</h1>
              <p className="rise-2 mt-6 max-w-xl text-lg text-muted sm:text-xl">{t.home.lede}</p>
              <div className="rise-3 mt-8 flex flex-wrap gap-3">
                <ButtonLink href={pathFor("hosting", locale)} size="lg">
                  {t.home.ctaPlans}
                </ButtonLink>
                <ButtonLink href={pathFor("websites", locale)} variant="secondary" size="lg">
                  {t.home.ctaBuild}
                </ButtonLink>
              </div>
              <Facts items={t.home.facts} className="rise-4 mt-8" />
            </div>
            <div className="rise-2 hidden justify-center lg:flex">
              <HeroIllustration labels={[t.nav.websites, t.home.why[2]!.title, t.contact.email, t.home.why[0]!.title]} title={t.home.h1} />
            </div>
          </Container>
        </section>

        <Section>
          <SectionHeader title={t.home.productsTitle} />
          <ul data-reveal-stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <ProductCard kind="hosting" title={t.home.products.hosting.title} body={t.home.products.hosting.body} link={t.home.products.hosting.link} href={pathFor("hosting", locale)} meta={fromPrice("hosting")} />
            <ProductCard kind="websites" title={t.home.products.websites.title} body={t.home.products.websites.body} link={t.home.products.websites.link} href={pathFor("websites", locale)} meta={fromPrice("build")} />
            <ProductCard kind="care" title={t.home.products.care.title} body={t.home.products.care.body} link={t.home.products.care.link} href={pathFor("care", locale)} meta={fromPrice("care")} />
            <ProductCard kind="domains" title={t.home.products.domains.title} body={t.home.products.domains.body} link={t.home.products.domains.link} href={anchorFor("domains", locale)} />
          </ul>
        </Section>

        <Section tone="dark">
          <SectionHeader title={t.home.whyTitle} light />
          <ul data-reveal-stagger className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {t.home.why.map((f) => (
              <li key={f.title} className="border-t border-dark-line pt-5">
                <h3 className="text-xl font-extrabold text-white">{f.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-dark-muted">{f.body}</p>
              </li>
            ))}
          </ul>
        </Section>

        {featured.length ? (
          <Section>
            <SectionHeader kicker={t.nav.hosting} title={t.home.pricingTitle} lede={t.home.pricingLede} right={<ArrowLink href={pathFor("hosting", locale)}>{t.home.compareLink}</ArrowLink>} />
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-muted">{vatLine(t, catalogue)}</p>
              <CurrencyToggle label={t.common.currency} hint={t.common.currencyHint} />
            </div>
            <ul data-reveal-stagger className="grid gap-5 md:grid-cols-3">
              {featured.map((p) => (
                <li key={p.slug}>
                  <PlanCard product={p} locale={locale} highlight={p.slug === HIGHLIGHT.hosting} cycleLabel={t.common.perYear} cta={t.common.order} compact />
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        {catalogue.products.build.length || catalogue.products.care.length ? (
          <Section tone="alt">
            <SectionHeader title={t.home.glanceTitle} lede={t.home.glanceLede} />
            <div data-reveal-stagger className="grid gap-5 md:grid-cols-2">
              {catalogue.products.build.length ? <Glance title={t.home.products.websites.title} items={catalogue.products.build} cycle={t.common.oneTime} link={[pathFor("websites", locale), t.home.products.websites.link]} locale={locale} t={t} /> : null}
              {catalogue.products.care.length ? <Glance title={t.home.products.care.title} items={catalogue.products.care} cycle={t.common.perYear} link={[pathFor("care", locale), t.home.products.care.link]} locale={locale} t={t} /> : null}
            </div>
          </Section>
        ) : null}

        <Section id="domains">
          <SectionHeader kicker={t.nav.domains} title={t.home.domainsTitle} lede={t.home.domainsLede} right={<ArrowLink href={pathFor("domains", locale)}>{t.home.products.domains.link}</ArrowLink>} />
          <div className="rounded-2xl border border-line bg-panel p-5 sm:p-8">
            <DomainSearch locale={locale} storeSearchUrl={catalogue.store.domainSearchUrl} apiUrl={api.domainSearch} ideasUrl={api.domainIdeas} contactHref={anchorFor("contact", locale)} labels={domainSearchLabels(t)} ideas={assistantOn(catalogue)} />
          </div>
        </Section>

        <Container className="pb-4">
          <div className="band-gradient flex flex-wrap items-center justify-between gap-6 rounded-2xl px-7 py-9 sm:px-10">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t.home.moveTitle}</h2>
              <p className="mt-2 max-w-xl text-white/90">{t.home.moveBody}</p>
            </div>
            <ButtonLink href={anchorFor("contact", locale)} variant="white" size="lg">
              {t.home.moveCta}
            </ButtonLink>
          </div>
        </Container>

        <Section id="contact" tone="alt">
          <SectionHeader kicker={t.contact.title} title={t.contact.h2} lede={t.contact.lede} />
          <ul data-reveal-stagger className="grid gap-5 md:grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]">
            <Card as="li" className="h-full">
              <h3 className={label}>{t.contact.email}</h3>
              <a href={`mailto:${company.supportEmail}`} className="mt-3 block break-all text-xl font-extrabold text-brand-strong hover:underline" dir="ltr">
                {company.supportEmail}
              </a>
              <p className="mt-2 text-sm text-muted">{t.contact.emailBody}</p>
            </Card>
            {whatsapp ? (
              <Card as="li" className="h-full">
                <h3 className={label}>{t.contact.whatsapp}</h3>
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
            ) : null}
            {phone ? (
              <Card as="li" className="h-full">
                <h3 className={label}>{t.contact.phone}</h3>
                <a href={`tel:${phone.replace(/[^0-9+]/g, "")}`} className="mt-3 block text-xl font-extrabold text-ink hover:text-brand-strong">
                  <bdi dir="ltr" className="tabular">
                    {phone}
                  </bdi>
                </a>
                <p className="mt-2 text-sm text-muted">{t.contact.whatsappBody}</p>
              </Card>
            ) : null}
            <Card as="li" className="h-full">
              <h3 className={label}>{t.contact.address}</h3>
              <p className="mt-3 font-semibold text-ink">{company.legalName}</p>
              <address className="mt-1 not-italic text-ink">{company.address}</address>
              <p className="mt-2 text-sm text-muted">{t.contact.addressBody}</p>
            </Card>
          </ul>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-x-8 gap-y-3 text-sm text-muted">
            <p>{t.contact.micro}</p>
            <p>
              {t.contact.existing}{" "}
              <a href={catalogue.store.loginUrl} className="font-bold text-brand-strong hover:text-brand" rel="noopener">
                {t.contact.existingCta}
              </a>
            </p>
          </div>
        </Section>
      </Shell>
    );
  },
};

/** One product family in brief: name, one line and the price, then the link to the full page. */
function Glance({ title, items, cycle, link, locale, t }: { title: string; items: Product[]; cycle: string; link: [string, string]; locale: Locale; t: Messages }) {
  return (
    <Card className="flex h-full flex-col">
      <h3 className="text-xl font-extrabold text-ink">{title}</h3>
      <ul className="mt-4 flex-1">
        {items.map((p) => {
          const summary = summaryWithoutDelivery(localizedSummary(p, locale, t));
          return (
            <li key={p.slug} className="flex items-start justify-between gap-4 border-t border-line py-3 first:border-t-0">
              <div className="min-w-0">
                <p className="font-bold text-ink">{loc(p.name, locale)}</p>
                {summary ? <p className="mt-0.5 text-sm text-muted">{summary}</p> : null}
              </div>
              <p className="shrink-0 text-end text-sm text-muted">
                <Price prices={p.prices} locale={locale} fallback={t.common.notAvailable} className="font-extrabold text-ink" />
                <span className="block text-xs">{cycle}</span>
              </p>
            </li>
          );
        })}
      </ul>
      <div className="mt-5">
        <ArrowLink href={link[0]}>{link[1]}</ArrowLink>
      </div>
    </Card>
  );
}

export type { Catalogue };
