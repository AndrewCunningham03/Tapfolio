import { Suspense } from "react";
import type { Metadata } from "next";
import { safeNext } from "@/lib/auth";
import { LoginForm } from "./login-form";
import styles from "../marketing.module.css";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <div className={`${styles.wrap} ${styles.narrow} ${styles.legal}`}>
      <div className={styles.panel}>
        <p className={styles.eyebrow}>Your card</p>
        <h1>Sign in</h1>
        <p className={styles.sub}>Sign in with your Google account. No password needed.</p>
        <Suspense>
          {searchParams.then((p) => (
            <LoginForm
              next={safeNext(p.next)}
              error={p.error === "google" || p.error === "link" ? p.error : undefined}
            />
          ))}
        </Suspense>
      </div>
    </div>
  );
}
