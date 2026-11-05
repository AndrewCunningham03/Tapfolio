import type { PayMethod, Profile } from "@/lib/profiles";
import { CopyButton } from "./copy-button";
import { BankIcon, CardIcon, ExternalIcon, MobileIcon, ShieldIcon } from "./icons";
import styles from "./profile.module.css";

const PAY_LABELS: Record<PayMethod, string> = {
  revolut: "Revolut",
  paypal: "PayPal",
  monzo: "Monzo",
  card: "Pay by card",
};

/** Where a pay link goes, shown under its button so the payer can see it's the right place before tapping. */
function destination(url: string, method: PayMethod): string {
  const { hostname, pathname } = new URL(url);
  const host = hostname.replace(/^www\./, "");
  return method === "card" ? host : host + pathname.replace(/\/$/, "");
}

/** "Pay me": payment links and bank details. Money goes straight to the business. */
export function PaySection({ profile }: { profile: Profile }) {
  const links = (Object.entries(profile.payLinks ?? {}) as [PayMethod, string][]).filter(([, url]) => url);
  const bank = profile.bank;
  if (!links.length && !bank) return null;

  // A card link is the one most people can use, so it leads.
  links.sort(([a], [b]) => Number(b === "card") - Number(a === "card"));

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
      <h2 id="pay-heading" className={styles.payTitle}>
        Pay {payee}
      </h2>

      {links.length > 0 && (
        <ul className={styles.payLinks}>
          {links.map(([method, url]) => (
            <li key={method}>
              <a
                href={url}
                target="_blank"
                rel="noopener"
                className={method === "card" ? styles.payPrimary : undefined}
              >
                <span className={styles.payIcon}>{method === "card" ? <CardIcon /> : <MobileIcon />}</span>
                <span className={styles.payText}>
                  <strong>{method === "card" ? PAY_LABELS.card : `Pay with ${PAY_LABELS[method]}`}</strong>
                  <small>{destination(url, method)}</small>
                </span>
                <span className={styles.payGo}>
                  <ExternalIcon />
                  <span className={styles.srOnly}>(opens in a new tab)</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}

      {bank && (
        <>
          <h3 className={styles.bankTitle}>
            <BankIcon />
            {links.length > 0 ? "Or pay by bank transfer" : "Pay by bank transfer"}
          </h3>
          <dl className={styles.bank}>
            {rows
              .filter(([, value]) => value)
              .map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>
                    <span className={styles.bankValue}>{value}</span>
                    {/* Numbers are copied without their spaces and dashes, so they paste cleanly into a banking app. */}
                    <CopyButton
                      value={label === "Account name" ? value! : value!.replace(/[\s-]/g, "")}
                      label={label}
                    />
                  </dd>
                </div>
              ))}
          </dl>
        </>
      )}

      <p className={styles.payNote}>
        <ShieldIcon />
        <span>
          Payments go straight to {payee}. Tapfolio never handles the money. If anything looks wrong, check with them
          before you pay.
        </span>
      </p>
    </section>
  );
}
