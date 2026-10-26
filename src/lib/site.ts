// Business details shown across the marketing site.
export const SITE_NAME = "Tapfolio";

// TODO: replace with a mailbox you own once the domain is registered
export const CONTACT_EMAIL = "hello@tapfolio.co.uk";

export type Currency = "GBP" | "EUR";

// Suggested prices (GBP is the home currency; EUR are rounded equivalents).
// Consumer prices must include VAT once registered, so confirm both against
// supplier quotes and VAT before launch.
export const PRICES = {
  GBP: { standard: 29, platinum: 69, proMonthly: 4, proYearly: 39, teamCard: 22, teamSeatMonthly: 3 },
  EUR: { standard: 35, platinum: 79, proMonthly: 5, proYearly: 45, teamCard: 25, teamSeatMonthly: 3.5 },
} as const satisfies Record<Currency, Record<string, number>>;

export type PriceKey = keyof (typeof PRICES)["GBP"];

export function formatPrice(amount: number, currency: Currency): string {
  return new Intl.NumberFormat(currency === "EUR" ? "en-IE" : "en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
}
