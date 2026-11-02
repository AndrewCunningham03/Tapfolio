"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { createCheckout } from "@/lib/stripe";
import { COUNTRIES } from "../countries";

export type StartState = { message?: string };

export async function startCheckout(_prev: StartState, form: FormData): Promise<StartState> {
  const user = await getUser();
  if (!user?.email) redirect("/login?next=/start");

  const country = String(form.get("country") ?? "");
  if (!COUNTRIES.includes(country)) return { message: "Please choose where we should deliver." };

  const h = await headers();
  const origin = h.get("origin") ?? `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;

  let url: string | null = null;
  try {
    url = await createCheckout({ userId: user.id, email: user.email, country, origin });
  } catch (e) {
    console.error("checkout failed", e instanceof Error ? e.message : e);
  }
  if (!url) return { message: "We couldn't start the payment just now. Please try again shortly." };
  redirect(url);
}
