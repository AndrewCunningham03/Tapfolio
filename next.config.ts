import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Card orders can include a logo (shrunk to <= 2 MB in the browser).
    serverActions: { bodySizeLimit: "3mb" },
  },
  async rewrites() {
    return [
      // Cards are encoded in upper case (/C/7KQ2XMP); accept a typed /c/... too.
      { source: "/c/:id", destination: "/C/:id" },
    ];
  },
};

export default nextConfig;
