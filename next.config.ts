import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Card orders can include a logo (shrunk to <= 2 MB in the browser).
    serverActions: { bodySizeLimit: "3mb" },
  },
  async redirects() {
    return [
      // The card designer is switched off for now (every card is the standard
      // Tapfolio design). Remove this to bring it back; the code is in app/(marketing)/design.
      { source: "/design", destination: "/#order", permanent: false },
    ];
  },
  async rewrites() {
    return [
      // Cards are encoded in upper case (/C/7KQ2XMP); accept a typed /c/... too.
      { source: "/c/:id", destination: "/C/:id" },
    ];
  },
};

export default nextConfig;
