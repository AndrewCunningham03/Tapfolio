// Pieces of the profile editor's form that more than one section uses: a labelled
// text box with hint and error, and the tidying of links people type or paste.

import type { SocialNetwork } from "@/lib/profile-fields";
import ds from "./dashboard.module.css";
import styles from "../marketing.module.css";

// Tidying what people type -------------------------------------------------------
// Only fills in what the server would otherwise reject (it still checks everything).

const HANDLE_LINKS: Partial<Record<SocialNetwork, (handle: string) => string>> = {
  instagram: (h) => `https://instagram.com/${h}`,
  tiktok: (h) => `https://tiktok.com/@${h}`,
  x: (h) => `https://x.com/${h}`,
};

/** "07700 900123" (UK) or "087 123 4567" (Ireland) or "+44 7700 900123" → a wa.me link. */
function whatsappLink(value: string): string | null {
  if (!/^\+?[\d\s().-]{7,}$/.test(value)) return null;
  let digits = value.replace(/\D/g, "");
  if (value.startsWith("+")) digits = digits.replace(/^(44|353)0/, "$1");
  else if (/^00\d+$/.test(digits)) digits = digits.slice(2).replace(/^(44|353)0/, "$1");
  else if (/^07\d{9}$/.test(digits)) digits = `44${digits.slice(1)}`;
  else if (/^08\d{8}$/.test(digits)) digits = `353${digits.slice(1)}`;
  else return null;
  return `https://wa.me/${digits}`;
}

/** "www.mybusiness.co.uk" → "https://www.mybusiness.co.uk", "@name" → the profile link, and so on. */
export function tidyLink(raw: string, opts: { network?: SocialNetwork; pay?: boolean } = {}): string {
  const value = raw.trim();
  if (!value) return value;
  if (opts.network === "whatsapp") {
    const wa = whatsappLink(value);
    if (wa) return wa;
  }
  const toHandle = opts.network && HANDLE_LINKS[opts.network];
  const handle = /^@([A-Za-z0-9._]{1,30})$/.exec(value);
  if (toHandle && handle) return toHandle(handle[1]);
  if (opts.pay && /^http:\/\//i.test(value)) return `https://${value.slice(7)}`;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(value) && /^[^\s@/]+\.[a-z]{2,}(\/\S*)?$/i.test(value)) return `https://${value}`;
  return value;
}

// Fields -------------------------------------------------------------------------

type FieldProps = {
  name: string;
  label: string;
  value: string | null | undefined;
  /** undefined: fine. A message: shown under the label. "": marked as wrong, message shown elsewhere. */
  error?: string;
  type?: string;
  placeholder?: string;
  full?: boolean;
  hint?: React.ReactNode;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  required?: boolean;
  maxLength?: number;
  /** For links: tidy the value when the customer leaves the box. */
  tidy?: (value: string) => string;
};

export function describedBy(...ids: (string | false | undefined)[]) {
  return ids.filter(Boolean).join(" ") || undefined;
}

export function Field(props: FieldProps) {
  const hintId = props.hint ? `${props.name}-hint` : undefined;
  const errorId = props.error ? `${props.name}-error` : undefined;
  const tidy = props.tidy;
  return (
    <div className={props.full ? styles.full : undefined}>
      <label htmlFor={props.name}>{props.label}</label>
      {props.hint && (
        <p id={hintId} className={ds.hint}>
          {props.hint}
        </p>
      )}
      {props.error && (
        <p id={errorId} className={ds.fieldError}>
          {props.error}
        </p>
      )}
      <input
        id={props.name}
        name={props.name}
        type={props.type ?? "text"}
        defaultValue={props.value ?? ""}
        placeholder={props.placeholder}
        autoComplete={props.autoComplete}
        inputMode={props.inputMode}
        required={props.required}
        maxLength={props.maxLength}
        aria-invalid={props.error !== undefined || undefined}
        aria-describedby={describedBy(errorId, hintId)}
        {...(tidy && {
          autoCapitalize: "none",
          autoCorrect: "off",
          spellCheck: false,
          onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
            const tidied = tidy(e.currentTarget.value);
            if (tidied !== e.currentTarget.value) e.currentTarget.value = tidied;
          },
        })}
      />
    </div>
  );
}
