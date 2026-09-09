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

/** Two currency marks with a swap between them. */
export function CurrencyIcon({ className = "h-[18px] w-[18px]" }: IconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <text x="0.5" y="16.5" {...GLYPH}>
        $
      </text>
      <path d="M10 12h5" {...STROKE} />
      <path d="M13.4 10.3 15.2 12l-1.8 1.7" {...STROKE} />
      <path d="M11.6 13.7 9.8 12l1.8-1.7" {...STROKE} />
      <text x="15.8" y="16.5" {...GLYPH}>
        £
      </text>
    </svg>
  );
}

/** The two scripts the site is written in, side by side in a frame. */
export function LanguageIcon({ className = "h-[18px] w-[18px]" }: IconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <rect x="2.4" y="4.4" width="19.2" height="15.2" rx="3.4" {...STROKE} />
      <text x="5" y="16" {...GLYPH} fontSize="10">
        A
      </text>
      <text x="12.6" y="16" {...GLYPH} fontSize="10">
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
