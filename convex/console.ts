import { ConvexError, v } from "convex/values";
import { components } from "./_generated/api";
import { env, query, type QueryCtx } from "./_generated/server";

/**
Every read of the console needs a session. A read token of `reader:authorize` is an identity too, for
one repository, so the issuer decides: a session has the issuer of the auth component. The account
must still exist: deleting a row of `users` ends the access of its sessions at once.
*/
async function requireSession(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  const userId =
    identity?.issuer === env.CONVEX_SITE_URL ? ctx.db.normalizeId("users", identity.subject) : null;
  if (userId === null || (await ctx.db.get("users", userId)) === null) {
    throw new ConvexError("A session is required.");
  }
}

/** The repository of a stack: `owner/name`, also for a stack in a folder of it. */
const repositoryOf = (stack: string) => stack.split("/").slice(0, 2).join("/");

/**
The stacks of one repository, redacted. `reader.repository` is the read that Samebase serves: secrets
are removed before the reply leaves the component.
*/
const readRepository = (ctx: QueryCtx, repository: string) =>
  ctx.runQuery(components.alchemyState.reader.repository, { repository });

/** Every stack of the team with a summary of its stages. A stack with no run record has no stages. */
export const stacks = query({
  args: {},
  handler: async (ctx) => {
    await requireSession(ctx);
    const names = await ctx.runQuery(components.alchemyState.state.stacks, {});
    const replies = await Promise.all(
      [...new Set(names.map(repositoryOf))].map((repository) => readRepository(ctx, repository)),
    );
    const found = new Map(replies.flatMap((reply) => reply.stacks).map((s) => [s.name, s]));
    return names.map((name) => ({
      name,
      repository: repositoryOf(name),
      stages: (found.get(name)?.stages ?? []).map((stage) => ({
        name: stage.name,
        record: stage.record,
        resources: stage.resources.length,
      })),
    }));
  },
});

/** One stack with its stages, resources, and outputs. Null for a stack with no run record. */
export const stack = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    await requireSession(ctx);
    const reply = await readRepository(ctx, repositoryOf(args.name));
    return reply.stacks.find((stack) => stack.name === args.name) ?? null;
  },
});

/** The apps of the hub with their clients. The hash of a client secret stays on the server. */
export const hub = query({
  args: {},
  handler: async (ctx) => {
    await requireSession(ctx);
    const apps = await ctx.runQuery(components.identityBroker.apps.list, {});
    return await Promise.all(
      apps.map(async (app) => ({
        ...app,
        clients: (
          await ctx.runQuery(components.identityBroker.clients.listByApp, { appId: app.appId })
        ).map(({ clientId, clientName, deploymentType, redirectUri, lastSignInAt }) => ({
          clientId,
          clientName,
          deploymentType,
          redirectUri,
          lastSignInAt,
        })),
      })),
    );
  },
});
