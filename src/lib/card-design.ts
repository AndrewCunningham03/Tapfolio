// Options for the card designer. Shared by the browser preview and the server
// that saves orders, so both always agree.
import type { PriceKey } from "./site";

export type Finish = "black" | "silver" | "gold" | "rose_gold";
export type Layout = "logo" | "name" | "minimal";

export const FINISHES: Record<Finish, { label: string; base: string; sheen: string; engrave: string; price: PriceKey }> = {
  // base/sheen: the metal; engrave: what laser-engraved marks look like on it.
  black: { label: "Matte black", base: "#1d1f22", sheen: "#2b2e33", engrave: "#c3c8cf", price: "card" },
  silver: { label: "Brushed silver", base: "#b9bec5", sheen: "#dfe3e8", engrave: "#3c4148", price: "card" },
  gold: { label: "Gold", base: "#c9a144", sheen: "#ecd48a", engrave: "#5e4512", price: "goldCard" },
  rose_gold: { label: "Rose gold", base: "#d29b86", sheen: "#f1c9b8", engrave: "#6a3a2c", price: "goldCard" },
};

export const LAYOUTS: Record<Layout, { label: string; hint: string }> = {
  logo: { label: "Logo first", hint: "Your logo large, name below" },
  name: { label: "Name first", hint: "Your name large, logo small" },
  minimal: { label: "Minimal", hint: "Just your logo, centred" },
};

export const LIMITS = { name: 40, title: 50, back: 40 } as const;

export type CardDesign = {
  finish: Finish;
  layout: Layout;
  name: string;
  title: string;
  backText: string;
  logoInvert: boolean;
};

export const DEFAULT_DESIGN: CardDesign = {
  finish: "black",
  layout: "name",
  name: "",
  title: "",
  backText: "",
  logoInvert: false,
};

export const isFinish = (v: unknown): v is Finish => typeof v === "string" && v in FINISHES;
export const isLayout = (v: unknown): v is Layout => typeof v === "string" && v in LAYOUTS;
