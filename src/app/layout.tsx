import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Tapfolio · Tap-to-share business cards",
    template: "%s · Tapfolio",
  },
  description:
    "NFC and QR business cards. One tap opens your profile, one more saves your contact. Update your details any time without reprinting.",
  openGraph: { siteName: "Tapfolio", type: "website" },
  twitter: { card: "summary" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
