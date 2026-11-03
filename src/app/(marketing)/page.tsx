import Link from "next/link";
import { CONTACT_EMAIL, GRACE_DAYS } from "@/lib/site";
import { CardShowcase } from "./card-showcase";
import { CurrencySwitch, Price } from "./currency";
import styles from "./marketing.module.css";

const TRADES = [
  "Window cleaners",
  "Plumbers",
  "Electricians",
  "Barbers",
  "Salons",
  "Mechanics",
  "Kitchen fitters",
  "Estate agents",
  "Personal trainers",
  "Dog groomers",
  "Cleaners",
  "Builders",
  "Photographers",
];

const STEPS = [
  {
    title: "Hand over your card",
    text: "Give it to a customer or keep it in your wallet. The chip and QR code inside hold a permanent link to your page.",
  },
  {
    title: "They tap or scan",
    text: "They hold it to the top of their phone, or scan the QR code on the back with the camera. Your page opens. No app needed.",
  },
  {
    title: "They save you or pay you",
    text: "One button adds you to their contacts. Others call, text, email, find you on the map, or pay you.",
  },
];

const FEATURES = [
  {
    title: "A Tapfolio card",
    text: "A standard Tapfolio-branded card with a tap chip and a QR code, in metal or plastic. Posted by Royal Mail.",
  },
  {
    title: "Your own page",
    text: "Your name, photo or logo, cover photo, about text, social links and a gallery of photos and videos. Six colour themes, or pick your own colour.",
  },
  {
    title: "Edit it from your phone",
    text: "Change your number, prices or photos whenever you like. The page updates straight away and the card never needs reprinting.",
  },
  {
    title: "See who taps",
    text: "Your dashboard shows taps in the last 30 days, taps in total, and how many people saved your contact.",
  },
  {
    title: "Get paid, 0% commission",
    text: "Add Revolut, PayPal, Monzo, a card payment link and your bank details, with copy buttons. Customers pay you directly. We never touch the money.",
  },
];

