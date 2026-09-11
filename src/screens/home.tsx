import { ArrowLink, ButtonLink, Card, Container, Facts, Section, SectionHeader } from "@/components/blocks";
import { Val } from "@/components/bidi";
import { Price } from "@/components/currency";
import { DomainSearch } from "@/components/domain-search";
import { ContactSection } from "@/components/contact";
import { HeroIllustration } from "@/components/illustration";
import { ProductCard } from "@/components/products";
import { Shell } from "@/components/shell";
import { Tabs } from "@/components/tabs";
import { featureValue, localizedSummary, summaryWithoutDelivery } from "@/lib/format";
import { pageMetadata } from "@/lib/metadata";
import { anchorFor, pathFor, type Locale } from "@/lib/i18n";
import { WHATSAPP_NUMBER } from "@/lib/site";
import { messagesFor, type Messages } from "@/messages";
import type { Catalogue, Product } from "@/lib/catalogue";
import { HIGHLIGHT, assistantOn, domainSearchLabels, loc, screenContext, storeApi, vatLine } from "./shared";

/**
 * Home: hero, the four products, what every account includes, every plan we sell on three tabs,
 * the domain search, the migration offer, about and contact. Everything a visitor needs to decide
 * is on this page; the product pages carry the full tables.
 */
export const home = {
  metadata(locale: Locale) {
    const t = messagesFor(locale);
    return pageMetadata("home", locale, t.home.h1, t.meta.description);
  },
  async render(locale: Locale) {
    const { t, catalogue, company, trust } = await screenContext(locale);
    /*
     * The three families, in the order a visitor meets them in the menu. A family the store has
     * nothing in simply has no tab; with none of them there is no section at all.
     */
    const tabs = (
      [
        { id: "hosting", label: t.nav.hosting, items: catalogue.products.hosting, cycle: t.common.perYear, detail: "storage" as const, link: [pathFor("hosting", locale), t.home.compareLink] as const, highlight: HIGHLIGHT.hosting },
        { id: "websites", label: t.nav.websites, items: catalogue.products.build, cycle: t.common.oneTime, detail: "summary" as const, link: [pathFor("websites", locale), t.home.products.websites.link] as const, highlight: undefined },
        { id: "care", label: t.nav.care, items: catalogue.products.care, cycle: t.common.perYear, detail: "summary" as const, link: [pathFor("care", locale), t.home.products.care.link] as const, highlight: undefined },
      ] as const
    ).filter((tab) => tab.items.length > 0);
    const fromPrice = (kind: "hosting" | "build" | "care") => {
      const list = catalogue.products[kind];
      const cheapest = list.reduce<(typeof list)[number] | null>((min, p) => (!min || (p.prices.EGP?.gross ?? Infinity) < (min.prices.EGP?.gross ?? Infinity) ? p : min), null);
      return cheapest?.prices.EGP ? `${t.common.from} ${cheapest.prices.EGP.formatted.replace(/\.00$/, "")}` : undefined;
    };
    // Domains price from the cheapest ending we sell, so the card carries a number like the other three.
    const cheapestTld = catalogue.tlds.reduce<(typeof catalogue.tlds)[number] | null>(
      (min, x) => (x.prices.EGP && (!min || x.prices.EGP.register.gross < min.prices.EGP!.register.gross) ? x : min),
      null,
    );
    const fromDomain = cheapestTld?.prices.EGP ? `${t.common.from} ${cheapestTld.prices.EGP.register.formatted.replace(/\.00$/, "")}` : undefined;
    const api = storeApi(catalogue);
    // A telephone number is not a WhatsApp number. WHATSAPP_NUMBER is the only thing that puts a
    // "message us on WhatsApp" card on the page; the company's phone number gets a phone card, and
    // both can be shown, because they are two different ways to reach the same people.
    /*
     * The WhatsApp number, from the store's own company settings unless this site is told otherwise.
     * WHATSAPP_NUMBER stays as an override for the day the WhatsApp line is not the phone line, but
     * it is not required: an empty one used to hide the entire WhatsApp panel silently, which on a
     * page whose whole point is "WhatsApp first" is the worst way for a setting to be missing.
     */
    const phone = catalogue.company.phone;
    const whatsapp = WHATSAPP_NUMBER || (phone ?? "").replace(/[^0-9]/g, "") || null;
    return (
      <Shell locale={locale} page="home" storeUrl={catalogue.store.url} legalName={company.legalName} supportEmail={company.contactEmail} trust={trust} assistantEnabled={catalogue.assistant.enabled} turnstileSiteKey={catalogue.assistant.turnstileSiteKey}>
        <section className="relative overflow-hidden">
          <Container className="grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
            <div>
              <h1 className="rise max-w-xl text-balance text-4xl font-extrabold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-[3.6rem]">{t.home.h1}</h1>
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

        <Section tone="alt">
          <SectionHeader title={t.home.productsTitle} />
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <ProductCard kind="hosting" title={t.home.products.hosting.title} body={t.home.products.hosting.body} link={t.home.products.hosting.link} href={pathFor("hosting", locale)} meta={fromPrice("hosting")} />
            <ProductCard kind="websites" title={t.home.products.websites.title} body={t.home.products.websites.body} link={t.home.products.websites.link} href={pathFor("websites", locale)} meta={fromPrice("build")} />
            <ProductCard kind="care" title={t.home.products.care.title} body={t.home.products.care.body} link={t.home.products.care.link} href={pathFor("care", locale)} meta={fromPrice("care")} />
            <ProductCard kind="domains" title={t.home.products.domains.title} body={t.home.products.domains.body} link={t.home.products.domains.link} href={anchorFor("domains", locale)} meta={fromDomain} />
          </ul>
        </Section>

        {/*
         * Plain surface-alt, like every other alternating section. It used to be the one block on
         * the page painted in a colour of its own, which made a list of what every account includes
         * read as a separate advertisement rather than as part of the same page.
         */}
        <Section>
          <SectionHeader title={t.home.whyTitle} />
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {t.home.why.map((f) => (
              <li key={f.title} className="border-t border-line pt-5">
                <h3 className="text-xl font-extrabold text-ink">{f.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{f.body}</p>
              </li>
            ))}
          </ul>
        </Section>

        {/*
         * One section for everything that has a price. Hosting used to stand on its own above a
         * second section that carried websites and care as two lists, which put the same three
         * questions — what is it, what does it include, what does it cost — in two different
         * shapes on one page. Three tabs over one box answer them the same way.
         */}
        {tabs.length ? (
          <Section tone="alt">
            <SectionHeader title={t.home.plansTitle} lede={t.home.plansLede} />
            <Tabs
              label={t.home.plansTabsLabel}
              items={tabs.map((tab) => ({
                id: tab.id,
                label: tab.label,
                panel: <PlanList items={tab.items} cycle={tab.cycle} detail={tab.detail} link={tab.link} highlight={tab.highlight} locale={locale} t={t} />,
              }))}
            />
            <p className="mt-4 text-sm text-muted">{vatLine(t, catalogue)}</p>
          </Section>
        ) : null}

        <Section id="domains">
          <SectionHeader kicker={t.nav.domains} title={t.home.domainsTitle} lede={t.home.domainsLede} right={<ArrowLink href={pathFor("domains", locale)}>{t.home.products.domains.link}</ArrowLink>} />
          <div className="rounded-2xl border border-line bg-panel p-5 sm:p-8">
            <DomainSearch locale={locale} searchPath={pathFor("domains", locale)} cartUrl={api.cartDomain} apiUrl={api.domainSearch} ideasUrl={api.domainIdeas} contactHref={anchorFor("contact", locale)} labels={domainSearchLabels(t)} ideas={assistantOn(catalogue)} turnstileSiteKey={catalogue.assistant.turnstileSiteKey} />
          </div>
        </Section>

        {/*
         * A page-level invitation, not the tail of the section above it. A rule was not enough: on
         * the same background as the headed "Domains" section directly above, it still read as a
         * fourth thing about domains. Its own ground is what separates it.
         */}
        <Section tone="alt">
          <div>
            <div className="band flex flex-wrap items-center justify-between gap-6 rounded-2xl px-7 py-9 sm:px-10">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t.home.moveTitle}</h2>
                <p className="mt-2 max-w-xl text-white/90">{t.home.moveBody}</p>
              </div>
              <ButtonLink href={pathFor("hosting", locale)} variant="white" size="lg">
                {t.home.moveCta}
              </ButtonLink>
            </div>
          </div>
        </Section>

        <ContactSection
          locale={locale}
          t={t}
          whatsapp={whatsapp}
          phone={phone}
          contactEmail={company.contactEmail}
          supportEmail={company.supportEmail}
          legalName={company.legalName}
          address={company.address}
          storeUrl={catalogue.store.url.replace(/\/+$/, "")}
          leadUrl={api.lead}
          turnstileSiteKey={catalogue.assistant.turnstileSiteKey}
        />
      </Shell>
    );
  },
};

