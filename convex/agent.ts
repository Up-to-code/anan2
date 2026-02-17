import {
  internalAction,
  internalQuery,
  internalMutation,
} from "./_generated/server";
import { api, internal } from "./_generated/api";
import { v } from "convex/values";

export const getPendingTasks = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_status_nextReminderAt", (q) =>
        q.eq("status", "pending").lte("nextReminderAt", now)
      )
      .collect();
    return tasks.filter((t) => {
      if (t.snoozeUntil && t.snoozeUntil > now) return false;
      return t.nextReminderAt && t.nextReminderAt <= now;
    });
  },
});

export const markNotified = internalMutation({
  args: {
    taskId: v.id("tasks"),
    nextReminderAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, {
      lastNotifiedAt: Date.now(),
      nextReminderAt: args.nextReminderAt,
      snoozeUntil: undefined,
    });
  },
});

export const processPendingTasks = internalAction({
  args: {},
  handler: async (ctx): Promise<{ processed: number }> => {
    const now = Date.now();
    const tasks = await ctx.runQuery(internal.agent.getPendingTasks, {});
    for (const task of tasks) {
      const subscriptions = await ctx.runQuery(
        internal.pushSubscriptions.getByUserId,
        { userId: task.assigneeId || task.userId }
      );
      if (subscriptions.length === 0) continue;
      for (const sub of subscriptions) {
        try {
          await ctx.runAction(api.sendPush.sendPushNotification, {
            subscription: sub,
            title: `Reminder: ${task.title}`,
            body: task.description || "You have a pending task",
          });
        } catch (e) {
          console.error("Push failed:", e);
        }
      }
      await ctx.runMutation(internal.agent.markNotified, {
        taskId: task._id,
        nextReminderAt: now + 60 * 60 * 1000,
      });
    }
    return { processed: tasks.length };
  },
});
