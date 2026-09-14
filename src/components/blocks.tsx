import { CaretRightIcon, CheckIcon } from "@phosphor-icons/react/dist/ssr";
import type { ReactNode } from "react";

/** Layout primitives shared by the screens. Server components; RTL-safe through logical properties. */
export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-7xl px-5 sm:px-8 ${className}`}>{children}</div>;
}

type Tone = "plain" | "alt" | "dark";
const TONES: Record<Tone, string> = { plain: "bg-surface", alt: "bg-surface-alt", dark: "bg-dark text-white" };

export function Section({
  id,
  tone = "plain",
  children,
  className = "",
}: {
  id?: string;
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`py-12 sm:py-16 ${TONES[tone]} ${className}`}>
      <Container>{children}</Container>
    </section>
  );
}

/** Small-caps label above a heading. */
export function Kicker({ children, tone = "brand" }: { children: ReactNode; tone?: "brand" | "light" }) {
  return (
    <p
      className={`mb-3 text-xs font-extrabold uppercase tracking-[0.14em] ${tone === "light" ? "text-accent-soft" : "text-brand"}`}
    >
      {children}
    </p>
  );
}

export function SectionHeader({
  kicker,
  title,
  lede,
  right,
  light = false,
}: {
  kicker?: string;
  title: string;
  lede?: string;
  right?: ReactNode;
  light?: boolean;
}) {
  return (
    <header data-reveal="" className="mb-8 flex flex-wrap items-end justify-between gap-5 sm:mb-10">
      <div className="max-w-2xl">
        {kicker ? <Kicker tone={light ? "light" : "brand"}>{kicker}</Kicker> : null}
        <h2 className={`text-balance text-3xl font-extrabold tracking-tight sm:text-4xl ${light ? "text-white" : "text-ink"}`}>
          {title}
        </h2>
        {lede ? (
          <p className={`mt-3 text-balance text-base sm:text-lg ${light ? "text-dark-muted" : "text-muted"}`}>{lede}</p>
        ) : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </header>
  );
}

/**
 * The band at the top of a page. A flat tint with a hairline under it, rather than a fade into the
 * page: the fade was the third gradient a visitor met before reading anything.
 */
export function PageIntro({
  kicker,
  title,
  lede,
  children,
}: {
  kicker?: string;
  title: string;
  lede?: string;
  children?: ReactNode;
}) {
  return (
    <header className="bg-surface-alt pt-14 pb-10 sm:pt-20 sm:pb-14">
      <Container>
        {kicker ? (
          <div className="rise">
            <Kicker>{kicker}</Kicker>
          </div>
        ) : null}
        {/*
         * Balanced, not ragged: a two-line heading breaks into two lines of the same length rather
         * than a long one and a short one. The copy binds the words inside each sentence with
         * non-breaking spaces, so the break can only land between sentences.
         */}
        <h1 className="rise max-w-4xl text-balance text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">{title}</h1>
        {lede ? <p className="rise-2 mt-4 max-w-2xl text-pretty text-lg text-muted sm:text-xl">{lede}</p> : null}
        <div className="rise-3">{children}</div>
      </Container>
    </header>
  );
}

export function Card({
  children,
  className = "",
  highlight = false,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  highlight?: boolean;
  as?: "div" | "li" | "article";
}) {
  // The halo followed the brand rather than a colour written down here, which had stayed the
  // retired purple through the vibrancy pass.
  return (
    <Tag
      data-reveal=""
      className={`lift relative rounded-xl border bg-panel p-6 sm:p-7 ${highlight ? "pulse-glow border-2 border-brand shadow-[0_24px_50px_-30px_var(--color-brand-ink)]" : "border-line"} ${className}`}
    >
      {children}
    </Tag>
  );
}

export function Fine({ children }: { children: ReactNode }) {
  // Measured in characters, not pixels: small print at 14px ran to 100 characters a line at max-w-3xl.
  return <p className="mt-8 max-w-prose text-pretty text-sm leading-relaxed text-muted">{children}</p>;
}

type ButtonVariant = "primary" | "secondary" | "white" | "outline";
const VARIANTS: Record<ButtonVariant, string> = {
  primary: "btn-primary shadow-[0_10px_24px_-14px_var(--color-brand-ink)]",
  secondary: "border-[1.5px] border-line-strong bg-panel text-ink hover:border-brand hover:text-brand-strong",
  // Its own focus ring. This variant only ever sits on the purple band, and the global ring
  // (globals.css :focus-visible) is brand purple: 1.0:1 against the band in the light theme, so the
  // only control in the band had no visible focus. White is what the band's text already is.
  white: "bg-white text-[#5e1eb8] hover:bg-[#f2eafd] focus-visible:outline-white",
  outline: "border-[1.5px] border-brand text-brand-strong hover:bg-brand-soft",
};

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className = "",
  external = false,
  size = "md",
}: {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
  external?: boolean;
  size?: "md" | "lg";
}) {
  const pad = size === "lg" ? "px-7 py-3.5 text-base" : "px-5 py-2.5 text-sm";
  return (
    <a
      href={href}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full font-bold transition active:scale-[0.98] ${pad} ${VARIANTS[variant]} ${className}`}
      {...(external ? { rel: "noopener" } : {})}
    >
      {children}
    </a>
  );
}

/** A text link with a direction-aware chevron. */
export function ArrowLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={`arrow-link inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-brand-strong hover:text-brand ${className}`}
    >
      {children}
      {/*
       * The chevron points the way the text runs, so it has to turn round on the Arabic pages, and
       * the mirror stays in CSS rather than moving to Phosphor's `mirrored` prop. `mirrored` writes
       * transform="scale(-1, 1)" unconditionally (dist/lib/SSRBase.es.js), and this is a server
       * component that never sees the locale, so it would point the wrong way in English instead.
       * `rtl:` keys off the dir on <html> (root.tsx) and needs to know nothing.
       */}
      <CaretRightIcon aria-hidden="true" size={16} weight="bold" className="rtl:-scale-x-100" />
    </a>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-line bg-panel px-4 py-6 text-center text-sm text-muted">{children}</p>;
}

export function Check({ className = "text-accent" }: { className?: string }) {
  // Still 18px, and still bold: this mark sits beside the 14px text of the plan feature lists (it
  // served a facts line too, until the hero inlined its own), so its stroke is what has to match,
  // not its width. Phosphor's bold check draws a 24/256 stroke, which lands at 1.7px here — the
  // same ink the hand-drawn 2.2/24 stroke put down.
  // The nudge down a half step keeps it on the first line's baseline rather than its box.
  return <CheckIcon aria-hidden="true" size={18} weight="bold" className={`mt-0.5 shrink-0 ${className}`} />;
}
