"use client";

import { useActionState, useState } from "react";
import { formatPrice, PRICES } from "@/lib/site";
import { COUNTRIES, orderCurrency } from "../countries";
import { startCheckout, type StartState } from "./actions";
import styles from "../marketing.module.css";

const initial: StartState = {};

export function StartForm({ email }: { email: string }) {
  const [country, setCountry] = useState("");
  const [state, action, pending] = useActionState(startCheckout, initial);
  const currency = orderCurrency(country);

  return (
    <form className={styles.form} action={action}>
      <p className={`${styles.formNote} ${styles.full}`}>Signed in as {email}</p>
      <div className={styles.full}>
        <label htmlFor="country">Where should we deliver?</label>
        <select id="country" name="country" required value={country} onChange={(e) => setCountry(e.target.value)}>
          <option value="" disabled>
            Choose…
          </option>
          {COUNTRIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className={`${styles.full} ${styles.orderSummary}`}>
        <div>
          <strong>{formatPrice(PRICES[currency].start, currency)}</strong> to start
          <span>
            That covers your card, its delivery and your first month. After that it&apos;s{" "}
            {formatPrice(PRICES[currency].monthly, currency)} a month. Cancel any time.
          </span>
        </div>
        <button className={styles.btn} type="submit" disabled={pending}>
          {pending ? "Taking you to payment…" : "Continue to payment"}
        </button>
      </div>
      {state.message && (
        <p className={`${styles.notice} ${styles.formError} ${styles.full}`} role="alert">
          {state.message}
        </p>
      )}
    </form>
  );
}
