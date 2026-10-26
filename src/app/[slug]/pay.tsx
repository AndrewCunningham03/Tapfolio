import type { PayMethod, Profile } from "@/lib/profiles";
import { CopyButton } from "./copy-button";
import styles from "./profile.module.css";

const PAY_LABELS: Record<PayMethod, string> = {
  revolut: "Revolut",
  paypal: "PayPal",
  monzo: "Monzo",
  card: "Pay by card",
};

/** "Pay me": payment links and bank details. Money goes straight to the business. */
export function PaySection({ profile }: { profile: Profile }) {
  const links = (Object.entries(profile.payLinks ?? {}) as [PayMethod, string][]).filter(([, url]) => url);
  const bank = profile.bank;
  if (!links.length && !bank) return null;

  const payee = profile.organisation ?? profile.fullName.split(/\s+/)[0];
  const rows: [string, string | undefined][] = bank
    ? [
        ["Account name", bank.accountName],
        ["Sort code", bank.sortCode],
        ["Account number", bank.accountNumber],
        ["IBAN", bank.iban],
        ["BIC", bank.bic],
      ]
    : [];

  return (
    <section className={styles.pay} aria-labelledby="pay-heading">
      <h2 id="pay-heading">Pay {payee}</h2>

      {links.length > 0 && (
        <div className={styles.payLinks}>
          {links.map(([method, url]) => (
            <a key={method} href={url} target="_blank" rel="noopener" className={method === "card" ? styles.payPrimary : undefined}>
              {PAY_LABELS[method]}
            </a>
          ))}
        </div>
      )}

      {bank && (
        <dl className={styles.bank}>
          {rows
            .filter(([, value]) => value)
            .map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>
                  <span>{value}</span>
                  {label !== "Account name" && <CopyButton value={value!.replace(/[\s-]/g, "")} label={label} />}
                </dd>
              </div>
            ))}
        </dl>
      )}

      <p className={styles.payNote}>Payments go directly to {payee}. Check the details with them if you&apos;re unsure.</p>
    </section>
  );
}
