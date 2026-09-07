import { ArrowLink, ButtonLink, Container, Facts, Section, SectionHeader } from "@/components/blocks";
import { CurrencyToggle } from "@/components/currency";
import { HeroIllustration } from "@/components/illustration";
import { PlanCard } from "@/components/plans";
import { ProductCard } from "@/components/products";
import { Shell } from "@/components/shell";
import { pageMetadata } from "@/lib/metadata";
import { pathFor, type Locale } from "@/lib/i18n";
import { messagesFor } from "@/messages";
import { HIGHLIGHT, screenContext, vatLine } from "./shared";

/** Home: hero, stack, the four products, what every account includes, three plans, the migration offer. */
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
    return (
      <Shell locale={locale} page="home" storeUrl={catalogue.store.url} legalName={company.legalName} address={company.address} supportEmail={company.supportEmail}>
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
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <ProductCard kind="hosting" title={t.home.products.hosting.title} body={t.home.products.hosting.body} link={t.home.products.hosting.link} href={pathFor("hosting", locale)} meta={fromPrice("hosting")} />
            <ProductCard kind="websites" title={t.home.products.websites.title} body={t.home.products.websites.body} link={t.home.products.websites.link} href={pathFor("websites", locale)} meta={fromPrice("build")} />
            <ProductCard kind="care" title={t.home.products.care.title} body={t.home.products.care.body} link={t.home.products.care.link} href={pathFor("care", locale)} meta={fromPrice("care")} />
            <ProductCard kind="domains" title={t.home.products.domains.title} body={t.home.products.domains.body} link={t.home.products.domains.link} href={pathFor("domains", locale)} />
          </ul>
        </Section>

        <Section tone="dark">
          <SectionHeader title={t.home.whyTitle} light />
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
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
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <p className="text-sm text-muted">{vatLine(t, catalogue)}</p>
              <CurrencyToggle label={t.common.currency} hint={t.common.currencyHint} />
            </div>
            <ul className="grid gap-5 md:grid-cols-3">
              {featured.map((p) => (
                <li key={p.slug}>
                  <PlanCard product={p} locale={locale} highlight={p.slug === HIGHLIGHT.hosting} cycleLabel={t.common.perYear} cta={t.common.order} compact />
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        <Container className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-6 rounded-2xl bg-gradient-to-r from-brand to-accent px-7 py-9 text-white sm:px-10">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t.home.moveTitle}</h2>
              <p className="mt-2 max-w-xl text-white/90">{t.home.moveBody}</p>
            </div>
            <ButtonLink href={pathFor("contact", locale)} variant="white" size="lg">
              {t.home.moveCta}
            </ButtonLink>
          </div>
        </Container>
      </Shell>
    );
  },
};
