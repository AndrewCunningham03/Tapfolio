"use client";

import { useSearchParams } from "next/navigation";
import styles from "../marketing.module.css";

/** One-off messages after coming back from Stripe. */
export function DashboardNotices() {
  const params = useSearchParams();
  if (params.get("ordered")) {
    return (
      <p className={`${styles.notice} ${styles.thanks}`} role="status">
        <strong>Payment received, thank you.</strong> We&apos;ll post your card shortly. While it&apos;s on its way, set
        up your page below: it&apos;s what people see when they tap your card.
      </p>
    );
  }
  if (params.get("billing") === "unavailable") {
    return (
      <p className={`${styles.notice} ${styles.formError}`} role="alert">
        Your billing page isn&apos;t available just now. Please try again, or email us.
      </p>
    );
  }
  return null;
}
