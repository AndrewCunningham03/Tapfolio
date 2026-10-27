"use server";

import { refresh } from "next/cache";
import { getUser, isAdmin } from "@/lib/auth";
import { assignStockCard, createCardForOrder, ORDER_STATUSES, type OrderStatus } from "@/lib/orders";
import { getAdminClient } from "@/lib/supabase/admin";

export type AdminResult = { ok: boolean; message: string };

async function adminDb() {
  if (!isAdmin(await getUser())) throw new Error("Not allowed.");
  const db = getAdminClient();
  if (!db) throw new Error("Supabase is not configured.");
  return db;
}

export async function setOrderStatus(orderId: number, status: OrderStatus): Promise<AdminResult> {
  if (!ORDER_STATUSES.includes(status)) return { ok: false, message: "Unknown status." };
  const db = await adminDb();
  const { error } = await db.from("card_orders").update({ status }).eq("id", orderId);
  if (error) return { ok: false, message: error.message };
  refresh();
  return { ok: true, message: "Status updated." };
}

export async function assignCard(orderId: number, cardId: string): Promise<AdminResult> {
  try {
    const db = await adminDb();
    const result = await assignStockCard(db, orderId, cardId);
    refresh();
    return result.alreadyExisted
      ? { ok: true, message: `This order already has card ${result.cardId}.` }
      : { ok: true, message: `Card ${result.cardId} is now live and linked to /${result.slug}.` };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Something went wrong." };
  }
}

export async function makeCard(orderId: number): Promise<AdminResult> {
  try {
    const db = await adminDb();
    const result = await createCardForOrder(db, orderId);
    refresh();
    return result.alreadyExisted
      ? { ok: true, message: `This order already has card ${result.cardId}.` }
      : { ok: true, message: `Card ${result.cardId} created and linked to /${result.slug}.` };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Something went wrong." };
  }
}
