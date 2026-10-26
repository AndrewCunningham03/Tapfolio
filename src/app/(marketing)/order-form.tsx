"use client";

import Link from "next/link";
import { useActionState } from "react";
import { submitEnquiry, type EnquiryState } from "./actions";
import { COUNTRIES } from "./countries";
import { CONTACT_EMAIL } from "@/lib/site";
import styles from "./marketing.module.css";

const initial: EnquiryState = { status: "idle" };

export function OrderForm() {
  const [state, action, pending] = useActionState(submitEnquiry, initial);

  if (state.status === "ok") {
    return (
      <div className={`${styles.notice} ${styles.thanks}`} role="status">
        Thanks, we&apos;ve got your order request and will be in touch within one working day.
      </div>
    );
  }

  return (
    <>
      <form className={styles.form} action={action}>
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
          <select id="country" name="country" required defaultValue="">
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
          <label htmlFor="msg">Anything else?</label>
          <textarea id="msg" name="message" placeholder="What your business does, team size, anything we should know…" />
        </div>
        <div className={styles.full}>
          <button className={styles.btn} type="submit" disabled={pending}>
            {pending ? "Sending…" : "Request my card"}
          </button>
        </div>
        <p className={`${styles.formNote} ${styles.full}`}>
          We only use your details to reply to this enquiry. See our <Link href="/privacy">privacy policy</Link>.
        </p>
      </form>
      {state.status === "error" && (
        <div className={`${styles.notice} ${styles.formError}`} role="alert">
          {state.message ?? (
            <>
              Sorry, your enquiry didn&apos;t send. Please try again, or email us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Card enquiry")}`}>{CONTACT_EMAIL}</a>.
            </>
          )}
        </div>
      )}
    </>
  );
}
