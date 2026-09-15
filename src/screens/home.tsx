import { ArrowLink, ButtonLink, Card, Container, MostChosen, Section, SectionHeader, Steps } from "@/components/blocks";
import { Val } from "@/components/bidi";
import { Price, RenewalNote } from "@/components/currency";
import { DomainSearch } from "@/components/domain-search";
import { ContactSection } from "@/components/contact";
import { WhatsAppIcon } from "@/components/icons";
import { Shell } from "@/components/shell";
import { JsonLd } from "@/components/json-ld";
import { faqLd, graph, organizationLd, websiteLd } from "@/lib/structured-data";
import { Tabs } from "@/components/tabs";
import { cheapestPrices, localizedFeatures, localizedSummary, normalPrices, parseFeature, summaryWithoutDelivery } from "@/lib/format";
import { pageMetadata } from "@/lib/metadata";
import { contactHref, pathFor, storeLink, type Locale } from "@/lib/i18n";
import { waHref } from "@/lib/whatsapp";
import { messagesFor, type Messages } from "@/messages";
import type { Catalogue, Product } from "@/lib/catalogue";
import { HIGHLIGHT, assistantOn, buildTerms, domainSearchLabels, loc, screenContext, storeApi, talkFirstHref, whatsappNumber } from "./shared";
import type { Currency, Money } from "@/lib/money";
import { vatLine } from "@/lib/vat";
import { homePaymentsCopy } from "@/lib/payments";
import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr";

