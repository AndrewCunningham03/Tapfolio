import type { Metadata } from "next";
import styles from "../marketing.module.css";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How Tapfolio collects, uses and protects your personal data.",
  robots: { index: false },
};

// DRAFT TEMPLATE: fill in every [bracketed] item and have it checked before
// launch, then remove the draft notice.
export default function PrivacyPage() {
  return (
    <div className={`${styles.wrap} ${styles.narrow} ${styles.legal}`}>
      <h1>Privacy policy</h1>
      <p>Last updated: [DATE]</p>

      <p className={styles.draft}>
        <strong>Draft.</strong> This is a starting template, not legal advice. Fill in the bracketed details and have
        it reviewed before the site goes live.
      </p>

      <h2>Who we are</h2>
      <p>
        Tapfolio is run by [YOUR NAME / COMPANY NAME, company number if any], [ADDRESS], Northern Ireland. We are the
        controller of the personal data described here. We are based in the United Kingdom and also serve customers in
        Ireland and elsewhere, so we follow the UK GDPR and, for customers in the EU, the EU GDPR. ICO registration number: [ICO REF]. [EU
        representative: name and address, if one is required.] Contact us about privacy at [PRIVACY EMAIL].
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Enquiries:</strong> the name, business name, email, phone number and message you send through our
          order form.
        </li>
        <li>
          <strong>Orders:</strong> delivery address and order details. Payments are handled by [PAYMENT PROVIDER, e.g.
          Stripe]. We never see or store your full card number.
        </li>
        <li>
          <strong>Your account and profile:</strong> your login email, and the details you choose to publish on your
          card&apos;s profile page, such as your name, job title, phone, email, website, address, social links,
          photo or logo, and any payment links or bank details you add so customers can pay you. We never take or
          handle payments ourselves.
        </li>
        <li>
          <strong>Card taps:</strong> when someone taps or scans a card we record the time and the type of device
          (iPhone, Android or computer). We do not store IP addresses or use tracking cookies.
        </li>
      </ul>

      <h2>Why we use it</h2>
      <ul>
        <li>To reply to your enquiry and give you a quote (our legitimate interest in responding to you).</li>
        <li>To make, send and support your card and run your profile page (to perform our contract with you).</li>
        <li>To keep records for tax and accounting (legal obligation).</li>
      </ul>
      <p>We do not sell your data or use it for advertising.</p>

      <h2>Your public profile</h2>
      <p>
        Your profile page is public by design: anyone who taps or scans your card, or has the link, can see it and
        save your details. Only add details you are happy to share. You can edit or hide any field, or ask us to take
        your profile down, at any time.
      </p>

      <h2>Who we share it with</h2>
      <p>
        Only the services we need to run Tapfolio: Supabase (database and logins), Vercel (hosting), [CARD SUPPLIER:
        receives only the card web address to encode, plus your artwork], [PAYMENT PROVIDER] and [EMAIL PROVIDER].
        Some may process data outside the UK under approved safeguards.
      </p>

      <h2>How long we keep it</h2>
      <p>
        Enquiries that do not lead to an order: [e.g. 12 months]. Customer and order records: [e.g. 6 years, for tax
        purposes]. Profile data: while your profile is active, then deleted [e.g. 30 days] after you ask us to close
        it.
      </p>

      <h2>Your rights</h2>
      <p>
        You can ask to see, correct, delete or move your data, or object to how we use it. Email [PRIVACY EMAIL] and
        we will respond within one month. If you are unhappy with how we handle your data, you can complain to the
        data protection regulator where you live: in the UK (including Northern Ireland), the{" "}
        <a href="https://ico.org.uk/make-a-complaint/">Information Commissioner&apos;s Office</a>; in Ireland, the{" "}
        <a href="https://www.dataprotection.ie/">Data Protection Commission</a>.
      </p>

      <h2>Cookies</h2>
      <p>
        We use a cookie only to keep you signed in to your dashboard. We do not use cookies for tracking or
        advertising. [Update this, and add a consent banner, if you add analytics that use cookies.]
      </p>
    </div>
  );
}
