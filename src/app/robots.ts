import type { MetadataRoute } from "next";
import { SITE_URL } from "./site-url";

// Account and checkout pages stay out of search results. Each path is blocked
// exactly, with a query string, or below it ("$" ends a match), so profile
// pages whose address merely starts the same way (/start-electrical) stay visible.
const PRIVATE = ["/admin", "/dashboard", "/start", "/claim", "/login"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...PRIVATE.flatMap((path) => [`${path}$`, `${path}?`, `${path}/`]), "/api/", "/auth/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
