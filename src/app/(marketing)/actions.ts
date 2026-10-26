"use server";

import { getAdminClient } from "@/lib/supabase/admin";
import { COUNTRIES } from "./countries";

export type EnquiryState = { status: "idle" | "ok" | "error"; message?: string };

const TIERS = ["Standard", "Platinum", "Not sure yet"];
const QUANTITIES = ["1", "2–5", "6–20", "21–50", "50+"];

function field(form: FormData, name: string, max: number): string {
  return String(form.get(name) ?? "").trim().slice(0, max);
}

export async function submitEnquiry(_prev: EnquiryState, form: FormData): Promise<EnquiryState> {
  // Bots fill the hidden field; pretend success so they don't retry.
  if (field(form, "company_url", 200)) return { status: "ok" };

  const name = field(form, "name", 120);
  const email = field(form, "email", 200);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: "error", message: "Please enter your name and a valid email address." };
  }

  const country = field(form, "country", 40);
  if (!COUNTRIES.includes(country)) {
    return { status: "error", message: "Please choose where we should deliver." };
  }

  const tier = field(form, "tier", 20);
  const quantity = field(form, "quantity", 10);

  const db = getAdminClient();
  if (!db) return { status: "error" };

  const { error } = await db.from("enquiries").insert({
    name,
    email,
    business: field(form, "business", 160) || null,
    phone: field(form, "phone", 40) || null,
    country,
    tier: TIERS.includes(tier) ? tier : null,
    quantity: QUANTITIES.includes(quantity) ? quantity : null,
    message: field(form, "message", 4000) || null,
  });
  if (error) {
    console.error("enquiry insert failed", error.message);
    return { status: "error" };
  }
  return { status: "ok" };
}
