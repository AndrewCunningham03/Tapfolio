import styles from "./marketing.module.css";

/** "Tap" in green, "folio" in yellow, as on the card. */
export function Wordmark() {
  return (
    <>
      <span className={styles.logoTap}>Tap</span>
      <span className={styles.logoFolio}>folio</span>
    </>
  );
}
