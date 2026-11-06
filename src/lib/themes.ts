// Colour themes for customers' public profile pages. Shared by the profile
// page (server) and the dashboard's page designer (browser).

export const THEME_PRESETS = {
  classic: { label: "Classic", bg: "#f4f7f5", card: "#ffffff", accent: "#178046" },
  midnight: { label: "Midnight", bg: "#09090a", card: "#141416", accent: "#c9ced6" },
  forest: { label: "Forest", bg: "#0b1f17", card: "#12291f", accent: "#facc15" },
  sand: { label: "Sand", bg: "#f3ece1", card: "#fffaf2", accent: "#a85a1c" },
  ocean: { label: "Ocean", bg: "#0b1726", card: "#112238", accent: "#38bdf8" },
  blush: { label: "Blush", bg: "#fbf0f2", card: "#ffffff", accent: "#be3a64" },
  // Added for trades and small businesses. Every one passes the readable-text rules in themeVars
  // (text 7:1, secondary text 4.6:1, text on the accent 4.5:1) and its accent reads at 4.5:1 on its card.
  workwear: { label: "Workwear", bg: "#17181a", card: "#232528", accent: "#ffc61a" },
  barbershop: { label: "Barbershop", bg: "#0b0b0b", card: "#171615", accent: "#d4a847" },
  salon: { label: "Salon", bg: "#e8eee6", card: "#fcfdfb", accent: "#4f7358" },
  slate: { label: "Slate", bg: "#e3e8ee", card: "#ffffff", accent: "#3f5a7a" },
  terracotta: { label: "Terracotta", bg: "#1d110d", card: "#2a1812", accent: "#e9855a" },
  navy: { label: "Navy", bg: "#0f2342", card: "#ffffff", accent: "#1e4f8f" },
  graphite: { label: "Graphite", bg: "#121212", card: "#1e1e20", accent: "#ff7a2f" },
  lavender: { label: "Lavender", bg: "#ece7f5", card: "#ffffff", accent: "#6b4fa3" },
} as const;

export type PresetId = keyof typeof THEME_PRESETS;

/** Typefaces a customer can pick for their public page. `stack` is the CSS font-family. */
export const FONT_OPTIONS = {
  // The phone's own interface font (SF on iPhone, Roboto on Android, Segoe UI on Windows).
  clean: { label: "Clean", stack: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' },
  // Georgia on iPhone, Mac and Windows; Android has no Georgia, so it gets Noto Serif.
  classic: { label: "Classic", stack: 'Georgia, "Noto Serif", "Times New Roman", serif' },
  // A heavy face for headings: Arial Black (Windows, Mac), Avenir Next Heavy (iPhone), Roboto Black (Android).
  // The page sets headings in it at weight 900 and keeps reading text in the clean sans-serif.
  bold: {
    label: "Bold",
    stack: '"Arial Black", "Avenir Next", Roboto, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
  },
} as const;
export type FontId = keyof typeof FONT_OPTIONS;

/** Shapes for the page's buttons. `outline` also changes the fill (see the data-buttons attribute). */
export const BUTTON_STYLES = {
  rounded: { label: "Rounded", radius: "14px" },
  square: { label: "Square", radius: "4px" },
  outline: { label: "Outline", radius: "14px" },
} as const;
export type ButtonStyleId = keyof typeof BUTTON_STYLES;

export type ThemeChoice = {
  preset: PresetId | "custom";
  accent?: string;
  background?: string;
  font?: FontId;
  buttons?: ButtonStyleId;
};

const HEX = /^#[0-9a-f]{6}$/i;
export const isHex = (v: unknown): v is string => typeof v === "string" && HEX.test(v);

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const isDark = (hex: string) => luminance(hex) < 0.22;

/** WCAG contrast ratio between two #rrggbb colours (1 to 21). */
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Whichever of two colours reads better on `bg`. */
const readableOn = (bg: string, a: string, b: string) => (contrast(a, bg) >= contrast(b, bg) ? a : b);

/** Blend two #rrggbb colours; amount 0 = a, 1 = b. */
function mix(a: string, b: string, amount: number): string {
  const ch = (hex: string, i: number) => parseInt(hex.slice(i, i + 2), 16);
  return (
    "#" +
    [1, 3, 5]
      .map((i) => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * amount).toString(16).padStart(2, "0"))
      .join("")
  );
}

/** Clean whatever was stored or submitted into a valid choice. */
export function normaliseTheme(raw: unknown): ThemeChoice {
  const t = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const preset = typeof t.preset === "string" && (Object.hasOwn(THEME_PRESETS, t.preset) || t.preset === "custom") ? (t.preset as ThemeChoice["preset"]) : "classic";
  const choice: ThemeChoice = { preset };
  if (isHex(t.accent)) choice.accent = t.accent.toLowerCase();
  if (preset === "custom") choice.background = isHex(t.background) ? t.background.toLowerCase() : "#ffffff";
  if (typeof t.font === "string" && Object.hasOwn(FONT_OPTIONS, t.font)) choice.font = t.font as FontId;
  if (typeof t.buttons === "string" && Object.hasOwn(BUTTON_STYLES, t.buttons)) choice.buttons = t.buttons as ButtonStyleId;
  return choice;
}

/**
 * The CSS custom properties for a theme. Text colours are worked out from the
 * background, so any colour a customer picks stays readable.
 */
export function themeVars(choice: ThemeChoice): Record<string, string> {
  const base =
    choice.preset === "custom"
      ? (() => {
          const bg = choice.background ?? "#ffffff";
          return { bg, card: isDark(bg) ? mix(bg, "#ffffff", 0.06) : mix(bg, "#ffffff", 0.6), accent: isDark(bg) ? "#e5e7eb" : "#178046" };
        })()
      : THEME_PRESETS[choice.preset];

  const accent = choice.accent ?? base.accent;
  const text = readableOn(base.card, "#f4f5f7", "#121614");
  const dark = text === "#f4f5f7";
  // A mid-tone custom colour can't carry text well either way, so nudge the
  // card away from the text until it can (the presets never need this).
  let card = base.card;
  while (contrast(text, card) < 7) card = mix(card, dark ? "#000000" : "#ffffff", 0.1);
  // Secondary text: as soft as possible while still passing WCAG AA (4.5:1).
  let fade = 0.42;
  while (contrast(mix(text, card, fade), card) < 4.6) fade -= 0.02;
  const onAccent = readableOn(accent, "#ffffff", "#111111");
  return {
    "--bg": base.bg,
    "--card": card,
    "--text": text,
    "--muted": mix(text, card, fade),
    "--line": mix(text, card, 0.86),
    "--soft": mix(text, card, 0.93),
    "--accent": accent,
    "--accent-text": contrast(onAccent, accent) >= 4.5 ? onAccent : readableOn(accent, "#ffffff", "#000000"),
    "--accent-soft": mix(accent, card, 0.85),
    "--banner-to": mix(accent, "#000000", 0.35),
    "--tf-font": FONT_OPTIONS[choice.font ?? "clean"].stack,
    "--btn-radius": BUTTON_STYLES[choice.buttons ?? "rounded"].radius,
    colorScheme: dark ? "dark" : "light",
  };
}

/** Attributes for the page's outermost element, so CSS can switch on font and button style. */
export function themeAttrs(choice: ThemeChoice): { "data-font": FontId; "data-buttons": ButtonStyleId } {
  return { "data-font": choice.font ?? "clean", "data-buttons": choice.buttons ?? "rounded" };
}
