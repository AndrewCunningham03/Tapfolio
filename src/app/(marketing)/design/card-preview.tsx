"use client";

import { useId, useMemo } from "react";
import QRCode from "qrcode";
import { FINISHES, type CardDesign } from "@/lib/card-design";

// Card size in millimetres (CR80); the SVG works in the same units as the print files.
const W = 85.6;
const H = 53.98;
const M = 6; // margin
const SAMPLE_URL = "HTTPS://TAPFOLIO.CO.UK/C/7KQ2XMP";
const FONT = "var(--font-manrope), system-ui, sans-serif";

function useQrPath(size: number, x: number, y: number) {
  return useMemo(() => {
    const qr = QRCode.create(SAMPLE_URL, { errorCorrectionLevel: "M" });
    const n = qr.modules.size;
    const m = size / n;
    let d = "";
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.modules.get(r, c)) d += `M${x + c * m} ${y + r * m}h${m}v${m}h${-m}z`;
    return d;
  }, [size, x, y]);
}

/** Shrink long names so they always fit the card. */
const fitSize = (text: string, max: number, width: number) => Math.min(max, width / Math.max(text.length * 0.6, 1));

function Metal({ id, finish }: { id: string; finish: CardDesign["finish"] }) {
  const f = FINISHES[finish];
  return (
    <>
      <defs>
        <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={f.base} />
          <stop offset="0.45" stopColor={f.sheen} />
          <stop offset="0.6" stopColor={f.base} />
          <stop offset="1" stopColor={f.base} />
        </linearGradient>
        <pattern id={`${id}-brush`} width="0.6" height={H} patternUnits="userSpaceOnUse">
          <rect width="0.15" height={H} fill="#fff" opacity="0.05" />
        </pattern>
        <clipPath id={`${id}-clip`}>
          <rect width={W} height={H} rx="3.18" />
        </clipPath>
      </defs>
      <rect width={W} height={H} rx="3.18" fill={`url(#${id}-metal)`} />
      <rect width={W} height={H} rx="3.18" fill={`url(#${id}-brush)`} />
    </>
  );
}

function Contactless({ x, y, h, color }: { x: number; y: number; h: number; color: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${h / 24})`} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <path d="M6 8.5a6 6 0 0 1 0 7" />
      <path d="M10 6a10 10 0 0 1 0 12" />
      <path d="M14 3.5a14 14 0 0 1 0 17" />
    </g>
  );
}

function LogoBox({ logo, x, y, w, h, align, ink }: { logo?: string; x: number; y: number; w: number; h: number; align: "left" | "center"; ink: string }) {
  if (logo) {
    return <image href={logo} x={x} y={y} width={w} height={h} preserveAspectRatio={align === "left" ? "xMinYMid meet" : "xMidYMid meet"} />;
  }
  return (
    <g opacity="0.45">
      <rect x={x} y={y} width={w} height={h} rx="1.2" fill="none" stroke={ink} strokeWidth="0.25" strokeDasharray="1 0.8" />
      <text x={x + w / 2} y={y + h / 2 + 0.9} textAnchor="middle" fontSize="2.6" fill={ink} fontFamily={FONT} fontWeight="600">
        Your logo
      </text>
    </g>
  );
}

export function CardFront({ design, logo }: { design: CardDesign; logo?: string }) {
  const id = `card${useId().replace(/[^a-zA-Z0-9]/g, "")}`; // unique per card, so gradients never clash
  const ink = FINISHES[design.finish].engrave;
  const name = design.name.trim() || "Your Name";
  const title = design.title.trim();
  const nameOpacity = design.name.trim() ? 1 : 0.5;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Front of your card">
      <g clipPath={`url(#${id}-clip)`}>
        <Metal id={id} finish={design.finish} />
        <Contactless x={W - M - 5} y={M - 1} h={6} color={ink} />

        {design.layout === "name" && (
          <>
            <LogoBox logo={logo} x={M} y={M} w={24} h={11} align="left" ink={ink} />
            <text x={M} y={41} fontSize={fitSize(name, 5.4, W - 2 * M)} fontWeight="800" letterSpacing="-0.02em" fill={ink} opacity={nameOpacity} fontFamily={FONT}>
              {name}
            </text>
            {title && (
              <text x={M} y={46.8} fontSize="2.5" fontWeight="600" fill={ink} opacity="0.85" fontFamily={FONT}>
                {title}
              </text>
            )}
          </>
        )}

        {design.layout === "logo" && (
          <>
            <LogoBox logo={logo} x={M} y={M + 2} w={52} h={22} align="left" ink={ink} />
            <text x={M} y={42} fontSize={fitSize(name, 3.6, W - 2 * M)} fontWeight="800" fill={ink} opacity={nameOpacity} fontFamily={FONT}>
              {name}
            </text>
            {title && (
              <text x={M} y={47} fontSize="2.3" fontWeight="600" fill={ink} opacity="0.85" fontFamily={FONT}>
                {title}
              </text>
            )}
          </>
        )}

        {design.layout === "minimal" && (
          <>
            <LogoBox logo={logo} x={W / 2 - 22} y={H / 2 - 10} w={44} h={20} align="center" ink={ink} />
            {design.name.trim() && (
              <text x={W / 2} y={H - M} textAnchor="middle" fontSize="2.3" fontWeight="700" letterSpacing="0.12em" fill={ink} fontFamily={FONT}>
                {name.toUpperCase()}
              </text>
            )}
          </>
        )}
      </g>
    </svg>
  );
}

export function CardBack({ design }: { design: CardDesign }) {
  const id = `card${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const ink = FINISHES[design.finish].engrave;
  const base = FINISHES[design.finish].base;
  const panel = { size: 24, x: W - M - 24, y: (H - 24) / 2 };
  const qr = useQrPath(18, panel.x + 3, panel.y + 3);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Back of your card">
      <g clipPath={`url(#${id}-clip)`}>
        <Metal id={id} finish={design.finish} />
        <Contactless x={M - 1.5} y={9} h={7} color={ink} />
        <text x={M} y={24.5} fontSize="4.4" fontWeight="700" fill={ink} fontFamily={FONT}>
          Tap or scan
        </text>
        <text x={M} y={30} fontSize="2.3" fontWeight="500" fill={ink} opacity="0.9" fontFamily={FONT}>
          Hold near the top of a phone,
        </text>
        <text x={M} y={33.6} fontSize="2.3" fontWeight="500" fill={ink} opacity="0.9" fontFamily={FONT}>
          or scan the code with the camera.
        </text>
        {design.backText.trim() && (
          <text x={M} y={H - 7} fontSize="2.8" fontWeight="700" fill={ink} fontFamily={FONT}>
            {design.backText.trim()}
          </text>
        )}
        {/* Engraved panel; the QR modules are left as bare metal. */}
        <rect x={panel.x} y={panel.y} width={panel.size} height={panel.size} rx="2.2" fill={ink} />
        <path d={qr} fill={base} />
        <text x={W - M} y={H - 4.5} textAnchor="end" fontSize="1.9" fontWeight="800" fill={ink} opacity="0.7" fontFamily={FONT}>
          Tapfolio
        </text>
      </g>
    </svg>
  );
}
