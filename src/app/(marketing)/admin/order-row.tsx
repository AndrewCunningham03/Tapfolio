"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { FINISHES, LAYOUTS, type CardDesign } from "@/lib/card-design";
import type { CardOrder, OrderStatus } from "@/lib/orders";
import { CARD_URL_BASE, formatPrice } from "@/lib/site";
import { deliveryPrice } from "../countries";
import { CardBack, CardFront } from "../design/card-preview";
import { loadLogoFromUrl, makeMask, tint } from "../design/logo";
import { assignCard, makeCard, setOrderStatus, type AdminResult } from "./actions";
import styles from "../marketing.module.css";

const STATUS_LABELS: Record<OrderStatus, string> = {
  requested: "Requested",
  paid: "Paid",
  in_production: "In production",
  shipped: "Shipped",
  cancelled: "Cancelled",
};

type Card = { id: string; status: string; slug: string | null };

function download(svg: SVGSVGElement | null, filename: string) {
  if (!svg) return;
  const text = `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(svg)}`;
  const url = URL.createObjectURL(new Blob([text], { type: "image/svg+xml" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}

export function OrderRow({ order, logoUrl, card }: { order: CardOrder; logoUrl?: string; card?: Card }) {
  // Only orders from the (currently hidden) card designer carry a custom design.
  const design: CardDesign | null =
    order.finish && order.layout
      ? {
          finish: order.finish,
          layout: order.layout,
          name: order.name_on_card ?? "",
          title: order.title_on_card ?? "",
          backText: order.back_text ?? "",
          logoInvert: order.logo_invert,
        }
      : null;

  // Rebuild the engraving mask from the stored logo: tinted for the preview, black for production.
  const [logo, setLogo] = useState<{ preview: string; engrave: string } | null>(null);
  useEffect(() => {
    if (!logoUrl || !order.finish) return;
    const finish = order.finish;
    let cancelled = false;
    loadLogoFromUrl(logoUrl)
      .then((canvas) => {
        const mask = makeMask(canvas, order.logo_invert);
        if (!cancelled && mask) setLogo({ preview: tint(mask, FINISHES[finish].engrave), engrave: tint(mask, "#000000") });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [logoUrl, order.logo_invert, order.finish]);

  const [pending, start] = useTransition();
  const [result, setResult] = useState<AdminResult | null>(null);
  const [stockId, setStockId] = useState("");
  const run = (fn: () => Promise<AdminResult>) => start(async () => setResult(await fn()));

  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const cardUrl = card ? `${CARD_URL_BASE}${card.id}` : undefined;

  return (
    <article className={styles.orderRow}>
      <div className={styles.orderPreview}>
        {design ? (
          <>
            <CardFront design={design} logo={logo?.preview} />
            <CardBack design={design} qrUrl={cardUrl} />
          </>
        ) : (
          <div className={styles.stockCard}>
            <strong>Standard Tapfolio card</strong>
            <span>{card ? `Card ${card.id}` : "Pick one from stock"}</span>
          </div>
        )}
      </div>

      <div className={styles.orderInfo}>
        <div className={styles.orderTitle}>
          <h2>
            #{order.id} · {order.business || order.name}
          </h2>
          <span className={styles.statusPill} data-status={order.status}>
            {STATUS_LABELS[order.status]}
          </span>
        </div>
        <dl className={styles.orderFacts}>
          <div><dt>Customer</dt><dd>{order.name}</dd></div>
          <div><dt>Email</dt><dd><a href={`mailto:${order.email}`}>{order.email}</a></dd></div>
          {order.phone && <div><dt>Phone</dt><dd>{order.phone}</dd></div>}
          <div><dt>Deliver to</dt><dd>{order.country}</dd></div>
          <div>
            <dt>Card</dt>
            <dd>
              {design ? `${FINISHES[design.finish].label}, ${LAYOUTS[design.layout].label.toLowerCase()}` : "Standard"}
              {order.quantity && order.quantity !== "1" ? `, ×${order.quantity}` : ""}
            </dd>
          </div>
          <div>
            <dt>Price</dt>
            <dd>
              {Number(order.card_price) > 0 && `${formatPrice(Number(order.card_price), order.currency)} + `}
              {formatPrice(Number(order.monthly_price), order.currency)}/month
              {` + ${formatPrice(deliveryPrice(order.country, order.currency), order.currency)} delivery`}
            </dd>
          </div>
          <div><dt>Ordered</dt><dd>{new Date(order.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</dd></div>
          {order.message && <div className={styles.orderMessage}><dt>Message</dt><dd>{order.message}</dd></div>}
        </dl>

        <div className={styles.adminActions}>
          <label>
            <span className={styles.srOnly}>Status for order {order.id}</span>
            <select
              defaultValue={order.status}
              disabled={pending}
              onChange={(e) => run(() => setOrderStatus(order.id, e.target.value as OrderStatus))}
            >
              {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>

          {card ? (
            <>
              <a className={`${styles.btn} ${styles.ghost} ${styles.btnSmall}`} href={`/C/${card.id}`} target="_blank" rel="noopener">
                Test card {card.id}
              </a>
              {card.slug && (
                <a className={`${styles.btn} ${styles.ghost} ${styles.btnSmall}`} href={`/${card.slug}`} target="_blank" rel="noopener">
                  /{card.slug}
                </a>
              )}
              {design && (
                <>
                  <button type="button" className={`${styles.btn} ${styles.btnSmall}`} onClick={() => download(frontRef.current?.querySelector("svg") ?? null, `tapfolio-${order.id}-${card.id}-front.svg`)}>
                    Engraving: front
                  </button>
                  <button type="button" className={`${styles.btn} ${styles.btnSmall}`} onClick={() => download(backRef.current?.querySelector("svg") ?? null, `tapfolio-${order.id}-${card.id}-back.svg`)}>
                    Engraving: back
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              <form
                className={styles.assignForm}
                onSubmit={(e) => {
                  e.preventDefault();
                  run(() => assignCard(order.id, stockId));
                }}
              >
                <label>
                  <span className={styles.srOnly}>Card code for order {order.id}</span>
                  <input value={stockId} onChange={(e) => setStockId(e.target.value)} placeholder="Card code, e.g. 1WEP578" maxLength={20} required />
                </label>
                <button type="submit" className={`${styles.btn} ${styles.btnSmall}`} disabled={pending}>
                  {pending ? "Working…" : "Assign card + create account"}
                </button>
              </form>
              {design && (
                <button type="button" className={`${styles.btn} ${styles.ghost} ${styles.btnSmall}`} disabled={pending} onClick={() => run(() => makeCard(order.id))}>
                  Make a new custom card
                </button>
              )}
            </>
          )}
        </div>
        {result && (
          <p className={result.ok ? styles.adminOk : styles.fieldError} role="status">
            {result.message}
          </p>
        )}
      </div>

      {/* Production files: black = engrave, real size, the card's own QR code. */}
      {card && design && (
        <div hidden>
          <div ref={frontRef}>
            <CardFront design={design} logo={logo?.engrave} variant="engrave" />
          </div>
          <div ref={backRef}>
            <CardBack design={design} qrUrl={cardUrl} variant="engrave" />
          </div>
        </div>
      )}
    </article>
  );
}
