import { v } from "convex/values";
import { mutation, query, action, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

function checkAdmin(user: { role?: string; email?: string } | null): void {
  if (!user) throw new Error("User not found");
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const isAdmin =
    user.role === "admin" ||
    (user.email && adminEmails.includes(user.email.toLowerCase()));
  if (!isAdmin) throw new Error("Admin access required");
}

export const listAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const user = await ctx.db.get(userId);
    checkAdmin(user);
    const channels = await ctx.db.query("userChannels").collect();
    const allUsers = await ctx.db.query("users").collect();
    const subs = await ctx.db.query("pushSubscriptions").collect();
    const userIdsWithSubs = new Set(subs.map((s) => s.userId));
    return allUsers.map((u) => ({
      userId: u._id as string,
      email: u.email ?? undefined,
      name: u.name ?? undefined,
      channels: channels.find((c) => c.userId === (u._id as string))?.channels ?? [],
      hasPushSubscription: userIdsWithSubs.has(u._id as string),
    }));
  },
});

export const sendTestNotification = action({
  args: { userId: v.string() },
  handler: async (ctx, args): Promise<{ sent: number }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const user = await ctx.runQuery(internal.users.getById, { userId });
    checkAdmin(user);
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
        url: "/",
      });
    }
    return { sent: subs.length };
  },
});

export const createTask = mutation({
  args: {
    assigneeId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    dueAt: v.number(),
  },
  handler: async (ctx, args) => {
    const adminId = await getAuthUserId(ctx);
    if (!adminId) throw new Error("Not authenticated");
    const adminUser = await ctx.db.get(adminId);
    checkAdmin(adminUser);
    const now = Date.now();
    return await ctx.db.insert("tasks", {
      userId: args.assigneeId,
      assigneeId: args.assigneeId,
      title: args.title,
      description: args.description,
      status: "pending",
      dueAt: args.dueAt,
      createdAt: now,
      nextReminderAt: args.dueAt,
      createdBy: adminId as string,
      reminderStep: 0,
    });
  },
});

export const updateUserChannels = mutation({
  args: {
    userId: v.string(),
    channels: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const adminId = await getAuthUserId(ctx);
    if (!adminId) throw new Error("Not authenticated");
    const adminUser = await ctx.db.get(adminId);
    checkAdmin(adminUser);
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

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const user = await ctx.db.get(userId);
    checkAdmin(user);
    return await ctx.storage.generateUploadUrl();
  },
});

export const listDocuments = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const user = await ctx.db.get(userId);
    checkAdmin(user);
    return await ctx.db.query("files").collect();
  },
});

export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const user = await ctx.db.get(userId);
    checkAdmin(user);
    const settings = await ctx.db.query("adminSettings").collect();
    const map: Record<string, unknown> = {};
    for (const s of settings) map[s.key] = s.value;
    return map;
  },
});

export const updateSettings = mutation({
  args: {
    dailyPostTime: v.optional(v.string()),
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const user = await ctx.db.get(userId);
    checkAdmin(user);
    const keys = ["dailyPostTime", "timezone"] as const;
    for (const key of keys) {
      const value = args[key];
      if (value !== undefined) {
        const existing = await ctx.db
          .query("adminSettings")
          .withIndex("by_key", (q) => q.eq("key", key))
          .first();
        if (existing) {
          await ctx.db.patch(existing._id, { value });
        } else {
          await ctx.db.insert("adminSettings", { key, value });
        }
      }
    }
    return true;
  },
});

export const saveFileRecord = internalMutation({
  args: {
    storageId: v.id("_storage"),
    name: v.string(),
    uploadedBy: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("files", {
      storageId: args.storageId,
      name: args.name,
      uploadedAt: Date.now(),
      uploadedBy: args.uploadedBy,
    });
  },
});
