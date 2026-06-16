import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./helpers";

/*
 * Per-user Settings. The single `userSettings` row holds notification and
 * units/display preferences; `deleteMyAccount` removes every trace of the
 * caller's data (predictions, saved locations, settings, directory entry).
 * Clerk owns identity, connected accounts, and sessions — those are managed
 * client-side; this file only governs the data SurgeShield itself stores.
 */

/** Applied when a user has never saved settings, and when creating their row. */
export const DEFAULT_SETTINGS = {
  notifyHighRisk: true,
  notifyWeekly: true,
  notifyProduct: false,
  units: "metric" as const,
  tempUnit: "C" as const,
  mapStyle: "dark" as const,
  landingPage: "/dashboard",
};

/** The caller's settings, falling back to defaults when no row exists yet. */
export const getMySettings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const row = await ctx.db
      .query("userSettings")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!row) return { ...DEFAULT_SETTINGS, updatedAt: null as number | null };
    return {
      notifyHighRisk: row.notifyHighRisk,
      notifyWeekly: row.notifyWeekly,
      notifyProduct: row.notifyProduct,
      units: row.units,
      tempUnit: row.tempUnit,
      mapStyle: row.mapStyle,
      landingPage: row.landingPage,
      updatedAt: row.updatedAt as number | null,
    };
  },
});

/** Upsert any subset of the caller's preferences. Unset fields keep defaults. */
export const updateMySettings = mutation({
  args: {
    notifyHighRisk: v.optional(v.boolean()),
    notifyWeekly: v.optional(v.boolean()),
    notifyProduct: v.optional(v.boolean()),
    units: v.optional(v.union(v.literal("metric"), v.literal("imperial"))),
    tempUnit: v.optional(v.union(v.literal("C"), v.literal("F"))),
    mapStyle: v.optional(v.union(v.literal("dark"), v.literal("light"))),
    landingPage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    // Drop keys the caller didn't send so a partial update never clobbers.
    const patch = Object.fromEntries(
      Object.entries(args).filter(([, val]) => val !== undefined),
    );
    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { ...patch, updatedAt: Date.now() });
    } else {
      await ctx.db.insert("userSettings", {
        ...DEFAULT_SETTINGS,
        ...patch,
        userId,
        updatedAt: Date.now(),
      });
    }
  },
});

/**
 * Permanently delete all of the caller's SurgeShield data. The client calls
 * this first, then `user.delete()` on Clerk to remove the identity itself.
 */
export const deleteMyAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);

    const predictions = await ctx.db
      .query("predictions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const row of predictions) await ctx.db.delete(row._id);

    const locations = await ctx.db
      .query("savedLocations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const row of locations) await ctx.db.delete(row._id);

    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (settings) await ctx.db.delete(settings._id);

    const directory = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (directory) await ctx.db.delete(directory._id);

    return { deletedPredictions: predictions.length };
  },
});
