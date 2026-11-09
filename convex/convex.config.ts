import identityBroker from "@samebase/identity-broker/convex.config";
import { defineApp } from "convex/server";
import { v } from "convex/values";

// A push fails while a required variable is missing. The stack (alchemy.run.ts) sets every
// variable here but IDENTITY_BROKER_KEYS, which scripts/init-keys.ts creates once by hand and
// scripts/check-keys.ts checks before each push, and APPS_PAUSED, which is set by hand.
const app = defineApp({
  env: {
    /** The signing key set. */
    IDENTITY_BROKER_KEYS: v.string(),
    /** The issuer URL. Without it, the deployment's own convex.site URL. */
    ISSUER: v.optional(v.string()),
    /** Who may register: `any`, or numeric GitHub owner ids separated by commas (convex/owners.ts). */
    HUB_OWNERS: v.string(),
    /** The name of the sign-in service, on the sign-in page and in each new client's answer. */
    HUB_NAME: v.string(),
    /** The terms and the privacy notice of the sign-in service, linked under the sign-in page. */
    HUB_TERMS_URL: v.string(),
    HUB_PRIVACY_URL: v.string(),
    /** The Google OAuth client of the connector `google`. */
    GOOGLE_CLIENT_ID: v.string(),
    GOOGLE_CLIENT_SECRET: v.string(),
    /**
     * The GitHub OAuth App of the connector `github`. Named with the AUTH_ prefix: GitHub reserves
     * GITHUB_ for its own secrets and variables.
     */
    AUTH_GITHUB_CLIENT_ID: v.string(),
    AUTH_GITHUB_CLIENT_SECRET: v.string(),
    /** `true` pauses every app: no registration, sign-in, or code exchange. */
    APPS_PAUSED: v.optional(v.string()),
    /**
     * The bearer key of `/moderation/*`: clients, counts, blocks, sign-in page exemptions, and
     * connector grants. Unset or empty: every moderation request is refused.
     */
    IDENTITY_HUB_MODERATION_KEY: v.optional(v.string()),
  },
});

app.use(identityBroker);

export default app;
