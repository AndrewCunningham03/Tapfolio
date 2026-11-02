import { signInWithGoogle } from "./actions";
import styles from "../marketing.module.css";

export function LoginForm({ next, error }: { next: string; error?: "google" | "link" }) {
  return (
    <form className={`${styles.form} ${styles.loginForm}`} action={signInWithGoogle}>
      {error && (
        <p className={`${styles.notice} ${styles.formError} ${styles.full}`} role="alert">
          We couldn&apos;t sign you in with Google. Please try again.
        </p>
      )}
      <input type="hidden" name="next" value={next} />
      <div className={styles.full}>
        <button className={styles.btn} type="submit">
          Continue with Google
        </button>
      </div>
    </form>
  );
}
