"use server";

import { getUser, isAdmin } from "@/lib/auth";
import { assignStockCard } from "@/lib/orders";
import { getAdminClient } from "@/lib/supabase/admin";

export type ScanResult = { ok: boolean; message: string };

/**
 * Assign the card that was just scanned to a paid order. Unlike the admin page's version this
 * does not refresh the page, so the owner keeps seeing the posting address after pressing the button.
 */
export async function assignScannedCard(orderId: number, cardId: string): Promise<ScanResult> {
  try {
    if (!isAdmin(await getUser())) return { ok: false, message: "Not allowed." };
    const db = getAdminClient();
    if (!db) return { ok: false, message: "Supabase is not configured." };
    const result = await assignStockCard(db, orderId, cardId);
    return result.alreadyExisted
      ? { ok: true, message: `This order already has card ${result.cardId}.` }
      : { ok: true, message: `Card ${result.cardId} is now live and linked to /${result.slug}.` };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Something went wrong." };
  }
}
