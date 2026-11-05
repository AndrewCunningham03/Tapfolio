"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/site";
import { SiteShell } from "./(marketing)/site-shell";
import styles from "./(marketing)/marketing.module.css";

// Replaces any page that fails to load (the root layout itself is too simple to fail).
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  // Server errors carry a reference that matches the server logs.
  const digest = error instanceof Error && "digest" in error ? String(error.digest) : null;

  return (
    <SiteShell>
      <title>Something went wrong · Tapfolio</title>
      <div className={`${styles.wrap} ${styles.narrow} ${styles.legal} ${styles.oops}`}>
        <p className={styles.eyebrow}>Sorry</p>
        <h1>Something went wrong</h1>
        <p className={styles.sub}>
          This page didn&apos;t load properly. It&apos;s usually a passing problem, so please try again.
        </p>
        <div className={styles.ctaRow}>
          <button className={styles.btn} type="button" onClick={() => retry()}>
            Try again
          </button>
          <Link className={`${styles.btn} ${styles.ghost}`} href="/">
            Go to the homepage
          </Link>
        </div>
        <p className={styles.contactLine}>
          If it keeps happening, email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          {digest && (
            <>
              {" "}
              and quote <code>{digest}</code>
            </>
          )}
          .
        </p>
      </div>
    </SiteShell>
  );
}
