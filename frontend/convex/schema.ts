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

  savedLocations: defineTable({
    userId: v.string(),
    name: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    lastRiskLevel: riskLevel,
    lastChecked: v.number(),
  }).index("by_user", ["userId"]),

  systemStats: defineTable({
    totalPredictions: v.number(),
    totalUsers: v.number(),
    floodDetectedCount: v.number(),
    lastUpdated: v.number(),
  }),
});
