"use client";

import { useActionState } from "react";
import { sendSignInLink, type LoginState } from "./actions";
import styles from "../marketing.module.css";

const initial: LoginState = { status: "idle" };

export function LoginForm({ next, linkError }: { next: string; linkError: boolean }) {
  const [state, action, pending] = useActionState(sendSignInLink, initial);

  if (state.status === "sent") {
    return (
      <div className={`${styles.notice} ${styles.thanks}`} role="status">
        <strong>Check your email.</strong> If {state.email} has a Tapfolio card, we&apos;ve sent a sign-in link to it.
        Open it on this device. It works once and expires in 10 minutes.
        <br />
        Nothing after a couple of minutes? Check your spam folder, and make sure this is the email address you ordered
        your card with.
      </div>
    );
  }

  return (
    <form className={`${styles.form} ${styles.loginForm}`} action={action}>
      {linkError && (
        <p className={`${styles.notice} ${styles.formError} ${styles.full}`} role="alert">
          That sign-in link has expired or was already used. Ask for a new one below.
        </p>
      )}
      <input type="hidden" name="next" value={next} />
      <div className={styles.full}>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" placeholder="you@yourbusiness.co.uk" />
      </div>
      <div className={styles.full}>
        <button className={styles.btn} type="submit" disabled={pending}>
          {pending ? "Sending…" : "Email me a sign-in link"}
        </button>
      </div>
      {state.status === "error" && (
        <p className={`${styles.notice} ${styles.formError} ${styles.full}`} role="alert">
          {state.message}
        </p>
      )}
    </form>
  );
}
