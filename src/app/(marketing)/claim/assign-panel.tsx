"use client";

import { useState, useTransition } from "react";
import { assignScannedCard } from "./actions";
import styles from "../marketing.module.css";

export type WaitingOrder = { id: number; name: string; email: string; ordered: string; address: string[] };

/** Shown only to the owner after scanning an unused card: paid orders waiting for a card, oldest first. */
export function AssignPanel({ cardId, orders }: { cardId: string; orders: WaitingOrder[] }) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState<{ order: WaitingOrder; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function assign(order: WaitingOrder) {
    setError(null);
    start(async () => {
      const result = await assignScannedCard(order.id, cardId);
      if (result.ok) setDone({ order, message: result.message });
      else setError(result.message);
    });
  }

  if (done) {
    return (
      <div className={`${styles.notice} ${styles.thanks}`} role="status">
        <strong>{done.message}</strong>
        <p>Post this card to:</p>
        {done.order.address.map((line, i) => (
          <span key={i} className={styles.addressLine}>
            {line}
          </span>
        ))}
        <p>Then mark the order as shipped in the admin page.</p>
      </div>
    );
  }

  return (
    <div>
      <p>
        <strong>Card {cardId}</strong> is in stock. Paid orders waiting for a card, oldest first:
      </p>
      {orders.length === 0 && <p>No paid orders are waiting for a card.</p>}
      {orders.map((o) => (
        <div key={o.id} className={styles.waitingOrder}>
          <div>
            <strong>{o.name}</strong> · paid {o.ordered}
            <span className={styles.addressLine}>{o.email}</span>
            {o.address.map((line, i) => (
              <span key={i} className={styles.addressLine}>
                {line}
              </span>
            ))}
          </div>
          <button className={styles.btn} type="button" disabled={pending} onClick={() => assign(o)}>
            {pending ? "Assigning…" : `Assign to ${o.name}`}
          </button>
        </div>
      ))}
      {error && (
        <p className={`${styles.notice} ${styles.formError}`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
