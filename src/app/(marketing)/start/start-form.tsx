"use client";

import { useActionState, useState } from "react";
import { formatPrice, PRICES } from "@/lib/site";
import { COUNTRIES, orderCurrency } from "../countries";
import { useCurrency } from "../currency";
import { OrderSteps } from "../order-steps";
import { startCheckout, type StartState } from "./actions";
import styles from "../marketing.module.css";

const initial: StartState = {};

export function StartForm({ email }: { email: string }) {
  const [country, setCountry] = useState("");
  const [state, action, pending] = useActionState(startCheckout, initial);
  // Until a country is chosen, show prices in the visitor's own currency.
  const visitorCurrency = useCurrency();
  const currency = country ? orderCurrency(country) : visitorCurrency;
  const price = (key: "start" | "monthly") => formatPrice(PRICES[currency][key], currency);

  return (
    <form className={styles.form} action={action}>
      <OrderSteps current={1} />
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
          <strong>{price("start")}</strong> to pay now
          <span>Covers your metal card, its delivery and your first month.</span>
          <span>Then {price("monthly")} a month. No contract, cancel any time.</span>
        </div>
        <button className={styles.btn} type="submit" disabled={pending}>
          {pending ? "Taking you to payment…" : "Continue to payment"}
        </button>
      </div>
      <p className={`${styles.formNote} ${styles.full}`}>
        Next you&apos;ll go to Stripe&apos;s secure checkout to add your delivery address and pay.
      </p>
      {state.message && (
        <p className={`${styles.notice} ${styles.formError} ${styles.full}`} role="alert">
          {state.message}
        </p>
      )}
    </form>
  );
}
