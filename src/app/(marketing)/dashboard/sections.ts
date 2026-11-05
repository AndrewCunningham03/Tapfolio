// The dashboard's sections, in page order. The jump menu, the set-up checklist
// and the sections themselves all use these ids, so a link can't point nowhere.
// (No section id may match a form field's id, e.g. "about" is the textarea.)
export const SECTIONS = {
  photo: { id: "photo", label: "Photo" },
  details: { id: "details", label: "About you" },
  contact: { id: "contact", label: "Contact" },
  buttons: { id: "buttons", label: "Buttons" },
  pay: { id: "get-paid", label: "Get paid" },
  socials: { id: "socials", label: "Socials" },
  privacy: { id: "hide-details", label: "Hide details" },
  address: { id: "page-address", label: "Page address" },
  colours: { id: "colours", label: "Colours" },
  gallery: { id: "gallery", label: "Gallery" },
} as const;

export const SECTION_ORDER = Object.values(SECTIONS);

/** Where the public page lives. Shown to customers and used for "Copy my link". */
export const PUBLIC_HOST = "tapfolio.co.uk";
