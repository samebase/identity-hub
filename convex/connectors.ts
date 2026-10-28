import { email, type Connector } from "@samebase/identity-broker";
import { internal } from "./_generated/api";

/**
 * The connectors this hub offers. Add a provider by appending its wrapper, with the credentials
 * read from the deployment's env, and register `<issuer>/connectors/<name>/callback` with it:
 *
 *   github({ clientId: () => env.GITHUB_CLIENT_ID, clientSecret: () => env.GITHUB_CLIENT_SECRET })
 *   google({ clientId: () => env.GOOGLE_CLIENT_ID, clientSecret: () => env.GOOGLE_CLIENT_SECRET })
 *
 * Any other OAuth 2.0 or OpenID Connect provider is an `oauth` or `oidc` connector with its
 * endpoints copied in.
 */
export const connectors: Connector[] = [email({ send: internal.email.sendCode })];
