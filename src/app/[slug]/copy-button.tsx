"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "./icons";
import styles from "./profile.module.css";

/** Copies a value (e.g. an account number) and confirms briefly. */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard can be blocked (e.g. in-app browsers); the value is still on screen to copy by hand.
    }
  }

  return (
    <>
      <button
        type="button"
        className={copied ? `${styles.copy} ${styles.copied}` : styles.copy}
        onClick={copy}
        aria-label={`Copy ${label}`}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
        {copied ? "Copied" : "Copy"}
      </button>
      {/* Screen readers hear the confirmation; the button's own name stays "Copy …". */}
      <span className={styles.srOnly} role="status">
        {copied ? `${label} copied` : ""}
      </span>
    </>
  );
}
