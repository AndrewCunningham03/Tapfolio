import type { Metadata } from "next";
import { Designer } from "./designer";
import styles from "../marketing.module.css";

export const metadata: Metadata = {
  title: "Design your card",
  description: "Design your Tapfolio metal card: choose black, silver, gold or rose gold, add your name and logo, and see it live.",
};

export default function DesignPage() {
  return (
    <section className={`${styles.section} ${styles.designSection}`}>
      <div className={styles.wrap}>
        <p className={styles.eyebrow}>Design your card</p>
        <h1 className={styles.designTitle}>Make it yours.</h1>
        <Designer />
      </div>
    </section>
  );
}
