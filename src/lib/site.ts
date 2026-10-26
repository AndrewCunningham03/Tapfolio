// Business details shown across the marketing site.
export const SITE_NAME = "Tapfolio";

// TODO: replace with a mailbox you own once the domain is registered
export const CONTACT_EMAIL = "hello@tapfolio.co.uk";

export type Currency = "GBP" | "EUR";

// One product: a metal card bought once, then a monthly subscription that
// keeps the profile live. EUR prices are rounded equivalents. Consumer prices
// must include VAT once registered.
export const PRICES = {
  GBP: { card: 25, monthly: 10 },
  EUR: { card: 29, monthly: 12 },
} as const satisfies Record<Currency, Record<string, number>>;

export type PriceKey = keyof (typeof PRICES)["GBP"];

/** Days a card keeps working after a failed payment, before it pauses. */
export const GRACE_DAYS = 14;

export function formatPrice(amount: number, currency: Currency): string {
  return new Intl.NumberFormat(currency === "EUR" ? "en-IE" : "en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
}
