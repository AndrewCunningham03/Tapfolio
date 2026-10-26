"use server";

import { randomUUID } from "node:crypto";
import { getAdminClient } from "@/lib/supabase/admin";
import { FINISHES, isFinish, isLayout, LIMITS } from "@/lib/card-design";
import { PRICES, type Currency } from "@/lib/site";
import { COUNTRIES } from "../countries";

export type OrderState = { status: "idle" | "ok" | "error"; message?: string };

const QUANTITIES = ["1", "2–5", "6–20", "21–50", "50+"];
const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_LOGO_BYTES = 2 * 1024 * 1024;

function field(form: FormData, name: string, max: number): string {
  return String(form.get(name) ?? "").trim().slice(0, max);
}

export async function submitCardOrder(_prev: OrderState, form: FormData): Promise<OrderState> {
  // Bots fill the hidden field; pretend success so they don't retry.
  if (field(form, "company_url", 200)) return { status: "ok" };

  const name = field(form, "name", 120);
  const email = field(form, "email", 200);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: "error", message: "Please enter your name and a valid email address." };
  }
  const country = field(form, "country", 40);
  if (!COUNTRIES.includes(country)) return { status: "error", message: "Please choose where we should deliver." };

  const finish = form.get("finish");
  const layout = form.get("layout");
  if (!isFinish(finish) || !isLayout(layout)) return { status: "error", message: "Please choose a finish and layout." };

  const currency: Currency = form.get("currency") === "EUR" ? "EUR" : "GBP";
  const quantity = field(form, "quantity", 10);

  const db = getAdminClient();
  if (!db) return { status: "error" };

  // Optional logo, already shrunk to a PNG in the browser.
  let logoPath: string | null = null;
  const logo = form.get("logo");
  if (logo instanceof File && logo.size > 0) {
    if (!LOGO_TYPES.includes(logo.type) || logo.size > MAX_LOGO_BYTES) {
      return { status: "error", message: "The logo must be a PNG, JPG or WebP image under 2 MB." };
    }
    logoPath = `orders/${new Date().toISOString().slice(0, 7)}/${randomUUID()}.${logo.type.split("/")[1]}`;
    const { error } = await db.storage.from("card-logos").upload(logoPath, logo, { contentType: logo.type });
    if (error) {
      console.error("logo upload failed", error.message);
      return { status: "error", message: "We couldn't upload your logo. Please try again." };
    }
  }

  const { error } = await db.from("card_orders").insert({
    name,
    email,
    business: field(form, "business", 160) || null,
    phone: field(form, "phone", 40) || null,
    country,
    quantity: QUANTITIES.includes(quantity) ? quantity : "1",
    message: field(form, "message", 4000) || null,
    finish,
    layout,
    name_on_card: field(form, "name_on_card", LIMITS.name) || null,
    title_on_card: field(form, "title_on_card", LIMITS.title) || null,
    back_text: field(form, "back_text", LIMITS.back) || null,
    logo_path: logoPath,
    logo_invert: form.get("logo_invert") === "true",
    currency,
    card_price: PRICES[currency][FINISHES[finish].price],
    monthly_price: PRICES[currency].monthly,
  });
  if (error) {
    console.error("card order insert failed", error.message);
    if (logoPath) await db.storage.from("card-logos").remove([logoPath]);
    return { status: "error" };
  }
  return { status: "ok" };
}
