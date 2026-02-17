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

const REMINDER_STEPS_MS = [15, 30, 60, 120].map((m) => m * 60 * 1000);

export const markNotified = internalMutation({
  args: {
    taskId: v.id("tasks"),
    nextReminderAt: v.number(),
    reminderStep: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, {
      lastNotifiedAt: Date.now(),
      nextReminderAt: args.nextReminderAt,
      reminderStep: args.reminderStep,
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
            url: `/task/${task._id}`,
          });
        } catch (e) {
          console.error("Push failed:", e);
        }
      }
      const currentStep = task.reminderStep ?? 0;
      const nextStep = Math.min(currentStep + 1, REMINDER_STEPS_MS.length - 1);
      const nextReminderAt = now + REMINDER_STEPS_MS[nextStep];
      await ctx.runMutation(internal.agent.markNotified, {
        taskId: task._id,
        nextReminderAt,
        reminderStep: nextStep,
      });
    }
    return { processed: tasks.length };
  },
});

export const getAdminSettings = internalQuery({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("adminSettings").collect();
    const map: Record<string, unknown> = {};
    for (const s of settings) map[s.key] = s.value;
    return map;
  },
});

export const getUsersWithChannels = internalQuery({
  args: {},
  handler: async (ctx) => {
    const channels = await ctx.db.query("userChannels").collect();
    const subs = await ctx.db.query("pushSubscriptions").collect();
    const userIdsWithSubs = new Set(subs.map((s) => s.userId));
    return channels
      .filter((c) => c.channels.length > 0 && userIdsWithSubs.has(c.userId))
      .map((c) => ({ userId: c.userId, channels: c.channels }));
  },
});

export const createTask = internalMutation({
  args: {
    userId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    dueAt: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("tasks", {
      userId: args.userId,
      assigneeId: args.userId,
      title: args.title,
      description: args.description,
      status: "pending",
      dueAt: args.dueAt,
      createdAt: now,
      nextReminderAt: args.dueAt,
      reminderStep: 0,
    });
  },
});

function isInTimeWindow(
  now: Date,
  targetTime: string,
  timezone: string
): boolean {
  try {
    const [targetHours, targetMinutes] = targetTime.split(":").map(Number);
    const targetTotal = targetHours * 60 + targetMinutes;
    const str = now.toLocaleString("en-US", { timeZone: timezone || "UTC" });
    const match = str.match(/(\d+):(\d+)/);
    if (!match) return false;
    const [, h, m] = match;
    const currentTotal = parseInt(h!, 10) * 60 + parseInt(m!, 10);
    return currentTotal >= targetTotal && currentTotal < targetTotal + 15;
  } catch {
    return false;
  }
}

export const runDailyWorkflow = internalAction({
  args: {},
  handler: async (ctx): Promise<{ created: number }> => {
    const settings = await ctx.runQuery(internal.agent.getAdminSettings, {});
    const dailyPostTime = (settings.dailyPostTime as string) || "09:00";
    const timezone = (settings.timezone as string) || "America/New_York";
    const now = new Date();
    if (!isInTimeWindow(now, dailyPostTime, timezone)) {
      return { created: 0 };
    }
    const usersWithChannels = await ctx.runQuery(
      internal.agent.getUsersWithChannels,
      {}
    );
    let created = 0;
    const CHANNELS = ["snapchat", "tiktok", "instagram"] as const;
    const channelLabels: Record<string, string> = {
      snapchat: "Snapchat",
      tiktok: "TikTok",
      instagram: "Instagram",
    };
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);
    const dueAt = endOfToday.getTime();
    for (const { userId, channels } of usersWithChannels) {
      for (const ch of channels) {
        if (CHANNELS.includes(ch as (typeof CHANNELS)[number])) {
          const taskId = await ctx.runMutation(internal.agent.createTask, {
            userId,
            title: `Post to ${channelLabels[ch] ?? ch} today`,
            description: "Daily social post - generate content in task detail",
            dueAt,
          });
          ctx.scheduler.runAfter(0, api.generateContent.generateContentForChannels, {
            taskId,
            concept: "daily social post",
          });
          created++;
        }
      }
    }
    return { created };
  },
});
