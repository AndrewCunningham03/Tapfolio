"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./profile.module.css";

/** Shown only to the card's owner, when they're signed in on this device. */
export function OwnerBar({ slug }: { slug: string }) {
  const [owner, setOwner] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/me/owns?slug=${encodeURIComponent(slug)}`, { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : { owner: false }))
      .then((d: { owner: boolean }) => !cancelled && setOwner(d.owner))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!owner) return null;
  return (
    <Link className={styles.ownerBar} href="/dashboard">
      Edit my card
    </Link>
  );
}
