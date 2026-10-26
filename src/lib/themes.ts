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
  const preset = typeof t.preset === "string" && (t.preset in THEME_PRESETS || t.preset === "custom") ? (t.preset as ThemeChoice["preset"]) : "classic";
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
  const dark = isDark(base.card);
  const text = dark ? "#f4f5f7" : "#121614";
  return {
    "--bg": base.bg,
    "--card": base.card,
    "--text": text,
    "--muted": mix(text, base.card, 0.42),
    "--line": mix(text, base.card, 0.86),
    "--soft": mix(text, base.card, 0.93),
    "--accent": accent,
    "--accent-text": isDark(accent) ? "#ffffff" : "#111111",
    "--accent-soft": mix(accent, base.card, 0.85),
    "--banner-to": mix(accent, "#000000", 0.35),
    colorScheme: dark ? "dark" : "light",
  };
}
