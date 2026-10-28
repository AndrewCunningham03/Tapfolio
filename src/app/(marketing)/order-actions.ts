"use server";

import { getAdminClient } from "@/lib/supabase/admin";
import { PRICES } from "@/lib/site";
import { COUNTRIES, orderCurrency } from "./countries";

export type OrderState = { status: "idle" | "ok" | "error"; message?: string };

const QUANTITIES = ["1", "2–5", "6–20", "21–50", "50+"];

function field(form: FormData, name: string, max: number): string {
  return String(form.get(name) ?? "").trim().slice(0, max);
}

/** An order for the standard Tapfolio card (no custom design). */
export async function submitOrder(_prev: OrderState, form: FormData): Promise<OrderState> {
  // Bots fill the hidden field; pretend success so they don't retry.
  if (field(form, "company_url", 200)) return { status: "ok" };

  const name = field(form, "name", 120);
  const email = field(form, "email", 200);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: "error", message: "Please enter your name and a valid email address." };
  }
  const country = field(form, "country", 40);
  if (!COUNTRIES.includes(country)) return { status: "error", message: "Please choose where we should deliver." };

  const currency = orderCurrency(country, form.get("currency") === "EUR" ? "EUR" : "GBP");
  const quantity = field(form, "quantity", 10);

  const db = getAdminClient();
  if (!db) return { status: "error" };

  const { error } = await db.from("card_orders").insert({
    name,
    email,
    business: field(form, "business", 160) || null,
    phone: field(form, "phone", 40) || null,
    country,
    quantity: QUANTITIES.includes(quantity) ? quantity : "1",
    message: field(form, "message", 4000) || null,
    currency,
    card_price: PRICES[currency].card,
    monthly_price: PRICES[currency].monthly,
  });
  if (error) {
    console.error("order insert failed", error.message);
    return { status: "error" };
  }
  return { status: "ok" };
}
