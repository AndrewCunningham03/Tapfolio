import { Suspense } from "react";
import type { Metadata } from "next";
import { safeNext } from "@/lib/auth";
import { LoginForm } from "./login-form";
import styles from "../marketing.module.css";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <div className={`${styles.wrap} ${styles.narrow} ${styles.legal}`}>
      <p className={styles.eyebrow}>Your card</p>
      <h1>Sign in</h1>
      <p>Enter the email you ordered your card with and we&apos;ll send you a link to sign in. No password needed.</p>
      <Suspense>
        {searchParams.then((p) => (
          <LoginForm next={safeNext(p.next)} linkError={p.error === "link"} />
        ))}
      </Suspense>
    </div>
  );
}
