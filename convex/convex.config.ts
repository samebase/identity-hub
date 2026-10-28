import mail from "@samebase/convex-cloudflare-email-inbox/convex.config.js";
import identityBroker from "@samebase/identity-broker/convex.config";
import { defineApp } from "convex/server";
import { v } from "convex/values";

// A push fails while a required variable is missing. scripts/ensure-keys.ts writes
// IDENTITY_BROKER_KEYS before the first deploy; EMAIL_FROM is set once by hand.
const app = defineApp({
  env: {
    /** The key set and the pairwise salt: `npx identity-broker keys`. */
    IDENTITY_BROKER_KEYS: v.string(),
    /** The issuer URL once a custom domain exists. Without it, the deployment's own convex.site URL. */
    ISSUER: v.optional(v.string()),
    /**
     * Cloudflare Email Sending, for the email code connector. Optional at deploy time so a hub can
     * come up before its sending credentials exist; a code send fails closed until both are set.
     */
    CLOUDFLARE_EMAIL_ACCOUNT_ID: v.optional(v.string()),
    CLOUDFLARE_EMAIL_API_TOKEN: v.optional(v.string()),
    /** The sender of the codes, on a domain verified with Cloudflare Email Sending. */
    EMAIL_FROM: v.string(),
  },
});

app.use(identityBroker);
app.use(mail, {
  env: {
    CLOUDFLARE_EMAIL_ACCOUNT_ID: app.env.CLOUDFLARE_EMAIL_ACCOUNT_ID,
    CLOUDFLARE_EMAIL_API_TOKEN: app.env.CLOUDFLARE_EMAIL_API_TOKEN,
  },
});

export default app;
