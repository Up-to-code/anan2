import { v } from "convex/values";
import {
  action,
  internalQuery,
  internalMutation,
} from "./_generated/server";
import { internal } from "./_generated/api";

export const getTask = internalQuery({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.taskId);
  },
});

export const saveContent = internalMutation({
  args: {
    taskId: v.id("tasks"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, {
      generatedContent: args.content,
    });
  },
});

export const generateContentForChannels = action({
  args: {
    taskId: v.id("tasks"),
    concept: v.string(),
  },
  handler: async (ctx, args) => {
    const task = await ctx.runQuery(internal.generateContent.getTask, {
      taskId: args.taskId,
    });
    if (!task) throw new Error("Task not found");
    const userId = task.userId;
    const userChannels = await ctx.runQuery(
      internal.channels.getByUserId,
      { userId }
    );
    if (userChannels.length === 0) {
      return { generated: false, message: "No channels configured" };
    }
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");
    const model = "meta-llama/llama-3.2-3b-instruct:free";
    const prompt = `Generate platform-tailored content for ${userChannels.join(", ")}. Concept: ${args.concept}. For each platform, provide a short caption (1-2 sentences) optimized for that platform's style.`;
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenRouter error: ${err}`);
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content =
      data.choices?.[0]?.message?.content || "Could not generate content";
    await ctx.runMutation(internal.generateContent.saveContent, {
      taskId: args.taskId,
      content,
    });
    return { generated: true, content };
  },
});
