"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import type { InAppBrowser } from "./in-app-browser";
import styles from "./marketing.module.css";

const subscribe = () => () => {};

/**
 * Shown instead of Google sign-in inside Facebook, Instagram, Messenger and
 * similar apps, whose built-in browsers Google blocks. Explains how to reopen
 * the page in the phone's own browser and offers the link to copy.
 */
export function InAppBrowserNotice({ app, platform, children }: InAppBrowser & { children?: React.ReactNode }) {
  // Read after hydration: the server doesn't know the full address the visitor sees.
  const url = useSyncExternalStore(
    subscribe,
    () => window.location.href,
    () => "",
  );
  const field = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState<"done" | "manual" | null>(null);

  const browser = platform === "ios" ? "Safari" : platform === "android" ? "Chrome" : "your usual browser";
  const menu = platform === "android" ? "⋮" : "⋯";

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied("done");
      return;
    } catch {}
    // Older in-app browsers have no clipboard API: select the text and use the legacy command.
    const el = field.current;
    if (el) {
      el.focus();
      el.select();
      try {
        if (document.execCommand("copy")) {
          setCopied("done");
          return;
        }
      } catch {}
    }
    setCopied("manual");
  }

  return (
    <section className={`${styles.full} ${styles.inApp}`} aria-labelledby="in-app-title">
      <h2 id="in-app-title">Open this page in {browser} to carry on</h2>
      <p>
        You&apos;re viewing Tapfolio inside {app}, and Google doesn&apos;t allow signing in from there. Open this page
        in {browser} instead: it takes a few seconds.
      </p>
      <ol className={styles.inAppSteps}>
        <li>
          Tap the <strong>{menu}</strong> menu, usually at the top right of the screen.
        </li>
        <li>
          Choose <strong>Open in browser</strong>. It may say &ldquo;Open in external browser&rdquo;, &ldquo;Open in
          Safari&rdquo; or &ldquo;Open in Chrome&rdquo;.
        </li>
        <li>Sign in with Google there and carry on where you left off.</li>
      </ol>
      <p>No menu? Copy the link and paste it into {browser}&apos;s address bar.</p>
      <div className={styles.copyRow}>
        <label className={styles.srOnly} htmlFor="in-app-link">
          Link to this page
        </label>
        <input id="in-app-link" ref={field} readOnly value={url} onFocus={(e) => e.currentTarget.select()} />
        <button className={styles.btn} type="button" onClick={copy}>
          Copy link
        </button>
      </div>
      <p className={styles.formNote} role="status">
        {copied === "done" && `Link copied. Now open ${browser} and paste it into the address bar.`}
        {copied === "manual" && "Press and hold the link above, then choose Copy."}
      </p>
      {children}
    </section>
  );
}
