/**
 * The bar's icons. Drawn here rather than pulled from a set, so they carry the same stroke weight
 * as each other and inherit `currentColor` in both themes.
 *
 * Each says what it switches rather than what it is: the currency mark shows two currencies being
 * swapped, and the language mark shows the two scripts this site is written in, which is more use
 * to a reader than a globe — a globe means "somewhere", not "another language".
 */
type IconProps = { className?: string };

const STROKE = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const GLYPH = { fill: "currentColor", stroke: "none", fontSize: 11, fontWeight: 800 } as const;

/**
 * Exchange: two arrows going opposite ways.
 *
 * This was a "$" and a "£" set as SVG text with a swap between them, which at 18px was three things
 * fighting for the same 18 pixels and legible as none of them. One shape, drawn at full size.
 */
export function CurrencyIcon({ className = "h-[19px] w-[19px] shrink-0" }: IconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} {...STROKE}>
      <path d="M3.5 8.5h14" />
      <path d="M14.5 5.2 17.8 8.5l-3.3 3.3" />
      <path d="M20.5 15.5h-14" />
      <path d="M9.5 12.2 6.2 15.5l3.3 3.3" />
    </svg>
  );
}

/**
 * The two scripts we publish in. Larger glyphs and a lighter frame than before: at 18px the box was
 * taking room the letters needed to be read.
 */
export function LanguageIcon({ className = "h-[19px] w-[19px] shrink-0" }: IconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <rect x="1.8" y="3.6" width="20.4" height="16.8" rx="3.2" {...STROKE} strokeWidth={1.5} />
      <text x="4.2" y="17" {...GLYPH} fontSize="12.5">
        A
      </text>
      <text x="13" y="17" {...GLYPH} fontSize="12.5">
        ع
      </text>
    </svg>
  );
}

/** A basket, for the cart the store keeps. */
export function CartIcon({ className = "h-[18px] w-[18px]" }: IconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} {...STROKE}>
      <path d="M2.5 3.5h2.2l2.3 11.2a1.6 1.6 0 0 0 1.6 1.3h8.5a1.6 1.6 0 0 0 1.6-1.25l1.6-7.25H6" />
      <circle cx="9.5" cy="20" r="1.4" />
      <circle cx="17.5" cy="20" r="1.4" />
    </svg>
  );
}
