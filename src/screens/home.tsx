import { ButtonLink, Card, Container, Section, SectionHeader } from "@/components/blocks";
import { CurrencyToggle, Price } from "@/components/currency";
import { Shell } from "@/components/shell";
import { pageMetadata } from "@/lib/metadata";
import { pathFor, type Locale } from "@/lib/i18n";
import { messagesFor } from "@/messages";
import { screenContext, vatLine } from "./shared";

export const home = {
  metadata(locale: Locale) {
    const t = messagesFor(locale);
    return pageMetadata("home", locale, t.home.kicker, t.meta.description);
  },
  async render(locale: Locale) {
    const { t, catalogue } = await screenContext(locale);
    const teasers = [
      { ...t.home.hostingTeaser, href: pathFor("hosting", locale) },
      { ...t.home.websitesTeaser, href: pathFor("websites", locale) },
      { ...t.home.careTeaser, href: pathFor("care", locale) },
      { ...t.home.domainsTeaser, href: pathFor("domains", locale) },
      { ...t.home.contactTeaser, href: pathFor("contact", locale) },
    ];
    return (
      <Shell locale={locale} page="home" storeUrl={catalogue.store.url} legalName={catalogue.company.legalName[locale]}>
        <section className="border-b border-line bg-panel">
          <Container className="grid gap-10 py-14 lg:grid-cols-[1.2fr_0.8fr] lg:py-20">
            <div>
              <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-brand">
                <span aria-hidden="true" className="h-2 w-2 rounded-full bg-brand" />
                {t.home.kicker}
              </p>
              <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl">{t.home.h1}</h1>
              <p className="mt-5 max-w-xl text-lg text-muted">{t.home.lede}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <ButtonLink href={pathFor("hosting", locale)}>{t.home.ctaPlans}</ButtonLink>
                <ButtonLink href={pathFor("websites", locale)} variant="secondary">
                  {t.home.ctaBuild}
                </ButtonLink>
              </div>
              <p className="mt-5 max-w-xl text-sm text-muted">{t.home.micro}</p>
            </div>
            <aside aria-label={t.home.specTitle} className="rounded-xl border border-line bg-surface p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted">{t.home.specTitle}</p>
              <dl className="mt-4 divide-y divide-line text-sm">
                {t.home.spec.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 py-2">
                    <dt className="text-muted">{k}</dt>
                    <dd className="font-medium text-ink" dir="auto">
                      {v}
                    </dd>
                  </div>
                ))}
              </dl>
            </aside>
          </Container>
        </section>

        <Section>
          <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {t.home.pillars.map((p, i) => (
              <li key={p.title} className="rounded-xl border border-line bg-panel p-5">
                <span className="text-xs font-semibold text-brand tabular">0{i + 1}</span>
                <h3 className="mt-2 text-lg font-semibold text-ink">{p.title}</h3>
                <p className="mt-2 text-sm text-muted">{p.body}</p>
              </li>
            ))}
          </ol>
        </Section>

        {catalogue.products.hosting.length ? (
          <Section alt id="hosting">
            <SectionHeader num={`01 / ${t.nav.hosting}`} title={t.home.hostingTeaser.h2} lede={t.home.hostingTeaser.body} right={<CurrencyToggle label={t.common.currency} hint={t.common.currencyHint} />} />
            <ul className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {catalogue.products.hosting.map((p) => (
                <li key={p.slug}>
                  <a href={pathFor("hosting", locale)} className="block rounded-lg border border-line bg-surface p-4 hover:border-brand">
                    <span className="block text-lg font-bold text-ink">{p.name[locale] || p.name.en}</span>
                    <Price prices={p.prices} locale={locale} className="block text-sm font-semibold text-brand-strong" />
                    <span className="block text-xs text-muted">{t.common.perYear}</span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-muted">{vatLine(t, catalogue)}</p>
            <div className="mt-6">
              <ButtonLink href={pathFor("hosting", locale)} variant="ghost">
                {t.home.hostingTeaser.link} →
              </ButtonLink>
            </div>
          </Section>
        ) : null}

        <Section>
          <div className="grid gap-6 md:grid-cols-2">
            {teasers.slice(1).map((s) => (
              <Card key={s.num} className="flex flex-col">
                <p className="text-xs font-semibold uppercase tracking-widest text-brand tabular">
                  {s.num} / {s.title}
                </p>
                <h2 className="mt-2 text-2xl font-bold text-ink">{s.h2}</h2>
                <p className="mt-2 text-muted">{s.body}</p>
                <div className="mt-auto pt-5">
                  <ButtonLink href={s.href} variant="secondary">
                    {s.link}
                  </ButtonLink>
                </div>
              </Card>
            ))}
          </div>
        </Section>
      </Shell>
    );
  },
};
