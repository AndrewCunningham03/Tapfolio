import type { Metadata } from "next";
import { SITE_URL } from "./site-url";
import "./globals.css";

export const metadata: Metadata = {
  // Link previews (Facebook, WhatsApp, X) need absolute URLs; relative ones resolve against the live site.
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Tapfolio · A business card that opens your own page",
    template: "%s · Tapfolio",
  },
  description:
    "A metal NFC and QR business card for the UK and Ireland. Customers tap or scan it to save your contact, call you or pay you. Update your page any time without reprinting.",
  applicationName: "Tapfolio",
  openGraph: { siteName: "Tapfolio", type: "website", locale: "en_GB" },
  twitter: { card: "summary" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
