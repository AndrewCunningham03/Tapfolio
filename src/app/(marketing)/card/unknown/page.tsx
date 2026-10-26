import type { Metadata } from "next";
import { CardNotice } from "../notice";

export const metadata: Metadata = { title: "Card not found", robots: { index: false } };

export default function UnknownCardPage() {
  return (
    <CardNotice title="We couldn't find that card">
      <p>The link on this card doesn&apos;t match any Tapfolio card. If you typed it in, check it and try again.</p>
    </CardNotice>
  );
}
