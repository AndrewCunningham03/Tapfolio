import "server-only";
import { createHash, randomInt } from "node:crypto";

// Crockford base32: no I, L, O or U, so IDs can't be misread or spell words.
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export const CARD_ID_LENGTH = 7; // 32^7 ≈ 34 billion
export const CLAIM_CODE_LENGTH = 12; // 32^12 ≈ 10^18, shown as XXXX-XXXX-XXXX

function randomString(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

/** Map what someone typed onto the alphabet: upper case, drop dashes/spaces, O→0, I/L→1. */
export function normalise(input: string): string {
  return input
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, "")
    .replace(/O/g, "0")
    .replace(/[IL]/g, "1");
}

export function newCardId(): string {
  return randomString(CARD_ID_LENGTH);
}

export function isCardId(value: string): boolean {
  return value.length === CARD_ID_LENGTH && [...value].every((c) => ALPHABET.includes(c));
}

/** Returns the code in its printed form, e.g. "7KQ2-XMPA-4RD9". */
export function newClaimCode(): string {
  return randomString(CLAIM_CODE_LENGTH).replace(/(.{4})(?=.)/g, "$1-");
}

/** SHA-256 of the normalised code. Matches the hash in supabase/seed.sql. */
export function hashClaimCode(code: string): string {
  return createHash("sha256").update(normalise(code)).digest("hex");
}
