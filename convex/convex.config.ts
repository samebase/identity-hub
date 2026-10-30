import auth from "@convex-dev/auth/convex.config";
import password from "@convex-dev/auth/components/password/convex.config";
import alchemyState from "@samebase/alchemy-convex/state/convex.config";
import hosting from "@samebase/convex-hosting/convex.config";
import identityBroker from "@samebase/identity-broker/convex.config";
import { defineApp } from "convex/server";
import { v } from "convex/values";

// A push fails while a required variable is missing. scripts/check-keys.ts checks
// IDENTITY_BROKER_KEYS before each deploy and scripts/init-keys.ts creates it once by hand; the
// stack hands the Google variables to the deployment.
const app = defineApp({
  env: {
    /** The key set and the pairwise salt: `npx identity-broker keys`. */
    IDENTITY_BROKER_KEYS: v.string(),
    /** The session keys of the console: scripts/ensure-convex-auth.ts creates them once. */
    AUTH_PRIVATE_KEY: v.string(),
    AUTH_JWKS: v.string(),
    /** The issuer URL, which the stack sets. Without it, the deployment's own convex.site URL. */
    ISSUER: v.optional(v.string()),
    /**
     * The Google OAuth client of the team, whose redirect URIs include
     * `<issuer>/connectors/google/callback`. The stack hands both to the deployment.
     */
    GOOGLE_CLIENT_ID: v.string(),
    GOOGLE_CLIENT_SECRET: v.string(),
    /**
     * The team's GitHub login OAuth App, which lists `<issuer>/connectors/github/callback` among
     * its redirect URIs. The stack hands both to the deployment.
     * Named with the AUTH_ prefix: GitHub reserves GITHUB_ for its own secrets and variables.
     */
    AUTH_GITHUB_CLIENT_ID: v.string(),
    AUTH_GITHUB_CLIENT_SECRET: v.string(),
  },
});

app.use(identityBroker);
// Without a name, so that this base serves the rows that the seed of the store wrote.
app.use(alchemyState);
// The console of this base: its accounts, and the site that convex/http.ts serves. The core serves
// its key set under /auth, apart from the key set of the hub.
app.use(auth, {
  httpPrefix: "/auth",
  env: { AUTH_PRIVATE_KEY: app.env.AUTH_PRIVATE_KEY, AUTH_JWKS: app.env.AUTH_JWKS },
});
app.use(password);
app.use(hosting);

export default app;
