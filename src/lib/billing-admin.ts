// Cancelling a customer's billing from the admin page. Kept free of imports from the rest of the app
// (types only) so it can be tested on its own against Stripe's sandbox.
import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

export type BillingOrder = {
  id: number;
  user_id: string | null;
  stripe_customer_id: string | null;
  card_price: number;
  currency: "GBP" | "EUR";
};

export type BillingResult = { ok: boolean; message: string };

const LIVE = ["active", "trialing", "past_due", "unpaid", "incomplete"];
const pence = (amount: number) => Math.round(amount * 100);
const money = (minor: number, currency: string) =>
  new Intl.NumberFormat("en-IE", { style: "currency", currency: currency.toUpperCase() }).format(minor / 100);

/**
 * Stop a customer being billed, and optionally refund their first payment. Cancels straight away in Stripe
 * (no further charges), marks the order cancelled, and pauses their page now rather than at the end of the month.
 * Safe to run twice: whatever is already cancelled or refunded is skipped.
 */
export async function cancelOrderBilling(
  stripe: Stripe,
  db: SupabaseClient,
  order: BillingOrder,
  opts: { refund: boolean },
): Promise<BillingResult> {
  if (!order.stripe_customer_id) {
    return { ok: false, message: "This order wasn't paid through Stripe, so there's no billing to cancel." };
  }
  const notes: string[] = [];

  // 1. Cancel the subscription(s). Stripe is the source of truth, not our copy of its status.
  const subs = await stripe.subscriptions.list({ customer: order.stripe_customer_id, status: "all", limit: 10 });
  const live = subs.data.filter((s) => LIVE.includes(s.status));
  for (const sub of live) await stripe.subscriptions.cancel(sub.id);
  notes.push(
    live.length ? "Subscription cancelled: no more payments will be taken." : "Subscription was already cancelled.",
  );

  // 2. Refund the first payment (the one for the card, delivery and first month), if asked.
  if (opts.refund) {
    const charges = await stripe.charges.list({ customer: order.stripe_customer_id, limit: 20 });
    const first = charges.data
      .filter((c) => c.paid && c.amount === pence(order.card_price) && c.amount_refunded < c.amount)
      .sort((a, b) => a.created - b.created)[0];
    if (first) {
      await stripe.refunds.create({ charge: first.id });
      notes.push(
        `Refunded ${money(first.amount, first.currency)} to the customer's card (it can take a few days to show).`,
      );
    } else {
      const done = charges.data.some((c) => c.amount === pence(order.card_price) && c.amount_refunded >= c.amount);
      notes.push(
        done
          ? "The first payment was already refunded."
          : "No refundable first payment was found: check Payments in Stripe.",
      );
    }
  }

  // 3. Our own records: the order, and the customer's page (paused from now, not the end of the month).
  const { error: orderError } = await db.from("card_orders").update({ status: "cancelled" }).eq("id", order.id);
  if (orderError) notes.push(`The order status didn't update: ${orderError.message}`);
  if (order.user_id) {
    await db
      .from("subscriptions")
      .update({ status: "canceled", current_period_end: new Date().toISOString(), past_due_since: null })
      .eq("user_id", order.user_id);
  }
  return { ok: true, message: notes.join(" ") };
}
