import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { riskLevel } from "./schema";
import { requireUser, requireAdmin } from "./helpers";

/** Save (bookmark) a location for the signed-in user. */
export const saveLocation = mutation({
  args: {
    name: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    lastRiskLevel: riskLevel,
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    return await ctx.db.insert("savedLocations", {
      ...args,
      userId,
      lastChecked: Date.now(),
    });
  },
});

/** Delete one of the current user's saved locations (ownership enforced). */
export const deleteLocation = mutation({
  args: { id: v.id("savedLocations") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const loc = await ctx.db.get(id);
    if (!loc) throw new Error("Location not found.");
    if (loc.userId !== userId) throw new Error("Not your location.");
    await ctx.db.delete(id);
  },
});

/** The current user's saved locations. */
export const getUserLocations = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    return await ctx.db
      .query("savedLocations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

/** Admin: all saved locations across users. */
export const getAllLocations = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("savedLocations").collect();
  },
});
