// Business details shown across the marketing site.
export const SITE_NAME = "Tapfolio";

// TODO: replace with a mailbox you own once the domain is registered
export const CONTACT_EMAIL = "hello@tapfolio.co.uk";

/**
 * What every card's chip and QR code open. Always the live domain, whatever
 * site is running, because it is engraved into the card for good. Upper case
 * keeps the QR code small.
 */
export const CARD_URL_BASE = "HTTPS://TAPFOLIO.CO.UK/C/";

export type Currency = "GBP" | "EUR";

// One product: a monthly subscription that includes the card and keeps the
// profile live. Nothing to pay upfront, so `card` (the upfront price) is 0.
// `goldCard` is the upfront price of gold and rose gold in the hidden card
// designer. EUR prices are rounded equivalents.
// Consumer prices must include VAT once registered.
export const PRICES = {
  GBP: { card: 0, goldCard: 35, monthly: 10 },
  EUR: { card: 0, goldCard: 39, monthly: 12 },
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
