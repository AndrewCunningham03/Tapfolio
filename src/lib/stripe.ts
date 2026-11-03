import "server-only";
import Stripe from "stripe";
import { orderCurrency } from "@/app/(marketing)/countries";
import { PRICES } from "./site";

/** Stripe client, or null until STRIPE_SECRET_KEY is set. */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  return key ? new Stripe(key) : null;
}

// Cards are posted to the delivery region picked at checkout.
const SHIP_TO: Record<string, Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[]> = {
  Ireland: ["IE"],
  "Northern Ireland": ["GB"],
  "England, Scotland or Wales": ["GB"],
};

const pence = (amount: number) => Math.round(amount * 100);

/**
 * One checkout. Today the customer pays the first month plus a one-off charge for the card and
 * its delivery, which add up to the "start" price; after that the subscription bills the monthly
 * price on the same date each month.
 */
export async function createCheckout(opts: {
  userId: string;
  email: string;
  country: string;
  origin: string;
  customerId?: string | null;
}) {
  const stripe = getStripe();
  const shipTo = SHIP_TO[opts.country];
  if (!stripe || !shipTo) return null;

  const currency = orderCurrency(opts.country);
  const code = currency.toLowerCase();
  const metadata = { user_id: opts.userId, country: opts.country, currency };

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    ...(opts.customerId ? { customer: opts.customerId } : { customer_email: opts.email }),
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: code,
          unit_amount: pence(PRICES[currency].monthly),
          recurring: { interval: "month" },
          product_data: { name: "Tapfolio monthly" },
        },
      },
      {
        quantity: 1,
        price_data: {
          currency: code,
          unit_amount: pence(PRICES[currency].start) - pence(PRICES[currency].monthly),
          product_data: { name: "Your Tapfolio card and delivery (one-off)" },
        },
      },
    ],
    shipping_address_collection: { allowed_countries: shipTo },
    phone_number_collection: { enabled: true },
    metadata,
    subscription_data: { metadata },
    // Charge in the currency we priced in (pounds in the UK, euro in Ireland), never a converted one.
    adaptive_pricing: { enabled: false },
    success_url: `${opts.origin}/dashboard?ordered=1`,
    cancel_url: `${opts.origin}/start`,
  });
  return session.url;
}
