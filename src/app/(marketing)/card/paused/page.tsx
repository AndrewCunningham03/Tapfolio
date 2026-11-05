import type { Metadata } from "next";
import { CardNotice, NoticeAside, OwnerSignIn } from "../notice";

export const metadata: Metadata = { title: "Card paused", robots: { index: false } };

export default function PausedCardPage() {
  return (
    <CardNotice title="This card is paused" tone="paused">
      <p>
        The page behind this card is switched off for now. It will be back as soon as its owner updates their payment
        details. Until then, use the number or email they gave you.
      </p>
      <NoticeAside action={<OwnerSignIn label="Sign in to update payment" />}>
        <p>
          Sign in and update your payment details. Your card and page come back as soon as the payment goes through.
        </p>
      </NoticeAside>
    </CardNotice>
  );
}
