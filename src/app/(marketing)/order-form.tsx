"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { CONTACT_EMAIL, formatPrice, PRICES } from "@/lib/site";
import { COUNTRIES, deliveryPrice, orderCurrency } from "./countries";
import { Price, useCurrency } from "./currency";
import { submitOrder, type OrderState } from "./order-actions";
import styles from "./marketing.module.css";

const initial: OrderState = { status: "idle" };

export function OrderForm() {
  const currency = useCurrency();
  const [country, setCountry] = useState("");
  const [state, action, pending] = useActionState(submitOrder, initial);
  // Once they pick where to deliver, show exactly what they'll pay, in that country's currency.
  const charged = orderCurrency(country, currency);

  if (state.status === "ok") {
    return (
      <div className={`${styles.notice} ${styles.thanks}`} role="status">
        <strong>Thanks, your order is in.</strong> We&apos;ll email you within one working day to take payment and set up
        your profile, then your card is on its way.
      </div>
    );
  }

  return (
    <>
      <form className={styles.form} action={action}>
        <input type="hidden" name="currency" value={currency} />
        <div className={styles.honeypot} aria-hidden="true">
          <label>
            Leave this empty <input name="company_url" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <div>
          <label htmlFor="name">Your name</label>
          <input id="name" name="name" required autoComplete="name" />
        </div>
        <div>
          <label htmlFor="business">Business name</label>
          <input id="business" name="business" autoComplete="organization" />
        </div>
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div>
          <label htmlFor="phone">Phone</label>
          <input id="phone" name="phone" type="tel" autoComplete="tel" />
        </div>
        <div>
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
        <div>
          <label htmlFor="qty">Number of cards</label>
          <select id="qty" name="quantity" defaultValue="1">
            <option>1</option>
            <option>2–5</option>
            <option>6–20</option>
            <option>21–50</option>
            <option>50+</option>
          </select>
        </div>
        <div className={styles.full}>
          <label htmlFor="msg">Anything else? (optional)</label>
          <textarea id="msg" name="message" placeholder="What your business does, team orders, anything we should know…" />
        </div>
        <div className={`${styles.full} ${styles.orderSummary}`}>
          <div>
            <strong>{formatPrice(PRICES[charged].monthly, charged)}</strong> a month, card included
            <span>
              {country ? (
                <>Plus {formatPrice(deliveryPrice(country, charged), charged)} delivery with your first month.</>
              ) : (
                <>
                  Plus delivery with your first month: <Price of="delivery" /> in the{" "}
                  {currency === "EUR" ? "Republic of Ireland" : "UK"}, <Price of="worldDelivery" /> elsewhere.
                </>
              )}{" "}
              Nothing to pay now. We email you a link to start your subscription. Cancel any time.
            </span>
          </div>
          <button className={styles.btn} type="submit" disabled={pending}>
            {pending ? "Sending…" : "Order my card"}
          </button>
        </div>
        <p className={`${styles.formNote} ${styles.full}`}>
          We only use your details to make and deliver your card. See our <Link href="/privacy">privacy policy</Link>.
        </p>
      </form>
      {state.status === "error" && (
        <div className={`${styles.notice} ${styles.formError}`} role="alert">
          {state.message ?? (
            <>
              Sorry, your order didn&apos;t send. Please try again, or email us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Card order")}`}>{CONTACT_EMAIL}</a>.
            </>
          )}
        </div>
      )}
    </>
  );
}
