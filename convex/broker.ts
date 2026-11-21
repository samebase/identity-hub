import { github, hubSettings } from "@samebase/identity-broker";
import { convexHub } from "@samebase/identity-broker/convex";
import { moderation } from "@samebase/identity-broker/moderation";
import { Config } from "effect";
import { components } from "./_generated/api";
import { env } from "./_generated/server";
import { parseOwners } from "./owners";

// The whole hub. Every value that differs between hubs is a deployment variable, which the stack
// (alchemy.run.ts) sets from the repository's GitHub variables and secrets, so this file is the
// same in every copy. `http.ts` mounts the routes, `crons.ts` runs the cleanup, and
// `convex.config.ts` declares the variables. The signing keys are IDENTITY_BROKER_KEYS.

export const hub = convexHub(
  components.identityBroker,
  hubSettings({
    // The deployment's own convex.site URL until ISSUER names a custom domain. Every app names the
    // issuer, so ISSUER is set before the first app registers (README, Custom domain).
    issuer: env.ISSUER ?? env.CONVEX_SITE_URL,
    // One Google OAuth client and one GitHub OAuth App, with the callbacks
    // `<issuer>/connectors/google/callback` and `<issuer>/connectors/github/callback`. A user's
    // `sub` is the provider's own id, `google:<id>` or `github:<id>`, the same at every hub. Each
    // sign-in shows the provider's account screen.
    connectors: {
      google: {
        clientId: Config.Redacted("GOOGLE_CLIENT_ID"),
        clientSecret: Config.Redacted("GOOGLE_CLIENT_SECRET"),
      },
      github: {
        clientId: Config.Redacted("AUTH_GITHUB_CLIENT_ID"),
        clientSecret: Config.Redacted("AUTH_GITHUB_CLIENT_SECRET"),
      },
    },
    service: { name: env.HUB_NAME, terms: env.HUB_TERMS_URL, privacy: env.HUB_PRIVACY_URL },
  }),
  // `POST /register` creates every client. A repository of an allowed owner gets both connectors;
  // any other gets none, unless the moderation API granted its repository a connector.
  github(parseOwners(env.HUB_OWNERS), {
    moderation: moderation({ key: Config.Redacted("IDENTITY_HUB_MODERATION_KEY") }),
    // The emergency brake, set by hand on the deployment: only `true` pauses every app.
    paused: Config.String("APPS_PAUSED").pipe(
      Config.map((value) => value === "true"),
      Config.withDefault(false),
    ),
  }),
);

export const cleanup = hub.cleanup;
