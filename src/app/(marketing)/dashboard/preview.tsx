"use client";

import { useId, useState } from "react";
import { themeAttrs, themeVars, type ThemeChoice } from "@/lib/themes";
import x from "./design-extras.module.css";

export type PreviewLink = { label: string; url: string };

export type PagePreviewProps = {
  /** The look to show. Changes show straight away: nothing here is saved. */
  theme: ThemeChoice;
  name: string;
  jobTitle?: string | null;
  organisation?: string | null;
  /** Saved profile photo and cover (public storage URLs). */
  photoUrl?: string;
  coverUrl?: string;
  /** The customer's own link buttons. Nothing is drawn unless some are given. */
  customLinks?: PreviewLink[];
  /** True while the look on screen differs from the saved one. */
  unsaved?: boolean;
};

/** Link buttons drawn in the preview; the rest are summed up in one line. */
const MAX_LINKS = 3;

const initialsOf = (name: string) => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "";
  return (words[0][0] + (words.length > 1 ? words[words.length - 1][0] : "")).toUpperCase();
};

// Small stroke icons, drawn here so the preview needs nothing from the public page's files.
function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}
const AddContactIcon = () => (
  <Icon>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M19 8v6M16 11h6" />
  </Icon>
);
const PhoneIcon = () => (
  <Icon>
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z" />
  </Icon>
);
const TextIcon = () => (
  <Icon>
    <path d="M4 5h16v11H9l-5 4z" />
  </Icon>
);
const MailIcon = () => (
  <Icon>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </Icon>
);

/**
 * A phone-shaped, simplified copy of the customer's public page. It is drawn
 * from the same theme helpers as the real page (themeVars and themeAttrs), so
 * what changes here is what visitors will see once the look is saved. Nothing
 * in it can be tapped, and it fetches nothing of its own.
 */
export function PagePreview({
  theme,
  name,
  jobTitle,
  organisation,
  photoUrl,
  coverUrl,
  customLinks,
  unsaved,
}: PagePreviewProps) {
  // On a phone only the top of the page shows, to leave room for the controls. This opens the rest.
  const [whole, setWhole] = useState(false);
  const frameId = useId();
  const links = (customLinks ?? []).filter((l) => l.label.trim() !== "");
  const shown = links.slice(0, MAX_LINKS);
  const hidden = links.length - shown.length;
  const title = name.trim() || "Your name";
  const summary = [title, organisation, jobTitle].filter(Boolean).join(", ");

  return (
    <div className={x.previewWrap} data-whole={whole}>
      <div
        id={frameId}
        className={x.frame}
        role="img"
        aria-label={`Preview of your page: ${summary}. It shows the colours, font and button style you have chosen.`}
      >
        <div className={x.screen} style={themeVars(theme) as React.CSSProperties} {...themeAttrs(theme)}>
          <div className={x.banner}>
            {/* eslint-disable-next-line @next/next/no-img-element -- user upload */}
            {coverUrl && <img src={coverUrl} alt="" />}
          </div>
          <div className={x.avatar}>
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- user upload
              <img src={photoUrl} alt="" />
            ) : (
              <span className={x.initials}>{initialsOf(name)}</span>
            )}
          </div>

          <div className={x.intro}>
            <p className={x.name}>{title}</p>
            {organisation && <p className={x.org}>{organisation}</p>}
            {jobTitle && <p className={x.role}>{jobTitle}</p>}
          </div>

          <span className={x.save}>
            <AddContactIcon />
            Save contact
          </span>

          <div className={x.quick}>
            <span>
              <PhoneIcon />
              Call
            </span>
            <span>
              <TextIcon />
              Text
            </span>
            <span>
              <MailIcon />
              Email
            </span>
          </div>

          {shown.length > 0 && (
            <div className={x.links}>
              {shown.map((l, i) => (
                <span key={`${i}-${l.url}`} className={x.link}>
                  {l.label}
                </span>
              ))}
              {hidden > 0 && <span className={x.moreLinks}>+ {hidden} more</span>}
            </div>
          )}

          <div className={x.about}>
            <i />
            <i />
            <i />
          </div>
        </div>
      </div>

      <div className={x.previewBar}>
        <span className={x.previewState} data-unsaved={unsaved ? "true" : "false"}>
          {unsaved ? "Not saved yet" : "Preview"}
        </span>
        <button
          type="button"
          className={x.wholeToggle}
          aria-expanded={whole}
          aria-controls={frameId}
          aria-label={whole ? "Show less of the preview" : "Show all of the preview"}
          onClick={() => setWhole((w) => !w)}
        >
          {whole ? "Show less" : "Show all"}
        </button>
      </div>
    </div>
  );
}
