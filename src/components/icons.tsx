/**
 * The bar's icons, as a thin wrapper over Phosphor.
 *
 * They used to be hand-drawn inline SVG on a 24 grid so they would share a stroke weight. Phosphor
 * is one family already, drawn on a 256 viewBox with `fill=currentColor`, so the family argument is
 * settled by the set rather than by us keeping four paths in step by eye.
 *
 * The import is `@phosphor-icons/react/dist/ssr`, and that entry specifically. The package ROOT
 * entry renders through IconBase, which calls `useContext` without a "use client" directive, so it
 * throws the moment it is rendered in a server component. The /dist/ssr entry renders through
 * SSRBase, which has no hooks at all: it works in server and client components alike and ships no
 * client JS. Both matter here, because these four straddle that line — the language switch is in a
 * server shell and the WhatsApp button is in a server section, while the currency switch and the
 * cart link are client components.
 *
 * The weight is bold. Measured against the outgoing hand-drawn set at 19px: "regular" is as light
 * as the 1.7-stroke version the owner already rejected, "fill" is too heavy for a bar, and "bold"
 * lands on the 2.2 stroke these were drawn at. The WhatsApp mark is the one exception and says why
 * at its own definition: it is a logo, not one of the bar's three objects.
 *
 * The wrapper is deliberate. It is the one place the house size and weight are set, it keeps the
 * call sites in this repo unchanged, and it keeps this file in step with the platform repo's copy
 * of it.
 *
 * None of them takes Phosphor's `mirrored` prop, because none of them is directional. The objects
 * are symmetric about the vertical axis, and the WhatsApp mark is a logo: flipping its tail
 * on Arabic pages would make it a different mark, not a mirrored one.
 */
import { TranslateIcon, ShoppingCartIcon, UserCircleIcon, WhatsappLogoIcon } from "@phosphor-icons/react/dist/ssr";

type IconProps = { className?: string };

/**
 * Bold everywhere. See the note above: this is the weight that matches what the bar used to draw,
 * so changing it here changes every icon in the bar at once, which is the point of the wrapper.
 */
const WEIGHT = "bold" as const;

/**
 * Two coins changing hands: a pound and a dollar with an arrow each way.
 *
 * The one icon in the bar that is drawn rather than taken from Phosphor, because the set has no
 * exchange icon: its Coins is a stack, its Currency* icons are one sign each, and Swap is two bare
 * arrows that say nothing about money. The owner chose this shape (2026-09-14). It is drawn on the
 * set's 24-unit grid with the bold weight's stroke so it sits between the Phosphor icons without
 * looking foreign; the signs inside the coins use a lighter stroke so they stay readable at 19px.
 * Symmetric enough not to mirror: the arrows already point both ways.
 */
export function CurrencyIcon({ className = "shrink-0" }: IconProps) {
  return (
    <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <circle cx="7.5" cy="7.5" r="5.25" />
      <circle cx="16.5" cy="16.5" r="5.25" />
      <g strokeWidth={1.6}>
        {/* pound in the first coin */}
        <path d="M9 10.1H5.9c.6-.6.8-1.2.8-1.9V6.7c0-.9.7-1.6 1.6-1.6.5 0 .9.2 1.2.5" />
        <path d="M5.9 7.9h2.6" />
        {/* dollar in the second coin */}
        <path d="M16.5 13.2v6.6" />
        <path d="M18.2 14.9c-.3-.5-.9-.8-1.7-.8-1 0-1.8.6-1.8 1.3s.8 1.1 1.8 1.3c1 .2 1.8.6 1.8 1.3s-.8 1.3-1.8 1.3c-.8 0-1.4-.3-1.7-.8" />
      </g>
      <path d="M14.5 4.5h6.5M19 2.5l2 2-2 2" />
      <path d="M9.5 19.5H3M5 17.5l-2 2 2 2" />
    </svg>
  );
}

/**
 * Phosphor's Translate: a Latin A beside an Arabic-looking letter, which is what the menu under it
 * offers. It replaced a globe on 2026-09-14 at the owner's choice.
 *
 * Worth remembering why it is a drawing and not lettering: this icon was once an "A" and a "ع"
 * set as two SVG <text> glyphs, and text inside an SVG takes the page's font and the page's
 * direction. On Arabic pages the two were laid out right to left and the "A" was pushed clean out
 * of the viewBox, so the icon rendered as a box containing only "ع". Nothing in this file may
 * depend on text rendering or direction again; paths cannot be reordered by direction, so the
 * Arabic and English bars get identical pixels.
 */
export function LanguageIcon({ className = "shrink-0" }: IconProps) {
  return <TranslateIcon size={19} weight={WEIGHT} aria-hidden="true" className={className} />;
}

/**
 * A shopping cart (the owner's choice over the bag, 2026-09-14), at 18px rather than 19: the size
 * the hand-drawn one carried, kept because the header has only about 9px of slack at 390px and this
 * sits under the count badge.
 */
export function CartIcon({ className = "shrink-0" }: IconProps) {
  return <ShoppingCartIcon size={18} weight={WEIGHT} aria-hidden="true" className={className} />;
}

/**
 * A person in a circle: the customer area, on phones only.
 *
 * The bar's "Log in" is a word from 640px up and had no room to be one below it, so a returning
 * customer on a phone had to find the footer. The circled person is the shape every app puts on
 * its account entry, which is what the link is; a door-and-arrow "sign in" reads as "leave" at
 * this size. Symmetric, so no `mirrored`, like the three above.
 */
export function AccountIcon({ className = "shrink-0" }: IconProps) {
  return <UserCircleIcon size={19} weight={WEIGHT} aria-hidden="true" className={className} />;
}

/**
 * The WhatsApp mark.
 *
 * Hand-drawn until Phosphor turned out to have it; the rule is that we only draw what the set does
 * not carry. What survives the swap is the colour decision, which was never about the drawing: the
 * mark renders in `currentColor` and sits on the site's purple button rather than on WhatsApp
 * green, because WhatsApp's own green is 1.98:1 under white text, and a green dark enough to pass
 * AA no longer looks like WhatsApp, so it would lose the recognition it was for. The mark carries
 * the channel, the colour carries us.
 */
export function WhatsAppIcon({ className = "shrink-0" }: IconProps) {
  // The one icon that is not WEIGHT. A brand mark is recognised by its silhouette, and the one this
  // replaced was a solid glyph; at bold it becomes an outline and reads lighter than the button it
  // sits on. "fill" is too heavy for the bar's three marks and right for this one, which is a logo
  // rather than a member of that family.
  return <WhatsappLogoIcon size={18} weight="fill" aria-hidden="true" className={className} />;
}
