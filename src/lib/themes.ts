// Colour themes for customers' public profile pages. Shared by the profile
// page (server) and the dashboard's page designer (browser).

export const THEME_PRESETS = {
  classic: { label: "Classic", bg: "#f4f7f5", card: "#ffffff", accent: "#178046" },
  midnight: { label: "Midnight", bg: "#09090a", card: "#141416", accent: "#c9ced6" },
  forest: { label: "Forest", bg: "#0b1f17", card: "#12291f", accent: "#facc15" },
  sand: { label: "Sand", bg: "#f3ece1", card: "#fffaf2", accent: "#a85a1c" },
  ocean: { label: "Ocean", bg: "#0b1726", card: "#112238", accent: "#38bdf8" },
  blush: { label: "Blush", bg: "#fbf0f2", card: "#ffffff", accent: "#be3a64" },
} as const;

export type PresetId = keyof typeof THEME_PRESETS;
export type ThemeChoice = { preset: PresetId | "custom"; accent?: string; background?: string };

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
    colorScheme: dark ? "dark" : "light",
  };
}
