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
 * None of the four takes Phosphor's `mirrored` prop, because none of them is directional. The three
 * objects are symmetric about the vertical axis, and the WhatsApp mark is a logo: flipping its tail
 * on Arabic pages would make it a different mark, not a mirrored one.
 */
import { MoneyIcon, ShoppingBagIcon, GlobeIcon, UserCircleIcon, WhatsappLogoIcon } from "@phosphor-icons/react/dist/ssr";

type IconProps = { className?: string };

/**
 * Bold everywhere. See the note above: this is the weight that matches what the bar used to draw,
 * so changing it here changes every icon in the bar at once, which is the point of the wrapper.
 */
const WEIGHT = "bold" as const;

/**
 * A banknote.
 *
 * Not "Coins", which collapses into a blob at 19px, and none of the Currency* variants, every one
 * of which is a dollar sign — legible and wrong for a company whose prices are in pounds first. An
 * EGP mark is not a shape anyone recognises at this size either, so the icon names money and leaves
 * the code itself to the menu that opens underneath.
 */
export function CurrencyIcon({ className = "shrink-0" }: IconProps) {
  return <MoneyIcon size={19} weight={WEIGHT} aria-hidden="true" className={className} />;
}

/**
 * A globe.
 *
 * Worth remembering why it is a drawing and not lettering: this icon was once an "A" and a "ع"
 * set as two SVG <text> glyphs, and text inside an SVG takes the page's font and the page's
 * direction. On Arabic pages the two were laid out right to left and the "A" was pushed clean out
 * of the viewBox, so the icon rendered as a box containing only "ع". Nothing in this file may
 * depend on text rendering or direction again; paths cannot be reordered by direction, so the
 * Arabic and English bars get identical pixels.
 */
export function LanguageIcon({ className = "shrink-0" }: IconProps) {
  return <GlobeIcon size={19} weight={WEIGHT} aria-hidden="true" className={className} />;
}

/**
 * A shopping bag, at 18px rather than 19 — the size the hand-drawn one carried, kept because the
 * header has only about 9px of slack at 390px and this sits under the count badge.
 */
export function CartIcon({ className = "shrink-0" }: IconProps) {
  return <ShoppingBagIcon size={18} weight={WEIGHT} aria-hidden="true" className={className} />;
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
