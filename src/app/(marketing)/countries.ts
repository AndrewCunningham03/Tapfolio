import { PRICES, type Currency } from "@/lib/site";

// Delivery regions for the order form. Northern Ireland is separate from Great
// Britain because shipping and VAT rules differ between them.
export const COUNTRIES = ["Ireland", "Northern Ireland", "England, Scotland or Wales", "Somewhere else"];

/** The currency an order is charged in: sterling in the UK, euro in Ireland, the visitor's choice elsewhere. */
export function orderCurrency(country: string, chosen: Currency): Currency {
  if (country === "Ireland") return "EUR";
  if (country === "Northern Ireland" || country === "England, Scotland or Wales") return "GBP";
  return chosen;
}

/** The one-off delivery charge for an order, paid with the first month. */
export function deliveryPrice(country: string, currency: Currency): number {
  return country === "Somewhere else" ? PRICES[currency].worldDelivery : PRICES[currency].delivery;
}
