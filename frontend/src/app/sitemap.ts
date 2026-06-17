import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/*
 * Served at /sitemap.xml. Lists the public, indexable pages so Google can
 * discover and rank them. Only marketing/content routes belong here — the
 * signed-in app is disallowed in robots.ts. /sitemap.xml is whitelisted in
 * proxy.ts so the crawler is not redirected to sign-in.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { path: "", priority: 1, changeFrequency: "weekly" as const },
    { path: "/about", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/contact", priority: 0.6, changeFrequency: "monthly" as const },
  ].map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
