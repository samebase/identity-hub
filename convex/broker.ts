import { defineIdentityBroker, github, google } from "@samebase/identity-broker";
import { components } from "./_generated/api";
import { env } from "./_generated/server";
import { mayRegister, parseOwners } from "./owners";

// The whole hub. Every value that differs between hubs is a deployment variable, which the stack
// (alchemy.run.ts) sets from the repository's GitHub variables and secrets, so this file is the
// same in every copy. `http.ts` mounts the routes, `crons.ts` runs the cleanup, and
// `convex.config.ts` declares the variables.

/**
 * The deployment's own convex.site URL until ISSUER names a custom domain. Every app names the
 * issuer, so ISSUER is set before the first app registers (README, Custom domain).
 */
export const issuer = env.ISSUER ?? env.CONVEX_SITE_URL;

const owners = parseOwners(env.HUB_OWNERS);

export const broker = defineIdentityBroker({
  component: components.identityBroker,
  issuer,
  keys: () => env.IDENTITY_BROKER_KEYS,
  // One Google OAuth client and one GitHub OAuth App, with the callbacks
  // `<issuer>/connectors/google/callback` and `<issuer>/connectors/github/callback`. A user's `sub`
  // is the provider's own id, `google:<id>` or `github:<id>`, the same at every hub. Each sign-in
  // shows the provider's account screen, so one app of this hub never passes a user to another
  // with no click.
  connectors: [
    google({
      clientId: () => env.GOOGLE_CLIENT_ID,
      clientSecret: () => env.GOOGLE_CLIENT_SECRET,
      selectAccount: true,
    }),
    github({
      clientId: () => env.AUTH_GITHUB_CLIENT_ID,
      clientSecret: () => env.AUTH_GITHUB_CLIENT_SECRET,
      selectAccount: true,
    }),
  ],
  // `POST /hub-clients` creates every client; `/moderation/*` answers the holder of the moderation
  // key.
  registration: {
    name: env.HUB_NAME,
    terms: env.HUB_TERMS_URL,
    privacy: env.HUB_PRIVACY_URL,
    moderationKey: () => env.IDENTITY_HUB_MODERATION_KEY,
    policy: (registration) => ({
      // Both connectors for a repository of an allowed owner. Any other gets none, so its
      // registration is refused, unless the moderation API granted its repository a connector.
      connectors: mayRegister(owners, registration.ownerId) ? ["google", "github"] : [],
      resources: [],
      // The emergency brake, set by hand on the deployment: `true` pauses every app.
      paused: env.APPS_PAUSED === "true",
    }),
  },
});

// Administration with `npx convex run --deployment <name> broker:<name>`:
//   listApps, listClients '{"appId":"..."}', deleteClient '{"clientId":"..."}', deleteApp '{"appId":"..."}'
// `crons.ts` runs `cleanup` daily.
export const { deleteApp, listApps, listClients, deleteClient, cleanup } = broker.admin();
