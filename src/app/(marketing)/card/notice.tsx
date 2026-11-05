import Link from "next/link";
import site from "../marketing.module.css";
import styles from "./card.module.css";

export type NoticeTone = "setup" | "paused" | "off" | "unknown";

const BADGES: Record<NoticeTone, React.ReactNode> = {
  setup: <path d="M12 6v6l4 2" />,
  paused: <path d="M9.5 7v10M14.5 7v10" />,
  off: <path d="M12 3v8M6.4 7.4a8 8 0 1 0 11.2 0" />,
  unknown: <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4.5M12 18h.01" />,
};

/** A small steel card with a status badge, so the page reads at a glance as "about this card". */
function CardGlyph({ tone }: { tone: NoticeTone }) {
  return (
    <div className={styles.glyph} aria-hidden="true">
      <svg viewBox="0 0 86 54">
        <defs>
          <linearGradient id="notice-steel" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#3a3d42" />
            <stop offset="0.5" stopColor="#1d1f22" />
            <stop offset="1" stopColor="#2b2e33" />
          </linearGradient>
        </defs>
        <rect x="0.5" y="0.5" width="85" height="53" rx="5" fill="url(#notice-steel)" stroke="rgba(255,255,255,0.14)" />
        <path
          d="M60 18a8 8 0 0 1 0 11M64 15a13 13 0 0 1 0 17"
          stroke="#c9ced6"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
        />
        <rect x="10" y="36" width="26" height="3" rx="1.5" fill="#c9ced6" opacity="0.5" />
        <rect x="10" y="42" width="16" height="3" rx="1.5" fill="#c9ced6" opacity="0.3" />
      </svg>
      <span className={styles.badge}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          {BADGES[tone]}
        </svg>
      </span>
    </div>
  );
}

/**
 * Shared layout for the pages a card link can land on when it can't show a profile.
 * `children` is what the person who tapped the card needs to know; put the owner's
 * next step in a <NoticeAside>.
 */
export function CardNotice({
  title,
  tone = "unknown",
  children,
}: {
  title: string;
  tone?: NoticeTone;
  children: React.ReactNode;
}) {
  return (
    <div className={`${site.wrap} ${styles.notice} ${styles[tone] ?? ""}`}>
      <div className={styles.panel}>
        <CardGlyph tone={tone} />
        <h1>{title}</h1>
        <div className={styles.body}>{children}</div>
        <p className={styles.more}>
          <span>Want a card like this for your business?</span>
          <Link className={`${site.btn} ${site.ghost} ${site.btnSmall} ${styles.actionsBtn}`} href="/">
            Get your own Tapfolio card
          </Link>
        </p>
      </div>
    </div>
  );
}

/** The card owner's next step, set apart from the message for visitors. */
export function NoticeAside({
  title = "Is this your card?",
  children,
  action,
}: {
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className={styles.aside}>
      <h2>{title}</h2>
      {children}
      {action && <div className={styles.actions}>{action}</div>}
    </section>
  );
}

/** Sign-in button for an owner, landing on their dashboard. */
export function OwnerSignIn({ label = "Sign in" }: { label?: string }) {
  return (
    <Link className={`${site.btn} ${site.btnSmall}`} href="/login?next=/dashboard">
      {label}
    </Link>
  );
}
