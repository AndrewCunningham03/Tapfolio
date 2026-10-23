import Link from "next/link";
import styles from "./marketing.module.css";

export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <div className={styles.site}>
      <header className={styles.header}>
        <div className={styles.wrap}>
          <Link className={styles.logo} href="/">
            Tap<span>folio</span>
          </Link>
          <nav className={styles.nav}>
            <Link href="/#how">How it works</Link>
            <Link href="/#cards">Cards</Link>
            <Link href="/#faq">FAQ</Link>
            <Link className={styles.btn} href="/#order">
              Order
            </Link>
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <footer className={styles.footer}>
        <div className={styles.wrap}>
          <span>© Tapfolio</span>
          <span>
            <Link href="/#order">Contact</Link> · <Link href="/privacy">Privacy</Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
