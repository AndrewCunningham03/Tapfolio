import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth";
import type { CardOrder } from "@/lib/orders";
import { getAdminClient } from "@/lib/supabase/admin";
import { OrderRow } from "./order-row";
import styles from "../marketing.module.css";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default function AdminPage() {
  return (
    <div className={`${styles.wrap} ${styles.adminPage}`}>
      <div className={styles.adminHead}>
        <div>
          <p className={styles.eyebrow}>Admin</p>
          <h1>Card orders</h1>
        </div>
        <form action="/auth/signout" method="post">
          <button className={`${styles.btn} ${styles.ghost} ${styles.btnSmall}`} type="submit">
            Sign out
          </button>
        </form>
      </div>
      <Suspense fallback={<p className={styles.sub}>Loading orders…</p>}>
        <Orders />
      </Suspense>
    </div>
  );
}

async function Orders() {
  await connection(); // always per request: private, live data
  await requireAdmin();
  const db = getAdminClient();
  if (!db) return <p className={styles.sub}>Supabase is not configured.</p>;

  const { data, error } = await db.from("card_orders").select("*").order("created_at", { ascending: false }).limit(200);
  if (error) return <p className={styles.sub}>Could not load orders: {error.message}</p>;
  const orders = (data ?? []) as CardOrder[];
  if (!orders.length) return <p className={styles.sub}>No orders yet. They appear here when someone uses the card designer.</p>;

  // Logos are private: hand the browser short-lived links.
  const paths = orders.map((o) => o.logo_path).filter((p): p is string => Boolean(p));
  const signed = paths.length ? (await db.storage.from("card-logos").createSignedUrls(paths, 3600)).data ?? [] : [];
  const logoUrls = Object.fromEntries(signed.filter((s) => s.signedUrl).map((s) => [s.path, s.signedUrl]));

  const cardIds = orders.map((o) => o.card_id).filter((c): c is string => Boolean(c));
  const { data: cards } = cardIds.length
    ? await db.from("cards").select("id, status, profiles(slug)").in("id", cardIds).returns<{ id: string; status: string; profiles: { slug: string } | null }[]>()
    : { data: [] };
  const cardById = Object.fromEntries((cards ?? []).map((c) => [c.id, { id: c.id, status: c.status, slug: c.profiles?.slug ?? null }]));

  const counts = orders.reduce<Record<string, number>>((acc, o) => ({ ...acc, [o.status]: (acc[o.status] ?? 0) + 1 }), {});

  return (
    <>
      <p className={styles.adminCounts}>
        {Object.entries(counts)
          .map(([status, n]) => `${n} ${status.replace("_", " ")}`)
          .join(" · ")}
      </p>
      <div className={styles.adminList}>
        {orders.map((order) => (
          <OrderRow
            key={order.id}
            order={order}
            logoUrl={order.logo_path ? logoUrls[order.logo_path] : undefined}
            card={order.card_id ? cardById[order.card_id] : undefined}
          />
        ))}
      </div>
    </>
  );
}
