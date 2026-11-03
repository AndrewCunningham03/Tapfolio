"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { createCheckout } from "@/lib/stripe";
import { getAdminClient } from "@/lib/supabase/admin";
import { COUNTRIES } from "../countries";

export type StartState = { message?: string };

const LIVE_STATUSES = ["active", "trialing", "past_due", "unpaid", "incomplete"];

export async function startCheckout(_prev: StartState, form: FormData): Promise<StartState> {
  const user = await getUser();
  if (!user?.email) redirect("/login?next=/start");

  const country = String(form.get("country") ?? "");
  if (!COUNTRIES.includes(country)) return { message: "Please choose where we should deliver." };

  // One subscription per customer: a second checkout would bill them twice.
  const db = getAdminClient();
  const { data: existing } = db
    ? await db
        .from("subscriptions")
        .select("status, stripe_customer_id")
        .eq("user_id", user.id)
        .maybeSingle<{ status: string; stripe_customer_id: string | null }>()
    : { data: null };
  if (existing && LIVE_STATUSES.includes(existing.status)) {
    return { message: "You already have a Tapfolio subscription. Manage it from your dashboard." };
  }

  const h = await headers();
  const origin = h.get("origin") ?? `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;

  let url: string | null = null;
  try {
    url = await createCheckout({
      userId: user.id,
      email: user.email,
      country,
      origin,
      customerId: existing?.stripe_customer_id,
    });
  } catch (e) {
    console.error("checkout failed", e instanceof Error ? e.message : e);
  }
  if (!url) return { message: "We couldn't start the payment just now. Please try again shortly." };
  redirect(url);
}
