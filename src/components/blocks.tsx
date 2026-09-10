import type { ReactNode } from "react";

/** Layout primitives shared by the screens. Server components; RTL-safe through logical properties. */
export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-5 sm:px-8 ${className}`}>{children}</div>;
}

type Tone = "plain" | "alt" | "dark";
const TONES: Record<Tone, string> = { plain: "bg-surface", alt: "bg-surface-alt", dark: "bg-dark text-white" };

export function Section({ id, tone = "plain", children, className = "" }: { id?: string; tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={`py-14 sm:py-20 ${TONES[tone]} ${className}`}>
      <Container>{children}</Container>
    </section>
  );
}

/** Small-caps label above a heading. */
export function Kicker({ children, tone = "brand" }: { children: ReactNode; tone?: "brand" | "light" }) {
  return <p className={`mb-3 text-xs font-extrabold uppercase tracking-[0.14em] ${tone === "light" ? "text-accent-soft" : "text-brand"}`}>{children}</p>;
}

export function SectionHeader({ kicker, title, lede, right, light = false }: { kicker?: string; title: string; lede?: string; right?: ReactNode; light?: boolean }) {
  return (
    <header data-reveal className="mb-8 flex flex-wrap items-end justify-between gap-5 sm:mb-10">
      <div className="max-w-2xl">
        {kicker ? <Kicker tone={light ? "light" : "brand"}>{kicker}</Kicker> : null}
        <h2 className={`text-3xl font-extrabold tracking-tight sm:text-4xl ${light ? "text-white" : "text-ink"}`}>{title}</h2>
        {lede ? <p className={`mt-3 text-balance text-base sm:text-lg ${light ? "text-dark-muted" : "text-muted"}`}>{lede}</p> : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </header>
  );
}

/**
 * The band at the top of a page. A flat tint with a hairline under it, rather than a fade into the
 * page: the fade was the third gradient a visitor met before reading anything.
 */
export function PageIntro({ kicker, title, lede, children }: { kicker?: string; title: string; lede?: string; children?: ReactNode }) {
  return (
    <header className="border-b border-line bg-surface-alt pt-14 pb-10 sm:pt-20 sm:pb-14">
      <Container>
        {kicker ? (
          <div className="rise">
            <Kicker>{kicker}</Kicker>
          </div>
        ) : null}
        <h1 className="rise max-w-3xl text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">{title}</h1>
        {lede ? <p className="rise-2 mt-4 max-w-2xl text-lg text-muted sm:text-xl">{lede}</p> : null}
        <div className="rise-3">{children}</div>
      </Container>
    </header>
  );
}

export function Card({ children, className = "", highlight = false, as: Tag = "div" }: { children: ReactNode; className?: string; highlight?: boolean; as?: "div" | "li" | "article" }) {
  // The halo followed the brand rather than a colour written down here, which had stayed the
  // retired purple through the vibrancy pass.
  return <Tag className={`lift relative rounded-xl border bg-panel p-6 sm:p-7 ${highlight ? "pulse-glow border-2 border-brand shadow-[0_24px_50px_-30px_var(--color-brand-ink)]" : "border-line"} ${className}`}>{children}</Tag>;
}

/**
 * A card that does not move.
 *
 * `Card` lifts three pixels under the pointer, which is right for something you are choosing between
 * and wrong for anything holding a form: the fields shift under the cursor while you are typing in
 * them. Same skin, no hover.
 */
export function Panel({ children, className = "", tone = "line", as: Tag = "div" }: { children: ReactNode; className?: string; tone?: "line" | "brand"; as?: "div" | "li" | "section" }) {
  // The border is chosen here, never overridden through className: two utilities setting the same
  // property leave the winner to stylesheet order rather than to whoever wrote the call.
  const border = tone === "brand" ? "border-2 border-brand" : "border border-line";
  return <Tag className={`relative rounded-xl bg-panel p-6 sm:p-7 ${border} ${className}`}>{children}</Tag>;
}

export function Fine({ children }: { children: ReactNode }) {
  return <p className="mt-8 max-w-3xl text-sm leading-relaxed text-muted">{children}</p>;
}

type ButtonVariant = "primary" | "secondary" | "white" | "outline";
const VARIANTS: Record<ButtonVariant, string> = {
  primary: "btn-primary shadow-[0_10px_24px_-14px_var(--color-brand-ink)]",
  secondary: "border-[1.5px] border-line-strong bg-panel text-ink hover:border-brand hover:text-brand-strong",
  white: "bg-white text-[#5e1eb8] hover:bg-[#f2eafd]",
  outline: "border-[1.5px] border-brand text-brand-strong hover:bg-brand-soft",
};

export function ButtonLink({ href, children, variant = "primary", className = "", external = false, size = "md" }: { href: string; children: ReactNode; variant?: ButtonVariant; className?: string; external?: boolean; size?: "md" | "lg" }) {
  const pad = size === "lg" ? "px-7 py-3.5 text-base" : "px-5 py-2.5 text-sm";
  return (
    <a href={href} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg font-bold transition ${pad} ${VARIANTS[variant]} ${className}`} {...(external ? { rel: "noopener" } : {})}>
      {children}
    </a>
  );
}

/** A text link with a direction-aware chevron. */
export function ArrowLink({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a href={href} className={`arrow-link inline-flex items-center gap-1.5 text-sm font-bold text-brand-strong hover:text-brand ${className}`}>
      {children}
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 rtl:-scale-x-100" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 6l6 6-6 6" />
      </svg>
    </a>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-line bg-panel px-4 py-6 text-center text-sm text-muted">{children}</p>;
}

export function Check({ className = "text-accent" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`mt-0.5 h-[18px] w-[18px] shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

/** Short facts with a check mark, under a hero or a price list. */
export function Facts({ items, className = "" }: { items: string[]; className?: string }) {
  return (
    <ul className={`flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-muted ${className}`}>
      {items.map((f) => (
        <li key={f} className="flex items-center gap-2">
          <Check />
          <span>{f}</span>
        </li>
      ))}
    </ul>
  );
}
