import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { listBatches, MAX_PER_MATERIAL, type BatchStock } from "@/lib/batches";
import type { CardOrder } from "@/lib/orders";
import { getAdminClient } from "@/lib/supabase/admin";
import { BatchForm } from "./batch-form";
import { OrderRow } from "./order-row";
import styles from "../marketing.module.css";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default function AdminPage() {
  return (
    <div className={`${styles.wrap} ${styles.adminPage}`}>
      <div className={styles.adminHead}>
        <div>
          <p className={styles.eyebrow}>Admin</p>
          <h1>Orders and stock</h1>
        </div>
        <form action="/auth/signout" method="post">
          <button className={`${styles.btn} ${styles.ghost} ${styles.btnSmall}`} type="submit">
            Sign out
          </button>
        </form>
      </div>

      <section className={styles.adminSection}>
        <h2 className={styles.dashSectionTitle}>Card stock</h2>
        <Suspense fallback={<p className={styles.sub}>Loading stock…</p>}>
          <Stock />
        </Suspense>
      </section>

      <section className={styles.adminSection}>
        <h2 className={styles.dashSectionTitle}>Card orders</h2>
        <Suspense fallback={<p className={styles.sub}>Loading orders…</p>}>
          <Orders />
        </Suspense>
      </section>
    </div>
  );
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

function madeOf(b: BatchStock): string {
  return [b.metal && `${b.metal} metal`, b.plastic && `${b.plastic} plastic`].filter(Boolean).join(" + ") || "No cards";
}

async function Stock() {
  await connection(); // always per request: private, live data
  await requireAdmin();
  const db = getAdminClient();
  if (!db) return <p className={styles.sub}>Supabase is not configured.</p>;

  let batches: BatchStock[];
  try {
    batches = await listBatches(db);
  } catch (err) {
    return <p className={styles.sub}>{err instanceof Error ? err.message : "Could not load card stock."}</p>;
  }
  const metal = batches.reduce((n, b) => n + b.metal_in_stock, 0);
  const plastic = batches.reduce((n, b) => n + b.plastic_in_stock, 0);

  return (
    <>
      <p className={styles.adminCounts}>
        <strong>{plural(metal + plastic, "blank card")} in stock</strong> ({metal} metal, {plastic} plastic). To order more,
        make the links here and send the supplier pack to your card supplier.
      </p>
      <BatchForm max={MAX_PER_MATERIAL} />

      {batches.length > 0 && (
        <div className={styles.batchList}>
          {batches.map((b) => (
            <article key={b.id} className={styles.batchRow}>
              <div>
                <h3>
                  Batch {b.id} · {b.label}
                </h3>
                <p>
                  {new Date(b.created_at).toLocaleDateString("en-GB", { dateStyle: "medium" })}
                  {b.supplier ? ` · ${b.supplier}` : ""} · {madeOf(b)}
                </p>
              </div>
              <p className={styles.batchCounts}>
                <span>
                  <strong>{b.metal_in_stock + b.plastic_in_stock}</strong> in stock
                </span>
                <span>
                  <strong>{b.assigned}</strong> assigned
                </span>
                {b.disabled > 0 && (
                  <span>
                    <strong>{b.disabled}</strong> disabled
                  </span>
                )}
              </p>
              <div className={styles.adminActions}>
                <a className={`${styles.btn} ${styles.btnSmall}`} href={`/admin/batches/${b.id}/pack`} download>
                  Supplier pack (.zip)
                </a>
                <a className={`${styles.btn} ${styles.ghost} ${styles.btnSmall}`} href={`/admin/batches/${b.id}/sheet`} download>
                  Excel sheet
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
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
  if (!orders.length) return <p className={styles.sub}>No orders yet. They appear here when someone orders a card.</p>;

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
