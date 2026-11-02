"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { GOOGLE_CLIENT_ID } from "@/lib/site";
import { signInWithGoogleToken } from "./actions";
import styles from "../marketing.module.css";

// The parts of Google's sign-in script we use.
type GoogleId = {
  initialize(config: {
    client_id: string;
    nonce: string;
    callback: (response: { credential: string }) => void;
  }): void;
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

export function LoginForm({ next, error }: { next: string; error?: "google" | "link" }) {
  const button = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(Boolean(error));
  const [signingIn, setSigningIn] = useState(false);

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
      width: 280,
    });
  }, [next]);

  useEffect(() => {
    void setUp();
  }, [setUp]);

  return (
    <div className={`${styles.form} ${styles.loginForm}`}>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={() => void setUp()} />
      {failed && (
        <p className={`${styles.notice} ${styles.formError} ${styles.full}`} role="alert">
          We couldn&apos;t sign you in with Google. Please try again.
        </p>
      )}
      <div className={styles.full}>
        <div ref={button} />
        {signingIn && <p className={styles.formNote}>Signing you in…</p>}
      </div>
    </div>
  );
}
