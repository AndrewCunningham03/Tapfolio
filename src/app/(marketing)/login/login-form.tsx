"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { CONTACT_EMAIL, GOOGLE_CLIENT_ID } from "@/lib/site";
import type { InAppBrowser } from "../in-app-browser";
import { InAppBrowserNotice } from "../in-app-notice";
import { signInWithGoogleToken } from "./actions";
import styles from "../marketing.module.css";

// The parts of Google's sign-in script we use.
type GoogleId = {
  initialize(config: { client_id: string; nonce: string; callback: (response: { credential: string }) => void }): void;
  renderButton(parent: HTMLElement, options: Record<string, string | number>): void;
};
declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function LoginForm({
  next,
  error,
  inApp,
}: {
  next: string;
  error?: "google" | "link";
  /** Set inside Facebook, Instagram and similar apps, where Google blocks sign-in. */
  inApp?: InAppBrowser | null;
}) {
  const button = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(Boolean(error));
  const [signingIn, setSigningIn] = useState(false);
  // In an app's built-in browser the Google button would only fail, so it waits behind "try anyway".
  const [showGoogle, setShowGoogle] = useState(!inApp);

  // Google's own button opens its pop-up, which names Tapfolio rather than our database host.
  const setUp = useCallback(async () => {
    const google = window.google?.accounts.id;
    if (!google || !button.current || button.current.childElementCount) return;

    // Google signs this nonce into the token (hashed); Supabase checks the raw value.
    const nonce = crypto.randomUUID();
    google.initialize({
      client_id: GOOGLE_CLIENT_ID,
      nonce: await sha256Hex(nonce),
      callback: async ({ credential }) => {
        setFailed(false);
        setSigningIn(true);
        const result = await signInWithGoogleToken(credential, nonce, next);
        if (result.ok) {
          window.location.assign(result.next);
        } else {
          setSigningIn(false);
          setFailed(true);
        }
      },
    });
    google.renderButton(button.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "continue_with",
      // Fit narrow phones: Google accepts 200 to 400 pixels.
      width: Math.max(200, Math.min(300, button.current.clientWidth)),
    });
  }, [next]);

  useEffect(() => {
    void setUp();
  }, [setUp, showGoogle]);

  return (
    <div className={`${styles.form} ${styles.loginForm}`}>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={() => void setUp()} />
      {inApp && (
        <InAppBrowserNotice {...inApp}>
          {!showGoogle && (
            <button className={styles.linkButton} type="button" onClick={() => setShowGoogle(true)}>
              Already in your normal browser? Show Google sign-in
            </button>
          )}
        </InAppBrowserNotice>
      )}
      {failed && (
        <p className={`${styles.notice} ${styles.formError} ${styles.full}`} role="alert">
          We couldn&apos;t sign you in with Google. Please try again. If it keeps happening, email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      )}
      {showGoogle && (
        <div className={`${styles.full} ${styles.googleSlot}`}>
          <div ref={button} />
          <p className={styles.formNote} role="status">
            {signingIn && "Signing you in…"}
          </p>
        </div>
      )}
    </div>
  );
}