const ORDER_STEPS = [
  { title: "Sign in with Google", text: "No password to set up." },
  { title: "Choose where it's going", text: "Northern Ireland, Great Britain or the Republic of Ireland." },
  { title: "Pay securely", text: "Checkout is handled by Stripe. Your card is posted by Royal Mail." },
  { title: "Set up your page", text: "Add your details and photos while your card is on its way." },
];

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: "What does it cost?",
    a: (
      <>
        <Price of="start" /> to start, which covers your card, its delivery and your first month. After that it&apos;s{" "}
        <Price of="monthly" /> a month. No contract: cancel whenever you like, and your card simply stops showing your
        page.
      </>
    ),
  },
  {
    q: "Is the card metal or plastic?",
    a: "You get a standard Tapfolio card, in metal or plastic. Both have the same tap chip and QR code, and both work the same way. The chip is built in, so it reads through metal too. Hold the card near the top of the phone.",
  },
  {
    q: "Do people need an app to use it?",
    a: "No. Most iPhones and Android phones read the card with a tap. Phones that can't scan the QR code on the back with their camera instead.",
  },
  {
    q: "Can I make the page my own?",
    a: "Yes. Choose a colour theme or your own colour, add your logo, a cover photo, and photos and videos of your work from your dashboard. Change them whenever you like.",
  },
  {
    q: "Do you take a cut when customers pay me?",
    a: "No. The payment buttons take your customer straight to your own Revolut, PayPal, Monzo or card payment page, or show your bank details. The money goes directly to you. We never touch it.",
  },
  {
    q: "What happens if I stop paying?",
    a: `We'll remind you before anything changes. If a payment fails, your card keeps working for ${GRACE_DAYS} days. After that it pauses until you restart, and your details are kept, so it comes back exactly as it was.`,
  },
  {
    q: "What if my number or prices change?",
    a: "Change your details online and they update straight away. The card itself never needs reprinting.",
  },
  {
    q: "Where do you deliver?",
    a: "Northern Ireland, Great Britain and the Republic of Ireland. We post every card by Royal Mail, and delivery is included in your first payment.",
  },
  {
    q: "Can I get cards for my whole team?",
    a: "Yes. Each person gets their own card and profile. Email us with how many you need and we'll set them all up.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className={styles.hero}>
        <div className={`${styles.wrap} ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            <span className={styles.kicker}>NFC and QR business cards for the UK and Ireland</span>
            <h1>
              A business card that opens <span className={styles.accentText}>your own page.</span>
            </h1>
            <p className={styles.lede}>
              Tap the card on a phone, or scan its QR code, and your page opens. Customers can save your contact, call
              you, or pay you. They don&apos;t need an app.
            </p>
            <div className={styles.ctaRow}>
              <Link className={`${styles.btn} ${styles.btnLg}`} href="/start">
                Get your card
              </Link>
              <Link className={`${styles.btn} ${styles.btnLg} ${styles.ghost}`} href="#how">
                See how it works
              </Link>
            </div>
            <p className={styles.priceNote}>
              <strong>
                <Price of="start" /> to start
              </strong>{" "}
              for the card, delivery and first month. Then <Price of="monthly" /> a month. Cancel any time.
            </p>
          </div>
          <div className={styles.heroDemo}>
            <div className={styles.phone}>
              <div className={styles.screen}>
                <iframe src="/ash-and-oak-interiors" title="An example Tapfolio profile page" loading="eager" />
              </div>
            </div>
            <p className={styles.phoneCaption}>An example page. Scroll it and try the buttons.</p>
          </div>
        </div>
        <div className={`${styles.wrap} ${styles.facts}`}>
          <ul>
            <li>Tap or scan, no app</li>
            <li>iPhone and Android</li>
            <li>Save contact, call, pay</li>
            <li>0% commission on payments</li>
            <li>No contract</li>
          </ul>
        </div>
      </section>

      <section id="how" className={styles.section}>
        <div className={styles.wrap}>
          <div className={styles.head}>
            <p className={styles.eyebrow}>How it works</p>
            <h2>Hand it over. They tap. You&apos;re in their phone.</h2>
            <p className={styles.sub}>Three steps, and none of them needs your customer to install anything.</p>
          </div>
          <ol className={styles.stepGrid}>
            {STEPS.map((step, i) => (
              <li key={step.title}>
                <span className={styles.stepNum} aria-hidden="true">
                  {i + 1}
                </span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="features" className={`${styles.section} ${styles.band}`}>
        <div className={`${styles.wrap} ${styles.featureGrid}`}>
          <div className={styles.featureVisual}>
            <p className={styles.eyebrow}>What you get</p>
            <h2>One card. One page. Always up to date.</h2>
            <CardShowcase />
          </div>
          <ul className={styles.featureList}>
            {FEATURES.map((f) => (
              <li key={f.title}>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.wrap}>
          <div className={styles.head}>
            <p className={styles.eyebrow}>Who it&apos;s for</p>
            <h2>Made for people who are out on the job.</h2>
            <p className={styles.sub}>
              If customers find you by word of mouth, on site or at the counter, a Tapfolio card saves them hunting for
              your number. Built in Northern Ireland for small businesses across the UK and Ireland.
            </p>
          </div>
          <ul className={styles.trades}>
            {TRADES.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      </section>

      <section id="pricing" className={`${styles.section} ${styles.band}`}>
        <div className={styles.wrap}>
          <div className={styles.head}>
            <p className={styles.eyebrow}>Pricing</p>
            <h2>One card. One simple price.</h2>
            <p className={styles.sub}>
              Pay once to get started, then a small monthly fee to keep your page live. Available in the UK and Ireland.
            </p>
          </div>
          <CurrencySwitch />
          <div className={styles.priceCard}>
            <div className={styles.priceMain}>
              <p className={styles.priceLabel}>To start</p>
              <div className={styles.priceBig}>
                <Price of="start" />
              </div>
              <p className={styles.priceThen}>
                Then <Price of="monthly" /> a month
              </p>
              <p className={styles.priceSmall}>No contract. Cancel any time.</p>
              <Link className={`${styles.btn} ${styles.btnLg}`} href="/start">
                Get your card
              </Link>
            </div>
            <div className={styles.priceDetail}>
              <div>
                <h3>Your first payment covers</h3>
                <ul className={styles.includes}>
                  <li>Your Tapfolio card, in metal or plastic</li>
                  <li>Delivery by Royal Mail</li>
                  <li>Your first month of Tapfolio</li>
                </ul>
              </div>
              <div>
                <h3>After that, every month</h3>
                <ul className={styles.includes}>
                  <li>
                    <Price of="monthly" /> keeps your page and card live
                  </li>
                  <li>Edit your page as often as you like</li>
                  <li>Tap stats and pay buttons included</li>
                  <li>0% commission. Payments go straight to you</li>
                </ul>
              </div>
              <p className={styles.terms}>
                If a payment fails we&apos;ll remind you, and your card keeps working for {GRACE_DAYS} days. After that
                it pauses, and your details are kept. Prices are in pounds for the UK and euro for Ireland.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="order" className={styles.section}>
        <div className={styles.wrap}>
          <div className={styles.head}>
            <p className={styles.eyebrow}>Ordering</p>
            <h2>From order to first tap in four steps.</h2>
          </div>
          <ol className={`${styles.stepGrid} ${styles.stepGrid4}`}>
            {ORDER_STEPS.map((step, i) => (
              <li key={step.title}>
                <span className={styles.stepNum} aria-hidden="true">
                  {i + 1}
                </span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="faq" className={`${styles.section} ${styles.band}`}>
        <div className={`${styles.wrap} ${styles.faqGrid}`}>
          <div>
            <p className={styles.eyebrow}>Questions</p>
            <h2>Good to know.</h2>
            <p className={styles.sub}>
              Something else? Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>
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

      <section className={styles.section}>
        <div className={styles.wrap}>
          <div className={styles.finalCta}>
            <h2>Get your card.</h2>
            <p className={styles.sub}>
              <Price of="start" /> to start, then <Price of="monthly" /> a month. Set up your page while your card is on
              its way.
            </p>
            <div className={styles.ctaRow}>
              <Link className={`${styles.btn} ${styles.btnLg}`} href="/start">
                Get your card
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
