import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./helpers";

/** Admin: system-wide totals for the admin overview. */
export const getSystemOverview = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const predictions = await ctx.db.query("predictions").collect();
    const users = new Set(predictions.map((p) => p.userId));
    return {
      totalPredictions: predictions.length,
      totalUsers: users.size,
      floodDetectedCount: predictions.filter((p) => p.result).length,
    };
  },
});

/** Admin: recent prediction activity across all users. */
export const getActivityFeed = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("predictions")
      .withIndex("by_createdAt")
      .order("desc")
      .take(limit ?? 25);
  },
});
