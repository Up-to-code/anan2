import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { internalQuery } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const save = mutation({
  args: {
    subscription: v.any(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const userIdStr = userId as string;
    const now = Date.now();
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", userIdStr))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        subscription: args.subscription,
        createdAt: now,
      });
    } else {
      await ctx.db.insert("pushSubscriptions", {
        userId: userIdStr,
        subscription: args.subscription,
        createdAt: now,
      });
    }
    return true;
  },
});

export const getByUserId = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const subs = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    return subs.map((s) => s.subscription);
  },
});
