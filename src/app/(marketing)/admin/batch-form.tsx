"use client";

import { useState, useTransition } from "react";
import { makeCardBatch, type AdminResult } from "./actions";
import styles from "../marketing.module.css";

export function BatchForm({ max }: { max: number }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<(AdminResult & { batchId?: number }) | null>(null);

  return (
    <form
      className={styles.batchForm}
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const data = new FormData(form);
        start(async () => {
          const res = await makeCardBatch({
            metal: Number(data.get("metal") || 0),
            plastic: Number(data.get("plastic") || 0),
            label: String(data.get("label") ?? ""),
            supplier: String(data.get("supplier") ?? ""),
          });
          setResult(res);
          if (res.ok) form.reset();
        });
      }}
    >
      <label>
        Metal cards
        <input name="metal" type="number" inputMode="numeric" min={0} max={max} step={1} defaultValue={0} />
      </label>
      <label>
        Plastic cards
        <input name="plastic" type="number" inputMode="numeric" min={0} max={max} step={1} defaultValue={0} />
      </label>
      <label>
        Supplier <span className={styles.optional}>(optional)</span>
        <input name="supplier" maxLength={80} placeholder="e.g. Card Co" />
      </label>
      <label>
        Name for this batch <span className={styles.optional}>(optional)</span>
        <input name="label" maxLength={80} placeholder="e.g. January run" />
      </label>
      <div className={styles.batchSubmit}>
        <button type="submit" className={`${styles.btn} ${styles.btnSmall}`} disabled={pending}>
          {pending ? "Making links…" : "Make card links"}
        </button>
        {result && (
          <p className={result.ok ? styles.adminOk : styles.fieldError} role="status">
            {result.message}{" "}
            {result.batchId && (
              <a href={`/admin/batches/${result.batchId}/pack`} download>
                Download the supplier pack
              </a>
            )}
          </p>
        )}
      </div>
    </form>
  );
}
