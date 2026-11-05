"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CONTACT_EMAIL } from "@/lib/site";
import ds from "./dashboard.module.css";
import styles from "../marketing.module.css";

/** One-off messages after coming back from Stripe. */
export function DashboardNotices() {
  const params = useSearchParams();
  if (params.get("ordered")) {
    return (
      <p className={`${styles.notice} ${styles.thanks}`} role="status">
        <strong>Payment received, thank you.</strong> We&apos;ll post your card to you shortly. While it&apos;s on its
        way, set up your page below: it&apos;s what people see when they tap or scan your card.
      </p>
    );
  }
  if (params.get("billing") === "unavailable") {
    return (
      <p className={`${styles.notice} ${styles.formError}`} role="alert">
        <strong>We couldn&apos;t open your billing page just now.</strong> Please try Manage billing again in a minute.
        If it still doesn&apos;t work, email us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    );
  }
  return null;
}

const CHECKS = 20; // every 3 seconds: about a minute

/**
 * Straight after paying, the page can arrive here a moment before the payment
 * confirmation creates the profile. Check again for a minute, instead of telling
 * someone who has just paid that they have no card.
 */
export function WaitForProfile({ children }: { children: React.ReactNode }) {
  const params = useSearchParams();
  const router = useRouter();
  const ordered = Boolean(params.get("ordered"));
  const [checks, setChecks] = useState(0);

  useEffect(() => {
    if (!ordered || checks >= CHECKS) return;
    const timer = setTimeout(() => {
      setChecks((n) => n + 1);
      router.refresh();
    }, 3000);
    return () => clearTimeout(timer);
  }, [ordered, checks, router]);

  if (!ordered) return children;
  return (
    <div className={`${styles.notice} ${styles.thanks} ${ds.wait}`} role="status">
      <p>
        <strong>Payment received, thank you.</strong>{" "}
        {checks < CHECKS
          ? "We're setting up your page now. It usually takes a few seconds, and this page will update by itself."
          : "Your page is taking longer than usual to set up."}
      </p>
      {checks >= CHECKS && (
        <p>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnSmall} ${ds.tap}`}
            onClick={() => router.refresh()}
          >
            Check again
          </button>{" "}
          If it still isn&apos;t here, email us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and
          we&apos;ll sort it out.
        </p>
      )}
    </div>
  );
}
