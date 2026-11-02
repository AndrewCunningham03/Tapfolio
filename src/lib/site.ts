// Business details shown across the marketing site.
export const SITE_NAME = "Tapfolio";

// Forwarded to the owner's inbox by Cloudflare Email Routing.
export const CONTACT_EMAIL = "admin@tapfolio.co.uk";

/**
 * What every card's chip and QR code open. Always the live domain, whatever
 * site is running, because it is engraved into the card for good. Upper case
 * keeps the QR code small.
 */
export const CARD_URL_BASE = "HTTPS://TAPFOLIO.CO.UK/C/";

/** Public ID of the Google sign-in client (not a secret; the secret lives in Supabase). */
export const GOOGLE_CLIENT_ID = "96400455356-62o39snk1n9h5j201cevpevddb3cmsof.apps.googleusercontent.com";

export type Currency = "GBP" | "EUR";

// One product, sold in the UK (sterling) and Ireland (euro): `start` is the first
// payment, which covers the card, its delivery and the first month; after that
// it is `monthly`. `card` is only the upfront price used by the hidden card
// designer, whose gold and rose gold finishes cost `goldCard`.
// Cards go by Royal Mail. EUR prices are rounded equivalents.
// Consumer prices must include VAT once registered.
export const PRICES = {
  GBP: { card: 0, goldCard: 35, start: 30, monthly: 6.99 },
  EUR: { card: 0, goldCard: 39, start: 36, monthly: 8.99 },
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
