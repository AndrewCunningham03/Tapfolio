import Link from "next/link";
import styles from "../marketing.module.css";

/** Shared layout for the pages a card link can land on when it can't show a profile. */
export function CardNotice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={`${styles.wrap} ${styles.narrow} ${styles.legal}`}>
      <h1>{title}</h1>
      {children}
      <p>
        <Link className={styles.btn} href="/">
          Get your own Tapfolio card
        </Link>
      </p>
    </div>
  );
}
