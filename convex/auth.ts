import { setupConvexAuth } from "@convex-dev/auth/server";
import { createFunctionHandle } from "convex/server";
import { type Infer, v } from "convex/values";
import { components, internal } from "./_generated/api";
import { env, internalMutation, mutation } from "./_generated/server";

const { literal, number, object, string, union } = v;

const auth = setupConvexAuth({ component: components.auth });
export const { signOut, refreshSession } = auth;

const PROVIDER = "password";
const FAILED = { status: "error", userError: { error: "INVALID_CREDENTIALS" } } as const;

const vTokens = object({
  accessToken: string(),
  accessTokenExpiresAt: number(),
  refreshToken: string(),
  refreshTokenExpiresAt: number(),
  userId: string(),
});

/** The form of an email in the table `users`. */
export const normalizeEmail = (email: string) => email.trim().toLowerCase();

/**
The core calls this the first time a user signs in. The password check has already found the user,
so this links the core account to it and creates nothing.
*/
export const linkExistingUser = internalMutation({
  args: {
    provider: object({
      name: literal(PROVIDER),
      accountId: string(),
      profile: object({ userId: v.id("users") }),
    }),
  },
  returns: v.id("users"),
  handler: async (_ctx, args) => args.provider.profile.userId,
});

/**
Signs in to an existing account. There is no sign-up: `authAdmin` creates accounts. A failure
returns a result instead of throwing, so the password component keeps the attempt in its limit of
five attempts, then one per minute, for each account. Every failure gets the same answer, also the
rate limit, which only an account that exists can reach: it would tell a caller that the email has
an account.
*/
export const signInWithPassword = mutation({
  args: { email: string(), password: string() },
  returns: union(
    object({ status: literal("complete"), tokens: vTokens }),
    object({
      status: literal("error"),
      userError: object({ error: literal("INVALID_CREDENTIALS") }),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", normalizeEmail(args.email)))
      .unique();
    if (user === null) {
      return FAILED;
    }
    const verification = await ctx.runMutation(components.authPassword.public.verifyPassword, {
      userId: user._id,
      password: args.password,
    });
    if (!verification.success) {
      return FAILED;
    }
    const claims = {
      providerName: PROVIDER,
      providerAccountId: user._id,
      profile: { userId: user._id },
    };
    const issuer = env.CONVEX_SITE_URL;
    const linkedUserId = await ctx.runQuery(components.auth.public.getUserIdByAccount, {
      provider: PROVIDER,
      providerAccountId: user._id,
    });
    // Annotated: the type of `internal` contains this module, so TypeScript cannot infer it.
    const tokens: Infer<typeof vTokens> =
      linkedUserId === null
        ? await ctx.runMutation(components.auth.public.signUp, {
            claims,
            createUserHandle: await createFunctionHandle(internal.auth.linkExistingUser),
            issuer,
          })
        : await ctx.runMutation(components.auth.public.signIn, { claims, issuer });
    return { status: "complete" as const, tokens };
  },
});
