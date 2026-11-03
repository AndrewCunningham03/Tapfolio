"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { getServerClient } from "@/lib/supabase/server";

/** Send the customer to Stripe's own billing page: change card, see invoices, cancel. */
export async function openBilling() {
  const user = await getUser();
  if (!user) redirect("/login?next=/dashboard");

  // Row-level security returns only this customer's own subscription.
  const supabase = await getServerClient();
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .maybeSingle<{ stripe_customer_id: string | null }>();
  const stripe = getStripe();
  if (!sub?.stripe_customer_id || !stripe) redirect("/dashboard?billing=unavailable");

  const h = await headers();
  const origin = h.get("origin") ?? `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  let url: string | null = null;
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${origin}/dashboard`,
    });
    url = session.url;
  } catch (e) {
    console.error("billing portal failed", e instanceof Error ? e.message : e);
  }
  redirect(url ?? "/dashboard?billing=unavailable");
}
