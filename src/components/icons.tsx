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

/**
 * The WhatsApp mark: a handset inside a speech bubble, with the bubble's tail at the lower left.
 *
 * Drawn as a solid glyph in `currentColor` so it sits on the brand button rather than beside it. The
 * button stays the site's purple: WhatsApp's own green is 1.98:1 under white text, and a green dark
 * enough to pass AA no longer looks like WhatsApp, so it would lose the recognition it was for. The
 * mark carries the channel, the colour carries us.
 */
export function WhatsAppIcon({ className = "h-[18px] w-[18px] shrink-0" }: IconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12.04 2.5a9.4 9.4 0 0 0-8.06 14.2L2.5 21.5l4.94-1.42A9.4 9.4 0 1 0 12.04 2.5Zm0 1.72a7.68 7.68 0 1 1-3.9 14.3l-.28-.16-2.92.84.85-2.85-.18-.29a7.68 7.68 0 0 1 6.43-11.84Z" />
      <path d="M9.3 7.36c-.18-.4-.36-.41-.53-.42h-.45a.87.87 0 0 0-.63.29 2.64 2.64 0 0 0-.82 1.96c0 1.16.84 2.28.96 2.44.12.15 1.63 2.6 4.02 3.54 1.99.78 2.4.63 2.83.59.43-.04 1.39-.57 1.58-1.11.2-.55.2-1.02.14-1.11-.06-.1-.22-.16-.45-.28-.24-.12-1.4-.69-1.61-.77-.22-.08-.38-.12-.54.12-.16.23-.62.77-.76.93-.14.16-.28.18-.51.06a6.44 6.44 0 0 1-1.9-1.17 7.14 7.14 0 0 1-1.31-1.63c-.14-.24-.02-.36.1-.48.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.53-1.29-.73-1.76Z" />
    </svg>
  );
}
