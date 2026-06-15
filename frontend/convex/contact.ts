import { mutation } from "./_generated/server";
import { v } from "convex/values";

const MAX_MESSAGE = 5000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Public contact-form submission — no auth required (the contact page is
 * unauthenticated). Validates server-side and persists the message so the
 * form does something real rather than faking a success state.
 */
export const submitContactMessage = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    organization: v.optional(v.string()),
    topic: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const firstName = args.firstName.trim();
    const lastName = args.lastName.trim();
    const email = args.email.trim();
    const message = args.message.trim();

    if (!firstName || !lastName) throw new Error("Please enter your name.");
    if (!EMAIL_RE.test(email)) throw new Error("Please enter a valid email.");
    if (!message) throw new Error("Please enter a message.");
    if (message.length > MAX_MESSAGE) throw new Error("Message is too long.");

    await ctx.db.insert("contactMessages", {
      firstName,
      lastName,
      email,
      organization: args.organization?.trim() || undefined,
      topic: args.topic,
      message,
      createdAt: Date.now(),
    });
  },
});
