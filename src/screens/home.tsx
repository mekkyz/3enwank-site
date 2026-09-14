import { ArrowLink, ButtonLink, Card, Container, Section, SectionHeader } from "@/components/blocks";
import { Val } from "@/components/bidi";
import { Price, RenewalNote } from "@/components/currency";
import { DomainSearch } from "@/components/domain-search";
import { ContactSection } from "@/components/contact";
import { ProductCard } from "@/components/products";
import { Shell } from "@/components/shell";
import { JsonLd } from "@/components/json-ld";
import { faqLd, graph, organizationLd, websiteLd } from "@/lib/structured-data";
import { Tabs } from "@/components/tabs";
import { localizedFeatures, localizedSummary, normalPrices, parseFeature, summaryWithoutDelivery } from "@/lib/format";
import { pageMetadata } from "@/lib/metadata";
import { anchorFor, pathFor, storeLink, type Locale } from "@/lib/i18n";
import { WHATSAPP_NUMBER } from "@/lib/site";
import { messagesFor, type Messages } from "@/messages";
import type { Catalogue, Product } from "@/lib/catalogue";
import type { Currency, Money } from "@/lib/money";
import { HIGHLIGHT, assistantOn, domainSearchLabels, loc, screenContext, storeApi } from "./shared";
import { vatLine } from "@/lib/vat";
import { MapPinIcon, HeadsetIcon, WalletIcon, ArrowsLeftRightIcon, CloudArrowUpIcon, LockKeyIcon, WallIcon, UserSoundIcon, CaretDownIcon } from "@phosphor-icons/react/dist/ssr";

/**
 * Home: hero, the four products, what every account includes, three plans of each family on three
 * tabs, the domain search, the migration offer and contact. Everything a visitor needs to decide is
 * on this page; the product pages carry every tier and the full tables.
 */
