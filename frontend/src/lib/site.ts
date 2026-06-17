/*
 * The canonical public origin of the deployed app, used for SEO metadata
 * (metadataBase, canonical URLs, Open Graph, robots, sitemap). Override per
 * environment with NEXT_PUBLIC_SITE_URL; defaults to the production domain.
 * No trailing slash so `${SITE_URL}/path` is always well-formed.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://surgeshield.online"
).replace(/\/+$/, "");

export const SITE_NAME = "SurgeShield";

export const SITE_DESCRIPTION =
  "SurgeShield is an AI-powered flood prediction and analytics platform: " +
  "real-time risk scoring, interactive flood-risk maps, and transparent, " +
  "honestly-reported model metrics.";
