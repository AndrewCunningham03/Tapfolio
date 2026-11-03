import type { Metadata } from "next";
import { CardNotice } from "../notice";

export const metadata: Metadata = { title: "Card paused", robots: { index: false } };

export default function PausedCardPage() {
  return (
    <CardNotice title="This card is paused">
      <p>
        The owner of this card needs to update their payment details. It will start working again as soon as they do. If
        this is your card, sign in at tapfolio.co.uk to put it right.
      </p>
    </CardNotice>
  );
}
