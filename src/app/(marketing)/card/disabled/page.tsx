import type { Metadata } from "next";
import { CardNotice } from "../notice";

export const metadata: Metadata = { title: "Card deactivated", robots: { index: false } };

export default function DisabledCardPage() {
  return (
    <CardNotice title="This card has been deactivated">
      <p>The owner has switched this card off, for example because it was lost or replaced.</p>
    </CardNotice>
  );
}
