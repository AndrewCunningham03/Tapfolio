import styles from "./profile.module.css";

/**
 * Placeholder with the same boxes as the top of a profile (banner, photo,
 * name, Save contact, quick actions), so nothing jumps when it streams in.
 * `lines` is how many lines sit under the name; `actions` how many quick actions.
 */
export function ProfileSkeleton({ lines = 2, actions = 4 }: { lines?: number; actions?: number }) {
  return (
    <div className={`${styles.page} ${styles.loading}`} aria-busy="true">
      <span className={styles.srOnly} role="status">
        Loading
      </span>
      <div className={styles.banner} />
      <div className={styles.avatar} />
      <div className={styles.intro} aria-hidden="true">
        <div className={styles.name}>
          <span className={styles.bone} style={{ width: "9em" }} />
        </div>
        {lines > 0 && (
          <p className={styles.org}>
            <span className={styles.bone} style={{ width: "11em" }} />
          </p>
        )}
        {lines > 1 && (
          <p className={styles.role}>
            <span className={styles.bone} style={{ width: "14em" }} />
          </p>
        )}
      </div>
      <span className={`${styles.save} ${styles.boneBox}`} aria-hidden="true" />
      {actions > 0 && (
        <div className={actions > 2 ? styles.quick : `${styles.quick} ${styles.quickFew}`} aria-hidden="true">
          {Array.from({ length: actions }, (_, i) => (
            <span key={i} className={styles.boneBox} />
          ))}
        </div>
      )}
      <div className={`${styles.section} ${styles.boneBox} ${styles.boneTall}`} aria-hidden="true" />
    </div>
  );
}
