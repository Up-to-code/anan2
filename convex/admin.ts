import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api, internal } from "./_generated/api";

async function requireAdmin(ctx: { auth: { getUserIdentity: () => Promise<any> } }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  const userId = identity.tokenIdentifier;
  return userId;
}

export const listAllUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const subs = await ctx.db.query("pushSubscriptions").collect();
    const userIds = [...new Set(subs.map((s) => s.userId))];
    const channels = await ctx.db.query("userChannels").collect();
    return userIds.map((userId) => ({
      userId,
      channels: channels.find((c) => c.userId === userId)?.channels ?? [],
    }));
  },
});

export const sendTestNotification = action({
  args: { userId: v.string() },
  handler: async (ctx, args): Promise<{ sent: number }> => {
    await requireAdmin(ctx);
    const subs: unknown[] = await ctx.runQuery(
      internal.pushSubscriptions.getByUserId,
      { userId: args.userId }
    );
    if (subs.length === 0) throw new Error("No push subscription for user");
    for (const sub of subs) {
      await ctx.runAction(api.sendPush.sendPushNotification, {
        subscription: sub,
        title: "Test Notification",
        body: "This is a test notification from the admin panel.",
      });
    }
    return { sent: subs.length };
  },
});

export const updateUserChannels = mutation({
  args: {
    userId: v.string(),
    channels: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db
      .query("userChannels")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { channels: args.channels });
    } else {
      await ctx.db.insert("userChannels", {
        userId: args.userId,
        channels: args.channels,
      });
    }
    return true;
  },
});
