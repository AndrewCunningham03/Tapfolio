import styles from "./marketing.module.css";

const STEPS = ["Sign in", "Delivery", "Payment"];

/** Where the visitor is in ordering a card: sign in, choose delivery, pay with Stripe. */
export function OrderSteps({ current }: { current: 0 | 1 | 2 }) {
  return (
    <ol className={`${styles.full} ${styles.orderSteps}`} aria-label="Ordering your card">
      {STEPS.map((step, i) => {
        const state = i < current ? "done" : i === current ? "current" : "next";
        return (
          <li key={step} data-state={state} aria-current={state === "current" ? "step" : undefined}>
            <span className={styles.stepDot} aria-hidden="true">
              {state === "done" ? "✓" : i + 1}
            </span>
            {step}
            {state === "done" && <span className={styles.srOnly}> (done)</span>}
          </li>
        );
      })}
    </ol>
  );
}
