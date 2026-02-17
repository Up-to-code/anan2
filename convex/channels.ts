import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internalQuery } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const CHANNELS = ["snapchat", "tiktok", "instagram"] as const;

export const getMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const userIdStr = userId as string;
    const config = await ctx.db
      .query("userChannels")
      .withIndex("by_userId", (q) => q.eq("userId", userIdStr))
      .first();
    return config?.channels ?? [];
  },
});

export const updateMine = mutation({
  args: {
    channels: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const userIdStr = userId as string;
    const existing = await ctx.db
      .query("userChannels")
      .withIndex("by_userId", (q) => q.eq("userId", userIdStr))
      .first();
    const validChannels = args.channels.filter((c) =>
      CHANNELS.includes(c as (typeof CHANNELS)[number])
    );
    if (existing) {
      await ctx.db.patch(existing._id, { channels: validChannels });
    } else {
      await ctx.db.insert("userChannels", {
        userId: userIdStr,
        channels: validChannels,
      });
    }
    return validChannels;
  },
});

export const getByUserId = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("userChannels")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    return config?.channels ?? [];
  },
});
