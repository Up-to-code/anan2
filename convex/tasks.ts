import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getById = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const userIdStr = userId as string;
    const task = await ctx.db.get(args.taskId);
    if (!task) return null;
    if (task.userId !== userIdStr && task.assigneeId !== userIdStr) return null;
    return task;
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const userIdStr = userId as string;
    const tasks = await ctx.db
      .query("tasks")
      .filter((q) =>
        q.or(
          q.eq(q.field("userId"), userIdStr),
          q.eq(q.field("assigneeId"), userIdStr)
        )
      )
      .order("desc")
      .collect();
    return tasks;
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    dueAt: v.number(),
    assigneeId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const userIdStr = userId as string;
    const user = await ctx.db.get(userId);
    const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
    const isAdmin = user?.role === "admin" || (user?.email && adminEmails.includes(user.email.toLowerCase()));
    if (!isAdmin) throw new Error("Only admins can create tasks. Use the Admin panel.");
    const now = Date.now();
    const taskId = await ctx.db.insert("tasks", {
      userId: args.assigneeId ?? userIdStr,
      assigneeId: args.assigneeId ?? userIdStr,
      title: args.title,
      description: args.description,
      status: "pending",
      dueAt: args.dueAt,
      createdAt: now,
      nextReminderAt: args.dueAt,
      reminderStep: 0,
    });
    return taskId;
  },
});

export const update = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    dueAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const userIdStr = userId as string;
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    if (task.userId !== userIdStr && task.assigneeId !== userIdStr) {
      throw new Error("Not authorized to update this task");
    }
    const updates: Record<string, unknown> = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.dueAt !== undefined) updates.dueAt = args.dueAt;
    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.taskId, updates);
    }
    return args.taskId;
  },
});

export const complete = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const userIdStr = userId as string;
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    if (task.userId !== userIdStr && task.assigneeId !== userIdStr) {
      throw new Error("Not authorized");
    }
    await ctx.db.patch(args.taskId, { status: "completed" });
    return args.taskId;
  },
});

export const remove = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const userIdStr = userId as string;
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    if (task.userId !== userIdStr && task.assigneeId !== userIdStr) {
      throw new Error("Not authorized");
    }
    await ctx.db.delete(args.taskId);
    return args.taskId;
  },
});

export const snooze = mutation({
  args: {
    taskId: v.id("tasks"),
    minutes: v.union(
      v.literal(15),
      v.literal(30),
      v.literal(60),
      v.literal(120)
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const userIdStr = userId as string;
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    if (task.userId !== userIdStr && task.assigneeId !== userIdStr) {
      throw new Error("Not authorized");
    }
    const snoozeUntil = Date.now() + args.minutes * 60 * 1000;
    await ctx.db.patch(args.taskId, {
      snoozeUntil,
      nextReminderAt: snoozeUntil,
    });
    return args.taskId;
  },
});
