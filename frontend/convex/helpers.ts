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
