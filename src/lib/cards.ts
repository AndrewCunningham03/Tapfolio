import "server-only";
import { getAdminClient } from "./supabase/admin";
import { isCardId, normalise } from "./ids";

export type CardLookup =
  | { status: "unknown" }
  | { status: "unclaimed" | "disabled"; id: string }
  | { status: "active"; id: string; profileId: string; slug: string };

/**
 * Resolve the ID printed on a card. Not cached: a card must start working the
 * moment it is assigned, and stop the moment it is disabled.
 */
export async function lookupCard(rawId: string): Promise<CardLookup> {
  const id = normalise(rawId);
  if (!isCardId(id)) return { status: "unknown" };

  const db = getAdminClient();
  if (!db) throw new Error("Supabase is not configured");

  const { data, error } = await db
    .from("cards")
    .select("id, status, profile_id, profiles(slug)")
    .eq("id", id)
    .maybeSingle<{ id: string; status: "unclaimed" | "active" | "disabled"; profile_id: string | null; profiles: { slug: string } | null }>();
  if (error) throw new Error(`Could not look up card: ${error.message}`);
  if (!data) return { status: "unknown" };

  if (data.status === "active" && data.profile_id && data.profiles) {
    return { status: "active", id: data.id, profileId: data.profile_id, slug: data.profiles.slug };
  }
  return { status: data.status === "active" ? "unclaimed" : data.status, id: data.id };
}
