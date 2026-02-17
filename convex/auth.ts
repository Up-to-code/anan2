import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { DataModel } from "./_generated/dataModel";

const adminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function isAdmin(email: string | undefined): boolean {
  if (!email) return false;
  return adminEmails.includes(email.trim().toLowerCase());
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password<DataModel>({
      profile(params) {
        const email = (params.email as string) ?? "";
        return {
          email,
          name: (params.name as string) ?? undefined,
          role: isAdmin(email) ? ("admin" as const) : ("employee" as const),
        };
      },
    }),
  ],
});
