import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL, formatPrice, GRACE_DAYS, PRICES } from "@/lib/site";
import styles from "../marketing.module.css";

export const metadata: Metadata = {
  title: "Terms of service",
  description: "The terms of buying and using a Tapfolio card.",
  robots: { index: false },
};

const gbp = (key: "start" | "monthly") => formatPrice(PRICES.GBP[key], "GBP");
const eur = (key: "start" | "monthly") => formatPrice(PRICES.EUR[key], "EUR");

// DRAFT TEMPLATE: fill in every [bracketed] item and have it checked before
// launch, then remove the draft notice.
export default function TermsPage() {
  return (
    <div className={`${styles.wrap} ${styles.narrow} ${styles.legal}`}>
      <h1>Terms of service</h1>
      <p>Last updated: 5 November 2026</p>

      <p className={styles.draft}>
        <strong>Draft.</strong> This is a starting template, not legal advice. Fill in the bracketed details and have it
        reviewed before the site goes live.
      </p>

      <h2>Who we are</h2>
      <p>
        Tapfolio is run by [YOUR NAME / COMPANY NAME, company number if any], [ADDRESS], Northern Ireland
        (&quot;we&quot;, &quot;us&quot;). You can reach us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        These terms apply when you order a Tapfolio card or use your Tapfolio profile page (&quot;the service&quot;).
      </p>

      <h2>What you get</h2>
      <p>
        A Tapfolio card with a chip and QR code that open your own profile page, and that page: you choose its details,
        colours and photos, and customers can save your contact details and use any payment links you add. The card
        remains ours to link to your profile; it works for as long as your subscription is active.
      </p>

      <h2>Price and payment</h2>
      <ul>
        <li>
          <strong>First payment:</strong> {gbp("start")} in the UK, or {eur("start")} in Ireland. It covers your card,
          its delivery and your first month.
        </li>
        <li>
          <strong>After that:</strong> {gbp("monthly")} a month in the UK, or {eur("monthly")} in Ireland, taken
          automatically from the payment method you gave us, starting one month after your first payment.
        </li>
        <li>
          <strong>Payments</strong> are handled by Stripe. We never see or store your full card number.
        </li>
        <li>
          We will tell you in writing at least 30 days before any change to the monthly price, and you can cancel before
          it takes effect.
        </li>
      </ul>

      <h2>Delivery</h2>
      <p>
        We post cards to addresses in the United Kingdom and the Republic of Ireland, usually within 1 working day of
        your order. Delivery times are estimates. If your card has not arrived after 7 working days, email us and we
        will look into it.
      </p>

      <h2>Cancelling</h2>
      <ul>
        <li>
          <strong>Any time:</strong> there is no minimum term. Cancel from your billing page or by emailing us, and you
          will not be charged again. Your page stays live until the end of the month you have paid for, then your card
          stops showing it.
        </li>
        <li>
          <strong>Your 14-day right to cancel:</strong> if you order online you can cancel within 14 days of receiving
          your card and ask for a refund of what you paid. To do this, email us. Please return the card to us within 14
          days of telling us you are cancelling.
        </li>
        <li>
          <strong>Your details:</strong> after you cancel we keep your profile for 90 days in case you come back, then
          delete it.
        </li>
      </ul>

      <h2>If a payment fails</h2>
      <p>
        We will email you, and Stripe will try again. Your card keeps working for {GRACE_DAYS} days after a failed
        payment. After that your page is paused until you update your payment details, and then it comes back exactly as
        it was.
      </p>

      <h2>What we expect from you</h2>
      <ul>
        <li>The details you publish must be true, and must not break the law or anyone&apos;s rights.</li>
        <li>
          You are responsible for the payment links and bank details you add. We never take or handle payments between
          you and your customers.
        </li>
        <li>You must not use the service to mislead people, to send spam, or to host anything unlawful.</li>
        <li>We may remove content or pause a page that breaks these terms, and will tell you why when we can.</li>
      </ul>

      <h2>Our responsibility</h2>
      <p>
        We take reasonable care to keep the service running, but we cannot promise it will never be interrupted, and
        phones differ in how they read cards. Nothing in these terms limits your legal rights as a consumer, or our
        liability for anything the law does not allow us to limit. Otherwise our total liability to you is limited to
        what you have paid us in the 12 months before the problem.
      </p>

      <h2>Your data</h2>
      <p>
        How we handle personal data is explained in our <Link href="/privacy">privacy policy</Link>.
      </p>

      <h2>Changes and law</h2>
      <p>
        We may update these terms and will tell you about important changes. These terms are governed by the law of
        Northern Ireland, and for consumers in the Republic of Ireland that does not remove the protections of Irish
        consumer law.
      </p>
    </div>
  );
}
