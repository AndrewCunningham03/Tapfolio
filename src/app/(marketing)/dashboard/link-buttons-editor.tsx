"use client";

import { useEffect, useRef, useState } from "react";
import { CUSTOM_LINK_LABEL_MAX, CUSTOM_LINK_URL_MAX, MAX_CUSTOM_LINKS, type CustomLink } from "@/lib/profile-fields";
import { Field, tidyLink } from "./form-fields";
import ds from "./dashboard.module.css";
import styles from "../marketing.module.css";

// Grey example text in the empty boxes, a different idea for each row.
const LABEL_EXAMPLES = [
  "Book a quote",
  "See our prices",
  "Leave a Google review",
  "Our Facebook page",
  "Order online",
  "Read our reviews",
];

/** A row on screen. `key` never changes, so typing in one row isn't lost when another is added or removed. */
type Row = CustomLink & { key: number };

const ADD_BUTTON_ID = "link-add";

/**
 * The "Your buttons" rows: the words and the link for each button, with add and remove.
 * It sits inside the profile form and posts link_label_0.. and link_url_0.. with the rest
 * of it (see readCustomLinks in actions.ts). The boxes are plain, uncontrolled inputs like
 * the rest of the form, so a rejected save leaves what was typed where it was.
 */
export function LinkButtonsEditor({
  initial,
  errors,
  attempt,
  onEdit,
}: {
  /** The saved buttons. */
  initial: CustomLink[];
  /** The form's error messages by field name (link_label_0, link_url_0 …). */
  errors: Record<string, string>;
  /** Counts each save attempt, so a message about a row isn't shown after the rows have changed. */
  attempt: number;
  /** Adding or removing a row isn't a "change" event, so tell the form there is something to save. */
  onEdit: () => void;
}) {
  const [rows, setRows] = useState<Row[]>(() => initial.map((link, key) => ({ ...link, key })));
  const [notice, setNotice] = useState("");
  const [changedAt, setChangedAt] = useState(-1);
  const nextKey = useRef(initial.length);
  const focusId = useRef<string | null>(null);
  const full = rows.length >= MAX_CUSTOM_LINKS;

  // Messages name a row by its position at the last save. Once rows have been added or
  // removed since then the positions have moved, so hide them rather than blame the wrong row.
  const showErrors = changedAt !== attempt;

  // Put focus somewhere sensible once the new row (or the "Add" button) is on screen.
  useEffect(() => {
    if (!focusId.current) return;
    document.getElementById(focusId.current)?.focus();
    focusId.current = null;
  }, [rows]);

  function add() {
    if (full) return;
    setRows([...rows, { key: nextKey.current++, label: "", url: "" }]);
    setNotice(`Button ${rows.length + 1} added. Fill in the words and the link.`);
    setChangedAt(attempt);
    focusId.current = `link_label_${rows.length}`;
    onEdit();
  }

  function remove(index: number) {
    setRows(rows.filter((_, i) => i !== index));
    setNotice(`Button ${index + 1} removed.`);
    setChangedAt(attempt);
    focusId.current = ADD_BUTTON_ID;
    onEdit();
  }

  return (
    <>
      <p className={ds.subIntro}>
        Not sure where to find a link? Open the page in your browser and copy the address from the top. For Google
        reviews, your Google Business Profile has a link you can copy.
      </p>

      <p role="status" className={ds.srOnly}>
        {notice}
      </p>

      {rows.length === 0 ? (
        <p className={ds.subIntro}>You haven&apos;t added any buttons yet.</p>
      ) : (
        <ol className={ds.buttonList}>
          {rows.map((row, i) => {
            const label = `link_label_${i}`;
            const url = `link_url_${i}`;
            return (
              <li key={row.key} className={ds.buttonRow}>
                <div role="group" aria-labelledby={`link-row-${i}`}>
                  <div className={ds.buttonRowHead}>
                    <h3 id={`link-row-${i}`} className={ds.buttonName}>
                      Button {i + 1}
                    </h3>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.ghost} ${styles.btnSmall} ${ds.tap}`}
                      aria-label={`Remove button ${i + 1}`}
                      onClick={() => remove(i)}
                    >
                      Remove
                    </button>
                  </div>
                  <div className={`${styles.form} ${ds.buttonFields}`}>
                    <Field
                      name={label}
                      label="Words on the button"
                      value={row.label}
                      placeholder={LABEL_EXAMPLES[i % LABEL_EXAMPLES.length]}
                      hint={`What customers see, up to ${CUSTOM_LINK_LABEL_MAX} letters.`}
                      maxLength={CUSTOM_LINK_LABEL_MAX}
                      autoComplete="off"
                      error={showErrors ? errors[label] : undefined}
                    />
                    <Field
                      name={url}
                      label="Link"
                      value={row.url}
                      placeholder="https://"
                      inputMode="url"
                      hint="Where it goes. We'll add the https:// if you leave it off."
                      maxLength={CUSTOM_LINK_URL_MAX}
                      autoComplete="off"
                      tidy={(v) => tidyLink(v)}
                      error={showErrors ? errors[url] : undefined}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <div className={ds.buttonActions}>
        {full ? (
          <p className={ds.buttonLimit}>
            That&apos;s the most you can have ({MAX_CUSTOM_LINKS}). Remove one to add another.
          </p>
        ) : (
          <button id={ADD_BUTTON_ID} type="button" className={`${styles.btn} ${styles.ghost} ${ds.tap}`} onClick={add}>
            {rows.length === 0 ? "Add a button" : "Add another button"}
          </button>
        )}
      </div>
    </>
  );
}
