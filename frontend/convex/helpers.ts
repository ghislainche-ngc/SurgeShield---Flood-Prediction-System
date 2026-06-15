import { QueryCtx, MutationCtx } from "./_generated/server";

type Ctx = QueryCtx | MutationCtx;

/** Returns the signed-in Clerk user id, or throws if unauthenticated. */
export async function requireUser(ctx: Ctx): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated.");
  return identity.subject;
}

/**
 * Returns the user id only if they have role "admin", else throws. The role
 * comes from the Clerk "convex" JWT template, which must include
 * `"metadata": "{{user.public_metadata}}"` for this claim to be present.
 */
export async function requireAdmin(ctx: Ctx): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated.");
  const metadata = (identity as Record<string, unknown>).metadata as
    | { role?: string }
    | undefined;
  if (metadata?.role !== "admin") throw new Error("Admin access required.");
  return identity.subject;
}

/**
 * Records the signed-in user in the `users` directory (insert or refresh),
 * capturing whatever identity claims the JWT carries (name/email/role), and
 * returns their id. Call from mutations that represent activity so the admin
 * overview has real names and last-active times. Degrades gracefully when a
 * claim is absent — name/email simply stay undefined and the UI falls back.
 */
export async function touchUser(ctx: MutationCtx): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated.");
  const userId = identity.subject;
  const metadata = (identity as Record<string, unknown>).metadata as
    | { role?: string }
    | undefined;
  const existing = await ctx.db
    .query("users")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
  const now = Date.now();
  if (existing) {
    await ctx.db.patch(existing._id, {
      name: identity.name ?? existing.name,
      email: identity.email ?? existing.email,
      role: metadata?.role ?? existing.role,
      lastActiveAt: now,
    });
  } else {
    await ctx.db.insert("users", {
      userId,
      name: identity.name,
      email: identity.email,
      role: metadata?.role,
      firstSeen: now,
      lastActiveAt: now,
    });
  }
  return userId;
}
