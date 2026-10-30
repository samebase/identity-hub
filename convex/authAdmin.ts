import { ConvexError, v } from "convex/values";
import { components } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { normalizeEmail } from "./auth";

/**
Creates an account of the console, or sets the password of one. The function is internal, because
the console has no sign-up: only a member of the Convex team can run it, from the Functions page of
the dashboard. Run it there and not in a terminal, so that the password stays out of the shell's
history.
*/
export const createOrUpdatePasswordAccount = internalMutation({
  args: { email: v.string(), password: v.string() },
  returns: v.object({ created: v.boolean(), email: v.string() }),
  handler: async (ctx, args) => {
    const email = normalizeEmail(args.email);
    const existing = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .unique();
    const userId = existing?._id ?? (await ctx.db.insert("users", { email }));
    const result = await ctx.runMutation(components.authPassword.public.setPassword, {
      userId,
      password: args.password,
    });
    if (!result.success) {
      // A throw also takes back the new row. The code names the rule, such as PASSWORD_TOO_SHORT.
      throw new ConvexError(result.userError.error);
    }
    return { created: existing === null, email };
  },
});