/**
 * Home, in the order the owner set on 2026-09-15 (S1), each thing said once: hero, plans and prices
 * on three tabs, one facts list, moving to us, the domain search, the FAQ and contact. The hero tiles
 * and the "What we do" cards are gone: the tabs already carry the three families with their prices,
 * and the cards said the same thing a second time with an icon disc each.
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
    // The facts row on paying and the FAQ answer on paying name only what the store takes now (D5).
    const pay = homePaymentsCopy(t, catalogue);
    /*
     * The three families, in the order a visitor meets them in the menu, three plans each and three
     * specs on each plan. Every tier used to be listed here, which put six hosting plans on the page
     * separated by one disk size: nobody decides between 1 GB and 2 GB for 500 EGP more. Three tiers
     * far enough apart to be three different answers, and a link to the page that still has them all.
     *
     * A family the store has nothing in simply has no tab; with none of them there is no section.
     */
    // Up here, before the families: the websites tab's "Talk to us first" opens WhatsApp too (S12).
    const whatsapp = whatsappNumber(catalogue);
    const families: Family[] = [
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
        /*
         * What the websites page says on every package, said here too (S12): the delivery time and the
         * deposit split, the hosting it needs from the catalogue's cheapest plan, and a second button to
         * talk before ordering. They only show on this tab, so the phone page is no longer for them.
         */
        terms: (p: Product) => buildTerms(p, locale, t),
        hostingFrom: cheapestPrices(catalogue.products.hosting.map((p) => p.prices)),
        talk: (p: Product) => talkFirstHref(p, locale, t, whatsapp),
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
    const api = storeApi(catalogue);
    const moveForm = contactHref(locale, { need: "move" });
    return (
      <Shell locale={locale} page="home" storeUrl={catalogue.store.url} legalName={company.legalName} trust={trust} whatsapp={whatsappNumber(catalogue)} assistantEnabled={catalogue.assistant.enabled} turnstileSiteKey={catalogue.assistant.turnstileSiteKey}>
        {/* Who the company is and what this site is, for search engines; the plan pages add a Product per plan. */}
        <JsonLd data={graph([organizationLd(catalogue, locale), websiteLd(catalogue, locale), faqLd(pay.faq)])} />
        {/*
         * The hero: one column, the statement large across the width, the line under it and the two
         * ways in (owner, 2026-09-15, S2). No glow, grid, tiles or entrance: the type does the work.
         * 64px on a laptop, a clear step over the 44px page H1 and the 32px section H2.
         *
         * No tracking-* utility in this block. globals.css zeroes letter-spacing under dir="rtl", so a
         * heading tuned with negative tracking is a different heading in Arabic. Arabic takes more
         * leading, because its marks above and below the line clip at 1.08.
         */}
        <section>
          {/* 40px above and below on a phone (was 56): part of taking the phone home page back to about seven screens (S1, verify). */}
          <Container className="pb-10 pt-10 sm:pb-20 sm:pt-20">
            <h1 className="max-w-6xl text-balance text-[2.5rem] font-extrabold leading-[1.08] text-ink sm:text-[3.25rem] lg:text-[4rem] rtl:leading-[1.35]">{t.home.h1}</h1>
            <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-muted sm:mt-6">{t.home.lede}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={pathFor("hosting", locale)} size="lg">
                {t.home.ctaPlans}
              </ButtonLink>
              <ButtonLink href={pathFor("websites", locale)} variant="secondary" size="lg">
                {t.home.ctaBuild}
              </ButtonLink>
            </div>
          </Container>
        </section>

        {/*
         * Plans and prices, straight under the hero: everything with a price, one tab per family, three
         * cards each. The VAT line (when the catalogue has a rate) sits under the cards it is about.
         */}
        {families.length ? (
          <Section tone="alt">
            <SectionHeader title={t.home.plansTitle} />
            <Tabs
              label={t.home.plansTabsLabel}
              items={families.map((family) => ({
                id: family.id,
                label: family.label,
                panel: <PlanCards items={family.items} cycle={family.cycle} specs={family.specs} link={family.link} highlight={family.highlight} terms={family.terms} hostingFrom={family.hostingFrom} talk={family.talk} talkOnWhatsApp={!!whatsapp} locale={locale} t={t} />,
              }))}
            />
            {vat ? <p className="mt-4 text-sm text-muted">{vat}</p> : null}
          </Section>
        ) : null}

        {/*
         * One facts list (S4): "Why 3enwank" and "Included on every account" were two card grids with
         * an icon disc on every card, saying the same kind of thing twice. Six rows now, a bold fact and
         * one line each, two columns from sm, each row topped by a hairline. No cards, no icons.
         */}
        <Section>
          <SectionHeader title={t.home.factsTitle} />
          <ul className="grid sm:grid-cols-2 sm:gap-x-12">
            {pay.facts.map((f) => (
              // A step tighter on a phone (16px rows, 18px facts), for the seven-screen budget (S1, verify); as before from sm.
              <li key={f.title} className="border-t border-line py-4 sm:py-5">
                <h3 className="text-lg font-extrabold text-ink sm:text-xl">{f.title}</h3>
                <p className="mt-1 text-base text-muted sm:mt-1.5">{f.body}</p>
              </li>
            ))}
          </ul>
        </Section>

        {/*
         * Moving to us (S6): the purple band became three numbered steps and one button. The button
         * opens WhatsApp with the moving line already written; with no number it goes to the contact
         * form opened on "Move my site", and with one the form is offered beside it as the quieter way.
         * The step numbers are the list's own numbering drawn large, not icons in circles.
         */}
        <Section tone="alt">
          <SectionHeader title={t.home.move.title} lede={t.home.move.lede} />
          {/* The shared numbered list (blocks.tsx Steps), which "How a build works" on /websites/ uses too. */}
          <Steps steps={t.home.move.steps} />
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
            {whatsapp ? (
              <>
                <ButtonLink href={waHref(whatsapp, t.home.move.waText)} external size="lg">
                  <WhatsAppIcon />
                  {t.home.move.cta}
                </ButtonLink>
                <ArrowLink href={moveForm}>{t.home.move.formCta}</ArrowLink>
              </>
            ) : (
              <ButtonLink href={moveForm} size="lg">
                {t.home.move.cta}
              </ButtonLink>
            )}
          </div>
        </Section>

        {/*
         * The domain search. id="domains" is kept for old inbound links; the offset it lands with is
         * scroll-margin-top on section[id] in globals.css. A panel from sm up, and on a phone no panel
         * at all: a card inside a 350px screen costs 34px of it, which pushed the widget's own tabs
         * wider than the screen. No `tlds`: forty ending pills belong on the domains page, not here.
         */}
        <Section id="domains">
          <SectionHeader title={t.home.domainsTitle} lede={t.home.domainsLede} right={<ArrowLink href={pathFor("domains", locale)}>{t.home.allPlans.domains}</ArrowLink>} />
          <div className="sm:rounded-lg sm:border sm:border-line sm:bg-panel sm:p-8 sm:shadow-[var(--card-shadow)]">
            <DomainSearch locale={locale} searchPath={pathFor("domains", locale)} cartUrl={api.cartDomain} apiUrl={api.domainSearch} ideasUrl={api.domainIdeas} contactHref={contactHref(locale, { need: "domains" })} labels={domainSearchLabels(t)} ideas={assistantOn(catalogue)} turnstileSiteKey={catalogue.assistant.turnstileSiteKey} />
          </div>
        </Section>

        {/*
         * Six questions in one column about 720px wide, on the start side, divided by hairlines (site
         * review justDo). They were a two-column grid of boxes that read left, right, left, right and
         * split related questions. The caret turning is the one motion here, and it says open or shut.
         */}
        <Section tone="alt">
          <div className="max-w-[45rem]">
            <SectionHeader title={t.home.faqTitle} />
            <div className="border-t border-line">
              {pay.faq.map((item) => (
                <details key={item.q} className="faq-item group border-b border-line">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-4 text-base font-bold text-ink hover:text-brand-strong sm:text-lg [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <CaretDownIcon aria-hidden="true" size={18} weight="bold" className="shrink-0 text-muted transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="pb-5 text-base leading-relaxed text-muted">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </Section>

        <ContactSection
          locale={locale}
          t={t}
          whatsapp={whatsapp}
          phone={catalogue.company.phone}
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

/** One family on the plans tabs. `terms`, `hostingFrom` and `talk` are the websites tab's own (S12). */
type Family = {
  id: string;
  label: string;
  items: Product[];
  cycle: string;
  specs: (product: Product) => Spec[];
  link: readonly [string, string];
  highlight?: string;
  terms?: (product: Product) => string[];
  hostingFrom?: Partial<Record<Currency, Money>>;
  talk?: (product: Product) => string;
};

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
 */
function PlanCards({
  items,
  cycle,
  specs,
  link,
  highlight,
  terms,
  hostingFrom,
  talk,
  talkOnWhatsApp = false,
  locale,
  t,
}: {
  items: readonly Product[];
  cycle: string;
  specs: (product: Product) => Spec[];
  link: readonly [string, string];
  highlight?: string;
  terms?: (product: Product) => string[];
  hostingFrom?: Partial<Record<Currency, Money>>;
  talk?: (product: Product) => string;
  talkOnWhatsApp?: boolean;
  locale: Locale;
  t: Messages;
}) {
  return (
    <div>
      {/*
       * Three-up from lg, one column under it. At md (768px) the three cards are 216px each: every
       * price broke over two lines, and the websites tab's longer cycle label only fits beside its
       * price from 992px up, so lg is the first standard step where all three tabs hold together.
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
                {/* The one badge design, the same as on the product pages (S10). */}
                {chosen ? <MostChosen>{t.common.mostChosen}</MostChosen> : null}
              </div>
              {summary ? <p className="mt-1.5 text-sm text-muted">{summary}</p> : null}
              <p className="mt-4 flex flex-wrap items-baseline gap-x-1.5">
                <Price prices={product.prices} normal={normalPrices(product)} locale={locale} fallback={t.common.notAvailable} className="text-2xl font-extrabold leading-none text-ink" />
                <span className="text-sm text-muted">{cycle}</span>
              </p>
              {/*
               * The renewal price, as the hosting page's cards state it (plans.tsx). Renders nothing
               * for a product the catalogue gives no renewal price, so the websites tab, whose
               * packages are one payment, stays as it is.
               */}
              <RenewalNote prices={normalPrices(product)} locale={locale} label={t.common.renewsAt} className="mt-1.5 text-sm font-semibold text-muted" />
              {terms?.(product).map((line) => (
                <p key={line} className="mt-1 text-sm text-muted">
                  {line}
                </p>
              ))}
              {hostingFrom ? <RenewalNote prices={hostingFrom} locale={locale} label={t.websites.needsHosting} className="mt-1 text-sm text-muted" /> : null}
              {/* data-float-avoid: the assistant's corner button steps aside from these values on a phone (S8). */}
              {rows.length ? (
                // 16px either side of the hairline and 8px rows on a phone, 20px and 10px from sm (S1, verify).
                <ul data-float-avoid="" className="mt-4 space-y-2 border-t border-line pt-4 text-sm sm:mt-5 sm:space-y-2.5 sm:pt-5">
                  {rows.map((row, i) => (
                    <li key={row.label ?? `${i}`} className="flex items-baseline justify-between gap-3">
                      {row.label ? <span className="text-muted">{row.label}</span> : null}
                      {/* "1 GB NVMe" beside Arabic text reorders into "GB NVMe 1" without isolation. */}
                      <Val className={`font-semibold text-ink ${row.label ? "text-end" : ""}`}>{row.value}</Val>
                    </li>
                  ))}
                </ul>
              ) : null}
              {/* "Talk to us first" beside Order on a website package (S12); each takes half the row and wraps under the other when it cannot. */}
              <div className="mt-auto flex flex-wrap gap-2 pt-5 sm:pt-6">
                <ButtonLink href={storeLink(product.storeUrl, locale)} variant={chosen ? "primary" : "outline"} className="flex-auto whitespace-nowrap" external>
                  {t.common.order}
                </ButtonLink>
                {talk ? (
                  <ButtonLink href={talk(product)} variant="secondary" className="flex-auto whitespace-nowrap" external={talkOnWhatsApp}>
                    {talkOnWhatsApp ? <WhatsAppIcon /> : null}
                    {t.websites.talkFirst}
                  </ButtonLink>
                ) : null}
              </div>
            </Card>
          );
        })}
      </ul>
      <div className="mt-6">
        <ArrowLink href={link[0]}>{link[1]}</ArrowLink>
      </div>
    </div>
  );
}

export type { Catalogue };
