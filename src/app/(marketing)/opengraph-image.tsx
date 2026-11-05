import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { formatPrice, PRICES } from "@/lib/site";

// The picture Facebook, WhatsApp and X show when a marketing page is shared.
// Built once at build time from the real card artwork and the current prices.

const start = formatPrice(PRICES.GBP.start, "GBP");
const monthly = formatPrice(PRICES.GBP.monthly, "GBP");

export const alt = `Tapfolio: a metal business card that opens your own page. ${start} to start, then ${monthly} a month.`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const art = (file: string) =>
  `data:image/png;base64,${readFileSync(join(process.cwd(), "public/cards", file)).toString("base64")}`;
const cardFront = art("metal-front.png");
const cardBack = art("metal-back.png");

const TEXT = "#f2f3f5";
const MUTED = "#9a9fa8";
const GREEN = "#1f9d55";
const YELLOW = "#facc15";

// The bundled font has one weight, so a thin stroke in the text colour stands in for bold.
const bold = (color: string, width = 2) => ({ color, WebkitTextStroke: `${width}px ${color}` });

const HEADLINE: [string, string][] = [
  ["A", TEXT],
  ["business", TEXT],
  ["card", TEXT],
  ["that", TEXT],
  ["opens", TEXT],
  ["your", YELLOW],
  ["own", YELLOW],
  ["page.", YELLOW],
];

const CARD = { width: 540, height: 341 };
const cardStyle = {
  position: "absolute" as const,
  borderRadius: 24,
  boxShadow: "0 40px 80px rgba(0, 0, 0, 0.7)",
};

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        backgroundColor: "#09090a",
        backgroundImage:
          "radial-gradient(circle at 82% 22%, rgba(31, 157, 85, 0.32), transparent 52%), radial-gradient(circle at 0% 0%, rgba(250, 204, 21, 0.12), transparent 42%)",
        color: TEXT,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain <img> */}
      <img
        src={cardBack}
        alt=""
        {...CARD}
        style={{ ...cardStyle, right: -70, top: 40, transform: "rotate(9deg)", opacity: 0.8 }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain <img> */}
      <img src={cardFront} alt="" {...CARD} style={{ ...cardStyle, right: 30, top: 248, transform: "rotate(-7deg)" }} />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: 700,
          height: "100%",
          padding: "60px 0 56px 72px",
        }}
      >
        <div style={{ display: "flex", fontSize: 54 }}>
          <span style={bold(GREEN, 2.5)}>Tap</span>
          {/* Two spans sit a space apart in Satori; pull "folio" back so the wordmark reads as one word. */}
          <span style={{ ...bold(YELLOW, 2.5), marginLeft: -10 }}>folio</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", flexWrap: "wrap", fontSize: 78, lineHeight: 1.04, letterSpacing: -3 }}>
            {HEADLINE.map(([word, color]) => (
              <span key={word} style={{ ...bold(color, 2.5), marginRight: 20 }}>
                {word}
              </span>
            ))}
          </div>
          <div style={{ display: "flex", marginTop: 30, fontSize: 34, color: MUTED }}>
            <span style={{ ...bold(TEXT, 1), marginRight: 10 }}>{start} to start,</span>
            <span style={{ marginRight: 10 }}>then</span>
            <span style={bold(TEXT, 1)}>{monthly} a month</span>
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 26, color: MUTED }}>Metal NFC and QR card · UK and Ireland</div>
      </div>
    </div>,
    size,
  );
}
