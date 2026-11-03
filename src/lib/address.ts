import type { ShippingDetails } from "./orders";

/** The posting address from Stripe, one line each; orders without one only have a region. */
export function addressLines(order: { country: string; shipping_address: ShippingDetails | null }): string[] {
  const a = order.shipping_address?.address;
  if (!a) return [order.country];
  const country = a.country === "IE" ? "Ireland" : a.country === "GB" ? `United Kingdom (${order.country})` : a.country;
  return [order.shipping_address?.name, a.line1, a.line2, a.city, a.state, a.postal_code, country].filter(
    (line): line is string => Boolean(line && line.trim()),
  );
}
