import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/*
 * Served at /robots.txt. Lets crawlers index the public marketing pages while
 * keeping the signed-in app (and auth callbacks) out of search results. Points
 * Google at the sitemap. /robots.txt is whitelisted in proxy.ts so Clerk does
 * not redirect the crawler to sign-in.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/predict",
        "/map",
        "/history",
        "/analytics",
        "/admin",
        "/continue",
        "/sso-callback",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