export const home = {
  metadata(locale: Locale) {
    const t = messagesFor(locale);
    // home.metaTitle, not the h1: the h1 is a 77-character hero line and made the title the heading verbatim, cut by every search result.
    return pageMetadata("home", locale, t.home.metaTitle, t.meta.description);
  },
  async render(locale: Locale) {
    const { t, catalogue, company, trust } = await screenContext(locale);
    const vat = vatLine(t, catalogue);
    /*
     * The three families, in the order a visitor meets them in the menu, three plans each and three
     * specs on each plan. Every tier used to be listed here, which put six hosting plans on the page
     * separated by one disk size: nobody decides between 1 GB and 2 GB for 500 EGP more. Three tiers
     * far enough apart to be three different answers, and a link to the page that still has them all.
     *
     * A family the store has nothing in simply has no tab; with none of them there is no section.
     */
    const families = [
      {
        id: "hosting",
        label: t.nav.hosting,
        items: threeOf(catalogue.products.hosting, ["hosting-xs", "hosting-m", "hosting-xl"]),
        cycle: t.common.perYear,
        /*
         * How many sites, how much mail, how much room: the three a plan is actually outgrown on.
         * The catalogue files the site count under "Domains". Bandwidth, databases and FTP accounts
         * are real differences too, and they are on the hosting page, where a table can hold them.
         */
        specs: (p: Product) => labelledSpecs(p, locale, t, ["Domains", "Email accounts", "Storage"]),
        link: [pathFor("hosting", locale), t.home.allPlans.hosting] as const,
        highlight: HIGHLIGHT.hosting,
      },
      {
        id: "websites",
        label: t.nav.websites,
        items: threeOf(catalogue.products.build, ["business-card", "business-website", "online-store"]),
        cycle: t.common.oneTime,
        /*
         * A build has no gigabytes to compare. Its catalogue features are plain lines, and the first
         * three of a package's own lines are exactly what separates it from the one below: how big
         * the site is, what a visitor can do on it, and what it is wired up to. The inherited
         * "Everything in <the package below>" line and the note that hosting is billed separately
         * are dropped, because neither tells you which package to buy.
         */
        specs: (p: Product) => scopeSpecs(p, locale, t),
        link: [pathFor("websites", locale), t.home.allPlans.websites] as const,
        highlight: HIGHLIGHT.build,
      },
      {
        id: "care",
        label: t.nav.care,
        items: threeOf(catalogue.products.care, ["care-basic", "care-plus", "care-pro"]),
        cycle: t.common.perYear,
        /*
         * A care plan is bought for how often someone looks at the site, how many changes it buys
         * and how fast the answer comes, so those are the three. The malware scan follows the
         * update cadence exactly, and restores and reports are the fine print of the care page.
         */
        specs: (p: Product) => labelledSpecs(p, locale, t, ["Updates", "Content changes", "Reply time"]),
        link: [pathFor("care", locale), t.home.allPlans.care] as const,
        highlight: HIGHLIGHT.care,
      },
    ].filter((family) => family.items.length > 0);
    /*
     * "From EGP 1,999" on the four product cards, through the same <Price> island the plan cards
     * use, so it follows the currency switch. It used to be a string built on the server from the
     * EGP price alone, which left a visitor who chose USD reading dollars on the plan cards and
     * pounds on the cards above them. The cheapest product is picked by its EGP price and both of
     * its prices go to the island; the store prices every product in both currencies, so the
     * cheapest in pounds is the cheapest in dollars too.
     */
    /*
     * With the renewal under it wherever the thing renews at a different price: the owner's rule is
     * that a first-year price is never shown without what it renews at (2026-09-14), and these four
     * teasers were the one place left that quoted the first year alone. A build is paid once and a
     * care plan renews at its price, so those two carry no second line; RenewalNote renders nothing
     * for an empty price set.
     */
    const from = (prices: Partial<Record<Currency, Money>> | undefined, renewal?: Partial<Record<Currency, Money>>) =>
      prices && Object.keys(prices).length ? (
        <>
          <span className="block">
            {t.common.from} <Price prices={prices} locale={locale} fallback={t.common.notAvailable} />
          </span>
          {renewal ? <RenewalNote prices={renewal} locale={locale} label={t.common.renewsAt} className="mt-1 text-xs text-muted" /> : null}
        </>
      ) : undefined;
    const fromPrice = (kind: "hosting" | "build" | "care") => {
      const list = catalogue.products[kind];
      const cheapest = list.reduce<(typeof list)[number] | null>((min, p) => (!min || (p.prices.EGP?.gross ?? Infinity) < (min.prices.EGP?.gross ?? Infinity) ? p : min), null);
      return from(cheapest?.prices, cheapest ? normalPrices(cheapest) : undefined);
    };
    // Domains price from the cheapest ending we sell, so the card carries a number like the other three.
    const cheapestTld = catalogue.tlds.reduce<(typeof catalogue.tlds)[number] | null>(
      (min, x) => (x.prices.EGP && (!min || x.prices.EGP.register.gross < min.prices.EGP!.register.gross) ? x : min),
      null,
    );
    // A name's renewal, per currency, only where it is not the registration price.
    const tldRenewal: Partial<Record<Currency, Money>> = {};
    for (const c of ["EGP", "USD"] as const) {
      const p = cheapestTld?.prices[c];
      if (p && p.renew.gross !== p.register.gross) tldRenewal[c] = p.renew;
    }
    const fromDomain = from(
      cheapestTld
        ? {
            ...(cheapestTld.prices.EGP ? { EGP: cheapestTld.prices.EGP.register } : {}),
            ...(cheapestTld.prices.USD ? { USD: cheapestTld.prices.USD.register } : {}),
          }
        : undefined,
      tldRenewal,
    );
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
        {/* Who the company is and what this site is, for search engines; the plan pages add a Product per plan. */}
        <JsonLd data={graph([organizationLd(catalogue, locale), websiteLd(catalogue, locale), faqLd(t.home.faq)])} />
        {/*
         * The hero: one statement, the line under it, and the two ways in, over a glow and a grid.
         *
         * Four earlier tries are in this file's history: a 50/50 grid with a drawing on the right, a
         * statement across the full width whose lede started at the middle of the page, a
         * seven-column measure beside a four-column rail that also held the domain search, and one
         * column of text over a bare surface. The last one left the right half of the first screen
         * empty, so the page opened like a document (owner, 2026-09-14). What fills it now is not a
         * drawing but light: a soft brand-coloured glow and a faint grid, both CSS, both still under
         * reduced motion, both toned down in the light theme. The type is one size up for the same
         * reason. The facts line that sat under the buttons became the "Why 3enwank" section below,
         * where the four claims a visitor decides on get a card each instead of 12px.
         *
         * No tracking-* utility in this block. globals.css zeroes letter-spacing under dir="rtl", so
         * a heading tuned with negative tracking is a different heading in Arabic; this one is tuned
         * with size and leading, which both locales get.
         */}
        <section className="relative overflow-hidden">
          <div aria-hidden="true" className="hero-bg">
            <div className="hero-glow" />
            <div className="hero-grid" />
          </div>
          <Container className="relative pb-14 pt-12 sm:pb-16 sm:pt-16 lg:pb-20 lg:pt-20">
            {/* One measure for all three: statement, lede and buttons share the left edge. */}
            <div className="max-w-3xl">
              <h1 className="rise text-balance text-[2rem] font-extrabold leading-[1.14] text-ink sm:text-[2.5rem] sm:leading-[1.1] lg:text-[3rem]">{t.home.h1}</h1>
              <p className="rise-2 mt-4 max-w-2xl text-pretty text-base leading-relaxed text-muted sm:mt-5 sm:text-lg">{t.home.lede}</p>
              {/*
               * The two ways in, as buttons. They were a pair of arrow links in the rail, which put
               * the only two commercial paths on the page in the margin, in the weight this site
               * uses for "read more", while the one filled button in the hero belonged to a domain
               * search that is no use to a visitor who already has a domain or does not want one.
               *
               * Both buttons, one filled: a visitor who knows what they want clicks the plan, a
               * visitor who wants it built clicks the other, and the search further down still
               * catches the one who came for a name.
               */}
              <div className="rise-3 mt-6 flex flex-wrap gap-3 sm:mt-7">
                <ButtonLink href={pathFor("hosting", locale)} size="lg">
                  {t.home.ctaPlans}
                </ButtonLink>
                <ButtonLink href={pathFor("websites", locale)} variant="secondary" size="lg">
                  {t.home.ctaBuild}
                </ButtonLink>
              </div>
            </div>
          </Container>
        </section>

        {/*
         * Why 3enwank: the four claims that used to be the facts line, one card each with an icon,
         * and under them the ways to pay. Plain ground right after the hero, so the hero's glow
         * ends where this starts; the tinted product cards follow.
         */}
        <Section className="border-t border-line">
          <SectionHeader title={t.home.reasonsTitle} />
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {t.home.reasons.map((r, i) => {
              const Glyph = REASON_ICONS[i] ?? REASON_ICONS[0]!;
              return (
                <Card key={r.title} as="li" className="flex h-full flex-col">
                  <div data-tone={i % 2 ? "accent" : "brand"} className={`card-icon flex h-11 w-11 items-center justify-center rounded-full ${i % 2 ? "bg-accent-soft text-accent" : "bg-brand-soft text-brand"}`}>
                    <Glyph aria-hidden="true" size={22} weight="bold" />
                  </div>
                  <h3 className="mt-4 text-lg font-extrabold text-ink">{r.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted">{r.body}</p>
                </Card>
              );
            })}
          </ul>
          <p className="mt-6 text-sm font-semibold text-muted">{t.home.paymentsLine}</p>
        </Section>

        <Section tone="alt">
          <SectionHeader title={t.home.productsTitle} />
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <ProductCard kind="hosting" title={t.home.products.hosting.title} body={t.home.products.hosting.body} link={t.home.products.hosting.link} href={pathFor("hosting", locale)} meta={fromPrice("hosting")} />
            <ProductCard kind="websites" title={t.home.products.websites.title} body={t.home.products.websites.body} link={t.home.products.websites.link} href={pathFor("websites", locale)} meta={fromPrice("build")} />
            <ProductCard kind="care" title={t.home.products.care.title} body={t.home.products.care.body} link={t.home.products.care.link} href={pathFor("care", locale)} meta={fromPrice("care")} />
            <ProductCard kind="domains" title={t.home.products.domains.title} body={t.home.products.domains.body} link={t.home.products.domains.link} href={pathFor("domains", locale)} meta={fromDomain} />
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
            {t.home.why.map((f, i) => {
              const Glyph = WHY_ICONS[i] ?? WHY_ICONS[0]!;
              return (
                <li key={f.title} data-reveal="" className="border-t border-line pt-5">
                  {/* Same 22px glyph the product cards carry, on the line rather than in a disc: a list, not a card. */}
                  <Glyph aria-hidden="true" size={22} weight="bold" className="text-brand" />
                  <h3 className="mt-3 text-xl font-extrabold text-ink">{f.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted">{f.body}</p>
                </li>
              );
            })}
          </ul>
        </Section>

        {/*
         * One section for everything that has a price. Hosting used to stand on its own above a
         * second section that carried websites and care as two lists, which put the same three
         * questions, what is it, what does it include and what does it cost, in two different shapes
         * on one page. Three tabs answer them the same way, and each tab answers with three cards
         * rather than with every tier the family has.
         */}
        {families.length ? (
          <Section tone="alt">
            <SectionHeader title={t.home.plansTitle} lede={t.home.plansLede} />
            {/* The three tabs stay: one box, one shape, and the family a visitor came for is one press away rather than two screens down. */}
            <Tabs
              label={t.home.plansTabsLabel}
              items={families.map((family) => ({
                id: family.id,
                label: family.label,
                panel: <PlanCards items={family.items} cycle={family.cycle} specs={family.specs} link={family.link} highlight={family.highlight} locale={locale} t={t} />,
              }))}
            />
            {vat ? <p className="mt-4 text-sm text-muted">{vat}</p> : null}
          </Section>
        ) : null}

        {/*
         * The domain search, under the plans and above the invitation to move. It was the largest
         * thing in the hero until now, which made the first offer on the page a name rather than
         * hosting; here it meets a visitor who has just read what a plan costs and needs the one
         * thing the plan does not come with.
         *
         * id="domains" is kept for old inbound links only. Nothing in the app links to it any more:
         * the one caller, the Domains product card above, now goes to pathFor("domains", locale),
         * which is the right destination, since that page carries this same search plus every ending
         * we sell and what each costs. A link from the home page down to a cut-down copy of that on
         * the home page would be the worse of the two. The offset the anchor lands with is
         * scroll-margin-top on section[id] in globals.css, which follows the header's two heights. The
         * scroll-mt-24 that used to be on this line was inert, and one fixed utility value could not
         * have cleared both bars anyway.
         *
         * A hairline above it, and tinted like the plans section: two tinted bands in a row read as
         * one page, and the rule is what says they are two sections. The band below is plain, so the
         * alternation carries on from here.
         */}
        <Section id="domains" tone="alt" className="border-t border-line">
          <SectionHeader kicker={t.nav.domains} title={t.home.domainsTitle} lede={t.home.domainsLede} right={<ArrowLink href={pathFor("domains", locale)}>{t.home.products.domains.link}</ArrowLink>} />
          {/*
           * A panel from sm up, and on a phone no panel at all: a card inside a 350px screen costs
           * 34px of it, which is what pushed the widget's own three tabs wider than the screen. On a
           * phone the search is a heading and a field, like the rest of the page.
           *
           * No `tlds`: the widget draws every ending we sell as a row of pills when it is given them,
           * which is the right thing on the domains page and forty pills here.
           */}
          <div className="sm:rounded-2xl sm:border sm:border-line sm:bg-panel sm:p-8">
            <DomainSearch locale={locale} searchPath={pathFor("domains", locale)} cartUrl={api.cartDomain} apiUrl={api.domainSearch} ideasUrl={api.domainIdeas} contactHref={anchorFor("contact", locale)} labels={domainSearchLabels(t)} ideas={assistantOn(catalogue)} turnstileSiteKey={catalogue.assistant.turnstileSiteKey} />
          </div>
        </Section>

        {/*
         * A page-level invitation, not the tail of the section above it. Plain ground is what
         * separates it from the tinted domain section, as it did from the tinted plans section
         * before the search moved down here.
         */}
        <Section>
          <div>
            <div data-reveal="" className="band flex flex-wrap items-center justify-between gap-6 rounded-2xl px-7 py-9 sm:px-10">
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

        {/*
         * Six questions, each a details/summary so the page stays short and needs no script; the
         * answers use the terms' own words for the same things. Tinted, like the plans and the
         * domain search, so the plain band above it stays the odd one out.
         */}
        <Section tone="alt">
          <SectionHeader title={t.home.faqTitle} />
          <div className="grid gap-4 md:grid-cols-2">
            {t.home.faq.map((item) => (
              <details key={item.q} data-reveal="" className="faq-item group rounded-2xl border border-line bg-panel px-5 py-1">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-3 text-base font-bold text-ink [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <CaretDownIcon aria-hidden="true" size={18} weight="bold" className="shrink-0 text-muted transition-transform group-open:rotate-180" />
                </summary>
                <p className="pb-4 text-[15px] leading-relaxed text-muted">{item.a}</p>
              </details>
            ))}
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

/*
 * One glyph per "Why 3enwank" card and per "Included on every account" row, in the order of the
 * dictionaries' arrays (both languages keep the same order): where the servers are, who answers,
 * what you pay in, how you get here; then backups, SSL, the firewall, the person. Typed off one of
 * the components, as products.tsx does, because /dist/ssr exports no Icon type.
 */
const REASON_ICONS: ReadonlyArray<typeof MapPinIcon> = [MapPinIcon, HeadsetIcon, WalletIcon, ArrowsLeftRightIcon];
const WHY_ICONS: ReadonlyArray<typeof MapPinIcon> = [CloudArrowUpIcon, LockKeyIcon, WallIcon, UserSoundIcon];

/** One row on a plan card. A free-text feature has no label and takes the whole row. */
type Spec = { label?: string; value: string };

/** Three cards, three specs on each: the owner's count, and what fits one row of a laptop screen. */
const PER_FAMILY = 3;
const SPECS_PER_CARD = 3;

/**
 * Three plans of a family: the ones asked for by slug, and, when the store no longer has those
 * slugs, the cheapest, the middle and the dearest in catalogue order, so the three on the page are
 * still three different sizes rather than nothing. A family of three or fewer is shown whole.
 */
function threeOf(items: readonly Product[], slugs: readonly string[]): Product[] {
  if (items.length <= PER_FAMILY) return [...items];
  const named = slugs.flatMap((slug) => {
    const found = items.find((p) => p.slug === slug);
    return found ? [found] : [];
  });
  if (named.length === PER_FAMILY) return named;
  return [items[0]!, items[Math.floor((items.length - 1) / 2)]!, items[items.length - 1]!];
}

/**
 * The catalogue's feature lines paired with the English label each is filed under, so a row can be
 * asked for by label and still be read in the page's language: the Arabic copy is translated line
 * by line at the same index (see localizedFeatures), and the label itself is translated with it.
 */
function specLines(product: Product, locale: Locale, t: Messages): Array<{ line: string; label: string; spec: Spec }> {
  const localized = localizedFeatures(product, locale, t);
  return product.features.en.flatMap((line, i) => {
    const row = localized[i];
    if (!row) return [];
    const english = parseFeature(line);
    const label = "label" in english ? english.label : "";
    if ("label" in row) return row.value ? [{ line, label, spec: { label: row.label, value: row.value } }] : [];
    return row.text ? [{ line, label, spec: { value: row.text } }] : [];
  });
}

/**
 * The rows a card shows, asked for by the English labels the store files them under and given back
 * in the order they were asked for. A product missing one of them loses that row and keeps the
 * others: the catalogue is edited in the customer area, and a renamed feature must cost a line, not
 * the page.
 */
function labelledSpecs(product: Product, locale: Locale, t: Messages, labels: readonly string[]): Spec[] {
  const lines = specLines(product, locale, t);
  return labels.flatMap((wanted) => {
    const found = lines.find((l) => l.label === wanted);
    return found ? [found.spec] : [];
  });
}

/** Lines that say what a package inherits or how it is billed, rather than what it is. */
const INHERITED = /^Everything in\b/i;
const BILLING = /\bseparate\b|\b(EGP|USD|VAT)\b/i;

/** The first three of a package's own feature lines: what it is, in the words the store wrote. */
function scopeSpecs(product: Product, locale: Locale, t: Messages): Spec[] {
  return specLines(product, locale, t)
    .filter((l) => !INHERITED.test(l.line) && !BILLING.test(l.line))
    .slice(0, SPECS_PER_CARD)
    .map((l) => l.spec);
}

/**
 * Three plans of one family as three cards: the name, the store's own one-line summary, the price,
 * three specs and the way to order. Every one of them comes from the catalogue, including the
 * formatted price, so nothing here can drift from what the store charges.
 *
 * It was one box listing every tier of the family on its own row. Six rows a disk size apart is a
 * table pretending to be a choice; three cards force the tiers far enough apart to be compared at a
 * glance, and the link under them is where the rest still live.
 */
function PlanCards({
  items,
  cycle,
  specs,
  link,
  highlight,
  locale,
  t,
}: {
  items: readonly Product[];
  cycle: string;
  specs: (product: Product) => Spec[];
  link: readonly [string, string];
  highlight?: string;
  locale: Locale;
  t: Messages;
}) {
  return (
    <div>
      {/*
       * Three-up from lg, one column under it. It was md, 768px, where the three cards are 216px
       * each: every price broke over two lines, and on the care tab seven of the nine spec rows
       * wrapped. The cards are clean from around 900px on the hosting and care tabs, but the
       * websites tab has the longest cycle label of the three ("One-time payment"), and its price
       * only fits beside it on one line from 992px up, so lg is the first standard step where all
       * three tabs hold together. Measured at 768, 834, 864 and 1024 in both locales.
       */}
      <ul className="grid gap-5 lg:grid-cols-3">
        {items.map((product) => {
          const chosen = product.slug === highlight;
          const summary = summaryWithoutDelivery(localizedSummary(product, locale, t));
          const rows = specs(product);
          return (
            <Card key={product.slug} as="li" highlight={chosen} className="flex h-full flex-col">
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <h3 className="text-xl font-extrabold text-ink">
                  <Val>{loc(product.name, locale)}</Val>
                </h3>
                {/* No tracking on the pill: it carries Arabic copy too, and globals.css zeroes letter-spacing under dir="rtl" anyway. */}
                {chosen ? <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-extrabold uppercase text-brand-strong">{t.common.mostChosen}</span> : null}
              </div>
              {summary ? <p className="mt-1.5 text-sm text-muted">{summary}</p> : null}
              <p className="mt-4 flex flex-wrap items-baseline gap-x-1.5">
                <Price prices={product.prices} normal={normalPrices(product)} locale={locale} fallback={t.common.notAvailable} className="text-2xl font-extrabold leading-none text-ink" />
                <span className="text-sm text-muted">{cycle}</span>
              </p>
              {/*
               * The renewal price, as the hosting page's cards state it (plans.tsx). Without it the
               * "per year" label beside an introductory price read as the price every year, on the
               * first cards a visitor compares; the plan renews at 20 to 50 percent more. Renders
               * nothing for a product the catalogue gives no renewal price, so the websites tab,
               * whose packages are one payment, stays as it is.
               */}
              <RenewalNote prices={normalPrices(product)} locale={locale} label={t.common.renewsAt} className="mt-1.5 text-sm font-semibold text-muted" />
              {rows.length ? (
                <ul className="mt-5 space-y-2.5 border-t border-line pt-5 text-sm">
                  {rows.map((row, i) => (
                    <li key={row.label ?? `${i}`} className="flex items-baseline justify-between gap-3">
                      {row.label ? <span className="text-muted">{row.label}</span> : null}
                      {/* "1 GB NVMe" beside Arabic text reorders into "GB NVMe 1" without isolation. */}
                      <Val className={`font-semibold text-ink ${row.label ? "text-end" : ""}`}>{row.value}</Val>
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-auto pt-6">
                <ButtonLink href={storeLink(product.storeUrl, locale)} variant={chosen ? "primary" : "outline"} className="w-full" external>
                  {t.common.order}
                </ButtonLink>
              </div>
            </Card>
          );
        })}
      </ul>
      {/* The page shows three of the family now, so the way to the rest is part of the panel, not an afterthought on the section header. */}
      <div className="mt-6">
        <ArrowLink href={link[0]}>{link[1]}</ArrowLink>
      </div>
    </div>
  );
}

export type { Catalogue };
