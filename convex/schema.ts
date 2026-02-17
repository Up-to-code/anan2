import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const schema = defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    role: v.optional(v.union(v.literal("admin"), v.literal("employee"))),
  }).index("email", ["email"]),

  userChannels: defineTable({
    userId: v.string(),
    channels: v.array(v.string()),
  }).index("by_userId", ["userId"]),

  tasks: defineTable({
    userId: v.string(),
    assigneeId: v.optional(v.string()),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("completed")),
    dueAt: v.number(),
    createdAt: v.number(),
    lastNotifiedAt: v.optional(v.number()),
    nextReminderAt: v.optional(v.number()),
    snoozeUntil: v.optional(v.number()),
    reminderStep: v.optional(v.number()),
    createdBy: v.optional(v.string()),
    generatedContent: v.optional(v.any()),
  })
    .index("by_userId", ["userId"])
    .index("by_assigneeId", ["assigneeId"])
    .index("by_status_nextReminderAt", ["status", "nextReminderAt"]),

  pushSubscriptions: defineTable({
    userId: v.string(),
    subscription: v.any(),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  adminSettings: defineTable({
    key: v.string(),
    value: v.any(),
  }).index("by_key", ["key"]),

  files: defineTable({
    storageId: v.id("_storage"),
    name: v.string(),
    uploadedAt: v.number(),
    uploadedBy: v.string(),
  }).index("by_uploadedBy", ["uploadedBy"]),
});

export default schema;
