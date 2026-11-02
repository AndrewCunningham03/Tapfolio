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

/** Days of the first month, which the first payment already covers. */
const FIRST_MONTH_DAYS = 30;

const pence = (amount: number) => Math.round(amount * 100);

/**
 * One checkout: the first payment (card, delivery and first month) is taken now, the
 * subscription then waits out that first month and bills the monthly price from then on.
 */
export async function createCheckout(opts: { userId: string; email: string; country: string; origin: string }) {
  const stripe = getStripe();
  const shipTo = SHIP_TO[opts.country];
  if (!stripe || !shipTo) return null;

  const currency = orderCurrency(opts.country);
  const code = currency.toLowerCase();
  const metadata = { user_id: opts.userId, country: opts.country, currency };

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: opts.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: code,
          unit_amount: pence(PRICES[currency].monthly),
          recurring: { interval: "month" },
          product_data: { name: "Tapfolio monthly: your profile, kept live" },
        },
      },
      {
        quantity: 1,
        price_data: {
          currency: code,
          unit_amount: pence(PRICES[currency].start),
          product_data: { name: "Your Tapfolio card, delivery and first month" },
        },
      },
    ],
    shipping_address_collection: { allowed_countries: shipTo },
    phone_number_collection: { enabled: true },
    metadata,
    subscription_data: { metadata, trial_period_days: FIRST_MONTH_DAYS },
    success_url: `${opts.origin}/dashboard?ordered=1`,
    cancel_url: `${opts.origin}/start`,
  });
  return session.url;
}
