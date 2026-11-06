import type { Metadata } from "next";
import { CardNotice } from "../card/notice";

export const metadata: Metadata = { title: "Example button", robots: { index: false } };

// The buttons on the demo profile on the homepage lead here, because the demo business isn't real.
export default function ExampleButtonPage() {
  return (
    <CardNotice title="This is an example button" tone="setup">
      <p>
        You tapped a button on a demo page. On your own Tapfolio page, a button like this can open your quote form,
        your price list, your photos or your Google reviews: whatever you want customers to do next.
      </p>
      <p>You can add up to six of your own, with your own words and links.</p>
    </CardNotice>
  );
}
