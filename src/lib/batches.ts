import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { newCardId } from "./ids";

// A batch is one order of blank cards from the supplier. Every card gets its
// own permanent link and waits as "unclaimed" until it's assigned in /admin.

export type Material = "metal" | "plastic";
type Tier = "platinum" | "standard";

const TIER: Record<Material, Tier> = { metal: "platinum", plastic: "standard" };
export const materialOf = (tier: Tier): Material => (tier === "platinum" ? "metal" : "plastic");

export const MAX_PER_MATERIAL = 1000;

export type BatchStock = {
  id: number;
  label: string;
  supplier: string | null;
  created_at: string;
  metal: number;
  plastic: number;
  metal_in_stock: number;
  plastic_in_stock: number;
  assigned: number;
  disabled: number;
};

export type BatchCard = { id: string; material: Material };

const UNIQUE_VIOLATION = "23505";
const PAGE = 1000; // Supabase returns at most 1000 rows per request

/** Create a batch of blank cards: `metal` metal and `plastic` plastic, each with a new unique ID. */
export async function createBatch(
  db: SupabaseClient,
  { metal, plastic, label, supplier }: { metal: number; plastic: number; label: string; supplier: string | null },
): Promise<{ id: number; label: string; count: number }> {
  const tiers: Tier[] = [...Array(metal).fill(TIER.metal), ...Array(plastic).fill(TIER.plastic)];
  if (!tiers.length) throw new Error("Choose how many metal or plastic cards to make.");

  const { data: batch, error } = await db
    .from("batches")
    .insert({ label, supplier, tier: metal && plastic ? null : metal ? TIER.metal : TIER.plastic, quantity: tiers.length })
    .select("id")
    .single<{ id: number }>();
  if (error || !batch) throw new Error(`Could not create the batch: ${error?.message}`);

  // An ID clash is vanishingly rare (34 billion IDs); if it happens, the whole
  // insert is rejected and we simply try again with fresh IDs.
  for (let attempt = 0; attempt < 3; attempt++) {
    const rows = tiers.map((tier) => ({ id: newCardId(), batch_id: batch.id, tier }));
    if (new Set(rows.map((r) => r.id)).size !== rows.length) continue;
    const { error: cardsError } = await db.from("cards").insert(rows);
    if (!cardsError) return { id: batch.id, label, count: rows.length };
    if (cardsError.code !== UNIQUE_VIOLATION) {
      await db.from("batches").delete().eq("id", batch.id);
      throw new Error(`Could not create the cards: ${cardsError.message}`);
    }
  }
  await db.from("batches").delete().eq("id", batch.id);
  throw new Error("Could not generate unique card IDs. Please try again.");
}

export async function listBatches(db: SupabaseClient, limit = 50): Promise<BatchStock[]> {
  const { data, error } = await db.from("batch_stock").select("*").order("created_at", { ascending: false }).limit(limit);
  if (error) throw new Error(`Could not load card stock: ${error.message}`);
  return data as BatchStock[];
}

/** The batch and all its cards, metal first, in the order they were made. */
export async function getBatch(db: SupabaseClient, id: number): Promise<{ batch: BatchStock; cards: BatchCard[] } | null> {
  const { data: batch } = await db.from("batch_stock").select("*").eq("id", id).maybeSingle<BatchStock>();
  if (!batch) return null;

  const cards: BatchCard[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db
      .from("cards")
      .select("id, tier")
      .eq("batch_id", id)
      .order("tier", { ascending: false })
      .order("created_at")
      .order("id")
      .range(from, from + PAGE - 1)
      .returns<{ id: string; tier: Tier }[]>();
    if (error) throw new Error(`Could not load the cards: ${error.message}`);
    cards.push(...data.map((c) => ({ id: c.id, material: materialOf(c.tier) })));
    if (data.length < PAGE) break;
  }
  return { batch, cards };
}
