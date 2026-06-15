import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./helpers";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Start-of-today timestamp (server clock, UTC). */
function startOfTodayMs(): number {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}

/** Admin: system-wide totals for the overview stat cards. */
export const getSystemOverview = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const predictions = await ctx.db.query("predictions").collect();
    const directory = await ctx.db.query("users").collect();

    // Distinct users = directory rows ∪ any userIds seen in predictions
    // (covers predictions saved before the directory existed).
    const userIds = new Set<string>(directory.map((u) => u.userId));
    for (const p of predictions) userIds.add(p.userId);

    const today = startOfTodayMs();
    const weekAgo = Date.now() - 7 * DAY_MS;
    const floodDetectedCount = predictions.filter((p) => p.result).length;

    return {
      totalPredictions: predictions.length,
      totalUsers: userIds.size,
      newUsersThisWeek: directory.filter((u) => u.firstSeen >= weekAgo).length,
      predictionsThisWeek: predictions.filter((p) => p.createdAt >= weekAgo)
        .length,
      predictionsToday: predictions.filter((p) => p.createdAt >= today).length,
      floodDetectedCount,
      floodDetectionRate:
        predictions.length === 0 ? 0 : floodDetectedCount / predictions.length,
    };
  },
});

/** Admin: per-user activity rollup for the Registered Users table. */
export const getUserSummaries = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const predictions = await ctx.db.query("predictions").collect();
    const directory = await ctx.db.query("users").collect();
    const dirByUser = new Map(directory.map((u) => [u.userId, u]));

    type Agg = { count: number; floods: number; lastActive: number };
    const agg = new Map<string, Agg>();
    for (const p of predictions) {
      const a = agg.get(p.userId) ?? { count: 0, floods: 0, lastActive: 0 };
      a.count += 1;
      if (p.result) a.floods += 1;
      if (p.createdAt > a.lastActive) a.lastActive = p.createdAt;
      agg.set(p.userId, a);
    }
    // Include directory users who haven't made a prediction yet.
    for (const u of directory) {
      if (!agg.has(u.userId)) {
        agg.set(u.userId, { count: 0, floods: 0, lastActive: u.lastActiveAt });
      }
    }

    return [...agg.entries()]
      .map(([userId, a]) => {
        const u = dirByUser.get(userId);
        return {
          userId,
          name: u?.name,
          email: u?.email,
          role: u?.role === "admin" ? "admin" : "user",
          predictionCount: a.count,
          floodCount: a.floods,
          lastActive: Math.max(a.lastActive, u?.lastActiveAt ?? 0),
        };
      })
      .sort((x, y) => y.lastActive - x.lastActive);
  },
});

/** Admin: recent prediction activity across all users, with user names. */
export const getActivityFeed = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    await requireAdmin(ctx);
    const rows = await ctx.db
      .query("predictions")
      .withIndex("by_createdAt")
      .order("desc")
      .take(limit ?? 12);
    const directory = await ctx.db.query("users").collect();
    const nameByUser = new Map(
      directory.map((u) => [u.userId, u.name ?? u.email]),
    );
    return rows.map((r) => ({
      id: r._id,
      userName: nameByUser.get(r.userId) ?? "A user",
      riskLevel: r.riskLevel,
      probability: r.probability,
      result: r.result,
      locationName: r.locationName,
      createdAt: r.createdAt,
    }));
  },
});

/**
 * Admin: daily prediction counts for the last 30 days (oldest → newest),
 * split into all predictions and high/critical-risk ones. Derived from real
 * Convex data — these are activity counts, not model-performance metrics.
 */
export const getPredictionTrends = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, { days }) => {
    await requireAdmin(ctx);
    const span = days ?? 30;
    const today = startOfTodayMs();
    const start = today - (span - 1) * DAY_MS;

    const recent = await ctx.db
      .query("predictions")
      .withIndex("by_createdAt", (q) => q.gte("createdAt", start))
      .collect();

    const buckets = Array.from({ length: span }, (_, i) => ({
      date: start + i * DAY_MS,
      count: 0,
      highCount: 0,
    }));
    for (const p of recent) {
      const idx = Math.floor((p.createdAt - start) / DAY_MS);
      if (idx < 0 || idx >= span) continue;
      buckets[idx].count += 1;
      if (p.riskLevel === "High" || p.riskLevel === "Critical") {
        buckets[idx].highCount += 1;
      }
    }
    return buckets;
  },
});
