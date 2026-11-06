import type { CustomLink } from "@/lib/profiles";
import styles from "./custom-links.module.css";

/**
 * The owner's own buttons ("Book a quote", "See our prices"), as big full-width links.
 * They open in the same tab. Every link is someone else's website, hence noopener
 * noreferrer. Nothing shows when the owner hasn't added any.
 */
export function CustomLinks({ links, owner }: { links: CustomLink[]; owner: string }) {
  if (links.length === 0) return null;
  return (
    <ul className={styles.links} aria-label={`Links from ${owner}`}>
      {links.map((link, i) => (
        <li key={`${i}-${link.url}`}>
          <a href={link.url} rel="noopener noreferrer">
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
