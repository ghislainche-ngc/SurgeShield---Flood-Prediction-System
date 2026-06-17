import { mutation } from "./_generated/server";
import { touchUser } from "./helpers";

/**
 * Presence heartbeat. Upserts the signed-in user into the directory and
 * refreshes lastActiveAt, so the admin overview lists everyone who has used the
 * app (not just those who saved a prediction) and shows accurate online status.
 * Called from the client while authenticated (on load + every minute).
 */
export const recordPresence = mutation({
  args: {},
  handler: async (ctx) => {
    await touchUser(ctx);
  },
});
