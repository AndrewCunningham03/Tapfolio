import type { Metadata } from "next";
import { CONTACT_EMAIL } from "@/lib/site";
import styles from "../marketing.module.css";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How Tapfolio collects, uses and protects your personal data.",
  robots: { index: false },
};

export default function PrivacyPage() {
  return (
    <div className={`${styles.wrap} ${styles.narrow} ${styles.legal}`}>
      <h1>Privacy policy</h1>
      <p>Last updated: 5 November 2026</p>

      <h2>Who we are</h2>
      <p>
        Tapfolio is based at Merchants Quay, Newry, Northern Ireland. We are the controller of the personal data
        described here. We are based in the United Kingdom and also serve customers in Ireland and elsewhere, so we
        follow the UK GDPR and, for customers in the EU, the EU GDPR. Contact us about privacy at {CONTACT_EMAIL}.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Enquiries:</strong> whatever you send us when you email us, such as your name, email address and
          message.
        </li>
        <li>
          <strong>Orders:</strong> delivery address and order details. Payments are handled by Stripe. We never see or
          store your full card number.
        </li>
        <li>
          <strong>Your account and profile:</strong> your login email, and the details you choose to publish on your
          card&apos;s profile page, such as your name, job title, phone, email, website, address, social links, photo or
          logo, and any payment links or bank details you add so customers can pay you. We never take or handle payments
          ourselves.
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
        Your profile page is public by design: anyone who taps or scans your card, or has the link, can see it and save
        your details. Only add details you are happy to share. You can edit or hide any field, or ask us to take your
        profile down, at any time.
      </p>

      <h2>Who we share it with</h2>
      <p>
        Only the services we need to run Tapfolio: Supabase (database and logins), Vercel (hosting), Google (sign-in),
        Stripe (payments), Cloudflare (website security and email forwarding), our card supplier (who receives only the
        web address to program into each card, never your personal details) and the postal service that delivers your
        card (your name and delivery address). Some may process data outside the UK under approved safeguards.
      </p>

      <h2>How long we keep it</h2>
      <p>
        Enquiries that do not lead to an order: 12 months. Customer and order records: 6 years, for tax purposes.
        Profile data: while your subscription is active, then deleted 90 days after it ends, or within 30 days if you
        ask us to delete it sooner. Records of card taps: 12 months.
      </p>

      <h2>Your rights</h2>
      <p>
        You can ask to see, correct, delete or move your data, or object to how we use it. Email {CONTACT_EMAIL} and we
        will respond within one month. If you are unhappy with how we handle your data, you can complain to the data
        protection regulator where you live: in the UK (including Northern Ireland), the{" "}
        <a href="https://ico.org.uk/make-a-complaint/">Information Commissioner&apos;s Office</a>; in Ireland, the{" "}
        <a href="https://www.dataprotection.ie/">Data Protection Commission</a>.
      </p>

      <h2>Cookies</h2>
      <p>
        We use a cookie only to keep you signed in to your dashboard. We do not use cookies for tracking or advertising.
      </p>
    </div>
  );
}
