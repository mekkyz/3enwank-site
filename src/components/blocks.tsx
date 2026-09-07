import type { ReactNode } from "react";

/** Layout primitives shared by the screens. Server components; RTL-safe through logical properties. */
export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-4 ${className}`}>{children}</div>;
}

export function Section({ id, alt = false, children, className = "" }: { id?: string; alt?: boolean; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={`py-14 sm:py-20 ${alt ? "bg-panel" : ""} ${className}`}>
      <Container>{children}</Container>
    </section>
  );
}

export function SectionHeader({ num, title, lede, right }: { num?: string; title: string; lede?: string; right?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {num ? <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brand tabular">{num}</p> : null}
        <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h2>
        {lede ? <p className="mt-3 text-base text-muted sm:text-lg">{lede}</p> : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </header>
  );
}

export function PageIntro({ num, title, lede }: { num?: string; title: string; lede?: string }) {
  return (
    <header className="pt-12 sm:pt-16">
      <Container>
        {num ? <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brand tabular">{num}</p> : null}
        <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-ink sm:text-4xl">{title}</h1>
        {lede ? <p className="mt-4 max-w-2xl text-lg text-muted">{lede}</p> : null}
      </Container>
    </header>
  );
}

export function Card({ children, className = "", highlight = false }: { children: ReactNode; className?: string; highlight?: boolean }) {
  return <div className={`rounded-xl border bg-panel p-6 shadow-sm ${highlight ? "border-brand ring-1 ring-brand" : "border-line"} ${className}`}>{children}</div>;
}

export function Fine({ children }: { children: ReactNode }) {
  return <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted">{children}</p>;
}

type ButtonVariant = "primary" | "secondary" | "ghost";
const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-brand text-white hover:bg-brand-strong",
  secondary: "border border-line bg-panel text-ink hover:bg-surface",
  ghost: "text-brand hover:bg-brand-soft",
};

export function ButtonLink({ href, children, variant = "primary", className = "", external = false }: { href: string; children: ReactNode; variant?: ButtonVariant; className?: string; external?: boolean }) {
  return (
    <a href={href} className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition ${VARIANTS[variant]} ${className}`} {...(external ? { rel: "noopener" } : {})}>
      {children}
    </a>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-md border border-line bg-panel px-4 py-6 text-center text-sm text-muted">{children}</p>;
}

export function Check() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0 text-brand" fill="none">
      <path d="M4 10.5l3.5 3.5L16 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
