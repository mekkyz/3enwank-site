import { BrowserIcon, GlobeIcon, HardDrivesIcon, ShieldCheckIcon } from "@phosphor-icons/react/dist/ssr";
import type { ReactNode } from "react";
import { ArrowLink, Card } from "./blocks";

type Kind = "hosting" | "websites" | "care" | "domains";

/*
 * One mark per thing the company sells, each the nearest stand-in for the drawing it replaces:
 * stacked drives with a status light for hosting, a shield with a tick for care, a meridian globe for
 * domains. Websites is the one that had to give something up — the old drawing was a screen with both
 * a browser bar across the top and a monitor stand under it, and Phosphor splits those: Monitor keeps
 * the stand and loses the bar, Browser keeps the bar. The bar is the half that said "a website"
 * rather than "a computer", so Browser it is.
 *
 * Typed off one of the components: the /dist/ssr entry exports every icon but not the Icon type, and
 * reaching into the package root for it would pull the one entry that breaks in a server component.
 */
const ICONS: Record<Kind, typeof GlobeIcon> = {
  hosting: HardDrivesIcon,
  websites: BrowserIcon,
  care: ShieldCheckIcon,
  domains: GlobeIcon,
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
  const Glyph = ICONS[kind];
  return (
    <Card className="flex h-full flex-col" as="li">
      <div data-tone={kind === "websites" || kind === "domains" ? "accent" : "brand"} className={`card-icon flex h-11 w-11 items-center justify-center rounded-full ${TINT[kind]}`}>
        {/* Still 22px inside the 44px disc, and the tint on the disc is what colours it: currentColor. */}
        <Glyph aria-hidden="true" size={22} weight="bold" />
      </div>
      <h3 className="mt-4 text-xl font-extrabold text-ink">{title}</h3>
      <p className="mt-2 text-[15px] text-muted">{body}</p>
      {meta ? <div className="mt-auto pt-4 text-sm text-muted">{meta}</div> : <span className="mt-auto" />}
      <ArrowLink href={href} className="mt-2">
        {link}
      </ArrowLink>
    </Card>
  );
}
