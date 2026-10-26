import Link from "next/link";
import { CurrencySwitch, Price } from "./currency";
import { OrderForm } from "./order-form";
import styles from "./marketing.module.css";

function NfcIcon() {
  return (
    <svg className={styles.nfc} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 8.5a6 6 0 0 1 0 7" />
      <path d="M10 6a10 10 0 0 1 0 12" />
      <path d="M14 3.5a14 14 0 0 1 0 17" />
    </svg>
  );
}

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: "Is there a monthly fee?",
    a: (
      <>
        No. Your card and profile page are included in the one-off price and keep working for good. Pro is an
        optional extra at <Price of="proMonthly" /> a month or <Price of="proYearly" /> a year. If you cancel it, your
        card keeps working with your basic profile.
      </>
    ),
  },
  {
    q: "Do you deliver to Ireland and the UK?",
    a: "Yes. We deliver across Ireland, Northern Ireland and Great Britain, with prices in euro or sterling.",
  },
  {
    q: "Do people need an app?",
    a: "No. Most modern iPhones and Android phones read NFC cards straight away. Phones without NFC can scan the QR code with the camera.",
  },
  {
    q: "What if my phone number or job changes?",
    a: "Log in and update your details. The change goes live straight away, so your cards keep working and never need reprinting.",
  },
  {
    q: "Can I order cards for my whole team?",
    a: "Yes. Each person gets their own card and profile page. Get in touch with the number of cards you need and we'll send a quote.",
  },
  {
    q: "Does the metal card really work?",
    a: "Yes. Platinum cards are built so the chip can still be read through the metal, and we test them on iPhone and Android before sending.",
  },
];

export default function HomePage() {
  return (
    <>
      <div className={styles.hero}>
        <div className={styles.wrap}>
          <div>
            <div className={styles.eyebrow}>NFC + QR business cards</div>
            <h1>
              One tap. <em>Contact saved.</em>
            </h1>
            <p className={styles.lede}>
              Tap your card on any phone and your profile opens straight away, with a button to save your details to
              their contacts. No app needed. Change your details whenever you like and the same card keeps working.
            </p>
            <div className={styles.ctaRow}>
              <Link className={styles.btn} href="#order">
                Order your cards
              </Link>
              <Link className={`${styles.btn} ${styles.ghost}`} href="/john-smith">
                See an example profile
              </Link>
            </div>
            <p className={styles.heroNote}>
              <strong>
                From <Price of="standard" />, paid once.
              </strong>{" "}
              Your profile is free forever. No app, no contract.
            </p>
          </div>
          <div className={styles.cardStack} aria-hidden="true">
            <div className={`${styles.mock} ${styles.mockStandard}`}>
              <div className={styles.mockRow}>
                <span className={styles.mockBrand}>Smith Plumbing</span>
                <NfcIcon />
              </div>
              <div className={styles.mockRow}>
                <span className={styles.mockWho}>
                  John Smith
                  <br />
                  Tap or scan
                </span>
                <span className={styles.qr} />
              </div>
            </div>
            <div className={`${styles.mock} ${styles.mockPlatinum}`}>
              <div className={styles.mockRow}>
                <span className={styles.mockBrand}>Platinum</span>
                <NfcIcon />
              </div>
              <div className={styles.mockRow}>
                <span className={styles.mockWho}>
                  Metal finish
                  <br />
                  Tap or scan
                </span>
                <span className={styles.qr} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <section id="how" className={`${styles.section} ${styles.alt}`}>
        <div className={styles.wrap}>
          <h2>How it works</h2>
          <p className={styles.sub}>
            Every card links to your own page, at an address that never changes. The card stays the same, and you can
            change what&apos;s on the page whenever you like.
          </p>
          <div className={styles.steps}>
            <div className={styles.step}>
              <div className={styles.stepNum}>1</div>
              <h3>Activate your card</h3>
              <p>Scan the activation code that comes with your card, create an account and add your details. Your card goes live straight away.</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNum}>2</div>
              <h3>Tap or scan</h3>
              <p>Hold the card near a phone, or let them scan the QR code on the front. Your profile opens in their browser.</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNum}>3</div>
              <h3>Saved to their phone</h3>
              <p>One button adds your name, number, email, website and address to their contacts. Update your details online any time.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="cards" className={styles.section}>
        <div className={styles.wrap}>
          <h2>Choose your card</h2>
          <p className={styles.sub}>
            Both cards include design, setup, your profile page, a QR code for phones without NFC, and unlimited
            updates to your details.
          </p>
          <div className={styles.promise}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <p>
              <strong>Your card works forever.</strong> Pay once and your profile stays live, with no monthly fee to
              keep it working.
            </p>
          </div>
          <CurrencySwitch />
          <div className={styles.tiers}>
            <div className={styles.tier}>
              <span className={styles.tag}>Standard</span>
              <h3>Tapfolio Card</h3>
              <div className={styles.price}>
                <strong>
                  <Price of="standard" />
                </strong>{" "}
                per card, one-off
                <small>Includes setup and your profile, free forever</small>
              </div>
              <ul>
                <li>Printed PVC card, standard bank-card size</li>
                <li>Built-in NFC chip and printed QR code</li>
                <li>Your logo and branding, full colour</li>
                <li>Profile page with a Save contact button</li>
                <li>Edit your details online any time</li>
              </ul>
              <a className={styles.btn} href="#order" data-tier="Standard">
                Order Standard
              </a>
            </div>
            <div className={`${styles.tier} ${styles.premium}`}>
              <span className={styles.tag}>Platinum</span>
              <h3>Tapfolio Platinum</h3>
              <div className={styles.price}>
                <strong>
                  <Price of="platinum" />
                </strong>{" "}
                per card, one-off
                <small>Includes setup and your profile, free forever</small>
              </div>
              <ul>
                <li>Premium metal or metallic-finish card</li>
                <li>Tested with iPhone and Android, with a phone case on</li>
                <li>Engraved or printed logo</li>
                <li>Everything in Standard</li>
                <li>Priority setup support</li>
              </ul>
              <a className={styles.btn} href="#order" data-tier="Platinum">
                Order Platinum
              </a>
            </div>
          </div>
          <div className={styles.pro}>
            <h3>
              Optional Pro: <Price of="proMonthly" /> a month or <Price of="proYearly" /> a year
            </h3>
            <p>
              Add your logo and photo, see how often your card is tapped, collect enquiries from your profile, and add
              a Google review button. Cancel any time and your card keeps working with your basic profile.
            </p>
          </div>
          <div className={styles.pro}>
            <h3>Ordering for a team of 5 or more?</h3>
            <p>
              <Price of="teamCard" /> per Standard card, plus <Price of="teamSeatMonthly" /> per person a month for
              shared branding and one place to manage everyone&apos;s details. <a href="#order">Ask for a quote</a>.
            </p>
          </div>
        </div>
      </section>

      <section id="faq" className={`${styles.section} ${styles.alt}`}>
        <div className={`${styles.wrap} ${styles.faq}`}>
          <h2>Questions</h2>
          {FAQ.map(({ q, a }) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section id="order" className={styles.section}>
        <div className={styles.wrap}>
          <h2>Order or enquire</h2>
          <p className={styles.sub}>
            Tell us what you need and we&apos;ll reply within one working day with a proof and a quote.
          </p>
          <OrderForm />
        </div>
      </section>
    </>
  );
}
