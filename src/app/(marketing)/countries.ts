import type { Currency } from "@/lib/site";

// Delivery regions: the UK and Ireland. Northern Ireland is separate from Great
// Britain because shipping and VAT rules differ between them.
export const COUNTRIES = ["Ireland", "Northern Ireland", "England, Scotland or Wales"];

/** The currency an order is charged in: euro in Ireland, sterling in the UK. */
export function orderCurrency(country: string): Currency {
  return country === "Ireland" ? "EUR" : "GBP";
}
