/**
 * wa.me takes a bare international number and a pre-written first message. Shared by the home page's
 * moving section, the contact page and the hosting page's moving line, which all open WhatsApp with
 * their own first line (it lived privately in components/contact.tsx while contact was the only one).
 */
export function waHref(number: string, text: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

/**
 * A plain placeholder swap for text that leaves the page (a WhatsApp first line, a form note). Not
 * fill(): fill() wraps Latin values in Unicode isolates for Arabic sentences on the page, and those
 * invisible characters would travel into the customer's WhatsApp message and our ticket.
 */
export function withPlan(template: string, plan: string): string {
  return template.replace("{plan}", plan);
}
