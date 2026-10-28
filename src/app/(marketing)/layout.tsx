import Link from "next/link";
import { Manrope } from "next/font/google";
import { CurrencyProvider, Price } from "./currency";
import { Wordmark } from "./wordmark";
import styles from "./marketing.module.css";

// Same typeface as the card artwork.
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });

export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <CurrencyProvider>
      <div className={`${styles.site} ${manrope.variable}`}>
        <header className={styles.header}>
          <div className={styles.wrap}>
            <Link className={styles.logo} href="/" aria-label="Tapfolio home">
              <Wordmark />
            </Link>
            <nav className={styles.nav} aria-label="Main">
              <Link href="/#how">How it works</Link>
              <Link href="/#paid">Get paid</Link>
              <Link href="/#pricing">Pricing</Link>
              <Link href="/#faq">FAQ</Link>
              <Link href="/login">Sign in</Link>
              <Link className={`${styles.btn} ${styles.btnSmall}`} href="/#order">
                Order · <Price of="monthly" />/month
              </Link>
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer className={styles.footer}>
          <div className={styles.wrap}>
            <Link className={styles.logo} href="/" aria-label="Tapfolio home">
              <Wordmark />
            </Link>
            <nav aria-label="Footer">
              <Link href="/#order">Contact</Link>
              <Link href="/privacy">Privacy</Link>
            </nav>
            <span>© Tapfolio · Northern Ireland</span>
          </div>
        </footer>
      </div>
    </CurrencyProvider>
  );
}
