import { Suspense } from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { safeNext } from "@/lib/auth";
import { CONTACT_EMAIL } from "@/lib/site";
import { Price } from "../currency";
import { detectInAppBrowser } from "../in-app-browser";
import { OrderSteps } from "../order-steps";
import { LoginForm } from "./login-form";
import styles from "../marketing.module.css";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <div className={`${styles.wrap} ${styles.narrow} ${styles.legal} ${styles.panelPage}`}>
      <div className={styles.panel}>
        <p className={styles.eyebrow}>Your card</p>
        <h1>Sign in</h1>
        <p className={styles.sub}>
          Use your Google account: there&apos;s no password to set up or remember. New here? Signing in creates your
          account.
        </p>
        <Suspense fallback={<div className={styles.googleSlot} />}>
          <SignIn searchParams={searchParams} />
        </Suspense>
        <div className={styles.loginHelp}>
          <div>
            <h2>Why Google?</h2>
            <p>
              It keeps your account safe without another password to remember. Google tells us your name and email
              address, never your password.
            </p>
          </div>
          <div>
            <h2>Don&apos;t use Google?</h2>
            <p>
              Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and we&apos;ll set up your card and page
              another way.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

async function SignIn({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const params = await searchParams;
  const next = safeNext(params.next);
  const inApp = detectInAppBrowser((await headers()).get("user-agent"));
  const ordering = next.startsWith("/start") && (
    <div className={`${styles.orderIntro} ${inApp ? styles.orderIntroAfter : ""}`}>
      <OrderSteps current={0} />
      <p>
        <strong>You&apos;re ordering a Tapfolio card.</strong> Once you&apos;re signed in, choose where we post it, then
        pay securely with Stripe.
      </p>
      <p className={styles.formNote}>
        <Price of="start" /> to start (card, delivery and first month), then <Price of="monthly" /> a month.
      </p>
    </div>
  );
  const form = (
    <LoginForm
      next={next}
      error={params.error === "google" || params.error === "link" ? params.error : undefined}
      inApp={inApp}
    />
  );
  // Inside Facebook and similar apps, how to get out comes first: nothing else works until they do.
  return inApp ? (
    <>
      {form}
      {ordering}
    </>
  ) : (
    <>
      {ordering}
      {form}
    </>
  );
}
