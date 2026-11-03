import Link from "next/link";
import { Manrope } from "next/font/google";
import { CONTACT_EMAIL } from "@/lib/site";
import { CurrencyProvider } from "./currency";
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
              <Link href="/#pricing">Pricing</Link>
              <Link href="/#faq">FAQ</Link>
              <Link className={styles.navKeep} href="/login">
                Sign in
              </Link>
              <Link className={`${styles.btn} ${styles.btnSmall}`} href="/start">
                Get your card
              </Link>
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer className={styles.footer}>
          <div className={styles.wrap}>
            <div className={styles.footerGrid}>
              <div className={styles.footerBrand}>
                <Link className={styles.logo} href="/" aria-label="Tapfolio home">
                  <Wordmark />
                </Link>
                <p>A business card you tap or scan that opens your own page. Made in Northern Ireland.</p>
              </div>
              <nav aria-label="Footer: product">
                <h2>Tapfolio</h2>
                <ul>
                  <li>
                    <Link href="/#how">How it works</Link>
                  </li>
                  <li>
                    <Link href="/#pricing">Pricing</Link>
                  </li>
                  <li>
                    <Link href="/#faq">FAQ</Link>
                  </li>
                </ul>
              </nav>
              <nav aria-label="Footer: account">
                <h2>Your card</h2>
                <ul>
                  <li>
                    <Link href="/start">Get your card</Link>
                  </li>
                  <li>
                    <Link href="/login">Sign in</Link>
                  </li>
                </ul>
              </nav>
              <nav aria-label="Footer: company">
                <h2>Company</h2>
                <ul>
                  <li>
                    <a href={`mailto:${CONTACT_EMAIL}`}>Contact</a>
                  </li>
                  <li>
                    <Link href="/privacy">Privacy</Link>
                  </li>
                  <li>
                    <Link href="/terms">Terms</Link>
                  </li>
                </ul>
              </nav>
            </div>
            <div className={styles.footerBase}>
              <span>© Tapfolio · Northern Ireland</span>
              <span>Cards posted by Royal Mail to the UK and Ireland.</span>
            </div>
          </div>
        </footer>
      </div>
    </CurrencyProvider>
  );
}
