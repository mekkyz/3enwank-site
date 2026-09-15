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
    // 40px on a phone (was 48): seven sections on the home page, and the owner's budget is about seven phone screens (S1).
    <section id={id} className={`py-10 sm:py-16 ${TONES[tone]} ${className}`}>
      <Container>{children}</Container>
    </section>
  );
}

/*
 * No Kicker. The small uppercase label above a heading is removed everywhere (owner, 2026-09-15, S13):
 * the heading says what the section is, as a statement, and a second label above it said it twice.
 * H2 is 28px on a phone and 32px from sm, the scale the review asked for (30 to 32), well under the
 * home H1 and the 44px page H1, so the three levels read as three.
 */
export function SectionHeader({
  title,
  lede,
  right,
}: {
  title: string;
  lede?: string;
  right?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-5 sm:mb-10">
      <div className="max-w-2xl">
        <h2 className="text-balance text-[1.75rem] font-extrabold leading-tight tracking-tight text-ink sm:text-[2rem]">{title}</h2>
        {lede ? <p className="mt-3 text-balance text-base text-muted sm:text-lg">{lede}</p> : null}
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
  title,
  lede,
  children,
}: {
  /** A node, not only a string: the care, websites and domains intros carry a live price (S13). */
  title: ReactNode;
  lede?: string;
  children?: ReactNode;
}) {
  return (
    <header className="border-b border-line bg-surface-alt pt-12 pb-10 sm:pt-16 sm:pb-12">
      <Container>
        {/*
         * Balanced, not ragged: a two-line heading breaks into two lines of the same length rather
         * than a long one and a short one. The copy binds the words inside each sentence with
         * non-breaking spaces, so the break can only land between sentences.
         *
         * 44px from sm (was 48) and no entrance animation: the page H1 sits one clear step under the
         * home H1 and above the 32px H2, and nothing on a page waits to fade in (owner, 2026-09-15).
         */}
        <h1 className="max-w-4xl text-balance text-4xl font-extrabold tracking-tight text-ink sm:text-[2.75rem] sm:leading-[1.1]">{title}</h1>
        {lede ? <p className="mt-4 max-w-2xl text-pretty text-lg text-muted">{lede}</p> : null}
        {children}
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
  /*
   * One container radius for every card, panel and field on the site (rounded-lg, 8px), a visible
   * hairline, and the light theme's neutral shadow from --card-shadow (none in dark). No hover lift,
   * no reveal and no coloured halo on the highlighted plan: a static brand border marks it (owner,
   * 2026-09-15). The badge that goes with it is its own decision (S10).
   */
  return (
    <Tag
      className={`relative rounded-lg border bg-panel p-6 shadow-[var(--card-shadow)] sm:p-7 ${highlight ? "border-2 border-brand" : "border-line"} ${className}`}
    >
      {children}
    </Tag>
  );
}

/**
 * The one "Most chosen" mark (owner, 2026-09-15, S10), the same on the home tabs, the hosting and care
 * cards and the website packages. It was an 11px uppercase pill beside the name on the home page and
 * a tracked uppercase label notched into the card's top border on the product pages: two designs for
 * one idea. It sits inline after the plan's name everywhere now, in the 13px text-xs floor (14px in
 * Arabic, globals.css), sentence case, and a tag shape rather than a pill, since pills are for buttons
 * and tabs only. No glow and no pulse: the card's static brand border (Card highlight) does the rest.
 */
export function MostChosen({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center whitespace-nowrap rounded-md bg-brand-soft px-2 py-0.5 text-xs font-bold text-brand-strong">{children}</span>;
}

/**
 * Numbered steps on hairlines: the home page's moving section (S6) and the websites page's "How a build
 * works" (S12). The number is the list's own numbering drawn in brand colour on the title's line, not an
 * icon in a circle, and the <ol> carries the order for a screen reader.
 */
export function Steps({ steps, heading: H = "h3" }: { steps: ReadonlyArray<{ title: string; body: string }>; heading?: "h2" | "h3" }) {
  return (
    <ol className={`grid sm:gap-x-12 ${steps.length === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3"}`}>
      {steps.map((step, i) => (
        // Tighter on a phone, as the home facts rows beside them (S1, verify): 16px rows and an 18px title under sm.
        <li key={step.title} className="border-t border-line py-4 sm:py-5">
          <H className="flex items-baseline gap-3 text-lg font-extrabold text-ink sm:text-xl">
            <span aria-hidden="true" className="tabular text-brand-strong">
              {i + 1}
            </span>
            {step.title}
          </H>
          <p className="mt-1 text-base text-muted sm:mt-1.5">{step.body}</p>
        </li>
      ))}
    </ol>
  );
}

export function Fine({ children }: { children: ReactNode }) {
  // Measured in characters, not pixels: small print at 14px ran to 100 characters a line at max-w-3xl.
  return <p className="mt-8 max-w-prose text-pretty text-sm leading-relaxed text-muted">{children}</p>;
}

type ButtonVariant = "primary" | "secondary" | "outline";
const VARIANTS: Record<ButtonVariant, string> = {
  // No purple glow under the filled button; the "white" variant went with the purple band it sat on.
  primary: "btn-primary",
  secondary: "border-[1.5px] border-line-strong bg-panel text-ink hover:border-brand hover:text-brand-strong",
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
      // Colour transitions only: the press shrink was motion that explained nothing (owner, 2026-09-15).
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full font-bold transition-colors ${pad} ${VARIANTS[variant]} ${className}`}
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
      className={`inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-brand-strong hover:text-brand ${className}`}
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
  // rounded-lg: the one container radius (it was the only 16px box among 12px cards).
  return <p className="rounded-lg border border-line bg-panel px-4 py-6 text-center text-sm text-muted">{children}</p>;
}

export function Check({ className = "text-accent" }: { className?: string }) {
  // Still 18px, and still bold: this mark sits beside the 14px text of the plan feature lists (it
  // served a facts line too, until the hero inlined its own), so its stroke is what has to match,
  // not its width. Phosphor's bold check draws a 24/256 stroke, which lands at 1.7px here — the
  // same ink the hand-drawn 2.2/24 stroke put down.
  // The nudge down a half step keeps it on the first line's baseline rather than its box.
  return <CheckIcon aria-hidden="true" size={18} weight="bold" className={`mt-0.5 shrink-0 ${className}`} />;
}
