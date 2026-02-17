"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { rag, ADMIN_DOCS_NAMESPACE } from "./rag";

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

export const ingest = action({
  args: {
    storageId: v.id("_storage"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const user = await ctx.runQuery(internal.users.getById, { userId });
    checkAdmin(user);
    const blob = await ctx.storage.get(args.storageId);
    if (!blob) throw new Error("File not found");
    const buf = await blob.arrayBuffer();
    const ext = args.name.split(".").pop()?.toLowerCase();
    let text: string;
    if (ext === "pdf") {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: new Uint8Array(buf) });
      const textResult = await parser.getText();
      await parser.destroy();
      text = textResult.text;
    } else {
      text = new TextDecoder().decode(buf);
    }
    if (!text?.trim()) throw new Error("No text extracted from document");
    await rag.add(ctx, {
      namespace: ADMIN_DOCS_NAMESPACE,
      text,
      key: args.storageId,
    });
    await ctx.runMutation(internal.admin.saveFileRecord, {
      storageId: args.storageId,
      name: args.name,
      uploadedBy: userId as string,
    });
    return { ingested: true };
  },
});
