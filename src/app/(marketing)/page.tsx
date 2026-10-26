import Link from "next/link";
import { GRACE_DAYS } from "@/lib/site";
import { CardShowcase } from "./card-showcase";
import { CurrencySwitch, Price } from "./currency";
import { OrderForm } from "./order-form";
import styles from "./marketing.module.css";

const TRADES = [
  "Window cleaners",
  "Plumbers",
  "Electricians",
  "Barbers",
  "Salons",
  "Mechanics",
  "Estate agents",
  "Personal trainers",
  "Dog groomers",
  "Cleaners",
  "Builders",
  "Photographers",
];

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: "What does it cost?",
    a: (
      <>
        <Price of="card" /> for the metal card, then <Price of="monthly" /> a month to keep your profile live. No
        contract: cancel whenever you like.
      </>
    ),
  },
  {
    q: "What happens if I stop paying?",
    a: `We'll remind you before anything changes. If a payment fails, your card keeps working for ${GRACE_DAYS} days. After that it pauses until you restart, and your details are kept, so it comes back exactly as it was.`,
  },
  {
    q: "Do you take a cut when customers pay me?",
    a: "No. The payment buttons take your customer straight to your own Revolut, PayPal, Monzo or card payment page, or show your bank details. The money goes directly to you. We never touch it.",
  },
  {
    q: "Do people need an app to use it?",
    a: "No. Most iPhones and Android phones read the card with a tap. Phones that can't scan the QR code on the back with their camera instead.",
  },
  {
    q: "Does a metal card really work with phones?",
    a: "Yes. The chip is built into the card so it can be read through the metal. Hold it near the top of the phone.",
  },
  {
    q: "What if my number or prices change?",
    a: "Change your details online and they update straight away. The card itself never needs reprinting.",
  },
  {
    q: "Do you deliver to Ireland and the UK?",
    a: "Yes, across Northern Ireland, Great Britain and the Republic of Ireland, with prices in sterling or euro.",
  },
  {
    q: "Can I get cards for my whole team?",
    a: "Yes. Each person gets their own card and profile. Use the form below and tell us how many you need.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className={styles.hero}>
        <div className={`${styles.wrap} ${styles.heroGrid}`}>
          <div>
            <span className={styles.kicker}>Solid metal NFC business card</span>
            <h1>
              The last business card <span className={styles.metalText}>you&apos;ll ever buy.</span>
            </h1>
            <p className={styles.lede}>
              Tap it on any phone and your details come up, ready to save, call, or pay you. Change your number or
              prices whenever you like. The card never needs reprinting.
            </p>
            <div className={styles.ctaRow}>
              <Link className={styles.btn} href="#order">
                Order your card · <Price of="card" />
              </Link>
              <Link className={`${styles.btn} ${styles.ghost}`} href="#how">
                See how it works
              </Link>
            </div>
            <p className={styles.priceNote}>
              <strong>
                <Price of="card" /> card
              </strong>
              , then <Price of="monthly" /> a month. Cancel any time.
            </p>
          </div>
          <CardShowcase />
        </div>
        <div className={`${styles.wrap} ${styles.facts}`}>
          <ul>
            <li>Stainless steel</li>
            <li>Tap or scan, no app</li>
            <li>Works on iPhone and Android</li>
            <li>Take payments</li>
            <li>UK and Ireland</li>
          </ul>
        </div>
      </section>

      <section id="how" className={styles.section}>
        <div className={`${styles.wrap} ${styles.how}`}>
          <div>
            <div className={styles.phone}>
              <div className={styles.screen}>
                <iframe src="/john-smith" title="A live example Tapfolio profile" loading="lazy" />
              </div>
            </div>
            <p className={styles.phoneCaption}>A real profile. Scroll it.</p>
          </div>
          <div>
            <p className={styles.eyebrow}>How it works</p>
            <h2>Hand it over. They tap. You&apos;re in their phone.</h2>
            <p className={styles.sub}>No fumbling for a pen, no card that ends up in a drawer.</p>
            <ol className={styles.steps}>
              <li>
                <span className={styles.stepNum}>01</span>
                <div>
                  <h3>Tap</h3>
                  <p>They hold your card to their phone, or scan the code on the back. Your page opens instantly.</p>
                </div>
              </li>
              <li>
                <span className={styles.stepNum}>02</span>
                <div>
                  <h3>Save</h3>
                  <p>One button puts your name, number, email and address straight into their contacts.</p>
                </div>
              </li>
              <li>
                <span className={styles.stepNum}>03</span>
                <div>
                  <h3>Get paid</h3>
                  <p>Finished the job? They can pay you there and then, by Revolut, PayPal, card or bank transfer.</p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section id="paid" className={`${styles.section} ${styles.paid}`}>
        <div className={`${styles.wrap} ${styles.paidGrid}`}>
          <div>
            <p className={styles.eyebrow}>Get paid</p>
            <h2>Your card is now how customers pay you.</h2>
            <p className={styles.sub}>
              Add your Revolut, PayPal or Monzo link, a card payment link from SumUp or Stripe, and your bank details.
              Customers pay you in a couple of taps, with nothing to type out or get wrong.
            </p>
            <div className={styles.zero}>
              <strong>0%</strong>
              <span>commission. The money goes straight to you.</span>
            </div>
          </div>
          <div className={styles.payPanel} aria-hidden="true">
            <h3>Pay Smith Plumbing &amp; Heating</h3>
            <div className={styles.payMethods}>
              <span>Revolut</span>
              <span>PayPal</span>
              <span>Monzo</span>
              <span>Pay by card</span>
              <span>Bank transfer</span>
            </div>
            <div className={styles.payBank}>
              <div>
                Sort code <b>00-00-00</b>
              </div>
              <div>
                Account <b>12345678</b>
              </div>
              <div>
                IBAN <b>IE29 AIBK 9311 …</b>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.wrap}>
          <p className={styles.eyebrow}>Who it&apos;s for</p>
          <h2>Made for people who are out on the job.</h2>
          <p className={styles.sub}>Built in Northern Ireland for small businesses across the UK and Ireland.</p>
          <ul className={styles.trades}>
            {TRADES.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      </section>

      <section id="pricing" className={styles.section}>
        <div className={styles.wrap}>
          <p className={styles.eyebrow}>Pricing</p>
          <h2>One card. One simple price.</h2>
          <CurrencySwitch />
          <div className={styles.priceCard}>
            <div className={styles.priceMain}>
              <div className={styles.priceBig}>
                <Price of="card" />
              </div>
              <p className={styles.priceThen}>
                then <Price of="monthly" /> a month
              </p>
              <p className={styles.priceSmall}>For the metal card, then your live profile. Cancel any time.</p>
              <Link className={styles.btn} href="#order">
                Order your card
              </Link>
            </div>
            <ul className={styles.includes}>
              <li>Solid stainless steel card, laser engraved</li>
              <li>Tap-to-share chip and a QR code on the back</li>
              <li>Your own profile page with Save contact</li>
              <li>Pay buttons: Revolut, PayPal, Monzo, card and bank transfer</li>
              <li>Change your details any time, live instantly</li>
              <li>See how often your card is tapped</li>
            </ul>
          </div>
          <p className={styles.terms}>
            Prices include everything above. If a payment fails we&apos;ll remind you, and your card keeps working for{" "}
            {GRACE_DAYS} days.
          </p>
        </div>
      </section>

      <section id="faq" className={`${styles.section} ${styles.paid}`}>
        <div className={`${styles.wrap} ${styles.faqGrid}`}>
          <div>
            <p className={styles.eyebrow}>Questions</p>
            <h2>Good to know.</h2>
          </div>
          <div className={styles.faq}>
            {FAQ.map(({ q, a }) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section id="order" className={styles.section}>
        <div className={`${styles.wrap} ${styles.orderGrid}`}>
          <div>
            <p className={styles.eyebrow}>Order</p>
            <h2>Get your card.</h2>
            <p className={styles.sub}>
              Tell us where to send it. We&apos;ll be in touch within one working day to set up your profile and take
              payment.
            </p>
          </div>
          <OrderForm />
        </div>
      </section>
    </>
  );
}
