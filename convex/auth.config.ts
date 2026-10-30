import { authConfig } from "@samebase/alchemy-convex/state/auth.config";
import { env } from "./_generated/server";

// Two issuers. The deployment's own key signs the read tokens of `reader:authorize`, and the auth
// component signs the sessions of the console for CONVEX_SITE_URL. convex/console.ts accepts only
// the second, and `reader:repository` accepts only the first.
export default {
  providers: [
    ...authConfig(env.CONVEX_CLOUD_URL).providers,
    {
      type: "customJwt" as const,
      applicationID: "convex",
      issuer: env.CONVEX_SITE_URL,
      jwks: `${env.CONVEX_SITE_URL}/auth/.well-known/jwks.json`,
      algorithm: "RS256" as const,
    },
  ],
};
