import type { Metadata, Viewport } from "next";
import { CurrencyProvider } from "./currency";
import { SiteShell } from "./site-shell";

// Marketing pages share the large link-preview image (opengraph-image.tsx in this
// folder). Profile pages keep the root's small card, which suits a square photo.
export const metadata: Metadata = { twitter: { card: "summary_large_image" } };

// Mobile browsers tint their toolbar to match the dark site.
export const viewport: Viewport = { themeColor: "#09090a" };

export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <CurrencyProvider>
      <SiteShell>{children}</SiteShell>
    </CurrencyProvider>
  );
}
