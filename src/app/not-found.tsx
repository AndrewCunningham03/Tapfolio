import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/site";
import { SiteShell } from "./(marketing)/site-shell";
import styles from "./(marketing)/marketing.module.css";

// Next.js adds noindex to not-found responses itself.
export const metadata: Metadata = { title: "Page not found" };

// Shown for any address that doesn't exist, including a mistyped profile page.
export default function NotFound() {
  return (
    <SiteShell>
      <div className={`${styles.wrap} ${styles.narrow} ${styles.legal} ${styles.oops}`}>
        <p className={styles.eyebrow}>Page not found</p>
        <h1>We couldn&apos;t find that page</h1>
        <p className={styles.sub}>
          If you typed a Tapfolio address, check the spelling: pages look like <strong>tapfolio.co.uk/your-name</strong>
          . If someone gave you their card, tap it on your phone or scan its QR code instead.
        </p>
        <div className={styles.ctaRow}>
          <Link className={styles.btn} href="/">
            Go to the homepage
          </Link>
          <Link className={`${styles.btn} ${styles.ghost}`} href="/start">
            Get your card
          </Link>
        </div>
        <p className={styles.contactLine}>
          Still stuck? Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </div>
    </SiteShell>
  );
}
