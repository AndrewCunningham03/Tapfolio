"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { submitEnquiry, type EnquiryState } from "./actions";
import { CONTACT_EMAIL } from "@/lib/site";
import styles from "./marketing.module.css";

const initial: EnquiryState = { status: "idle" };

export function OrderForm() {
  const [state, action, pending] = useActionState(submitEnquiry, initial);
  const tierRef = useRef<HTMLSelectElement>(null);

  // "Order Standard / Platinum" buttons elsewhere on the page preselect the tier.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const el = (e.target as HTMLElement).closest<HTMLElement>("[data-tier]");
      if (el?.dataset.tier && tierRef.current) tierRef.current.value = el.dataset.tier;
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  if (state.status === "ok") {
    return (
      <div className={`${styles.notice} ${styles.thanks}`} role="status">
        Thanks, we&apos;ve got your enquiry and will be in touch shortly.
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
          <label htmlFor="tier">Card</label>
          <select id="tier" name="tier" ref={tierRef} defaultValue="Standard">
            <option>Standard</option>
            <option>Platinum</option>
            <option>Not sure yet</option>
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
          <textarea id="msg" name="message" placeholder="Team size, design ideas, deadlines…" />
        </div>
        <div className={styles.full}>
          <button className={styles.btn} type="submit" disabled={pending}>
            {pending ? "Sending…" : "Send enquiry"}
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
