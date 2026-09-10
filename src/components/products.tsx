import type { ReactNode } from "react";
import { ArrowLink, Card } from "./blocks";

type Kind = "hosting" | "websites" | "care" | "domains";

const ICONS: Record<Kind, ReactNode> = {
  hosting: (
    <>
      <rect x="3" y="4" width="18" height="6" rx="2" />
      <rect x="3" y="14" width="18" height="6" rx="2" />
      <path d="M7 7h.01M7 17h.01" />
    </>
  ),
  websites: (
    <>
      <rect x="3" y="4" width="18" height="14" rx="2" />
      <path d="M3 9h18M8 21h8" />
    </>
  ),
  care: (
    <>
      <path d="M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  domains: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" />
    </>
  ),
};

const TINT: Record<Kind, string> = {
  hosting: "bg-brand-soft text-brand",
  websites: "bg-accent-soft text-accent",
  care: "bg-brand-soft text-brand",
  domains: "bg-accent-soft text-accent",
};

/** One of the four things the company sells, on the home page. */
export function ProductCard({
  kind,
  title,
  body,
  link,
  href,
  meta,
}: {
  kind: Kind;
  title: string;
  body: string;
  link: string;
  href: string;
  meta?: ReactNode;
}) {
  return (
    <Card className="flex h-full flex-col" as="li">
      <div className={`flex h-11 w-11 items-center justify-center rounded-full ${TINT[kind]}`}>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-[22px] w-[22px]"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {ICONS[kind]}
        </svg>
      </div>
      <h3 className="mt-4 text-xl font-extrabold text-ink">{title}</h3>
      <p className="mt-2 text-[15px] text-muted">{body}</p>
      {meta ? <p className="mt-auto pt-4 text-sm text-muted">{meta}</p> : <span className="mt-auto" />}
      <ArrowLink href={href} className="mt-2">
        {link}
      </ArrowLink>
    </Card>
  );
}
