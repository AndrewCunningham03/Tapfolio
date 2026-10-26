import type { Profile, SocialNetwork } from "./profiles";

const SOCIAL_LABELS: Record<SocialNetwork, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  x: "X",
  whatsapp: "WhatsApp",
};

// Escape a text value per RFC 6350 §3.4.
function esc(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/[,;]/g, (c) => `\\${c}`);
}

// Fold lines longer than 75 octets (RFC 6350 §3.2), without splitting a UTF-8 character.
function fold(line: string): string {
  const out: string[] = [];
  let current = "";
  let bytes = 0;
  for (const ch of line) {
    const size = new TextEncoder().encode(ch).length;
    const limit = out.length === 0 ? 75 : 74; // continuation lines start with a space
    if (bytes + size > limit) {
      out.push(current);
      current = "";
      bytes = 0;
    }
    current += ch;
    bytes += size;
  }
  out.push(current);
  return out.join("\r\n ");
}

/** Build a vCard 3.0 (the version iOS and Android both import reliably). */
export function buildVCard(p: Profile, profileUrl: string): string {
  const words = p.fullName.trim().split(/\s+/);
  const given = words[0] ?? "";
  const family = words.length > 1 ? words[words.length - 1] : "";
  const middle = words.slice(1, -1).join(" ");

  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${esc(family)};${esc(given)};${esc(middle)};;`,
    `FN:${esc(p.fullName)}`,
  ];
  if (p.organisation) lines.push(`ORG:${esc(p.organisation)}`);
  if (p.jobTitle) lines.push(`TITLE:${esc(p.jobTitle)}`);
  if (p.phone) lines.push(`TEL;TYPE=CELL,VOICE:${esc(p.phone)}`);
  if (p.email) lines.push(`EMAIL;TYPE=INTERNET,WORK:${esc(p.email)}`);
  if (p.website) lines.push(`URL;TYPE=WORK:${esc(p.website)}`);
  if (p.street || p.city || p.postcode) {
    const adr = ["", "", p.street ?? "", p.city ?? "", "", p.postcode ?? "", p.country ?? ""].map(esc).join(";");
    lines.push(`ADR;TYPE=WORK:${adr}`);
  }

  // Labelled URLs (itemN.X-ABLabel) show as "LinkedIn", "Instagram" etc. on iPhone.
  let item = 1;
  for (const [network, url] of Object.entries(p.socials) as [SocialNetwork, string][]) {
    if (!url) continue;
    lines.push(`item${item}.URL:${esc(url)}`, `item${item}.X-ABLabel:${SOCIAL_LABELS[network]}`);
    item++;
  }
  lines.push(`item${item}.URL:${esc(profileUrl)}`, `item${item}.X-ABLabel:Tapfolio profile`);

  if (p.about) lines.push(`NOTE:${esc(p.about)}`);
  lines.push("END:VCARD");

  return lines.map(fold).join("\r\n") + "\r\n";
}

export function vCardFilename(p: Profile): string {
  return `${p.fullName.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "contact"}.vcf`;
}
