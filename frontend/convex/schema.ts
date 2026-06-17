import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/*
 * SurgeShield data model (per PROJECT_STRUCTURE.md). Lives in frontend/convex
 * so the CLI, codegen, and the app's `convex/_generated` imports are colocated.
 *
 * Shared validators are exported so the function files reuse the exact same
 * shapes in their argument lists.
 */

export const riskLevel = v.union(
  v.literal("Low"),
  v.literal("Moderate"),
  v.literal("High"),
  v.literal("Critical"),
);

export const weatherSource = v.union(v.literal("live"), v.literal("manual"));

/** The 11 model features (tidy keys mirror ml-api's clean.py RENAME_MAP). */
export const predictionInputs = v.object({
  rainfall: v.number(),
  temperature: v.number(),
  humidity: v.number(),
  riverDischarge: v.number(),
  waterLevel: v.number(),
  elevation: v.number(),
  landCover: v.string(),
  soilType: v.string(),
  populationDensity: v.number(),
  infrastructure: v.number(), // binary 0/1
  historicalFloods: v.number(), // binary 0/1
});

export const topFactors = v.array(
  v.object({ feature: v.string(), contribution: v.number() }),
);

export default defineSchema({
  predictions: defineTable({
    userId: v.string(), // Clerk user id (identity.subject)
    inputs: predictionInputs,
    result: v.boolean(), // flood predicted?
    probability: v.number(), // 0–1
    riskLevel,
    topFactors,
    latitude: v.optional(v.number()), // map only, not a model input
    longitude: v.optional(v.number()),
    locationName: v.optional(v.string()),
    weatherSource, // provenance: "live" | "manual"
    weatherFetchedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_createdAt", ["createdAt"]),

  // Lightweight user directory, upserted whenever someone saves a prediction.
  // Clerk is the source of truth for auth; this just lets the admin overview
  // show real names/roles/activity without calling the Clerk backend API.
  users: defineTable({
    userId: v.string(), // Clerk identity.subject
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    role: v.optional(v.string()), // "admin" | "user" (from public_metadata)
    firstSeen: v.number(),
    lastActiveAt: v.number(),
  }).index("by_userId", ["userId"]),

  // Per-user app preferences (notifications + units/display). One row per user,
  // upserted from the Settings page. Stored here rather than Clerk so the data
  // is queryable server-side and cleaned up with the rest of the user's data.
  userSettings: defineTable({
    userId: v.string(), // Clerk identity.subject
    notifyHighRisk: v.boolean(),
    notifyWeekly: v.boolean(),
    notifyProduct: v.boolean(),
    units: v.union(v.literal("metric"), v.literal("imperial")),
    tempUnit: v.union(v.literal("C"), v.literal("F")),
    mapStyle: v.union(v.literal("dark"), v.literal("light")),
    landingPage: v.string(), // e.g. "/dashboard"
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  savedLocations: defineTable({
    userId: v.string(),
    name: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    // Optional: a place can be bookmarked from the map before any prediction
    // ("Unchecked"); it gets a real risk once a prediction is run + saved.
    lastRiskLevel: v.optional(riskLevel),
    lastChecked: v.number(),
  }).index("by_user", ["userId"]),

  // Public contact-form submissions (no auth required to insert). Surfaced to
  // admins later; for now they're simply persisted so the form genuinely works.
  contactMessages: defineTable({
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    organization: v.optional(v.string()),
    topic: v.string(),
    message: v.string(),
    createdAt: v.number(),
  }).index("by_createdAt", ["createdAt"]),

  systemStats: defineTable({
    totalPredictions: v.number(),
    totalUsers: v.number(),
    floodDetectedCount: v.number(),
    lastUpdated: v.number(),
  }),
});
