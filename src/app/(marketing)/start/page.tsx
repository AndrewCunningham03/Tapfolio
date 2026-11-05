import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { connection } from "next/server";
import { getUser, requireUser } from "@/lib/auth";
import { CONTACT_EMAIL } from "@/lib/site";
import { detectInAppBrowser } from "../in-app-browser";
import { InAppBrowserNotice } from "../in-app-notice";
import { OrderSteps } from "../order-steps";
import { StartForm } from "./start-form";
import styles from "../marketing.module.css";

export const metadata: Metadata = { title: "Get your card", robots: { index: false } };

const NEXT_STEPS = [
  {
    title: "Pay securely with Stripe",
    text: "Add your delivery address and payment details on Stripe's checkout. We never see your card number.",
  },
  {
    title: "Set up your page straight away",
    text: "Once you've paid, your dashboard opens so you can add your details, photos and colours.",
  },
  {
    title: "Your card is posted to you",
    text: "When your metal card arrives, hold it to a phone and your page opens.",
  },
];

export default function StartPage() {
  return (
    <div className={`${styles.wrap} ${styles.narrow} ${styles.legal} ${styles.panelPage}`}>
      <div className={styles.panel}>
        <p className={styles.eyebrow}>Order</p>
        <h1>Get your card</h1>
        <p className={styles.sub}>
          Choose where we should post it, then pay securely with Stripe. You can set up your page as soon as you&apos;ve
          paid.
        </p>
        <Suspense fallback={<div className={styles.startSlot} />}>
          <Form />
        </Suspense>
        <section className={styles.nextSteps} aria-labelledby="next-steps">
          <h2 id="next-steps">What happens next</h2>
          <ol>
            {NEXT_STEPS.map((step) => (
              <li key={step.title}>
                <strong>{step.title}</strong>
                <span>{step.text}</span>
              </li>
            ))}
          </ol>
          <p className={styles.formNote}>
            Questions first? Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>
        </section>
      </div>
    </div>
  );
}

async function Form() {
  await connection();
  // Facebook, Instagram and similar apps can't sign in with Google, so explain before sending them to sign in.
  const inApp = detectInAppBrowser((await headers()).get("user-agent"));
  if (inApp && !(await getUser())) {
    return (
      <div className={styles.form}>
        <OrderSteps current={0} />
        <InAppBrowserNotice {...inApp}>
          <Link className={styles.linkButton} href="/login?next=/start">
            Already in your normal browser? Sign in
          </Link>
        </InAppBrowserNotice>
      </div>
    );
  }
  const user = await requireUser("/start");
  return <StartForm email={user.email ?? ""} />;
}
