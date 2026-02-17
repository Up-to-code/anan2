"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";

export const sendPushNotification = action({
  args: {
    subscription: v.any(),
    title: v.string(),
    body: v.string(),
  },
  handler: async (_ctx, args) => {
    const webpush = await import("web-push");
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    if (!publicKey || !privateKey) {
      throw new Error("VAPID keys not configured");
    }
    webpush.setVapidDetails(
      "mailto:support@example.com",
      publicKey,
      privateKey
    );
    await webpush.sendNotification(
      args.subscription,
      JSON.stringify({
        title: args.title,
        body: args.body,
      }),
      {
        TTL: 86400,
      }
    );
    return { success: true };
  },
});
