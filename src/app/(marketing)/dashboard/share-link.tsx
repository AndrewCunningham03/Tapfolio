"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { PUBLIC_HOST } from "./sections";
import ds from "./dashboard.module.css";
import styles from "../marketing.module.css";

const noSubscribe = () => () => {};
const canShareNow = () => typeof navigator !== "undefined" && typeof navigator.share === "function";

/** "View my page", "Copy my link" and, on phones that support it, "Share". */
export function ShareLink({ slug }: { slug: string }) {
  const url = `https://${PUBLIC_HOST}/${slug}`;
  const [copy, setCopy] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Only known in the browser; the server renders without the Share button.
  const canShare = useSyncExternalStore(noSubscribe, canShareNow, () => false);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copyLink() {
    clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(url);
      setCopy("copied");
      timer.current = setTimeout(() => setCopy("idle"), 3000);
    } catch {
      // Some in-app browsers block the clipboard; the link is on screen to copy by hand.
      setCopy("failed");
    }
  }

  async function share() {
    try {
      await navigator.share({ title: "My Tapfolio page", url });
    } catch {
      // Closing the share sheet counts as an error; nothing to do.
    }
  }

  const ghost = `${styles.btn} ${styles.ghost} ${ds.tap}`;
  return (
    <div className={ds.shareRow}>
      <a className={`${styles.btn} ${ds.tap}`} href={`/${slug}`} target="_blank" rel="noopener">
        View my page<span className={ds.srOnly}> (opens in a new tab)</span>
      </a>
      <button type="button" className={ghost} onClick={copyLink}>
        {copy === "copied" ? "Link copied" : "Copy my link"}
      </button>
      {canShare && (
        <button type="button" className={ghost} onClick={share}>
          Share
        </button>
      )}
      <p className={copy === "failed" ? ds.shareNote : ds.srOnly} aria-live="polite">
        {copy === "copied" && `Link copied: ${url}`}
        {copy === "failed" && "We couldn't copy it here. Press and hold your link above to copy it."}
      </p>
    </div>
  );
}
