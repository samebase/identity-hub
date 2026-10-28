import { github, google, type Connector } from "@samebase/identity-broker";
import { env } from "./_generated/server";

/**
 * The connectors this hub offers. Add a provider by appending its wrapper, with the credentials
 * read from the deployment's env, and register `<issuer>/connectors/<name>/callback` with it:
 *
 *   github({ clientId: () => env.AUTH_GITHUB_CLIENT_ID, clientSecret: () => env.AUTH_GITHUB_CLIENT_SECRET })
 *
 * Any other OAuth 2.0 or OpenID Connect provider is an `oauth` or `oidc` connector with its
 * endpoints copied in.
 */
// Google only: the team signs in with Google everywhere, and an email code connector would be the
// one public endpoint that sends mail, with the abuse controls that needs. The broker's `email()`
// wrapper is one line away when a hub wants it.
export const connectors: Connector[] = [
  google({ clientId: () => env.GOOGLE_CLIENT_ID, clientSecret: () => env.GOOGLE_CLIENT_SECRET }),
  // The team's GitHub login OAuth App, which lists <issuer>/connectors/github/callback among its
  // redirect URIs (an OAuth App takes up to ten), so no second app is needed.
  github({
    clientId: () => env.AUTH_GITHUB_CLIENT_ID,
    clientSecret: () => env.AUTH_GITHUB_CLIENT_SECRET,
  }),
];
