import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { newCardId } from "./ids";
import { slugify, slugProblem } from "./slugs";

export type OrderStatus = "requested" | "paid" | "in_production" | "shipped" | "cancelled";
export const ORDER_STATUSES: OrderStatus[] = ["requested", "paid", "in_production", "shipped", "cancelled"];

export type CardOrder = {
  id: number;
  status: OrderStatus;
  name: string;
  email: string;
  business: string | null;
  phone: string | null;
  country: string;
  quantity: string | null;
  message: string | null;
  finish: "black" | "silver" | "gold" | "rose_gold";
  layout: "logo" | "name" | "minimal";
  name_on_card: string | null;
  title_on_card: string | null;
  back_text: string | null;
  logo_path: string | null;
  logo_invert: boolean;
  currency: "GBP" | "EUR";
  card_price: number;
  monthly_price: number;
  card_id: string | null;
  created_at: string;
};

const UNIQUE_VIOLATION = "23505";

async function findOrCreateUser(db: SupabaseClient, email: string): Promise<string> {
  const created = await db.auth.admin.createUser({ email, email_confirm: true });
  if (created.data.user) return created.data.user.id;

  // Already has an account (e.g. a second card): find it.
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`Could not look up accounts: ${error.message}`);
    const match = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (match) return match.id;
    if (data.users.length < 200) break;
  }
  throw new Error(`Could not create an account for ${email}: ${created.error?.message ?? "unknown error"}`);
}

function profileCountry(country: string): string | null {
  if (country === "Ireland") return "Ireland";
  if (country === "Northern Ireland" || country.startsWith("England")) return "United Kingdom";
  return null;
}

async function findOrCreateProfile(db: SupabaseClient, userId: string, order: CardOrder): Promise<{ id: string; slug: string }> {
  const existing = await db.from("profiles").select("id, slug").eq("user_id", userId).limit(1).maybeSingle();
  if (existing.data) return existing.data;

  const fullName = order.name_on_card?.trim() || order.name;
  let base = slugify(order.business || fullName);
  if (slugProblem(base)) base = slugify(fullName);
  if (slugProblem(base)) base = "card";

  for (let attempt = 0; attempt < 8; attempt++) {
    const suffix = attempt === 0 ? "" : `-${attempt < 4 ? attempt + 1 : Math.random().toString(36).slice(2, 6)}`;
    const slug = `${base.slice(0, 40 - suffix.length)}${suffix}`;
    if (slugProblem(slug)) continue;
    const { data, error } = await db
      .from("profiles")
      .insert({
        user_id: userId,
        slug,
        full_name: fullName,
        job_title: order.title_on_card,
        organisation: order.business,
        email: order.email,
        phone: order.phone,
        country: profileCountry(order.country),
      })
      .select("id, slug")
      .single();
    if (data) return data;
    if (error?.code !== UNIQUE_VIOLATION && !/reserved/i.test(error?.message ?? "")) {
      throw new Error(`Could not create the profile: ${error?.message}`);
    }
  }
  throw new Error("Could not find a free profile address.");
}

async function issueCard(db: SupabaseClient, profileId: string): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const id = newCardId();
    const { error } = await db.from("cards").insert({ id, status: "active", profile_id: profileId, claimed_at: new Date().toISOString() });
    if (!error) return id;
    if (error.code !== UNIQUE_VIOLATION) throw new Error(`Could not create the card: ${error.message}`);
  }
  throw new Error("Could not generate a unique card ID.");
}

/**
 * Turn an order into a working card: the customer's account (created if new),
 * their profile (pre-filled from the order) and a new card linked to it.
 */
export async function createCardForOrder(db: SupabaseClient, orderId: number) {
  const { data: order, error } = await db.from("card_orders").select("*").eq("id", orderId).single<CardOrder>();
  if (error || !order) throw new Error("Order not found.");
  if (order.card_id) return { cardId: order.card_id, alreadyExisted: true };

  const userId = await findOrCreateUser(db, order.email);
  const profile = await findOrCreateProfile(db, userId, order);
  const cardId = await issueCard(db, profile.id);

  const { error: linkError } = await db.from("card_orders").update({ card_id: cardId }).eq("id", order.id);
  if (linkError) throw new Error(`Card ${cardId} was made but not linked to the order: ${linkError.message}`);
  return { cardId, slug: profile.slug, alreadyExisted: false };
}
