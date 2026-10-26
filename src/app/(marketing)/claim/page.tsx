import type { Metadata } from "next";
import { CONTACT_EMAIL } from "@/lib/site";
import { CardNotice } from "../card/notice";

export const metadata: Metadata = { title: "Card not set up yet", robots: { index: false } };

// Unclaimed cards land here. Milestone 4 replaces this with the activation flow.
export default function ClaimPage() {
  return (
    <CardNotice title="This card isn't set up yet">
      <p>
        This Tapfolio card hasn&apos;t been linked to a profile yet. If it&apos;s yours, we&apos;ll have it ready for
        you shortly. Any questions, email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </CardNotice>
  );
}
