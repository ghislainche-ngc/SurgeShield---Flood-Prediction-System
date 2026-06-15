import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { predictionInputs, riskLevel, topFactors, weatherSource } from "./schema";
import { requireUser, requireAdmin, touchUser } from "./helpers";

/** Persist a completed prediction for the signed-in user. */
export const savePrediction = mutation({
  args: {
    inputs: predictionInputs,
    result: v.boolean(),
    probability: v.number(),
    riskLevel,
    topFactors,
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    locationName: v.optional(v.string()),
    weatherSource,
    weatherFetchedAt: v.optional(v.number()),
  },
  // Explicit return type breaks the circular inference when the predict
  // action calls this via ctx.runMutation (api references this file).
  handler: async (ctx, args): Promise<Id<"predictions">> => {
    // touchUser records the user in the directory and returns their id.
    const userId = await touchUser(ctx);
    return await ctx.db.insert("predictions", {
      ...args,
      userId,
      createdAt: Date.now(),
    });
  },
});

/** Delete one of the current user's predictions (ownership enforced). */
export const deletePrediction = mutation({
  args: { id: v.id("predictions") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const row = await ctx.db.get(id);
    if (!row) throw new Error("Prediction not found.");
    if (row.userId !== userId) throw new Error("Not your prediction.");
    await ctx.db.delete(id);
  },
});

/** All of the current user's predictions, newest first. */
export const getUserPredictions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    return await ctx.db
      .query("predictions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

/** The user's N most recent predictions (default 5) — for the dashboard. */
export const getRecentPredictions = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const userId = await requireUser(ctx);
    return await ctx.db
      .query("predictions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit ?? 5);
  },
});

/** Aggregate counts for the current user — for the dashboard stat cards. */
export const getPredictionStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const rows = await ctx.db
      .query("predictions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return {
      total: rows.length,
      floodDetected: rows.filter((r) => r.result).length,
      highRisk: rows.filter(
        (r) => r.riskLevel === "High" || r.riskLevel === "Critical",
      ).length,
      thisWeek: rows.filter((r) => r.createdAt >= weekAgo).length,
    };
  },
});

/** Admin: every prediction across all users, newest first. */
export const getAllPredictions = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("predictions")
      .withIndex("by_createdAt")
      .order("desc")
      .take(limit ?? 100);
  },
});
