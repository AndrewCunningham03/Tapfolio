import type Stripe from "stripe";
import { PRICES, type Currency } from "@/lib/site";
import { getStripe } from "@/lib/stripe";
import { alertNewOrder } from "@/lib/alerts";
import { ensureProfileForOrder, type CardOrder } from "@/lib/orders";
import { getAdminClient } from "@/lib/supabase/admin";

// Stripe calls this when someone pays, a payment fails, or a subscription changes.
// The signature check is what proves the call really came from Stripe.
export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const db = getAdminClient();
  if (!stripe || !secret || !db) return new Response("Not configured", { status: 500 });

  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), signature, secret);
  } catch {
    return new Response("Bad signature", { status: 400 });
  }

  try {
    // Card payments arrive with "completed"; delayed ones (direct debit) with "async_payment_succeeded".
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      await recordOrder(stripe, db, event.data.object);
    } else if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      await recordSubscription(db, event.data.object);
    }
  } catch (e) {
    // A non-2xx answer makes Stripe retry later.
    console.error("stripe webhook failed", event.type, e instanceof Error ? e.message : e);
    return new Response("Failed", { status: 500 });
  }
  return new Response("ok");
}

type Db = NonNullable<ReturnType<typeof getAdminClient>>;

async function recordSubscription(db: Db, sub: Stripe.Subscription) {
  const userId = sub.metadata.user_id;
  if (!userId) return;
  // Newer Stripe versions keep the billing period on the subscription's items.
  const periodEnd = sub.items.data[0]?.current_period_end;
  // The grace period runs from the first failure: keep the earlier date if a payment keeps failing.
  const { data: existing } = await db
    .from("subscriptions")
    .select("past_due_since")
    .eq("user_id", userId)
    .maybeSingle<{ past_due_since: string | null }>();
  const pastDueSince =
    sub.status === "past_due"
      ? (existing?.past_due_since ?? new Date().toISOString())
      : sub.status === "active" || sub.status === "trialing"
        ? null
        : (existing?.past_due_since ?? null);
  const { error } = await db.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
      stripe_subscription_id: sub.id,
      status: sub.status,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      past_due_since: pastDueSince,
    },
    { onConflict: "user_id" },
  );
  if (error) throw new Error(error.message);
}

async function recordOrder(stripe: Stripe, db: Db, session: Stripe.Checkout.Session) {
  if (session.mode !== "subscription" || session.payment_status === "unpaid") return;
  const userId = session.metadata?.user_id;
  const country = session.metadata?.country;
  if (!userId || !country) return;
  const currency: Currency = session.metadata?.currency === "EUR" ? "EUR" : "GBP";

  const details = session.customer_details;
  const shipping = session as unknown as {
    collected_information?: { shipping_details?: unknown };
    shipping_details?: unknown;
  };
  const { data: inserted, error } = await db
    .from("card_orders")
    .upsert(
      {
        status: "paid",
        user_id: userId,
        stripe_session_id: session.id,
        stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
        name: details?.name || details?.email || "Customer",
        email: details?.email ?? session.customer_email ?? "",
        phone: details?.phone ?? null,
        country,
        quantity: "1",
        currency,
        card_price: PRICES[currency].start,
        monthly_price: PRICES[currency].monthly,
        shipping_address: shipping.collected_information?.shipping_details ?? shipping.shipping_details ?? null,
      },
      { onConflict: "stripe_session_id", ignoreDuplicates: true },
    )
    .select("id");
  if (error) throw new Error(error.message);
  // Nothing inserted means Stripe sent this event before: no second alert.
  const isNew = (inserted?.length ?? 0) > 0;

  // Their page exists from the moment they pay; the card is linked to it when posted.
  const { data: order } = await db
    .from("card_orders")
    .select("*")
    .eq("stripe_session_id", session.id)
    .single<CardOrder>();
  if (order) await ensureProfileForOrder(db, order);
  if (order && isNew) await alertNewOrder(order);

  if (typeof session.subscription === "string") {
    await recordSubscription(db, await stripe.subscriptions.retrieve(session.subscription));
  }
}
