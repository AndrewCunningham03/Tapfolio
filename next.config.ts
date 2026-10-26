import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  async rewrites() {
    return [
      // Cards are encoded in upper case (/C/7KQ2XMP); accept a typed /c/... too.
      { source: "/c/:id", destination: "/C/:id" },
    ];
  },
};

export default nextConfig;
