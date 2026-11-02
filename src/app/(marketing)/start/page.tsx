import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { requireUser } from "@/lib/auth";
import { StartForm } from "./start-form";
import styles from "../marketing.module.css";

export const metadata: Metadata = { title: "Get your card", robots: { index: false } };

export default function StartPage() {
  return (
    <div className={`${styles.wrap} ${styles.narrow} ${styles.legal}`}>
      <p className={styles.eyebrow}>Order</p>
      <h1>Get your card</h1>
      <Suspense>
        <Form />
      </Suspense>
    </div>
  );
}

async function Form() {
  await connection();
  const user = await requireUser("/start");
  return <StartForm email={user.email ?? ""} />;
}