/**
 * Every plan of one family, each on a row: the name, one short detail, and the price. Hosting is
 * compared on how much room it gives, so its detail is the storage; a website package and a care
 * plan are chosen by what they are for, so theirs is the summary the store writes.
 */
function PlanList({
  items,
  cycle,
  detail,
  link,
  highlight,
  locale,
  t,
}: {
  items: readonly Product[];
  cycle: string;
  detail: "storage" | "summary";
  link: readonly [string, string];
  highlight?: string;
  locale: Locale;
  t: Messages;
}) {
  return (
    <Card className="flex flex-col">
      {/* Two columns once there are more rows than fit comfortably on one; every row keeps its rule, so the columns read as one table. */}
      <ul className={`grid gap-x-10 border-b border-line ${items.length > 3 ? "sm:grid-cols-2" : ""}`}>
        {items.map((p) => {
          const text = detail === "storage" ? featureValue(p, locale, t, "Storage") : summaryWithoutDelivery(localizedSummary(p, locale, t));
          return (
            <li key={p.slug} className="flex items-start justify-between gap-4 border-t border-line py-3.5">
              {/* Name and detail sit on one line where there is room and wrap onto two where there is not. */}
              <div className="flex min-w-0 flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                <p className="font-bold text-ink">
                  <Val>{loc(p.name, locale)}</Val>
                </p>
                {p.slug === highlight ? <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-brand-strong">{t.common.mostChosen}</span> : null}
                {/* "1 GB NVMe" beside Arabic text reorders into "GB NVMe 1" without isolation; a translated summary is left to the page direction. */}
                {text ? (
                  <p className="text-sm text-muted">
                    <Val>{text}</Val>
                  </p>
                ) : null}
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
