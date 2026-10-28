import identityBroker from "@samebase/identity-broker/convex.config";
import { defineApp } from "convex/server";
import { v } from "convex/values";

// A push fails while a required variable is missing. scripts/ensure-keys.ts writes
// IDENTITY_BROKER_KEYS before the first deploy; the email variables are set once by hand.
const app = defineApp({
  env: {
    /** The key set and the pairwise salt: `npx identity-broker keys`. */
    IDENTITY_BROKER_KEYS: v.string(),
    /** The issuer URL once a custom domain exists. Without it, the deployment's own convex.site URL. */
    ISSUER: v.optional(v.string()),
    /**
     * Cloudflare Email Sending, for the email code connector: the account and a token with the
     * Email Sending permission on it. Required, because email is the connector every hub has.
     */
    CLOUDFLARE_EMAIL_ACCOUNT_ID: v.string(),
    CLOUDFLARE_EMAIL_API_TOKEN: v.string(),
    /** The sender of the codes, on a domain verified with Cloudflare Email Sending. */
    EMAIL_FROM: v.string(),
  },
});

app.use(identityBroker);

export default app;
